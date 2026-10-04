/* Shared behaviour for the inner pages (blog): menu, dropdown, theme, booking bar, opening status, CTA tracking.
 * The homepage runs its own heavier script (3D stage, scroll choreography). */
(() => {
const $ = s => document.querySelector(s), root = document.documentElement;

/* CTA tracking */
window.dataLayer = window.dataLayer || [];
document.addEventListener('click', e => {
  const a = e.target.closest('[data-cta]'); if (!a) return;
  const href = a.getAttribute('href') || '';
  dataLayer.push({ event: 'cta_click', cta_id: a.dataset.cta, cta_type: href.startsWith('tel:') ? 'call' : href.includes('bestilling.nu') ? 'booking' : 'other', page: location.pathname });
});

/* live opening status (Europe/Copenhagen) */
const HOURS = { 1: ['09:00', '15:00'], 2: ['08:30', '17:00'], 3: ['08:30', '17:00'], 4: ['08:30', '19:00'], 5: ['08:30', '17:00'] };
const DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
function status() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m = (+p.hour % 24) * 60 + +p.minute;
  const mm = s => +s.slice(0, 2) * 60 + +s.slice(3), h = HOURS[d];
  if (h && m >= mm(h[0]) && m < mm(h[1])) return { open: true, t: `Åben nu · til ${h[1]}` };
  for (let i = 0; i < 8; i++) { const nd = (d + i) % 7, nh = HOURS[nd]; if (nh && (i > 0 || m < mm(nh[0]))) return { open: false, t: `Lukket · åbner ${i === 0 ? 'i dag' : i === 1 ? 'i morgen' : DAYS[nd]} ${nh[0]}` }; }
}
const st = status();
document.querySelectorAll('.js-open').forEach(el => el.innerHTML = `<i class="open-dot${st.open ? '' : ' closed'}"></i>${st.t}`);
const dNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' })).getDay();
document.querySelectorAll('.hm-list [data-d]').forEach(el => el.classList.toggle('today', +el.dataset.d === dNow));

/* theme toggle */
$('#themeT')?.addEventListener('click', () => {
  root.classList.add('theme-anim'); root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('hc-theme', root.dataset.theme); } catch (e) {}
  setTimeout(() => root.classList.remove('theme-anim'), 600);
});

/* mobile menu */
const burger = $('#burger'), mnav = $('#mnav');
const setMenu = open => { mnav.hidden = !open; root.classList.toggle('menu-open', open); burger.setAttribute('aria-expanded', open); };
burger?.addEventListener('click', () => setMenu(mnav.hidden));
mnav?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

/* menu dropdowns */
document.querySelectorAll('.mainnav .dd').forEach(dd => {
  const t = dd.querySelector('.dd-t'), set = o => { dd.classList.toggle('open', o); t.setAttribute('aria-expanded', o); };
  const hover = () => matchMedia('(hover: hover)').matches;
  t.addEventListener('click', () => set(hover() ? true : !dd.classList.contains('open')));
  dd.addEventListener('mouseenter', () => hover() && set(true));
  dd.addEventListener('mouseleave', () => hover() && set(false));
  dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) set(false); });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
});
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* header + booking bar on scroll */
const hdr = $('#hdr'), docks = document.querySelectorAll('.dock'), mobile = () => matchMedia('(max-width: 760px)').matches;
const onScroll = () => {
  hdr.classList.toggle('solid', scrollY > 40);
  const show = mobile() || scrollY > 500;
  docks.forEach(d => d.classList.toggle('show', show));
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* reading progress for articles */
const bar = $('.read-bar i'), art = $('.post-body');
if (bar && art) addEventListener('scroll', () => {
  const r = art.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .4 - r.top) / r.height));
  bar.style.transform = `scaleX(${p})`;
}, { passive: true });
})();
