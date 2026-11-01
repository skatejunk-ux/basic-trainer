import { describe, expect, it } from 'vitest';
import { encodeQr, formatBits, numRawDataModules } from './qr';

describe('qr', () => {
  it('formaatbits kloppen met de tabel uit de standaard', () => {
    // ISO/IEC 18004 bijlage C: niveau L (01) masker 0 → 111011111000100, M (00) masker 0 → 101010000010010
    expect(formatBits(1, 0)).toBe(0b111011111000100);
    expect(formatBits(0, 0)).toBe(0b101010000010010);
    expect(formatBits(0, 5)).toBe(0b100000011001110);
  });

  it('aantal datamodules per versie', () => {
    expect(numRawDataModules(1)).toBe(208);
    expect(numRawDataModules(4)).toBe(807);
    expect(numRawDataModules(7)).toBe(1568);
  });

  it('Basic-Fit-link past in versie 4 (33×33) met finderpatronen in de hoeken', () => {
    const qr = encodeQr('https://member.basic-fit.com/friends/nl-NL/join/4HF7N9RG');
    expect(qr.version).toBe(4);
    expect(qr.size).toBe(33);
    for (const [ox, oy] of [
      [0, 0],
      [26, 0],
      [0, 26],
    ]) {
      // Buitenrand en kern donker, ring ertussen licht
      expect(qr.modules[oy][ox]).toBe(true);
      expect(qr.modules[oy + 6][ox + 6]).toBe(true);
      expect(qr.modules[oy + 1][ox + 1]).toBe(false);
      expect(qr.modules[oy + 3][ox + 3]).toBe(true);
    }
    expect(qr.modules[qr.size - 8][8]).toBe(true); // donkere module
  });
});

// ---------- Onafhankelijke decodeercontrole ----------
// Leest de matrix terug zoals een scanner dat doet (eigen implementatie van route, syndromen en parsing),
// zodat fouten in de generator niet tegen zichzelf wegvallen.
function gfExp(): number[] {
  const exp: number[] = [];
  let v = 1;
  for (let i = 0; i < 255; i++) {
    exp.push(v);
    v <<= 1;
    if (v & 0x100) v ^= 0x11d;
  }
  return exp;
}
const EXP = gfExp();
const LOG = new Array<number>(256).fill(0);
EXP.forEach((v, i) => (LOG[v] = i));
const mul = (a: number, b: number) => (a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0);

function decode(modules: boolean[][]): string {
  const size = modules.length;
  const version = (size - 17) / 4;
  // Formaatbits, kopie 1 (rond linksboven), van bit 14 naar 0
  const pos1: [number, number][] = [
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [7, 8],
    [8, 8],
    [8, 7],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
  ]; // [x, y] voor bits 14..0
  let fmt = 0;
  for (const [x, y] of pos1) fmt = (fmt << 1) | (modules[y][x] ? 1 : 0);
  // Kopie 2: bits 14..8 onder links (x=8), 7..0 rechtsboven (y=8)
  let fmt2 = 0;
  for (let i = 0; i < 7; i++) fmt2 = (fmt2 << 1) | (modules[size - 1 - i][8] ? 1 : 0);
  for (let i = 0; i < 8; i++) fmt2 = (fmt2 << 1) | (modules[8][size - 8 + i] ? 1 : 0);
  expect(fmt2).toBe(fmt);
  const info = (fmt ^ 0x5412) >>> 10;
  expect(info >>> 3).toBe(0); // niveau M
  const mask = info & 7;

  // Functiegebieden markeren (finders+scheiding+formaat, timing, uitlijning)
  const fn = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const mark = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) fn[y][x] = true;
  };
  mark(0, 0, 9, 9);
  mark(size - 8, 0, 8, 9);
  mark(0, size - 8, 9, 8);
  mark(6, 0, 1, size);
  mark(0, 6, size, 1);
  if (version >= 2) {
    const last = size - 7;
    mark(last - 2, last - 2, 5, 5); // versie 2–6: één uitlijnpatroon
  }

  const masks = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_x: number, y: number) => y % 2 === 0,
    (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  // Route: kolomparen van rechts naar links, afwisselend omhoog/omlaag, kolom 6 overslaan
  const bits: number[] = [];
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < size; k++) {
      const y = up ? size - 1 - k : k;
      for (const x of [col, col - 1]) {
        if (fn[y][x]) continue;
        bits.push(modules[y][x] !== masks[mask](x, y) ? 1 : 0);
      }
    }
    up = !up;
  }
  const words: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) words.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  // Versie 4-M: 2 blokken van 32 data + 18 ecc, verweven
  expect(version).toBe(4);
  const nBlocks = 2,
    dataLen = 32,
    eccLen = 18;
  const blocks = Array.from({ length: nBlocks }, () => [] as number[]);
  for (let i = 0; i < (dataLen + eccLen) * nBlocks; i++) blocks[i % nBlocks].push(words[i]);
  // Syndromen S_i = c(α^i) moeten 0 zijn
  for (const block of blocks)
    for (let i = 0; i < eccLen; i++) {
      let s = 0;
      for (const c of block) s = mul(s, EXP[i]) ^ c;
      expect(s).toBe(0);
    }
  const data = blocks.flatMap((b) => b.slice(0, dataLen));
  const stream = data.map((b) => b.toString(2).padStart(8, '0')).join('');
  expect(stream.slice(0, 4)).toBe('0100'); // byte-modus
  const len = parseInt(stream.slice(4, 12), 2);
  const out = [];
  for (let i = 0; i < len; i++) out.push(parseInt(stream.slice(12 + i * 8, 20 + i * 8), 2));
  return new TextDecoder().decode(new Uint8Array(out));
}

describe('qr decodeercontrole', () => {
  it('leest de Basic-Fit-link foutloos terug', () => {
    const url = 'https://member.basic-fit.com/friends/nl-NL/join/4HF7N9RG';
    expect(decode(encodeQr(url).modules)).toBe(url);
  });
});
