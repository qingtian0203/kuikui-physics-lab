/* ==========================================================================
   全品类初中物理矢量图形（SVG）与定制线性图标引擎
   支持：1. 定制UI线性图标  2. 五种拓扑动态发光电路图  3. 按比例缩放分段用电时间轴
         4. 真实家用电能表末位红框小数表盘  5. 参数化 P-t 阶梯功率坐标图像
   ========================================================================== */

const Icons = {
  bolt: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>`,
  plug: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8h12z"/></svg>`,
  book: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6"/><path d="M9 11h4"/></svg>`,
  dice: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/></svg>`,
  compass: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M10.5 6.8L5 21"/><path d="M13.5 6.8L19 21"/><path d="M7 15h10"/></svg>`,
  alert: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  chart: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  bulb: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5"/></svg>`,
  trophy: (cls = '') => `<svg class="ui-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`
};

const Fig = (() => {
  const pl = (pts) => pts.map((p) => p.join(',')).join(' ');

  /**
   * 推算标准旁路型电路的导通与短路状态
   * topo: 'or'（各自并联） | 'and'（串联后并联） | 'single'（单开关）
   */
  function state(o) {
    const topo = o.topo || 'or';
    const s1 = o.s1 !== false;
    const s2 = Boolean(o.s2);
    const s3 = Boolean(o.s3);
    const broken = Boolean(o.broken);
    const bypass = topo === 'or' ? (s2 || s3) : topo === 'and' ? (s2 && s3) : s2;
    const on = s1 && (bypass || !broken);
    return { topo, s1, s2, s3, broken, bypass, on, viaR2: on && !bypass };
  }

  /**
   * 绘制初中物理标准电路原理图（支持 5 种拓扑结构 + 电流流动 + 发热 Glow）
   */
  function circuit(o) {
    const topo = o.topo || 'or';

    // 特殊辨析拓扑 1：两电阻并联在干路（用于「看表选电路图」四选一干扰项）
    if (topo === 'parallel_res') {
      return `
        <svg class="fig-svg circuit" viewBox="0 36 400 232" role="img" aria-label="R1与R2并联候选电路图">
          <polyline class="w" points="30,178 30,228 187,228"/>
          <polyline class="w" points="213,228 370,228 370,178 340,178"/>
          <polyline class="w" points="30,178 52,178"/>
          <polyline class="w" points="92,178 190,178"/>
          <polyline class="w" points="250,178 340,178"/>
          <polyline class="w" points="120,178 120,118 162,118"/>
          <polyline class="w" points="202,118 245,118"/>
          <polyline class="w" points="305,118 340,118 340,178"/>
          <polyline class="w" points="140,118 140,66 162,66"/>
          <polyline class="w" points="202,66 222,66 222,118"/>
          <circle class="node" cx="120" cy="178" r="3.6"/>
          <circle class="node" cx="340" cy="178" r="3.6"/>
          <circle class="node" cx="140" cy="118" r="3.6"/>
          <circle class="node" cx="222" cy="118" r="3.6"/>
          <g class="sw on"><line class="blade" x1="52" y1="178" x2="92" y2="178"/><circle class="term" cx="52" cy="178" r="3.5"/><circle class="term" cx="92" cy="178" r="3.5"/><text class="sl" x="72" y="156">S₁</text></g>
          <g class="sw"><line class="blade" x1="162" y1="118" x2="197" y2="103"/><circle class="term" cx="162" cy="118" r="3.5"/><circle class="term" cx="202" cy="118" r="3.5"/><text class="sl" x="182" y="95">S₃</text></g>
          <g class="sw"><line class="blade" x1="162" y1="66" x2="197" y2="51"/><circle class="term" cx="162" cy="66" r="3.5"/><circle class="term" cx="202" cy="66" r="3.5"/><text class="sl" x="182" y="45">S₂</text></g>
          <g class="res"><rect x="190" y="166" width="60" height="24" rx="5"/><text class="rl" x="220" y="183">R₁</text></g>
          <g class="res"><rect x="245" y="106" width="60" height="24" rx="5"/><text class="rl" x="275" y="123">R₂</text></g>
          <g class="src"><circle cx="200" cy="228" r="13"/><text x="200" y="233" class="src-t">~</text><text x="200" y="258" class="src-l">U = 220 V</text></g>
        </svg>
      `;
    }

    // 特殊辨析拓扑 2：开关误跨接在加热电阻 R1 两端（用于「看表选电路图」四选一干扰项）
    if (topo === 'short_r1') {
      return `
        <svg class="fig-svg circuit" viewBox="0 36 400 232" role="img" aria-label="开关跨接在R1两端的候选电路图">
          <polyline class="w" points="30,180 30,228 187,228"/>
          <polyline class="w" points="213,228 370,228 370,180 345,180"/>
          <polyline class="w" points="30,180 52,180"/>
          <polyline class="w" points="92,180 145,180"/>
          <polyline class="w" points="205,180 275,180"/>
          <polyline class="w" points="335,180 345,180"/>
          <polyline class="w" points="118,180 118,125 155,125"/><polyline class="w" points="195,125 232,125 232,180"/>
          <polyline class="w" points="118,125 118,70 155,70"/><polyline class="w" points="195,70 232,70 232,125"/>
          <circle class="node" cx="118" cy="180" r="3.6"/><circle class="node" cx="232" cy="180" r="3.6"/>
          <circle class="node" cx="118" cy="125" r="3.6"/><circle class="node" cx="232" cy="125" r="3.6"/>
          <g class="sw on"><line class="blade" x1="52" y1="180" x2="92" y2="180"/><circle class="term" cx="52" cy="180" r="3.5"/><circle class="term" cx="92" cy="180" r="3.5"/><text class="sl" x="72" y="158">S₁</text></g>
          <g class="sw"><line class="blade" x1="155" y1="125" x2="190" y2="109"/><circle class="term" cx="155" cy="125" r="3.5"/><circle class="term" cx="195" cy="125" r="3.5"/><text class="sl" x="175" y="102">S₂</text></g>
          <g class="sw"><line class="blade" x1="155" y1="70" x2="190" y2="54"/><circle class="term" cx="155" cy="70" r="3.5"/><circle class="term" cx="195" cy="70" r="3.5"/><text class="sl" x="175" y="47">S₃</text></g>
          <g class="res"><rect x="145" y="168" width="60" height="24" rx="5"/><text class="rl" x="175" y="185">R₁</text></g>
          <g class="res"><rect x="275" y="168" width="60" height="24" rx="5"/><text class="rl" x="305" y="185">R₂</text></g>
          <g class="src"><circle cx="200" cy="228" r="13"/><text x="200" y="233" class="src-t">~</text><text x="200" y="258" class="src-l">U = 220 V</text></g>
        </svg>
      `;
    }

    const st = state(o);
    const flow = Boolean(o.flow);
    const inter = Boolean(o.interactive);
    const Y = 180;
    const A = 210;
    const B = 340;
    const BY = 228;
    const base = [];
    const over = [];

    const W = (pts, act) => {
      base.push(`<polyline class="w" points="${pl(pts)}"/>`);
      if (flow && act) over.push(`<polyline class="w-flow" points="${pl(pts)}"/>`);
    };

    const sw = (x1, x2, y, closed, label, id, act) => {
      const ex = closed ? x2 : x2 - 5;
      const ey = closed ? y : y - 17;
      return `
        <g class="sw${closed ? ' on' : ''}"${inter ? ` data-sw="${id}" tabindex="0" role="button" aria-label="切换${label}"` : ''}>
          <rect class="hit" x="${x1 - 10}" y="${y - 34}" width="${x2 - x1 + 20}" height="46" rx="8"/>
          <line class="blade" x1="${x1}" y1="${y}" x2="${ex}" y2="${ey}"/>
          ${flow && act ? `<line class="w-flow" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>` : ''}
          <circle class="term" cx="${x1}" cy="${y}" r="3.5"/>
          <circle class="term" cx="${x2}" cy="${y}" r="3.5"/>
          <text class="sl" x="${(x1 + x2) / 2}" y="${y - 22}">${label}</text>
        </g>
      `;
    };

    const res = (x, w, y, label, hot, broken) => `
      <g class="res${hot && flow ? ' hot' : ''}${broken ? ' broken' : ''}">
        <rect x="${x}" y="${y - 12}" width="${w}" height="24" rx="5"/>
        <text class="rl" x="${x + w / 2}" y="${y + 5}">${broken ? `${label} 断路` : label}</text>
      </g>
    `;

    const on = st.on;
    // 主干路导线
    W([[55, Y], [30, Y], [30, BY], [187, BY]], on);
    W([[213, BY], [370, BY], [370, Y], [B, Y]], on);
    W([[95, Y], [120, Y]], on);
    W([[180, Y], [A, Y]], on);
    // 限流电阻 R2 所在支路
    W([[A, Y], [245, Y]], st.viaR2);
    W([[305, Y], [B, Y]], st.viaR2);

    let top = 76;
    const sws = [];
    const dots = [[A, Y], [B, Y]];

    if (st.topo === 'or') {
      top = 36;
      const a2 = on && st.s2;
      const a3 = on && st.s3;
      W([[A, Y], [A, 125]], a2 || a3);
      W([[B, 125], [B, Y]], a2 || a3);
      W([[A, 125], [255, 125]], a2);
      W([[295, 125], [B, 125]], a2);
      W([[A, 125], [A, 70], [255, 70]], a3);
      W([[295, 70], [B, 70], [B, 125]], a3);
      sws.push(
        sw(255, 295, 125, st.s2, 'S₂', 's2', a2),
        sw(255, 295, 70, st.s3, 'S₃', 's3', a3)
      );
      dots.push([A, 125], [B, 125]);
    } else if (st.topo === 'and') {
      const a = on && st.bypass;
      W([[A, Y], [A, 115], [232, 115]], a);
      W([[266, 115], [287, 115]], a);
      W([[321, 115], [B, 115], [B, Y]], a);
      sws.push(
        sw(232, 266, 115, st.s2, 'S₂', 's2', a),
        sw(287, 321, 115, st.s3, 'S₃', 's3', a)
      );
    } else {
      const a = on && st.bypass;
      W([[A, Y], [A, 120], [255, 120]], a);
      W([[295, 120], [B, 120], [B, Y]], a);
      sws.push(sw(255, 295, 120, st.s2, o.label || 'S', 's2', a));
    }
    sws.push(sw(55, 95, Y, st.s1, 'S₁', 's1', on));

    if (o.uniformBox) top = 36;
    const h = 268 - top;
    return `
      <svg class="fig-svg circuit" viewBox="0 ${top} 400 ${h}" role="img" aria-label="物理电路原理图">
        ${base.join('')}${over.join('')}
        ${dots.map(([x, y]) => `<circle class="node" cx="${x}" cy="${y}" r="3.6"/>`).join('')}
        ${res(120, 60, Y, 'R₁', on, false)}
        ${res(245, 60, Y, 'R₂', st.viaR2, st.broken)}
        ${sws.join('')}
        <g class="src">
          <circle cx="200" cy="${BY}" r="13"/>
          <text x="200" y="${BY + 5}" class="src-t">~</text>
          <text x="200" y="${BY + 32}" class="src-l">${o.u || 'U = 220 V'}</text>
        </g>
      </svg>
    `;
  }

  /**
   * 绘制按时间比例自动缩放的双用电器分段用电时间轴
   */
  function timeline(o) {
    const x0 = 78;
    const x1 = 384;
    const sx = (t) => x0 + ((x1 - x0) * t) / o.total;
    const top = o.shade && o.shade.length ? 28 : 12;
    const rowH = 30;
    let s = '';

    (o.shade || []).forEach((sh) => {
      s += `
        <rect class="tl-shade" x="${sx(sh.from)}" y="${top - 6}" width="${sx(sh.to) - sx(sh.from)}" height="${o.rows.length * rowH + 6}" rx="8"/>
        <text class="tl-shade-t" x="${(sx(sh.from) + sx(sh.to)) / 2}" y="${top - 11}">${sh.text || '同时工作'}</text>
      `;
    });

    o.rows.forEach((r, i) => {
      const y = top + i * rowH;
      if (r.name) {
        s += `<text class="tl-name" x="${x0 - 10}" y="${y + 15}">${r.name}</text>`;
      }
      s += `<rect class="tl-bar" x="${sx(r.from)}" y="${y + 3}" width="${Math.max(sx(r.to) - sx(r.from), 2)}" height="18" rx="9" fill="${r.color || '#0F9D8A'}"/>`;
      if (r.label) {
        s += `<text class="tl-in" x="${(sx(r.from) + sx(r.to)) / 2}" y="${y + 16}">${r.label}</text>`;
      }
    });

    const ay = top + o.rows.length * rowH + 6;
    s += `<line class="tl-axis" x1="${x0}" y1="${ay}" x2="${x1}" y2="${ay}"/>`;

    const marks = o.marks || [...new Set([0, ...o.meter.map((m) => m.to)])];
    marks.forEach((t) => {
      s += `
        <line class="tl-axis" x1="${sx(t)}" y1="${ay - 4}" x2="${sx(t)}" y2="${ay + 4}"/>
        <text class="tl-tick" x="${sx(t)}" y="${ay + 17}">${t}</text>
      `;
    });
    s += `<text class="tl-tick unit" x="${x0 - 10}" y="${ay + 17}">min</text>`;

    const my = ay + 26;
    o.meter.forEach((m) => {
      const a = sx(m.from) + 3;
      const b = sx(m.to) - 3;
      s += `
        <path class="tl-br" d="M${a},${my} v6 H${b} v-6"/>
        <text class="tl-meter" x="${(a + b) / 2}" y="${my + 22}">${m.text}</text>
      `;
    });

    const h = my + 30;
    return `
      <svg class="fig-svg timeline" viewBox="0 0 400 ${h}" role="img" aria-label="分段用电时间线示意图">
        <text class="tl-cap" x="${x0 - 10}" y="${my + 22}">电能表</text>
        ${s}
      </svg>
    `;
  }

  /**
   * 绘制真实家用单相电能表读数窗（前 4 位黑底整数位 + 第 5 位玫红虚线框 0.1 kW·h 小数位）
   * o.readings = [{ label: '开始时刻', digits: '13521' }, ...]
   */
  function meterDials(o) {
    const list = o.readings || [];
    const n = list.length;
    const cardW = 166;
    const gap = 14;
    const totalW = n * cardW + (n - 1) * gap + 24;

    const cards = list.map((item, idx) => {
      const x0 = 12 + idx * (cardW + gap);
      const chars = String(item.digits).padStart(5, '0').split('');
      const boxes = chars.map((ch, dIdx) => {
        const isDec = dIdx === chars.length - 1;
        const bx = x0 + 15 + dIdx * 28;
        const by = 40;
        return `
          <rect x="${bx}" y="${by}" width="23" height="29" rx="3.5"
            fill="${isDec ? '#FFF1F2' : '#1E2330'}"
            stroke="${isDec ? '#E11D48' : '#1E2330'}"
            stroke-width="${isDec ? '1.8' : '1'}"
            ${isDec ? 'stroke-dasharray="3 2"' : ''} />
          <text x="${bx + 11.5}" y="${by + 20}" text-anchor="middle"
            font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
            font-size="16" font-weight="800"
            fill="${isDec ? '#BE123C' : '#FFFFFF'}">${ch}</text>
        `;
      }).join('');

      return `
        <g>
          <rect x="${x0}" y="8" width="${cardW}" height="86" rx="11" fill="#FFFFFF" stroke="#DDD9CE" stroke-width="1.5"/>
          <text x="${x0 + 15}" y="27" font-size="11.5" font-weight="700" fill="#5A6272">${item.label}</text>
          <text x="${x0 + cardW - 14}" y="27" text-anchor="end" font-size="11" font-weight="700" fill="#949CA9">kW·h</text>
          ${boxes}
          <text x="${x0 + cardW - 14}" y="85" text-anchor="end" font-size="10.5" font-weight="700" fill="#E11D48">▲ 0.1 度小数位</text>
        </g>
      `;
    }).join('');

    return `
      <svg class="fig-svg meter-svg" viewBox="0 0 ${totalW} 102" role="img" aria-label="电能表五位数字读数表盘图">
        ${cards}
      </svg>
    `;
  }

  /**
   * 绘制参数化 P总-t（总功率随工作时间变化）阶梯坐标图像
   * o = { pHigh: 2000, pLow: 800, t1: 10, t2: 25, labelHigh: '水壶+煲汤锅', labelLow: '仅煲汤锅' }
   */
  function ptGraph(o) {
    const pHigh = o.pHigh || 2000;
    const pLow = o.pLow || 800;
    const t1 = o.t1 || 10;
    const t2 = o.t2 || 25;
    const x0 = 64;
    const xEnd = 360;
    const y0 = 172;
    const yHigh = 46;
    const yLow = y0 - Math.round(((y0 - yHigh) * pLow) / pHigh);
    const x1 = x0 + Math.round(((xEnd - x0) * t1) / t2);

    return `
      <svg class="fig-svg pt-svg" viewBox="0 0 420 206" role="img" aria-label="电路总功率随时间变化P-t阶梯图像">
        <!-- 辅助虚线网格 -->
        <line x1="${x0}" y1="${yHigh}" x2="${xEnd}" y2="${yHigh}" stroke="#E7E5DE" stroke-dasharray="4 4"/>
        <line x1="${x0}" y1="${yLow}" x2="${xEnd}" y2="${yLow}" stroke="#E7E5DE" stroke-dasharray="4 4"/>
        <line x1="${x1}" y1="30" x2="${x1}" y2="${y0}" stroke="#E7E5DE" stroke-dasharray="4 4"/>
        <line x1="${xEnd}" y1="30" x2="${xEnd}" y2="${y0}" stroke="#E7E5DE" stroke-dasharray="4 4"/>

        <!-- 坐标轴与箭头 -->
        <line x1="${x0}" y1="${y0}" x2="388" y2="${y0}" stroke="#2B3445" stroke-width="2"/>
        <polygon points="388,${y0} 379,${y0 - 4} 379,${y0 + 4}" fill="#2B3445"/>
        <line x1="${x0}" y1="${y0}" x2="${x0}" y2="18" stroke="#2B3445" stroke-width="2"/>
        <polygon points="${x0},18 ${x0 - 4},27 ${x0 + 4},27" fill="#2B3445"/>

        <!-- 轴名与数值刻度 -->
        <text x="${x0 - 8}" y="18" text-anchor="end" font-size="12" font-weight="700" fill="#1E2330">P总 / W</text>
        <text x="393" y="${y0 + 4}" font-size="12" font-weight="700" fill="#1E2330">t / min</text>
        <text x="${x0 - 8}" y="${y0 + 4}" text-anchor="end" font-size="12" fill="#5A6272">0</text>
        <text x="${x0 - 8}" y="${yHigh + 4}" text-anchor="end" font-size="12.5" font-weight="800" fill="#0F9D8A">${pHigh}</text>
        <text x="${x0 - 8}" y="${yLow + 4}" text-anchor="end" font-size="12.5" font-weight="800" fill="#0F9D8A">${pLow}</text>
        <text x="${x1}" y="${y0 + 18}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#1E2330">${t1}</text>
        <text x="${xEnd}" y="${y0 + 18}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#1E2330">${t2}</text>

        <!-- 阶梯折线 -->
        <path d="M ${x0} ${yHigh} L ${x1} ${yHigh} L ${x1} ${yLow} L ${xEnd} ${yLow} L ${xEnd} ${y0}"
          fill="none" stroke="#0F9D8A" stroke-width="3.2" stroke-linejoin="round"/>

        <!-- 阶段微标签 -->
        <text x="${(x0 + x1) / 2}" y="${yHigh - 9}" text-anchor="middle" font-size="11" font-weight="700" fill="#0F9D8A">${o.labelHigh || '两机同开'}</text>
        <text x="${(x1 + xEnd) / 2}" y="${yLow - 9}" text-anchor="middle" font-size="11" font-weight="700" fill="#E67715">${o.labelLow || '单机工作'}</text>
      </svg>
    `;
  }

  function render(f) {
    if (!f) return '';
    if (f.kind === 'circuit') return circuit(f);
    if (f.kind === 'timeline') return timeline(f);
    if (f.kind === 'meter_dials') return meterDials(f);
    if (f.kind === 'pt_graph') return ptGraph(f);
    return '';
  }

  return { render, circuit, timeline, meterDials, ptGraph, state };
})();
