/* ============================================================
 * AI 주식 멘토 — 지표 계산 엔진 (indicators.js)
 * 캔들 배열 [t, o, h, l, c, v] 를 받아 지표 배열을 반환합니다.
 * ============================================================ */
window.IND = (function () {
  const closes = (b) => b.map((x) => x[4]);
  const highs = (b) => b.map((x) => x[2]);
  const lows = (b) => b.map((x) => x[3]);

  function sma(vals, n) {
    const out = new Array(vals.length).fill(null);
    let sum = 0;
    for (let i = 0; i < vals.length; i++) {
      sum += vals[i];
      if (i >= n) sum -= vals[i - n];
      if (i >= n - 1) out[i] = sum / n;
    }
    return out;
  }
  function ema(vals, n) {
    const out = new Array(vals.length).fill(null);
    const k = 2 / (n + 1);
    let prev = null;
    for (let i = 0; i < vals.length; i++) {
      if (i === n - 1) {
        let s = 0;
        for (let j = 0; j < n; j++) s += vals[j];
        prev = s / n;
        out[i] = prev;
      } else if (i >= n) {
        prev = vals[i] * k + prev * (1 - k);
        out[i] = prev;
      }
    }
    return out;
  }

  // RSI (Wilder)
  function rsi(vals, n = 14) {
    const out = new Array(vals.length).fill(null);
    let avgG = 0, avgL = 0;
    for (let i = 1; i < vals.length; i++) {
      const d = vals[i] - vals[i - 1];
      const g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
      if (i <= n) {
        avgG += g / n; avgL += l / n;
        if (i === n) out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
      } else {
        avgG = (avgG * (n - 1) + g) / n;
        avgL = (avgL * (n - 1) + l) / n;
        out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
      }
    }
    return out;
  }

  // MACD (12/26/9)
  function macd(vals) {
    const f = ema(vals, 12), s = ema(vals, 26);
    const line = vals.map((_, i) => (f[i] != null && s[i] != null ? f[i] - s[i] : null));
    const valid = line.map((v) => (v == null ? 0 : v));
    const sig = ema(valid, 9);
    const sigOut = line.map((v, i) => (v == null ? null : sig[i]));
    const hist = line.map((v, i) => (v == null || sigOut[i] == null ? null : v - sigOut[i]));
    return { line, signal: sigOut, hist };
  }

  // 볼린저밴드 (20, 2)
  function bb(vals, n = 20, mult = 2) {
    const mid = sma(vals, n);
    const up = new Array(vals.length).fill(null);
    const dn = new Array(vals.length).fill(null);
    for (let i = n - 1; i < vals.length; i++) {
      let s = 0;
      for (let j = i - n + 1; j <= i; j++) s += Math.pow(vals[j] - mid[i], 2);
      const sd = Math.sqrt(s / n);
      up[i] = mid[i] + mult * sd;
      dn[i] = mid[i] - mult * sd;
    }
    return { mid, up, dn };
  }

  // DMI / ADX (14)
  function dmi(bars, n = 14) {
    const plusDI = new Array(bars.length).fill(null);
    const minusDI = new Array(bars.length).fill(null);
    const adx = new Array(bars.length).fill(null);
    const tr = [], pdm = [], mdm = [];
    for (let i = 1; i < bars.length; i++) {
      const h = bars[i][2], l = bars[i][3], pc = bars[i - 1][4], ph = bars[i - 1][2], pl = bars[i - 1][3];
      tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
      pdm.push(Math.max(h - ph, 0) > Math.max(pl - l, 0) ? Math.max(h - ph, 0) : 0);
      mdm.push(Math.max(pl - l, 0) > Math.max(h - ph, 0) ? Math.max(pl - l, 0) : 0);
    }
    let strTr = 0, sP = 0, sM = 0, dxArr = [];
    for (let i = 0; i < tr.length; i++) {
      if (i < n) { strTr += tr[i]; sP += pdm[i]; sM += mdm[i]; }
      else {
        strTr = strTr - strTr / n + tr[i];
        sP = sP - sP / n + pdm[i];
        sM = sM - sM / n + mdm[i];
      }
      if (i >= n - 1) {
        const idx = i + 1;
        const pDI = strTr === 0 ? 0 : (100 * sP) / strTr;
        const mDI = strTr === 0 ? 0 : (100 * sM) / strTr;
        plusDI[idx] = pDI; minusDI[idx] = mDI;
        const dx = pDI + mDI === 0 ? 0 : (100 * Math.abs(pDI - mDI)) / (pDI + mDI);
        dxArr[idx] = dx;
      }
    }
    // ADX = DX의 평활화
    let first = null, adxVal = null, cnt = 0;
    for (let i = 0; i < bars.length; i++) {
      if (dxArr[i] == null) continue;
      if (first === null) { first = i; adxVal = dxArr[i]; cnt = 1; continue; }
      cnt++;
      if (cnt < n) adxVal = (adxVal * (cnt - 1) + dxArr[i]) / cnt;
      else adxVal = (adxVal * (n - 1) + dxArr[i]) / n;
      adx[i] = adxVal;
    }
    return { plusDI, minusDI, adx };
  }

  // CCI (20)
  function cci(bars, n = 20) {
    const tp = bars.map((b) => (b[2] + b[3] + b[4]) / 3);
    const out = new Array(bars.length).fill(null);
    for (let i = n - 1; i < bars.length; i++) {
      let s = 0;
      for (let j = i - n + 1; j <= i; j++) s += tp[j];
      const ma = s / n;
      let dev = 0;
      for (let j = i - n + 1; j <= i; j++) dev += Math.abs(tp[j] - ma);
      const md = dev / n;
      out[i] = md === 0 ? 0 : (tp[i] - ma) / (0.015 * md);
    }
    return out;
  }

  // 일목균형표 (9/26/52)
  function ichimoku(bars) {
    const conv = [], base = [], spanA = [], spanB = [];
    const hl = (i, n) => {
      let h = -Infinity, l = Infinity;
      for (let j = i - n + 1; j <= i; j++) { h = Math.max(h, bars[j][2]); l = Math.min(l, bars[j][3]); }
      return { h, l };
    };
    for (let i = 0; i < bars.length; i++) {
      conv[i] = i >= 8 ? (hl(i, 9).h + hl(i, 9).l) / 2 : null;
      base[i] = i >= 25 ? (hl(i, 26).h + hl(i, 26).l) / 2 : null;
      spanA[i] = conv[i] != null && base[i] != null ? (conv[i] + base[i]) / 2 : null;
      spanB[i] = i >= 51 ? (hl(i, 52).h + hl(i, 52).l) / 2 : null;
    }
    return { conv, base, spanA, spanB };
  }

  return { sma, ema, rsi, macd, bb, dmi, cci, ichimoku, closes, highs, lows };
})();
