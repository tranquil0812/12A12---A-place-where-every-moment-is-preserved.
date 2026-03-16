(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const CONFIG = {
    schoolStart: { year: 2024, month: 9, day: 1 },
    schoolEnd:   { year: 2026, month: 6, day: 25 },
    logoCols: 4,
    logoActiveCount: 3,
    logoRotateMs: 2600
  };

  function initProgress() {
    const progressBar = $('#progressBar');
    const progressText = $('#progressText');
    if (!progressBar) return;

    const start = new Date(Date.UTC(CONFIG.schoolStart.year, CONFIG.schoolStart.month - 1, CONFIG.schoolStart.day));
    const end = new Date(Date.UTC(CONFIG.schoolEnd.year, CONFIG.schoolEnd.month - 1, CONFIG.schoolEnd.day));
    const now = new Date();

    let percent = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
    percent = clamp(percent, 0, 100);

    // set both width (fallback) and transform (smooth)
    progressBar.style.width = percent.toFixed(2) + '%';
    progressBar.style.transformOrigin = 'left center';
    progressBar.style.transform = `scaleX(${(percent/100).toFixed(4)})`;

    if (progressText) {
      progressText.textContent = percent >= 100 ? '🎓 Tiền đồ tựa gấm hoa 🌸' : `${percent.toFixed(1)}% hoàn thành`;
    }
  }

  function initLogoCloud() {
    const cloud = $('.uni-cloud');
    if (!cloud) return;
    const links = $$('.uni-cloud .uni-link');
    if (!links.length) return;

    const cols = Math.min(CONFIG.logoCols, links.length);
    const rows = Math.ceil(links.length / cols);

    // đặt vị trí an toàn: chia đều theo grid
    links.forEach((link, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const leftPct = ((col + 0.5) / cols) * 100;
      const topPct  = ((row + 0.5) / rows) * 100;
      link.style.left = `${leftPct}%`;
      link.style.top  = `${topPct}%`;
      // center by translate
      link.style.transform = 'translate(-50%, -50%)';
      // ensure link is focusable for keyboard
      if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
    });

    // rotate active logos
    let current = 0;
    const safeActive = Math.min(CONFIG.logoActiveCount, links.length);
    function rotate() {
      links.forEach(l => l.classList.remove('active'));
      for (let i = 0; i < safeActive; i++) {
        const idx = (current + i) % links.length;
        links[idx].classList.add('active');
      }
      current = (current + 1) % links.length;
    }
    rotate();
    if (window.__logoTimer) clearInterval(window.__logoTimer);
    window.__logoTimer = setInterval(rotate, CONFIG.logoRotateMs);

    // open links safely and keyboard support
    links.forEach(link => {
      const url = link.dataset.url;
      if (!url) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          const u = new URL(url, window.location.href);
          if (u.protocol === 'http:' || u.protocol === 'https:') {
            window.open(u.href, '_blank', 'noopener,noreferrer');
          }
        } catch (err) {
          console.warn('Invalid URL', url);
        }
      });
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          link.click();
        }
      });
    });
  }

  function initModals() {
    const monthModal = $('#monthModal');
    const monthTitle = $('#monthTitle');
    const monthGallery = $('#monthGallery');
    const imgModal = $('#imgModal');
    const modalImg = $('#modalImg');
    const modalText = $('#modalText');

    // ensure monthData exists
    if (typeof window.monthData === 'undefined') window.monthData = {};

    // open month modal when clicking .month-card (delegation)
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.month-card');
      if (!card) return;
      const month = String(card.dataset.month || '').trim();
      if (month && monthData[month]) {
        if (monthTitle) monthTitle.textContent = `Tháng ${month}`;
        if (monthGallery) {
          monthGallery.innerHTML = '';
          monthData[month].forEach(item => {
            const img = document.createElement("img");
            img.src = item.img;
            img.alt = item.note || "";
            img.dataset.note = item.note || "";
            img.classList.add("gallery-img"); // ⭐ THÊM DÒNG NÀY

          });
        }
      } else {
        // fallback: use images inside the clicked card's .month-preview
        if (monthTitle) monthTitle.textContent = `Tháng ${month || ''}`;
        if (monthGallery) {
          monthGallery.innerHTML = '';
          card.querySelectorAll('img').forEach(img => {
            const im = img.cloneNode();
            im.dataset.note = img.dataset.note || img.alt || '';
            monthGallery.appendChild(im);
          });
        }
      }
      if (monthModal) openModal(monthModal, card);
    });

    // click image in previews or gallery to open image modal
    document.addEventListener('click', (e) => {
      const img = e.target.closest('.month-preview img, .gallery-img');
      if (!img) return;
      const src = img.getAttribute('src') || img.dataset.src || '';
      const note = img.dataset.note || img.alt || 'Kỷ niệm đáng nhớ 💙';
      if (modalImg) modalImg.src = src;
      if (modalImg) modalImg.alt = note;
      if (modalText) modalText.textContent = note;
      if (imgModal) openModal(imgModal);
    });

    // close handlers (delegation)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.close-modal');
      if (!btn) return;
      const modal = btn.closest('.modal');
      if (modal) closeModal(modal);
    });

    // overlay click to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    // Esc to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.modal--open').forEach(m => closeModal(m));
      }
    });

    function openModal(el, returnFocusEl = null) {
      if (!el) return;
      el.classList.add('modal--open');
      document.body.classList.add('no-scroll');
      el._returnFocus = returnFocusEl;
      const closeBtn = el.querySelector('.close-modal');
      if (closeBtn) closeBtn.focus();
    }
    function closeModal(el) {
      if (!el) return;
      el.classList.remove('modal--open');
      document.body.classList.remove('no-scroll');
      const ret = el._returnFocus;
      if (ret && typeof ret.focus === 'function') ret.focus();
      el._returnFocus = null;
    }
  }

  function initAll() {
    initProgress();
    initLogoCloud();
    initModals();
    // expose scrollToCalendar if HTML uses inline onclick
    window.scrollToCalendar = function() {
      const calendar = document.getElementById('lich');
      const bird = document.getElementById('bird');
      if (!calendar) return;
      calendar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!bird) return;
      bird.style.position = 'fixed';
      bird.style.left = '20px';
      bird.style.top = '20px';
      bird.style.opacity = '1';
      try {
        bird.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${calendar.getBoundingClientRect().left + window.scrollX}px, ${calendar.getBoundingClientRect().top + window.scrollY}px)` }], { duration: 2000, easing: 'ease-in-out', fill: 'forwards' });
      } catch (e) {
        bird.style.transform = `translate(${calendar.getBoundingClientRect().left + window.scrollX}px, ${calendar.getBoundingClientRect().top + window.scrollY}px)`;
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();