/* ==========================================================================
   初中物理标准矢量图形（SVG）渲染引擎（第一版工作台版）
   ========================================================================== */

window.PhysicsDiagrams = (function () {
  const WIRE_COLOR = '#1e293b';

  function drawResistor(x, y, label, subLabel, options = {}) {
    const w = 56, h = 22, left = x - w / 2, top = y - h / 2;
    const isBroken = Boolean(options.broken);
    const activeFill = options.active === 'high' ? '#fff7ed' : options.active === 'low' ? '#f0f9ff' : '#ffffff';
    const strokeColor = isBroken ? '#dc2626' : options.active === 'high' ? '#ea580c' : options.active === 'low' ? '#0284c7' : WIRE_COLOR;

    return `
      <g class="svg-resistor">
        <rect x="${left}" y="${top}" width="${w}" height="${h}" rx="2"
          fill="${isBroken ? '#fef2f2' : activeFill}" stroke="${strokeColor}" stroke-width="2"
          ${isBroken ? 'stroke-dasharray="4 3"' : ''} />
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="${isBroken ? '#dc2626' : '#0f172a'}">${label}</text>
        ${isBroken ? `<line x1="${x - 9}" y1="${y - 15}" x2="${x + 9}" y2="${y - 3}" stroke="#dc2626" stroke-width="2.2" /><line x1="${x + 9}" y1="${y - 15}" x2="${x - 9}" y2="${y - 3}" stroke="#dc2626" stroke-width="2.2" />` : ''}
        ${subLabel ? `<text x="${x}" y="${y + 26}" text-anchor="middle" font-size="11.5" font-weight="600" fill="${isBroken ? '#dc2626' : '#64748b'}">${subLabel}</text>` : ''}
      </g>
    `;
  }

  function drawSwitch(x, y, label, isClosed, options = {}) {
    const cLeft = x - 18, cRight = x + 18, r = 3.2;
    const color = isClosed ? (options.color || '#2b59ff') : WIRE_COLOR;
    const bladeEnd = isClosed ? { x: cRight - 1, y: y - 1.5 } : { x: x + 13, y: y - 14 };
    const labelY = options.labelPos === 'bottom' ? y + 22 : y - 19;

    return `
      <g class="svg-switch" ${options.switchKey ? `data-switch="${options.switchKey}" style="cursor:pointer"` : ''}>
        ${options.switchKey ? `<rect x="${x - 28}" y="${y - 28}" width="56" height="44" fill="transparent" />` : ''}
        <line x1="${cLeft + r}" y1="${y}" x2="${bladeEnd.x}" y2="${bladeEnd.y}" stroke="${color}" stroke-width="2.4" stroke-linecap="round" />
        <circle cx="${cLeft}" cy="${y}" r="${r}" fill="#ffffff" stroke="${WIRE_COLOR}" stroke-width="1.8" />
        <circle cx="${cRight}" cy="${y}" r="${r}" fill="#ffffff" stroke="${WIRE_COLOR}" stroke-width="1.8" />
        <text x="${x}" y="${labelY}" text-anchor="middle" font-size="13" font-weight="700" fill="${isClosed ? '#1d4ed8' : '#334155'}">${label}</text>
      </g>
    `;
  }

  function drawPower220V(x, y, voltageText = '220 V') {
    const r = 4, leftCx = x - 32, rightCx = x + 32;
    return `
      <g class="svg-power">
        <circle cx="${leftCx}" cy="${y}" r="${r}" fill="#ffffff" stroke="${WIRE_COLOR}" stroke-width="2" />
        <circle cx="${rightCx}" cy="${y}" r="${r}" fill="#ffffff" stroke="${WIRE_COLOR}" stroke-width="2" />
        <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">${voltageText}</text>
      </g>
    `;
  }

  function drawNode(x, y) {
    return `<circle cx="${x}" cy="${y}" r="3.8" fill="${WIRE_COLOR}" />`;
  }

  function renderSandboxCircuit(state) {
    const { topology, s1, s2, s3, r2Broken } = state;
    const bypassConducts = topology === 'parallel' ? (s2 || s3) : (s2 && s3);
    const r2BranchConducts = !r2Broken && !bypassConducts;
    const circuitConducts = s1 && (bypassConducts || !r2Broken);
    const fireMode = !circuitConducts ? 'off' : (bypassConducts ? 'high' : 'low');
    const flowClass = fireMode === 'high' ? 'wire-flow-high' : 'wire-flow-low';
    let currentPaths = '';

    if (circuitConducts) {
      if (fireMode === 'low') {
        currentPaths += `<path d="M 234 225 L 60 225 L 60 145 L 480 145 L 480 225 L 306 225" fill="none" class="${flowClass}" />`;
      } else {
        currentPaths += `
          <path d="M 234 225 L 60 225 L 60 145 L 285 145" fill="none" class="${flowClass}" />
          <path d="M 445 145 L 480 145 L 480 225 L 306 225" fill="none" class="${flowClass}" />
        `;
        if (topology === 'parallel') {
          if (s2) currentPaths += `<path d="M 285 145 L 285 38 L 445 38 L 445 145" fill="none" class="${flowClass}" />`;
          if (s3) currentPaths += `<path d="M 285 145 L 285 92 L 445 92 L 445 145" fill="none" class="${flowClass}" />`;
        } else {
          currentPaths += `<path d="M 285 145 L 285 72 L 445 72 L 445 145" fill="none" class="${flowClass}" />`;
        }
      }
    }

    const bypassSvg = topology === 'parallel'
      ? `
        <path d="M 285 145 L 285 38 L 344 38 M 386 38 L 445 38 L 445 145" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
        <path d="M 285 92 L 344 92 M 386 92 L 445 92" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
        ${drawNode(285, 92)}${drawNode(445, 92)}
        ${drawSwitch(365, 38, 'S₂ (温控)', s2, { switchKey: 's2' })}
        ${drawSwitch(365, 92, 'S₃ (水量)', s3, { switchKey: 's3' })}
      `
      : `
        <path d="M 285 145 L 285 72 L 307 72 M 349 72 L 381 72 M 423 72 L 445 72 L 445 145" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
        ${drawSwitch(328, 72, 'S₂ (温控)', s2, { switchKey: 's2' })}
        ${drawSwitch(402, 72, 'S₃ (水量)', s3, { switchKey: 's3' })}
      `;

    const r1Sub = fireMode === 'high' ? '加热 220V' : fireMode === 'low' ? '分压发热' : '无电流';
    const r2Sub = r2Broken ? '已断路!' : (bypassConducts && s1 ? '被短路(0V)' : r2BranchConducts && s1 ? '串联限流' : '限流电阻');

    return `
      <svg viewBox="0 0 540 262" role="img" aria-label="煎药壶双开关档位交互电路图">
        <path d="M 234 225 L 60 225 L 60 145 L 99 145 M 141 145 L 187 145 M 243 145 L 337 145 M 393 145 L 480 145 L 480 225 L 306 225" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
        ${bypassSvg}
        ${currentPaths}
        ${drawNode(285, 145)}${drawNode(445, 145)}
        ${drawSwitch(120, 145, 'S₁ (总开关)', s1, { switchKey: 's1' })}
        ${drawResistor(215, 145, 'R₁', r1Sub, { active: fireMode === 'off' ? null : fireMode })}
        ${drawResistor(365, 145, 'R₂', r2Sub, { broken: r2Broken, active: fireMode === 'low' ? 'low' : null })}
        ${drawPower220V(270, 225, '220 V')}
      </svg>
    `;
  }

  function renderStaticCircuit(variant) {
    if (variant === 'single_s2_bypass') {
      return `
        <svg viewBox="0 0 460 215" role="img" aria-label="单开关串联限流双档电路图">
          <path d="M 194 180 L 55 180 L 55 115 L 94 115 M 136 115 L 172 115 M 228 115 L 292 115 M 348 115 L 405 115 L 405 180 L 266 180 M 255 115 L 255 52 L 299 52 M 341 52 L 385 52 L 385 115" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
          ${drawNode(255, 115)}${drawNode(385, 115)}
          ${drawSwitch(115, 115, 'S₁', true)}
          ${drawResistor(200, 115, 'R₁', '加热电阻')}${drawResistor(320, 115, 'R₂', '限流电阻')}
          ${drawSwitch(320, 52, 'S₂ (温控)', false)}${drawPower220V(230, 180, '220 V')}
        </svg>
      `;
    }
    if (variant === 'origin8_standard' || variant === 'opt_parallel_sw') {
      const showNotes = variant === 'origin8_standard';
      return `
        <svg viewBox="0 0 480 242" role="img" aria-label="双开关并联旁路限流电阻标准电路图">
          <path d="M 204 205 L 50 205 L 50 138 L 89 138 M 131 138 L 167 138 M 223 138 L 307 138 M 363 138 L 430 138 L 430 205 L 276 205 M 260 138 L 260 36 L 314 36 M 356 36 L 410 36 L 410 138 M 260 86 L 314 86 M 356 86 L 410 86" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
          ${drawNode(260, 138)}${drawNode(410, 138)}${drawNode(260, 86)}${drawNode(410, 86)}
          ${drawSwitch(110, 138, 'S₁', true)}
          ${drawResistor(195, 138, 'R₁', showNotes ? '加热电阻' : '')}${drawResistor(335, 138, 'R₂', showNotes ? '限流电阻' : '')}
          ${drawSwitch(335, 36, 'S₂', false)}${drawSwitch(335, 86, 'S₃', false)}${drawPower220V(240, 205, '220 V')}
        </svg>
      `;
    }
    if (variant === 'opt_series_sw') {
      return `
        <svg viewBox="0 0 480 242" role="img" aria-label="双开关串联后跨接限流电阻电路图">
          <path d="M 204 205 L 50 205 L 50 138 L 89 138 M 131 138 L 167 138 M 223 138 L 307 138 M 363 138 L 430 138 L 430 205 L 276 205 M 255 138 L 255 68 L 279 68 M 321 68 L 349 68 M 391 68 L 415 68 L 415 138" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
          ${drawNode(255, 138)}${drawNode(415, 138)}
          ${drawSwitch(110, 138, 'S₁', true)}
          ${drawResistor(195, 138, 'R₁', '')}${drawResistor(335, 138, 'R₂', '')}
          ${drawSwitch(300, 68, 'S₂', false)}${drawSwitch(370, 68, 'S₃', false)}${drawPower220V(240, 205, '220 V')}
        </svg>
      `;
    }
    if (variant === 'opt_parallel_res') {
      return `
        <svg viewBox="0 0 480 242" role="img" aria-label="两电阻并联电路图">
          <path d="M 204 205 L 55 205 L 55 142 L 89 142 M 131 142 L 222 142 M 278 142 L 425 142 L 425 205 L 276 205 M 160 142 L 160 80 L 199 80 M 241 80 L 267 80 M 323 80 L 385 80 L 385 142 M 199 36 L 180 36 L 180 80 M 241 36 L 255 36 L 255 80" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
          ${drawNode(160, 142)}${drawNode(385, 142)}${drawNode(180, 80)}${drawNode(255, 80)}
          ${drawSwitch(110, 142, 'S₁', true)}
          ${drawResistor(250, 142, 'R₁', '')}
          ${drawSwitch(220, 80, 'S₃', false)}${drawSwitch(220, 36, 'S₂', false)}
          ${drawResistor(295, 80, 'R₂', '')}${drawPower220V(240, 205, '220 V')}
        </svg>
      `;
    }
    if (variant === 'opt_short_r1') {
      return `
        <svg viewBox="0 0 480 242" role="img" aria-label="开关跨接在R1两端的错误电路图">
          <path d="M 204 205 L 50 205 L 50 138 L 89 138 M 131 138 L 197 138 M 253 138 L 337 138 M 393 138 L 430 138 L 430 205 L 276 205 M 155 138 L 155 36 L 204 36 M 246 36 L 295 36 L 295 138 M 155 86 L 204 86 M 246 86 L 295 86" fill="none" stroke="${WIRE_COLOR}" stroke-width="2" />
          ${drawNode(155, 138)}${drawNode(295, 138)}${drawNode(155, 86)}${drawNode(295, 86)}
          ${drawSwitch(110, 138, 'S₁', true)}
          ${drawResistor(225, 138, 'R₁', '')}${drawResistor(365, 138, 'R₂', '')}
          ${drawSwitch(225, 36, 'S₂', false)}${drawSwitch(225, 86, 'S₃', false)}${drawPower220V(240, 205, '220 V')}
        </svg>
      `;
    }
    return '';
  }

  function renderMeterDialGroup(readings) {
    const cardsSvg = readings.map((item, idx) => {
      const chars = item.digits.split('');
      const xBase = 20 + idx * 192;
      const digitBoxes = chars.map((ch, dIdx) => {
        const isDecimal = dIdx === chars.length - 1;
        const bx = xBase + 16 + dIdx * 28, by = 42;
        return `
          <rect x="${bx}" y="${by}" width="24" height="30" rx="3" fill="${isDecimal ? '#fff1f2' : '#1e293b'}" stroke="${isDecimal ? '#e11d48' : '#0f172a'}" stroke-width="${isDecimal ? '2' : '1'}" ${isDecimal ? 'stroke-dasharray="3 2"' : ''} />
          <text x="${bx + 12}" y="${by + 21}" text-anchor="middle" font-family="monospace" font-size="17" font-weight="700" fill="${isDecimal ? '#be123c' : '#ffffff'}">${ch}</text>
        `;
      }).join('');
      return `
        <g>
          <rect x="${xBase}" y="12" width="172" height="84" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
          <text x="${xBase + 86}" y="31" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">${item.timeLabel}</text>
          ${digitBoxes}
          <text x="${xBase + 148}" y="88" text-anchor="end" font-size="10.5" font-weight="700" fill="#e11d48">▲ 0.1 kW·h 小数位</text>
        </g>
      `;
    }).join('');
    return `<svg viewBox="0 0 596 108" role="img" aria-label="电能表三次读数表盘图">${cardsSvg}</svg>`;
  }

  function renderTimelineDiagram(cfg) {
    const totalW = 520;
    let curX = 30;
    const segmentsSvg = cfg.stages.map((st) => {
      const segW = Math.round(totalW * st.widthRatio);
      const x = curX;
      curX += segW;
      return `
        <g>
          <rect x="${x}" y="26" width="${segW}" height="106" fill="${st.isBreakthrough ? '#ecfdf5' : '#f8fafc'}" stroke="${st.isBreakthrough ? '#10b981' : '#cbd5e1'}" stroke-width="${st.isBreakthrough ? '2' : '1.4'}" rx="6" />
          <text x="${x + segW / 2}" y="18" text-anchor="middle" font-size="12" font-weight="700" fill="${st.isBreakthrough ? '#047857' : '#334155'}">${st.label}${st.isBreakthrough ? ' ★突破口' : ''}</text>
          ${st.topBar
            ? `<rect x="${x + 6}" y="36" width="${segW - 12}" height="32" rx="5" fill="#dbeafe" stroke="#60a5fa" /><text x="${x + segW / 2}" y="56" text-anchor="middle" font-size="12" font-weight="700" fill="#1e40af">${st.topBar}</text>`
            : `<rect x="${x + 6}" y="36" width="${segW - 12}" height="32" rx="5" fill="transparent" stroke="#cbd5e1" stroke-dasharray="4 3" /><text x="${x + segW / 2}" y="56" text-anchor="middle" font-size="11.5" fill="#94a3b8">已断电停止</text>`
          }
          ${st.bottomBar ? `<rect x="${x + 6}" y="76" width="${segW - 12}" height="32" rx="5" fill="#fef3c7" stroke="#fbbf24" /><text x="${x + segW / 2}" y="96" text-anchor="middle" font-size="12" font-weight="700" fill="#92400e">${st.bottomBar}</text>` : ''}
          <text x="${x + segW / 2}" y="125" text-anchor="middle" font-size="11.5" font-weight="700" fill="${st.isBreakthrough ? '#065f46' : '#475569'}">${st.totalText}</text>
        </g>
      `;
    }).join('');
    return `<svg viewBox="0 0 580 144" role="img" aria-label="双电器分段用电时间轴示意图">${segmentsSvg}</svg>`;
  }

  function renderPtGraph() {
    return `
      <svg viewBox="0 0 460 230" role="img" aria-label="电路总功率随时间变化P-t图像">
        <line x1="65" y1="50" x2="400" y2="50" stroke="#e2e8f0" stroke-dasharray="4 4" />
        <line x1="65" y1="125" x2="400" y2="125" stroke="#e2e8f0" stroke-dasharray="4 4" />
        <line x1="185" y1="30" x2="185" y2="185" stroke="#e2e8f0" stroke-dasharray="4 4" />
        <line x1="365" y1="30" x2="365" y2="185" stroke="#e2e8f0" stroke-dasharray="4 4" />
        <line x1="65" y1="185" x2="420" y2="185" stroke="${WIRE_COLOR}" stroke-width="2" />
        <polygon points="420,185 411,181 411,189" fill="${WIRE_COLOR}" />
        <line x1="65" y1="185" x2="65" y2="22" stroke="${WIRE_COLOR}" stroke-width="2" />
        <polygon points="65,22 61,31 69,31" fill="${WIRE_COLOR}" />
        <text x="58" y="20" text-anchor="end" font-size="12.5" font-weight="700" fill="#0f172a">P总 / W</text>
        <text x="425" y="190" font-size="12.5" font-weight="700" fill="#0f172a">t / min</text>
        <text x="56" y="190" text-anchor="end" font-size="12" fill="#475569">0</text>
        <text x="56" y="54" text-anchor="end" font-size="12.5" font-weight="700" fill="#1e40af">2000</text>
        <text x="56" y="129" text-anchor="end" font-size="12.5" font-weight="700" fill="#1e40af">800</text>
        <text x="185" y="204" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">10</text>
        <text x="365" y="204" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">25</text>
        <path d="M 65 50 L 185 50 L 185 125 L 365 125 L 365 185" fill="none" stroke="#2b59ff" stroke-width="3.2" stroke-linejoin="round" />
        <text x="125" y="41" text-anchor="middle" font-size="11.5" font-weight="600" fill="#2b59ff">水壶 + 煲汤锅</text>
        <text x="275" y="116" text-anchor="middle" font-size="11.5" font-weight="600" fill="#0284c7">仅煲汤锅工作</text>
      </svg>
    `;
  }

  return { renderSandboxCircuit, renderStaticCircuit, renderMeterDialGroup, renderTimelineDiagram, renderPtGraph };
})();
