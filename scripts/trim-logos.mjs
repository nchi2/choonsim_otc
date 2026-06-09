#!/usr/bin/env node
/**
 * trim-logos.mjs
 *
 * 플랫폼/브랜드 로고 PNG의 투명 여백(transparent border)을 제거해 카드 아이콘이
 * 36~40px을 꽉 채우게 만든다. 로고 디자인은 변형하지 않고 "자르기"만 한다.
 *
 * 사용법:
 *   node scripts/trim-logos.mjs                 # 기본 대상(아래 DEFAULT_TARGETS) 트리밍
 *   node scripts/trim-logos.mjs public/logo/X.png ...   # 특정 파일만 트리밍
 *   node scripts/trim-logos.mjs --dir public/logo       # 디렉터리 내 png/webp 전체 트리밍
 *   node scripts/trim-logos.mjs --flatten-bg public/logo/X.png  # 밝은 그레이스케일
 *       배경(흰색/회색 체커보드 등)을 투명으로 바꾼 뒤 트리밍
 *
 * 동작:
 *   - 원본을 <name>_original.<ext> 로 1회 백업(이미 있으면 건너뜀)
 *   - 재실행 시 백업(원본)에서 읽어 idempotent 하게 처리
 *   - 같은 파일명으로 덮어쓰기(경로/이름 불변). 확장자가 .png 면 PNG로 출력.
 *   - sharp 가 있으면 sharp.trim() 사용(webp/png 모두 처리). 없으면 8bit RGBA PNG 전용
 *     순수 Node 트리머로 폴백(webp 미지원 → 건너뜀).
 *
 * 새 로고 추가 흐름:
 *   1) public/logo/ 에 새 로고를 넣는다.
 *   2) DEFAULT_TARGETS 에 경로를 추가하거나, CLI 인자로 파일 경로를 넘겨 실행한다.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** 기본 트리밍 대상: 카드 아이콘으로 쓰는 플랫폼 브랜드 로고 */
const DEFAULT_TARGETS = [
  "public/logo/Logo_Kakao.png",
  "public/logo/Logo_Naver_blog.png",
  "public/logo/Logo_Discord.png",
  "public/logo/Logo_Naver_cafe.png",
  "public/icon_telegram.png",
];

const ALPHA_THRESHOLD = 0; // 알파가 이 값 초과인 픽셀을 "내용"으로 간주
// flatten-bg: "밝은 + 무채색" 픽셀을 배경으로 보고 투명화 (흰색/회색 체커보드 제거용)
const BG_GRAY_TOL = 16; // |max-min| 채널차 이하 = 무채색
const BG_BRIGHT_MIN = 205; // 최소 채널이 이 값 이상 = 밝음

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

/** 백업 경로 반환. 없으면 현재 파일을 백업으로 복사. (재실행 시 원본 보존) */
function ensureBackup(absPath) {
  const ext = path.extname(absPath);
  const backup = absPath.slice(0, -ext.length) + "_original" + ext;
  const created = !fs.existsSync(backup);
  if (created) fs.copyFileSync(absPath, backup);
  return { backup, created };
}

/** RGBA 버퍼에서 밝은 무채색(배경) 픽셀의 알파를 0으로 */
function flattenBackground(data, channels) {
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const bright = Math.min(r, g, b);
    if (sat <= BG_GRAY_TOL && bright >= BG_BRIGHT_MIN) {
      data[i + 3] = 0;
    }
  }
}

async function trimWithSharp(sharp, sourcePath, outPath, flattenBg) {
  const ext = path.extname(outPath).toLowerCase();
  const before = await sharp(sourcePath).metadata();

  let pipeline;
  if (flattenBg) {
    const { data, info } = await sharp(sourcePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    flattenBackground(data, info.channels);
    pipeline = sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    }).trim();
  } else {
    pipeline = sharp(sourcePath).trim();
  }

  const buf =
    ext === ".webp"
      ? await pipeline.webp().toBuffer()
      : await pipeline.png().toBuffer();
  const after = await sharp(buf).metadata();
  fs.writeFileSync(outPath, buf);
  return {
    before: { w: before.width, h: before.height },
    after: { w: after.width, h: after.height },
    engine: "sharp",
  };
}

// ---- 순수 Node PNG 폴백 (8-bit RGBA, non-interlaced 전용) ----

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readChunks(buf) {
  const chunks = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    chunks.push({ type, data });
    off += 12 + len;
  }
  return chunks;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodeRGBA(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error("not a PNG");
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(
      `unsupported PNG (bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace})`,
    );
  }
  const chunks = readChunks(buf);
  const idat = Buffer.concat(
    chunks.filter((c) => c.type === "IDAT").map((c) => c.data),
  );
  const raw = zlib.inflateSync(idat);
  const bpp = 4;
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const o = y * stride;
    for (let x = 0; x < stride; x++) {
      const rawVal = line[x];
      const a = x >= bpp ? out[o + x - bpp] : 0;
      const b = y > 0 ? out[o - stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[o - stride + x - bpp] : 0;
      let val;
      switch (filter) {
        case 0:
          val = rawVal;
          break;
        case 1:
          val = rawVal + a;
          break;
        case 2:
          val = rawVal + b;
          break;
        case 3:
          val = rawVal + ((a + b) >> 1);
          break;
        case 4:
          val = rawVal + paeth(a, b, c);
          break;
        default:
          throw new Error("bad filter " + filter);
      }
      out[o + x] = val & 0xff;
    }
  }
  return { w, h, data: out };
}

function findBounds(img) {
  const { w, h, data } = img;
  let top = h,
    left = w,
    right = -1,
    bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null; // 완전 투명
  return { left, top, right, bottom };
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRGBA(w, h, data) {
  const stride = w * 4;
  const rawData = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    rawData[y * (stride + 1)] = 0; // filter: none
    data.copy(rawData, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = zlib.deflateSync(rawData, { level: 9 });
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function trimPurePng(sourcePath, outPath, flattenBg) {
  const ext = path.extname(outPath).toLowerCase();
  if (ext !== ".png" || path.extname(sourcePath).toLowerCase() !== ".png") {
    throw new Error("pure trimmer supports .png only (install sharp for webp)");
  }
  const buf = fs.readFileSync(sourcePath);
  const img = decodeRGBA(buf);
  if (flattenBg) flattenBackground(img.data, 4);
  const bounds = findBounds(img);
  if (!bounds) throw new Error("image is fully transparent");
  const nw = bounds.right - bounds.left + 1;
  const nh = bounds.bottom - bounds.top + 1;
  if (nw === img.w && nh === img.h) {
    return { before: { w: img.w, h: img.h }, after: { w: nw, h: nh }, engine: "node", noop: true };
  }
  const cropped = Buffer.alloc(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    const srcOff = ((bounds.top + y) * img.w + bounds.left) * 4;
    img.data.copy(cropped, y * nw * 4, srcOff, srcOff + nw * 4);
  }
  fs.writeFileSync(outPath, encodeRGBA(nw, nh, cropped));
  return { before: { w: img.w, h: img.h }, after: { w: nw, h: nh }, engine: "node" };
}

function resolveTargets(args) {
  const dirFlag = args.indexOf("--dir");
  if (dirFlag !== -1 && args[dirFlag + 1]) {
    const dir = path.resolve(ROOT, args[dirFlag + 1]);
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(png|webp)$/i.test(f) && !f.includes("_original"))
      .map((f) => path.join(dir, f));
  }
  const files = args.filter((a) => !a.startsWith("--"));
  const list = files.length > 0 ? files : DEFAULT_TARGETS;
  return list.map((p) => path.resolve(ROOT, p));
}

async function main() {
  const args = process.argv.slice(2);
  const flattenBg = args.includes("--flatten-bg");
  const targets = resolveTargets(args);
  const sharp = await loadSharp();

  console.log(`engine: ${sharp ? "sharp" : "pure-node PNG fallback"}`);
  if (flattenBg) console.log("mode: --flatten-bg (밝은 무채색 배경 → 투명)");
  console.log("");

  const report = [];
  for (const absPath of targets) {
    const rel = path.relative(ROOT, absPath);
    if (!fs.existsSync(absPath)) {
      report.push({ rel, status: "missing" });
      continue;
    }
    try {
      const { backup, created } = ensureBackup(absPath);
      const source = backup; // 항상 원본 백업에서 읽어 idempotent
      const result = sharp
        ? await trimWithSharp(sharp, source, absPath, flattenBg)
        : trimPurePng(source, absPath, flattenBg);
      report.push({
        rel,
        status: result.noop ? "no-trim-needed" : "trimmed",
        before: result.before,
        after: result.after,
        backup: created ? path.relative(ROOT, backup) : "(exists)",
        engine: result.engine,
      });
    } catch (err) {
      report.push({ rel, status: "error", message: err.message });
    }
  }

  console.log("=== trim-logos report ===");
  for (const r of report) {
    if (r.status === "missing") {
      console.log(`SKIP   ${r.rel}  (file not found)`);
    } else if (r.status === "error") {
      console.log(`ERROR  ${r.rel}  -> ${r.message}`);
    } else {
      const b = `${r.before.w}x${r.before.h}`;
      const a = `${r.after.w}x${r.after.h}`;
      console.log(
        `${r.status === "trimmed" ? "TRIM " : "KEEP "}  ${r.rel}  ${b} -> ${a}  [${r.engine}] backup=${r.backup}`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
