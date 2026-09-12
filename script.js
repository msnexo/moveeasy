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

  /* ---------- Angebots-Assistent (Wizard) ---------- */
  const wizard = document.getElementById('wizard');
  if (wizard) {
    const steps = Array.from(wizard.querySelectorAll('.wizard-step[data-step-panel]'));
    const tabs = Array.from(wizard.querySelectorAll('.wizard-step-tab'));
    const lines = Array.from(wizard.querySelectorAll('.wizard-step-line'));
    const backBtn = document.getElementById('wizardBack');
    const nextBtn = document.getElementById('wizardNext');
    const formSuccess = document.getElementById('formSuccess');
    const lastStep = steps.length - 1;
    let current = 0;

    const state = {
      service: null,
      pickupRooms: null, pickupFloor: null, pickupElevator: null, pickupParking: null, pickupAssembly: null, pickupPacking: null,
      dropoffRooms: null, dropoffFloor: null, dropoffElevator: null, dropoffParking: null, dropoffAssembly: null, dropoffPacking: null,
    };

    /* Selection buttons (options + pills), grouped by closest [data-group] */
    wizard.querySelectorAll('.wizard-option, .wizard-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('[data-group]');
        if (!group) return;
        const groupName = group.dataset.group;
        group.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        btn.classList.add('selected');
        state[groupName] = btn.dataset.value;
        updateNextState();
      });
    });

    const dateInput = document.getElementById('wizardDate');
    const flexibleCheck = document.getElementById('wizardFlexible');
    const pickupAddress = document.getElementById('wizardPickupAddress');
    const dropoffAddress = document.getElementById('wizardDropoffAddress');
    const nameInput = document.getElementById('wizardName');
    const phoneInput = document.getElementById('wizardPhone');
    [dateInput, pickupAddress, dropoffAddress, nameInput, phoneInput].forEach(el => {
      if (el) el.addEventListener('input', updateNextState);
    });
    if (flexibleCheck) flexibleCheck.addEventListener('change', () => {
      if (flexibleCheck.checked) dateInput.value = '';
      updateNextState();
    });

    function isStepValid(index) {
      if (index === 0) return !!state.service;
      if (index === 3) return !!(dateInput.value || (flexibleCheck && flexibleCheck.checked));
      if (index === 4) return !!(pickupAddress.value.trim() && dropoffAddress.value.trim());
      if (index === 5) return !!(nameInput.value.trim() && phoneInput.value.trim());
      return true;
    }

    function updateNextState() {
      nextBtn.disabled = !isStepValid(current);
    }

    function showStep(index, scroll) {
      steps.forEach((panel, i) => { panel.hidden = i !== index; });
      tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
        tab.classList.toggle('done', i < index);
      });
      lines.forEach((line, i) => { line.classList.toggle('done', i < index); });
      backBtn.hidden = index === 0;
      nextBtn.textContent = index === lastStep ? 'Kostenloses Angebot anfordern' : 'Weiter →';
      updateNextState();
      if (scroll !== false) wizard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    backBtn.addEventListener('click', () => {
      if (current > 0) { current--; showStep(current); }
    });

    nextBtn.addEventListener('click', () => {
      if (nextBtn.disabled) return;
      if (current < lastStep) {
        current++;
        showStep(current);
      } else {
        submitWizard();
      }
    });

    function submitWizard() {
      const pickupNotes = document.getElementById('pickupNotes').value.trim();
      const dropoffNotes = document.getElementById('dropoffNotes').value.trim();
      const termin = flexibleCheck && flexibleCheck.checked ? 'Flexibel / noch offen' : (dateInput.value || '–');

      const bodyLines = [
        `Dienstleistung: ${state.service || '–'}`,
        '',
        `Abholadresse: ${pickupAddress.value.trim() || '–'}`,
        `Zimmer: ${state.pickupRooms || '–'} | Etage: ${state.pickupFloor || '–'} | Aufzug: ${state.pickupElevator || '–'}`,
        `Parken: ${state.pickupParking || '–'} | Möbelmontage: ${state.pickupAssembly || '–'} | Verpackungsservice: ${state.pickupPacking || '–'}`,
        pickupNotes ? `Hinweise Abholort: ${pickupNotes}` : '',
        '',
        `Lieferadresse: ${dropoffAddress.value.trim() || '–'}`,
        `Zimmer: ${state.dropoffRooms || '–'} | Etage: ${state.dropoffFloor || '–'} | Aufzug: ${state.dropoffElevator || '–'}`,
        `Parken: ${state.dropoffParking || '–'} | Möbelmontage: ${state.dropoffAssembly || '–'} | Verpackungsservice: ${state.dropoffPacking || '–'}`,
        dropoffNotes ? `Hinweise Zielort: ${dropoffNotes}` : '',
        '',
        `Wunschtermin: ${termin}`,
        '',
        `Name: ${nameInput.value.trim()}`,
        `Telefon: ${phoneInput.value.trim()}`,
        `E-Mail: ${document.getElementById('wizardEmail').value.trim() || '–'}`,
      ].filter(Boolean).join('\n');

      const mailto = `mailto:info@move-easy.info?subject=${encodeURIComponent('Angebotsanfrage über die Website: ' + (state.service || ''))}&body=${encodeURIComponent(bodyLines)}`;

      formSuccess.hidden = false;
      nextBtn.disabled = true;
      window.location.href = mailto;
    }

    showStep(0, false);   // beim Laden nicht scrollen - sonst startet die Seite mittendrin
  }

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

});
