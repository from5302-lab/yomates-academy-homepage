#!/usr/bin/env node
// academy.json 한 파일을 사이트에 반영한다. 코드는 건드리지 않는다.
// 하는 일: public/academy.json(관리자 이메일 뺀 공개본), firestore.rules(관리자 이메일),
//          public/favicon.svg, index.html의 제목·설명·OG 글.
// 쓰는 법: node tools/apply.mjs [academy.json 경로]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.resolve(process.argv[2] || path.join(root, "academy.json"));
const c = JSON.parse(fs.readFileSync(src, "utf8"));
const need = ["name", "tagline", "phone", "address", "classes", "consultSlots", "admins"];
const miss = need.filter(k => !c[k] || (Array.isArray(c[k]) && !c[k].length));
if (miss.length) { console.error("academy.json에 빠진 값: " + miss.join(", ")); process.exit(1); }
const admins = c.admins.map(e => String(e).trim().toLowerCase()).filter(e => /^[^@\s]+@[^@\s]+$/.test(e));
if (!admins.length) { console.error("admins에 관리자 구글 이메일을 한 개 이상 적어 주세요."); process.exit(1); }
for (const k of c.classes) if (k.fee != null && !Number.isFinite(+k.fee)) { console.error(`원비는 숫자(원)로: ${k.name}`); process.exit(1); }

const FEATS = ["report", "pay", "fees", "teachers", "reviews", "notice", "leveltest", "makeup"];
const bad = Object.keys(c.features || {}).filter(k => !FEATS.includes(k));
if (bad.length) { console.error("features에 모르는 기능: " + bad.join(", ") + " (쓸 수 있는 것: " + FEATS.join(", ") + ")"); process.exit(1); }
c.features = Object.fromEntries(FEATS.map(k => [k, (c.features || {})[k] === true]));
if (c.features.leveltest) for (const [i, q] of (c.levelQuestions || []).entries()) if (!(+q.a >= 1 && +q.a <= 4) || !q["o" + q.a]) { console.error(`레벨테스트 ${i + 1}번 정답 번호가 보기와 맞지 않아요`); process.exit(1); }
const pub = { ...c }; delete pub.admins; delete pub._help;
fs.writeFileSync(path.join(root, "public/academy.json"), JSON.stringify(pub, null, 2) + "\n");

const tpl = fs.readFileSync(path.join(root, "firestore.rules.template"), "utf8");
fs.writeFileSync(path.join(root, "firestore.rules"), tpl.replace("__ADMIN_EMAILS__", JSON.stringify(admins).replace(/"/g, "'")));

const TH = { layout: ["split", "center", "timetable", "magazine", "cards", "flow"], mode: ["white", "tint", "deep"], font: ["clean", "serif", "bold"], radius: ["sharp", "soft", "round"], density: ["airy", "compact"] };
const t = c.theme || {}; const pal = t.palette || {};
for (const k of ["layout", "font", "radius", "density"]) if (t[k] && !TH[k].includes(t[k])) { console.error(`theme.${k}는 ${TH[k].join("|")} 중 하나`); process.exit(1); }
if (pal.mode && !TH.mode.includes(pal.mode)) { console.error(`theme.palette.mode는 ${TH.mode.join("|")} 중 하나`); process.exit(1); }
for (const k of ["primary", "accent"]) if (pal[k] && !/^#[0-9a-f]{6}$/i.test(pal[k])) { console.error(`theme.palette.${k}는 #RRGGBB`); process.exit(1); }
const color = pal.primary || (/^#[0-9a-f]{6}$/i.test(c.color || "") ? c.color : "#1E5BB8");
const ch = [...c.name.replace(/\s/g, "")][0] || "학";
fs.writeFileSync(path.join(root, "public/favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${color}"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Apple SD Gothic Neo, Malgun Gothic, sans-serif" font-size="34" font-weight="800" fill="#fff">${ch}</text></svg>\n`);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const desc = esc(String(c.tagline).replace(/\s*\n\s*/g, " "));
const meta = `<!-- meta:start (tools/apply.mjs가 academy.json 값으로 채운다) -->
<title>${esc(c.name)}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${esc(c.name)}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="/og.png">
<meta name="theme-color" content="${color}">
<!-- meta:end -->`;
const ix = path.join(root, "public/index.html");
fs.writeFileSync(ix, fs.readFileSync(ix, "utf8").replace(/<!-- meta:start[\s\S]*?<!-- meta:end -->/, meta));
console.log(`반영했어요: ${c.name} · 모양 ${t.layout || "split"}/${color} · 반 ${c.classes.length}개 · 관리자 ${admins.length}명 · 켠 기능 ${FEATS.filter(k => c.features[k]).join(", ") || "기본만"}`);
console.log("다음: node tools/shots.mjs 로 og.png(1200x630)와 apple-touch-icon.png(180x180)를 만든다 (playwright 필요, 없으면 건너뛰어도 됨)");
