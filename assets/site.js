/* E-Star HVAC — site behavior (v2) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- language (EN / ES) ---------- */
  const tr = $$('[data-es]');
  tr.forEach(el => (el.dataset.en = el.innerHTML));
  const ariaTr = $$('[data-es-aria]');
  ariaTr.forEach(el => (el.dataset.enAria = el.getAttribute('aria-label') || ''));
  let lang = 'en';
  const langBtn = $('#language');
  function setLanguage(v) {
    lang = v;
    document.documentElement.lang = v;
    tr.forEach(el => (el.innerHTML = el.dataset[v]));
    ariaTr.forEach(el => el.setAttribute('aria-label', v === 'es' ? el.dataset.esAria : el.dataset.enAria));
    if (langBtn) {
      langBtn.textContent = v === 'en' ? 'ES' : 'EN';
      langBtn.setAttribute('aria-label', v === 'en' ? 'Cambiar a español' : 'Switch to English');
    }
    document.title = v === 'es'
      ? 'E-Star HVAC | Calefacción y aire acondicionado | NH, MA y ME'
      : 'E-Star HVAC | Heating, Cooling & Ventilation | NH, MA & ME';
    try { localStorage.setItem('estar-language', v); } catch {}
  }
  langBtn?.addEventListener('click', () => setLanguage(lang === 'en' ? 'es' : 'en'));
  try { if (localStorage.getItem('estar-language') === 'es') setLanguage('es'); } catch {}

  /* legacy routes from the previous site */
  const route = decodeURIComponent(location.pathname).replace(/\/$/, '');
  if (route.includes('hablamos') || new URLSearchParams(location.search).get('lang') === 'es') setLanguage('es');
  const anchors = { '/services': 'services', '/about': 'about', '/contact-us': 'contact', '/contact': 'contact', '/work': 'work', '/projects': 'work' };
  if (anchors[route]) requestAnimationFrame(() => document.getElementById(anchors[route])?.scrollIntoView());

  /* ---------- header + menu ---------- */
  const header = $('header.site');
  const onScroll = () => header?.classList.toggle('scrolled', scrollY > 30);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const menu = $('.menu-btn'), nav = $('#navigation');
  const closeMenu = () => { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); };
  menu?.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(o)); });
  $$('#navigation a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- reveal on scroll ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.reveal').forEach(el => { if (el.getBoundingClientRect().top > innerHeight * .92) { el.classList.add('pending'); io.observe(el); } });
  } else $$('.reveal').forEach(el => el.classList.add('in'));

  /* ---------- service card spotlight ---------- */
  $$('.svc').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- gallery filters ---------- */
  const fbtns = $$('.filters button');
  const gal = $('#gallery'), more = $('#more');
  $('#more-btn')?.addEventListener('click', () => { gal.classList.remove('collapsed'); more.hidden = true; $$('#gallery .tile').forEach(t => t.classList.add('in')); });
  fbtns.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    if (f !== 'all') { gal.classList.remove('collapsed'); more.hidden = true; }
    fbtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('#gallery .tile').forEach(t => {
      const show = f === 'all' || t.dataset.cat === f;
      t.classList.toggle('hide', !show);
      if (show) t.classList.add('in');
    });
  }));

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox');
  let items = [], idx = 0;
  function render() {
    const t = items[idx]; if (!t) return;
    const img = $('#lb-img'), im = t.querySelector('img');
    img.src = t.dataset.full; img.alt = im?.alt || '';
    $('#lb-kicker').textContent = t.querySelector('small')?.textContent || '';
    $('#lb-title').textContent = t.querySelector('strong')?.textContent || '';
    $('#lb-count').textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
  }
  function open(t) {
    const group = t.closest('#gallery') ? $$('#gallery .tile:not(.hide)').filter(x => x.offsetParent !== null) : $$('.maint-grid .m-card');
    items = group; idx = group.indexOf(t); render();
    if (lb?.showModal) lb.showModal(); else window.open(t.dataset.full, '_blank');
  }
  const step = d => { idx = (idx + d + items.length) % items.length; render(); };
  $$('[data-full]').forEach(t => t.addEventListener('click', () => open(t)));
  $('#lb-close')?.addEventListener('click', () => lb.close());
  $('#lb-prev')?.addEventListener('click', () => step(-1));
  $('#lb-next')?.addEventListener('click', () => step(1));
  lb?.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-inner')) lb.close(); });
  lb?.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  let sx = null;
  lb?.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  lb?.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });

  /* ---------- before / after sliders ---------- */
  $$('.compare').forEach(c => {
    const input = c.querySelector('input');
    const set = v => c.style.setProperty('--pos', v + '%');
    input.addEventListener('input', () => set(input.value));
  });

  /* ---------- quote form (prepares SMS / email; nothing sent automatically) ---------- */
  const form = $('#quote');
  if (form) {
    $$('[data-service]').forEach(a => a.addEventListener('click', () => { form.elements.service.value = a.dataset.service; }));
    const compose = (v, l) => l === 'es'
      ? `Hola E-Star HVAC, quisiera consultar sobre un trabajo.\nNombre: ${v.name}\nTeléfono: ${v.phone}\nUbicación: ${v.address}\nServicio: ${v.service}\nDetalles: ${v.details}`
      : `Hello E-Star HVAC, I'd like to discuss a project.\nName: ${v.name}\nPhone: ${v.phone}\nLocation: ${v.address}\nService: ${v.service}\nDetails: ${v.details}`;
    form.addEventListener('submit', e => {
      e.preventDefault();
      ['name', 'phone', 'address', 'details'].forEach(k => (form.elements[k].value = form.elements[k].value.trim()));
      if (!form.reportValidity()) return;
      $('#copy-status').textContent = '';
      const v = Object.fromEntries(new FormData(form));
      v.service = form.elements.service.selectedOptions[0].textContent;
      const msg = compose(v, lang);
      $('#message-copy').value = msg;
      $('#message-result').hidden = false;
      location.href = e.submitter?.value === 'email'
        ? 'mailto:ESTARHVAC@outlook.com?subject=' + encodeURIComponent(lang === 'es' ? 'Solicitud de servicio E-Star HVAC' : 'E-Star HVAC service request') + '&body=' + encodeURIComponent(msg)
        : 'sms:+16032335300?body=' + encodeURIComponent(msg);
    });
    $('#copy')?.addEventListener('click', async () => {
      const a = $('#message-copy');
      try { await navigator.clipboard.writeText(a.value); $('#copy-status').textContent = lang === 'es' ? 'Mensaje copiado.' : 'Message copied.'; }
      catch { a.focus(); a.select(); $('#copy-status').textContent = lang === 'es' ? 'Selecciona y copia el mensaje.' : 'Select and copy the message.'; }
    });
  }

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
