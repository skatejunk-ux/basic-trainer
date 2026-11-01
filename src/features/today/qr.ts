// Minimale QR-codegenerator (ISO/IEC 18004): byte-modus, foutcorrectieniveau M, versies 1–40.
// Gebaseerd op de opbouw van Nayuki's qrcodegen; zonder afhankelijkheden, zodat de app offline blijft werken.

// Per versie (index 0 ongebruikt), niveau M.
const ECC_PER_BLOCK_M = [
  -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
];
const NUM_BLOCKS_M = [
  -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33,
  35, 37, 38, 40, 43, 45, 47, 49,
];
const FORMAT_BITS_M = 0; // L=1, M=0, Q=3, H=2

export interface QrCode {
  version: number;
  size: number;
  mask: number;
  /** modules[y][x] === true is een donker vakje. */
  modules: boolean[][];
}

const getBit = (x: number, i: number) => ((x >>> i) & 1) !== 0;

export function numRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

const numDataCodewords = (ver: number) =>
  Math.floor(numRawDataModules(ver) / 8) - ECC_PER_BLOCK_M[ver] * NUM_BLOCKS_M[ver];

/** BCH-code voor de 15 formaatbits (foutcorrectieniveau + masker). */
export function formatBits(eclBits: number, mask: number): number {
  const data = (eclBits << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

// ---------- Reed-Solomon over GF(2^8), polynoom 0x11D ----------
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] ^= gfMul(coef, factor)));
  }
  return result;
}

// ---------- Opbouw ----------
export function encodeQr(text: string): QrCode {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 1;
  for (; ; version++) {
    if (version > 40) throw new Error('Tekst te lang voor een QR-code');
    const countBits = version <= 9 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= numDataCodewords(version) * 8) break;
  }
  const countBits = version <= 9 ? 8 : 16;

  // Bitstroom: modus 0100 (byte), lengte, data, terminator, opvulling.
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, countBits);
  bytes.forEach((b) => push(b, 8));
  const capacity = numDataCodewords(version) * 8;
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const isFunction = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const setFn = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  // Timingpatronen
  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  // Finderpatronen (+ scheiding)
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, dist !== 2 && dist !== 4);
      }
  }
  // Uitlijnpatronen
  const align = alignmentPositions(version, size);
  align.forEach((ax, i) =>
    align.forEach((ay, j) => {
      const corner = (i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0);
      if (corner) return;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) setFn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }),
  );
  drawFormat(0, setFn, size); // plaats reserveren; definitieve bits na maskerkeuze
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const vbits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, getBit(vbits, i));
      setFn(b, a, getBit(vbits, i));
    }
  }

  // Codewoorden met foutcorrectie, verweven over blokken
  const numBlocks = NUM_BLOCKS_M[version];
  const eccLen = ECC_PER_BLOCK_M[version];
  const raw = Math.floor(numRawDataModules(version) / 8);
  const numShort = numBlocks - (raw % numBlocks);
  const shortLen = Math.floor(raw / numBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const codewords: number[] = [];
  for (let i = 0; i < blocks[0].length; i++)
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) codewords.push(block[i]);
    });

  // Zigzag plaatsen
  let bit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && bit < codewords.length * 8) {
          modules[y][x] = getBit(codewords[bit >>> 3], 7 - (bit & 7));
          bit++;
        }
      }
  }

  // Beste masker kiezen (laagste strafscore)
  let best = { mask: 0, score: Infinity, grid: modules };
  for (let mask = 0; mask < 8; mask++) {
    const grid = modules.map((row) => row.slice());
    applyMask(grid, isFunction, mask);
    drawFormat(mask, (x, y, d) => (grid[y][x] = d), size);
    const score = penalty(grid);
    if (score < best.score) best = { mask, score, grid };
  }
  return { version, size, mask: best.mask, modules: best.grid };
}

function alignmentPositions(ver: number, size: number): number[] {
  if (ver === 1) return [];
  const num = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (num * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < num; pos -= step) result.splice(1, 0, pos);
  return result;
}

function drawFormat(mask: number, set: (x: number, y: number, dark: boolean) => void, size: number) {
  const bits = formatBits(FORMAT_BITS_M, mask);
  for (let i = 0; i <= 5; i++) set(8, i, getBit(bits, i));
  set(8, 7, getBit(bits, 6));
  set(8, 8, getBit(bits, 7));
  set(7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, getBit(bits, i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, getBit(bits, i));
  set(8, size - 8, true); // altijd donker
}

function applyMask(grid: boolean[][], isFunction: boolean[][], mask: number) {
  const size = grid.length;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      if (isFunction[y][x]) continue;
      const invert = [
        (x + y) % 2 === 0,
        y % 2 === 0,
        x % 3 === 0,
        (x + y) % 3 === 0,
        (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
        ((x * y) % 2) + ((x * y) % 3) === 0,
        (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
        (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
      ][mask];
      if (invert) grid[y][x] = !grid[y][x];
    }
}

/** Vereenvoudigde strafscore (regels 1, 2 en 4 uit de standaard); elk masker levert een geldige code op. */
function penalty(grid: boolean[][]): number {
  const size = grid.length;
  let score = 0;
  for (let horiz = 0; horiz < 2; horiz++)
    for (let a = 0; a < size; a++) {
      let run = 1;
      for (let b = 1; b <= size; b++) {
        const cur = b < size ? (horiz ? grid[a][b] : grid[b][a]) : null;
        const prev = horiz ? grid[a][b - 1] : grid[b - 1][a];
        if (cur === prev) run++;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
    }
  for (let y = 0; y < size - 1; y++)
    for (let x = 0; x < size - 1; x++) {
      const c = grid[y][x];
      if (c === grid[y][x + 1] && c === grid[y + 1][x] && c === grid[y + 1][x + 1]) score += 3;
    }
  const dark = grid.flat().filter(Boolean).length;
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

/** SVG-pad (één path) voor de donkere vakjes, met stille zone `border`. */
export function qrPath(qr: QrCode, border = 2): string {
  const parts: string[] = [];
  qr.modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) parts.push(`M${x + border},${y + border}h1v1h-1z`);
    }),
  );
  return parts.join('');
}
