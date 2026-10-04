/* Cookie consent (GDPR / Danish cookie rules): nothing optional runs before a choice.
 * - Equal-weight choices: accept all / necessary only / customise. No pre-ticked boxes.
 * - Choice is stored for 12 months, then the visitor is asked again.
 * - Google consent mode defaults to "denied" and is updated from the choice, so a tag manager
 *   added later will only fire statistics/marketing tags after consent.
 * - Any element with [data-cookie-settings] reopens the banner.
 * Config comes from the script tag: data-cookies="<cookie policy url>" data-privacy="<privacy url>".
 */
(() => {
const me = document.currentScript, KEY = 'hc-consent', MAX_AGE = 365 * 24 * 3600 * 1000;
const en = (document.documentElement.lang || '').startsWith('en');
const T = en ? {
  title: 'We use cookies', text: 'We use necessary cookies to make the site work. With your consent we would also like to use cookies for statistics and marketing, so we can improve the site. You can change your choice at any time.',
  all: 'Accept all', nec: 'Necessary only', custom: 'Customise', save: 'Save choice', more: 'Read our cookie policy', priv: 'privacy policy',
  cats: [['necessary', 'Necessary', 'Needed for the site to work, e.g. remembering your cookie choice and light/dark theme. Always on.'],
         ['statistics', 'Statistics', 'Anonymous statistics about how the site is used, so we can improve it.'],
         ['marketing', 'Marketing', 'Used to show relevant ads and measure our campaigns.']]
} : {
  title: 'Vi bruger cookies', text: 'Vi bruger nødvendige cookies, så siden virker. Med dit samtykke vil vi også gerne bruge cookies til statistik og marketing, så vi kan forbedre siden. Du kan altid ændre dit valg.',
  all: 'Accepter alle', nec: 'Kun nødvendige', custom: 'Tilpas', save: 'Gem valg', more: 'Læs vores cookiepolitik', priv: 'privatlivspolitik',
  cats: [['necessary', 'Nødvendige', 'Skal til for at siden virker, fx at huske dit cookievalg og lyst/mørkt tema. Altid slået til.'],
         ['statistics', 'Statistik', 'Anonym statistik om, hvordan siden bruges, så vi kan forbedre den.'],
         ['marketing', 'Marketing', 'Bruges til at vise relevante annoncer og måle vores kampagner.']]
};
const cookiesUrl = me?.dataset.cookies || '#', privacyUrl = me?.dataset.privacy || '#';

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 });

const read = () => { try { const c = JSON.parse(localStorage.getItem(KEY)); return c && Date.now() - new Date(c.t).getTime() < MAX_AGE ? c : null; } catch (e) { return null; } };
function apply(c) {
  gtag('consent', 'update', { analytics_storage: c.statistics ? 'granted' : 'denied', ad_storage: c.marketing ? 'granted' : 'denied', ad_user_data: c.marketing ? 'granted' : 'denied', ad_personalization: c.marketing ? 'granted' : 'denied' });
  dataLayer.push({ event: 'consent_update', consent_statistics: c.statistics, consent_marketing: c.marketing });
  document.dispatchEvent(new CustomEvent('hc-consent', { detail: c }));
}
function save(statistics, marketing) {
  const c = { v: 1, t: new Date().toISOString(), statistics, marketing };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
  apply(c); close();
}

let box;
function build() {
  box = document.createElement('section');
  box.className = 'cc'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'ccTitle'); box.setAttribute('aria-describedby', 'ccText');
  const cur = read() || { statistics: false, marketing: false };
  box.innerHTML = `
    <h2 id="ccTitle">${T.title}</h2>
    <p id="ccText">${T.text} <a href="${cookiesUrl}">${T.more}</a> · <a href="${privacyUrl}">${T.priv}</a></p>
    <div class="cc-cats" hidden>${T.cats.map(([k, n, d], i) => `
      <label class="cc-cat"><span><b>${n}</b><small>${d}</small></span>
        <input type="checkbox" data-k="${k}" ${i === 0 ? 'checked disabled' : (cur[k] ? 'checked' : '')}><i class="cc-sw" aria-hidden="true"></i></label>`).join('')}
    </div>
    <div class="cc-btns">
      <button type="button" class="cc-b" data-a="all">${T.all}</button>
      <button type="button" class="cc-b" data-a="nec">${T.nec}</button>
      <button type="button" class="cc-b ghost" data-a="custom">${T.custom}</button>
    </div>`;
  document.body.appendChild(box);
  box.addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'all') save(true, true);
    else if (a === 'nec') save(false, false);
    else if (a === 'custom') { box.querySelector('.cc-cats').hidden = false; e.target.dataset.a = 'save'; e.target.textContent = T.save; }
    else if (a === 'save') save(box.querySelector('[data-k="statistics"]').checked, box.querySelector('[data-k="marketing"]').checked);
  });
}
function open() { if (box) box.remove(); build(); document.documentElement.classList.add('cc-open'); requestAnimationFrame(() => box.classList.add('show')); box.querySelector('.cc-b')?.focus({ preventScroll: true }); }
function close() { if (!box) return; box.classList.remove('show'); document.documentElement.classList.remove('cc-open'); const b = box; setTimeout(() => b.remove(), 300); box = null; }

document.addEventListener('click', e => { if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); open(); } });
const existing = read();
if (existing) apply(existing); else setTimeout(open, 500);
window.hcConsent = { get: read, open };
})();
