// Generates the PNG app icons with no dependencies (node zlib only).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const cells = { '0,0': '#ff8fa3', '1,0': '#ff8fa3', '0,1': '#ff8fa3', '2,1': '#6ec6e8', '2,2': '#6ec6e8', '1,2': '#ffd966', '0,2': '#8fd694' };
const pixel = (u, v) => {
  const bg = hex('#fbf3e4');
  const m = 0.16, s = (1 - 2 * m) / 3;
  const gx = (u - m) / s, gy = (v - m) / s;
  const cx = Math.floor(gx), cy = Math.floor(gy);
  const col = cells[cx + ',' + cy];
  if (!col || gx < 0 || gy < 0) return bg;
  const fx = gx - cx, fy = gy - cy;
  if (fx < 0.06 || fx > 0.94 || fy < 0.06 || fy > 0.94) return bg;
  const c = hex(col);
  const shade = fy > 0.8 ? 0.85 : fy < 0.25 ? 1.12 : 1;
  return c.map((x) => Math.min(255, Math.round(x * shade)));
};
for (const size of [180, 192, 512]) writeFileSync(new URL(`../icons/icon-${size}.png`, import.meta.url), png(size, pixel));
console.log('icons written');
