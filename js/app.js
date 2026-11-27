/* ==========================================================================
   葵葵的物理通关 · 双优融合主控制引擎
   涵盖：本地掌握度持久化（连续2次答对销号）、Hash六路由、沉浸式单题流、
         四图选一渲染、二级不剧透锦囊、一步一解锁重试机制与升级版动态电路实验室
   ========================================================================== */

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $('#app');
  const STORAGE_KEY = 'kuikui_physics_ultimate_v2';
  const KEYS = 'ABCDEFG';
  let uidCounter = 0;
  const uid = () => 'u' + (++uidCounter);

  /* ================= 本地持久化存储（防遗忘连对追踪） ================= */
  const Store = {
    d: (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch (e) {
        return {};
      }
    })(),
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.d));
      } catch (e) {
        console.warn('保存记录失败', e);
      }
    },
    q(id) {
      return (this.d.q || {})[id];
    },
    rec(id, ok) {
      this.d.q = this.d.q || {};
      const r = (this.d.q[id] = this.d.q[id] || { tries: 0, right: 0, wrong: 0, streak: 0, last: null });
      r.tries++;
      if (ok) {
        r.right++;
        r.streak++;
      } else {
        r.wrong++;
        r.streak = 0;
      }
      r.last = ok;
      r.t = Date.now();
      this.save();
    },
    recGen(tid, ok) {
      this.d.gen = this.d.gen || {};
      const g = (this.d.gen[tid] = this.d.gen[tid] || { n: 0, ok: 0, streak: 0 });
      g.n++;
      if (ok) {
        g.ok++;
        g.streak = (g.streak || 0) + 1;
      } else {
        g.streak = 0;
      }
      this.save();
    },
    gen(tid) {
      return (this.d.gen || {})[tid] || { n: 0, ok: 0, streak: 0 };
    },
    reset() {
      this.d = {};
      this.save();
    }
  };

  /* ================= 题库全局索引与掌握状态判定 ================= */
  const QMAP = {};
  TOPICS.forEach((t) => {
    t.levels.forEach((lv, li) => {
      lv.questions.forEach((q) => {
        QMAP[q.id] = { q, t, lv, li };
      });
    });
  });
  const ALL_IDS = Object.keys(QMAP);
  const topicIds = (t) => t.levels.flatMap((lv) => lv.questions.map((q) => q.id));

  // 状态机：none 未做 / mastered 已掌握（一次过或错后连对2次） / fixing 订正中（还差1次连对） / redo 待重做
  function status(id) {
    const r = Store.q(id);
    if (!r) return 'none';
    if (r.last === false) return 'redo';
    if (r.wrong === 0 || r.streak >= 2) return 'mastered';
    return 'fixing';
  }

  const wrongBook = () => ALL_IDS.filter((id) => {
    const r = Store.q(id);
    return r && r.wrong > 0 && status(id) !== 'mastered';
  });

  function levelState(t, li) {
    const ids = t.levels[li].questions.map((q) => q.id);
    const m = ids.filter((id) => status(id) === 'mastered').length;
    const tried = ids.filter((id) => status(id) !== 'none').length;
    return {
      m,
      n: ids.length,
      tried,
      done: m === ids.length,
      cls: m === ids.length ? 'done' : tried ? 'part' : ''
    };
  }

  /* ================= 数值解析与 UI 辅助工具 ================= */
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function fmt(v) {
    if (!Number.isFinite(v)) return String(v);
    const a = Math.abs(v);
    if (a >= 1e5) {
      const e = Math.floor(Math.log10(a));
      const m = +(v / (10 ** e)).toFixed(3);
      return `${m}×10${String(e).split('').map((d) => SUP[d]).join('')}`;
    }
    return String(+v.toFixed(a < 1 ? 4 : 2));
  }

  function parseNum(s) {
    s = String(s)
      .trim()
      .replace(/[，,\s]/g, '')
      .replace(/。/g, '.')
      .replace(/[－—]/g, '-')
      .replace(/[×xX*]10\^?/g, 'e')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUP.indexOf(c))
      .replace(/[%％WΩkWh·sJVLA]+$/i, '');
    return s === '' ? NaN : Number(s);
  }

  const numOK = (v, q) => Math.abs(v - q.answer) <= (q.abs != null ? q.abs : Math.abs(q.answer) * (q.tol || 0.01));
  const findTrap = (v, traps) => (traps || []).find((t) => Math.abs(v - t.v) <= Math.max(Math.abs(t.v) * 0.015, 0.011));

  function diffTag(n) {
    return `<span class="diff d${n}">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i> ${['', '基础', '进阶', '拔高'][n]}</span>`;
  }

  function ring(frac, center, label, size) {
    const r = 26;
    const c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(1, frac)));
    return `
      <div class="ring ${size || ''}">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="${r}" class="rg-bg"/>
          <circle cx="32" cy="32" r="${r}" class="rg-fg" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>
        </svg>
        <div class="rg-c"><span>${center}</span></div>
        ${label ? `<div class="rg-l">${label}</div>` : ''}
      </div>
    `;
  }

  function toggleBtn(target, openText, closeText, expanded) {
    return `
      <button type="button" class="toggle" data-toggle="${target}" data-open="${openText}" data-close="${closeText}" aria-expanded="${Boolean(expanded)}">
        <span class="tg-t">${expanded ? closeText : openText}</span>
        <span class="tg-c">▾</span>
      </button>
    `;
  }

  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 2300);
  }

  const go = (h) => {
    location.hash = '#/' + h;
  };

  /* ================= 全局委托事件与键盘快捷键 ================= */
  document.addEventListener('click', (e) => {
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const box = document.getElementById(tg.dataset.toggle);
      if (!box) return;
      const open = box.hidden;
      box.hidden = !open;
      tg.setAttribute('aria-expanded', String(open));
      tg.querySelector('.tg-t').textContent = open ? tg.dataset.close : tg.dataset.open;
      return;
    }

    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'start') {
      e.preventDefault();
      startLevel(a.dataset.t, +a.dataset.l);
    } else if (act === 'redo') {
      e.preventDefault();
      startList(a.dataset.ids.split(','), a.dataset.title || '错题订正');
    } else if (act === 'quit') {
      quit();
    } else if (act === 'reset') {
      Store.reset();
      route();
      toast('已清空全部作答记录');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.body.classList.contains('in-play')) {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || activeTag === 'BUTTON') return;
      const pBtn = $('#primary');
      if (pBtn && !pBtn.disabled && primaryFn) {
        e.preventDefault();
        primaryFn();
      }
    }
  });

  /* ================= Hash 路由分发 ================= */
  window.addEventListener('hashchange', route);
  function route() {
    const [p, a] = location.hash.replace(/^#\/?/, '').split('/');
    window.scrollTo(0, 0);
    document.body.classList.toggle('in-play', p === 'play' || p === 'gen');
    if (p === 'topic') return viewTopic(a);
    if (p === 'play') return Session ? viewPlay() : go('');
    if (p === 'gen') return startGen(a || 'energy');
    if (p === 'review') return viewReview();
    if (p === 'lab') return viewLab();
    viewHome();
  }

  function topbar(back, activeRoute = '') {
    const n = wrongBook().length;
    return `
      <header class="topbar">
        <div class="tb-in">
          ${back ? `<a class="tb-back" href="${back}" aria-label="返回上一页">‹</a>` : ''}
          <a class="brand" href="#/">
            <span class="logo">葵</span>
            <span class="brand-t">葵葵的物理通关</span>
          </a>
          <nav class="tb-nav" aria-label="全局工具导航">
            <a href="#/review" class="${activeRoute === 'review' ? 'active' : ''}">
              ${Icons.book()}错题本${n ? `<b class="badge">${n}</b>` : ''}
            </a>
            <a href="#/lab" class="${activeRoute === 'lab' ? 'active' : ''}">
              ${Icons.plug()}电路实验室
            </a>
            <a href="#/gen/energy" class="${activeRoute === 'gen' ? 'active' : ''}">
              ${Icons.dice()}无限变式
            </a>
          </nav>
        </div>
      </header>
    `;
  }

  /* ================= 视图 1：总览首页 (#/) ================= */
  function recommend() {
    const wb = wrongBook();
    if (wb.some((id) => status(id) === 'redo')) {
      return {
        k: '优先订正',
        t: `错题本里有 ${wb.length} 道未攻克错题，趁热打铁消灭它`,
        attr: `data-act="redo" data-ids="${wb.join(',')}"`
      };
    }
    for (const t of TOPICS) {
      for (let i = 0; i < t.levels.length; i++) {
        const st = levelState(t, i);
        if (!st.done) {
          return {
            k: st.tried ? '继续闯关' : '下一步行动',
            t: `${t.short} · 第 ${i + 1} 关「${t.levels[i].name}」`,
            attr: `data-act="start" data-t="${t.id}" data-l="${i}"`
          };
        }
      }
    }
    return {
      k: '全部 38 题已满贯通关！',
      t: '打开无限随机变式器抽查几道新题保持手感',
      attr: `href="#/gen/${TOPICS[Math.floor(Math.random() * 2)].id}"`
    };
  }

  function topicCard(t) {
    const ids = topicIds(t);
    const m = ids.filter((id) => status(id) === 'mastered').length;
    const icoHtml = Icons[t.iconKey] ? Icons[t.iconKey]('lg') : '';
    return `
      <a class="topic-card t-${t.id}" href="#/topic/${t.id}">
        <div class="tc-head">
          <span class="tc-ico">${icoHtml}</span>
          ${ring(m / ids.length, Math.round((m / ids.length) * 100) + '<small>%</small>', '', 'sm')}
        </div>
        <div class="tc-from">源自错题：${t.origin.title}</div>
        <h3>${t.title}</h3>
        <p>${t.subtitle}</p>
        <div class="lv-dots">
          ${t.levels.map((lv, i) => `<span class="lvd ${levelState(t, i).cls}" title="${lv.name}">${i + 1}</span>`).join('<i></i>')}
        </div>
        <div class="tc-foot">
          <span>${ids.length} 题 · 4 大阶梯关</span>
          <span class="tc-go">进入专题 →</span>
        </div>
      </a>
    `;
  }

  function viewHome() {
    const total = ALL_IDS.length;
    const mastered = ALL_IDS.filter((id) => status(id) === 'mastered').length;
    const done = ALL_IDS.filter((id) => status(id) !== 'none').length;
    const rec = recommend();
    const wbn = wrongBook().length;

    app.innerHTML = topbar() + `
      <main class="page home">
        <section class="hero">
          <div class="hero-txt">
            <div class="eyebrow">${Icons.bolt()} 九年级物理 · 电功、电功率与电热靶向通关</div>
            <h1>同类题，不再错。</h1>
            <p>
              从葵葵第 142 页的 2 道错题出发，精细拆解为 <b>${total} 道四阶闯关题</b>：先练基本功 → 分步拆原题 → 攻克图像与选图变式 → 真题毕业考。做错的题自动入库，<b>连续答对 2 次</b>才算彻底掌握。
            </p>
          </div>
          <div class="hero-stat">
            ${ring(mastered / total, `${mastered}<small>/${total}</small>`, '已掌握', 'lg')}
            <div class="hs-mini">
              <span>已做 <b>${done}</b></span>
              <span>待订正 <b>${wbn}</b></span>
            </div>
          </div>
        </section>

        <a class="next-card" ${rec.attr} role="button" tabindex="0">
          <div>
            <div class="nc-k">${rec.k}</div>
            <div class="nc-t">${rec.t}</div>
          </div>
          <span class="nc-go">开始 →</span>
        </a>

        <h2 class="sec">两大靶向专题</h2>
        <div class="grid2">${TOPICS.map(topicCard).join('')}</div>

        <h2 class="sec">核心辅助工具</h2>
        <div class="grid3">
          <a class="tool" href="#/review">
            <span class="tool-ico-box" style="background:var(--bad-w);color:var(--bad);">${Icons.book()}</span>
            <b>防遗忘错题本</b>
            <span>${wbn ? `${wbn} 道待连对 2 次销号` : '当前零积压错题'}</span>
          </a>
          <a class="tool" href="#/lab">
            <span class="tool-ico-box" style="background:var(--violet-w);color:var(--violet);">${Icons.plug()}</span>
            <b>动态电路实验室</b>
            <span>拨动开关、调阻值、看发光电流与真值表</span>
          </a>
          <a class="tool" href="#/gen/energy">
            <span class="tool-ico-box" style="background:var(--teal-w);color:var(--teal);">${Icons.dice()}</span>
            <b>多模态无限变式</b>
            <span>实物表盘、脉冲、开关档位随机生成新题</span>
          </a>
        </div>

        <section class="rules card">
          <h3>四步高效通关指南</h3>
          <ol>
            <li><b>先看专题页的「原题陷阱」与「方法卡」</b>（第 8 题可先去电路实验室一键复现隐藏工况）。</li>
            <li><b>按 1 → 4 关顺序推进</b>：卡壳时先点不剧透的「渐进锦囊」，别急着看完整解析。</li>
            <li>分步大题采用<b>一步一解锁</b>：每步答错给 1 次纠错机会并指出具体掉进了哪个坑。</li>
            <li>错题本严格要求<b>之后连续答对 2 次</b>才销号毕业，最后用「无限变式」抽查验收。</li>
          </ol>
          <button type="button" class="link danger" data-act="reset">清空本地做题记录</button>
        </section>
      </main>
    `;
  }

  /* ================= 视图 2：专题导学页 (#/topic/:id) ================= */
  function viewTopic(id) {
    const t = TOPICS.find((x) => x.id === id);
    if (!t) return go('');
    const ids = topicIds(t);
    const m = ids.filter((i) => status(i) === 'mastered').length;
    const o = t.origin;
    const trapId = uid();
    const g = Store.gen(t.id);

    const skillRows = t.skills.map((s) => {
      const qs = ids.filter((i) => (QMAP[i].q.skills || []).includes(s));
      const tried = qs.filter((i) => status(i) !== 'none');
      const good = tried.filter((i) => Store.q(i).last).length;
      const pct = tried.length ? Math.round((good / tried.length) * 100) : 0;
      return `
        <div class="sk">
          <span class="sk-n">${s}</span>
          <div class="bar ${pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low'}">
            <i style="width:${tried.length ? pct : 0}%"></i>
          </div>
          <span class="sk-v">${tried.length ? `${pct}%` : '未练'}</span>
        </div>
      `;
    }).join('');

    app.innerHTML = topbar('#/') + `
      <main class="page topic t-${t.id}">
        <section class="t-hero">
          <div>
            <div class="eyebrow">${Icons[t.iconKey] ? Icons[t.iconKey]() : ''} 靶向专题</div>
            <h1>${t.title}</h1>
            <p>${t.subtitle}</p>
          </div>
          ${ring(m / ids.length, `${m}<small>/${ids.length}</small>`, '已掌握')}
        </section>

        <section class="card origin">
          <div class="card-h">
            <span class="tag">原卷错题复盘</span>
            <h2>${o.title}</h2>
          </div>
          <div class="q-stem">${o.stem}</div>
          ${o.figure ? `<figure class="fig">${Fig.render(o.figure)}</figure>` : ''}
          <ol class="opt-static">
            ${o.options.map((x, i) => `<li><b>${KEYS[i]}</b><span>${x.t}</span></li>`).join('')}
          </ol>
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            ${toggleBtn(trapId, '展开逐项陷阱深度拆解', '收起陷阱拆解', false)}
            ${t.id === 'circuit' ? `<a class="link" href="#/lab" style="font-size:14.5px;">去电路实验室亲手拨开关验证 →</a>` : ''}
          </div>
          <div id="${trapId}" hidden class="trap-box">
            <ul class="trap-list">
              ${o.options.map((x, i) => `
                <li class="${x.ok ? 'ok' : 'bad'}">
                  <span class="tl-k">${KEYS[i]}</span>
                  <div><b>${x.ok ? '✓ 正确' : '✗ 陷阱'}</b>　${x.why}</div>
                </li>
              `).join('')}
            </ul>
            ${t.originFig ? `
              <figure class="fig">
                ${Fig.render(t.originFig)}
                <figcaption>原题标准电路还原（文火状态：S₂、S₃ 均断开，电流串联流经 R₁ 与 R₂）</figcaption>
              </figure>
            ` : ''}
          </div>
        </section>

        <div class="grid-m">
          <section class="card method">
            <h2>${Icons.compass()} 标准破题步法</h2>
            <ol class="steps-m">
              ${t.method.map(([h, b]) => `<li><b>${h}</b><span>${b}</span></li>`).join('')}
            </ol>
            <div class="motto">秒杀口诀：${t.motto}</div>
          </section>
          <section class="card traps">
            <h2>${Icons.alert()} 考场高频易错清单</h2>
            <ul>${t.traps.map((x) => `<li>${x}</li>`).join('')}</ul>
          </section>
        </div>

        <h2 class="sec">四阶闯关路线</h2>
        <div class="levels">
          ${t.levels.map((lv, i) => {
            const st = levelState(t, i);
            return `
              <div class="lv-card ${st.cls}">
                <div class="lv-num">${st.done ? '✓' : i + 1}</div>
                <div class="lv-main">
                  <div class="lv-t">${lv.name} ${diffTag(lv.stars)}</div>
                  <div class="lv-d">${lv.desc}</div>
                  <div class="lv-prog">
                    <div class="bar"><i style="width:${(st.m / st.n) * 100}%"></i></div>
                    <span>${st.m}/${st.n} 掌握</span>
                  </div>
                </div>
                <button type="button" class="btn ${!st.done ? 'primary' : ''}" data-act="start" data-t="${t.id}" data-l="${i}">
                  ${st.done ? '再刷一遍' : st.tried ? '继续闯关' : '开始闯关'}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="grid-m">
          <section class="card skills">
            <h2>${Icons.chart()} 细分知识点掌握度</h2>
            ${skillRows}
            <p class="note">根据各题最近一次独立作答结果实时统计</p>
          </section>
          <a class="card gen-card" href="#/gen/${t.id}">
            <span class="tool-ico-box" style="background:var(--brand-w);color:var(--brand);margin:0;">${Icons.dice('lg')}</span>
            <div>
              <h2>无限随机变式特训</h2>
              <p>同核不同数（含表盘、脉冲与临界工况动态生成），刷到彻底肌肉记忆。${g.n ? `累计已练 ${g.n} 题，一次全对 ${g.ok} 题。` : ''}</p>
            </div>
            <span class="nc-go">抽题 →</span>
          </a>
        </div>
      </main>
    `;
  }

  /* ================= 视图 3：沉浸式专注做题流 (#/play & #/gen/:id) ================= */
  let Session = null;
  let primaryFn = null;

  function startLevel(tid, li) {
    const t = TOPICS.find((x) => x.id === tid);
    const lv = t.levels[li];
    Session = {
      mode: 'level',
      tid,
      li,
      title: `${t.short} · 第 ${li + 1} 关「${lv.name}」`,
      list: lv.questions.slice(),
      idx: 0,
      results: []
    };
    enterPlay();
  }

  function startList(ids, title) {
    const list = ids.filter((id) => QMAP[id]).map((id) => QMAP[id].q);
    if (!list.length) return;
    Session = {
      mode: 'review',
      title,
      list,
      idx: 0,
      results: [],
      back: location.hash || '#/'
    };
    enterPlay();
  }

  function startGen(tid) {
    const t = TOPICS.find((x) => x.id === tid) || TOPICS[0];
    Session = {
      mode: 'gen',
      tid: t.id,
      title: `${t.short} · 无限随机变式`,
      list: [Gen[t.id]()],
      idx: 0,
      results: []
    };
    document.body.classList.add('in-play');
    viewPlay();
  }

  function enterPlay() {
    if (location.hash === '#/play') viewPlay();
    else go('play');
  }

  function quit() {
    const s = Session;
    Session = null;
    if (!s) return go('');
    if (s.mode === 'review') return go(s.back && s.back.includes('review') ? 'review' : '');
    go('topic/' + s.tid);
  }

  function viewPlay() {
    const s = Session;
    const isGen = s.mode === 'gen';
    const otherTid = s.tid === 'energy' ? 'circuit' : 'energy';
    const otherName = s.tid === 'energy' ? '切到开关档位变式' : '切到分段用电变式';

    app.innerHTML = `
      <div class="play" id="play">
        <header class="play-head">
          <div class="ph-in">
            <button type="button" class="icon-btn" data-act="quit" aria-label="退出做题">✕</button>
            <div class="ph-mid">
              <div class="ph-title">${s.title}</div>
              ${isGen
                ? `<div class="gen-streak-row" id="genStatsRow"></div>`
                : `<div class="bar"><i id="phbar" style="width:0%"></i></div>`
              }
            </div>
            ${isGen
              ? `<a class="btn sm" href="#/gen/${otherTid}">${otherName}</a>`
              : `<div class="ph-count" id="phcount"></div>`
            }
          </div>
        </header>
        <main class="play-main" id="qwrap"></main>
        <footer class="play-foot" id="pfoot">
          <div class="pf-in">
            <button type="button" class="btn primary big" id="primary" disabled>提交答案</button>
          </div>
        </footer>
      </div>
    `;
    $('#primary').onclick = () => primaryFn && primaryFn();
    renderQ();
  }

  function setPrimary(label, enabled, fn) {
    const b = $('#primary');
    if (!b) return;
    b.textContent = label;
    b.disabled = !enabled;
    primaryFn = enabled ? fn : null;
  }

  function updateGenHeader(s) {
    const el = $('#genStatsRow');
    if (!el) return;
    const g = Store.gen(s.tid);
    const curRight = s.results.filter(Boolean).length;
    el.innerHTML = `
      <span>当前第 <b>${s.idx + 1}</b> 题</span>
      <span>·</span>
      <span>本轮一次全对 <b>${curRight}</b> 题</span>
      ${g.streak > 1 ? `<span class="gen-pill">连对 ${g.streak} 题</span>` : ''}
    `;
  }

  function renderQ() {
    const s = Session;
    const q = s.list[s.idx];
    const isGen = s.mode === 'gen';
    const tid = isGen ? s.tid : QMAP[q.id].t.id;
    $('#play').className = 'play t-' + tid;
    const n = s.list.length;

    if (isGen) {
      updateGenHeader(s);
    } else {
      $('#phcount').textContent = `${s.idx + 1} / ${n}`;
      $('#phbar').style.width = `${(s.idx / n) * 100}%`;
    }

    $('#pfoot').hidden = false;
    window.scrollTo(0, 0);
    setPrimary('提交答案', false, null);

    mountQuestion($('#qwrap'), q, {
      setPrimary,
      finish(ok) {
        if (isGen) Store.recGen(s.tid, ok);
        else Store.rec(q.id, ok);

        s.results.push(ok);
        if (isGen) {
          updateGenHeader(s);
        } else {
          $('#phbar').style.width = `${((s.idx + 1) / n) * 100}%`;
        }

        const isLast = !isGen && s.idx === n - 1;
        setPrimary(isLast ? '查看本关成绩 →' : (isGen ? '再来一道新变式 →' : '下一题 →'), true, () => {
          if (isLast) return renderSummary();
          s.idx++;
          if (isGen) s.list.push(Gen[s.tid]());
          renderQ();
        });
      }
    });
  }

  function renderSummary() {
    const s = Session;
    const ok = s.results.filter(Boolean).length;
    const n = s.results.length;
    const rate = ok / n;
    const wrongIds = s.list.filter((q, i) => !s.results[i]).map((q) => q.id);
    const msg = rate === 1
      ? '满分通过！这一关彻底稳了'
      : rate >= 0.8
        ? '表现很棒！个别失误题已收入错题本'
        : '先把本关错题弄懂重做一遍，再往后推进更稳哦';

    let nextBtn = '';
    if (s.mode === 'level') {
      const t = TOPICS.find((x) => x.id === s.tid);
      if (s.li + 1 < t.levels.length) {
        nextBtn = `<button type="button" class="btn ${wrongIds.length ? '' : 'primary'}" data-act="start" data-t="${t.id}" data-l="${s.li + 1}">下一关：${t.levels[s.li + 1].name} →</button>`;
      }
    }

    $('#pfoot').hidden = true;
    if ($('#phbar')) $('#phbar').style.width = '100%';
    $('#qwrap').innerHTML = `
      <section class="summary card">
        ${ring(rate, `${ok}<small>/${n}</small>`, '本次一次答对', 'lg')}
        <h2>${rate === 1 ? Icons.trophy() : ''} ${msg}</h2>
        <ol class="res-list">
          ${s.list.map((q, i) => `
            <li class="${s.results[i] ? 'ok' : 'bad'}">
              <span class="rl-i">${s.results[i] ? '✓' : '✗'}</span>
              <span>${q.title}</span>
            </li>
          `).join('')}
        </ol>
        <div class="sum-actions">
          ${wrongIds.length ? `<button type="button" class="btn primary" data-act="redo" data-ids="${wrongIds.join(',')}" data-title="当场重做错题">立即重做 ${wrongIds.length} 道错题</button>` : ''}
          ${nextBtn}
          <button type="button" class="btn ghost" data-act="quit">${s.mode === 'review' ? '返回错题本' : '返回专题页'}</button>
        </div>
      </section>
    `;
    window.scrollTo(0, 0);
  }

  /* ================= 单题挂载器（支持四图选项 + 二级渐进锦囊） ================= */
  function mountQuestion(host, q, ctl) {
    const info = QMAP[q.id];
    const src = Session.mode === 'review' && info
      ? `<span class="chip ghost">${info.t.short} · ${info.lv.name}</span>`
      : '';
    const hasFigOpts = (q.options || []).some((o) => o.fig);
    const hintsArr = q.hints || (q.hint ? [q.hint] : []);

    host.innerHTML = `
      <article class="q-card">
        <div class="q-meta">
          ${diffTag(q.stars || 1)}
          ${q.boss ? '<span class="chip boss">毕业考</span>' : ''}
          ${q.type === 'multi' ? '<span class="chip warn">多选</span>' : ''}
          ${q.type === 'steps' ? '<span class="chip">分步解锁</span>' : ''}
          ${hasFigOpts ? '<span class="chip">看表选图</span>' : ''}
          ${src}
        </div>
        <h2 class="q-title">${q.title || ''}</h2>
        <div class="q-stem">${q.stem}</div>
        ${q.figure ? `<figure class="fig">${Fig.render(q.figure)}</figure>` : ''}
        <div class="q-body" id="qbody"></div>
        ${hintsArr.length ? `
          <div class="hint-wrap" id="hintMount">
            <button type="button" class="hint-btn" id="unlockHintBtn">
              ${Icons.bulb()} <span>需要点拨？解锁锦囊 1（不剧透答案）</span>
            </button>
            <div class="hint-list" id="hintList"></div>
          </div>
        ` : ''}
        <div id="qfb"></div>
        <div class="q-skills">${(q.skills || []).map((s) => `<span>#${s}</span>`).join('')}</div>
      </article>
    `;

    // 绑定渐进式二级锦囊解锁
    if (hintsArr.length) {
      let unlocked = 0;
      const hBtn = $('#unlockHintBtn', host);
      const hList = $('#hintList', host);
      hBtn.onclick = () => {
        if (unlocked >= hintsArr.length) return;
        const item = document.createElement('div');
        item.className = 'hint';
        item.innerHTML = `<b>锦囊 ${unlocked + 1}：</b>${hintsArr[unlocked]}`;
        hList.appendChild(item);
        unlocked++;
        if (unlocked < hintsArr.length) {
          hBtn.querySelector('span').textContent = `再看锦囊 ${unlocked + 1}（关键关系提示）`;
        } else {
          hBtn.disabled = true;
          hBtn.querySelector('span').textContent = `已展开全部 ${hintsArr.length} 条锦囊`;
        }
      };
    }

    const body = $('#qbody', host);
    const fb = $('#qfb', host);
    ({ single: mSingle, multi: mMulti, num: mNum, steps: mSteps })[q.type](q, body, fb, ctl);
  }

  function optHTML(o, i) {
    if (o.fig) {
      return `
        <button type="button" class="opt has-fig" data-i="${i}" aria-pressed="false">
          <div class="opt-head-row">
            <span class="opt-k">${KEYS[i]}</span>
            <span class="opt-t">${o.t}</span>
            <span class="opt-tag"></span>
          </div>
          <div class="opt-fig-box">${Fig.render(o.fig)}</div>
        </button>
      `;
    }
    return `
      <button type="button" class="opt" data-i="${i}" aria-pressed="false">
        <span class="opt-k">${KEYS[i]}</span>
        <span class="opt-t">${o.t}</span>
        <span class="opt-tag"></span>
      </button>
    `;
  }

  const numHTML = (unit) => `
    <div class="num-row">
      <input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="输入数值" aria-label="数值答案"/>
      <span class="unit">${unit || ''}</span>
    </div>
  `;

  const PRAISE = ['完全正确！', '漂亮，思路非常清晰！', '稳稳拿下！', '太准了！'];

  function feedback(tone, headline, diag, explain, fig) {
    const id = uid();
    const ok = tone === 'ok';
    const ico = ok ? '✓' : '!';
    return `
      <div class="fb ${tone}" role="status">
        <div class="fb-h">
          <span class="fb-ico">${ico}</span>
          <b>${headline || (ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : '这题已记入错题本重点巩固')}</b>
        </div>
        ${diag.length ? `<ul class="fb-diag">${diag.map((d) => `<li>${d}</li>`).join('')}</ul>` : ''}
        ${explain ? `
          ${toggleBtn(id, '展开完整解析', '收起完整解析', !ok)}
          <div class="explain" id="${id}" ${ok ? 'hidden' : ''}>
            ${explain}
            ${fig ? `<figure class="fig">${Fig.render(fig)}</figure>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  const reveal = (el) => setTimeout(() => {
    const foot = $('#pfoot');
    const fh = foot && !foot.hidden ? foot.offsetHeight : 0;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const need = r.bottom - (vh - fh - 14);
    if (need > 0) window.scrollBy({ top: Math.min(need, r.top - 80), behavior: 'smooth' });
  }, 60);

  function mSingle(q, body, fb, ctl) {
    let sel = -1;
    const hasFig = q.options.some((o) => o.fig);
    body.innerHTML = `<div class="opts ${hasFig ? 'fig-grid' : ''}">${q.options.map(optHTML).join('')}</div>`;
    const btns = $$('.opt', body);
    btns.forEach((b) => {
      b.onclick = () => {
        sel = +b.dataset.i;
        btns.forEach((x) => {
          x.classList.toggle('sel', x === b);
          x.setAttribute('aria-pressed', String(x === b));
        });
        ctl.setPrimary('提交答案', true, submit);
      };
    });

    function submit() {
      const ok = Boolean(q.options[sel].ok);
      btns.forEach((x, i) => {
        x.disabled = true;
        if (q.options[i].ok) {
          x.classList.add('right');
        } else if (i === sel) {
          x.classList.add('wrong');
          x.querySelector('.opt-tag').textContent = '你的选择';
        }
      });
      fb.innerHTML = feedback(
        ok ? 'ok' : 'bad',
        null,
        ok ? [] : [`你选了 <b>${KEYS[sel]}</b>：${q.options[sel].why || ''}`],
        q.explain,
        q.explainFig
      );
      ctl.finish(ok);
      reveal(fb);
    }
  }

  function mMulti(q, body, fb, ctl) {
    const sel = new Set();
    body.innerHTML = `
      <p class="ask-note">多选题：请选出<b>所有</b>正确选项（漏选或错选均需进入错题本重练至全对）</p>
      <div class="opts multi">${q.options.map(optHTML).join('')}</div>
    `;
    const btns = $$('.opt', body);
    btns.forEach((b) => {
      b.onclick = () => {
        const i = +b.dataset.i;
        if (sel.has(i)) sel.delete(i);
        else sel.add(i);
        b.classList.toggle('sel', sel.has(i));
        b.setAttribute('aria-pressed', String(sel.has(i)));
        const pickedStr = [...sel].sort().map((x) => KEYS[x]).join('、');
        ctl.setPrimary(sel.size ? `提交答案（已选 ${pickedStr}）` : '提交答案', sel.size > 0, submit);
      };
    });

    function submit() {
      const diag = [];
      let hasWrongPick = false;
      let hasMissed = false;

      q.options.forEach((o, i) => {
        const b = btns[i];
        b.disabled = true;
        const tag = b.querySelector('.opt-tag');
        if (o.ok && sel.has(i)) {
          b.classList.add('right');
        } else if (o.ok) {
          hasMissed = true;
          b.classList.add('missed');
          tag.textContent = '漏选';
          diag.push(`漏选了正确项 <b>${KEYS[i]}</b>：${o.why || ''}`);
        } else if (sel.has(i)) {
          hasWrongPick = true;
          b.classList.add('wrong');
          tag.textContent = '错选';
          diag.push(`误选了干扰项 <b>${KEYS[i]}</b>：${o.why || ''}`);
        }
      });

      const ok = !hasWrongPick && !hasMissed;
      const isPartial = !hasWrongPick && hasMissed;
      fb.innerHTML = feedback(
        ok ? 'ok' : isPartial ? 'warn' : 'bad',
        ok ? null : isPartial ? '选的都没错，但漏选了正确项！（已记入错题本冲击满分）' : '存在误选干扰项，已记入错题本巩固',
        diag,
        q.explain,
        q.explainFig
      );
      ctl.finish(ok);
      reveal(fb);
    }
  }

  function mNum(q, body, fb, ctl) {
    body.innerHTML = numHTML(q.unit) + '<p class="ask-note">支持直接输入整数、小数或科学计数法（如 5.04e5 或 5.04×10^5）</p>';
    const inp = $('input', body);
    let done = false;
    inp.oninput = () => ctl.setPrimary('提交答案', inp.value.trim() !== '', submit);
    inp.onkeydown = (e) => {
      if (e.key === 'Enter' && inp.value.trim()) submit();
    };

    function submit() {
      if (done) return;
      const v = parseNum(inp.value);
      if (Number.isNaN(v)) return toast('请输入有效数字，例如 400 或 5.04e5');
      done = true;
      inp.disabled = true;
      const ok = numOK(v, q);
      $('.num-row', body).classList.add(ok ? 'right' : 'wrong');
      const trap = ok ? null : findTrap(v, q.traps);
      const diag = ok
        ? []
        : [
            trap ? `你的输入 ${fmt(v)}：${trap.msg}` : `你的输入是 ${fmt(v)}。`,
            `标准答案：<b>${fmt(q.answer)} ${q.unit || ''}</b>`
          ];
      fb.innerHTML = feedback(ok ? 'ok' : 'bad', null, diag, q.explain, q.explainFig);
      ctl.finish(ok);
      reveal(fb);
    }
  }

  // 分步解锁题：每步给 1 次纠错重试机会；仅当所有步骤均一次做对才算整题一次掌握
  function mSteps(q, body, fb, ctl) {
    const firstTryOk = [];
    body.innerHTML = `
      <ol class="steps">
        ${q.steps.map((st, i) => `
          <li class="step todo" data-k="${i}">
            <div class="st-q"><span class="st-n">${i + 1}</span><div class="st-qt">${st.q}</div></div>
            <div class="st-body"></div>
            <div class="st-fb"></div>
          </li>
        `).join('')}
      </ol>
    `;
    ctl.setPrimary('请依次解锁完成上方各步骤', false, null);
    mountStep(0);

    function mountStep(i) {
      const li = $(`.step[data-k="${i}"]`, body);
      const st = q.steps[i];
      const sb = $('.st-body', li);
      const sf = $('.st-fb', li);
      li.className = 'step cur';
      let tries = 0;
      const ansText = st.type === 'single'
        ? st.options.find((o) => o.ok).t
        : `${fmt(st.answer)} ${st.unit || ''}`;

      const endStep = (ok) => {
        firstTryOk[i] = ok && tries === 1;
        li.className = 'step done ' + (firstTryOk[i] ? 'ok' : 'fixed');
        sf.innerHTML = `
          <div class="st-msg ${firstTryOk[i] ? 'ok' : 'bad'}">
            ${firstTryOk[i]
              ? '✓ 一次算对！'
              : (ok ? '✓ 第二次修正正确（因使用过提示重试，整题仍会进错题本巩固一次）' : `✗ 本步标准答案：<b>${ansText}</b>`)}
            ${st.explain ? `<div class="st-exp">${st.explain}</div>` : ''}
          </div>
        `;
        $$('input,button', sb).forEach((x) => { x.disabled = true; });
        if (i + 1 < q.steps.length) {
          mountStep(i + 1);
          reveal($(`.step[data-k="${i + 1}"]`, body));
        } else {
          const allFirstOk = firstTryOk.every(Boolean);
          fb.innerHTML = feedback(
            allFirstOk ? 'ok' : 'bad',
            allFirstOk ? '全步骤一次精准通关！' : '部分步骤未能一次做对，已收入错题本二次加固',
            allFirstOk ? [] : ['对照上方标红步骤的说明复盘一下卡点，下次挑战就能全绿一次过！'],
            q.explain,
            q.explainFig
          );
          ctl.finish(allFirstOk);
          reveal(fb);
        }
      };

      const wrongOnce = (msg) => {
        sf.innerHTML = `
          <div class="st-msg bad">
            ✗ ${msg}
            <div class="sub">别急，再算一次（本步还有 1 次纠错机会）</div>
          </div>
        `;
        li.classList.remove('shake');
        void li.offsetWidth;
        li.classList.add('shake');
      };

      if (st.type === 'single') {
        sb.innerHTML = `<div class="opts sm">${st.options.map(optHTML).join('')}</div>`;
        $$('.opt', sb).forEach((b) => {
          b.onclick = () => {
            const o = st.options[+b.dataset.i];
            tries++;
            if (o.ok) {
              b.classList.add('right');
              endStep(true);
            } else {
              b.classList.add('wrong');
              b.disabled = true;
              if (tries >= 2) {
                $$('.opt', sb).forEach((x, j) => st.options[j].ok && x.classList.add('right'));
                endStep(false);
              } else {
                wrongOnce(o.why || '再仔细核对一下条件');
              }
            }
          };
        });
      } else {
        sb.innerHTML = `
          <div class="st-row">
            ${numHTML(st.unit)}
            <button type="button" class="btn primary st-ok" disabled>确定</button>
          </div>
        `;
        const inp = $('input', sb);
        const okb = $('.st-ok', sb);
        inp.oninput = () => { okb.disabled = inp.value.trim() === ''; };
        const check = () => {
          const v = parseNum(inp.value);
          if (Number.isNaN(v)) return toast('请输入有效数字');
          tries++;
          if (numOK(v, st)) {
            $('.num-row', sb).className = 'num-row right';
            return endStep(true);
          }
          const trap = findTrap(v, st.traps);
          if (tries >= 2) {
            $('.num-row', sb).className = 'num-row wrong';
            return endStep(false);
          }
          wrongOnce(trap ? trap.msg : `${fmt(v)} 不对哦，检查一下单位换算或串并联关系。`);
          inp.select();
        };
        okb.onclick = check;
        inp.onkeydown = (e) => {
          if (e.key === 'Enter' && inp.value.trim()) check();
        };
        setTimeout(() => {
          if (i > 0) inp.focus({ preventScroll: true });
        }, 80);
      }
    }
  }

  /* ================= 视图 4：防遗忘错题本 (#/review) ================= */
  function viewReview() {
    const ids = wrongBook();
    const redo = ids.filter((id) => status(id) === 'redo');
    const fixing = ids.filter((id) => status(id) === 'fixing');
    const fixed = ALL_IDS.filter((id) => {
      const r = Store.q(id);
      return r && r.wrong > 0 && status(id) === 'mastered';
    });

    const item = (id) => {
      const { q, t, lv } = QMAP[id];
      const r = Store.q(id);
      return `
        <li class="wb-item t-${t.id}">
          <span class="wb-dot"></span>
          <div class="wb-main">
            <div class="wb-t">${q.title}</div>
            <div class="wb-s">${t.short} · ${lv.name} · 曾错 ${r.wrong} 次${r.streak ? ` · 已连对 ${r.streak} 次` : ''}</div>
          </div>
          <button type="button" class="btn sm" data-act="redo" data-ids="${id}" data-title="单题靶向重练">重练</button>
        </li>
      `;
    };

    const group = (title, list, cls, note) => (list.length ? `
      <section class="wb-group ${cls}">
        <h2>${title} <span>${list.length}</span></h2>
        ${note ? `<p class="note">${note}</p>` : ''}
        <ul>${list.map(item).join('')}</ul>
      </section>
    ` : '');

    app.innerHTML = topbar('#/', 'review') + `
      <main class="page review">
        <h1 class="pg-h">${Icons.book('lg')} 防遗忘错题本</h1>
        <p class="pg-sub">凡是做错或用过步骤重试的题都会收录于此。之后必须<b>连续独立答对 2 次</b>，才会正式销号计入「已掌握」。</p>
        ${ids.length
          ? `<button type="button" class="btn primary big block" data-act="redo" data-ids="${ids.join(',')}" data-title="错题集中攻坚">一键开始订正（共 ${ids.length} 题）</button>`
          : `<div class="empty card">${Icons.trophy('lg')}<div style="margin-top:8px;font-weight:700;color:var(--ink);">太棒了，当前没有待订正的错题！</div><div style="margin-top:6px;"><a href="#/">返回首页继续推进闯关 →</a></div></div>`
        }
        ${group('待重做', redo, 'redo', '最近一次作答有误，需连对 2 次销号')}
        ${group('订正巩固中', fixing, 'fixing', '上次已做对 1 次，再独立答对 1 次即可彻底攻克！')}
        ${group('已彻底攻克的错题', fixed, 'fixed', '曾经踩坑，现已完成连续 2 次满分验证')}
      </main>
    `;
  }

  /* ================= 视图 5：升级版动态电路实验室 (#/lab) ================= */
  const Lab = { topo: 'or', s1: true, s2: false, s3: false, broken: false, R1: 60.5, R2: 110.6 };

  function labCalc(st) {
    const s = Fig.state(st);
    if (!s.on) return { mode: '不加热', I: 0, U1: 0, P1: 0, P: 0, s };
    const R = s.bypass ? Lab.R1 : Lab.R1 + Lab.R2;
    const I = 220 / R;
    return {
      mode: s.bypass ? '武火' : '文火',
      I,
      U1: I * Lab.R1,
      P1: I * I * Lab.R1,
      P: 220 * I,
      s
    };
  }

  function viewLab() {
    app.innerHTML = topbar('#/', 'lab') + `
      <main class="page lab t-circuit">
        <h1 class="pg-h">${Icons.plug('lg')} 动态电路实验室</h1>
        <p class="pg-sub">直接点击电路图里的开关（或下方按钮），观察黄色发光电流走哪条路、哪个电阻亮起暖橙热光、真值表哪一行高亮。</p>

        <div class="lab-grid">
          <section class="card">
            <div class="seg" id="topo" role="tablist" aria-label="开关连接方式">
              <button type="button" data-v="or">各自并联（或）</button>
              <button type="button" data-v="and">串联后并联（与）</button>
              <button type="button" data-v="single">单开关简化版</button>
            </div>

            <figure class="fig lab-fig" id="labfig"></figure>
            <div class="sw-row" id="swrow"></div>

            <!-- 一键复现原卷高频考点工况 -->
            <div class="preset-row" id="labPresets">
              <button type="button" class="preset-chip" data-preset="origin_low">复现原题：文火 100W</button>
              <button type="button" class="preset-chip" data-preset="origin_d_trap">复现原题 D 坑：低温少水仍武火</button>
              <button type="button" class="preset-chip" data-preset="equal_r">调为 R₂ = R₁ (1/4功率比)</button>
              <button type="button" class="preset-chip" data-preset="origin_c_fault">复现原题 C 项：R₂ 断路故障</button>
            </div>

            <label class="chk">
              <input type="checkbox" id="brk"/> 模拟限流电阻 R₂ 内部断路（故障）
            </label>
            <div class="slider">
              <div>
                <span>加热电阻 R₁ = 60.5 Ω（原题固定值）</span>
                <span>限流电阻 R₂ = <b id="r2v"></b> Ω</span>
              </div>
              <input type="range" min="10" max="300" step="0.1" id="r2" aria-label="调节限流电阻 R₂ 阻值"/>
            </div>
          </section>

          <section class="card">
            <div id="readout"></div>
            <h3 class="lab-h">开关状态真值表（实时高亮当前行）</h3>
            <div id="truth"></div>
          </section>
        </div>

        <section class="card tasks">
          <h3>五个动手小实验（试一遍胜过背十遍解析）</h3>
          <ol>
            <li>点「<b>复现原题 D 坑：低温少水仍武火</b>」：看清当水少（S₃ 断开）但温度低（S₂ 闭合）时，电流怎样从 S₂ 绕过 R₂！</li>
            <li>点「<b>复现原题：文火 100W</b>」：观察此时 R₁ 两端电压只有 <b>77.8 V</b>（而非 220 V），彻底明白为什么算 <code>220² ÷ 100 = 484 Ω</code> 是错的。</li>
            <li>点「<b>调为 R₂ = R₁</b>」：看看文火时 R₁ 电压是不是刚好减半为 110 V，R₁ 功率是不是刚好变成武火 800 W 的 <b>1/4（200 W）</b>？</li>
            <li>勾选「<b>模拟 R₂ 断路</b>」再拨动 S₂、S₃：验证原题 C 选项「R₂ 断路后，还能加热时只有武火」。</li>
            <li>顶部切到「<b>串联后并联（与）</b>」：对比真值表，看看文火从 1 行变成了几行？</li>
          </ol>
        </section>
      </main>
    `;

    $('#topo').onclick = (e) => {
      const b = e.target.closest('button');
      if (b) {
        Lab.topo = b.dataset.v;
        labRender();
      }
    };
    $('#labfig').onclick = (e) => {
      const g = e.target.closest('[data-sw]');
      if (g) {
        Lab[g.dataset.sw] = !Lab[g.dataset.sw];
        labRender();
      }
    };
    $('#labfig').onkeydown = (e) => {
      const g = e.target.closest('[data-sw]');
      if (g && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        Lab[g.dataset.sw] = !Lab[g.dataset.sw];
        labRender();
        const nextEl = $(`[data-sw="${g.dataset.sw}"]`);
        if (nextEl) nextEl.focus();
      }
    };
    $('#swrow').onclick = (e) => {
      const b = e.target.closest('button');
      if (b) {
        Lab[b.dataset.sw] = !Lab[b.dataset.sw];
        labRender();
      }
    };
    $('#labPresets').onclick = (e) => {
      const p = e.target.closest('[data-preset]');
      if (!p) return;
      const key = p.dataset.preset;
      if (key === 'origin_low') {
        Object.assign(Lab, { topo: 'or', s1: true, s2: false, s3: false, broken: false, R2: 110.6 });
        toast('已还原原卷文火工况：U₁ ≈ 77.8 V，P₁ ≈ 100 W');
      } else if (key === 'origin_d_trap') {
        Object.assign(Lab, { topo: 'or', s1: true, s2: true, s3: false, broken: false, R2: 110.6 });
        toast('低温(<60℃)且少水(≤0.2L)：S₂ 闭合短路 R₂，照样是 800W 武火！');
      } else if (key === 'equal_r') {
        Object.assign(Lab, { topo: 'or', s1: true, s2: false, s3: false, broken: false, R2: 60.5 });
        toast('R₂ = R₁ = 60.5 Ω：串联平分 110 V，P₁ 恰为武火的 1/4（200 W）');
      } else if (key === 'origin_c_fault') {
        Object.assign(Lab, { topo: 'or', s1: true, s2: false, s3: true, broken: true, R2: 110.6 });
        toast('R₂ 已断路：全断开时不加热，任一开关闭合时只能 800W 武火');
      }
      $('#r2').value = Lab.R2;
      labRender();
    };
    $('#brk').onchange = (e) => {
      Lab.broken = e.target.checked;
      labRender();
    };
    const r2 = $('#r2');
    r2.value = Lab.R2;
    r2.oninput = () => {
      Lab.R2 = +r2.value;
      labRender();
    };
    labRender();
  }

  function labRender() {
    const st = { ...Lab, flow: true, interactive: true };
    $$('#topo button').forEach((b) => b.classList.toggle('on', b.dataset.v === Lab.topo));
    $('#labfig').innerHTML = Fig.circuit(st);

    const sws = [
      ['s1', 'S₁ 主开关'],
      ['s2', Lab.topo === 'single' ? 'S 自动开关' : 'S₂ 温控'],
      ...(Lab.topo === 'single' ? [] : [['s3', 'S₃ 水量']])
    ];
    $('#swrow').innerHTML = sws
      .map(([k, n]) => `<button type="button" class="sw-btn ${Lab[k] ? 'on' : ''}" data-sw="${k}" aria-pressed="${Lab[k]}">${n}<b>${Lab[k] ? '闭合' : '断开'}</b></button>`)
      .join('');

    $('#brk').checked = Lab.broken;
    $('#r2v').textContent = Lab.R2.toFixed(1);

    const c = labCalc(st);
    const P1max = (220 * 220) / Lab.R1;
    $('#readout').innerHTML = `
      <div class="mode m-${c.mode}">${c.mode}</div>
      <div class="metrics">
        <div><span>干路电流 I</span><b>${c.I.toFixed(2)} A</b></div>
        <div><span>R₁ 两端电压 U₁</span><b>${c.U1.toFixed(1)} V</b></div>
        <div><span>R₁ 发热功率 P₁</span><b>${c.P1.toFixed(1)} W</b></div>
        <div><span>整机总功率 P总</span><b>${c.P.toFixed(1)} W</b></div>
      </div>
      <p class="note">
        ${c.mode === '文火'
          ? `此时 R₁ 功率是武火（${P1max.toFixed(0)} W）的 ${(c.P1 / P1max).toFixed(3)} 倍；R₁ 两端仅分得 ${c.U1.toFixed(1)} V（其余 ${(220 - c.U1).toFixed(1)} V 分给了 R₂），注意区分「R₁ 功率」与「整机总功率」！`
          : c.mode === '武火'
            ? '限流电阻 R₂ 被闭合的开关旁路短路（无电流流过），220 V 全部加在加热电阻 R₁ 两端！'
            : '回路处于断开状态，无电流流过。'}
      </p>
    `;

    const combos = Lab.topo === 'single' ? [[1, 0], [0, 0]] : [[1, 1], [1, 0], [0, 1], [0, 0]];
    const rows = combos.map(([a, b]) => {
      const cc = labCalc({ ...Lab, s1: true, s2: Boolean(a), s3: Boolean(b) });
      const cur = Lab.s1 && Boolean(a) === Lab.s2 && (Lab.topo === 'single' || Boolean(b) === Lab.s3);
      return `
        <tr class="${cur ? 'cur' : ''}">
          <td>${a ? '闭合' : '断开'}</td>
          ${Lab.topo === 'single' ? '' : `<td>${b ? '闭合' : '断开'}</td>`}
          <td class="m-${cc.mode}">${cc.mode}</td>
          <td>${cc.P1.toFixed(0)} W</td>
          <td>${cc.P.toFixed(0)} W</td>
        </tr>
      `;
    }).join('');

    $('#truth').innerHTML = `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>${Lab.topo === 'single' ? 'S' : 'S₂'}</th>
              ${Lab.topo === 'single' ? '' : '<th>S₃</th>'}
              <th>档位</th>
              <th>R₁ 功率</th>
              <th>整机功率</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="note">注：真值表默认总开关 S₁ 闭合${Lab.broken ? '，且当前 R₂ 处于断路故障态' : ''}。</p>
    `;
  }

  route();
})();
