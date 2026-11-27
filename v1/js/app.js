/* ==========================================================================
   葵葵初三物理电热通关实验室 · 第一版直达工作台主交互逻辑
   ========================================================================== */

(function () {
  const STORAGE_KEY = 'kuikui_physics_lab_state_v1';
  const questions = window.QuestionBank || [];
  const diagrams = window.PhysicsDiagrams;

  function createDefaultRecord() {
    return { status: 'unstarted', selectedKeys: [], calcValues: {}, submitted: false, evalOutcome: null, evalMessage: '', fieldResults: {}, unlockedHints: 0, showSolution: false };
  }

  function loadInitialState() {
    const base = {
      activeTab: 'guide',
      activeStageByTopic: { topic1: 't1_origin', topic2: 't2_origin' },
      sandbox: { topology: 'parallel', s1: true, s2: true, s3: false, r2Broken: false },
      records: {}
    };
    questions.forEach((q) => { base.records[q.id] = createDefaultRecord(); });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.activeTab) base.activeTab = parsed.activeTab;
          if (parsed.activeStageByTopic) base.activeStageByTopic = { ...base.activeStageByTopic, ...parsed.activeStageByTopic };
          if (parsed.sandbox) base.sandbox = { ...base.sandbox, ...parsed.sandbox };
          if (parsed.records) {
            questions.forEach((q) => {
              if (parsed.records[q.id]) base.records[q.id] = { ...createDefaultRecord(), ...parsed.records[q.id] };
            });
          }
        }
      }
    } catch (err) { console.warn('读取本地练习记录失败', err); }
    return base;
  }

  const state = loadInitialState();
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) {} }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toastBanner');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function renderDiagramBox(diagCfg) {
    if (!diagCfg) return '';
    let svgHtml = '';
    if (diagCfg.type === 'static_circuit') svgHtml = diagrams.renderStaticCircuit(diagCfg.variant);
    else if (diagCfg.type === 'meter_dials') svgHtml = diagrams.renderMeterDialGroup(diagCfg.readings);
    else if (diagCfg.type === 'timeline') svgHtml = diagrams.renderTimelineDiagram(diagCfg.config);
    else if (diagCfg.type === 'pt_graph') svgHtml = diagrams.renderPtGraph();
    if (!svgHtml) return '';
    return `<div class="q-figure-box">${svgHtml}${diagCfg.caption ? `<div class="q-figure-caption">${diagCfg.caption}</div>` : ''}</div>`;
  }

  function renderPhysicsTable(tableData) {
    if (!tableData) return '';
    const ths = tableData.headers.map((h) => `<th>${h}</th>`).join('');
    const trs = tableData.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
    return `<div class="physics-table-wrap"><table class="physics-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  }

  function syncHeaderMetrics() {
    const t1List = questions.filter((q) => q.topic === 'topic1');
    const t2List = questions.filter((q) => q.topic === 'topic2');
    const t1Done = t1List.filter((q) => state.records[q.id].status === 'passed').length;
    const t2Done = t2List.filter((q) => state.records[q.id].status === 'passed').length;
    const totalDone = t1Done + t2Done;
    const wrongCount = questions.filter((q) => state.records[q.id].status === 'wrong').length;

    document.getElementById('navCountTopic1').textContent = `${t1Done}/${t1List.length}`;
    document.getElementById('navCountTopic2').textContent = `${t2Done}/${t2List.length}`;
    const elMis = document.getElementById('navCountMistakes');
    elMis.textContent = String(wrongCount);
    elMis.classList.toggle('zero', wrongCount === 0);
    document.getElementById('globalProgressText').textContent = `${totalDone} / ${questions.length}`;
    document.getElementById('globalProgressFill').style.width = `${Math.round((totalDone / questions.length) * 100)}%`;
    document.querySelectorAll('.main-tabs .tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });
  }

  function computeSandboxMetrics() {
    const { topology, s1, s2, s3, r2Broken } = state.sandbox;
    const bypassClosed = topology === 'parallel' ? (s2 || s3) : (s2 && s3);
    const conducts = s1 && (bypassClosed || !r2Broken);
    if (!s1) return { mode: 'off', badge: '🔌 未通电（总开关 S₁ 断开）', u1: '0 V', p1: '0 W', pathDesc: '手动总开关 S₁ 处于断开状态，整个电路没有电流通过。先把 S₁ 闭合试试！' };
    if (!conducts && r2Broken) return { mode: 'off', badge: '⚠️ 断路停机（文火失效）', u1: '0 V', p1: '0 W', pathDesc: '限流电阻 R₂ 已断路，且上方自动开关旁路也未导通，串联文火回路彻底断开！这正是原卷第 8 题 C 选项的原因！' };
    if (bypassClosed) {
      const viaWhich = topology === 'parallel' ? (s2 && s3 ? 'S₂ 和 S₃ 两条支路同时' : s2 ? '温控开关 S₂ 支路' : '水量开关 S₃ 支路') : 'S₂ 与 S₃ 串联支路';
      return { mode: 'high', badge: '🔥 武火猛攻档（R₂ 被旁路短路）', u1: '220 V', p1: '800 W', pathDesc: `电流从 ${viaWhich} 绕过限流电阻 R₂（R₂ 两端电压为 0 V），220 V 电源电压全部加在加热电阻 R₁（60.5 Ω）上，实现最大功率武火加热！` };
    }
    return { mode: 'low', badge: '💧 文火慢煎档（R₁、R₂ 串联分压）', u1: '77.8 V', p1: '100 W', pathDesc: '上方旁路未导通，电流必须依次穿过加热电阻 R₁（60.5 Ω）和限流电阻 R₂（约 110.6 Ω）。R₂ 分走了约 142.2 V 电压，使 R₁ 两端电压降至 77.8 V，功率降为 100 W 文火！' };
  }

  function renderGuideView() {
    const sb = state.sandbox;
    const meter = computeSandboxMetrics();
    return `
      <section class="hero-banner">
        <div>
          <div class="hero-eyebrow">🎯 专为初三电热综合题定制 · 彻底告别同类型错题</div>
          <h1 class="hero-title">吃透 2 道原卷母题 + 闯过 10 道变式关，同类题再也不错</h1>
          <p class="hero-desc">针对第 142 页第 7 题（双电器分段用电与热效率）和第 8 题（文火武火多开关黑盒电路），我们先用 3 分钟抓准破题口诀、亲手拨动下面的动态电路开关，再按「搭梯 → 变式 → 压轴」逐关击破！</p>
          <div class="hero-actions">
            <button type="button" class="btn-primary" data-goto-tab="topic1">⏱️ 开始专题一闯关（分段用电）</button>
            <button type="button" class="btn-secondary" data-goto-tab="topic2">🔌 开始专题二闯关（文火武火）</button>
          </div>
        </div>
        <div class="formula-deck">
          <div class="formula-card"><span class="f-tag">电功与功率（注意单位配套）</span><span class="f-expr">W = P · t</span><span class="f-note">kW 配 h 得 kW·h；W 配 s 得 J</span></div>
          <div class="formula-card"><span class="f-tag">档位分析核心公式</span><span class="f-expr">P = U² / R</span><span class="f-note">U 恒定时，接入电阻越小功率越大</span></div>
          <div class="formula-card"><span class="f-tag">水吸收的热量</span><span class="f-expr">Q吸 = c · m · Δt</span><span class="f-note">1 L 水质量 m = 1.0 kg</span></div>
          <div class="formula-card"><span class="f-tag">电热器烧水效率</span><span class="f-expr">η = Q吸 / W电</span><span class="f-note">1 kW·h = 3.6×10⁶ J 必换算！</span></div>
        </div>
      </section>

      <section class="sandbox-panel">
        <div class="sandbox-top-bar">
          <div>
            <h2 style="margin:0;font-size:19px;">🔬 交互式煎药壶电路实验室（点开关看电流怎么走！）</h2>
            <span style="font-size:13px;color:var(--text-muted);">可以直接点击左侧电路图上的开关，或点击右侧控制面板，亲眼验证原卷第 8 题的所有情况</span>
          </div>
          <div class="sandbox-mode-switch">
            <button type="button" class="mode-pill ${sb.topology === 'parallel' ? 'active' : ''}" data-sb-topology="parallel">原卷模型：S₂、S₃ 并联跨 R₂（任一闭合即武火）</button>
            <button type="button" class="mode-pill ${sb.topology === 'series' ? 'active' : ''}" data-sb-topology="series">变式模型：S₂、S₃ 串联跨 R₂（同时闭合才武火）</button>
          </div>
        </div>
        <div class="sandbox-body">
          <div class="circuit-stage">${diagrams.renderSandboxCircuit(sb)}</div>
          <div class="sandbox-controls">
            <div class="control-switches-grid">
              <button type="button" class="sw-toggle-btn ${sb.s1 ? 'closed' : ''}" data-sb-toggle="s1"><div class="sw-row-top"><span>手动总开关 S₁</span><span class="sw-state-tag">${sb.s1 ? '闭合' : '断开'}</span></div><span class="sw-sub">控制整机通断电</span></button>
              <button type="button" class="sw-toggle-btn ${sb.s2 ? 'closed' : ''}" data-sb-toggle="s2"><div class="sw-row-top"><span>温控开关 S₂</span><span class="sw-state-tag">${sb.s2 ? '闭合' : '断开'}</span></div><span class="sw-sub">${sb.s2 ? '当前 < 60 ℃（低温闭合）' : '当前 ≥ 60 ℃（高温断开）'}</span></button>
              <button type="button" class="sw-toggle-btn ${sb.s3 ? 'closed' : ''}" data-sb-toggle="s3"><div class="sw-row-top"><span>水量开关 S₃</span><span class="sw-state-tag">${sb.s3 ? '闭合' : '断开'}</span></div><span class="sw-sub">${sb.s3 ? '当前 > 0.2 L（水多闭合）' : '当前 ≤ 0.2 L（水少断开）'}</span></button>
              <button type="button" class="sw-toggle-btn ${sb.r2Broken ? 'fault' : ''}" data-sb-toggle="r2Broken"><div class="sw-row-top"><span>模拟 R₂ 断路故障</span><span class="sw-state-tag">${sb.r2Broken ? '已断路' : '正常'}</span></div><span class="sw-sub">一键验证原题 C 选项故障</span></button>
            </div>
            <div class="live-meter-box mode-${meter.mode}">
              <div class="meter-headline"><span class="meter-fire-badge">${meter.badge}</span><span style="font-size:12px;color:var(--text-muted);">电源恒为 220 V</span></div>
              <div class="meter-metrics">
                <div class="metric-item"><span>R₁ 两端电压</span><strong>${meter.u1}</strong></div>
                <div class="metric-item"><span>R₁ 加热功率</span><strong>${meter.p1}</strong></div>
                <div class="metric-item"><span>限流电阻 R₂</span><strong>${sb.r2Broken ? '断路损坏' : (meter.mode === 'high' ? '被短路 (0 W)' : '分压限流中')}</strong></div>
              </div>
              <p class="meter-explain">${meter.pathDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="section-heading"><h2>📌 两类母题「三步防错SOP」</h2><span>做题前默念一遍，考场上遇到同款题直接套流程</span></div>
      <section class="method-grid">
        <article class="method-card">
          <div><span class="method-badge blue">⏱️ 对应原卷第 7 题</span><h3 class="method-title">多用电器分段工作与烧水效率</h3></div>
          <div class="pain-point-box"><strong>最容易栽跟头的地方：</strong>误把重叠时段的总耗电当成水壶单独耗电；忘了把分钟（min）除以 60 变成小时（h）；混淆「消耗电能快（功率大）」与「消耗电能多（度数大）」。</div>
          <ul class="step-list">
            <li><span class="step-num">1</span><div><strong>先找「独角戏」定功率：</strong>圈出只有一台电器单独工作的那段时间，用 <code>P = ΔW ÷ t</code> 算出这台恒功率电器的功率。</div></li>
            <li><span class="step-num">2</span><div><strong>按时间比例剥离重叠段：</strong>算出这台电器在「共同工作段」吃掉了多少度电，从共同段总度数里减掉它，剩下的才是水壶耗电量 <code>W壶</code>！</div></li>
            <li><span class="step-num">3</span><div><strong>焦耳对齐算效率：</strong>用 <code>Q吸 = cmΔt</code> 算出焦耳（J），把 <code>W壶</code> 乘 <code>3.6×10⁶</code> 也化成焦耳，再相除求 <code>η</code>。</div></li>
          </ul>
        </article>
        <article class="method-card">
          <div><span class="method-badge orange">🔌 对应原卷第 8 题</span><h3 class="method-title">文火、武火与多开关黑盒电路</h3></div>
          <div class="pain-point-box"><strong>原卷卡壳根源突破：</strong>你在试卷草稿上已经画对了 <code>R₁</code>、<code>R₂</code> 串联！只要再记住：自动开关是<strong>架在限流电阻 R₂ 头顶帮电流抄近道（短路 R₂）</strong>的！</div>
          <ul class="step-list">
            <li><span class="step-num">1</span><div><strong>串联保底定文火：</strong>加热电阻 <code>R₁</code> 与限流电阻 <code>R₂</code> 串联在主干路上——自动开关全断开时就是文火。</div></li>
            <li><span class="step-num">2</span><div><strong>看表格定开关串并联：</strong>「任一闭合即武火」就把两开关<strong>并联</strong>跨在 <code>R₂</code> 两端；「同时闭合才武火」就把两开关<strong>串联</strong>后再跨在 <code>R₂</code> 两端。</div></li>
            <li><span class="step-num">3</span><div><strong>必查表头与隐藏行：</strong>圈出表头写的是「<code>R₁</code> 功率」还是「整机总功率」；遇到少水选项，立刻去查低温时另一个开关是不是还闭合着！</div></li>
          </ul>
        </article>
      </section>
    `;
  }

  function renderTopicView(topicKey) {
    const topicQuestions = questions.filter((q) => q.topic === topicKey);
    const currentId = state.activeStageByTopic[topicKey] || topicQuestions[0].id;
    const currentIndex = Math.max(0, topicQuestions.findIndex((q) => q.id === currentId));
    const q = topicQuestions[currentIndex];
    const rec = state.records[q.id];

    const navItemsHtml = topicQuestions.map((item, idx) => {
      const r = state.records[item.id];
      const statusCls = r.status === 'passed' ? 'done' : r.status === 'wrong' ? 'wrong' : '';
      const dotText = r.status === 'passed' ? '✓' : r.status === 'wrong' ? '!' : (idx === 0 ? '母' : String(idx));
      return `
        <button type="button" class="stage-nav-item ${item.id === q.id ? 'active' : ''} ${statusCls}" data-select-question="${item.id}">
          <span class="stage-status-dot">${dotText}</span>
          <div class="stage-item-info"><div class="stage-item-tag"><span>${item.stageLabel}</span><span>${item.stars}</span></div><div class="stage-item-name">${item.title}</div></div>
        </button>
      `;
    }).join('');

    let answerAreaHtml = '';
    if (q.questionType === 'single' || q.questionType === 'multi') {
      const optionsHtml = q.options.map((opt) => {
        const isSelected = rec.selectedKeys.includes(opt.key);
        let stateClass = isSelected ? 'selected' : '';
        let diagHtml = '';
        if (rec.submitted) {
          stateClass = opt.isCorrect ? (isSelected ? 'correct-hit' : 'missed-correct') : (isSelected ? 'wrong-pick' : '');
          const diagClass = opt.isCorrect ? 'good' : (isSelected ? 'bad' : 'neutral');
          const prefix = opt.isCorrect ? (isSelected ? '✓ 选对啦：' : '⚠️ 漏选正确项：') : (isSelected ? '✗ 误选陷阱：' : '排除理由：');
          diagHtml = `<div class="opt-diag-note ${diagClass}"><strong>${prefix}</strong>${opt.diag}</div>`;
        }
        const optSvgHtml = opt.svgVariant ? `<div class="opt-svg-wrap">${diagrams.renderStaticCircuit(opt.svgVariant)}</div>` : '';
        return `<div class="option-item ${stateClass}" data-opt-key="${opt.key}" role="button" tabindex="0"><span class="opt-key">${opt.key}</span><div class="opt-body"><div class="opt-text">${opt.text}</div>${optSvgHtml}${diagHtml}</div></div>`;
      }).join('');
      answerAreaHtml = `<div class="options-list ${q.diagramOptions ? 'diagram-grid' : ''}">${optionsHtml}</div>`;
    } else if (q.questionType === 'calc') {
      const fieldsHtml = q.calcFields.map((f) => {
        const val = rec.calcValues[f.id] !== undefined ? rec.calcValues[f.id] : '';
        const res = rec.submitted ? rec.fieldResults[f.id] : null;
        return `
          <div class="calc-field-row ${res ? (res.ok ? 'field-ok' : 'field-err') : ''}">
            <label class="calc-label" for="input_${q.id}_${f.id}">${f.label}</label>
            <div class="calc-input-group"><input id="input_${q.id}_${f.id}" type="text" inputmode="decimal" autocomplete="off" class="calc-input" placeholder="填入数值" data-calc-field="${f.id}" value="${val.replace(/"/g, '&quot;')}" ${rec.submitted && rec.evalOutcome === 'pass' ? 'readonly' : ''} /><span class="calc-unit">${f.unit}</span></div>
            ${res ? `<div class="calc-field-feedback ${res.ok ? 'ok' : 'err'}">${res.message}</div>` : ''}
          </div>
        `;
      }).join('');
      answerAreaHtml = `<div class="calc-steps-box">${fieldsHtml}</div>`;
    }

    const totalHints = q.hints ? q.hints.length : 0;
    const hintBtnLabel = rec.unlockedHints === 0 ? '💡 解锁锦囊 1（找突破口，不剧透答案）' : (rec.unlockedHints < totalHints ? '💡 再看锦囊 2（关键算式提示）' : `💡 已解锁全部 ${totalHints} 个锦囊`);
    const prevQ = currentIndex > 0 ? topicQuestions[currentIndex - 1] : null;
    const nextQ = currentIndex < topicQuestions.length - 1 ? topicQuestions[currentIndex + 1] : null;

    return `
      <div class="topic-layout">
        <aside class="stage-sidebar">
          <h2 class="sidebar-topic-title">${topicKey === 'topic1' ? '专题一：分段用电与热效率' : '专题二：文火武火与开关电路'}</h2>
          <p class="sidebar-topic-sub">${topicKey === 'topic1' ? '表盘小数位、脉冲闪烁、错峰三段与 P-t 图像' : '正向识图、看表选图、串联旁路与整机功率辨析'}</p>
          <div class="stage-nav-list">${navItemsHtml}</div>
        </aside>
        <article class="question-card">
          <div class="q-meta-bar">
            <div class="q-badges"><span class="badge-pill ${q.isOrigin ? 'badge-origin' : 'badge-level'}">${q.stageLabel}</span><span class="badge-pill badge-type">${q.typeLabel}</span><span class="badge-stars">${q.stars}</span></div>
            ${rec.status === 'passed' ? '<span class="badge-pill" style="background:var(--success-soft);color:var(--success);">✓ 本关已通关</span>' : ''}
          </div>
          <h1 class="q-title">${q.title}</h1>
          <div class="q-focus-point"><strong>🎯 本关靶向看点：</strong>${q.focusPoint}</div>
          <div class="q-stem">${q.stemHtml}</div>
          ${renderDiagramBox(q.stemDiagram)}${renderPhysicsTable(q.tableData)}${answerAreaHtml}
          <div class="action-toolbar">
            <div class="toolbar-left">
              <button type="button" class="btn-primary" id="submitAnswerBtn">✓ 提交验证答案</button>
              ${rec.submitted ? '<button type="button" class="btn-secondary" id="retryQuestionBtn">↺ 清空重做一遍</button>' : ''}
            </div>
            <div class="toolbar-right">
              ${totalHints > 0 ? `<button type="button" class="btn-hint" id="unlockHintBtn" ${rec.unlockedHints >= totalHints ? 'disabled style="opacity:0.65;cursor:default;"' : ''}>${hintBtnLabel}</button>` : ''}
              <button type="button" class="btn-explain-toggle" id="toggleSolutionBtn">${rec.showSolution ? '▼ 收起完整图文解析' : '▶ 展开完整图文解析'}</button>
            </div>
          </div>
          ${rec.submitted ? `<div class="result-banner ${rec.evalOutcome}"><div>${rec.evalMessage}</div></div>` : ''}
          ${rec.unlockedHints > 0 ? `<div class="hints-drawer">${q.hints.slice(0, rec.unlockedHints).map((hText, idx) => `<div class="hint-box"><strong>💡 锦囊 ${idx + 1}：</strong>${hText}</div>`).join('')}</div>` : ''}
          ${rec.showSolution ? `<div class="solution-panel"><div class="solution-header">📘 标准分步解析与方法复盘</div>${renderDiagramBox(q.solutionDiagram)}<div class="solution-steps">${q.solutionSteps.map((st) => `<div class="sol-step-item"><span class="sol-step-title">${st.title}</span><div>${st.body}</div></div>`).join('')}</div><div class="takeaway-callout"><strong>🔑 本关防错金句：</strong>${q.takeaway}</div></div>` : ''}
          <div class="stage-pager">
            <div>${prevQ ? `<button type="button" class="btn-secondary" data-select-question="${prevQ.id}">← 上一关：${prevQ.stageLabel}</button>` : ''}</div>
            <div>${nextQ ? `<button type="button" class="btn-primary" data-select-question="${nextQ.id}">下一关：${nextQ.stageLabel} →</button>` : (topicKey === 'topic1' ? '<button type="button" class="btn-primary" data-goto-tab="topic2">前往专题二：文火武火闯关 →</button>' : '<button type="button" class="btn-primary" data-goto-tab="mistakes">查看错题攻坚总览 →</button>')}</div>
          </div>
        </article>
      </div>
    `;
  }

  function renderMistakesView() {
    const wrongList = questions.filter((q) => state.records[q.id].status === 'wrong');
    const passedCount = questions.filter((q) => state.records[q.id].status === 'passed').length;
    if (wrongList.length === 0) {
      return `<section class="empty-mistakes-card"><div class="empty-icon">${passedCount === questions.length ? '🏆' : '✨'}</div><h2 style="margin:0 0 8px;font-size:22px;">${passedCount === questions.length ? '全部 12 关已零死角满贯通关！' : '当前没有待攻坚的错题记录'}</h2><p style="margin:0 auto 22px;max-width:520px;color:var(--text-secondary);font-size:14.5px;">目前已通关 ${passedCount} / ${questions.length} 关。</p><div style="display:inline-flex;gap:12px;"><button type="button" class="btn-primary" data-goto-tab="topic1">前往专题一闯关</button><button type="button" class="btn-secondary" data-goto-tab="topic2">前往专题二闯关</button></div></section>`;
    }
    return `<div class="section-heading" style="margin-top:4px;"><h2>🎯 待攻坚错题集（共 ${wrongList.length} 题）</h2><span>重新独立作答并全对后自动销号</span></div><div class="mistake-cards-list">${wrongList.map((q) => `<div class="mistake-summary-card"><div><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span class="badge-pill badge-level">${q.stageLabel}</span><span class="badge-stars">${q.stars}</span></div><h3 style="margin:0 0 6px;font-size:17px;">${q.title}</h3><p style="margin:0;font-size:13.5px;color:var(--text-secondary);">${q.focusPoint}</p></div><div style="display:flex;justify-content:flex-end;"><button type="button" class="btn-primary" data-jump-mistake="${q.id}" data-jump-topic="${q.topic}">立即重新攻克此关 →</button></div></div>`).join('')}</div>`;
  }

  function evaluateCurrentQuestion(q) {
    const rec = state.records[q.id];
    if (q.questionType === 'single' || q.questionType === 'multi') {
      if (!rec.selectedKeys.length) return showToast('请先点击选择至少一个选项再提交验证哦！');
      const correctKeys = q.options.filter((o) => o.isCorrect).map((o) => o.key);
      const hasWrongPick = rec.selectedKeys.some((k) => !correctKeys.includes(k));
      const allCorrectPicked = correctKeys.every((k) => rec.selectedKeys.includes(k));
      rec.submitted = true;
      if (!hasWrongPick && allCorrectPicked) {
        rec.status = 'passed'; rec.evalOutcome = 'pass';
        rec.evalMessage = `🎉 <strong>回答完全正确！</strong> 标准答案为 <strong>${correctKeys.join('、')}</strong>。`;
      } else if (!hasWrongPick && !allCorrectPicked) {
        rec.status = 'wrong'; rec.evalOutcome = 'partial';
        rec.evalMessage = `⚠️ <strong>差一点就满分啦（漏选）！</strong> 标准答案为 <strong>${correctKeys.join('、')}</strong>。`;
      } else {
        rec.status = 'wrong'; rec.evalOutcome = 'fail';
        rec.evalMessage = `❌ <strong>掉进命题陷阱啦！</strong> 标准答案为 <strong>${correctKeys.join('、')}</strong>。`;
      }
    } else if (q.questionType === 'calc') {
      if (q.calcFields.some((f) => !(rec.calcValues[f.id] || '').trim())) return showToast('还有空白步骤没填完哦！');
      rec.submitted = true; rec.fieldResults = {};
      let allOk = true;
      q.calcFields.forEach((f) => {
        const num = Number((rec.calcValues[f.id] || '').trim().replace(/[%WΩkWh·\s]/gi, ''));
        if (Number.isNaN(num)) { allOk = false; rec.fieldResults[f.id] = { ok: false, message: '请输入有效数字。' }; }
        else if (Math.abs(num - f.answer) <= f.tolerance) { rec.fieldResults[f.id] = { ok: true, message: `✓ 计算准确！（${f.answer} ${f.unit}）` }; }
        else { allOk = false; rec.fieldResults[f.id] = { ok: false, message: f.wrongTenxHint && Math.abs(num - f.answer * 10) <= 5 ? `✗ ${f.wrongTenxHint}` : `✗ 数值不对哦（你填了 ${num}）：${f.errorHint}` }; }
      });
      rec.status = allOk ? 'passed' : 'wrong';
      rec.evalOutcome = allOk ? 'pass' : 'fail';
      rec.evalMessage = allOk ? '🎉 <strong>全步骤计算精准无误，顺利通关！</strong>' : '🔍 <strong>部分步骤数值有偏差，请按提示修正标红步骤！</strong>';
    }
    saveState(); renderApp();
  }

  function renderApp() {
    syncHeaderMetrics();
    const container = document.getElementById('workspaceContainer');
    if (state.activeTab === 'guide') container.innerHTML = renderGuideView();
    else if (state.activeTab === 'topic1' || state.activeTab === 'topic2') container.innerHTML = renderTopicView(state.activeTab);
    else container.innerHTML = renderMistakesView();
  }

  function getActiveQuestion() {
    if (state.activeTab !== 'topic1' && state.activeTab !== 'topic2') return null;
    const topicList = questions.filter((q) => q.topic === state.activeTab);
    return topicList.find((q) => q.id === state.activeStageByTopic[state.activeTab]) || topicList[0];
  }

  document.getElementById('brandHomeBtn').addEventListener('click', () => { state.activeTab = 'guide'; saveState(); renderApp(); });
  document.querySelectorAll('.main-tabs .tab-btn').forEach((btn) => btn.addEventListener('click', () => { state.activeTab = btn.dataset.tab; saveState(); renderApp(); }));
  document.getElementById('resetAllProgressBtn').addEventListener('click', () => { questions.forEach((q) => { state.records[q.id] = createDefaultRecord(); }); saveState(); renderApp(); showToast('已重置全部关卡作答记录'); });

  const container = document.getElementById('workspaceContainer');
  container.addEventListener('input', (e) => {
    const input = e.target.closest('[data-calc-field]');
    const q = getActiveQuestion();
    if (input && q) { state.records[q.id].calcValues[input.dataset.calcField] = input.value; saveState(); }
  });

  container.addEventListener('click', (e) => {
    const gotoTabBtn = e.target.closest('[data-goto-tab]');
    if (gotoTabBtn) { state.activeTab = gotoTabBtn.dataset.gotoTab; saveState(); renderApp(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const topoBtn = e.target.closest('[data-sb-topology]');
    if (topoBtn) { state.sandbox.topology = topoBtn.dataset.sbTopology; saveState(); renderApp(); return; }
    const sbToggleBtn = e.target.closest('[data-sb-toggle]');
    if (sbToggleBtn) { state.sandbox[sbToggleBtn.dataset.sbToggle] = !state.sandbox[sbToggleBtn.dataset.sbToggle]; saveState(); renderApp(); return; }
    const svgSw = e.target.closest('[data-switch]');
    if (svgSw && svgSw.dataset.switch in state.sandbox) { state.sandbox[svgSw.dataset.switch] = !state.sandbox[svgSw.dataset.switch]; saveState(); renderApp(); return; }
    const jumpMisBtn = e.target.closest('[data-jump-mistake]');
    if (jumpMisBtn) { state.activeTab = jumpMisBtn.dataset.jumpTopic; state.activeStageByTopic[state.activeTab] = jumpMisBtn.dataset.jumpMistake; saveState(); renderApp(); return; }
    const selQBtn = e.target.closest('[data-select-question]');
    if (selQBtn) { state.activeStageByTopic[state.activeTab] = selQBtn.dataset.selectQuestion; saveState(); renderApp(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const optEl = e.target.closest('[data-opt-key]');
    if (optEl) {
      const q = getActiveQuestion(); if (!q) return;
      const rec = state.records[q.id];
      if (rec.submitted && rec.evalOutcome === 'pass') return;
      rec.submitted = false;
      const key = optEl.dataset.optKey;
      rec.selectedKeys = q.questionType === 'single' ? [key] : (rec.selectedKeys.includes(key) ? rec.selectedKeys.filter((k) => k !== key) : [...rec.selectedKeys, key].sort());
      saveState(); renderApp(); return;
    }
    if (e.target.closest('#submitAnswerBtn')) { const q = getActiveQuestion(); if (q) evaluateCurrentQuestion(q); return; }
    if (e.target.closest('#retryQuestionBtn')) { const q = getActiveQuestion(); if (q) { state.records[q.id] = { ...createDefaultRecord(), status: state.records[q.id].status === 'wrong' ? 'wrong' : 'unstarted' }; saveState(); renderApp(); } return; }
    if (e.target.closest('#unlockHintBtn')) { const q = getActiveQuestion(); if (q && state.records[q.id].unlockedHints < q.hints.length) { state.records[q.id].unlockedHints += 1; saveState(); renderApp(); } return; }
    if (e.target.closest('#toggleSolutionBtn')) { const q = getActiveQuestion(); if (q) { state.records[q.id].showSolution = !state.records[q.id].showSolution; saveState(); renderApp(); } }
  });

  renderApp();
})();
