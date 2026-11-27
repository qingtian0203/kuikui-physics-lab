/* ==========================================================================
   多模态无限随机变式生成器（保证物理量合理且全部整除友好）
   融合升级：专题一随机轮换「度数增量 / 脉冲闪烁次数 / 三次实物电能表红框读数窗」三种考法！
   ========================================================================== */

const Gen = (() => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const r2 = (v) => Math.round(v * 100) / 100;
  let seq = 0;

  /**
   * 专题一随机出题器：分段用电与烧水效率
   */
  function energy() {
    for (let k = 0; k < 2500; k++) {
      const Pk = pick([1000, 1100, 1200, 1500, 1800, 2000]);
      const Pc = pick([600, 750, 800, 900, 1000, 1200]);
      const mode = pick(['kettleOff', 'cookerFirst']);
      const t1 = pick([5, 6, 10, 12]);
      const t2 = pick([5, 6, 10, 12, 15, 18, 20, 24, 30]);
      const Wov = ((Pk + Pc) * t1) / 60; // 单位 W·h
      const Wal = (Pc * t2) / 60;        // 单位 W·h
      if (!Number.isInteger(Wov) || !Number.isInteger(Wal) || Wov % 10 || Wal % 10) continue;

      const m = pick([1, 1.2, 1.5, 1.6, 1.8, 2, 2.5]);
      const T0 = pick([10, 15, 20, 25, 30]);
      const Q = 4200 * m * (100 - T0);
      const Wk = Pk * t1 * 60;
      const eta = Q / Wk;
      if (eta < 0.72 || eta > 0.97) continue;

      // 随机挑选计量考法：实物电能表盘（要求 0.1 kW·h 整数倍）/ 脉冲闪烁 / 直接给增量
      let meterMode = 'delta';
      let pulse = 0;
      if (Wov % 100 === 0 && Wal % 100 === 0 && Math.random() < 0.42) {
        meterMode = 'dials';
      } else if (Math.random() < 0.45) {
        pulse = pick([1200, 1600, 2000, 3000, 3200]);
        if ((Wov * pulse) % 1000 === 0 && (Wal * pulse) % 1000 === 0) {
          meterMode = 'pulse';
        } else {
          pulse = 0;
        }
      }

      const kwh = (w) => (w / 1000).toFixed(w % 100 === 0 ? 1 : 2);
      const water = `装 ${m} L、初温 ${T0} ℃ 的水`;
      const total = t1 + t2;
      let stem = '';
      let figure = null;
      const steps = [];

      if (meterMode === 'dials') {
        const baseTenths = pick([12451, 15322, 20461, 10832]);
        const d1 = mode === 'kettleOff' ? Wov / 100 : Wal / 100;
        const d2 = mode === 'kettleOff' ? Wal / 100 : Wov / 100;
        const r0 = baseTenths;
        const r1 = r0 + d1;
        const r2Val = r1 + d2;

        stem = mode === 'kettleOff'
          ? `电热水壶（${water}）与电饭煲同时开始恒功率加热。${t1} min 后水烧开至 100 ℃ 水壶断电；电饭煲又单独加热 ${t2} min 后结束。三个时刻电能表表盘示数如图（注意末尾红框小数位，${C_WATER}）。`
          : `电饭煲先单独加热 ${t2} min；随后电热水壶（${water}）加入一起加热 ${t1} min 后水烧开至 100 ℃ 同时断电。三个时刻电能表表盘示数如图（注意末尾红框小数位，${C_WATER}）。`;

        figure = {
          kind: 'meter_dials',
          readings: [
            { label: '① 初始时刻', digits: String(r0) },
            { label: mode === 'kettleOff' ? `② ${t1} min 水壶断电` : `② ${t2} min 水壶加入`, digits: String(r1) },
            { label: `③ ${total} min 结束`, digits: String(r2Val) }
          ]
        };

        steps.push({
          type: 'num',
          q: `电饭煲单独工作的 ${t2} min 消耗电能 = ?`,
          unit: 'kW·h',
          answer: Wal / 1000,
          traps: [
            { v: Wal / 100, msg: '看漏最右边红框小数位啦！最后一位是 0.1 kW·h！' }
          ],
          explain: `注意末尾小数位，独占段读数差为 ${kwh(Wal)} kW·h`
        });
      } else {
        const amt = (w) => meterMode === 'pulse'
          ? `指示灯闪烁 ${(w * pulse) / 1000} 次`
          : `电能表增加 ${kwh(w)} kW·h`;
        stem = (meterMode === 'pulse' ? `电能表标有“${pulse} imp/(kW·h)”。` : '') + (mode === 'kettleOff'
          ? `电热水壶（${water}）与电饭煲同时开始加热。${t1} min 后水烧开（100 ℃），水壶断电，这段时间${amt(Wov)}；电饭煲又单独加热 ${t2} min，${amt(Wal)}。`
          : `电饭煲先单独加热 ${t2} min，${amt(Wal)}；随后电热水壶（${water}）加入加热，两台一起工作 ${t1} min 后水烧开（100 ℃），这段时间${amt(Wov)}。`)
          + `两电器功率恒定，期间无其他用电器。（${C_WATER}）`;

        const mt = (w) => (meterMode === 'pulse' ? `${(w * pulse) / 1000} 次` : `+${kwh(w)}`);
        figure = mode === 'kettleOff'
          ? {
              kind: 'timeline',
              total,
              rows: [
                { name: '水壶', from: 0, to: t1, color: COLOR.kettle },
                { name: '电饭煲', from: 0, to: total, color: COLOR.cooker }
              ],
              meter: [
                { from: 0, to: t1, text: mt(Wov) },
                { from: t1, to: total, text: mt(Wal) }
              ],
              shade: [{ from: 0, to: t1 }]
            }
          : {
              kind: 'timeline',
              total,
              rows: [
                { name: '水壶', from: t2, to: total, color: COLOR.kettle },
                { name: '电饭煲', from: 0, to: total, color: COLOR.cooker }
              ],
              meter: [
                { from: 0, to: t2, text: mt(Wal) },
                { from: t2, to: total, text: mt(Wov) }
              ],
              shade: [{ from: t2, to: total }]
            };

        if (meterMode === 'pulse') {
          steps.push({
            type: 'num',
            q: '电饭煲独占那段消耗的电能 = ?',
            unit: 'kW·h',
            answer: Wal / 1000,
            traps: [
              { v: pulse / ((Wal * pulse) / 1000), msg: '除反了：电能 = 闪烁次数 ÷ 脉冲常数。' }
            ],
            explain: `${(Wal * pulse) / 1000} ÷ ${pulse} = ${kwh(Wal)} kW·h`
          });
        }
      }

      const cookerOv = (Pc * t1) / 60;
      steps.push({
        type: 'num',
        q: '电饭煲的加热功率 P饭 = ?',
        unit: 'W',
        answer: Pc,
        traps: [
          { v: Wal / t2, msg: `时间要换成小时：${t2} min = ${t2}/60 h。` },
          { v: Pc / 1000, msg: '注意单位要求填瓦特（W），不是 kW。' }
        ],
        explain: `独占段：${kwh(Wal)} kW·h ÷ (${t2}/60 h) = ${Pc / 1000} kW = ${Pc} W`
      });
      steps.push({
        type: 'num',
        q: '电热水壶的加热功率 P壶 = ?',
        unit: 'W',
        answer: Pk,
        traps: [
          { v: Pk + Pc, msg: '重叠段电能是两台合用的总账，要先减去电饭煲那一份！' },
          { v: Pk / 1000, msg: '单位要填 W，不是 kW。' }
        ],
        explain: `重叠 ${t1} min 电饭煲用 ${r2(cookerOv / 1000)} kW·h；水壶用 ${kwh(Wov)} − ${r2(cookerOv / 1000)} = ${r2((Pk * t1) / 60 / 1000)} kW·h ⇒ P壶 = ${Pk} W`
      });
      steps.push({
        type: 'num',
        q: '电热水壶的热效率 η = ?',
        unit: '%',
        answer: eta * 100,
        abs: 0.6,
        traps: [
          { v: (Q / (Wov * 3600)) * 100, msg: '分母只能用水壶自己的电能，不能用重叠段两机总电能！' }
        ],
        explain: `Q吸 = 4.2×10³ × ${m} × ${100 - T0} = ${Q} J；W壶 = ${Wk} J；η = ${(eta * 100).toFixed(1)}%`
      });

      const modeTag = meterMode === 'dials' ? '实物表盘版' : meterMode === 'pulse' ? '脉冲闪烁版' : '分段增量版';
      return {
        id: `gen-e-${++seq}`,
        type: 'steps',
        stars: 2,
        title: `随机变式 · ${modeTag}`,
        skills: ['同时工作', '功率与电能', '效率'],
        stem,
        figure,
        hints: [
          `先盯住电饭煲单独工作的 ${t2} min 算出 P饭，再乘 (${t1}/60) h 算出它在重叠段分走了多少电！`
        ],
        steps,
        explain: '<p>口诀：先抓独占段定功率 → 往外推算重叠耗电 → 相减剥离水壶电能 → 焦耳对齐算效率。</p>'
      };
    }
  }

  /**
   * 专题二随机出题器：开关逻辑、整机/单阻功率与临界工况判断
   */
  function circuit() {
    for (let k = 0; k < 2500; k++) {
      const topo = pick(['or', 'and']);
      const R1 = pick([40, 44, 48.4, 55, 60.5]);
      const Ph = Math.round(48400 / R1);
      const form = pick(['r1', 'total']);
      let R2;
      let table;
      let stepR2;
      let Pl;

      if (form === 'r1') {
        const n = pick([1, 1, 2, 3]);
        Pl = Ph / ((n + 1) ** 2);
        if (Math.round(Pl * 2) !== Pl * 2) continue;
        R2 = r2(n * R1);
        const U1 = 220 / (n + 1);
        table = `武火时 <b>R₁ 的功率</b>为 ${Ph} W，文火时 <b>R₁ 的功率</b>为 ${Pl} W。`;
        stepR2 = {
          type: 'num',
          q: '限流电阻 R₂ = ?',
          unit: 'Ω',
          answer: R2,
          traps: [
            { v: 48400 / Pl, msg: '文火时 R₁ 两端电压不是 220 V，不能用 220² ÷ P文！' },
            { v: 48400 / Pl - R1, msg: '题目给的是文火时 R₁ 的功率，不是整机总功率，不能直接求总电阻！' }
          ],
          explain: `文火 R₁ 功率是武火的 1/${(n + 1) ** 2} ⇒ U₁ 变为 220 V 的 1/${n + 1}（约 ${r2(U1)} V），R₂ 分得 ${n} 倍电压 ⇒ R₂ = ${n}R₁ = ${R2} Ω`
        };
      } else {
        Pl = pick([200, 220, 242, 250, 275, 400, 440, 484, 500, 550]);
        const Rt = 48400 / Pl;
        if (Rt < R1 * 1.3 || Math.round(Rt * 10) !== Rt * 10) continue;
        R2 = r2(Rt - R1);
        table = `武火时<b>整机总功率</b>为 ${Ph} W，文火时<b>整机总功率</b>为 ${Pl} W。`;
        stepR2 = {
          type: 'num',
          q: '限流电阻 R₂ = ?',
          unit: 'Ω',
          answer: R2,
          traps: [
            { v: Rt, msg: `${Rt} Ω 是串联总电阻 R₁ + R₂，还要减去 R₁！` }
          ],
          explain: `串联总电阻 R总 = 220² ÷ ${Pl} = ${Rt} Ω，R₂ = ${Rt} − ${R1} = ${R2} Ω`
        };
      }

      const T0 = pick([50, 60, 65, 70, 80]);
      const V0 = pick([0.2, 0.25, 0.3, 0.5]);
      const temp = pick([T0 - 10, T0, T0 + 10]);
      const vol = r2(pick([V0 - 0.1, V0, V0 + 0.1]));
      if (vol <= 0) continue;

      const s2 = temp < T0;
      const s3 = vol > V0;
      const by = topo === 'or' ? (s2 || s3) : (s2 && s3);
      const mode = by ? '武火' : '文火';
      const reason = `${temp} ℃ ${s2 ? '低于' : '不低于'} ${T0} ℃ ⇒ S₂ ${s2 ? '闭合' : '断开'}；${vol} L ${s3 ? '大于' : '不大于'} ${V0} L ⇒ S₃ ${s3 ? '闭合' : '断开'}；${topo === 'or' ? '各自并联：任一闭合即短路 R₂' : '串联后并联：同时闭合才短路 R₂'} ⇒ ${mode}。`;

      const stem = `煎药壶电路如图，电源 220 V，主开关 S₁ 闭合。S₂、S₃ <b>${topo === 'or' ? '分别并联在 R₂ 两端' : '先串联、再并联在 R₂ 两端'}</b>。温度<b>低于 ${T0} ℃</b> 时 S₂ 闭合，水量<b>大于 ${V0} L</b> 时 S₃ 闭合，否则各自断开。${table}`;

      return {
        id: `gen-c-${++seq}`,
        type: 'steps',
        stars: 2,
        title: `随机变式 · ${form === 'r1' ? 'R₁功率版' : '整机功率版'}`,
        skills: ['功率电压', '开关逻辑', '读表补全'],
        stem,
        figure: { kind: 'circuit', topo },
        hints: [
          `先圈表头：这题给的是「${form === 'r1' ? 'R₁ 的功率（用平方分压比）' : '整机总功率（用 U²/P总 求串联总电阻）'}」！`
        ],
        steps: [
          {
            type: 'num',
            q: '加热电阻 R₁ = ?',
            unit: 'Ω',
            answer: R1,
            traps: [
              { v: 48400 / Pl, msg: '算 R₁ 必须用武火功率（只有武火时 R₁ 才独享 220 V）！' }
            ],
            explain: `武火只有 R₁ 接入 220 V：R₁ = 220² ÷ ${Ph} = ${R1} Ω`
          },
          stepR2,
          {
            type: 'single',
            q: `当温度为 ${temp} ℃、水量为 ${vol} L 时，煎药壶处于什么状态？`,
            options: ['武火', '文火', '不加热'].map((t) => ({ t, ok: t === mode, why: reason })),
            explain: reason
          }
        ],
        explain: '<p>口诀：开关跨在 R₂ 头，闭合抄近变武火；看清表头谁功率，低于大于不含等。</p>'
      };
    }
  }

  return { energy, circuit };
})();
