// Full-screen camerascanner met de BarcodeDetector-API (Chrome op Android). Geen extra library.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { nl } from '../../content/nl';

const t = nl.scan;
const WANTED_FORMATS = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix', 'upc_a'];
const DETECT_EVERY_MS = 200;

// BarcodeDetector zit (nog) niet in lib.dom.
interface DetectedBarcode {
  rawValue: string;
  format: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (opts?: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

async function createDetector(): Promise<BarcodeDetectorLike> {
  const Ctor = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector;
  const supported = (await Ctor.getSupportedFormats?.().catch(() => [])) ?? [];
  const formats = WANTED_FORMATS.filter((f) => supported.includes(f));
  return formats.length ? new Ctor({ formats }) : new Ctor();
}

interface Props {
  onDetect: (code: string, format: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let stopped = false;

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped) return stream.getTracks().forEach((tr) => tr.stop());
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        const detector = await createDetector();
        setReady(true);
        const tick = async () => {
          if (stopped) return;
          try {
            if (video.readyState >= 2) {
              const [hit] = await detector.detect(video);
              if (hit?.rawValue && !stopped) {
                stopped = true;
                navigator.vibrate?.(60);
                onDetectRef.current(hit.rawValue.trim(), hit.format);
                return;
              }
            }
          } catch {
            // frame niet leesbaar; volgende proberen
          }
          timer = window.setTimeout(() => void tick(), DETECT_EVERY_MS);
        };
        void tick();
      } catch (err) {
        const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
        setError(denied ? t.denied : t.noCamera);
      }
    })();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={t.title} className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center gap-2 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <h2 className="flex-1 text-lg font-bold">{t.title}</h2>
        <button type="button" onClick={onClose} aria-label={t.close} className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white active:bg-white/10">
          <Icon name="x" className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        {!error && (
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 aspect-square w-2/3 max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-3xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          />
        )}
      </div>
      <p role="status" className="px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4 text-center text-sm">
        {error ?? (ready ? t.hint : t.starting)}
      </p>
    </div>
  );
}
