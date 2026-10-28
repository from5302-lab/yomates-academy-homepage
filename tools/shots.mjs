#!/usr/bin/env node
// og.png(1200x630)와 apple-touch-icon.png(180x180)를 만든다.
// playwright가 필요하다: npx -y playwright install chromium 뒤 `npm i -D playwright` 또는 PLAYWRIGHT=/경로/node_modules/playwright
// 잠깐 127.0.0.1 서버를 띄웠다가 끝나면 바로 끈다.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const req = createRequire(import.meta.url);
let pw;
try { pw = req(process.env.PLAYWRIGHT || "playwright"); } catch (e) { console.error("playwright가 없어요. 이 단계는 건너뛰어도 사이트는 돌아가요."); process.exit(0); }

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(new URL(q.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(pub, p);
  if (!f.startsWith(pub) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(s);
});
await new Promise(r => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await pw.chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(base + "/og.html"); await p.waitForSelector("body[data-ready]");
  await p.screenshot({ path: path.join(pub, "og.png") });
  const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8").replace('rx="14"', 'rx="0"');
  await p.setViewportSize({ width: 180, height: 180 });
  await p.setContent(`<style>html,body{margin:0}</style><div style="width:180px;height:180px">${svg.replace("<svg ", '<svg width="180" height="180" ')}</div>`);
  await p.screenshot({ path: path.join(pub, "apple-touch-icon.png") });
  console.log("만들었어요: public/og.png, public/apple-touch-icon.png");
} finally { await b.close(); srv.close(); }
