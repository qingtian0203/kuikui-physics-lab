/* ==========================================================================
   葵葵初三物理电热靶向题库（第一版：2 道原卷母题复盘 + 10 道严选阶梯通关题）
   ========================================================================== */

window.QuestionBank = [
  {
    id: 't1_origin', topic: 'topic1', stageLabel: '母题复盘', isOrigin: true, stars: '★★☆', questionType: 'multi',
    typeLabel: '多选题 · 原卷第142页第7题', title: '电热水壶与电饭煲分段工作综合分析',
    focusPoint: '核心套路：先找「只有一台电器工作」的时间段算准它的功率，再倒推重叠时段把它扣掉！',
    stemHtml: `
      <p>小刚研究家中的电热水壶和电饭煲的工作情况，进行了如下实验：他先关闭家中所有的用电器，并记录电能表的示数；在电热水壶中装入 <strong>1.8 L</strong>、初温为 <strong>10 ℃</strong> 的水，在电饭煲中放入需要加热的食物，让电热水壶和电饭煲<strong>同时开始工作</strong>。</p>
      <p>工作 <strong>10 min</strong> 时电热水壶中水的温度达到 <strong>100 ℃</strong>，电热水壶自动断开开关，小刚记录此时电能表的示数变化了 <strong>0.35 kW·h</strong>；再过 <strong>20 min</strong> 电饭煲煮熟食物，并自动切换为保温状态，小刚观察此时电能表的示数又变化了 <strong>0.3 kW·h</strong>。已知水的比热容为 4.2×10³ J/(kg·℃)，水的密度为 1.0×10³ kg/m³，下列说法中正确的是（多选）：</p>
    `,
    options: [
      { key: 'A', text: '电热水壶的实际功率为 1200 W', isCorrect: true, diag: '正确！前 10 min 电饭煲用电 0.15 kW·h，剥离出水壶用电 0.35 − 0.15 = 0.20 kW·h，除以 (10/60) h 得 1.2 kW = 1200 W。' },
      { key: 'B', text: '电热水壶的热效率约为 94.5%', isCorrect: true, diag: '正确！水吸热 Q = 4200 × 1.8 × 90 = 6.804×10⁵ J，水壶耗电 W = 0.20 × 3.6×10⁶ = 7.2×10⁵ J，Q ÷ W = 94.5%。' },
      { key: 'C', text: '电饭煲比电热水壶消耗电能快', isCorrect: false, diag: '易错陷阱！「消耗电能快慢」看的是电功率 P，不是总用电量！电饭煲 900 W < 水壶 1200 W，所以水壶消耗电能更快。' },
      { key: 'D', text: '电饭煲煮熟食物过程消耗的电能为 0.45 kW·h', isCorrect: true, diag: '正确！别漏掉前 10 min 电饭煲也在工作：0.15 kW·h（前 10 min）+ 0.30 kW·h（后 20 min）= 0.45 kW·h。' }
    ],
    hints: [
      '突破口在「后 20 min」：水壶已经断电了！这 0.3 kW·h 全是电饭煲一个人用的，先把 20 min 换算成 1/3 h 算出电饭煲功率。',
      '电饭煲加热功率恒定，后 20 min 用了 0.3 kW·h，那前 10 min（时间正好是一半）它用了多少度电？从 0.35 kW·h 里减掉它就是水壶的耗电量！'
    ],
    solutionDiagram: {
      type: 'timeline', caption: '图解突破口：从右侧「单电器段」算出电饭煲功率，向左倒推剥离水壶耗电',
      config: { stages: [
        { label: '前 10 min (1/6 h)', widthRatio: 0.44, topBar: '电热水壶：0.35 − 0.15 = 0.20 kW·h', bottomBar: '电饭煲加热：倒推得 0.15 kW·h', totalText: '两机合计 ΔW₁ = 0.35 kW·h', isBreakthrough: false },
        { label: '后 20 min (1/3 h)', widthRatio: 0.56, topBar: null, bottomBar: '仅电饭煲加热：P₂ = 0.30 ÷ (1/3) = 0.9 kW', totalText: '单机耗电 ΔW₂ = 0.30 kW·h', isBreakthrough: true }
      ] }
    },
    solutionSteps: [
      { title: '第一步：抓「单电器时段」求电饭煲功率', body: '后 20 min = 1/3 h 只有电饭煲工作，P煲 = W₂ ÷ t₂ = 0.3 kW·h ÷ (1/3 h) = 0.9 kW = 900 W。' },
      { title: '第二步：倒推重叠时段，剥离水壶电能与功率', body: '前 10 min = 1/6 h 内，电饭煲耗电 W煲₁ = 0.9 kW × (1/6 h) = 0.15 kW·h（全程共耗电 0.45 kW·h，D 正确）。水壶耗电 0.20 kW·h，功率 1200 W（A 正确，C 错误）。' },
      { title: '第三步：统一焦耳单位求烧水热效率', body: 'Q吸 = 4.2×10³ × 1.8 × 90 = 6.804×10⁵ J，W壶 = 0.20 × 3.6×10⁶ J = 7.2×10⁵ J，η = 94.5%（B 正确）。' }
    ],
    takeaway: '记住两句铁律：①「消耗电能快慢」永远比功率 P，不比电能 W；② 算热效率前必须把 kW·h 乘 3.6×10⁶ 化成焦耳（J）！'
  },
  {
    id: 't1_lv1', topic: 'topic1', stageLabel: '第 1 关 · 入门搭梯', isOrigin: false, stars: '★☆☆', questionType: 'calc',
    typeLabel: '分步引导计算 · 表盘读数防坑', title: '从三次电能表表盘读数剥离双机功率',
    focusPoint: '中考高频暗坑：电能表数字窗最后一位红框是「0.1 kW·h 小数位」，千万别多看十倍！',
    stemHtml: `<p>关闭家中其他用电器后，让装有 <strong>2.5 L</strong>、初温 <strong>10 ℃</strong> 水的电热水壶与电饭煲同时开始恒定功率加热。<strong>12 min</strong> 后水烧开至 <strong>100 ℃</strong>，水壶自动断电；电饭煲又单独加热 <strong>18 min</strong> 后断电。三个时刻电能表的表盘示数如下图所示（水的密度取 1.0 kg/L，比热容取 4.2×10³ J/(kg·℃)）。</p>`,
    stemDiagram: { type: 'meter_dials', caption: '注意观察三个时刻表盘末尾红框数字的变化', readings: [{ timeLabel: '① 同时开启时刻', digits: '13521' }, { timeLabel: '② 12 min 水壶断电', digits: '13526' }, { timeLabel: '③ 再过 18 min 结束', digits: '13529' }] },
    calcFields: [
      { id: 'p_cooker', label: '① 由后 18 min 单独工作段，算出电饭煲的加热功率 P煲 =', unit: 'W', answer: 1000, tolerance: 1, wrongTenxHint: '你是不是把 0.3 kW·h 看成 3 kW·h 了？表盘最后一位红框是小数位（1352.9 − 1352.6 = 0.3 kW·h）！', errorHint: '后 18 min = 0.3 h，用电量为 1352.9 − 1352.6 = 0.3 kW·h，用 P = W ÷ t 再算一次（注意化成瓦特 W）。' },
      { id: 'w_kettle', label: '② 剥离前 12 min 重叠段后，电热水壶单独消耗的电能 W壶 =', unit: 'kW·h', answer: 0.3, tolerance: 0.005, errorHint: '前 12 min（0.2 h）总耗电 0.5 kW·h，减去电饭煲在这 0.2 h 用的 1.0 kW × 0.2 h = 0.2 kW·h。' },
      { id: 'p_kettle', label: '③ 电热水壶的实际加热功率 P壶 =', unit: 'W', answer: 1500, tolerance: 1, errorHint: '水壶在 12 min（0.2 h）内消耗了 0.3 kW·h，P壶 = 0.3 kW·h ÷ 0.2 h = 1.5 kW = 1500 W。' },
      { id: 'eta_kettle', label: '④ 电热水壶此次烧水的热效率 η =', unit: '%', answer: 87.5, tolerance: 0.2, errorHint: 'Q吸 = 4200 × 2.5 × 90 = 9.45×10⁵ J；W壶 = 0.3 × 3.6×10⁶ = 1.08×10⁶ J，相除再乘 100。' }
    ],
    hints: ['先读准三个数：1352.1 kW·h → 1352.6 kW·h（共用 0.5 度）→ 1352.9 kW·h（单用 0.3 度）。', '12 min = 0.2 h，18 min = 0.3 h！化成小数小时非常好算。'],
    solutionSteps: [
      { title: '第一步：正确读取带小数框的电能表差值', body: '前 12 min（0.2 h）共耗电 0.5 kW·h；后 18 min（0.3 h）仅电饭煲耗电 0.3 kW·h。' },
      { title: '第二步：求电饭煲功率并倒推剥离', body: 'P煲 = 0.3 ÷ 0.3 = 1.0 kW = 1000 W；水壶耗电 0.5 − 0.2 = 0.3 kW·h，P壶 = 1500 W。' },
      { title: '第三步：计算水吸收热量与热效率', body: 'Q吸 = 9.45×10⁵ J，W壶 = 1.08×10⁶ J，η = 87.5%。' }
    ],
    takeaway: '遇到电能表实物图，第一反应永远是用笔圈出最后一位框线，写上小数点，再做减法！'
  },
  {
    id: 't1_lv2', topic: 'topic1', stageLabel: '第 2 关 · 计量进阶', isOrigin: false, stars: '★★☆', questionType: 'multi',
    typeLabel: '多选题 · 脉冲闪烁常考变形', title: '利用电能表脉冲闪烁次数反推功率与效率',
    focusPoint: '把「直接给度数」升级为「闪灯次数 ÷ 脉冲常数 = 度数」，同时训练多选题防漏选、防误选！',
    stemHtml: `
      <p>小阳家的电能表盘上标有 <strong>“3000 imp/(kW·h)”</strong> 字样。关闭其他电器后，将装有 <strong>2.0 L</strong>、初温 <strong>20 ℃</strong> 水的电热水壶与电蒸锅同时开启恒定功率加热。</p>
      <p>共同工作 <strong>10 min</strong> 后，壶中水恰好烧开至 <strong>100 ℃</strong> 并自动断电，这 10 min 内电能表指示灯闪烁了 <strong>1050 次</strong>；随后电蒸锅继续单独加热 <strong>15 min</strong> 后断电，这 15 min 内指示灯又闪烁了 <strong>675 次</strong>。已知 c水 = 4.2×10³ J/(kg·℃)，下列说法正确的是（多选）：</p>
    `,
    options: [
      { key: 'A', text: '前 10 min 内，电热水壶和电蒸锅一共消耗电能 0.35 kW·h', isCorrect: true, diag: '正确！1050 次 ÷ 3000 imp/(kW·h) = 0.35 kW·h。' },
      { key: 'B', text: '电蒸锅的加热功率为 900 W，比电热水壶消耗电能慢', isCorrect: true, diag: '正确！后 15 min（0.25 h）耗电 0.225 kW·h，P锅 = 900 W < 水壶 1200 W。' },
      { key: 'C', text: '电热水壶在 10 min 内消耗的电能为 0.35 kW·h', isCorrect: false, diag: '典型陷阱！0.35 kW·h 是两台总电能，扣掉电蒸锅的 0.15 kW·h 后水壶只用了 0.20 kW·h！' },
      { key: 'D', text: '电热水壶烧水时的热效率约为 93.3%', isCorrect: true, diag: '正确！Q吸 = 6.72×10⁵ J，W壶 = 7.2×10⁵ J，6.72 ÷ 7.2 ≈ 93.3%。' }
    ],
    hints: ['先把两次闪灯次数都换成 kW·h：前段 W₁ = 0.35 kW·h；后段 W₂ = 0.225 kW·h。', '后 15 min = 0.25 h，0.225 ÷ 0.25 立刻口算出电蒸锅功率是 0.9 kW！'],
    solutionSteps: [
      { title: '第一步：由脉冲闪烁次数折算两段电能', body: 'W₁ = 1050 ÷ 3000 = 0.35 kW·h（A 正确）；W₂ = 675 ÷ 3000 = 0.225 kW·h。' },
      { title: '第二步：计算两电器功率并比较快慢', body: 'P锅 = 0.225 ÷ 0.25 = 900 W；水壶耗电 0.20 kW·h（C 错），P壶 = 1200 W > 900 W（B 正确）。' },
      { title: '第三步：核算水壶热效率', body: 'η = 6.72×10⁵ ÷ 7.2×10⁵ ≈ 93.3%（D 正确）。' }
    ],
    takeaway: '不论给的是度数变化、表盘读数还是闪灯次数，第一步统统折算成 ΔW（kW·h），后面就完全回到母题模型了！'
  },
  {
    id: 't1_lv3', topic: 'topic1', stageLabel: '第 3 关 · 错峰变式', isOrigin: false, stars: '★★☆', questionType: 'calc',
    typeLabel: '分步引导计算 · 先后启动三段制', title: '先后开机、中途重叠的三时段用电拆解',
    focusPoint: '破除定势：① 电器不一定同时开，突破口可能在第一段；② 烧水壶的功率不一定比另一台电器大！',
    stemHtml: `
      <p>周末妈妈使用电烤箱和养生壶（各自工作时功率均恒定，其余电器关闭）：</p>
      <p>• <strong>第 1 段（0~5 min）</strong>：先只开电烤箱单独预热 <strong>5 min</strong>，电能表示数增加了 <strong>0.12 kW·h</strong>；<br/>
         • <strong>第 2 段（5~15 min）</strong>：保持电烤箱工作，同时开启装有 <strong>1.25 L</strong>、初温 <strong>10 ℃</strong> 水的养生壶，两者共同工作 <strong>10 min</strong> 后水沸腾至 <strong>100 ℃</strong>，养生壶自动断电，这 10 min 内电能表示数增加了 <strong>0.39 kW·h</strong>；<br/>
         • <strong>第 3 段（15~30 min）</strong>：电烤箱继续单独烘烤 <strong>15 min</strong> 后结束工作。</p>
      <p>已知水的密度为 1.0 kg/L，c水 = 4.2×10³ J/(kg·℃)，请按步骤完成推算：</p>
    `,
    calcFields: [
      { id: 'p_oven', label: '① 由前 5 min 单独预热段，求电烤箱功率 P箱 =', unit: 'W', answer: 1440, tolerance: 1, errorHint: '5 min = 1/12 h，P箱 = 0.12 ÷ (1/12) = 1.44 kW = 1440 W。' },
      { id: 'p_pot', label: '② 剥离中间 10 min 重叠段后，养生壶的加热功率 P壶 =', unit: 'W', answer: 900, tolerance: 1, errorHint: '中间 10 min 电烤箱耗电 0.24 kW·h，养生壶耗电 0.39 − 0.24 = 0.15 kW·h，再除以 1/6 h。' },
      { id: 'eta_pot', label: '③ 养生壶此次烧水的热效率 η =', unit: '%', answer: 87.5, tolerance: 0.2, errorHint: 'Q吸 = 4.725×10⁵ J；W壶 = 5.4×10⁵ J，两者相除。' },
      { id: 'w_total30', label: '④ 全程 30 min 结束时，电能表示数一共增加了', unit: 'kW·h', answer: 0.87, tolerance: 0.005, errorHint: '第 3 段最后 15 min 电烤箱还用了 0.36 kW·h！三段相加：0.12 + 0.39 + 0.36。' }
    ],
    hints: ['前 5 min（1/12 h）只有电烤箱，0.12 ÷ (1/12) = 1.44 kW。', '10 min 是 5 min 的 2 倍（0.24 度），15 min 是 5 min 的 3 倍（0.36 度）！'],
    solutionDiagram: {
      type: 'timeline', caption: '三段时间轴拆解：巧用 5 : 10 : 15 = 1 : 2 : 3 的时间倍数秒算电烤箱各段耗电！',
      config: { stages: [
        { label: '0~5 min', widthRatio: 0.24, topBar: null, bottomBar: '烤箱 0.12', totalText: 'ΔW₁=0.12', isBreakthrough: true },
        { label: '5~15 min (重叠)', widthRatio: 0.38, topBar: '养生壶 0.39−0.24=0.15', bottomBar: '烤箱 0.12×2 = 0.24 kW·h', totalText: 'ΔW₂ = 0.39 kW·h', isBreakthrough: false },
        { label: '15~30 min', widthRatio: 0.38, topBar: null, bottomBar: '烤箱 0.12×3 = 0.36 kW·h', totalText: 'ΔW₃ = 0.36 kW·h', isBreakthrough: false }
      ] }
    },
    solutionSteps: [
      { title: '第一步：求电烤箱功率', body: 'P箱 = 1440 W，第 2 段耗电 0.24 kW·h，第 3 段耗电 0.36 kW·h。' },
      { title: '第二步：剥离养生壶功率与热效率', body: 'W壶 = 0.15 kW·h，P壶 = 900 W，η = 87.5%。' },
      { title: '第三步：汇总全程总电能', body: 'W总 = 0.12 + 0.39 + 0.36 = 0.87 kW·h。' }
    ],
    takeaway: '同一恒定功率电器在不同时段的耗电量与时间成正比，巧用时间倍数连除法都能省掉！'
  },
  {
    id: 't1_lv4', topic: 'topic1', stageLabel: '第 4 关 · 图像融合', isOrigin: false, stars: '★★★', questionType: 'single',
    typeLabel: '单选题 · P-t 图像与逆向求末温', title: '从总功率 P-t 阶梯图像逆推烧水末温',
    focusPoint: '新考法突破：直接从 P-t 图像高度差读出单机功率，并用 Q吸 = ηW 逆向求水升高的温度！',
    stemHtml: `<p>将装有 <strong>1.5 kg</strong>、初温 <strong>15 ℃</strong> 水的电热水壶与恒温煲汤锅同时接入家庭电路并开启，10 min 时电热水壶定时结束自动断电，煲汤锅工作至 25 min 断电。两电器总电功率随时间变化的 <em>P</em><sub>总</sub>-<em>t</em> 图像如下图所示。已知电热水壶烧水的热效率为 <strong>70%</strong>，c水 = 4.2×10³ J/(kg·℃)，标准大气压下，下列说法正确的是（单选）：</p>`,
    stemDiagram: { type: 'pt_graph', caption: '电路总功率 P总 随工作时间 t 变化的阶梯图像' },
    options: [
      { key: 'A', text: '电热水壶的实际加热功率为 2000 W', isCorrect: false, diag: '2000 W 是水壶 + 煲汤锅叠加的总功率，水壶功率应为 1200 W。' },
      { key: 'B', text: '0~25 min 全程两台用电器一共消耗电能 0.6 kW·h', isCorrect: false, diag: '合计约 0.533 kW·h ≠ 0.6 kW·h。' },
      { key: 'C', text: '10 min 水壶断电时，壶内水的温度升高到了 95 ℃', isCorrect: true, diag: '正确！W壶 = 7.2×10⁵ J，Q吸 = 5.04×10⁵ J，Δt = 80 ℃，末温 t = 15 + 80 = 95 ℃！' },
      { key: 'D', text: '10 min 水壶断电时，壶内水的温度升高了 95 ℃', isCorrect: false, diag: '经典审题文字坑！「升高了 Δt」是 80 ℃，「升高到（末温 t）」才是 95 ℃！' }
    ],
    hints: ['10~25 min 高度是 800 W，0~10 min 高度是 2000 W，相减得水壶功率 1200 W！', '算出 Δt = 80 ℃ 后看清选项写的是「升高到」还是「升高了」！'],
    solutionSteps: [
      { title: '第一步：秒读水壶功率', body: 'P壶 = 2000 W − 800 W = 1200 W。' },
      { title: '第二步：逆推末温 t', body: 'W壶 = 7.2×10⁵ J，Q吸 = 5.04×10⁵ J，Δt = 80 ℃，末温 t = 15 + 80 = 95 ℃（选 C）。' }
    ],
    takeaway: '物理热学题必圈关键词「升高了（Δt）」与「升高到（末温 t）」！'
  },
  {
    id: 't1_lv5', topic: 'topic1', stageLabel: '第 5 关 · 终极验收', isOrigin: false, stars: '★★★', questionType: 'multi',
    typeLabel: '多选题 · 加热保温双档叠加压轴', title: '水壶同开 + 电饭煲「加热转保温」全流程压轴验收',
    focusPoint: '专题一终极试金石：把电饭煲自身的「加热档」和「保温档」也加进来，看你能不能精准对号入座！',
    stemHtml: `
      <p>单独测试家中的电热水壶与电饭煲：将装有 <strong>1.8 L</strong>、初温 <strong>20 ℃</strong> 水的电热水壶与处于<strong>加热档</strong>的电饭煲同时开启：</p>
      <p>• <strong>0~10 min</strong>：10 min 末壶内水烧开至 <strong>100 ℃</strong> 水壶自动断电，此 10 min 电能表示数增加 <strong>0.35 kW·h</strong>；<br/>
         • <strong>10~25 min</strong>：电饭煲继续处于加热档工作 15 min 后煮熟米饭，此 15 min 电能表示数增加 <strong>0.225 kW·h</strong>；<br/>
         • <strong>25~55 min</strong>：电饭煲自动切换为<strong>保温档</strong>持续保温 30 min，此 30 min 电能表示数增加 <strong>0.05 kW·h</strong>。</p>
      <p>已知 c水 = 4.2×10³ J/(kg·℃)，下列说法正确的是（多选）：</p>
    `,
    options: [
      { key: 'A', text: '电饭煲加热档功率为 900 W，保温档功率为 100 W', isCorrect: true, diag: '正确！加热档 900 W，保温档 100 W。' },
      { key: 'B', text: '0~10 min 内电饭煲消耗的电能与 25~55 min 保温消耗的电能相等', isCorrect: false, diag: '错误！0~10 min 耗电 0.15 kW·h ≠ 保温段 0.05 kW·h。' },
      { key: 'C', text: '电热水壶的实际功率为 1200 W，烧水热效率为 84%', isCorrect: true, diag: '正确！W壶 = 0.20 kW·h = 7.2×10⁵ J，Q吸 = 6.048×10⁵ J，η = 84%！' },
      { key: 'D', text: '0~55 min 全过程中，电饭煲一共消耗了 0.425 kW·h 的电能', isCorrect: true, diag: '正确！0.15 + 0.225 + 0.05 = 0.425 kW·h。' }
    ],
    hints: ['倒推 0~10 min 时必须用加热档功率（900 W），别误用保温档功率！', 'D 选项只问电饭煲全程用电，别混入水壶的 0.20 kW·h！'],
    solutionSteps: [
      { title: '第一步：求加热与保温功率', body: 'P热 = 900 W，P保 = 100 W（A 正确）。' },
      { title: '第二步：算准水壶功率与效率', body: 'W壶 = 0.20 kW·h，P壶 = 1200 W，η = 84%（C 正确）。' },
      { title: '第三步：汇总电饭煲三段总耗电', body: '0.15 + 0.225 + 0.05 = 0.425 kW·h（D 正确）。' }
    ],
    takeaway: '盯紧「哪段时间谁在以什么档位工作」，再复杂的多段题都逃不出手掌心！'
  },
  {
    id: 't2_origin', topic: 'topic2', stageLabel: '母题复盘', isOrigin: true, stars: '★★★', questionType: 'single',
    typeLabel: '单选题 · 原卷第142页第8题', title: '中药煎药壶文火、武火与双自动开关推理',
    focusPoint: '原卷卡壳点突破：你在卷子上画对了 R₁、R₂ 串联，只差一步——把自动开关跨接在限流电阻 R₂ 两端当「近道（旁路）」！',
    stemHtml: `<p>中药煎煮方式分为“文火”和“武火”。小阳用手动开关 S₁、温控开关 S₂、水量开关 S₃、加热电阻 R₁ 和限流电阻 R₂（R₁、R₂ 阻值不随温度变化），设计了煎药壶电路，电源电压为 <strong>220 V</strong>。闭合开关 S₁，能实现如表所示的功能，下列说法正确的是（单选）：</p>`,
    tableData: { headers: ['温度 t / ℃', '温控开关 S₂', '壶内水量 V / L', '水量开关 S₃', 'R₁ 的功率 P / W', '煎煮方式'], rows: [['< 60', '闭合', '> 0.2', '闭合', '800', '武火'], ['≥ 60', '断开', '> 0.2', '闭合', '800', '武火'], ['≥ 60', '断开', '≤ 0.2', '断开', '100', '文火']] },
    options: [
      { key: 'A', text: 'R₁、R₂ 并联', isCorrect: false, diag: '若并联，R₁ 两端恒为 220 V，功率不会变！只有串联分压才能改变 R₁ 的功率。' },
      { key: 'B', text: 'R₁ 的阻值是 484 Ω', isCorrect: false, diag: '文火 100 W 时 R₁ 两端不是 220 V！应用武火算：R₁ = 220² ÷ 800 = 60.5 Ω。' },
      { key: 'C', text: '若 R₂ 断路，煎药壶工作时只能进行武火加热', isCorrect: true, diag: '正确！R₂ 断路后串联文火断死，旁路闭合时只有 R₁ 接入 220 V，正是武火！' },
      { key: 'D', text: '若壶内水量小于 0.2 L，煎药壶工作时无法进行武火加热', isCorrect: false, diag: '当水量 ≤ 0.2 L 但温度 < 60 ℃ 时，温控开关 S₂ 依然闭合短路 R₂，照样是武火！' }
    ],
    hints: ['R₁ 功率能变小，说明必有 R₂ 串联分压！', '任一闭合即升武火，说明 S₂、S₃ 各自并联在 R₂ 两端！'],
    solutionDiagram: { type: 'static_circuit', variant: 'origin8_standard', caption: '原卷第 8 题标准物理电路图：R₁ 与 R₂ 串联，S₂、S₃ 并联跨接在限流电阻 R₂ 两端' },
    solutionSteps: [
      { title: '第一步：锁定两电阻串联', body: 'R₁ 功率可变说明电压可变，R₁ 与 R₂ 必串联（排除 A）。' },
      { title: '第二步：求准 R₁ 阻值', body: '武火时 U₁ = 220 V，R₁ = 220² ÷ 800 = 60.5 Ω（排除 B）。' },
      { title: '第三步：排查故障与隐藏行', body: 'R₂ 断路后还能加热时只有武火（C 对）；低温少水时 S₂ 闭合仍可武火（排除 D）。' }
    ],
    takeaway: '黄金模型：「限流电阻 R₂ 串联保底当文火，自动开关跨在 R₂ 头顶抄近道当武火」！'
  },
  {
    id: 't2_lv1', topic: 'topic2', stageLabel: '第 1 关 · 识图筑基', isOrigin: false, stars: '★☆☆', questionType: 'single',
    typeLabel: '单选题 · 正向看图算阻值', title: '先正向跑通：单温控开关如何实现文武火切换',
    focusPoint: '把两个自动开关先简化成 1 个开关，给你标准电路图，彻底算明白武火和文火的电压与电阻关系！',
    stemHtml: `<p>某简易电热炖盅内部电路如下图所示，电源电压恒为 <strong>220 V</strong>，R₁ 为壶底加热电阻，R₂ 为限流电阻（阻值均不变），S₁ 为总开关，S₂ 为温控开关。闭合总开关 S₁ 后，当 S₂ 处于不同状态时，加热电阻 R₁ 的功率分别为 <strong>880 W</strong> 和 <strong>220 W</strong>。下列说法正确的是（单选）：</p>`,
    stemDiagram: { type: 'static_circuit', variant: 'single_s2_bypass', caption: '简易双档电热炖盅标准电路图' },
    options: [
      { key: 'A', text: '闭合 S₁、断开 S₂ 时，炖盅处于 880 W 的武火档', isCorrect: false, diag: '断开 S₂ 时两电阻串联分压，是 220 W 文火档。' },
      { key: 'B', text: '闭合 S₁ 和 S₂ 时处于武火档，且限流电阻 R₂ 的阻值为 55 Ω', isCorrect: true, diag: '正确！R₁ = 220² ÷ 880 = 55 Ω；文火功率变 1/4 则 U₁ 减半为 110 V，故 R₂ = R₁ = 55 Ω！' },
      { key: 'C', text: '加热电阻 R₁ 的阻值为 220 Ω', isCorrect: false, diag: '武火时 R₁ = 48400 ÷ 880 = 55 Ω。' },
      { key: 'D', text: '文火状态下，加热电阻 R₁ 两端的实际电压仍为 220 V', isCorrect: false, diag: '文火时 R₁ 与 R₂ 各分得 110 V。' }
    ],
    hints: ['S₂ 闭合时把 R₂ 短路，R₁ 独享 220 V！', '文火功率 220 W 是武火 880 W 的 1/4，说明文火时 R₁ 电压减半为 110 V！'],
    solutionSteps: [
      { title: '第一步：判断档位', body: 'S₂ 闭合短路 R₂ 为武火（880 W），断开串联为文火（220 W）。' },
      { title: '第二步：计算阻值', body: 'R₁ = 55 Ω，串联平分 110 V 得 R₂ = 55 Ω（选 B）。' }
    ],
    takeaway: '同一个加热电阻，功率变为原来的 1/4 ↔ 电压变为原来的 1/2（110 V）！'
  },
  {
    id: 't2_lv2', topic: 'topic2', stageLabel: '第 2 关 · 看表选图', isOrigin: false, stars: '★★☆', questionType: 'single', diagramOptions: true,
    typeLabel: '电路图四选一 · 或门旁路逆推', title: '根据双开关功率表，选出唯一正确的标准电路图',
    focusPoint: '正面攻克画图难关：四个候选电路摆在你面前，学会用排除法一眼挑出「任一闭合即武火」的接法！',
    stemHtml: `<p>某自动煎药壶使用 220 V 电源、总开关 S₁、加热电阻 R₁、限流电阻 R₂ 以及温控开关 S₂、水量开关 S₃。闭合总开关 S₁ 后，测得不同开关组合下<strong>加热电阻 R₁ 的功率</strong>如下表所示。下列四个电路设计图中，完全符合表格功能的是（单选）：</p>`,
    tableData: { headers: ['温控开关 S₂', '水量开关 S₃', '加热电阻 R₁ 功率', '档位状态'], rows: [['闭合', '断开', '800 W', '武火'], ['断开', '闭合', '800 W', '武火'], ['断开', '断开', '200 W', '文火']] },
    options: [
      { key: 'A', text: '方案 A：R₁ 与 R₂ 并联在干路两端', svgVariant: 'opt_parallel_res', isCorrect: false, diag: '图 A 中 R₁ 直接接在 220 V 电源上，功率永远不会变！' },
      { key: 'B', text: '方案 B：S₂ 与 S₃ 串联后跨接在 R₂ 两端', svgVariant: 'opt_series_sw', isCorrect: false, diag: '图 B 中只闭合一个开关时旁路不通（仍是 200 W 文火），与表格矛盾！' },
      { key: 'C', text: '方案 C：S₂ 与 S₃ 分别并联跨接在 R₂ 两端', svgVariant: 'opt_parallel_sw', isCorrect: true, diag: '完全正确！任一闭合都能绕过 R₂ 升 800 W 武火，全断开走 R₂ 串联 200 W 文火！' },
      { key: 'D', text: '方案 D：S₂ 与 S₃ 并联跨接在加热电阻 R₁ 两端', svgVariant: 'opt_short_r1', isCorrect: false, diag: '开关跨在 R₁ 两端会把加热电阻短路掉（功率变 0 W）！' }
    ],
    hints: ['升武火需要短路掉限流电阻 R₂，所以开关必须跨在 R₂ 两端（排除 A、D）！', '「闭，断」就能升武火，说明两条近道互不依赖——选并联！'],
    solutionSteps: [
      { title: '第一步：明确被短路对象是 R₂', body: '自动开关必须跨接在限流电阻 R₂ 两端（排除 A、D）。' },
      { title: '第二步：任一闭合即武火对应开关并联', body: '两开关各自独立构成旁路，故选 C。' }
    ],
    takeaway: '口诀记牢：「任一闭合升武火 → 两开关并联跨 R₂；同时闭合才武火 → 两开关串联跨 R₂」！'
  },
  {
    id: 't2_lv3', topic: 'topic2', stageLabel: '第 3 关 · 组合反转', isOrigin: false, stars: '★★☆', questionType: 'calc',
    typeLabel: '分步引导计算 · 与门串联旁路 + 临界陷阱', title: '改变档位逻辑：双条件同时满足才升武火',
    focusPoint: '把开关组合反过来考你！还要小心「低于 70 ℃」遇上「恰好 70 ℃」的不等号边界陷阱！',
    stemHtml: `<p>另一款安全型 <strong>220 V</strong> 煎药壶同样由主开关 S₁、加热电阻 R₁、限流电阻 R₂（阻值均恒定）以及温控开关 S₂、水量开关 S₃ 组成。主开关 S₁ 闭合后：当温度<strong>低于 70 ℃</strong> 时 S₂ 自动闭合，当水量<strong>大于 0.30 L</strong> 时 S₃ 自动闭合，其他情况下各自断开。实验测得 R₁ 的功率如下表：</p>`,
    tableData: { headers: ['温控开关 S₂', '水量开关 S₃', '加热电阻 R₁ 功率', '煎煮方式'], rows: [['闭合', '闭合', '1100 W', '武火'], ['闭合', '断开', '275 W', '文火'], ['断开', '闭合', '275 W', '文火']] },
    calcFields: [
      { id: 'r1_val', label: '① 加热电阻 R₁ 的阻值 =', unit: 'Ω', answer: 44, tolerance: 0.2, errorHint: '武火 1100 W 时 R₁ 独享 220 V：R₁ = 220² ÷ 1100。' },
      { id: 'r2_val', label: '② 限流电阻 R₂ 的阻值 =', unit: 'Ω', answer: 44, tolerance: 0.2, errorHint: '文火 275 W 正好是 1100 W 的 1/4，串联平分 110 V，故 R₂ = R₁。' },
      { id: 'p_edge', label: '③ 当壶内药液温度恰好为 70 ℃、水量为 0.50 L 时，R₁ 的实际功率 =', unit: 'W', answer: 275, tolerance: 1, errorHint: '「低于 70 ℃」不含 70 ℃！恰好 70 ℃ 时 S₂ 已断开，串联旁路不通，是文火 275 W！' }
    ],
    hints: ['只有（闭，闭）才是 1100 W，说明 S₂ 与 S₃ 串联后再跨接在 R₂ 两端！', '「低于 70 ℃」不包含 70 ℃ 本身，70 ℃ 时 S₂ 是断开的！'],
    solutionDiagram: { type: 'static_circuit', variant: 'opt_series_sw', caption: '本关对应标准电路图：S₂ 与 S₃ 先串联，再跨接在限流电阻 R₂ 两端' },
    solutionSteps: [
      { title: '第一步：计算 R₁ 阻值', body: 'R₁ = 220² ÷ 1100 = 44 Ω。' },
      { title: '第二步：求限流电阻 R₂', body: '1:4 功率比平分电压得 R₂ = 44 Ω。' },
      { title: '第三步：核对临界条件', body: '70 ℃ 时 S₂ 断开，处于文火 275 W。' }
    ],
    takeaway: '看到「低于 / 高于 / 超过」不带等号，遇到刚好卡在临界数字时，开关状态一定是另一侧！'
  },
  {
    id: 't2_lv4', topic: 'topic2', stageLabel: '第 4 关 · 易混辨析', isOrigin: false, stars: '★★★', questionType: 'multi',
    typeLabel: '多选题 · 整机总功率 vs R₁发热功率', title: '头号偷换概念陷阱：分清「整机功率」与「R₁ 加热功率」',
    focusPoint: '原题给的是「R₁ 的功率」，如果出题老师悄悄把表头换成「整机总功率」，算法完全不同！',
    stemHtml: `<p>某中药煎药壶内部电路如下图所示，电源电压恒为 <strong>220 V</strong>。其中 <strong>R₁ 是安装在壶底的加热电阻</strong>（热量传递给药液），<strong>R₂ 是安装在底座外部散热孔处的限流电阻</strong>（不给药液加热）。闭合主开关 S₁ 后，测得不同状态下<strong>煎药壶的整机总电功率</strong>如下表所示。下列说法正确的是（多选）：</p>`,
    stemDiagram: { type: 'static_circuit', variant: 'opt_parallel_sw', caption: 'R₁ 在壶底加热药液，R₂ 在底座外部限流散热' },
    tableData: { headers: ['开关 S₂', '开关 S₃', '整机总电功率 P总', '工作档位'], rows: [['闭合', '闭合', '1000 W', '武火'], ['断开', '闭合', '1000 W', '武火'], ['断开', '断开', '400 W', '文火']] },
    options: [
      { key: 'A', text: '加热电阻 R₁ 的阻值为 48.4 Ω，限流电阻 R₂ 的阻值为 72.6 Ω', isCorrect: true, diag: '正确！R₁ = 48.4 Ω，串联 R总 = 220² ÷ 400 = 121 Ω，故 R₂ = 72.6 Ω！' },
      { key: 'B', text: '文火状态下，壶底加热电阻 R₁ 给药液加热的功率为 400 W', isCorrect: false, diag: '400 W 是整机总功率，外部 R₂ 分走了 240 W，R₁ 实际加热功率只有 160 W！' },
      { key: 'C', text: '文火状态下，加热电阻 R₁ 两端的实际电压为 88 V，实际功率为 160 W', isCorrect: true, diag: '正确！U₁ = 220 × (48.4 / 121) = 88 V，P₁ = 88² ÷ 48.4 = 160 W！' },
      { key: 'D', text: '若限流电阻 R₂ 发生断路且开关 S₃ 卡死在断开状态，只有当 S₂ 闭合时煎药壶才能加热', isCorrect: true, diag: '正确！只剩最上方 S₂ 一条通路。' }
    ],
    hints: ['瞪大眼睛看表头：这次写的是「整机总电功率 400 W」，也就是说 P总 = U² ÷ (R₁ + R₂)！直接用 220² ÷ 400 = 121 Ω 就能算出串联总电阻！', '48.4 ÷ 121 = 0.4，所以文火时 R₁ 分得 220 V × 0.4 = 88 V，功率占 400 W × 0.4 = 160 W！'],
    solutionSteps: [
      { title: '第一步：求 R₁ 与串联总电阻 R总', body: 'R₁ = 48.4 Ω，R总 = 121 Ω，R₂ = 72.6 Ω（A 正确）。' },
      { title: '第二步：求文火 R₁ 真实加热功率', body: 'U₁ = 88 V，P₁ = 160 W（C 正确，B 错误）。' },
      { title: '第三步：故障排查', body: '仅 S₂ 闭合时导通武火（D 正确）。' }
    ],
    takeaway: '必圈表头：写「R₁ 的功率」就用 P₁ = I²R₁；写「整机总功率」就用 P总 = U²/(R₁+R₂)！'
  },
  {
    id: 't2_lv5', topic: 'topic2', stageLabel: '第 5 关 · 终极验收', isOrigin: false, stars: '★★★', questionType: 'multi',
    typeLabel: '多选题 · 隐含工况 + 故障 + 焦耳热压轴', title: '双自动开关煎药壶全维度通关大满贯',
    focusPoint: '原卷第 8 题全部陷阱升级重现：隐藏的第 4 种工况、R₂ 断路后果、限流电阻求值与焦耳热计算一次全考！',
    stemHtml: `<p>小华设计了一款自动煎药壶，使用 <strong>220 V</strong> 电源、主开关 S₁、壶底加热电阻 R₁、限流电阻 R₂（阻值均恒定）以及温控开关 S₂、液位开关 S₃（两个自动开关均参与档位控制）。闭合主开关 S₁ 后：温度 <strong>&lt; 80 ℃</strong> 时 S₂ 闭合，<strong>≥ 80 ℃</strong> 时 S₂ 断开；水量 <strong>&gt; 0.25 L</strong> 时 S₃ 闭合，<strong>≤ 0.25 L</strong> 时 S₃ 断开。部分工况测试数据如下表所示，下列说法正确的是（多选）：</p>`,
    tableData: { headers: ['药液温度', '壶内水量', '加热电阻 R₁ 的功率', '工作档位'], rows: [['60 ℃', '0.40 L', '1210 W', '武火'], ['85 ℃', '0.40 L', '1210 W', '武火'], ['85 ℃', '0.20 L', '160 W', '文火']] },
    options: [
      { key: 'A', text: '加热电阻 R₁ 的阻值为 40 Ω，限流电阻 R₂ 的阻值为 70 Ω', isCorrect: true, diag: '正确！R₁ = 40 Ω，文火电流 I = √(160÷40) = 2 A，R总 = 110 Ω，故 R₂ = 70 Ω！' },
      { key: 'B', text: '当壶内药液温度为 50 ℃、水量为 0.20 L 时，煎药壶处于 160 W 的文火档', isCorrect: false, diag: '50 ℃ < 80 ℃ 使 S₂ 依然闭合短路 R₂，照样是 1210 W 武火！' },
      { key: 'C', text: '若限流电阻 R₂ 发生断路，在 85 ℃、0.20 L 工况下仍能保持文火保温', isCorrect: false, diag: '两开关均断开且 R₂ 断路，功率为 0 W！' },
      { key: 'D', text: '在文火状态下持续工作 10 min，加热电阻 R₁ 产生的热量为 9.6×10⁴ J', isCorrect: true, diag: '正确！Q₁ = P₁t = 160 W × 600 s = 9.6×10⁴ J！' }
    ],
    hints: ['S₂、S₃ 并联跨接在 R₂ 两端！', '由 160 = I² × 40 口算出串联电流 I = 2 A，R总 = 220 ÷ 2 = 110 Ω！'],
    solutionDiagram: { type: 'static_circuit', variant: 'origin8_standard', caption: '标准拓扑复盘：S₂（<80℃闭合）与 S₃（>0.25L闭合）并联跨接在 R₂ 两端' },
    solutionSteps: [
      { title: '第一步：确定并联旁路拓扑', body: 'S₂、S₃ 并联在 R₂ 两端。' },
      { title: '第二步：求准 R₁ 与 R₂', body: 'R₁ = 40 Ω，R₂ = 70 Ω（A 正确）。' },
      { title: '第三步：验证隐含工况与产热', body: '50 ℃、0.20 L 仍为武火（B 错），85 ℃、0.20 L 断路不工作（C 错），文火 10 min 产热 9.6×10⁴ J（D 对）。' }
    ],
    takeaway: '全通关达成！现在再回头看卷子第 142 页那两道题，是不是已经像看透明积木一样清楚了？'
  }
];
