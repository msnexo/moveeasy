document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Scroll progress bar ---------- */
  const progress = document.getElementById('scrollProgress');
  const updateProgress = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progress.style.width = scrolled + '%';
  };

  /* ---------- Sticky header ---------- */
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    if (window.scrollY > 600) backToTop.classList.add('show');
    else backToTop.classList.remove('show');

    updateProgress();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    document.body.style.overflow = '';
  }));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ---------- Trust strip counters ---------- */
  const counters = document.querySelectorAll('.trust-strip-item strong[data-count]');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (eased * target).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterIO.observe(el));

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(open => {
        open.classList.remove('open');
        open.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Legal modals ---------- */
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const panels = {
    impressum: document.getElementById('modalImpressum'),
    datenschutz: document.getElementById('modalDatenschutz'),
    agb: document.getElementById('modalAgb'),
    widerruf: document.getElementById('modalWiderruf'),
  };
  const openModal = (key) => {
    Object.values(panels).forEach(p => p.hidden = true);
    if (panels[key]) panels[key].hidden = false;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };
  document.querySelectorAll('[data-modal]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(link.dataset.modal);
    });
  });
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const phone = data.get('phone') || '';
    const service = data.get('service') || '';
    const from = data.get('from') || '';
    const to = data.get('to') || '';
    const message = data.get('message') || '';

    const bodyLines = [
      `Name: ${name}`,
      `E-Mail: ${email}`,
      `Telefon: ${phone}`,
      `Leistung: ${service}`,
      `Von: ${from}`,
      `Nach: ${to}`,
      '',
      message
    ].join('\n');

    const mailto = `mailto:info@move-easy.info?subject=${encodeURIComponent('Anfrage über die Website: ' + service)}&body=${encodeURIComponent(bodyLines)}`;

    formSuccess.hidden = false;
    window.location.href = mailto;
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

});
