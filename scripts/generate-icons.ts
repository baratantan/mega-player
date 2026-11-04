import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Minimal pure Node.js PNG encoder without external native dependencies
function createPng(width: number, height: number, rgbaBuffer: Buffer): Buffer {
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width, 0);
  IHDR.writeUInt32BE(height, 4);
  IHDR.writeUInt8(8, 8); // bit depth 8
  IHDR.writeUInt8(6, 9); // color type 6: RGBA
  IHDR.writeUInt8(0, 10); // compression
  IHDR.writeUInt8(0, 11); // filter
  IHDR.writeUInt8(0, 12); // interlace

  // Create scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // Filter: None
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const IDAT = zlib.deflateSync(scanlines);

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const chunk = Buffer.alloc(8 + len + 4);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);

    // CRC32 calculation
    let crc = 0xffffffff;
    const crcTable: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c;
    }
    for (let i = 4; i < 8 + len; i++) {
      crc = crcTable[(crc ^ chunk[i]) & 0xff] ^ (crc >>> 8);
    }
    chunk.writeInt32BE((crc ^ 0xffffffff) | 0, 8 + len);
    return chunk;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', IHDR);
  const idatChunk = makeChunk('IDAT', IDAT);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderCinemaProIcon(size: number, isMaskable = false): Buffer {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const cornerRadius = isMaskable ? 0 : size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Base background: Luxurious Deep Space Navy #050814 -> #0f172a
      const gradT = (y + x) / (size * 2);
      let r = Math.round(5 + gradT * 12);
      let g = Math.round(8 + gradT * 18);
      let b = Math.round(20 + gradT * 40);
      let a = 255;

      // Check rounded squircle for standard icons
      if (!isMaskable) {
        let dx = 0;
        let dy = 0;
        if (x < cornerRadius) dx = cornerRadius - x;
        else if (x > size - cornerRadius) dx = x - (size - cornerRadius);
        if (y < cornerRadius) dy = cornerRadius - y;
        else if (y > size - cornerRadius) dy = y - (size - cornerRadius);

        if (dx > 0 && dy > 0) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > cornerRadius) {
            a = 0;
          } else if (dist > cornerRadius - 1.5) {
            a = Math.round(255 * (cornerRadius - dist) / 1.5);
          }
        }
      }

      if (a > 0) {
        // Glowing TV frame
        const tvW = size * 0.62;
        const tvH = size * 0.46;
        const tvL = cx - tvW / 2;
        const tvR = cx + tvW / 2;
        const tvT = cy - tvH / 2 - size * 0.02;
        const tvB = tvT + tvH;

        // Inside TV Screen
        if (x >= tvL && x <= tvR && y >= tvT && y <= tvB) {
          const screenBorder = size * 0.03;
          const isBorder = (x <= tvL + screenBorder || x >= tvR - screenBorder || y <= tvT + screenBorder || y >= tvB - screenBorder);
          if (isBorder) {
            // Neon Cyan-Blue border
            const bxRatio = (x - tvL) / tvW;
            r = Math.round(6 * (1 - bxRatio) + 147 * bxRatio);
            g = Math.round(182 * (1 - bxRatio) + 51 * bxRatio);
            b = Math.round(212 * (1 - bxRatio) + 234 * bxRatio);
          } else {
            // Screen interior: deep sleek blue with play icon
            r = 10;
            g = 16;
            b = 30;

            // Play triangle in center
            const playH = tvH * 0.48;
            const playW = playH * 0.86;
            const playLeft = cx - playW * 0.38;
            const playRight = cx + playW * 0.62;
            const playTop = cy - playH * 0.5 - size * 0.02;
            const playBottom = cy + playH * 0.5 - size * 0.02;

            if (x >= playLeft && x <= playRight && y >= playTop && y <= playBottom) {
              const relX = (x - playLeft) / playW;
              const allowedHalfHeight = (playH / 2) * (1 - relX);
              const curDistY = Math.abs(y - (playTop + playH / 2));
              if (curDistY <= allowedHalfHeight) {
                // Vibrant Cyan / Gold Cinema Gradient
                r = Math.round(34 + relX * 220);
                g = Math.round(211 + relX * 10);
                b = Math.round(238 - relX * 100);
              }
            }
          }
        }

        // TV Stand / Base
        const standW = size * 0.18;
        const standT = tvB;
        const standB = standT + size * 0.04;
        if (x >= cx - standW / 2 && x <= cx + standW / 2 && y >= standT && y <= standB) {
          r = 59;
          g = 130;
          b = 246;
        }

        // "4K PRO" Gold Badge at bottom right of icon
        const badgeR = size * 0.13;
        const badgeCx = size * 0.78;
        const badgeCy = size * 0.76;
        const bDist = Math.hypot(x - badgeCx, y - badgeCy);
        if (bDist <= badgeR) {
          if (bDist >= badgeR - size * 0.02) {
            r = 250; g = 204; b = 21; // Gold border
          } else {
            r = 217; g = 119; b = 6; // Amber fill
          }
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }

  return createPng(size, heightOrWidth(size), buf);
}

function heightOrWidth(s: number) { return s; }

const publicDir = path.resolve(process.cwd(), 'public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderCinemaProIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderCinemaProIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderCinemaProIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderCinemaProIcon(180, false));
console.log('Successfully generated PWA PNG icons!');
