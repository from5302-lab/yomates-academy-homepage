import { init, getConfig, addInquiry, addMakeup, esc, won, ymd, applyLook, maskPhone, isDemo, on } from "./core.js";

const I = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="13" r=".8"/><circle cx="16.5" cy="13" r=".8"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>'
};
const GRADES = ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3", "그 밖"];

(async function main() {
  const app = document.getElementById("app");
  await init();
  let c;
  try { c = await getConfig(); } catch (e) { c = null; }
  if (!c) {
    app.innerHTML = `<main class="empty wrap"><h1>홈페이지를 준비하고 있어요</h1><p class="muted pl">원장님이 관리자 화면에서
학원 정보를 넣으면 이곳에 보여요.</p><a class="btn pri" href="/admin/">관리자 화면 열기</a></main>`;
    return;
  }
  applyLook(c);
  document.title = c.name;
  app.innerHTML = [on(c, "notice") ? notice(c) : "", header(c), hero(c), classes(c), on(c, "fees") ? fees(c) : "", on(c, "leveltest") ? level(c) : "", on(c, "teachers") ? teachers(c) : "", on(c, "reviews") ? reviews(c) : "", place(c), apply(c), on(c, "makeup") ? makeup(c) : "", footer(c), dock(c)].join("");
  bindForm(c);
  if (on(c, "leveltest")) bindLevel(c);
  if (on(c, "makeup")) bindMakeup(c);
  const dk = app.querySelector(".dock"), hc = app.querySelector(".hero-cta");
  if (dk && hc && "IntersectionObserver" in window) {
    dk.classList.add("off");
    new IntersectionObserver(([e]) => dk.classList.toggle("off", e.isIntersecting)).observe(hc);
  }
})();

function notice(c) {
  const n = c.notice;
  if (!n || !n.text || (n.until && n.until < ymd(Date.now()))) return "";
  const until = n.until ? `<span class="nb-until">${+n.until.slice(5, 7)}월 ${+n.until.slice(8, 10)}일까지</span>` : "";
  return `<div class="nb"><div class="wrap nb-in">${I.bell}<span class="nb-t">${esc(n.text)}</span>${until}</div></div>`;
}
function logo(c) {
  return c.logo ? `<img class="logo" src="${esc(c.logo)}" alt="">` : `<span class="logo logo-t" aria-hidden="true">${esc((c.name || "학")[0])}</span>`;
}
function header(c) {
  return `<header class="hd"><div class="wrap hd-in"><a class="brand" href="#top">${logo(c)}<span>${esc(c.name)}</span></a>
<nav class="hd-nav">${[["classes", "반·시간표", 1], ["fees", "원비", on(c, "fees")], ["level", "레벨테스트", on(c, "leveltest") && (c.levelQuestions || []).length], ["teachers", "선생님", on(c, "teachers")], ["place", "오시는 길", 1], ["makeup", "보강 신청", on(c, "makeup")]].filter(x => x[2]).map(x => `<a href="#${x[0]}">${x[1]}</a>`).join("")}</nav>
<a class="btn pri sm hd-cta" href="#apply">상담 신청</a></div></header>`;
}
function hero(c) {
  const cl = c.classes || [];
  const seats = cl.length ? Math.max(...cl.map(x => +x.seats || 0)) : 0;
  const facts = [
    cl.length ? [`${cl.length}개 반`, cl.map(x => x.grade).filter(Boolean).join(" · ")] : null,
    seats ? [`반마다 ${seats}명까지`, "정원"] : null,
    (c.consultSlots || []).length ? [c.consultSlots[0], "상담 시간"] : null
  ].filter(Boolean);
  return `<section class="hero" id="top"><div class="wrap hero-in">
<div class="hero-main"><h1 class="pl">${esc(c.tagline)}</h1>
${c.intro ? `<p class="hero-p pl">${esc(c.intro)}</p>` : ""}
<div class="hero-cta"><a class="btn pri" href="#apply">${I.pen}상담 신청하기</a>${c.phone ? `<a class="btn" href="tel:${esc(c.phone.replace(/[^0-9+]/g, ""))}">${I.phone}${esc(c.phone)}</a>` : ""}</div></div>
${facts.length ? `<ul class="facts">${facts.map(f => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`).join("")}</ul>` : ""}
</div></section>`;
}
function sec(id, title, body, sub) {
  return `<section class="sec" id="${id}"><div class="wrap"><div class="sec-hd"><h2>${title}</h2>${sub ? `<p class="muted pl">${sub}</p>` : ""}</div>${body}</div></section>`;
}
function classes(c) {
  const cl = c.classes || []; if (!cl.length) return "";
  return sec("classes", "반·시간표", `<div class="grid3">${cl.map(x => `<article class="card cls">
<div class="cls-hd"><h3>${esc(x.name)}</h3>${x.grade ? `<span class="tag pri">${esc(x.grade)}</span>` : ""}</div>
<dl class="kv"><div><dt>요일</dt><dd>${esc(x.days)}</dd></div><div><dt>시간</dt><dd>${esc(x.time)}</dd></div>${x.seats ? `<div><dt>정원</dt><dd>${esc(x.seats)}명</dd></div>` : ""}</dl></article>`).join("")}</div>`);
}
function fees(c) {
  const cl = (c.classes || []).filter(x => x.fee); if (!cl.length) return "";
  return sec("fees", "원비", `<div class="card fee"><table class="tbl"><thead><tr><th>반</th><th class="c-grade">대상</th><th class="r">한 달</th></tr></thead><tbody>
${cl.map(x => `<tr><td><span class="fee-n">${esc(x.name)}</span>${x.grade ? `<span class="fee-g">${esc(x.grade)}</span>` : ""}</td><td class="c-grade">${esc(x.grade)}</td><td class="r num">${won(x.fee)}</td></tr>`).join("")}</tbody></table></div>
<div class="note fee-note">${I.info}<span class="pl">교육청에 게시한 교습비 그대로 받아요.${c.feeNote ? "\n" + esc(c.feeNote) : ""}</span></div>`);
}
function teachers(c) {
  const t = c.teachers || []; if (!t.length) return "";
  return sec("teachers", "선생님", `<div class="grid2">${t.map(x => `<article class="card tch">
<span class="av" aria-hidden="true">${esc((x.name || "")[0] || "")}</span>
<div><div class="tch-hd"><h3>${esc(x.name)}</h3>${x.role ? `<span class="tag">${esc(x.role)}</span>` : ""}</div>
${x.line ? `<p class="pl muted">${esc(x.line)}</p>` : ""}</div></article>`).join("")}</div>`);
}
function reviews(c) {
  const r = c.reviews || []; if (!r.length) return "";
  return sec("reviews", "학부모 후기", `<div class="grid3">${r.map(x => `<figure class="card rv"><blockquote class="pl">${esc(x.text)}</blockquote><figcaption>${esc(x.who)}</figcaption></figure>`).join("")}</div>`, "이름은 가려서 올려요.");
}
function place(c) {
  if (!c.address) return "";
  const q = encodeURIComponent(c.address.replace(/\(.*?\)/g, "").trim());
  return sec("place", "오시는 길", `<div class="card plc">
<div class="plc-row">${I.pin}<div><b>주소</b><p>${esc(c.address)}</p></div></div>
${c.parking ? `<div class="plc-row">${I.car}<div><b>주차</b><p class="pl">${esc(c.parking)}</p></div></div>` : ""}
${c.phone ? `<div class="plc-row">${I.phone}<div><b>대표 번호</b><p><a href="tel:${esc(c.phone.replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a></p></div></div>` : ""}
<div class="plc-btns"><a class="btn sm" target="_blank" rel="noopener" href="https://map.naver.com/p/search/${q}">네이버 지도</a><a class="btn sm" target="_blank" rel="noopener" href="https://map.kakao.com/?q=${q}">카카오맵</a></div></div>`);
}
function apply(c) {
  const slots = c.consultSlots || [];
  return sec("apply", "입회·상담 신청", `<form class="card form" id="f" novalidate>
<label class="field"><span>학생 이름</span><input class="in" name="name" maxlength="20" autocomplete="off" required></label>
<label class="field"><span>학년</span><select class="sel" name="grade" required><option value="">고르기</option>${GRADES.map(g => `<option>${g}</option>`).join("")}</select></label>
<label class="field"><span>학부모 연락처</span><input class="in" name="phone" type="tel" inputmode="numeric" placeholder="010-0000-0000" maxlength="13" required></label>
<label class="field"><span>원하는 상담 시간</span><select class="sel" name="time" required><option value="">고르기</option>${slots.map(s => `<option>${esc(s)}</option>`).join("")}<option>전화로 정할게요</option></select></label>
<div class="lv-chip" id="lvChip" hidden></div>
<label class="field"><span>궁금한 점 <em class="muted">(선택)</em></span><textarea class="in" name="memo" maxlength="300" rows="3"></textarea></label>
<div class="consent"><b>개인정보 수집·이용 동의 (필수)</b>
<dl><div><dt>항목</dt><dd class="pl">학생 이름, 학년,
학부모 연락처,
원하는 상담 시간</dd></div><div><dt>목적</dt><dd>상담 연락</dd></div><div><dt>보관</dt><dd>신청일부터 1년, 지나면 지워요.</dd></div></dl>
<p class="muted pl">동의하지 않으셔도 돼요.
그때는 전화로 상담을 신청해 주세요.</p></div>
<label class="check"><input type="checkbox" name="consent" required><span>위 내용을 읽었고 동의해요.</span></label>
<p class="err" id="err" hidden></p>
<button class="btn pri" type="submit">상담 신청 보내기</button>
${isDemo() ? `<p class="muted demo-note">데모 화면이에요. 보낸 신청은 이 브라우저에만 남아요.</p>` : ""}
</form>`, slots.length ? "남겨 주신 시간에 맞춰\n원장님이 직접 전화드려요." : "");
}
function footer(c) {
  return `<footer class="ft"><div class="wrap ft-in"><div><b>${esc(c.name)}</b>${c.address ? `<p>${esc(c.address)}</p>` : ""}${c.regNo ? `<p>${esc(c.regNo)}</p>` : ""}${c.phone ? `<p>${esc(c.phone)}</p>` : ""}</div><a class="ft-admin" href="/admin/">관리자</a></div></footer>`;
}
function dock(c) {
  return `<div class="dock">${c.phone ? `<a class="btn" href="tel:${esc(c.phone.replace(/[^0-9+]/g, ""))}" aria-label="전화하기">${I.phone}전화</a>` : ""}<a class="btn pri" href="#apply">${I.pen}상담 신청</a></div>`;
}

function bindForm(c) {
  const f = document.getElementById("f"); if (!f) return;
  const err = document.getElementById("err");
  f.phone.addEventListener("input", () => {
    const d = f.phone.value.replace(/\D/g, "").slice(0, 11);
    f.phone.value = d.length > 7 ? d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3") : d.length > 3 ? d.slice(0, 3) + "-" + d.slice(3) : d;
  });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f));
    const phone = (v.phone || "").replace(/\D/g, "");
    const bad = !v.name.trim() ? "학생 이름을 적어 주세요." : !v.grade ? "학년을 골라 주세요." : !/^01\d{8,9}$/.test(phone) ? "연락처를 010-0000-0000 모양으로 적어 주세요." : !v.time ? "원하는 상담 시간을 골라 주세요." : !v.consent ? "개인정보 수집·이용에 동의해 주세요." : "";
    if (bad) { err.textContent = bad; err.hidden = false; return; }
    err.hidden = true;
    const b = f.querySelector("button[type=submit]"); b.disabled = true; b.textContent = "보내는 중";
    try {
      await addInquiry({ name: v.name.trim(), grade: v.grade, phone, time: v.time, memo: (v.memo || "").trim(), level: window.__lvResult || "" });
      f.outerHTML = `<div class="card done">${I.ok}<h3>신청을 받았어요</h3><p class="pl muted">${esc(v.time)}에 맞춰
${esc(maskPhone(phone))}로 연락드릴게요.</p></div>`;
    } catch (x) {
      b.disabled = false; b.textContent = "상담 신청 보내기";
      err.textContent = "보내지 못했어요. 잠시 뒤 다시 눌러 주세요."; err.hidden = false;
    }
  });
}

/* ---------- 레벨테스트 ---------- */
function level(c) {
  const q = c.levelQuestions || []; if (!q.length) return "";
  return sec("level", "레벨테스트", `<div class="card lv" id="lv"><div class="lv-start"><div class="lv-meta"><b>${q.length}문항</b><span>약 ${Math.max(1, Math.round(q.length * 0.4))}분</span></div>
<p class="pl muted">풀고 나면 결과와 맞는 반이 나오고,
그 결과로 바로 상담을 신청할 수 있어요.</p><button class="btn pri" id="lvGo">시작하기</button></div></div>`);
}
function bindLevel(c) {
  const box = document.getElementById("lv"); if (!box) return;
  const Q = c.levelQuestions || [], R = (c.levelResults || []).slice().sort((a, b) => (+a.min || 0) - (+b.min || 0));
  let i = 0, score = 0;
  const draw = () => {
    if (i >= Q.length) return result();
    const q = Q[i]; const opts = [q.o1, q.o2, q.o3, q.o4].map((o, k) => [o, k + 1]).filter(x => x[0] !== undefined && x[0] !== "");
    box.innerHTML = `<div class="lv-q"><div class="lv-prog"><span>${i + 1} / ${Q.length}</span><div class="bar-g"><i style="width:${Math.round(i / Q.length * 100)}%"></i></div></div>
<h3 class="pl">${esc(q.q)}</h3><div class="lv-opts">${opts.map(([o, k]) => `<button class="btn lv-o" data-k="${k}"><span class="lv-n">${k}</span><span class="lv-t">${esc(o)}</span></button>`).join("")}</div></div>`;
    box.querySelectorAll(".lv-o").forEach(b => b.onclick = () => { if (+b.dataset.k === +q.a) score++; i++; draw(); });
  };
  const result = () => {
    const r = R.filter(x => score >= (+x.min || 0)).pop() || {};
    const txt = `${score}/${Q.length}점${r.name ? " · " + r.name : ""}${r.cls ? " · 추천 " + r.cls : ""}`;
    box.innerHTML = `<div class="lv-res"><p class="lv-score"><b>${score}</b><span>/ ${Q.length}점</span></p>${r.name ? `<h3>${esc(r.name)}</h3>` : ""}
${r.cls ? `<p class="lv-cls"><span class="tag pri">추천 반</span><b>${esc(r.cls)}</b></p>` : ""}${r.text ? `<p class="pl muted">${esc(r.text)}</p>` : ""}
<div class="lv-act"><button class="btn pri" id="lvApply">이 결과로 상담 신청</button><button class="btn" id="lvAgain">다시 풀기</button></div></div>`;
    document.getElementById("lvAgain").onclick = () => { i = 0; score = 0; draw(); };
    document.getElementById("lvApply").onclick = () => {
      window.__lvResult = txt; const ch = document.getElementById("lvChip");
      if (ch) { ch.innerHTML = `<span class="tag pri">레벨테스트</span><span>${esc(txt)}</span>`; ch.hidden = false; }
      document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
    };
  };
  document.getElementById("lvGo").onclick = draw;
}

/* ---------- 보강 신청 ---------- */
function makeup(c) {
  const cl = (c.classes || []).map(x => x.name);
  return sec("makeup", "보강 신청", `<form class="card form" id="mf" novalidate>
<label class="field"><span>학생 이름</span><input class="in" name="name" maxlength="20" autocomplete="off"></label>
<label class="field"><span>반</span><select class="sel" name="cls"><option value="">고르기</option>${cl.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
<label class="field"><span>빠진 날</span><input class="in" type="date" name="missed"></label>
<label class="field"><span>원하는 보강 시간</span><input class="in" name="want" maxlength="40" placeholder="예: 금요일 16시 이후"></label>
<label class="field"><span>학부모 연락처</span><input class="in" name="phone" type="tel" inputmode="numeric" placeholder="010-0000-0000" maxlength="13"></label>
<div class="consent"><b>개인정보 수집·이용 동의 (필수)</b>
<dl><div><dt>항목</dt><dd class="pl">학생 이름, 반,
학부모 연락처</dd></div><div><dt>목적</dt><dd>보강 일정 연락</dd></div><div><dt>보관</dt><dd>신청일부터 1년, 지나면 지워요.</dd></div></dl></div>
<label class="check"><input type="checkbox" name="consent"><span>위 내용을 읽었고 동의해요.</span></label>
<p class="err" id="merr" hidden></p>
<button class="btn pri" type="submit">보강 신청 보내기</button></form>`, "다니는 학생만 신청할 수 있어요.\n원장님이 시간을 정해 문자로 알려 드려요.");
}
function bindMakeup(c) {
  const f = document.getElementById("mf"); if (!f) return; const err = document.getElementById("merr");
  f.phone.addEventListener("input", () => { const d = f.phone.value.replace(/\D/g, "").slice(0, 11); f.phone.value = d.length > 7 ? d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3") : d.length > 3 ? d.slice(0, 3) + "-" + d.slice(3) : d; });
  f.addEventListener("submit", async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(f)); const phone = (v.phone || "").replace(/\D/g, "");
    const bad = !v.name.trim() ? "학생 이름을 적어 주세요." : !v.cls ? "반을 골라 주세요." : !v.missed ? "빠진 날을 골라 주세요." : !v.want.trim() ? "원하는 보강 시간을 적어 주세요." : !/^01\d{8,9}$/.test(phone) ? "연락처를 010-0000-0000 모양으로 적어 주세요." : !v.consent ? "개인정보 수집·이용에 동의해 주세요." : "";
    if (bad) { err.textContent = bad; err.hidden = false; return; } err.hidden = true;
    const b = f.querySelector("button[type=submit]"); b.disabled = true; b.textContent = "보내는 중";
    try { await addMakeup({ name: v.name.trim(), cls: v.cls, missed: v.missed, want: v.want.trim(), phone });
      f.outerHTML = `<div class="card done">${I.ok}<h3>보강 신청을 받았어요</h3><p class="pl muted">시간을 정해
${esc(maskPhone(phone))}로 알려 드릴게요.</p></div>`;
    } catch (x) { b.disabled = false; b.textContent = "보강 신청 보내기"; err.textContent = "보내지 못했어요. 잠시 뒤 다시 눌러 주세요."; err.hidden = false; }
  });
}
