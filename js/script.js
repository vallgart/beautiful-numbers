document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  initPopups();
});

/* === FAQ: доступный аккордеон (aria-expanded + hidden) === */
function initFAQ() {
  // Проставим отсутствующие aria/id и свернём панели по умолчанию
  document.querySelectorAll('.faq-item').forEach((item, idx) => {
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    if (!btn || !panel) return;

    if (!btn.id) btn.id = `faq_q_${idx + 1}`;
    if (!panel.id) panel.id = `faq_a_${idx + 1}`;

    if (!btn.hasAttribute('aria-controls')) btn.setAttribute('aria-controls', panel.id);
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');

    // Для Читалок: панели даём имя по кнопке
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'region');
    if (!panel.hasAttribute('aria-labelledby')) panel.setAttribute('aria-labelledby', btn.id);

    // Свернуть по умолчанию (если явно не открыт)
    if (!item.classList.contains('active-state')) panel.hidden = true;
  });

  // Делегирование кликов по кнопкам вопросов
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;

    const item  = btn.closest('.faq-item');
    const panel = item?.querySelector('.faq-answer');
    if (!item || !panel) return;

    const expanded = btn.getAttribute('aria-expanded') === 'true';

    // Закрыть все прочие открытые пункты (аккордеон)
    document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(openBtn => {
      if (openBtn === btn) return;
      openBtn.setAttribute('aria-expanded', 'false');
      const openItem  = openBtn.closest('.faq-item');
      const openPanel = openItem?.querySelector('.faq-answer');
      if (openPanel) openPanel.hidden = true;
      openItem?.classList.remove('active-state');
    });

    // Переключить текущий
    btn.setAttribute('aria-expanded', String(!expanded));
    panel.hidden = expanded; // если был открыт — скрываем, иначе показываем
    item.classList.toggle('active-state', !expanded);
  });
}

/* === POPUPS (поддержка hidden и/или класса .open) === */
function initPopups() {
  const overlay = document.getElementById('popup-overlay');
  if (!overlay) return;

  let lastFocused = null;
  let keyHandler  = null;

  const lockScroll = () => {
    const scrollBarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollBarW > 0) document.body.style.paddingRight = scrollBarW + 'px';
  };
  const unlockScroll = () => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  };

  const showEl = (el) => {
    el.classList.add('open');
    if (el.hasAttribute('hidden')) el.hidden = false;
  };
  const hideEl = (el) => {
    el.classList.remove('open');
    if (el.hasAttribute('hidden')) el.hidden = true;
  };

  const trapFocus = (popup, e) => {
    const focusables = popup.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const closeAll = () => {
    hideEl(overlay);
    document.querySelectorAll('.popup').forEach(p => hideEl(p));
    document.removeEventListener('keydown', keyHandler);
    unlockScroll();
    if (lastFocused) lastFocused.focus();
    lastFocused = null;
  };

  const openPopup = (id, trigger) => {
    const popup = document.getElementById(id);
    if (!popup) return;

    lastFocused = trigger || document.activeElement;
    showEl(overlay);
    showEl(popup);
    lockScroll();

    // Фокус внутрь попапа
    setTimeout(() => {
      const firstFocusable = popup.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (firstFocusable || popup).focus();
    }, 0);

    // Клавиатура: ESC + trap
    keyHandler = (e) => {
      if (e.key === 'Escape') return closeAll();
      if (popup.classList.contains('open') && overlay.classList.contains('open')) trapFocus(popup, e);
    };
    document.addEventListener('keydown', keyHandler, { passive: false });
  };

  // Делегирование кликов
  document.addEventListener('click', (e) => {
    const openBtn  = e.target.closest('[data-popup-open]');
    const closeBtn = e.target.closest('[data-popup-close]');

    if (openBtn) {
      e.preventDefault();
      openPopup(openBtn.dataset.popupOpen, openBtn);
      return;
    }

    if (closeBtn) {
      const isLink = closeBtn.tagName === 'A' && closeBtn.hasAttribute('href');
      if (!isLink) e.preventDefault();
      closeAll();
    }
  });

  // Закрытие по клику на оверлей
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAll();
  });
}