/* ============================================================
 * AI 주식 멘토 — 캔버스 차트 렌더러 (chart.js)
 * 캔들 + 이동평균 + 거래량, 지표 오버레이를 하나의 캔버스에 그립니다.
 * 의존성 없음(바닐라), 모바일 세로 폭 최적화.
 * ============================================================ */
window.MChart = (function () {
  const CSS = getComputedStyle(document.documentElement);
  const C = {
    up: "#3fbf75", down: "#e05555",
    ma5: "#ffd166", ma20: "#4cc9f0", ma60: "#b28dff", ma120: "#f48ab5", ma240: "#9ef01a", ma480: "#e8a87c",
    grid: "rgba(255,255,255,0.08)", axis: "rgba(255,255,255,0.45)",
    volUp: "rgba(63,191,117,0.45)", volDown: "rgba(224,85,85,0.45)",
    cloudUp: "rgba(63,191,117,0.12)", cloudDn: "rgba(224,85,85,0.12)",
    bb: "rgba(140,190,255,0.55)", bbFill: "rgba(140,190,255,0.07)",
    signal: "#ffd166", sigUp: "#4cc9f0", sigDn: "#f48ab5",
  };

  function fmt(v) {
    if (v >= 10000000) return (v / 10000).toFixed(1).replace(/\.0$/, "") + "만";
    if (v >= 10000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "천";
    if (v >= 1000) return Math.round(v).toLocaleString("ko-KR");
    return v.toFixed(v < 10 ? 2 : 1);
  }
  function tLabel(t, timeframe) {
    if (timeframe === "minute") return t.slice(4, 6) + "/" + t.slice(6, 8) + " " + t.slice(9, 11) + "시";
    if (timeframe === "day") return t.slice(4, 6) + "/" + t.slice(6, 8);
    if (timeframe === "week") return t.slice(2, 4) + "년 " + t.slice(4, 6) + "주";
    return t.slice(0, 4) + "-" + t.slice(4, 6);
  }

  /**
   * opts: { overlays:{ma:true, bb:true, ichimoku:true}, volume:true }
   * bars: [t,o,h,l,c,v]
   */
  function draw(canvas, bars, timeframe, opts) {
    opts = opts || {};
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || canvas.parentElement.clientWidth;
    const H = canvas.clientHeight || 300;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const padR = 8, padL = 2, padT = 6, padB = 26;
    const volH = opts.volume ? 44 : 0;
    const plotH = Math.max(60, H - padT - padB - volH);
    const plotW = Math.max(60, W - padL - padR - 46);

    const n = bars.length;
    if (!n) { ctx.fillStyle = "#8899bb"; ctx.font = "14px sans-serif"; ctx.fillText("데이터 없음", 12, 40); return; }

    let hi = -Infinity, lo = Infinity, vmax = 0;
    for (const b of bars) {
      hi = Math.max(hi, b[2]); lo = Math.min(lo, b[3]);
      if (opts.volume) vmax = Math.max(vmax, b[5]);
    }
    // 지표 값도 범위에 포함
    const extra = [];
    if (opts.calc) {
      const cl = opts.calc;
      for (const arr of [cl.ma5, cl.ma20, cl.ma60, cl.ma120, cl.ma240, cl.ma480, cl.bbUp, cl.bbDn, cl.bbMid, cl.conv, cl.base, cl.spanA, cl.spanB]) {
        if (!arr) continue;
        for (const v of arr) if (v != null && v > lo * 0.5 && v < hi * 2) { hi = Math.max(hi, v); lo = Math.min(lo, v); }
      }
    }
    const span = hi - lo || 1;
    hi += span * 0.05; lo -= span * 0.05;
    const y = (v) => padT + (hi - v) / (hi - lo) * plotH;
    const bw = plotW / n;
    const x = (i) => padL + i * bw + bw / 2;

    // 그리드 + 가격 축
    ctx.strokeStyle = C.grid; ctx.fillStyle = C.axis; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    const steps = 4;
    for (let g = 0; g <= steps; g++) {
      const v = lo + (hi - lo) * g / steps;
      const yy = y(v);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(padL + plotW, yy); ctx.stroke();
      ctx.fillText(fmt(v), padL + plotW + 6, yy + 3);
    }

    // 일목구름
    if (opts.calc && opts.calc.spanA && opts.showIchimoku) {
      const { spanA, spanB } = opts.calc;
      for (let i = 1; i < n; i++) {
        if (spanA[i] == null || spanB[i] == null || spanA[i - 1] == null || spanB[i - 1] == null) continue;
        ctx.fillStyle = spanA[i] >= spanB[i] ? C.cloudUp : C.cloudDn;
        ctx.beginPath();
        ctx.moveTo(x(i - 1), y(spanA[i - 1])); ctx.lineTo(x(i), y(spanA[i]));
        ctx.lineTo(x(i), y(spanB[i])); ctx.lineTo(x(i - 1), y(spanB[i - 1]));
        ctx.closePath(); ctx.fill();
      }
    }

    // 볼린저밴드
    if (opts.calc && opts.calc.bbUp && opts.showBB) {
      const { bbUp, bbDn } = opts.calc;
      const path = (arr) => {
        ctx.beginPath(); let started = false;
        for (let i = 0; i < n; i++) { if (arr[i] == null) continue; started ? ctx.lineTo(x(i), y(arr[i])) : (ctx.moveTo(x(i), y(arr[i])), started = true); }
      };
      path(bbUp); ctx.lineTo(x(n - 1), y(bbDn[n - 1] ?? 0));
      for (let i = n - 1; i >= 0; i--) { if (bbDn[i] == null) continue; ctx.lineTo(x(i), y(bbDn[i])); }
      ctx.closePath(); ctx.fillStyle = C.bbFill; ctx.fill();
      ctx.strokeStyle = C.bb; ctx.lineWidth = 1;
      path(bbUp); ctx.stroke(); path(bbDn); ctx.stroke();
    }

    // 캔들
    const cw = Math.max(1.5, bw * 0.62);
    for (let i = 0; i < n; i++) {
      const [t, o, h, l, c] = bars[i];
      const up = c >= o;
      ctx.strokeStyle = up ? C.up : C.down;
      ctx.fillStyle = up ? C.up : C.down;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x(i), y(h)); ctx.lineTo(x(i), y(l)); ctx.stroke();
      const yo = y(o), yc = y(c);
      const top = Math.min(yo, yc), hgt = Math.max(1, Math.abs(yc - yo));
      ctx.fillRect(x(i) - cw / 2, top, cw, hgt);
    }

    // 이동평균
    if (opts.calc && opts.showMA) {
      const mas = [["ma5", C.ma5], ["ma20", C.ma20], ["ma60", C.ma60], ["ma120", C.ma120], ["ma240", C.ma240], ["ma480", C.ma480]];
      for (const [k, col] of mas) {
        const arr = opts.calc[k]; if (!arr) continue;
        ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath();
        let started = false;
        for (let i = 0; i < n; i++) {
          if (arr[i] == null) continue;
          started ? ctx.lineTo(x(i), y(arr[i])) : (ctx.moveTo(x(i), y(arr[i])), started = true);
        }
        ctx.stroke();
      }
    }

    // 거래량
    if (opts.volume) {
      const vy0 = H - padB - volH;
      for (let i = 0; i < n; i++) {
        const [t, o, h, l, c, v] = bars[i];
        const vh = vmax ? (v / vmax) * (volH - 6) : 0;
        ctx.fillStyle = c >= o ? C.volUp : C.volDown;
        ctx.fillRect(x(i) - cw / 2, vy0 + (volH - 6 - vh) + 6, cw, vh);
      }
    }

    // X축 라벨
    ctx.fillStyle = C.axis; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(n / 6));
    for (let i = 0; i < n; i += step) ctx.fillText(tLabel(bars[i][0], timeframe), x(i), H - 8);

    // 마지막가 라벨
    const last = bars[n - 1];
    ctx.fillStyle = last[4] >= last[1] ? C.up : C.down;
    ctx.fillRect(padL + plotW + 4, y(last[4]) - 8, 44, 16);
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(fmt(last[4]), padL + plotW + 7, y(last[4]) + 3);
  }

  return { draw, fmt };
})();
