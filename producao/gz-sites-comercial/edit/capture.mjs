import puppeteer from "puppeteer-core";
import { spawn } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, "")] = args[i + 1];

const outDir = opt.out || "/tmp/gz-frames";
const w = Number(opt.w || 1080);
const h = Number(opt.h || 1920);
const pageUrl = opt.page || "cenas/film.html";
const root = opt.root || "/workspace/producao/gz-sites-comercial";
function parseFrames(spec) {
  const out = [];
  for (const part of String(spec || "0").split(",")) {
    const m = part.trim();
    if (!m) continue;
    if (m.includes("-")) {
      const [a, b] = m.split("-").map((v) => Number(v));
      const step = a <= b ? 1 : -1;
      for (let i = a; step > 0 ? i <= b : i >= b; i += step) out.push(i);
    } else {
      out.push(Number(m));
    }
  }
  return out.filter((n) => Number.isFinite(n));
}
const frames = parseFrames(opt.frames);
const format = opt.format || "jpeg";
const quality = Number(opt.quality || 0.9);

fs.mkdirSync(outDir, { recursive: true });
const port = String(opt.port || "8765");
let srv;
function portOpen() {
  return new Promise((resolve) => {
    const socket = net.connect({ port: Number(port), host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}
async function ensureServer() {
  if (await portOpen()) return;
  if (srv) {
    try { srv.kill(); } catch (err) { console.error("srv", err.message); }
  }
  srv = spawn("python3", ["-m", "http.server", port, "--bind", "127.0.0.1"], {
    cwd: path.resolve(root),
    stdio: "ignore",
    detached: true,
  });
  srv.unref();
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (await portOpen()) return;
  }
  throw new Error("http server did not start on " + port);
}
await ensureServer();

const chromeArgs = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--enable-unsafe-swiftshader",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-webgl",
  "--ignore-gpu-blocklist",
  "--disable-gpu-sandbox",
  `--window-size=${w},${h}`,
];

let browser;
let page;

async function openPage() {
  await ensureServer();
  if (browser) {
    try { await browser.close(); } catch (err) { console.error("close", err.message); }
  }
  browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: chromeArgs,
  });
  page = await browser.newPage();
  page.on("pageerror", (err) => console.error("PAGEERROR", err.message));
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${port}/` + pageUrl + `?w=${w}&h=${h}`, { waitUntil: "networkidle0", timeout: 120000 });
  await page.waitForFunction("window.__ready===true", { timeout: 120000 });
  console.log("ready", Date.now() - t0, "ms");
}

await openPage();
let sinceLaunch = 0;
const times = [];
for (const n of frames) {
  const name = `${String(n).padStart(4, "0")}.${format === "png" ? "png" : "jpg"}`;
  const dest = path.join(outDir, name);
  if (fs.existsSync(dest) && opt.force !== "1") {
    console.log("skip", name);
    continue;
  }
  if (sinceLaunch >= 8) {
    console.log("recycle");
    let opened = false;
    for (let attempt = 0; attempt < 4 && !opened; attempt++) {
      try {
        await openPage();
        opened = true;
      } catch (err) {
        console.error("recycle retry", attempt, err.message);
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (!opened) {
      console.error("recycle failed", name);
      continue;
    }
    sinceLaunch = 0;
  }
  const a = Date.now();
  let info;
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        console.error("retry", name, lastErr && lastErr.message);
        await openPage();
        sinceLaunch = 0;
      }
      info = await page.evaluate(async (frame, fmt, q) => {
        const meta = window.renderFrame(frame);
        const canvas = document.getElementById("out") || document.getElementById("c");
        const url = fmt === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", q);
        return { meta, url };
      }, n, format, quality);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      info = null;
    }
  }
  if (!info) {
    console.error("give up", name, lastErr && lastErr.message);
    continue;
  }
  const b64 = info.url.split(",")[1];
  try { fs.chmodSync(path.dirname(dest), 0o755); } catch (err) { console.error("chmod dir", err.message); }
  if (fs.existsSync(dest)) {
    try { fs.chmodSync(dest, 0o644); } catch (err) { console.error("chmod", err.message); }
  }
  fs.writeFileSync(dest, Buffer.from(b64, "base64"));
  const ms = Date.now() - a;
  times.push(ms);
  sinceLaunch += 1;
  const gap = info.meta && typeof info.meta.gap === "number" ? info.meta.gap.toFixed(4) : "-";
  const samples = info.meta && info.meta.samples != null ? info.meta.samples : "-";
  console.log(name, ms + "ms", "gap", gap, "samples", samples);
}
if (times.length) {
  const avg = times.reduce((s, v) => s + v, 0) / times.length;
  console.log("avg", Math.round(avg), "ms over", times.length, "frames");
}
try { await browser.close(); } catch (err) { console.error(err.message); }
if (srv) {
  try { srv.kill(); } catch (err) { console.error(err.message); }
}
