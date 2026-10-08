/* Навигатор поддержки и ИИ-решений НСО — прототип. Статический сайт, без сервера. */
(function () {
  'use strict';

  var ACT = [['manufacturing', 'Производство'], ['trade', 'Торговля, общепит'], ['logistics', 'Логистика, склады, транспорт'], ['construction', 'Строительство, проектирование'], ['health', 'Медицина'], ['finance', 'Финансы'], ['services', 'Услуги, офисный бизнес'], ['agro', 'Сельское хозяйство'], ['other', 'Другое']];
  var STAGE = [['idea', 'Идея, компании ещё нет'], ['startup', 'Стартап до двух лет'], ['small', 'Действующий малый бизнес'], ['medium', 'Средний бизнес']];
  var YN = [['yes', 'Да'], ['no', 'Нет'], ['unknown', 'Не знаю']];
  var PROJECT = [['none', 'Пока нет'], ['1-6', 'От 1 до 6 млн ₽'], ['6-60', 'От 6 до 60 млн ₽'], ['60+', 'Больше 60 млн ₽']];
  var NEED_CATS = [['money', 'Деньги: гранты, займы, компенсации'], ['pilot', 'Пилоты и первые клиенты'], ['people', 'Кадры и обучение'], ['infra', 'Инфраструктура, площадки'], ['rules', 'Правила, бюрократия'], ['info', 'Не хватает информации'], ['other', 'Другое']];
  var SECT = { manufacturing: 'Промышленность', trade: 'Торговля и ритейл', logistics: 'Логистика и склад', construction: 'Строительство', health: 'Здравоохранение', finance: 'Финансы', services: 'Кросс-отраслевые', agro: 'Сельское хозяйство', other: 'Кросс-отраслевые' };
  var ACT_KW = {
    manufacturing: ['произв', 'цех', 'завод', 'фабрик', 'изготавл', 'выпуска', 'станк'],
    trade: ['магазин', 'торгов', 'розниц', 'кафе', 'ресторан', 'общепит', 'блюд', 'маркетплейс'],
    logistics: ['логист', 'склад', 'перевозк', 'доставк', 'транспорт'],
    construction: ['строит', 'проектир', 'застройщик', 'недвижим', 'девелопер', 'монтаж', 'ремонт'],
    health: ['клиник', 'медицин', 'врач', 'пациент', 'стоматолог'],
    finance: ['банк', 'кредит', 'страхов', 'финанс', 'микрозайм'],
    agro: ['ферм', 'сельск', 'агро', 'урожай', 'теплиц'],
    services: ['услуг', 'консалт', 'агентств', 'сервис', 'обучен']
  };
  var TASK_KW = {
    meetings: ['совещан', 'протокол', 'переговор', 'расшифров', 'транскриб'],
    clients: ['клиент', 'обращени', 'поддержк', 'заявк', 'чат', 'звонк', 'мессенджер'],
    sales: ['продаж', 'менеджер по продаж', 'лид', 'коммерческ'],
    hr: ['персонал', 'найм', 'подбор', 'обучен', 'вакан'],
    production: ['простои', 'брак', 'заказ', 'цех', 'оборудован', 'качеств', 'линия', 'линии'],
    logistics: ['склад', 'доставк', 'перевозк', 'логист', 'маршрут'],
    analytics: ['аналитик', 'отчёт', 'отчет', 'прогноз', 'данн', 'дашборд'],
    docs: ['документ', 'договор', 'накладн', 'счёт', 'счет', 'бумаг'],
    legal: ['юрист', 'юридич', 'контрагент', 'проверк'],
    search: ['база знаний', 'базе знаний', 'регламент', 'поиск по'],
    security: ['камер', 'безопасн', 'охран', 'персональн'],
    health: ['пациент', 'врач', 'клиник'],
    construction: ['чертеж', 'чертёж', 'bim', 'проектн', 'смет'],
    gov: ['бюджет', 'благоустр'],
    platform: ['платформ', 'api', 'low-code'],
    infra: ['gpu', 'цод', 'вычислен', 'сервер']
  };

  var S = {
    role: null, text: '', url: '', activity: null, activityAuto: false, stage: null,
    itShare: null, registry: null, project: 'none',
    tasks: [], tasksManual: false, unaware: {}, wantPending: [], needCats: [], showAll: false, onlyEarly: false, submitted: false
  };
  var D = { sol: null, mea: null };
  var mem = null;
  var KEY = 'nso-navigator-records-v1';

  /* ---------- утилиты ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function label(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][1]; return id; }
  function taskLabel(id) { var t = D.sol.tasks.filter(function (x) { return x.id === id; })[0]; return t ? t.label : id; }
  function loadRecords() {
    try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* без хранилища */ }
    return mem || [];
  }
  function saveRecords(arr) {
    mem = arr;
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) { /* без хранилища */ }
  }
  function has(arr, v) { return arr.indexOf(v) >= 0; }
  function toggle(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

  /* ---------- переключатели-чипы ---------- */
  function radio(containerId, opts, key, onchange) {
    var box = $(containerId); box.innerHTML = '';
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', S[key] === o[0] ? 'true' : 'false');
      b.textContent = o[1]; b.dataset.v = o[0];
      b.addEventListener('click', function () {
        S[key] = o[0]; if (key === 'activity') S.activityAuto = false;
        Array.prototype.forEach.call(box.children, function (c) { c.setAttribute('aria-checked', c.dataset.v === S[key] ? 'true' : 'false'); });
        if (onchange) onchange();
      });
      box.appendChild(b);
    });
  }
  function multi(containerId, opts, arrKey, onchange) {
    var box = $(containerId); box.innerHTML = '';
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.setAttribute('aria-pressed', has(S[arrKey], o[0]) ? 'true' : 'false');
      b.textContent = o[1];
      b.addEventListener('click', function () {
        toggle(S[arrKey], o[0]);
        b.setAttribute('aria-pressed', has(S[arrKey], o[0]) ? 'true' : 'false');
        if (onchange) onchange();
      });
      box.appendChild(b);
    });
  }

  /* ---------- навигация ---------- */
  var VIEWS = ['start', 'profile', 'tasks', 'result', 'ministry'];
  function go(v) {
    VIEWS.forEach(function (n) { $('view-' + n).hidden = (n !== v); });
    var navKey = v === 'ministry' ? 'ministry' : 'start';
    Array.prototype.forEach.call(document.querySelectorAll('.nav-btn'), function (b) {
      if (b.dataset.go === navKey) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    var h = document.querySelector('#view-' + v + ' h1, #view-' + v + ' h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    if (v === 'ministry') renderMinistry();
  }

  /* ---------- вывод по тексту ---------- */
  function countKw(t, kws) { var n = 0; kws.forEach(function (k) { if (t.indexOf(k) >= 0) n++; }); return n; }
  function infer() {
    var t = ($('f-text').value || '').toLowerCase();
    S.text = $('f-text').value; S.url = $('f-url').value;
    var out = $('inferred');
    if (!t.trim()) { out.textContent = ''; return; }
    var parts = [];
    if (S.role === 'business' && (!S.activity || S.activityAuto)) {
      var best = null, bn = 0;
      Object.keys(ACT_KW).forEach(function (k) { var n = countKw(t, ACT_KW[k]) * (k === 'manufacturing' ? 2 : 1); if (n > bn) { bn = n; best = k; } });
      if (best) { S.activity = best; S.activityAuto = true; radio('activity-chips', ACT, 'activity'); parts.push('сфера — ' + label(ACT, best).toLowerCase()); }
    }
    var found = [];
    Object.keys(TASK_KW).forEach(function (k) { if (countKw(t, TASK_KW[k]) > 0) found.push(k); });
    if (!S.tasksManual) S.tasks = found;
    if (found.length) parts.push('возможные задачи — ' + found.slice(0, 4).map(function (k) { return taskLabel(k).toLowerCase(); }).join('; '));
    out.textContent = parts.length ? 'Мы поняли так: ' + parts.join('. ') + '. Всё можно изменить дальше.' : 'Пока не нашли подсказок в тексте: выберите сферу и задачи вручную.';
  }

  /* ---------- шаг 1: профиль ---------- */
  function setupProfile() {
    var dev = S.role === 'developer';
    $('fs-activity').hidden = dev;
    $('fs-project').hidden = dev;
    $('fs-dev').hidden = !dev;
    $('about-legend').textContent = dev ? 'Про ваш продукт' : 'Чем занимается ваша компания';
    $('f-text-l').textContent = dev ? 'Что делает ваш продукт и для кого' : 'Описание своими словами или текст с вашего сайта';
    $('f-text').placeholder = dev ? 'Например: ИИ-ассистент, который проверяет договоры для малых юридических отделов' : 'Например: делаем готовые блюда для магазинов, 40 сотрудников, три цеха';
    if (dev) { S.activity = 'other'; S.project = 'none'; }
    radio('activity-chips', ACT, 'activity');
    radio('stage-chips', STAGE, 'stage');
    radio('itshare-chips', YN, 'itShare');
    radio('registry-chips', YN, 'registry');
    radio('project-chips', PROJECT, 'project');
  }

  function profileNext(e) {
    e.preventDefault();
    infer();
    var out = $('inferred'), miss = [];
    if (S.role === 'business' && !S.activity) miss.push('сферу');
    if (!S.stage) miss.push('этап');
    if (S.role === 'developer') { if (!S.itShare) miss.push('долю ИТ в выручке'); if (!S.registry) miss.push('наличие в реестре ПО'); }
    if (miss.length) { out.textContent = 'Выберите: ' + miss.join(', ') + '.'; out.style.color = 'var(--signal)'; return; }
    out.style.color = '';
    var dev = S.role === 'developer';
    $('h-tasks').textContent = dev ? 'Какие задачи решает ваш продукт' : 'Какие задачи хотите решить с помощью ИИ';
    $('tasks-lead').textContent = 'Отметьте всё, что подходит. Если ничего не подходит, пропустите шаг: покажем меры поддержки и решения по вашей сфере.';
    multi('task-chips', D.sol.tasks.map(function (t) { return [t.id, t.label]; }), 'tasks', function () { S.tasksManual = true; });
    go('tasks');
  }

  /* ---------- сопоставление ---------- */
  function evalMeasures() {
    var avail = [], almost = [];
    D.mea.measures.forEach(function (m) {
      if (m.roles.indexOf(S.role) < 0) return;
      var failed = [];
      m.when.forEach(function (c) { if (c.in.indexOf(S[c.key]) < 0) failed.push(c); });
      if (!failed.length) { avail.push(m); return; }
      var f = failed[0];
      if (failed.length === 1 && f.soft && !(f.key === 'project' && S.project === 'none')) {
        almost.push({ m: m, unmet: (f.key === 'itShare' && S.itShare === 'unknown') ? 'Уточните долю ИТ-доходов: нужно не ниже 70%.' : (f.key === 'registry' && S.registry === 'unknown') ? 'Проверьте, есть ли продукт в реестре российского ПО.' : f.unmet });
      }
    });
    return { avail: avail, almost: almost };
  }
  function matchSolutions() {
    var tasks = S.tasks, sect = SECT[S.activity] || 'Кросс-отраслевые';
    var res = [];
    D.sol.items.forEach(function (it) {
      var ov = it.tags.filter(function (t) { return has(tasks, t); });
      var sm = it.sectors.indexOf(sect) >= 0 || it.sectors.indexOf('Кросс-отраслевые') >= 0;
      if (tasks.length ? ov.length === 0 : !sm) return;
      var acc = it.pricing.some(function (p) { return p === 'Бесплатная базовая версия' || p === 'Подписка'; });
      res.push({ it: it, ov: ov, sm: sm, score: ov.length * 3 + (sm ? 2 : 0) + (acc ? 1 : 0) + (it.stage === 'deployed' ? .5 : 0) });
    });
    res.sort(function (a, b) { return b.score - a.score; });
    return res;
  }

  /* ---------- шаг 3: результат ---------- */
  function measureHtml(m, extra, withKnow) {
    var st = m.status === 'active' ? '<span class="tag ok">Действует</span>' : '<span class="tag check">Проверьте условия</span>';
    var src = D.mea.sources[m.src];
    var know = '';
    if (withKnow) {
      var k = S.unaware[m.id];
      know = '<div class="know"><span>Вы знали об этой мере?</span>' +
        '<button type="button" class="chip" data-know="' + m.id + '" data-v="yes" aria-pressed="' + (k === 'yes') + '">Да</button>' +
        '<button type="button" class="chip" data-know="' + m.id + '" data-v="no" aria-pressed="' + (k === 'no') + '">Нет, не знал(а)</button></div>';
    }
    return '<div class="m"><details><summary><span>' + esc(m.title) + '</span><span class="m-meta">' + st + '<span class="tag">' + esc(m.level) + '</span></span></summary>' +
      '<div class="m-body"><p>' + esc(m.gives) + '</p>' +
      (extra ? '<p class="miss">' + esc(extra) + '</p>' : '') +
      '<p><b>Условия.</b> ' + esc(m.terms) + '</p>' +
      '<p class="op">Оператор: ' + esc(m.operator) + '</p>' +
      '<p class="op">Источник: <a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.title) + '</a></p></div></details>' + know + '</div>';
  }
  function renderResult() {
    var r = evalMeasures(), sols = matchSolutions();
    var dev = S.role === 'developer';
    $('result-sum').textContent = 'Доступно мер поддержки: ' + r.avail.length + '. Почти подходите: ' + r.almost.length + '. ' + (dev ? 'Похожих решений в каталоге региона: ' : 'Готовых решений региона под ваши задачи: ') + sols.length + '.';
    $('c1').textContent = r.avail.length;
    $('c2').textContent = r.almost.length;
    $('lane-avail').innerHTML = r.avail.length ? r.avail.map(function (m) { return measureHtml(m, null, true); }).join('') : '<p class="empty">По вашим ответам подходящих мер не нашлось. Это тоже важный сигнал: расскажите справа, что нужно.</p>';
    $('lane-almost').innerHTML = r.almost.length ? r.almost.map(function (a) { return measureHtml(a.m, 'Чего не хватает: ' + a.unmet, false); }).join('') : '<p class="empty">Мер с одним недостающим условием нет.</p>';
    S._almost = r.almost.map(function (a) { return { id: a.m.id, unmet: a.unmet }; });
    S._avail = r.avail.map(function (m) { return m.id; });

    multi('need-cats', NEED_CATS, 'needCats');
    var pend = D.mea.pending;
    $('pending-box').innerHTML = '<p class="field-l">Уже обсуждаются, но пока не приняты</p>' + pend.map(function (p) {
      var src = D.mea.sources[p.src];
      return '<div class="pend"><b>' + esc(p.title) + '</b>' + esc(p.text) + ' <a href="' + esc(src.url) + '" target="_blank" rel="noopener">Источник</a><br>' +
        '<button type="button" class="chip" data-pend="' + p.id + '" aria-pressed="' + has(S.wantPending, p.id) + '">Эта мера нужна и мне</button></div>';
    }).join('');

    $('h-cat').textContent = dev ? 'Что уже есть в каталоге региона по вашей теме' : 'Готовые решения новосибирских разработчиков';
    $('cat-lead').textContent = dev ? 'Это возможные партнёры и конкуренты. Подробности — в каталоге проектного офиса.' : (S.tasks.length ? 'Подобрано по выбранным задачам: ' + S.tasks.map(function (t) { return taskLabel(t).toLowerCase(); }).join('; ') + '.' : 'Подобрано по вашей сфере. Выберите задачи на предыдущем шаге, чтобы точнее.');
    $('pilot-box').hidden = !dev;
    renderCatalog(sols);
    $('cat-src').textContent = 'Источник: ' + D.sol.source.title + ', ' + D.sol.source.issuer + ', ' + D.sol.source.edition + '. Условия и цены уточняйте у разработчика.';
    $('need-sent').hidden = true;
  }
  function renderCatalog(sols) {
    var list = sols.filter(function (s) { return !S.onlyEarly || s.it.stage !== 'deployed'; });
    var shown = S.showAll ? list : list.slice(0, 8);
    var html = shown.map(function (s) {
      var it = s.it;
      var early = it.stage !== 'deployed';
      var why = s.ov.length ? 'Подходит к задачам: ' + s.ov.map(function (t) { return taskLabel(t).toLowerCase(); }).join('; ') : 'Подходит по сфере';
      var contact = [];
      if (it.site) contact.push('<a href="https://' + esc(it.site.replace(/^https?:\/\//, '')) + '" target="_blank" rel="noopener">' + esc(it.site) + '</a>');
      if (it.email) contact.push(esc(it.email));
      if (it.phone) contact.push(esc(it.phone));
      var eff = it.effect ? '<p><b>Результат внедрения.</b> ' + esc(it.effect.length > 260 ? it.effect.slice(0, 257) + '…' : it.effect) + '</p>' : '';
      return '<article class="sol"><div><h4>' + esc(it.product) + '</h4><p class="co">' + esc(it.company.replace(/^(ООО|АО|ПАО)\s*/, '$1 ')) + ', основана в ' + it.year + (it.accredited ? ', аккредитована Минцифры' : '') + '</p>' +
        '<p>' + esc(it.description.length > 300 ? it.description.slice(0, 297) + '…' : it.description) + '</p>' + eff + '<p class="why">' + esc(why) + '</p></div>' +
        '<div class="side"><div class="price"><span class="tag ' + (early ? 'badge-early' : 'ok') + '">' + esc(it.stage_label) + (it.deployments ? ' · ' + it.deployments + (it.deployments >= 100 ? '+' : '') : '') + '</span></div>' +
        '<div class="price">' + it.pricing.map(function (p) { return '<span class="tag">' + esc(p) + '</span>'; }).join('') + '</div>' +
        '<div>' + (contact.length ? contact.join('<br>') : '') + '</div><div class="muted">Каталог, стр. ' + (it.page - 1) + '</div></div></article>';
    }).join('');
    if (!list.length) html = '<p class="empty">Под ваши ответы решений не нашлось. Это значит, что запрос стоит передать в блоке «Такой меры нет».</p>';
    if (!S.showAll && list.length > 8) html += '<div class="actions"><button type="button" class="btn ghost" id="show-all">Показать все (' + list.length + ')</button></div>';
    $('cat-list').innerHTML = html;
  }

  /* ---------- отправка ---------- */
  function buildRecord(extra) {
    var rec = {
      id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: new Date().toISOString(), role: S.role, demo: false,
      profile: { stage: S.stage, activity: S.role === 'developer' ? null : S.activity, itShare: S.itShare, registry: S.registry, project: S.project },
      tasks: S.tasks.slice(), unaware: Object.keys(S.unaware).filter(function (k) { return S.unaware[k] === 'no'; }),
      aware: Object.keys(S.unaware).filter(function (k) { return S.unaware[k] === 'yes'; }),
      almost: S._almost || [], availShown: S._avail || [],
      needs: { text: ($('n-text').value || '').trim(), cats: S.needCats.slice(), wantPending: S.wantPending.slice() },
      contact: null, pilot: null
    };
    if ($('c-consent').checked && ($('c-name').value || $('c-contact').value)) rec.contact = { name: $('c-name').value.trim(), value: $('c-contact').value.trim(), consent: true };
    if (extra) for (var k in extra) rec[k] = extra[k];
    return rec;
  }
  function submitNeed(e) {
    e.preventDefault();
    var txt = ($('n-text').value || '').trim();
    var sent = $('need-sent');
    if (!txt && !S.needCats.length && !S.wantPending.length && !Object.keys(S.unaware).length) {
      sent.hidden = false; sent.style.color = 'var(--signal)';
      sent.textContent = 'Напишите запрос, отметьте категорию, одну из обсуждаемых мер или ответьте, знали ли вы о мерах слева.';
      return;
    }
    var recs = loadRecords(); recs.push(buildRecord()); saveRecords(recs);
    sent.hidden = false; sent.style.color = '';
    sent.textContent = 'Передано. В этой демонстрации ответ сохранён только в вашем браузере. Посмотрите, как он выглядит для министерства, в разделе «Что видит министерство».';
  }
  function submitPilot(e) {
    e.preventDefault();
    var name = ($('p-name').value || '').trim(), txt = ($('p-text').value || '').trim();
    var sent = $('pilot-sent');
    if (!name || !txt) { sent.hidden = false; sent.style.color = 'var(--signal)'; sent.textContent = 'Заполните название продукта и опишите нужный пилот.'; return; }
    var recs = loadRecords(); recs.push(buildRecord({ pilot: { product: name, text: txt } })); saveRecords(recs);
    sent.hidden = false; sent.style.color = ''; sent.textContent = 'Заявка на пилот сохранена в демонстрационном режиме.';
  }

  /* ---------- министерство ---------- */
  function tally(arr) { var m = {}; arr.forEach(function (k) { m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; }); }
  function bars(rows, cls, nameFn) {
    if (!rows.length) return '<p class="empty">Пока нет данных.</p>';
    var max = rows[0][1];
    return rows.slice(0, 8).map(function (r) {
      return '<div class="bar"><div class="bar-t"><span>' + esc(nameFn ? nameFn(r[0]) : r[0]) + '</span></div><div class="bar-track"><div class="bar-fill ' + (cls || '') + '" style="width:' + Math.round(r[1] / max * 100) + '%"></div></div><div class="bar-n">' + r[1] + '</div></div>';
    }).join('');
  }
  function mTitle(id) { var m = D.mea.measures.concat(D.mea.pending).filter(function (x) { return x.id === id; })[0]; return m ? m.title : id; }
  function renderMinistry() {
    var recs = loadRecords(), body = $('min-body');
    if (!recs.length) {
      body.innerHTML = '<div class="panel" style="margin-top:26px"><h3>Пока нет ответов</h3><p class="muted">Пройдите путь как владелец бизнеса и передайте запрос или загрузите условный пример выше. Здесь появится сводка: какие меры люди не знали, где не хватает условий и каких мер нет совсем.</p></div>';
      return;
    }
    var biz = recs.filter(function (r) { return r.role === 'business'; }), dev = recs.filter(function (r) { return r.role === 'developer'; });
    var unaware = [], almost = [], cats = [], pend = [], tasks = [], texts = [], pilots = [], ready = 0, anyDemo = false;
    recs.forEach(function (r) {
      if (r.demo) anyDemo = true;
      (r.unaware || []).forEach(function (x) { unaware.push(x); });
      (r.almost || []).forEach(function (x) { almost.push(x.id + '|' + x.unmet); });
      (r.needs.cats || []).forEach(function (x) { cats.push(x); });
      (r.needs.wantPending || []).forEach(function (x) { pend.push(x); });
      (r.tasks || []).forEach(function (x) { if (r.role === 'business') tasks.push(x); });
      if (r.needs.text) texts.push(r);
      if (r.pilot) pilots.push(r);
      if (r.contact && r.contact.consent) ready++;
    });
    var gapNo = recs.filter(function (r) { return r.needs.text || (r.needs.cats || []).length || (r.needs.wantPending || []).length; }).length;
    var h = '';
    if (anyDemo) h += '<p class="miss" style="margin-top:20px;max-width:760px">В сводке есть условные записи, созданные для демонстрации. Они не отражают реальных ответов компаний.</p>';
    h += '<div class="grid3"><div class="panel"><div class="big">' + recs.length + '</div><p class="muted">ответов: бизнес ' + biz.length + ', разработчики ' + dev.length + '</p></div>' +
      '<div class="panel"><div class="big">' + unaware.length + '</div><p class="muted">раз отметили «не знал(а) о мере»: пробел в информировании</p></div>' +
      '<div class="panel"><div class="big">' + almost.length + '</div><p class="muted">случаев «почти подходит»: пробел в доступности</p></div>' +
      '<div class="panel"><div class="big">' + gapNo + '</div><p class="muted">ответов с запросом на новую меру: пробел в предложении</p></div></div>';
    h += '<div class="grid3">' +
      '<div class="panel"><h3>Какие меры не знали</h3>' + bars(tally(unaware), 'wr', mTitle) + '</div>' +
      '<div class="panel"><h3>Что мешает попасть в программу</h3>' + bars(tally(almost), 'wr', function (k) { var p = k.split('|'); return mTitle(p[0]) + ': ' + p[1]; }) + '</div>' +
      '<div class="panel"><h3>О чём просят</h3>' + bars(tally(cats), 'sg', function (k) { return label(NEED_CATS, k); }) + '</div>' +
      '<div class="panel"><h3>Какие задачи хотят решать с ИИ</h3>' + bars(tally(tasks), '', taskLabel) + '</div>' +
      '<div class="panel"><h3>Какие обсуждаемые меры нужны</h3>' + bars(tally(pend), 'sg', mTitle) + '</div>' +
      '<div class="panel"><h3>Готовы к разговору</h3><div class="big">' + ready + '</div><p class="muted">оставили контакт и согласие. Контакты видны только в выгрузке.</p></div></div>';
    if (texts.length) h += '<div class="panel" style="margin-top:20px"><h3>Запросы своими словами</h3>' + texts.slice(-12).reverse().map(function (r) {
      return '<div class="quote">' + esc(r.needs.text) + '<small>' + esc(label(STAGE, r.profile.stage)) + (r.profile.activity ? ', ' + esc(label(ACT, r.profile.activity).toLowerCase()) : ', разработчик') + (r.demo ? ' · условный пример' : '') + '</small></div>';
    }).join('') + '</div>';
    if (pilots.length) h += '<div class="panel" style="margin-top:20px"><h3>Заявки на пилоты от разработчиков</h3>' + pilots.slice(-8).reverse().map(function (r) {
      return '<div class="quote"><b>' + esc(r.pilot.product) + '.</b> ' + esc(r.pilot.text) + (r.demo ? '<small>условный пример</small>' : '') + '</div>';
    }).join('') + '</div>';
    body.innerHTML = h;
  }
  function download(name, mime, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
  function exportCsv() {
    var rows = [['id', 'дата', 'роль', 'этап', 'сфера', 'задачи', 'не знали о мерах', 'почти подходят', 'категории запроса', 'нужные меры', 'запрос', 'контакт', 'условный пример']];
    loadRecords().forEach(function (r) {
      rows.push([r.id, r.ts, r.role, r.profile.stage, r.profile.activity, (r.tasks || []).join(';'), (r.unaware || []).join(';'), (r.almost || []).map(function (a) { return a.id; }).join(';'), (r.needs.cats || []).join(';'), (r.needs.wantPending || []).join(';'), r.needs.text, r.contact ? (r.contact.name + ' ' + r.contact.value) : '', r.demo ? 'да' : '']);
    });
    download('otvety.csv', 'text/csv;charset=utf-8', '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\n'));
  }
  function loadDemo() {
    var mk = function (role, stage, act, tasks, unaware, almost, cats, text, pend, pilot) {
      return { id: 'demo' + Math.random().toString(36).slice(2, 7), ts: new Date().toISOString(), role: role, demo: true, profile: { stage: stage, activity: act, itShare: null, registry: null, project: 'none' }, tasks: tasks, unaware: unaware, aware: [], almost: almost, availShown: [], needs: { text: text, cats: cats, wantPending: pend || [] }, contact: null, pilot: pilot || null };
    };
    var a1 = [{ id: 'msp-umbrella', unmet: 'Минимальный кредит по программе — 25 млн ₽.' }];
    var a2 = [{ id: 'frp-regional-productivity', unmet: 'Сумма проекта должна быть от 6–6,5 млн ₽ (заём от 5 млн ₽ при софинансировании 20%).' }];
    var a3 = [{ id: 'it-profit-tax', unmet: 'Нужна доля ИТ-доходов не ниже 70%.' }];
    var demo = [
      mk('business', 'small', 'manufacturing', ['production', 'analytics'], ['frp-regional-tech', 'moy-biznes'], a2, ['money', 'info'], 'Узнал о займах на производительность только от поставщика. Нужен один понятный список мер для производства.', ['ai-deduction']),
      mk('business', 'small', 'trade', ['sales', 'clients'], ['gov-procurement'], [], ['pilot'], 'Хочу попробовать ИИ-анализ звонков, но боюсь платить за решение без пилота.', ['ai-subsidy']),
      mk('business', 'medium', 'logistics', ['logistics'], ['msp-umbrella'], a1, ['money', 'rules'], 'Для среднего бизнеса нет мер на внедрение ИИ, всё про стартапы.', ['ai-deduction']),
      mk('business', 'small', 'construction', ['docs', 'construction'], [], [], ['people'], 'Нужно обучение сотрудников работе с ИИ-инструментами за счёт региона.', []),
      mk('business', 'startup', 'services', ['legal', 'docs'], ['moy-biznes', 'fsi-student'], [], ['info', 'money'], 'Не понимаю, с чего начать: какой грант под какую стадию.', ['ai-deduction', 'ai-subsidy']),
      mk('developer', 'startup', null, ['clients', 'search'], ['fsi-start-ai'], a3, ['pilot'], 'Нужен первый региональный заказчик для пилота на 3 месяца.', [], { product: 'Условный ИИ-ассистент поддержки', text: 'Пилот в организации с большим потоком обращений, 3 месяца, без оплаты.' }),
      mk('developer', 'small', null, ['production'], ['it-vat'], [], ['pilot', 'infra'], 'Нет площадки с реальными данными цеха для обучения модели.', [], { product: 'Условное компьютерное зрение для линий', text: 'Один цех пищевого производства, камеры уже стоят.' })
    ];
    var recs = loadRecords().filter(function (r) { return !r.demo; });
    saveRecords(recs.concat(demo)); renderMinistry();
  }

  /* ---------- сброс ---------- */
  function restart() {
    S.role = null; S.text = ''; S.url = ''; S.activity = null; S.activityAuto = false; S.stage = null; S.itShare = null; S.registry = null; S.project = 'none';
    S.tasks = []; S.tasksManual = false; S.unaware = {}; S.wantPending = []; S.needCats = []; S.showAll = false; S.onlyEarly = false;
    ['f-text', 'f-url', 'n-text', 'c-name', 'c-contact', 'p-name', 'p-text'].forEach(function (i) { $(i).value = ''; });
    $('c-consent').checked = false; $('only-early').checked = false; $('inferred').textContent = '';
    go('start');
  }

  /* ---------- запуск ---------- */
  function init() {
    var n = D.sol.items.length, early = D.sol.items.filter(function (i) { return i.stage !== 'deployed'; }).length;
    $('facts').innerHTML = '<div><dt>' + n + '</dt><dd>решения новосибирских разработчиков из каталога проектного офиса</dd></div>' +
      '<div><dt>' + D.mea.measures.length + '</dt><dd>мер поддержки с источниками и датой проверки</dd></div>' +
      '<div><dt>' + early + '</dt><dd>ранних решений, которым нужны пилотные заказчики</dd></div>';

    Array.prototype.forEach.call(document.querySelectorAll('[data-go]'), function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); go(b.dataset.go); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.role'), function (b) {
      b.addEventListener('click', function () { S.role = b.dataset.role; setupProfile(); infer(); go('profile'); });
    });
    var t; $('f-text').addEventListener('input', function () { clearTimeout(t); t = setTimeout(infer, 350); });
    $('f-url').addEventListener('input', function () { S.url = $('f-url').value; });
    $('profile-form').addEventListener('submit', profileNext);
    $('back-profile').addEventListener('click', function () { go('profile'); });
    $('to-result').addEventListener('click', function () { renderResult(); go('result'); });
    $('need-form').addEventListener('submit', submitNeed);
    $('pilot-form').addEventListener('submit', submitPilot);
    $('restart').addEventListener('click', restart);
    $('only-early').addEventListener('change', function () { S.onlyEarly = this.checked; renderCatalog(matchSolutions()); });
    $('view-result').addEventListener('click', function (e) {
      var k = e.target.closest('[data-know]');
      if (k) {
        var id = k.dataset.know; S.unaware[id] = (S.unaware[id] === k.dataset.v) ? undefined : k.dataset.v; if (S.unaware[id] === undefined) delete S.unaware[id];
        Array.prototype.forEach.call(document.querySelectorAll('[data-know="' + id + '"]'), function (b) { b.setAttribute('aria-pressed', S.unaware[id] === b.dataset.v ? 'true' : 'false'); });
        return;
      }
      var p = e.target.closest('[data-pend]');
      if (p) { toggle(S.wantPending, p.dataset.pend); p.setAttribute('aria-pressed', has(S.wantPending, p.dataset.pend) ? 'true' : 'false'); return; }
      if (e.target.id === 'show-all') { S.showAll = true; renderCatalog(matchSolutions()); }
    });
    $('load-demo').addEventListener('click', loadDemo);
    $('export-json').addEventListener('click', function () { download('otvety.json', 'application/json', JSON.stringify(loadRecords(), null, 2)); });
    $('export-csv').addEventListener('click', exportCsv);
    $('clear-all').addEventListener('click', function () { saveRecords([]); renderMinistry(); });
    window.__nav = { S: S, go: go };
  }

  Promise.all([fetch('data/solutions.json').then(function (r) { return r.json(); }), fetch('data/measures.json').then(function (r) { return r.json(); })])
    .then(function (x) { D.sol = x[0]; D.mea = x[1]; init(); })
    .catch(function () {
      $('view-start').insertAdjacentHTML('beforeend', '<p class="miss" role="alert">Не удалось загрузить данные. Откройте страницу через веб-сервер (GitHub Pages), а не как файл с диска.</p>');
    });
})();
