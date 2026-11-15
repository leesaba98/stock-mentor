/* ============================================================
 * AI 주식 멘토 — 화면 로직 (app.js)
 * ============================================================ */
(function () {
  const D = window.APP_DATA;
  const KD = window.CHART_DATA_KR || {};
  const UD = window.CHART_DATA_US || {};
  const ALL = Object.assign({}, KD, UD);
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
      '<div class="idx-val">' + won(+i.val.toFixed(2)) + '<small>' + i.unit + '</small></div>' +
      '<div class="idx-chg">' + (i.chgPct == null ? "" : pct(i.chgPct) + " (" + (i.chg > 0 ? "+" : "") + won(+Math.abs(i.chg).toFixed(2)) + (i.unit === "p" ? "p" : i.unit) + ")") + '</div>' +
      (i.note ? '<div class="idx-note">' + i.note + '</div>' : "") +
      '</div>'
    ).join("");

    $("#macro-summary").innerHTML = D.macro.summary.map((m) =>
      '<div class="macro-item"><span class="tag">' + m.tag + '</span><b>' + m.title + '</b><p>' + m.body + '</p></div>'
    ).join("");

    $("#bottom-check").innerHTML = D.macro.bottomCheck.map((c) =>
      '<li class="' + (c.ok ? "ok" : "warn") + '">' + (c.ok ? "✅" : "⚠️") + " " + c.text + "</li>"
    ).join("") +
    '<li class="src">출처: 연합뉴스(11/13 시황·환율), 매일신문(11/14 금리), 키움증권 FICC Daily(11/13), NVIDIA 공식 발표(11/12), CNBC(11/13), 네이버증권 시세</li>';
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
    if (has("손절")) return "손절 원칙 요약 — 두산에너빌리티: 종가 44,000원 이탈 시 축소, 42,400원 이탈 시 손절 / 한국항공우주: 종가 99,000원 이탈 시 축소, 94,000원 이탈 시 손절. 선을 정하면 그 선을 지키는 것이 가장 중요합니다.";
    if (has("두산", "원전", "에너빌")) return "두산에너빌리티(47,150원, 11/13)는 '보류' 의견입니다. 52주 최저 42,450원에서 5일 연속 반등 중이지만 기관은 3일 연속 순매도. 48,850~50,000원 저항 돌파 확인 전엔 추격 매수 금지, 자세한 진단은 '내 종목 진단' 탭을 참고하세요.";
    if (has("항공", "방산", "kai", "케이에이")) return "한국항공우주(104,500원, 11/13)도 '보류'입니다. 실적·수주잔고(26.3조)는 좋아지지만 목표가 하향 행진과 수주 미달(21.2%)이 걸림돌. 109,700원 저항과 99,000원 지지 사이 움직임을 지켜보세요.";
    if (has("엔비디아", "젠슨", "nvda")) return "엔비디아는 젠슨 황 CEO 사임(11/12) 후 크레스 CFO가 임시 CEO. 11/17(화) 3분기 실적 발표(한국시간 11/18 새벽)가 최대 변수입니다. 국내 AI주(삼성전자·SK하이닉스)도 이 결과에 영향을 받으니 발표 전 신규 매수는 조심스럽게 접근하세요.";
    if (has("환율", "달러")) return "원/달러는 11/13 기준 1,336.7원(+6.0원)으로 닷새 만에 반등했습니다. 달러인덱스가 1년 7개월 만에 최고치라 강달러 기조 — 환율 상승은 외국인 수급에 부담이 될 수 있어 주의 깊게 볼 지표입니다.";
    if (has("사도", "매수", "살까", "추가", "물타")) return "오늘 신호등은 '관망의 날'입니다. 엔비디아 실적(11/17)과 12월 FOMC 앞에서 신규 매수는 조금씩, 반등 확인 후 분할이 원칙입니다. 보유 종목 대응은 '내 종목 진단' 탭의 대응 원칙을 따라 주세요.";
    if (has("사자", "주식 사자", "코인", "비트코인")) return "암호화폐는 이 앱의 다루는 범위가 아니고 변동성이 매우 큽니다. 오늘 증시 신호등은 '관망의 날' — 지금은 지켜보는 구간입니다.";
    if (has("코스피", "시장", "증시", "장세")) return "코스피 5,290.53(-0.98%, 11/13). 지난주 +4.56% 급등 뒤 외국인 되파기가 나왔고, 오늘 신호등은 '관망의 날'입니다. 브리핑 탭의 바닥·리스크 체크리스트를 확인해 보세요.";
    if (has("금리", "fomc", "연준")) return "12/8~9 FOMC(한국시간 12/10 새벽 4시 발표)에서 금리 인상 확률이 시장 기준 사실상 100%입니다. 1월 연속 인상 가능성도 반영 중이고 미 10년물은 5.15%까지 올라 있습니다.";
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
