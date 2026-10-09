/* Hot Cut AI assistant (English)
 * English twin of assistant.js. Answers from a knowledge base built from every page on hotcut.dk
 * (home, women's cuts, men's cuts, balayage, extensions, prices, contact).
 * In this mockup it runs entirely in the browser. For production, the same KB
 * becomes the grounding context for an LLM endpoint (see README note in the hand-off).
 */
(() => {
const BOOK = 'https://hotcut.bestilling.nu/';
const TEL = 'tel:+4597126060';
const MAPS = 'https://maps.google.com/?q=Hot+Cut+S%C3%B8ndergade+12+7400+Herning';

/* ---------- actions shown under an answer ---------- */
const A = {
  book: { label: 'See available times', href: BOOK, primary: true },
  consult: { label: 'Book a free consultation', href: BOOK, primary: true },
  call: { label: 'Call 97 12 60 60', href: TEL },
  prices: { label: 'See the full price list', href: '#priser' },
  map: { label: 'Directions', href: MAPS },
  mail: { label: 'Email info@hotcut.dk', href: 'mailto:info@hotcut.dk' },
};

/* ---------- live opening status (Europe/Copenhagen) ---------- */
const HOURS = { 1: ['09:00', '15:00'], 2: ['08:30', '17:00'], 3: ['08:30', '17:00'], 4: ['08:30', '19:00'], 5: ['08:30', '17:00'] };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function status() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m = (+p.hour % 24) * 60 + +p.minute;
  const mm = s => +s.slice(0, 2) * 60 + +s.slice(3), h = HOURS[d];
  if (h && m >= mm(h[0]) && m < mm(h[1])) return `We're <b>open right now</b> and close at ${h[1]}.`;
  for (let i = 0; i < 8; i++) {
    const nd = (d + i) % 7, nh = HOURS[nd];
    if (nh && (i > 0 || m < mm(nh[0]))) return `The salon is <b>closed right now</b> and opens ${i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'on ' + DAYS[nd]} at ${nh[0]}. Online booking is open around the clock.`;
  }
}
const hoursTable = `<table class="hc-t"><tr><td>Monday</td><td>09:00–15:00</td></tr><tr><td>Tuesday</td><td>08:30–17:00</td></tr><tr><td>Wednesday</td><td>08:30–17:00</td></tr><tr><td>Thursday</td><td>08:30–19:00</td></tr><tr><td>Friday</td><td>08:30–17:00</td></tr><tr><td>Sat–Sun</td><td>Closed</td></tr></table>`;

/* ---------- knowledge base (source: hotcut.dk, scanned Oct 2026) ----------
 * k: trigger words/phrases (English, lowercase). Phrases score higher than single words.
 */
const KB = [
  { id: 'wish', k: ["no time", "no times", "no slot", "no slots", "fully booked", "booked up", "nothing available", "can't find", "cannot find", "not available", "doesn't suit", "does not suit", "waiting list", "waitlist", "cancellation", "call me back", "contact me", "call me", "as soon as possible", "another time", "other times"], a: '' },
  { id: 'hours', k: ['opening hours', 'opening times', 'open', 'closed', 'close', 'when are you open', 'what time', 'hours', 'weekend', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'today', 'tomorrow', 'late opening', 'evening'],
    a: () => `${status()}${hoursTable}<small>Opening hours are indicative.</small>`, act: ['book', 'call'] },
  { id: 'address', k: ['address', 'where are you', 'where is the salon', 'where is hot cut', 'find you', 'location', 'located', 'søndergade', 'directions', 'how do i get there', 'city centre', 'city center', 'pedestrian street', 'map'],
    a: `You'll find us at <b>Søndergade 12, 7400 Herning</b>, in the centre of town. It's easy to combine with a stroll down the pedestrian street or a visit to a café.`, act: ['map', 'book'] },
  { id: 'parking', k: ['parking', 'car park', 'parking space', 'car'],
    a: () => { const P = window.HC_PARK, img = FAQ_SRC.replace(/faq-(da|en)\.js.*$/, 'parking-map-en.svg');
      if (!P || !FAQ_SRC) return `There is kerbside parking along Søndergade, the street you drive along to the salon, and a large car park just around the corner by Herning Library and the cinema. The station's underground car park is also a few minutes away. <a href="#parking">See the parking map</a> on the home or contact page, and check the signs for time limits.`;
      return `Here is where you can park near the salon:<a class="hc-map" href="${img}" target="_blank" rel="noopener"><img src="${img}" alt="Map of parking near Hot Cut"></a>`
        + '<ol class="hc-park">' + P.map(p => `<li><b>${p.n} · ${p.t}</b><small>${p.m ? '≈ ' + p.m + ' min walk' : 'Right by the salon'}</small><a href="https://www.google.com/maps/dir/?api=1&amp;destination=${p.lat},${p.lon}" target="_blank" rel="noopener">Directions ↗</a></li>`).join('') + '</ol>'
        + `<small class="hc-pnote">Tap the map to open it full size. Check the signs for time limits.</small>`; }, act: ['call', 'map'] },
  { id: 'contact', k: ['phone', 'phone number', 'telephone', 'number', 'call', 'ring', 'mail', 'email', 'e-mail', 'contact', 'get in touch', 'write'],
    a: `You can reach Hot Cut on:<br>📞 <b>97 12 60 60</b><br>✉️ <b>info@hotcut.dk</b><br>📍 Søndergade 12, 7400 Herning`, act: ['call', 'mail'] },
  { id: 'book', base: true, k: ['book', 'appointment', 'reserve', 'reservation', 'available', 'availability', 'time slot', 'free slot', 'online', 'schedule'],
    a: `You can <b>book online around the clock</b>, or call 97 12 60 60 and we'll find a time that suits you. If you want a cut and colour on the same day, book well ahead so we can set aside enough time.`, act: ['book', 'call'] },
  { id: 'cancel', k: ['cancel', 'cancellation', 'cancelling', 'reschedule', 'move my appointment', 'change my appointment', 'change my booking', 'move my booking', 'can t make it', 'can t come', 'no-show', 'sick', 'ill'],
    a: `The website doesn't describe a cancellation policy. Call the salon on 97 12 60 60 as soon as possible and they'll help you move or cancel your appointment.`, act: ['call'] },
  { id: 'payment', k: ['payment', 'pay', 'mobilepay', 'card', 'credit card', 'debit card', 'cash', 'dankort', 'invoice'],
    a: `The website doesn't say anything about payment options. Ask the salon on 97 12 60 60 and you'll get a reliable answer.`, act: ['call'] },
  { id: 'giftcard', k: ['gift card', 'giftcard', 'gift', 'gift voucher', 'gift certificate', 'present'],
    a: `Gift cards aren't mentioned on the website. Call the salon on 97 12 60 60 and they can tell you what they offer.`, act: ['call'] },
  { id: 'prices', base: true, k: ['price', 'prices', 'price list', 'cost', 'how much', 'what does it cost', 'cheap', 'expensive', 'kr', 'dkk', 'kroner', 'fee'],
    a: `A selection of our prices:<table class="hc-t"><tr><td>Women's cut incl. wash &amp; blow-dry</td><td>DKK 520</td></tr><tr><td>Men's cut</td><td>DKK 370</td></tr><tr><td>Children's cut</td><td>from DKK 240</td></tr><tr><td>Full colour</td><td>from DKK 650</td></tr><tr><td>Balayage incl. Olaplex</td><td>DKK 1,450</td></tr><tr><td>Extensions</td><td>from DKK 3,600</td></tr><tr><td>Bridal updo</td><td>DKK 1,600</td></tr></table>Ask about a specific treatment and I'll find the price.`, act: ['prices', 'book'] },
  { id: 'dameklip', k: ['women', 'woman', 'women s', 'women s cut', 'women s haircut', 'ladies', 'lady', 'ladies cut', 'haircut for women', 'fringe', 'bangs', 'wash and blow dry', 'wash and blow-dry', 'blow dry', 'blow-dry', 'blowdry', 'hair treatment', 'scalp massage', 'bob', 'layers', 'undercut'],
    a: `<b>A women's cut incl. wash and blow-dry is DKK 520.</b> Add-ons: fringe DKK 89, luxury hair treatment with scalp massage DKK 159 (with a cut). Wash/blow-dry only DKK 350, undercut DKK 200.<br><br>You always get free advice on cut, care and styling, and you're welcome to bring inspiration photos.`, act: ['book', 'prices'] },
  { id: 'damepris', k: ['why do women s cuts cost more', 'women s cut cost more', 'women s cuts cost more', 'why is a women s cut', 'more expensive than a men', 'women s cut more expensive', 'cost more than men'],
    a: `A women's cut costs more than a standard men's cut because it usually takes longer, involves more detailed cutting technique and more thorough styling. The women's cut includes a wash and blow-dry.`, act: ['book'] },
  { id: 'often', k: ['how often', 'how frequently', 'how long between', 'how many weeks', 'every week', 'weeks between', 'interval'],
    a: `As a rule, we recommend a cut <b>every 6–8 weeks</b> to keep your hair healthy and looking good. If you have long hair and want to keep the length, you can wait up to 12 weeks. For men it's also 6–8 weeks, and a fade often needs touching up a little more often.`, act: ['book'] },
  { id: 'herreklip', k: ['men', 'man', 'mens', 'men s', 'men s cut', 'men s haircut', 'gents', 'haircut for men', 'barber', 'fade', 'skin fade', 'crew cut', 'buzz cut', 'textured crop', 'side parting', 'side part', 'slick back', 'clipper cut', 'clippers'],
    a: `<b>A men's cut is DKK 370.</b> Men's cut “krans” DKK 310, clipper cut DKK 200, beard trim DKK 150.<br><br>We do everything from a classic side parting and crew cut to fades, textured crops and undercuts. Right now skin fades, mid fades and the classic slick back are among the most popular.`, act: ['book', 'prices'] },
  { id: 'herrestil', k: ['face shape', 'round face', 'square face', 'thin hair', 'fine hair men', 'long hair men', 'man bun', 'grow my hair', 'grow it out', 'grow out', 'long hair as a man', 'which hairstyle suits', 'what hairstyle suits', 'hairstyle suits me'],
    a: `A few rules of thumb from the salon:<br>• <b>Round face:</b> a fade or crew cut adds more definition.<br>• <b>Square face:</b> a classic side parting or longer hair with texture.<br>• <b>Thin hair:</b> a short crew cut or fade makes the hair look fuller; a textured crop adds volume.<br>• <b>Growing it long:</b> still get a cut every 8–12 weeks to prevent split ends, and get an in-between style along the way.<br><br>At your visit the hairdresser will advise you based on your hair and your everyday life, free of charge.`, act: ['book'] },
  { id: 'beard', k: ['beard', 'beard trim', 'trim my beard', 'shave', 'shaving', 'beard line', 'stubble'],
    a: `<b>A beard trim is DKK 150.</b> We offer a sharply defined beard line, a close shave or a symmetrical trim tailored to your face shape. Feel free to combine it with a men's cut (DKK 370).`, act: ['book'] },
  { id: 'kids', k: ['children', 'child', 'kids', 'kid', 'children s cut', 'kids cut', 'girls cut', 'boys cut', 'girl', 'boy', 'son', 'daughter', 'years old', 'teenager', 'toddler', 'baby'],
    a: `Children's prices:<table class="hc-t"><tr><td>Children's cut 0–3 years</td><td>DKK 240</td></tr><tr><td>Children's cut 4–8 years</td><td>DKK 290</td></tr><tr><td>Girls' cut 9–12 years</td><td>DKK 390</td></tr><tr><td>Boys' cut 9–12 years</td><td>DKK 310</td></tr></table>`, act: ['book'] },
  { id: 'color', k: ['colour', 'color', 'dye', 'dye my hair', 'hair colour', 'hair color', 'full colour', 'full color', 'root colour', 'root color', 'roots', 'regrowth', 'grey hair', 'gray hair', 'highlights', 'lowlights', 'foils', 'cap highlights', 'lightening', 'lighter'],
    a: `Colour prices (medium and long hair include Olaplex):<table class="hc-t"><tr><td>Full colour short/medium/long</td><td>DKK 650/1,050/1,200</td></tr><tr><td>Root colour / long hair</td><td>DKK 650/750</td></tr><tr><td>Full colour w. highlights</td><td>DKK 800–1,600</td></tr><tr><td>Foil highlights</td><td>DKK 800–1,400</td></tr><tr><td>Highlights along the parting</td><td>DKK 950</td></tr><tr><td>Cap highlights</td><td>DKK 800</td></tr><tr><td>10-min. colour, men</td><td>DKK 250</td></tr></table>You can easily have a cut and colour on the same day.`, act: ['book', 'prices'] },
  { id: 'balayage', k: ['balayage', 'toning', 'sun-kissed', 'sunkissed', 'sun kissed', 'natural colour', 'natural color', 'soft transitions', 'soft blend'],
    a: `<b>Balayage is DKK 1,450</b> and <b>DKK 1,900 with toning</b>, both incl. Olaplex.<br><br>Balayage lightens the hair with soft transitions, so the colour blends with your own and grows out more softly. Toning adjusts the tone (cooler, warmer, more beige), and whether you need it depends on your hair and the shade you want.`, act: ['book', 'call'] },
  { id: 'babylights', k: ['babylights', 'baby lights', 'difference', 'difference between', 'balayage or', 'which colour treatment', 'which color treatment', 'versus', 'vs'],
    a: `In short:<br>• <b>Balayage</b>: a soft, natural, sun-kissed look with less noticeable regrowth (DKK 1,450).<br>• <b>Babylights</b>: very fine light strands that give a detailed, bright play of colour (DKK 1,800, DKK 2,250 w. toning).<br>• <b>Highlights</b>: more classic light or dark effects.<br>• <b>Full colour</b>: a more even colour throughout the hair.<br><br>Start from the result you want. The hairdresser will advise you based on your hair's colour, condition and length.`, act: ['book'] },
  { id: 'balayage-time', k: ['how long does', 'how long will', 'how much time', 'duration', 'treatment time', 'maintain balayage', 'maintain my balayage', 'maintenance', 'maintain colour', 'maintain color', 'look after my colour'],
    a: `A balayage usually takes longer than a regular colour treatment, because the technique requires precision. The exact time depends on your hair's length, thickness and starting point, so feel free to call if you need to know.<br><br>Upkeep: use good care products, protect your hair from drying out and follow the hairdresser's advice on when to refresh the colour.`, act: ['call', 'book'] },
  { id: 'ext', base: true, k: ['extensions', 'hairtalk extensions', 'tape', 'tape extensions', 'tape-in', 'tape in', 'hair extensions', 'longer hair', 'fuller hair', 'thicker hair', 'more volume', 'remy', 'real hair', 'human hair'],
    a: `We work with <b>Hairtalk tape extensions</b> made from 100% real Remy hair, in lengths from 25 to 55 cm. <b>Treatment starts from DKK 3,600.</b><br><br>The bonds lie flat against the head, and no heat is used when fitting them. Start with a <b>free consultation</b>, where we look at your hair, find the colour, length and amount, and give you a specific price.`, act: ['consult', 'call'] },
  { id: 'ext-hold', k: ['how long do extensions last', 'how long do they last', 'does it last', 'do they last', 'last', 'move up', 'moved up', 'moving up', 'refit', 'reposition', 'reuse', 'reused', 'replace'],
    a: `Tape extensions usually need to be <b>moved up after 6–8 weeks</b>, because your own hair grows. When moving them up, we take them out, apply new tape and place them closer to the scalp again. The extension hair itself can often be <b>reused several times</b> if it's in good condition and looked after properly.`, act: ['consult'] },
  { id: 'ext-harm', k: ['damage', 'damaging', 'harm', 'harmful', 'ruin', 'strain', 'gentle', 'safe', 'dangerous'],
    a: `Fitted and maintained correctly, tape extensions are gentle, and Hairtalk is known as one of the gentlest systems. Too much extra hair, badly placed bonds or moving them up too late can, however, strain your own hair. That's why we assess your hair before the treatment.`, act: ['consult'] },
  { id: 'ext-care', k: ['care for extensions', 'look after extensions', 'how do i care', 'style', 'straightener', 'curling iron', 'curling tong', 'heat', 'hair dryer', 'blow dryer', 'conditioner', 'hair oil', 'wash extensions', 'washing extensions'],
    a: `Caring for tape extensions:<br>• Brush gently and use products suitable for extensions.<br>• Conditioner and hair oil on the lengths, <b>not on the tape bonds</b>.<br>• Dry your hair thoroughly at the bonds after washing.<br>• You can style with a hair dryer, straightener and curling iron, but use heat protection and avoid direct heat on the bonds.`, act: ['consult'] },
  { id: 'ext-color', k: ['colour extensions', 'color extensions', 'dye extensions', 'dyed extensions', 'coloured extensions', 'colored extensions', 'blonde extensions', 'light extensions', 'extensions be coloured', 'extensions be colored', 'extensions be dyed', 'colour my extensions', 'color my extensions', 'dye my extensions'],
    a: `We recommend finding the right shade together before fitting rather than colouring the extension hair afterwards. Hairtalk advises against permanent colouring and lightening of tape extensions. If you want a different colour later, we'll help you assess the options.`, act: ['consult'] },
  { id: 'ext-fine', k: ['fine hair', 'thin hair extensions', 'suit extensions', 'extensions suit', 'suitable', 'right for me'],
    a: `Yes, tape extensions can also suit <b>fine hair</b>, because they are ultra-thin and almost invisible. The amount of extra hair and the placement of the bonds just need to match your own hair, and we assess that together at a free consultation.`, act: ['consult'] },
  { id: 'clipon', k: ['clip-on', 'clip on', 'clip-in', 'clip in', 'clips', 'temporary', 'take off myself', 'remove myself'],
    a: `If you prefer something flexible, <b>clip-on extensions and hairbands</b> are a good choice. They're easy to use at home, perfect for a party or a temporary look, and add volume and length in minutes.`, act: ['consult', 'call'] },
  { id: 'keratin', k: ['keratin', 'keratin treatment', 'straight hair', 'smooth', 'frizz', 'frizzy'],
    a: `<b>Keratin treatment:</b> medium hair DKK 2,000, long hair DKK 2,800.`, act: ['book', 'call'] },
  { id: 'perm', k: ['perm', 'permanent', 'permanent wave', 'perm curls'],
    a: `<b>Perm incl. cut:</b> short hair DKK 1,400, medium DKK 1,500, long DKK 1,600.`, act: ['book'] },
  { id: 'updo', k: ['updo', 'up-do', 'hair up', 'wedding', 'bride', 'bridal', 'bridal hair', 'confirmation', 'party', 'party hair', 'gala', 'trial updo', 'trial', 'special occasion', 'prom', 'event styling'],
    a: `Updos for weddings, confirmations and parties:<table class="hc-t"><tr><td>Updo small / large</td><td>DKK 500 / 750</td></tr><tr><td>Bridal updo</td><td>DKK 1,600</td></tr><tr><td>Trial updo</td><td>DKK 500</td></tr><tr><td>Confirmation updo</td><td>DKK 750</td></tr></table>Feel free to contact us for a consultation, where we plan your look together.`, act: ['book', 'call'] },
  { id: 'makeup', k: ['makeup', 'make-up', 'make up', 'cosmetics'],
    a: `We offer professional <b>makeup: small DKK 300, large DKK 600</b>. Perfect together with an updo for a wedding or party.`, act: ['book'] },
  { id: 'brows', k: ['brows', 'eyebrows', 'lashes', 'eyelashes', 'brow lift', 'brow lamination', 'lash lift', 'lash tint', 'brow tint', 'tint', 'wax', 'tweezers', 'tweezing'],
    a: `Brows and lashes:<table class="hc-t"><tr><td>Brow shaping (wax/tweezers)</td><td>DKK 100</td></tr><tr><td>Brow tint</td><td>DKK 100</td></tr><tr><td>Lash tint</td><td>DKK 150</td></tr><tr><td>Package: brows &amp; lashes tinted and shaped</td><td>DKK 300</td></tr><tr><td>Brow lamination without / with tint</td><td>DKK 450 / 500</td></tr></table>Lash lift is also available. The price isn't on the price list, so call to ask.`, act: ['book', 'call'] },
  { id: 'analysis', k: ['analysis', 'hair analysis', 'scalp analysis', 'analyse', 'analyze', 'voucher', 'product discount', 'discount on products', 'scalp', 'hair loss', 'losing hair', 'dandruff', 'dry hair', 'dry scalp', 'greasy', 'oily', 'itchy', 'itching', 'scanner', 'microscope', 'camera', 'machine', 'equipment', 'examine my hair', 'what does my hair need'],
    a: `We offer <b>hair and scalp analysis</b> with our special analysis equipment. A handheld camera with powerful magnification shows your scalp and hair strands on a screen, so you can see them for yourself. We explain what we see and give you specific advice on treatment and care. <br><br><b>The price is DKK 100</b>, and if you buy products for DKK 400, the DKK 100 is deducted. That's equivalent to a 25% discount on the products. The analysis can be combined with a haircut.`, act: [{ label: 'Book analysis', href: BOOK, primary: true }, 'call'] },
  { id: 'brands', k: ['right product', 'the right product', 'brands', 'which products', 'what products', 'which brands', 'what brands', 'products do you sell', 'products do you have', 'what do you sell', 'product range'],
    a: `We use and sell professional products from six brands:<br>• <b>Olaplex</b>: rebuilds hair after colour, heat and sun<br>• <b>Roze Avenue</b>: Nordic hair care, dry shampoo and self-tan<br>• <b>Sanzi Beauty</b>: lash and brow serum, mascara and lip products<br>• <b>Hairtalk</b>: extensions and the Hairband<br>• <b>ghd</b>: straighteners, hairdryers and curling tongs<br>• <b>idHAIR</b>: the hair colours we use<br><br>Feel free to ask me about a specific brand or product.<br><br>Tip: a hair analysis costs DKK 100, and the amount is deducted when you buy products for DKK 400.`, act: [{ label: 'See the products', href: '#produkter' }, 'call'] },
  { id: 'olaplex', k: ['olaplex', 'bond repair', 'bond', 'no.3', 'no3', 'hair perfector', 'no.4', 'bond maintenance', '4p', 'no.4p', 'purple shampoo', 'silver shampoo', 'yellow tones', 'yellow hair', 'brassy', 'brassiness', '4c', 'no.4c', 'clarifying', 'deep cleansing', 'no.7', 'oil', 'hair oil', 'bonding oil'],
    a: `<b>Olaplex</b> rebuilds the bonds in the hair that colouring, heat and sun break down. Olaplex is included in our colour treatments on medium and long hair. For use at home we have:<br>• <b>No.3 Hair Perfector</b>: a treatment applied to damp hair <i>before</i> shampoo and left on for at least 10 minutes.<br>• <b>No.4 Bond Maintenance</b>: a nourishing shampoo for all hair types.<br>• <b>No.4P Blonde Enhancer</b>: a purple toning shampoo that removes yellow and brassy tones in light hair.<br>• <b>No.4C Clarifying</b>: a deep-cleansing shampoo against product build-up, e.g. once a week.<br>• <b>The oil (No.7 Bonding Oil)</b>: shine and heat protection.<br><br>Ask us in the salon which combination suits your hair.`, act: [{ label: 'Olaplex.com', href: 'https://olaplex.com/' }, 'call'] },
  { id: 'roze', k: ['roze avenue', 'roze', 'dry shampoo', 'volumizing', 'volumising', 'brown covering', 'luxury restore', 'restore masq', 'hair mask', 'self tanner', 'self-tanner', 'self tan', 'tanning drops', 'glow collection', 'mousse', 'money masque'],
    a: `<b>Roze Avenue</b> is a Nordic brand created by stylists, and all its products are 100% vegan and cruelty free. With us you'll find:<br>• <b>Dry shampoo</b>: Glamorous Volumizing adds freshness and volume, and Brown Covering is tinted for dark hair.<br>• <b>Luxury Restore Masq</b>: a nourishing hair mask.<br>• <b>Glow Collection</b>: self tanner as drops and as an instant mousse.<br><br>Ask in the salon what we have on the shelf right now.`, act: [{ label: 'Rozeavenue.com', href: 'https://rozeavenue.com/' }, 'call'] },
  { id: 'sanzi', k: ['sanzi', 'sanzi beauty', 'lash serum', 'eyelash serum', 'lash growth', 'longer lashes', 'brow serum', 'eyebrow serum', 'mascara', 'lip', 'lips', 'powder', 'vegan makeup'],
    a: `<b>Sanzi Beauty</b> is a Danish brand of vegan products without added perfume or essential oils. We've been a stockist since 2025.<br>• <b>Lash serum</b>: strengthens the lashes and promotes natural growth. Used daily; the first results are typically seen after 6–8 weeks, the full results after about 16 weeks.<br>• <b>Brow serum, mascara, lip products and powder</b>.<br><br>The serum is free of parabens and hormones.`, act: [{ label: 'Sanzi-beauty.com', href: 'https://www.sanzi-beauty.com/' }, 'call'] },
  { id: 'hairband', k: ['hairband', 'hair band', 'halo', 'halo extensions', 'band extensions', 'no glue', 'without glue', 'without clips', 'wire'],
    a: `<b>Hairtalk Hairband</b> is extensions made from 100% real Remy hair on an invisible, elastic band that adapts to your head. No glue, tape or clips. The band is placed a few centimetres behind the hairline, your own hair is laid over it, and then you brush it together. It takes under five minutes, and you take it off again yourself.<br><br>Perfect for a party, or if you want more volume without permanent extensions.`, act: ['consult', 'call'] },
  { id: 'ghd', k: ['ghd', 'sell hair dryers', 'sell straighteners', 'sell curling irons', 'buy a hair dryer', 'buy a straightener', 'buy a curling iron', 'do you have hair dryers', 'do you have straighteners', 'straightener', 'flat iron', 'styler', 'hair dryer', 'hairdryer', 'curling iron', 'curling wand', 'styling tools'],
    a: `<b>ghd</b> is a British brand known for straighteners, hair dryers and curling irons. Their straighteners hold an even temperature of 185 °C, a good balance between styling and gentleness. You'll find ghd on the product wall in the salon, and we're happy to help you choose the right tool for your hair.<br><br>Remember heat protection, and avoid direct heat on the tape bonds if you have extensions.`, act: [{ label: 'Ghdhair.com', href: 'https://www.ghdhair.com/' }, 'call'] },
  { id: 'idhair', k: ['idhair', 'id hair', 'hair paint', 'gloss', 'toner', 'gloss toner', 'colour bomb', 'color bomb', 'colour conditioner', 'color conditioner', 'hp'],
    a: `<b>idHAIR</b> is a Danish brand of professional hair colours, and it's what we colour with:<br>• <b>Hair Paint</b>: permanent colour with a creamy, long-lasting formula.<br>• <b>Gloss</b>: demi-permanent toner for toning, colour correction and shine in about 20 minutes.<br>• <b>Colour Bomb</b>: a colour conditioner that nourishes and refreshes your colour between visits.`, act: ['book', { label: 'Idhair.dk', href: 'https://idhair.dk/' }] },
  { id: 'advice', k: ['advice', 'free advice', 'guidance', 'consultation', 'consult', 'no obligation', 'unsure', 'not sure', 'inspiration', 'picture', 'pictures', 'photo', 'which hairstyle', 'suit me', 'short or long', 'new hairstyle', 'new look'],
    a: `You always get <b>free advice</b>. We start from your face shape, hair type and style, and you're welcome to bring inspiration photos. You can also just drop by the salon for a no-obligation chat.`, act: ['book', 'call'] },
  { id: 'texture', k: ['curls', 'curly', 'wavy', 'waves', 'natural fall', 'texture', 'straight'],
    a: `Yes. We tailor the cut so it works with your natural hair, whether it's straight, wavy or curly. That way you get a hairstyle that looks great both styled and natural.`, act: ['book'] },
  { id: 'styling', k: ['styling', 'styling tips', 'volume', 'products for', 'style my hair'],
    a: `After the cut we show you how to achieve, for example, a sleek look, soft waves or extra volume with the right products and techniques. A good hairstyle should be easy to style day to day.`, act: ['book'] },
  { id: 'combo', k: ['cut and colour', 'cut and color', 'same visit', 'same day', 'combine', 'at the same time'],
    a: `Yes, many people combine a women's cut with colour, balayage or highlights in the same visit. Book well ahead so we can set aside the time needed.`, act: ['book'] },
  { id: 'products', k: ['products', 'ammonia', 'silicone', 'silicones', 'parabens', 'sulphates', 'sulfates', 'allergy', 'allergic', 'organic', 'gentle products', 'chemicals', 'ingredients'],
    a: `We work with carefully selected products <b>free of ammonia, silicone, parabens and sulphates</b>, so the result is gentle on your hair. Colour treatments on medium and long hair include Olaplex. If you have a specific allergy, call and talk to the hairdresser before your appointment.`, act: ['call', 'book'] },
  { id: 'team', k: ['who', 'hairdressers', 'stylists', 'staff', 'team', 'heidi', 'anna', 'karina', 'owner', 'employees', 'who works'],
    a: `The team at Hot Cut:<br>• <b>Heidi Møller</b>, hairdresser and owner<br>• <b>Anna Sand Daasbjerg</b>, hairdresser<br>• <b>Karina Andreasen</b>, hairdresser<br><br>They all have many years of experience, and customers especially praise being remembered from one visit to the next.`, act: ['book'] },
  { id: 'reviews', k: ['reviews', 'stars', 'rating', 'ratings', 'trustpilot', 'google', 'good hairdresser', 'best hairdresser', 'satisfied', 'recommend'],
    a: `Hot Cut has <b>4.6 ★ based on 69 reviews</b>. Tina, for example, writes: <i>“Heidi is fantastic at remembering who you are and what you're about … 5 big stars from me.”</i> (translated from Danish)`, act: ['book'] },
  { id: 'everyone', k: ['everyone', 'everybody', 'gender', 'age', 'elderly', 'non-binary', 'men and women', 'unisex'],
    a: `Our doors are open to everyone, regardless of gender, age or style. We cut women's, men's and children's hair.`, act: ['book'] },
  { id: 'social', k: ['instagram', 'facebook', 'social media', 'pictures of your work', 'cvr', 'company number'],
    a: `Follow along on Instagram <b>@hotcutherning</b> and Facebook <b>hotcutherning</b>. CVR (company no.): 33245041.`, act: [{ label: 'Instagram', href: 'https://www.instagram.com/hotcutherning/' }, 'book'] },
  { id: 'bot', k: ['who are you', 'are you a robot', 'are you ai', 'are you an ai', 'human', 'chatbot', 'bot', 'what can you do'],
    a: `I'm Hot Cut's AI assistant. I answer based on the information on hotcut.dk: prices, treatments, opening hours, extensions, colour and much more. I can't see the calendar, so the booking itself happens online or by phone.`, act: ['book'] },
  { id: 'hello', k: ['hi', 'hello', 'hey', 'hiya', 'good morning', 'good afternoon', 'howdy'],
    a: `Hi! 👋 What can I help you with? Ask about prices, opening hours or extensions, for example.`, act: [] },
  { id: 'thanks', k: ['thanks', 'thank you', 'thx', 'many thanks', 'perfect', 'cheers', 'awesome'],
    a: `You're welcome! We look forward to seeing you in the salon. ✂️`, act: ['book'] },
];
/* ---------- FAQ fallback: the full FAQ (assets/faq-en.js, 91 answers) covers what the topics above don't ---------- */
const FAQ_SRC = ((document.currentScript && document.currentScript.src) || '').replace(/assistant(-en)?\.js.*$/, 'assets/faq-en.js');
if (FAQ_SRC && !window.HC_FAQ) { const sc = document.createElement('script'); sc.src = FAQ_SRC; sc.async = true; document.head.appendChild(sc); }
const FAQ_STOP = new Set('i you we the a an is are do does to and or on in at for of about what where how when who which can i my your have has it that this there not also so will should get me'.split(' '));
const PRODUCT_IDS = new Set(['brands', 'olaplex', 'roze', 'sanzi', 'hairband', 'ghd', 'idhair', 'clipon']);
const SHOP_NOTE = `<br><br><b>Drop by the salon</b> at Søndergade 12 and we will show you the products on our product wall and find what suits your hair. To check whether a product is in stock, or what it costs, call +45 97 12 60 60.`;
const FALLBACK = { a: `Unfortunately I can't answer that reliably from the website. Call the salon on <b>97 12 60 60</b> or write to info@hotcut.dk and you'll get an accurate answer.`, act: ['call', 'mail'] };
const CHIPS = ["Can't find a time?", 'Prices', 'Opening hours', 'Book a time', 'Hair analysis', 'Which products do you sell?', 'Extensions', 'Balayage', 'Men\'s cut', 'Where are you?', 'Where can I park?'];

/* ---------- matching ---------- */
const norm = s => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
const stem = w => w.length > 4 ? w.replace(/(ing|ies|es|s|ed)$/, '') : w;
// common English words that must not trigger a prefix match ("make" -> "makeup", "hair" -> "hairband")
const STOP = new Set(['what', 'when', 'where', 'which', 'have', 'does', 'make', 'much', 'long', 'with', 'your', 'there', 'about', 'would', 'like', 'want', 'need', 'take', 'this', 'that', 'from', 'they', 'them', 'tell', 'know', 'help', 'will', 'some', 'more', 'many', 'also', 'just', 'then', 'than', 'here', 'could', 'should', 'been', 'were', 'hair', 'good', 'very', 'into', 'over', 'cost']);
function faqMatch(q) {
  const list = window.HC_FAQ; if (!list) return null;
  const words = s => norm(s).split(' ').filter(w => w.length > 2 && !FAQ_STOP.has(w)).map(stem);
  const qt = [...new Set(words(q))]; if (!qt.length) return null;
  let best = null;
  for (const it of list) {
    const qw = it._q || (it._q = words(it.q)), aw = it._a || (it._a = new Set(words(it.a)));
    let sc = 0, hit = 0;
    for (const w of qt) {
      if (qw.includes(w)) { sc += 3; hit++; }
      else if (w.length >= 4 && qw.some(x => x.length >= 4 && (x.startsWith(w) || w.startsWith(x)))) { sc += 2; hit++; }
      else if (aw.has(w)) sc += 1;
    }
    if (hit / qt.length >= .5 && (!best || sc > best.sc)) best = { sc, it, cov: hit / qt.length };
  }
  return best && best.sc >= 4 ? best : null;
}
const esc = t => t.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

/* ---------- price guard ----------
   The assistant only repeats single prices exactly as the price list shows them.
   It never adds prices together or estimates a price for someone's own hair:
   combinations, totals and individual colour work always go to the salon. */
const Q_PRICE = /(?<!\p{L})(price|prices|priced|cost|costs|how much|dkk|kr|pay|charge|quote|estimate|total|altogether|in total)(?!\p{L})/u;
const Q_TOTAL = /(?<!\p{L})(total|altogether|in total|combined|combination|package price|all together|plus)(?!\p{L})/u;
const Q_OWN = /(?<!\p{L})(my hair|my colour|my color|my long|my short|my thick|my thin|my grey|my gray|thick hair|thin hair|lots of hair|from black|from dark|dark hair|grey hair|gray hair|colour correction|color correction|change colour|change color|go lighter|go blonde|platinum)(?!\p{L})/u;
// each service maps to a family; a question that names two families asks for a combination
const Q_SERVICES = { cut: 'cut', haircut: 'cut', women: 'women', womens: 'women', fringe: 'women', bangs: 'women', undercut: 'women', treatment: 'women',
  men: 'men', mens: 'men', clipper: 'men', beard: 'men', children: 'kids', kids: 'kids', child: 'kids', girls: 'kids', boys: 'kids',
  colour: 'colour', color: 'colour', highlights: 'colour', balayage: 'colour', babylights: 'colour', roots: 'colour', extension: 'ext', hairband: 'ext',
  keratin: 'keratin', perm: 'perm', updo: 'updo', bridal: 'updo', wedding: 'updo', confirmation: 'updo', trial: 'updo', 'make-up': 'makeup', makeup: 'makeup',
  brow: 'brow', brows: 'brow', eyebrow: 'brow', lash: 'brow', lashes: 'brow', analysis: 'analysis' };
const QUOTE = { id: 'quote', a: `I can show you the fixed prices from the price list, but I can't give a <b>combined price for several treatments</b> or a price tailored to your hair here. It depends on your hair and what needs doing.<br><br>Call the salon on <b>97 12 60 60</b> or write to info@hotcut.dk and you'll get a concrete price. Advice is free.`, act: ['call', 'mail', 'prices'] };
function needsQuote(q) {
  const t = ' ' + norm(q) + ' ';
  if (!Q_PRICE.test(t)) return false;
  const terms = Object.keys(Q_SERVICES).filter(s => new RegExp('(?<!\\p{L})' + norm(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\p{L})', 'u').test(t));
  const fam = new Set(terms.map(s => Q_SERVICES[s]));
  // the generic word "cut" next to "women's"/"men's"/"children's" names one service, not two
  if (fam.has('cut') && (fam.has('women') || fam.has('men') || fam.has('kids'))) fam.delete('cut');
  // two add-ons inside one family ("men's cut and beard") are a combination too; colour and brow terms describe one listed service
  const own = terms.filter(s => !['colour', 'brow', 'cut'].includes(Q_SERVICES[s]));
  const sameFamilyCombo = new Set(own).size >= 2;
  return fam.size >= 2 || sameFamilyCombo || Q_TOTAL.test(t) || (fam.size >= 1 && Q_OWN.test(t));
}

function answer(q) {
  if (needsQuote(q)) return QUOTE;
  const t = ' ' + norm(q) + ' ', toks = norm(q).split(' ').filter(Boolean).map(stem);
  const scored = KB.map(e => {
    let sc = 0;
    for (const raw of e.k) {
      const k = norm(raw);
      if (k.includes(' ')) { if (t.includes(' ' + k)) sc += 3 + k.split(' ').length; }
      else {
        const ks = stem(k);
        if (toks.includes(ks) || toks.includes(k)) sc += 3;
        else if (ks.length >= 4 && toks.some(w => w.length >= 4 && !STOP.has(w) && (w.startsWith(ks) || ks.startsWith(w)))) sc += 2;
      }
    }
    return { e, sc };
  }).filter(x => x.sc >= 2).sort((a, b) => b.sc - a.sc);
  const fq = faqMatch(q), faqE = fq && { id: 'faq', a: esc(fq.it.a), act: ['book'] };
  // the topics above win; the FAQ answers when nothing matched, or when it matches clearly better than a weak, generic topic
  if (!scored.length) return faqE || FALLBACK;
  if (faqE && scored[0].sc <= 3 && fq.sc >= scored[0].sc + 3) return faqE;
  // a precise question ("kan I dække grå hår?") gets the precise FAQ answer rather than a topic overview; price questions keep the price lists
  if (faqE && fq.cov === 1 && fq.sc >= 6 && !/\b(cost|costs|price|prices|much)\b/.test(norm(q))) return faqE;
  // generic topics (prices, extensions, booking) give way to a specific answer when one matched
  const specific = scored.find(x => !x.e.base);
  const topic = scored.find(x => x.e.id !== 'prices');           // e.g. "how much are extensions" -> extensions
  return (specific || topic || scored[0]).e;
}

/* ---------- UI ---------- */
const ICON = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7.5A3.5 3.5 0 0 1 9.5 4h13A3.5 3.5 0 0 1 26 7.5v10a3.5 3.5 0 0 1-3.5 3.5H14l-5.5 5v-5h-1A1.5 1.5 0 0 1 6 19.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="15.2" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="9.8" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M13.6 14 21 9.2M13.6 11 21 15.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M25.5 1.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="currentColor"/></svg>`;
const root = document.createElement('div');
root.className = 'hc-chat';
root.innerHTML = `
  <button class="hc-fab" aria-label="Open Hot Cut AI assistant" aria-expanded="false" aria-controls="hcPanel">${ICON}<span class="hc-fab-l"><b>AI assistant</b><small>Replies 24/7</small></span><span class="hc-badge">1</span></button>
  <div class="hc-bubble" hidden>
    <div class="hc-btop"><button class="hc-bopen" type="button" aria-label="Open Hot Cut AI assistant"><b>Hi, I'm your AI assistant 👋</b><small>I'm here 24/7 if you have questions</small></button>
    <button class="hc-bx" type="button" aria-label="Close">✕</button></div>
    <div class="hc-bq"></div>
  </div>
  <section class="hc-panel" id="hcPanel" role="dialog" aria-label="Hot Cut AI assistant" hidden>
    <div class="hc-head">
      <div class="hc-ava">${ICON}</div>
      <div><b>Hot Cut AI assistant</b><small><i></i>Replies instantly</small></div>
      <button class="hc-x" aria-label="Close chat">✕</button>
    </div>
    <div class="hc-log" aria-live="polite" data-lenis-prevent></div>
    <div class="hc-chips" data-lenis-prevent></div>
    <form class="hc-form"><input type="text" placeholder="Type or speak …" aria-label="Type your question" autocomplete="off" maxlength="300"><button type="button" class="hc-mic" aria-label="Ask your question by voice" aria-pressed="false" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></g></svg></button><button class="hc-send" aria-label="Send">➤</button></form>
    <p class="hc-note">AI assistant · answers based on hotcut.dk · if in doubt: call 97 12 60 60</p>
  </section>`;
document.body.appendChild(root);
const fab = root.querySelector('.hc-fab'), panel = root.querySelector('.hc-panel'), log = root.querySelector('.hc-log'),
      chips = root.querySelector('.hc-chips'), form = root.querySelector('.hc-form'), input = form.querySelector('input'), greet = root.querySelector('.hc-bubble');
const track = (ev, extra = {}) => (window.dataLayer = window.dataLayer || []).push({ event: ev, ...extra });

function bubble(html, who, actions = []) {
  const m = document.createElement('div'); m.className = 'hc-msg ' + who; m.innerHTML = html;
  if (actions.length) {
    const r = document.createElement('div'); r.className = 'hc-acts';
    actions.map(a => typeof a === 'string' ? A[a] : a).forEach(a => {
      const l = document.createElement('a'); l.href = a.href; l.textContent = a.label; if (a.primary) l.className = 'p';
      if (/^https?:/.test(a.href)) { l.target = '_blank'; l.rel = 'noopener'; }
      l.addEventListener('click', () => { track('cta_click', { cta_id: 'chat-' + a.label, cta_type: a.href.startsWith('tel:') ? 'call' : a.href.includes('bestilling') ? 'booking' : 'other' }); if (a.href.startsWith('#')) toggle(false); });
      r.appendChild(l);
    });
    m.appendChild(r);
  }
  log.appendChild(m);
  // long answers (e.g. the parking map) start at their top; short ones just scroll to the end
  const top = m.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop;   // position inside the scrolling log
  log.scrollTop = who === 'bot' && m.offsetHeight > log.clientHeight * .7 ? top - 8 : log.scrollHeight;
}
function reply(q, spoken = false) {
  bubble(q.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])), 'me');
  spokeLast = spoken;
  if (wish) { wishStep(q); return; }                                // inside the wish-time flow every answer goes there
  if (q === WL.chip || answer(q).id === 'wish') { startWish(); return; }
  const typing = document.createElement('div'); typing.className = 'hc-msg bot hc-typing'; typing.innerHTML = '<i></i><i></i><i></i>';
  log.appendChild(typing); log.scrollTop = log.scrollHeight;
  const e = answer(q);
  track('chat_question', { chat_intent: e.id || 'fallback' });
  setTimeout(() => {
    typing.remove(); let html = typeof e.a === 'function' ? e.a() : e.a, act = e.act || [];
    if (PRODUCT_IDS.has(e.id)) {                          // products: short intro, then point people to the salon for advice, stock and prices
      html += SHOP_NOTE;
      act = [...act.filter(x => x !== 'map' && x !== 'call'), 'map', 'call'];
    }
    bubble(html, 'bot', act);
    if (spoken) speak(html);                                        // answer out loud when the question was spoken
  }, 550 + Math.random() * 400);
}
/* ---------- voice: speak the question (English), hear the answer ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = form.querySelector('.hc-mic');
let rec = null, listening = false;
function toSpeech(html) {                                          // tables/links read badly; keep it to the prose
  const d = document.createElement('div'); d.innerHTML = html;
  d.querySelectorAll('table').forEach(t => t.replaceWith('. ' + [...t.rows].map(r => [...r.cells].map(c => c.textContent).join(': ')).join('. ') + '. '));
  return d.textContent.replace(/[📞✉️📍👋✂️]/gu, '').replace(/\s+/g, ' ').replace(/(\d),(\d{3})/g, '$1$2').trim();
}
function speak(html) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(toSpeech(html)); u.lang = 'en-GB'; u.rate = 1.02;
  const v = speechSynthesis.getVoices().find(v => /^en/i.test(v.lang)); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function setListening(on) {
  listening = on; mic.classList.toggle('on', on); mic.setAttribute('aria-pressed', on);
  input.placeholder = on ? 'Listening …' : 'Type or speak …';
}
if (SR) {
  mic.hidden = false;
  mic.addEventListener('click', () => {
    if (listening) { rec && rec.stop(); return; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    rec = new SR(); rec.lang = 'en-GB'; rec.interimResults = true; rec.maxAlternatives = 1;
    let finalText = '';
    rec.onresult = ev => {
      let interim = '';
      for (const r of ev.results) (r.isFinal ? (finalText = r[0].transcript) : (interim += r[0].transcript));
      input.value = finalText || interim;
    };
    rec.onerror = ev => { setListening(false); if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') bubble('I can\'t use the microphone. Allow microphone access in your browser, or type your question.', 'bot'); };
    rec.onend = () => { setListening(false); const q = input.value.trim(); if (q) { input.value = ''; track('chat_voice'); reply(q, true); } };
    setListening(true); rec.start();
  });
}

CHIPS.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => reply(c); chips.appendChild(b); });
form.addEventListener('submit', ev => { ev.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = ''; reply(q); });

let greeted = false;
function toggle(open) {
  panel.hidden = !open; fab.setAttribute('aria-expanded', open); root.classList.toggle('open', open);
  if (!open) { rec && listening && rec.stop(); 'speechSynthesis' in window && speechSynthesis.cancel(); }
  hideGreet(); fab.querySelector('.hc-badge').style.display = 'none';
  document.documentElement.classList.toggle('hc-lock', open && innerWidth <= 760);
  document.documentElement.classList.toggle('chat-open', open);
  if (open && !greeted) {
    greeted = true; track('chat_open');
    bubble(`Hi! 👋 I'm <b>Hot Cut's AI assistant</b> and I'm here to help you, around the clock. You can ask about prices, treatments or opening hours, for example.<br><span class="hc-live">${status()}</span>`, 'bot');
  }
  if (open && innerWidth > 760) setTimeout(() => input.focus(), 50);
}
fab.addEventListener('click', () => toggle(panel.hidden));
root.querySelector('.hc-x').addEventListener('click', () => toggle(false));
addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
/* bubble rhythm (desktop): a short welcome with quick questions on arrival, then small one-line questions now and then */
const QSETS = [
  ['How much is a women\'s cut?', 'When are you open?', 'Which products do you sell?'],
  ['How much is balayage?', 'What is a hair analysis?', 'Where are you?'],
  ['How much are extensions?', 'Do you do bridal hair?', 'How much is a men\'s cut?'],
];
const PINGS = ['Considering extensions?', "How much is a women's cut?", 'Wedding or confirmation coming up?', 'Tried our hair analysis?', 'Dreaming of balayage?', 'Looking for the right product?', 'When are you open?'];
const PING_SUB = "Tap and I'll answer right away";
const bq = greet.querySelector('.hc-bq'), bT = greet.querySelector('.hc-bopen b'), bS = greet.querySelector('.hc-bopen small');
const MAIN_T = bT.textContent, MAIN_S = bS.textContent;
let qi = 0, pi = 0, snoozeUntil = 0, mode = 'main';
function paintQs() {
  bq.innerHTML = QSETS[qi++ % QSETS.length].map(q => `<button type="button">${q}</button>`).join('');
  bq.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { toggle(true); reply(b.textContent); track('chat_bubble_question', { q: b.textContent }); }));
}
function hideGreet() { greet.classList.remove('show'); setTimeout(() => { if (!greet.classList.contains('show')) greet.hidden = true; }, 350); }
const isPhone = () => matchMedia('(max-width: 760px)').matches;
function nudgePhone() {                            // phones: no pop-up over the content, the chat button rocks instead
  const el = document.querySelector('.dock-chat');
  if (!el || !panel.hidden || document.documentElement.classList.contains('menu-open')) return;
  el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
}
function popBubble(kind) {
  if (isPhone()) { nudgePhone(); return; }
  if (!panel.hidden || document.documentElement.classList.contains('menu-open') || Date.now() < snoozeUntil || greet.classList.contains('show')) return;
  mode = kind;
  if (kind === 'main') { bT.textContent = MAIN_T; bS.textContent = MAIN_S; paintQs(); greet.classList.remove('mini'); }
  else { bT.textContent = PINGS[pi++ % PINGS.length]; bS.textContent = PING_SUB; greet.classList.add('mini'); }
  greet.hidden = false; requestAnimationFrame(() => greet.classList.add('show'));
  fab.classList.remove('wiggle'); void fab.offsetWidth; fab.classList.add('wiggle');
  track('chat_bubble_shown', { kind, msg: bT.textContent });
  clearTimeout(window.__hcHide);
  window.__hcHide = setTimeout(() => { if (!greet.matches(':hover')) hideGreet(); }, kind === 'main' ? 5500 : 4500);
}
function showGreet() { popBubble('main'); }
greet.querySelector('.hc-bx').addEventListener('click', () => { hideGreet(); snoozeUntil = Date.now() + 120000; track('chat_bubble_closed'); });
greet.querySelector('.hc-bopen').addEventListener('click', () => {
  toggle(true);
  if (mode === 'ping') reply(bT.textContent);         // a question bubble asks its own question
  track('chat_bubble_opened', { kind: mode, msg: bT.textContent });
});
greet.addEventListener('mouseleave', () => { clearTimeout(window.__hcHide); window.__hcHide = setTimeout(hideGreet, 2000); });
setTimeout(() => popBubble('main'), 1500);          // first thing a visitor sees, briefly
setInterval(() => popBubble('ping'), 25000);        // then a small question now and then
setInterval(() => {                                // the labelled button rocks gently in between
  if (isPhone() || !panel.hidden || greet.classList.contains('show')) return;
  fab.classList.remove('wiggle'); void fab.offsetWidth; fab.classList.add('wiggle');
}, 8000);
setInterval(() => { if (isPhone()) nudgePhone(); }, 8000);   // keep the phone button gently alive

/* ---------- "no time that suits you?": a guided wish-time request in the chat ----------
 * Asks for treatment, 2–3 preferred times, name, mobile and a note (typed, spoken or tapped), then shows
 * a summary and "sends" it. In the mockup nothing leaves the browser: the SMS to the salon and the receipt to the
 * client are shown as a demo. Production: POST to a small serverless function that sends both texts through a
 * Danish SMS gateway (e.g. GatewayAPI) and/or emails the salon, and deletes the request when it is closed. */
const WL = {"chip": "Can't find a time?", "kw": ["no time", "no times", "no slot", "no slots", "fully booked", "booked up", "nothing available", "can't find", "cannot find", "not available", "doesn't suit", "does not suit", "waiting list", "waitlist", "cancellation", "call me back", "contact me", "call me", "as soon as possible", "another time", "other times"], "intro": "Let's sort it out together 🙌 Tell me what you'd like done and when suits you. I'll pass it on to the salon, and you'll get a text with a time. You can type, speak (🎤) or tap.", "askTreat": "What would you like done?", "treat": ["Women's cut", "Men's cut", "Colour or balayage", "Extensions", "Updo for a special day", "Something else"], "askTime": "When suits you? Give me <b>2–3 options</b> if you can, e.g. “Thursday afternoon” or “Friday 9–12”.", "timeChips": ["Weekday mornings", "Weekday afternoons", "Thursday evening", "First available"], "more": "Noted ✔️ Do you have another option? More options make it easier to find a time.", "noMore": "No, that's fine", "askName": "What's your name?", "askPhone": "Thanks, {n}! Which mobile number can we text?", "badPhone": "That doesn't look like a Danish mobile number. Type the 8 digits, e.g. 12 34 56 78.", "askNote": "Anything we should know? E.g. who you usually see, or if it's urgent.", "noNote": "No, thanks", "sumT": "Your request", "lTreat": "Treatment", "lTimes": "Preferred times", "lName": "Name", "lPhone": "Mobile", "lNote": "Note", "consent": "When you tap <b>Send</b>, Hot Cut may text you about this request. We delete the details once it is closed. <a href=\"{p}\" target=\"_blank\" rel=\"noopener\">Privacy policy</a>", "send": "Send request", "edit": "Start over", "cancel": "Cancel", "cancelled": "No problem, I haven't sent anything. You can always call us on <b>97 12 60 60</b>.", "done": "Thanks, {n}! ✅ Your request has been sent to the salon. We will find a time based on your options and text <b>{p}</b>, usually the same day during opening hours.", "demo": "Demo · no texts are sent yet", "toSalon": "Text to the salon", "toClient": "Receipt to you", "smsSalon": "New time request from hotcut.dk 💇 {n}, {p}. {t}. Wishes: {w}.{x} Reply by text or call.", "smsClient": "Hi {f} 👋 Thanks for your request at Hot Cut. We will find a time and text you as soon as possible. Hot Cut · 97 12 60 60", "demoNote": "At launch a Danish SMS service (e.g. GatewayAPI) is connected, so the texts go out automatically. The salon can also get the request by email.", "note": " Note: ", "ph": {"treat": "E.g. a cut and colour …", "time": "E.g. Thursday afternoon …", "more": "Another option …", "name": "Your name …", "phone": "12 34 56 78", "note": "Add a note …", "confirm": "Type “send” or tap …"}, "phDefault": "Type or speak …", "yes": ["send", "yes", "ok", "okay", "send it", "yes please"], "no": ["no", "no thanks", "that's fine", "thats fine", "done", "nope"], "stop": ["cancel", "stop", "abort", "never mind"], "retT": "Did you find a time that suits you? 🙂", "retS": "If not, tell me when you can make it. I'll let the salon know, and you'll get a text.", "retNo": "No, help me", "retYes": "Yes, thanks!", "close": "Close", "priv": "en/privacy.html"};
const PRIV = ((document.currentScript && document.currentScript.src) || '').replace(/assistant(-en)?\.js.*$/, '') + WL.priv;
let wish = null, spokeLast = false;
function setChips(list, primary) {
  chips.innerHTML = '';
  (list || CHIPS).forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; if (c === primary) b.className = 'p'; b.onclick = () => reply(c); chips.appendChild(b); });
  chips.scrollLeft = 0;
}
function botSay(html, delay = 520) {
  const typing = document.createElement('div'); typing.className = 'hc-msg bot hc-typing'; typing.innerHTML = '<i></i><i></i><i></i>';
  log.appendChild(typing); log.scrollTop = log.scrollHeight;
  return new Promise(res => setTimeout(() => { typing.remove(); bubble(html, 'bot'); if (spokeLast) speak(html); res(); }, delay));
}
function wishUI(step, list, primary) {
  wish.step = step; setChips(list ? [...list, WL.cancel] : [WL.cancel], primary);
  input.placeholder = WL.ph[step] || WL.phDefault; input.inputMode = step === 'phone' ? 'tel' : 'text';
}
function startWish() {
  wish = { step: 'treat', d: { times: [] } }; track('wish_start');
  botSay(WL.intro).then(() => botSay(WL.askTreat, 380)).then(() => wishUI('treat', WL.treat));
}
function endWish() { wish = null; setChips(); input.placeholder = WL.phDefault; input.inputMode = 'text'; }
const isAny = (q, list) => list.includes(norm(q));
function wishStep(q) {
  const d = wish.d, txt = q.trim().slice(0, 160);
  if (isAny(q, WL.stop) || q === WL.cancel) { endWish(); track('wish_cancel'); return botSay(WL.cancelled); }
  switch (wish.step) {
    case 'treat': d.treat = txt; wishUI('time', WL.timeChips); return botSay(WL.askTime);
    case 'time': d.times.push(txt); wishUI('more', [...WL.timeChips.filter(c => !d.times.includes(c)), WL.noMore], WL.noMore); return botSay(WL.more);
    case 'more':
      if (q === WL.noMore || isAny(q, WL.no)) { wishUI('name'); return botSay(WL.askName); }
      d.times.push(txt);
      if (d.times.length >= 3) { wishUI('name'); return botSay(WL.askName); }
      wishUI('more', [...WL.timeChips.filter(c => !d.times.includes(c)), WL.noMore], WL.noMore); return botSay(WL.more);
    case 'name': d.name = txt.slice(0, 40); wishUI('phone'); return botSay(WL.askPhone.replace('{n}', esc(d.name.split(' ')[0])));
    case 'phone': {
      let n = q.replace(/\D/g, ''); if (n.length === 10 && n.startsWith('45')) n = n.slice(2); if (n.length === 12 && n.startsWith('0045')) n = n.slice(4);
      if (n.length !== 8) return botSay(WL.badPhone);
      d.phone = n.replace(/(\d{2})(?=\d)/g, '$1 '); wishUI('note', [WL.noNote]); return botSay(WL.askNote);
    }
    case 'note': d.note = (q === WL.noNote || isAny(q, WL.no)) ? '' : txt; return summary();
    case 'confirm':
      if (q === WL.send || isAny(q, WL.yes)) return sendWish();
      if (q === WL.edit) { endWish(); return startWish(); }
      return botSay(WL.consent.replace('{p}', PRIV));
  }
}
function summary() {
  const d = wish.d, row = (l, v) => v ? `<dt>${l}</dt><dd>${v}</dd>` : '';
  wishUI('confirm', [WL.send, WL.edit], WL.send);
  return botSay(`<div class="hc-wish"><b>${WL.sumT}</b><dl>${row(WL.lTreat, esc(d.treat))}${row(WL.lTimes, d.times.map((t, i) => `${i + 1}. ${esc(t)}`).join('<br>'))}${row(WL.lName, esc(d.name))}${row(WL.lPhone, d.phone)}${row(WL.lNote, esc(d.note))}</dl><small>${WL.consent.replace('{p}', PRIV)}</small></div>`);
}
function sendWish() {
  const d = wish.d; endWish();
  track('wish_request', { wish_treatment: d.treat, wish_times: d.times.length });
  const first = esc(d.name.split(' ')[0]);
  const sms = WL.smsSalon.replace('{n}', esc(d.name)).replace('{p}', d.phone).replace('{t}', esc(d.treat))
    .replace('{w}', d.times.map((t, i) => `${i + 1}) ${esc(t)}`).join(' ')).replace('{x}', d.note ? WL.note + esc(d.note) + '.' : '');
  return botSay(WL.done.replace('{n}', first).replace('{p}', d.phone), 900).then(() => {
    bubble(`<div class="hc-sms"><span class="hc-demo">${WL.demo}</span><div class="sms"><small>${WL.toSalon}</small><p>${sms}</p></div><div class="sms me"><small>${WL.toClient}</small><p>${WL.smsClient.replace('{f}', first)}</p></div><small>${WL.demoNote}</small></div>`, 'bot');
  });
}
/* back from the booking system (opens in a new tab): ask once whether they found a time */
let bookAt = 0;
document.addEventListener('click', e => { if (e.target.closest('a[href*="bestilling.nu"]')) bookAt = Date.now(); }, true);
const ret = document.createElement('div'); ret.className = 'hc-return'; ret.hidden = true; ret.setAttribute('role', 'status');
ret.innerHTML = `<button class="hc-bx" type="button" aria-label="${WL.close}">✕</button><b>${WL.retT}</b><small>${WL.retS}</small><div><button type="button" class="p" data-r="no">${WL.retNo}</button><button type="button" data-r="yes">${WL.retYes}</button></div>`;
root.appendChild(ret);
function hideReturn() { ret.classList.remove('show'); setTimeout(() => ret.hidden = true, 300); }
ret.addEventListener('click', e => {
  const r = e.target.closest('[data-r]')?.dataset.r; if (!r && !e.target.closest('.hc-bx')) return;
  hideReturn(); track('wish_return', { answer: r || 'closed' });
  if (r === 'no') { toggle(true); if (!wish) startWish(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !bookAt || Date.now() - bookAt < 5000 || wish) return;
  bookAt = 0; snoozeUntil = Date.now() + 90000; hideGreet();
  ret.hidden = false; requestAnimationFrame(() => ret.classList.add('show')); track('wish_return_shown');
  clearTimeout(window.__hcRet); window.__hcRet = setTimeout(hideReturn, 25000);
});
window.hcAssistant = { wish: () => { toggle(true); if (!wish) startWish(); },  answer: q => { const e = answer(q); return e.id || 'fallback'; }, open: () => toggle(true), greet: showGreet, ping: () => popBubble('ping') };
})();
