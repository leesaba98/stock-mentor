/* ============================================================
 * AI 주식 멘토 — 화면 로직 (app.js)
 * ============================================================ */
(function () {
  const D = window.APP_DATA;
  const KD = window.CHART_DATA_KR || {};
  const UD = window.CHART_DATA_US || {};
  // 차트 선택값(US_IXIC·US_INX·US_SOX·US_VIX)으로도 미국 지수를 찾을 수 있게 별칭을 함께 넣습니다
  const UD_ALIAS = {};
  Object.keys(UD).forEach((k) => { UD_ALIAS["US_" + k] = UD[k]; });
  const ALL = Object.assign({}, KD, UD, UD_ALIAS);
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const won = (v) => v.toLocaleString("ko-KR");
  const pct = (v) => (v > 0 ? "+" : "") + v.toFixed(2) + "%";
  const clsPct = (v) => (v > 0 ? "up" : v < 0 ? "down" : "flat");
  const badge5 = (level) => {
    const m = { "active-sell": ["적극 매도", "b-red"], "sell": ["매도", "b-red"], "hold": ["보류", "b-amber"], "buy": ["매수", "b-green"], "active-buy": ["적극 매수", "b-green"] };
    return m[level] || ["-", "b-amber"];
  };

  /* ---------- 탭 전환 ---------- */
  $$(".tabbar button").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".tabbar button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      $$(".tab").forEach((t) => t.classList.remove("on"));
      $("#" + btn.dataset.tab).classList.add("on");
      window.scrollTo(0, 0);
      if (btn.dataset.tab === "tab-chart") setTimeout(resizeChart, 60);
    });
  });

  /* ============================================================
   * 탭 1) 오늘 브리핑
   * ============================================================ */
  function renderBriefing() {
    const b = D.briefing;
    const lv = { rest: "쉼", hold: "관망", selective: "선별", buy: "매수", caution: "경계" }[b.signalLevel] || "";
    $("#signal-banner").className = "signal " + b.signalLevel;
    $("#signal-banner").innerHTML =
      '<div class="sig-top"><span class="sig-ico">🚦</span><span class="sig-label">오늘의 장세 신호등</span></div>' +
      '<div class="sig-name">' + b.signal + ' <small>(' + lv + ')</small></div>' +
      '<div class="sig-sub">' + b.signalHeadline + '</div>' +
      '<ul class="sig-reasons">' + b.signalReasons.map((r) => "<li>" + r + "</li>").join("") + '</ul>' +
      '<div class="sig-note">💡 ' + b.signalColorNote + '</div>';

    $("#idx-cards").innerHTML = D.indices.map((i) =>
      '<div class="idx-card ' + clsPct(i.chgPct || 0) + '">' +
      '<div class="idx-name">' + i.name + ' <span class="idx-date">' + i.date + '</span></div>' +
      '<div class="idx-val">' + (i.unit === "%" ? (+i.val).toFixed(2) : won(+i.val.toFixed(2))) + '<small>' + i.unit + '</small></div>' +
      '<div class="idx-chg">' + (i.chgText || (i.chgPct == null ? "" : pct(i.chgPct) + " (" + (i.chg > 0 ? "+" : i.chg < 0 ? "-" : "") + Math.abs(i.chg).toFixed(2) + (i.unit === "p" ? "p" : i.unit) + ")")) + '</div>' +
      (i.note ? '<div class="idx-note">' + i.note + '</div>' : "") +
      '</div>'
    ).join("");

    $("#macro-summary").innerHTML = D.macro.summary.map((m) =>
      '<div class="macro-item"><span class="tag">' + m.tag + '</span><b>' + m.title + '</b><p>' + m.body + '</p></div>'
    ).join("");

    $("#bottom-check").innerHTML = D.macro.bottomCheck.map((c) =>
      '<li class="' + (c.ok ? "ok" : "warn") + '">' + (c.ok ? "✅" : "⚠️") + " " + c.text + "</li>"
    ).join("") +
    '<li class="src">출처: 한국거래소·네이버 금융 fchart(11/25 국내 종가·OHLC), 네이버 증권 NXT 프리마켓(11/26 08:21 현재가), Ensemble ML(두산/KAI 수급), Yahoo Finance(미 지수·금리·금·유가·환율), 연합뉴스·뉴시스·머니투데이(마감시황·수급), 키움증권 채널(미장 정리), 한국경제·뉴스핌·파이낸셜뉴스(금·유가), 매일경제·한국공정일보(금통위 전망), 머니투데이·글로벌이코노믹(KAI 달 착륙선·민항기), 서울경제(두산 공시)</li>';
  }

  /* ============================================================
   * 탭 2) 내 종목 진단
   * ============================================================ */
  function renderDiagnosis() {
    const wrap = $("#stock-cards");
    wrap.innerHTML = Object.values(D.stocks).map((s) => {
      const [label, cls] = badge5(s.opinion5Level);
      const up = s.chgPct >= 0;
      return (
        '<section class="stock-card" data-code="' + s.code + '">' +
        '<header class="sc-head">' +
        '<div><h3>' + s.name + ' <small>' + s.code + ' · ' + s.market + '</small></h3>' +
        '<div class="sc-price">' + won(s.price) + '원 <span class="' + clsPct(s.chgPct) + '">' + (up ? "▲" : "▼") + " " + won(Math.abs(s.chg)) + " (" + pct(s.chgPct) + ')</span></div>' +
        '<div class="sc-date">' + D.meta.asOf + '</div></div>' +
        '<div class="sc-opinion"><span class="badge5 ' + cls + '">' + label + '</span><small>5단계 의견</small></div>' +
        '</header>' +
        '<p class="sc-tagline">' + s.opinionTagline + '</p>' +
        '<div class="sc-facts">' +
        '<span>시총 ' + s.cap + '</span><span>PER ' + s.per + '</span><span>PBR ' + s.pbr + '</span>' +
        '<span>52주 ' + s.w52 + '</span><span>외국인 지분 ' + s.foreignRate + '</span>' +
        '</div>' +
        '<div class="sc-block"><h4>📈 추세</h4><p>' + s.trend + '</p></div>' +
        '<div class="sc-block"><h4>💰 수급 (외국인·기관)</h4><p>' + s.supply + '</p></div>' +
        '<div class="sc-block levels"><h4>🎯 지지 · 저항 · 손절</h4>' +
        '<table><tr><th>1차 지지</th><td>' + s.levels.support1 + '</td></tr>' +
        '<tr><th>2차 지지</th><td>' + s.levels.support2 + '</td></tr>' +
        '<tr><th>1차 저항</th><td>' + s.levels.resist1 + '</td></tr>' +
        '<tr><th>2차 저항</th><td>' + s.levels.resist2 + '</td></tr>' +
        '<tr class="stop"><th>손절 기준</th><td>' + s.levels.stop + '</td></tr></table></div>' +
        '<div class="sc-block"><h4>🏁 목표가</h4><p><b>단기</b> ' + s.targets.short + '<br><b>장기</b> ' + s.targets.long + '</p></div>' +
        '<div class="sc-block"><h4>✅ 대응 원칙</h4><ol>' + s.principles.map((p) => "<li>" + p + "</li>").join("") + '</ol></div>' +
        '<details class="sc-news"><summary>📰 최신 뉴스 · 리포트 (펼쳐보기)</summary>' +
        s.news.map((n) => '<div class="news-item"><div class="n-head">' + n.date + ' · ' + n.src + '</div><a href="' + n.url + '" target="_blank" rel="noopener">' + n.title + '</a><p>' + n.summary + '</p></div>').join("") +
        '<h4 class="rep-h">증권사 목표가 동향</h4><ul class="rep-list">' + s.reports.map((r) => "<li>" + r + "</li>").join("") + '</ul>' +
        '</details>' +
        '</section>'
      );
    }).join("");
  }

  /* ============================================================
   * 탭 3) 차트·지표
   * ============================================================ */
  const chartState = { code: "034020", tf: "day", showMA: true, showBB: false, showIchi: false };
  const TF_LABEL = { min15: "15분", min60: "60분", day: "일봉", week: "주봉", month: "월봉" };
  const TF_AVAIL = { "034020": ["min15", "min60", "day", "week", "month"], "047810": ["min15", "min60", "day", "week", "month"], KOSPI: ["day"], KOSDAQ: ["day"], US_IXIC: ["day"], US_INX: ["day"], US_SOX: ["day"], US_VIX: ["day"] };
  const CHART_NAMES = { "034020": "두산에너빌리티", "047810": "한국항공우주", KOSPI: "코스피", KOSDAQ: "코스닥", US_IXIC: "나스닥", US_INX: "S&P500", US_SOX: "필라델피아 반도체", US_VIX: "VIX" };

  function aggregateMin(bars, mins) {
    const out = [];
    let cur = null;
    for (const b of bars) {
      const hh = +b[0].slice(9, 11), mm = +b[0].slice(11, 13);
      const day = b[0].slice(0, 8);
      const bucket = Math.floor((hh * 60 + mm) / mins);
      const key = day + "-" + bucket;
      if (!cur || cur.key !== key) {
        if (cur) out.push(cur.bar);
        cur = { key, bar: [b[0].slice(0, 8) + "/" + String(hh).padStart(2, "0") + String(mm - mm % (mins % 60)).padStart(2, "0"), b[1], b[2], b[3], b[4], b[5]] };
      } else {
        cur.bar[2] = Math.max(cur.bar[2], b[2]);
        cur.bar[3] = Math.min(cur.bar[3], b[3]);
        cur.bar[4] = b[4];
        cur.bar[5] += b[5];
      }
    }
    if (cur) out.push(cur.bar);
    return out;
  }

  function chartBars() {
    const { code, tf } = chartState;
    let bars = (ALL[code] || [])[tf === "min15" || tf === "min60" ? "minute" : tf] || [];
    if ((tf === "min15" || tf === "min60") && bars.length) bars = aggregateMin(bars, tf === "min15" ? 15 : 60);
    return bars;
  }

  function renderChart() {
    const { code, tf } = chartState;
    const bars = chartBars();
    const closes = bars.map((b) => b[4]);
    const maN = [5, 20, 60, 120, 240, 480];
    const calc = {};
    maN.forEach((n) => { const a = window.IND.sma(closes, n); if (a.some((v) => v != null)) calc["ma" + n] = a; });
    const bb = window.IND.bb(closes, 20, 2);
    if (bb.up.some((v) => v != null)) { calc.bbUp = bb.up; calc.bbDn = bb.dn; calc.bbMid = bb.mid; }
    const ich = window.IND.ichimoku(bars);
    if (ich.conv.some((v) => v != null)) { calc.conv = ich.conv; calc.base = ich.base; calc.spanA = ich.spanA; calc.spanB = ich.spanB; }

    const showMA = chartState.showMA && (tf === "day" || tf === "week" || tf === "month");
    window.MChart.draw($("#chart-canvas"), bars, tf, {
      calc, volume: true,
      showMA, showBB: chartState.showBB, showIchimoku: chartState.showIchi,
    });
    $("#chart-title").textContent = CHART_NAMES[code] + " · " + TF_LABEL[tf];

    // 지표 배지
    renderBadges(bars, closes, calc);
  }

  function renderBadges(bars, closes, calc) {
    const last = closes[closes.length - 1];
    const items = [];
    const tf = chartState.tf;

    // MA
    if (tf === "day" || tf === "week" || tf === "month") {
      for (const n of [5, 20, 60, 120, 240, 480]) {
        const arr = calc["ma" + n];
        if (!arr || arr[arr.length - 1] == null) continue;
        const v = arr[arr.length - 1];
        const above = last >= v;
        items.push({
          name: "이동평균 " + n + "일선",
          badge: above ? "🟢" : "🔴",
          text: "현재가 " + won(Math.round(last)) + "원은 " + n + "일선(" + won(Math.round(v)) + "원) " + (above ? "위 — 단기 순풍" : "아래 — 단기 역풍"),
        });
      }
    } else {
      items.push({ name: "이동평균선", badge: "🟡", text: "분봉 화면에서는 이동평균 배지를 일봉 이상에서 확인하세요" });
    }

    // 일목균형표
    if (tf === "day" || tf === "week" || tf === "month") {
      const { conv, base, spanA, spanB } = calc;
      if (conv && conv[conv.length - 1] != null) {
        const c1 = conv[conv.length - 1];
        const st = spanA && spanB && spanA[spanA.length - 1] != null ? (spanA[spanA.length - 1] + spanB[spanB.length - 1]) / 2 : null;
        const aboveCloud = st != null ? last > st : null;
        const bull = last >= c1 && (aboveCloud !== false);
        items.push({
          name: "일목균형표",
          badge: aboveCloud === null ? "🟡" : bull ? "🟢" : "🔴",
          text: "기준선 " + won(Math.round(c1)) + "원 " + (last >= c1 ? "상회" : "이탈") + (aboveCloud === null ? "" : aboveCloud ? ", 구름대 위 — 추세 양호" : ", 구름대 아래 — 추세 약세"),
        });
      }
    } else {
      items.push({ name: "일목균형표", badge: "🟡", text: "일봉 이상에서 확인하세요" });
    }

    // 볼린저
    if (calc.bbUp && calc.bbUp[calc.bbUp.length - 1] != null) {
      const u = calc.bbUp[calc.bbUp.length - 1], d = calc.bbDn[calc.bbDn.length - 1], m = calc.bbMid[calc.bbMid.length - 1];
      const pos = (last - d) / (u - d);
      const badge = pos > 0.95 ? "🔴" : pos < 0.05 ? "🟢" : "🟡";
      const txt = pos > 0.95 ? "상단 밴드 접근 — 단기 과열, 눌림 대기" : pos < 0.05 ? "하단 밴드 접근 — 단기 과매도, 반등 시도 구간" : "밴드 중심(" + won(Math.round(m)) + "원) 기준 " + Math.round(pos * 100) + "% 위치 — 방향 관찰";
      items.push({ name: "볼린저밴드(20,2)", badge, text: txt });
    }

    // DMI
    const tfBars = bars;
    if (tfBars.length > 40) {
      const d = window.IND.dmi(tfBars);
      const i = tfBars.length - 1;
      if (d.plusDI[i] != null && d.adx[i] != null) {
        const pdi = d.plusDI[i], mdi = d.minusDI[i], adx = d.adx[i];
        const strong = adx > 25;
        items.push({
          name: "DMI / ADX",
          badge: pdi > mdi ? "🟢" : "🔴",
          text: "+DI " + pdi.toFixed(1) + " vs -DI " + mdi.toFixed(1) + (pdi > mdi ? " (상승 우위)" : " (하락 우위)") + ", ADX " + adx.toFixed(1) + (strong ? " — 추세 힘이 있음" : " — 추세 약함(횡보 성향)"),
        });
      }
    }

    // CCI
    if (tfBars.length > 25) {
      const cc = window.IND.cci(tfBars);
      const v = cc[cc.length - 1];
      if (v != null) {
        items.push({
          name: "CCI(20)",
          badge: v > 100 ? "🔴" : v < -100 ? "🟢" : "🟡",
          text: "CCI " + v.toFixed(1) + (v > 100 ? " — 과열 구간, 차익실현 매물 주의" : v < -100 ? " — 과매도 구간, 반등 대기" : " — 중립 구간"),
        });
      }
    }

    // RSI
    if (closes.length > 20) {
      const r = window.IND.rsi(closes);
      const v = r[r.length - 1];
      if (v != null) {
        items.push({
          name: "RSI(14)",
          badge: v >= 70 ? "🔴" : v <= 30 ? "🟢" : "🟡",
          text: "RSI " + v.toFixed(1) + (v >= 70 ? " — 과열(70 이상)" : v <= 30 ? " — 과매도(30 이하)" : " — 중립 30~70"),
        });
      }
    }

    // MACD
    if (closes.length > 40) {
      const mc = window.IND.macd(closes);
      const i = closes.length - 1;
      if (mc.line[i] != null && mc.signal[i] != null) {
        const bull = mc.line[i] > mc.signal[i];
        const zero = mc.line[i] > 0;
        items.push({
          name: "MACD(12,26,9)",
          badge: bull ? "🟢" : "🔴",
          text: "MACD가 시그널 " + (bull ? "위(골든크로스 상태)" : "아래(데드크로스 상태)") + ", 0선 " + (zero ? "위 — 상승 모멘텀" : "아래 — 하락 모멘텀"),
        });
      }
    }

    // 거래량
    if (bars.length > 10) {
      const v5 = bars.slice(-5).reduce((s, b) => s + b[5], 0) / 5;
      const v20 = bars.slice(-20).reduce((s, b) => s + b[5], 0) / Math.min(20, bars.length);
      const hot = v5 > v20 * 1.5;
      items.push({
        name: "거래량",
        badge: hot ? "🟢" : "🟡",
        text: "최근 5일 평균 거래량이 20일 평균 대비 " + Math.round(v5 / v20 * 100) + "% — " + (hot ? "관심 집중, 수급 움직임 주목" : "평이한 수준"),
      });
    }

    // 수급
    const flow = D.flows[chartState.code];
    if (flow) {
      const bad = flow.sum20.frgn.startsWith("-") && flow.sum20.inst.startsWith("-");
      items.push({
        name: "외국인·기관 수급(20일)",
        badge: bad ? "🔴" : "🟢",
        text: "외국인 " + flow.sum20.frgn + " / 기관 " + flow.sum20.inst + " (최근 5일: 외국인 " + flow.sum5.frgn + ", 기관 " + flow.sum5.inst + ")",
      });
    }

    $("#ind-list").innerHTML = items.map((it) =>
      '<div class="ind-item"><span class="ind-badge">' + it.badge + '</span><b>' + it.name + '</b><p>' + it.text + '</p></div>'
    ).join("");
  }

  function buildChartSelectors() {
    const codes = Object.keys(TF_AVAIL);
    $("#sel-stock").innerHTML = codes.map((c) => '<option value="' + c + '"' + (c === chartState.code ? " selected" : "") + ">" + CHART_NAMES[c] + "</option>").join("");
    $("#sel-stock").addEventListener("change", (e) => {
      chartState.code = e.target.value;
      const avail = TF_AVAIL[chartState.code];
      if (!avail.includes(chartState.tf)) chartState.tf = avail[avail.length - 1];
      buildTFButtons();
      renderChart();
    });
    buildTFButtons();
    $("#btn-ma").addEventListener("click", (e) => { chartState.showMA = !chartState.showMA; e.target.classList.toggle("on", chartState.showMA); renderChart(); });
    $("#btn-bb").addEventListener("click", (e) => { chartState.showBB = !chartState.showBB; e.target.classList.toggle("on", chartState.showBB); renderChart(); });
    $("#btn-ichi").addEventListener("click", (e) => { chartState.showIchi = !chartState.showIchi; e.target.classList.toggle("on", chartState.showIchi); renderChart(); });
    $("#btn-ma").classList.add("on");
  }
  function buildTFButtons() {
    const avail = TF_AVAIL[chartState.code];
    $("#tf-buttons").innerHTML = ["min15", "min60", "day", "week", "month"].map((tf) =>
      '<button class="tf' + (chartState.tf === tf ? " on" : "") + '" data-tf="' + tf + '"' + (avail.includes(tf) ? "" : " disabled") + ">" + TF_LABEL[tf] + "</button>"
    ).join("");
    $$("#tf-buttons .tf").forEach((b) => b.addEventListener("click", () => {
      if (b.disabled) return;
      chartState.tf = b.dataset.tf;
      buildTFButtons();
      renderChart();
    }));
  }
  function resizeChart() { renderChart(); }
  window.addEventListener("resize", () => { if ($("#tab-chart").classList.contains("on")) resizeChart(); });

  /* ============================================================
   * 탭 4) 추천·수익률
   * ============================================================ */
  function renderRecs() {
    const R = D.recommendations;
    $("#rec-note-head").textContent = R.asOf;
    $("#rec-cards").innerHTML = R.items.map((r, i) =>
      '<div class="rec-card">' +
      '<h3>' + (i + 1) + '. ' + r.name + ' <small>' + r.code + ' · ' + r.market + '</small></h3>' +
      '<p class="rec-why">' + r.why + '</p>' +
      '<p class="rec-fun">📊 ' + r.fundamentals + '</p>' +
      '<p class="rec-risk">⚠️ 리스크: ' + r.risk + '</p>' +
      '</div>'
    ).join("");
    $("#rec-tbody").innerHTML = R.items.map((r) => {
      const ret = r.nowPrice && r.recPrice ? (r.nowPrice / r.recPrice - 1) * 100 : 0;
      const pfmt = (v) => v < 1000 ? v.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : won(v);
      return '<tr><td>' + r.name + '</td><td>' + r.recDate + '</td><td>' + pfmt(r.recPrice) + '</td><td>' + pfmt(r.nowPrice) + '</td><td class="' + clsPct(ret) + '">' + pct(ret) + '</td></tr>';
    }).join("") +
    '<tr class="total"><td colspan="5">누적 평균 수익률: ' + pct(R.items.reduce((s, r) => s + (r.nowPrice / r.recPrice - 1) * 100, 0) / R.items.length) + ' (추천일 이후)</td></tr>';
    $("#rec-note").textContent = R.note;
  }

  /* ============================================================
   * 탭 5) Q&A
   * ============================================================ */
  const QA_KEY = "stock-mentor-qa-v1";
  function loadQA() { try { return JSON.parse(localStorage.getItem(QA_KEY)) || []; } catch (e) { return []; } }
  function saveQA(list) { localStorage.setItem(QA_KEY, JSON.stringify(list.slice(0, 50))); }

  function answerFor(q) {
    const t = q.toLowerCase();
    const has = (...ws) => ws.some((w) => t.includes(w));
    if (has("안녕", "하이", "하삼")) return "안녕하세요, 상봉 님 😊 아래에 궁금한 점을 적어두시면 다음 아침 업데이트 때 함께 확인해 드릴게요.";
    if (has("손절")) return "손절 원칙 요약(11/25 종가 기준) — 두산에너빌리티: 11/25 종가 40,000원으로 손절선 42,400원과 잔여분 정리선 40,900원을 모두 이탈해 원칙상 '정리' 단계입니다. 오늘 08:21 프리마켓은 40,400원(+1.00%)으로 40,900원 아래입니다. 오늘 종가가 42,400원 위로 올라오면 '보류'로 되돌립니다. / 한국항공우주: 11/25 종가 98,100원으로 축소선 99,000원을 이탈해 '1차 축소' 단계입니다. 오늘 종가가 99,000원 위면 '보류' 복귀, 94,000원(52주 최저) 아래면 손절입니다. 기준은 장중 터치가 아니라 종가입니다.";
    if (has("두산", "원전", "에너빌")) return "두산에너빌리티는 11/25 40,000원(-2,850, -6.65%)으로 마감해 종가로 손절선 42,400원과 잔여분 정리선 40,900원을 내줬습니다. 외국인 -235,172주(순매도 전환)·기관 +4,626주(3거래일 연속 순매수)였습니다. 5일선 41,420원·20일선 46,730원·60일선 67,147원이고, 오늘 08:21 프리마켓은 40,400원(+1.00%)입니다. 회사 고유 악재가 아니라 AI 인프라·기계 업종 매물이었고(효성중공업 -8.79%), 3분기 영업이익 2,612억원(+90.6%)·수주잔고 26조 5,805억원의 실적 재료는 그대로입니다. 오늘 종가 42,400원 회복 여부가 판단 기준이고, 38,000원(52주 최저)이 마지막 방어선입니다. 자세한 진단은 '내 종목 진단' 탭에 있습니다.";
    if (has("항공", "방산", "kai", "케이에이")) return "한국항공우주는 11/25 98,100원(-1,700, -1.70%)으로 마감해 종가로 축소선 99,000원을 내줬습니다(코스피 -6.16% 대비 선방). 기관은 +22,360주로 11거래일 연속 순매수, 외국인은 -13,155주로 10거래일 연속 매도입니다. 5일선 99,060원·20일선 102,000원이고, 오늘 08:21 프리마켓은 99,600원(+1.53%)으로 다시 99,000원 위입니다. 11/25 달 착륙선 본체 구조계 150억원 수주, 인도네시아 PTDI 민항기 MOU, 경남 5년 1조 5,000억원 투자협약이 재료입니다. 오늘 종가 99,000원 사수 여부가 기준이고, F414 엔진 공급 병목이 여전히 변수입니다.";
    if (has("엔비디아", "젠슨", "nvda")) return "엔비디아는 11/25(현지) -3.91%로 3거래일째 약세입니다. 장중 9% 넘게 밀렸다가 낙폭을 줄였고, 필라델피아 반도체지수는 -0.65%(8,774.86)로 4거래일 연속 약세입니다. 마이크론 투자의견 하향(목표 775달러)과 2028년 메모리 공급과잉 경고, S&P글로벌의 엔비디아 신용등급 강등 검토 보도가 부담이었습니다. 나스닥은 장중 -4.6%에서 -0.62%로 마감했습니다. 12/3 황 CEO 상원 청문회와 GTC가 다음 변수입니다.";
    if (has("환율", "달러")) return "원/달러는 11/25 서울 종가 1,343.2원(+0.8원), 역외 1,343.38원입니다. 1,340원대 초반에서 안정된 흐름입니다. 원화 약세는 외국인 자금 유출 압력이지만, JPM 같은 달러 자산의 원화 환산 수익에는 유리합니다. 오늘 금통위가 3.25%로 인상하고 미국이 12월 인상하면 금리차가 유지돼 1,350원대를 시험할 수 있습니다.";
    if (has("사도", "매수", "살까", "추가", "물타")) return "오늘 신호등은 '경계'입니다. 어제 코스피 -6.16% 폭락으로 두산에너빌리티(40,000원)·한국항공우주(98,100원)가 종가 기준선(42,400·99,000)을 내줬습니다. 오늘 08:21 프리마켓은 두산 40,400원(+1.00%)·KAI 99,600원(+1.53%)으로 반등 출발이지만, 세 가지가 확인되기 전에는 사지 마십시오 — ① 두산 종가 42,400원 회복 ② KAI 종가 99,000원 회복 ③ 외국인 코스피 순매수 전환. 폭락 다음 날 첫 반등은 추세가 아니라 반사인 경우가 많습니다.";
    if (has("사자", "주식 사자", "코인", "비트코인")) return "암호화폐는 이 앱이 다루는 범위가 아니고 변동성이 매우 큽니다. 오늘 증시 신호등은 '경계' — 코스피 -6.16% 폭락과 12월 금리 인상 우려로 변동성이 큰 구간이고, 두산 42,400원·KAI 99,000원을 종가로 되찾는지 확인한 뒤에 움직이는 자리입니다.";
    if (has("코스피", "시장", "증시", "장세")) return "코스피 4,697.51(-6.16%, 11/25), 코스닥 650.64(-2.29%)입니다. 09:08 매도 사이드카가 발동됐고, 외국인 -1조9,097억·기관 -29억·개인 +1조4,255억이었습니다. 원인은 마이크론 목표주가 하향에 따른 반도체 투매(삼성전자 -9.87%·SK하이닉스 -11.05%)와 미국의 14개국 과잉생산 관세안입니다. 간밤 미장은 장중 낙폭을 대부분 만회했고(나스닥 -0.62%), 오늘 08:21 프리마켓은 두산·KAI가 반등 출발입니다. 오늘은 10:30 금통위와 오후 수급이 방향을 가릅니다.";
    if (has("금리", "fomc", "연준")) return "미 10년물은 11/25 4.848%(-5.6bp)입니다. 10월 PCE가 헤드라인 3.8%·근원 3.3%(예상 3.2% 상회), 3분기 GDP가 4.3%로 상향되며 12월 8~9일 FOMC 25bp 인상(4.00~4.25%)이 기정사실화됐습니다. 오늘 10:30경 한은 금통위가 3.00%→3.25% 인상을 결정할 전망이고(11:10 기자간담회), 수정 경제전망·점도표에서 내년 3.50% 경로가 나오는지가 핵심입니다. 미국 증시는 오늘 추수감사절 휴장, 27일 조기 폐장입니다.";
    return null;
  }

  function renderQA() {
    const list = loadQA();
    $("#qa-list").innerHTML = list.length
      ? list.map((it, i) =>
        '<div class="qa-item"><div class="qa-q"><span>❓</span><b>' + esc(it.q) + '</b><button class="qa-del" data-i="' + i + '" aria-label="삭제">🗑️</button></div>' +
        '<div class="qa-a">' + esc(it.a) + '</div><div class="qa-date">' + it.d + '</div></div>'
      ).join("")
      : '<div class="qa-empty">아직 질문이 없습니다. 궁금한 점을 적어 등록해 보세요.<br>예: "두산에너빌리티 손절선 얼마야?"</div>';
    $$("#qa-list .qa-del").forEach((b) => b.addEventListener("click", () => {
      const list2 = loadQA(); list2.splice(+b.dataset.i, 1); saveQA(list2); renderQA();
    }));
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function initQA() {
    $("#qa-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = $("#qa-input");
      const q = inp.value.trim();
      if (!q) return;
      const a = answerFor(q) ||
        "좋은 질문입니다. 이 앱은 증시 브리핑·보유 종목 진단·지표 확인·추천 성과를 매일 아침 업데이트해 드립니다. 질문을 남겨두시면 다음 업데이트 때 확인해 답해 드릴게요. (매매 판단과 책임은 투자자 본인에게 있습니다)";
      const list = loadQA();
      list.unshift({ q, a, d: new Date().toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) });
      saveQA(list);
      inp.value = "";
      renderQA();
    });
    $("#qa-notice").textContent = "📌 " + D.qaDefaults.morningNotice;
    $("#qa-disclaimer").textContent = "⚠️ " + D.qaDefaults.disclaimer;
    renderQA();
  }

  /* ---------- init ---------- */
  renderBriefing();
  renderDiagnosis();
  buildChartSelectors();
  renderChart();
  renderRecs();
  initQA();
  $("#build-date").textContent = D.meta.generatedAt + " · " + D.meta.asOf + " · " + D.meta.buildNote;
})();
