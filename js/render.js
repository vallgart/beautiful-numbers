// ========= utils =========
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const money = v => {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\D/g,'') || 0);
  return n.toLocaleString('ru-RU') + ' сум';
};
const data = window.MASK_DATA || {};

// SVG <use>
function icon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','20'); svg.setAttribute('height','20');
  const use = document.createElementNS('http://www.w3.org/2000/svg','use');
  use.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href', `#${id}`);
  use.setAttribute('href', `#${id}`);
  svg.appendChild(use);
  svg.classList.add('icon');
  return svg;
}

// ========= TABS =========
const panelTop    = $('.content-panel__top');
const panelBottom = $('.content-panel__bottom');
const tabPanel    = $('.tab-section__panel');
const tabs        = $$('.tab-section__item');
const STORAGE_KEY = 'mobiuzMasksActive';

function renderTop(d) {
  panelTop.innerHTML = '';
  panelTop.append(
    topRow('icon-tariff',  d.title),
    topRow('icon-tariff',   money(d.price)),
  );
}
function topRow(iconId, text) {
  const el = document.createElement('div');
  el.className = 'content-panel__top-item';
  el.append(icon(iconId), document.createTextNode(text));
  return el;
}
function renderMasks(d) {
  panelBottom.innerHTML = '';
  const frag = document.createDocumentFragment();
  d.masks.forEach(m => {
    const div = document.createElement('div');
    div.className = 'content-panel__bottom-item';
    div.textContent = m;
    frag.appendChild(div);
  });
  panelBottom.appendChild(frag);
}
function setActiveTab(key) {
  tabs.forEach(t => {
    const on = t.dataset.key === key;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const d = data[key];
  if (!d) return;
  renderTop(d);
  renderMasks(d);
  sessionStorage.setItem(STORAGE_KEY, key);
}
tabPanel.addEventListener('click', e => {
  const tab = e.target.closest('.tab-section__item');
  if (tab) setActiveTab(tab.dataset.key);
});
tabPanel.addEventListener('keydown', e => {
  if (!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
  e.preventDefault();
  const idx = tabs.findIndex(t => t.classList.contains('active'));
  let next = idx;
  if (e.key === 'ArrowRight') next = Math.min(idx + 1, tabs.length - 1);
  if (e.key === 'ArrowLeft')  next = Math.max(idx - 1, 0);
  if (e.key === 'Home')       next = 0;
  if (e.key === 'End')        next = tabs.length - 1;
  tabs[next].focus();
  setActiveTab(tabs[next].dataset.key);
});
// первый показ
{
  const saved = sessionStorage.getItem(STORAGE_KEY);
  const initial = saved || (tabs.find(t => t.classList.contains('active'))?.dataset.key) || tabs[0]?.dataset.key;
  if (initial) setActiveTab(initial);
}

// ========= TABLE (checkbox filters -> .table-bottom) =========
(() => {
  const catFilters = document.getElementById('catFilters');
  const host       = document.querySelector('.table-bottom');

  if (!catFilters || !host) return;

  const CATS = Object.entries(data).map(([key, v]) => ({
    key, title: v.title, price: v.price, masks: Array.isArray(v.masks) ? v.masks : []
  }));

  const selectedCols = () => {
    const keys = Array.from(catFilters.querySelectorAll('input[type="checkbox"]:checked'))
      .map(i => i.dataset.key);
    return CATS.filter(c => keys.includes(c.key));
  };

  function paint() {
    host.innerHTML = `
      <div class="table-wrap zebra">
        <table class="table">
          <thead><tr class="table-head-row"></tr></thead>
          <tbody class="table-body"></tbody>
        </table>
      </div>
    `;
    const thead = host.querySelector('.table-head-row');
    const tbody = host.querySelector('.table-body');
    const cols  = selectedCols();

    // --- шапка: 2 пилюли вертикально (иконка+тариф, иконка+цена)
    thead.innerHTML = '';
    cols.forEach(c => {
      const th = document.createElement('th');

      const stack = document.createElement('div');
      stack.className = 'th-stack';

      const titlePill = document.createElement('div');
      titlePill.className = 'pill';
      titlePill.append(icon('icon-tariff'), document.createTextNode(' ' + c.title));

      const pricePill = document.createElement('div');
      pricePill.className = 'pill pill--price';
      pricePill.append(icon('icon-tariff'), document.createTextNode(' ' + money(c.price)));

      stack.append(titlePill, pricePill);
      th.appendChild(stack);
      thead.appendChild(th);
    });

    // --- тело: построчно по индексу маски
    const maxLen = Math.max(0, ...cols.map(c => c.masks.length));
    const frag = document.createDocumentFragment();
    for (let r = 0; r < maxLen; r++) {
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        td.textContent = c.masks[r] || '';
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    }
    tbody.appendChild(frag);
  }

  catFilters.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"]')) paint();
  });

  paint();
})();


// ===== VIEW SWITCH: Вкладки ↔ Таблица + фильтры
// ===== Переключатель: Вкладки ↔ Таблица + фильтры
(() => {
  const MODE_KEY = 'mobiuzViewMode';
  const btnTabs  = document.getElementById('btnTabs');
  const btnTable = document.getElementById('btnTable');

  function setView(mode) {
    // переключаем атрибут на <body>, CSS покажет нужный блок
    document.body.dataset.view = mode; // 'tabs' | 'table'
    // ARIA-состояние кнопок
    btnTabs?.setAttribute('aria-pressed',  mode === 'tabs'  ? 'true' : 'false');
    btnTable?.setAttribute('aria-pressed', mode === 'table' ? 'true' : 'false');
    // запомним режим
    sessionStorage.setItem(MODE_KEY, mode);
  }

  // Первый показ: по умолчанию 'tabs'. Восстанавливаем 'table' только если сохранён именно он.
  const saved = sessionStorage.getItem(MODE_KEY);
  setView(saved === 'table' ? 'table' : 'tabs');

  // Клики
  btnTabs?.addEventListener('click',  () => setView('tabs'));
  btnTable?.addEventListener('click', () => setView('table'));

  // Клавиатура: стрелки / пробел
  document.querySelector('.view-switch')?.addEventListener('keydown', (e) => {
    if (!['ArrowLeft','ArrowRight',' '].includes(e.key)) return;
    const targetBtn = e.target.closest('button');
    if (!targetBtn) return;

    if (e.key === ' ') { // активируем выделенную кнопку
      e.preventDefault();
      targetBtn.click();
      return;
    }
    e.preventDefault();
    const next = (document.body.dataset.view === 'tabs') ? 'table' : 'tabs';
    setView(next);
    (next === 'tabs' ? btnTabs : btnTable)?.focus();
  });
})();
