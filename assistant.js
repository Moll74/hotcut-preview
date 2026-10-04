/* Hot Cut AI-assistent
 * Answers from a knowledge base built from every page on hotcut.dk
 * (forside, dameklip, herreklip, balayage, extensions, priser, kontakt).
 * In this mockup it runs entirely in the browser. For production, the same KB
 * becomes the grounding context for an LLM endpoint (see README note in the hand-off).
 */
(() => {
const BOOK = 'https://hotcut.bestilling.nu/';
const TEL = 'tel:+4597126060';
const MAPS = 'https://maps.google.com/?q=Hot+Cut+S%C3%B8ndergade+12+7400+Herning';

/* ---------- actions shown under an answer ---------- */
const A = {
  book: { label: 'Se ledige tider', href: BOOK, primary: true },
  consult: { label: 'Book gratis konsultation', href: BOOK, primary: true },
  call: { label: 'Ring 97 12 60 60', href: TEL },
  prices: { label: 'Se hele prislisten', href: '#priser' },
  map: { label: 'Rutevejledning', href: MAPS },
  mail: { label: 'Skriv til info@hotcut.dk', href: 'mailto:info@hotcut.dk' },
};

/* ---------- live opening status (Europe/Copenhagen) ---------- */
const HOURS = { 1: ['09:00', '15:00'], 2: ['08:30', '17:00'], 3: ['08:30', '17:00'], 4: ['08:30', '19:00'], 5: ['08:30', '17:00'] };
const DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
function status() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m = (+p.hour % 24) * 60 + +p.minute;
  const mm = s => +s.slice(0, 2) * 60 + +s.slice(3), h = HOURS[d];
  if (h && m >= mm(h[0]) && m < mm(h[1])) return `Vi har <b>åbent lige nu</b> og lukker kl. ${h[1]}.`;
  for (let i = 0; i < 8; i++) {
    const nd = (d + i) % 7, nh = HOURS[nd];
    if (nh && (i > 0 || m < mm(nh[0]))) return `Salonen er <b>lukket lige nu</b> og åbner ${i === 0 ? 'i dag' : i === 1 ? 'i morgen' : DAYS[nd]} kl. ${nh[0]}. Online booking er åben døgnet rundt.`;
  }
}
const hoursTable = `<table class="hc-t"><tr><td>Mandag</td><td>09:00–15:00</td></tr><tr><td>Tirsdag</td><td>08:30–17:00</td></tr><tr><td>Onsdag</td><td>08:30–17:00</td></tr><tr><td>Torsdag</td><td>08:30–19:00</td></tr><tr><td>Fredag</td><td>08:30–17:00</td></tr><tr><td>Lør–søn</td><td>Lukket</td></tr></table>`;

/* ---------- knowledge base (source: hotcut.dk, scanned Oct 2026) ----------
 * k: trigger words/phrases (Danish, lowercase). Phrases score higher than single words.
 */
const KB = [
  { id: 'hours', k: ['åbningstid', 'åbningstider', 'åbent', 'åben', 'lukket', 'lukker', 'åbner', 'hvornår har i', 'weekend', 'lørdag', 'søndag', 'mandag', 'torsdag', 'fredag', 'tirsdag', 'onsdag', 'i dag', 'i morgen', 'aftenåbent', 'sent'],
    a: () => `${status()}${hoursTable}<small>Åbningstiderne er vejledende.</small>`, act: ['book', 'call'] },
  { id: 'address', k: ['adresse', 'hvor ligger', 'hvor er i', 'find jer', 'finde jer', 'søndergade', 'beliggenhed', 'rutevejledning', 'kørselsvejledning', 'centrum', 'gågade', 'vej'],
    a: `Du finder os på <b>Søndergade 12, 7400 Herning</b>, centralt i byen. Det er nemt at kombinere med en tur i gågaden eller på café.`, act: ['map', 'book'] },
  { id: 'parking', k: ['parkering', 'parkere', 'p-plads', 'bil', 'holde'],
    a: `Parkering står der desværre ikke noget om på hjemmesiden. Ring til salonen på 97 12 60 60, så hjælper de dig med det nemmeste sted at parkere ved Søndergade 12.`, act: ['call', 'map'] },
  { id: 'contact', k: ['telefon', 'telefonnummer', 'nummer', 'ringe', 'ring', 'mail', 'email', 'e-mail', 'kontakt', 'kontakte', 'skrive'],
    a: `Du kan kontakte Hot Cut på:<br>📞 <b>97 12 60 60</b><br>✉️ <b>info@hotcut.dk</b><br>📍 Søndergade 12, 7400 Herning`, act: ['call', 'mail'] },
  { id: 'book', base: true, k: ['book', 'booke', 'booking', 'bestil', 'bestille', 'ledig', 'ledige', 'tid', 'aftale', 'reservere', 'online'],
    a: `Du kan <b>booke online døgnet rundt</b>, eller ringe på 97 12 60 60, så finder vi en tid, der passer dig. Skal du have klip og farve samme dag, så book i god tid, så vi kan afsætte nok tid.`, act: ['book', 'call'] },
  { id: 'cancel', k: ['aflys', 'aflyse', 'afbestil', 'afbestille', 'flytte min tid', 'ændre min tid', 'ombook', 'kan ikke komme', 'udeblive', 'syg'],
    a: `Hjemmesiden beskriver ikke regler for aflysning. Ring til salonen på 97 12 60 60 hurtigst muligt, så hjælper de dig med at flytte eller aflyse tiden.`, act: ['call'] },
  { id: 'payment', k: ['betaling', 'betale', 'mobilepay', 'kort', 'kontant', 'dankort', 'faktura'],
    a: `Betalingsmuligheder står der ikke noget om på hjemmesiden. Spørg salonen på 97 12 60 60, så får du et sikkert svar.`, act: ['call'] },
  { id: 'giftcard', k: ['gavekort', 'gave', 'gavebevis'],
    a: `Gavekort er ikke nævnt på hjemmesiden. Ring til salonen på 97 12 60 60, så kan de fortælle, hvad de kan tilbyde.`, act: ['call'] },
  { id: 'prices', base: true, k: ['pris', 'priser', 'prisliste', 'koster', 'kost', 'hvad koster', 'billig', 'dyr', 'kr', 'kroner', 'beløb'],
    a: `Et udpluk af priserne:<table class="hc-t"><tr><td>Dameklip inkl. vask &amp; føn</td><td>520 kr</td></tr><tr><td>Herreklip</td><td>370 kr</td></tr><tr><td>Børneklip</td><td>fra 240 kr</td></tr><tr><td>Helfarve</td><td>fra 650 kr</td></tr><tr><td>Balayage inkl. Olaplex</td><td>1.450 kr</td></tr><tr><td>Extensions</td><td>fra 3.600 kr</td></tr><tr><td>Brudeopsætning</td><td>1.600 kr</td></tr></table>Spørg gerne om en bestemt behandling, så finder jeg prisen.`, act: ['prices', 'book'] },
  { id: 'dameklip', k: ['dameklip', 'damefrisør', 'kvinde', 'kvinder', 'dame', 'damer', 'pandehår', 'vask og føn', 'føn', 'hårkur', 'hovedbundsmassage', 'pageklip', 'lagklip', 'undercut'],
    a: `<b>Dameklip inkl. vask og føn koster 520 kr.</b> Tilvalg: pandehår 89 kr, luksus hårkur med hovedbundsmassage 159 kr (ved klip). Vask/føn alene 350 kr, undercut 200 kr.<br><br>Du får altid gratis rådgivning om snit, pleje og styling, og du er velkommen til at medbringe inspirationsbilleder.`, act: ['book', 'prices'] },
  { id: 'damepris', k: ['hvorfor koster dameklip mere', 'dyrere end herreklip', 'dameklip dyrere', 'dameklip mere'],
    a: `En dameklip koster mere end en standard herreklip, fordi der typisk er længere behandlingstid, mere detaljeret klippeteknik og en grundigere styling. Dameklippen er inkl. vask og føn.`, act: ['book'] },
  { id: 'often', k: ['hvor ofte', 'hvor tit', 'hvor lang tid mellem', 'hver uge', 'uger mellem', 'interval'],
    a: `Generelt anbefaler vi en klipning <b>hver 6.–8. uge</b> for at holde håret sundt og pænt. Har du langt hår og vil bevare længden, kan du vente op til 12 uger. For herrer gælder også 6–8 uger, og en fade skal ofte vedligeholdes lidt oftere.`, act: ['book'] },
  { id: 'herreklip', k: ['herreklip', 'herrefrisør', 'mand', 'mænd', 'herre', 'fade', 'skin fade', 'crew cut', 'textured crop', 'sideskilning', 'slick back', 'maskinklip', 'krans', 'barber', 'frisør til mænd'],
    a: `<b>Herreklip koster 370 kr.</b> Herreklip krans 310 kr, maskinklip 200 kr, skægtrimning 150 kr.<br><br>Vi laver alt fra klassisk sideskilning og crew cut til fade, textured crop og undercut. Lige nu er skin fade, mellemlang fade og klassisk slick back blandt de mest populære.`, act: ['book', 'prices'] },
  { id: 'herrestil', k: ['ansigtsform', 'rundt ansigt', 'firkantet', 'tyndt hår', 'fint hår mand', 'langt hår mand', 'man bun', 'gro håret', 'langt hår som mand', 'hvilken frisure passer'],
    a: `Et par tommelfingerregler fra salonen:<br>• <b>Rund ansigtsform:</b> fade eller crew cut giver mere definition.<br>• <b>Firkantet ansigt:</b> klassisk sideskilning eller længere hår med tekstur.<br>• <b>Tyndt hår:</b> kort crew cut eller fade får håret til at se fyldigere ud; textured crop giver volumen.<br>• <b>Vil du gro det langt:</b> klip alligevel hver 8–12 uge mod spaltede spidser, og få en overgangsfrisure undervejs.<br><br>Ved besøget rådgiver frisøren dig ud fra dit hår og din hverdag, og det er gratis.`, act: ['book'] },
  { id: 'beard', k: ['skæg', 'skægtrimning', 'barbering', 'trimning', 'skæglinje'],
    a: `<b>Trimning af skæg koster 150 kr.</b> Vi tilbyder skarpt defineret skæglinje, tæt barbering eller symmetrisk trimning tilpasset din ansigtsform. Kombinér gerne med en herreklip (370 kr).`, act: ['book'] },
  { id: 'kids', k: ['børn', 'barn', 'børneklip', 'pigeklip', 'drengeklip', 'søn', 'datter', 'år gammel', 'teenager'],
    a: `Børnepriser:<table class="hc-t"><tr><td>Børneklip 0–3 år</td><td>240 kr</td></tr><tr><td>Børneklip 4–8 år</td><td>290 kr</td></tr><tr><td>Pigeklip 9–12 år</td><td>390 kr</td></tr><tr><td>Drengeklip 9–12 år</td><td>310 kr</td></tr></table>`, act: ['book'] },
  { id: 'color', k: ['farve', 'farvning', 'farve håret', 'hårfarve', 'helfarve', 'bundfarve', 'udgroning', 'grå hår', 'reflekser', 'striber', 'stanniol', 'hætte', 'lysning', 'lysere'],
    a: `Farvepriser (mellemlangt og langt hår er inkl. Olaplex):<table class="hc-t"><tr><td>Helfarve kort/mellem/langt</td><td>650/1.050/1.200 kr</td></tr><tr><td>Bundfarve / langt hår</td><td>650/750 kr</td></tr><tr><td>Helfarve m. reflekser</td><td>800–1.600 kr</td></tr><tr><td>Reflekser m. stanniol</td><td>800–1.400 kr</td></tr><tr><td>Reflekser over skilning</td><td>950 kr</td></tr><tr><td>Reflekser m. hætte</td><td>800 kr</td></tr><tr><td>10 min. farve, herre</td><td>250 kr</td></tr></table>Du kan sagtens få klip og farve samme dag.`, act: ['book', 'prices'] },
  { id: 'balayage', k: ['balayage', 'eftertoning', 'toning', 'solkysset', 'naturligt farvespil', 'bløde overgange'],
    a: `<b>Balayage koster 1.450 kr</b> og <b>1.900 kr med eftertoning</b>, begge inkl. Olaplex.<br><br>Balayage lysner håret med bløde overgange, så farven smelter sammen med din egen og giver en blødere udgroning. Eftertoning justerer tonen (koldere, varmere, mere beige), og om du har brug for det afhænger af dit hår og den nuance, du ønsker.`, act: ['book', 'call'] },
  { id: 'babylights', k: ['babylights', 'forskel', 'forskellen', 'forskel på balayage', 'balayage eller', 'hvilken farvebehandling'],
    a: `Kort fortalt:<br>• <b>Balayage</b>: blødt, naturligt, solkysset look med mindre markant udgroning (1.450 kr).<br>• <b>Babylights</b>: meget fine lyse striber, der giver et detaljeret, lyst spil (1.800 kr, 2.250 kr m. eftertoning).<br>• <b>Reflekser</b>: mere klassiske lyse eller mørke effekter.<br>• <b>Helfarve</b>: en mere ensartet farve i hele håret.<br><br>Tag udgangspunkt i det resultat, du ønsker. Frisøren rådgiver dig ud fra dit hårs farve, kvalitet og længde.`, act: ['book'] },
  { id: 'balayage-time', k: ['hvor lang tid tager', 'varighed', 'hvor længe tager', 'behandlingstid', 'vedligeholde balayage', 'vedligeholdelse farve'],
    a: `En balayage tager typisk længere tid end en almindelig farvebehandling, fordi teknikken kræver præcision. Den præcise tid afhænger af hårets længde, tykkelse og udgangspunkt, så ring gerne, hvis du skal kende den.<br><br>Vedligehold: brug gode plejeprodukter, beskyt håret mod udtørring og følg frisørens råd om, hvornår farven skal opfriskes.`, act: ['call', 'book'] },
  { id: 'ext', base: true, k: ['extensions', 'extension', 'hairtalk extensions', 'tape', 'tape extensions', 'trenser', 'hair extensions', 'længere hår', 'fyldigere hår', 'mere fylde', 'remy', 'ægte hår'],
    a: `Vi arbejder med <b>Hairtalk tape extensions</b> af 100% ægte Remy-hår, i længder fra 25 til 55 cm. <b>Behandlingen starter fra 3.600 kr.</b><br><br>Fæsterne lægges fladt ind mod hovedet, og der bruges ikke varme ved påsætningen. Start med en <b>gratis konsultation</b>, hvor vi ser på dit hår, finder farve, længde og mængde og giver dig en konkret pris.`, act: ['consult', 'call'] },
  { id: 'ext-hold', k: ['holder extensions', 'hvor længe holder', 'oprykning', 'rykke op', 'rykkes op', 'genbruge', 'genbrug', 'udskifte'],
    a: `Tape extensions skal typisk <b>rykkes op efter 6–8 uger</b>, fordi dit eget hår vokser. Ved oprykning tager vi dem ud, sætter ny tape på og placerer dem tættere på hovedbunden igen. Selve extensionshåret kan ofte <b>genbruges flere gange</b>, hvis det er i god stand og plejes korrekt.`, act: ['consult'] },
  { id: 'ext-harm', k: ['skade', 'skader', 'ødelægge', 'slider', 'belaste', 'skånsom', 'farligt'],
    a: `Korrekt påsat og vedligeholdt er tape extensions skånsomme, og Hairtalk er kendt som et af de mest skånsomme systemer. For meget ekstra hår, forkert placerede fæster eller for sen oprykning kan dog belaste dit eget hår. Derfor vurderer vi dit hår inden behandlingen.`, act: ['consult'] },
  { id: 'ext-care', k: ['pleje extensions', 'plejer jeg', 'style', 'glattejern', 'krøllejern', 'varme', 'føntørrer', 'balsam', 'hårolie', 'vaske extensions'],
    a: `Pleje af tape extensions:<br>• Børst forsigtigt og brug produkter, der egner sig til extensions.<br>• Balsam og hårolie i længderne, <b>ikke på tapefæsterne</b>.<br>• Tør håret grundigt ved fæsterne efter vask.<br>• Du kan style med føntørrer, glattejern og krøllejern, men brug varmebeskyttelse og undgå direkte varme på fæsterne.`, act: ['consult'] },
  { id: 'ext-color', k: ['farve extensions', 'farves', 'farvet extensions', 'lyse extensions'],
    a: `Vi anbefaler at finde den rette nuance sammen inden påsætning frem for at farve extensionshåret bagefter. Hairtalk fraråder permanent farvning og lysning af tape extensions. Vil du senere have en anden farve, hjælper vi dig med at vurdere mulighederne.`, act: ['consult'] },
  { id: 'ext-fine', k: ['fint hår', 'tyndt hår extensions', 'passer extensions', 'egnet'],
    a: `Ja, tape extensions kan også passe til <b>fint hår</b>, fordi de er ultratynde og næsten usynlige. Mængden af ekstra hår og placeringen af fæsterne skal bare passe til dit eget hår, og det vurderer vi sammen ved en gratis konsultation.`, act: ['consult'] },
  { id: 'clipon', k: ['clip-on', 'clip on', 'clips', 'midlertidig', 'selv tage af'],
    a: `Foretrækker du noget fleksibelt, er <b>clip-on extensions og hairbands</b> et godt valg. De er nemme at bruge derhjemme, perfekte til fest eller et midlertidigt look, og giver fylde og længde på få minutter.`, act: ['consult', 'call'] },
  { id: 'keratin', k: ['keratin', 'keratinbehandling', 'glat hår', 'frizz', 'krus'],
    a: `<b>Keratinbehandling:</b> mellemlangt hår 2.000 kr, langt hår 2.800 kr.`, act: ['book', 'call'] },
  { id: 'perm', k: ['permanent', 'krøller permanent', 'perm'],
    a: `<b>Permanent inkl. klip:</b> kort hår 1.400 kr, mellemlangt 1.500 kr, langt 1.600 kr.`, act: ['book'] },
  { id: 'updo', k: ['opsætning', 'håropsætning', 'bryllup', 'brud', 'brudeopsætning', 'konfirmation', 'fest', 'gallafest', 'prøveopsætning', 'særlig lejlighed', 'styling til fest'],
    a: `Opsætning til bryllup, konfirmation og fest:<table class="hc-t"><tr><td>Håropsætning lille / stor</td><td>500 / 750 kr</td></tr><tr><td>Brudeopsætning</td><td>1.600 kr</td></tr><tr><td>Prøveopsætning</td><td>500 kr</td></tr><tr><td>Konfirmationsopsætning</td><td>750 kr</td></tr></table>Kontakt os gerne til en konsultation, hvor vi planlægger dit look sammen.`, act: ['book', 'call'] },
  { id: 'makeup', k: ['makeup', 'make-up', 'sminke', 'sminkning'],
    a: `Vi tilbyder professionel <b>makeup: lille 300 kr, stor 600 kr</b>. Perfekt sammen med en opsætning til bryllup eller fest.`, act: ['book'] },
  { id: 'brows', k: ['bryn', 'vipper', 'browlift', 'brow lamination', 'browlamination', 'lash lift', 'lashlift', 'vippefarve', 'brynsfarve', 'voks', 'pincet'],
    a: `Bryn og vipper:<table class="hc-t"><tr><td>Bryn rettet (voks/pincet)</td><td>100 kr</td></tr><tr><td>Bryn farvet</td><td>100 kr</td></tr><tr><td>Vipper farvet</td><td>150 kr</td></tr><tr><td>Pakke: bryn &amp; vipper farvet og rettet</td><td>300 kr</td></tr><tr><td>Browlamination u. / m. farve</td><td>450 / 500 kr</td></tr></table>Lash lift tilbydes også. Prisen står ikke i prislisten, så ring for at høre den.`, act: ['book', 'call'] },
  { id: 'analysis', k: ['analyse', 'håranalyse', 'analysen', 'voucher', 'rabat på produkter', 'produktrabat', 'hovedbundsanalyse', 'hovedbund', 'hårtab', 'skæl', 'tørt hår', 'tør hovedbund', 'fedtet', 'kløe', 'scanner', 'mikroskop', 'maskine', 'udstyr', 'undersøge mit hår', 'hvad har mit hår brug for'],
    a: `Vi tilbyder <b>hår- og hovedbundsanalyse</b> med vores særlige analyseudstyr. Vi kigger helt tæt på hovedbund og hårstrå, forklarer hvad vi ser, og giver dig konkrete råd om behandling og pleje. <br><br><b>Prisen er 100 kr</b>, og køber du produkter for 400 kr, trækkes de 100 kr fra. Det svarer til 25 % rabat på produkterne. Analysen kan kombineres med en klipning.`, act: [{ label: 'Book analyse', href: BOOK, primary: true }, 'call'] },
  { id: 'brands', k: ['mærker', 'mærke', 'brands', 'brand', 'hvilke produkter', 'hvilke mærker', 'produkter sælger i', 'hvad sælger i'],
    a: `Vi bruger og sælger <b>Olaplex</b>, <b>Roze Avenue</b>, <b>Sanzi Beauty</b>, <b>Hairtalk</b>, <b>ghd</b> og <b>idHAIR</b>. Spørg mig om et af mærkerne eller et bestemt produkt.<br><br>Tip: en håranalyse koster 100 kr, og beløbet trækkes fra, når du køber produkter for 400 kr.`, act: [{ label: 'Se produkterne', href: '#produkter' }, 'call'] },
  { id: 'olaplex', k: ['olaplex', 'bond repair', 'bond', 'bindinger', 'no.3', 'no 3', 'nr 3', 'hair perfector', 'no.4', 'no 4', 'nr 4', 'bond maintenance', '4p', 'no.4p', 'silvershampoo', 'lilla shampoo', 'gule toner', 'gult hår', 'messing', '4c', 'no.4c', 'dybderens', 'clarifying', 'no.7', 'olie', 'hårolie', 'bonding oil'],
    a: `<b>Olaplex</b> genopbygger de bindinger i håret, som farvning, varme og sol bryder ned. Olaplex er med i vores farvebehandlinger på mellemlangt og langt hår. Til hjemmebrug har vi:<br>• <b>No.3 Hair Perfector</b>: kur, der kommes i fugtigt hår <i>før</i> shampoo og virker i mindst 10 minutter.<br>• <b>No.4 Bond Maintenance</b>: plejende shampoo til alle hårtyper.<br>• <b>No.4P Blonde Enhancer</b>: lilla toningsshampoo, der fjerner gule og messingagtige toner i lyst hår.<br>• <b>No.4C Clarifying</b>: dybderensende shampoo mod rester af produkter, fx én gang om ugen.<br>• <b>Olien (No.7 Bonding Oil)</b>: glans og varmebeskyttelse.<br><br>Spørg os i salonen, hvilken kombination der passer til dit hår.`, act: [{ label: 'Olaplex.com', href: 'https://olaplex.com/' }, 'call'] },
  { id: 'roze', k: ['roze avenue', 'roze', 'tørshampoo', 'dry shampoo', 'volumen tørshampoo', 'brown covering', 'luxury restore', 'restore masq', 'hårmaske', 'selvbruner', 'self tan', 'glow collection', 'selvbrunerdråber', 'mousse', 'money masque'],
    a: `<b>Roze Avenue</b> er et nordisk mærke skabt af stylister, og alle produkter er 100 % veganske og cruelty free. Hos os finder du:<br>• <b>Tørshampoo</b>: Glamorous Volumizing giver friskhed og fylde, og Brown Covering er farvet til mørkt hår.<br>• <b>Luxury Restore Masq</b>: plejende hårmaske.<br>• <b>Glow Collection</b>: selvbruner som dråber og som instant mousse.<br><br>Spørg i salonen, hvad vi har på hylden lige nu.`, act: [{ label: 'Rozeavenue.com', href: 'https://rozeavenue.com/' }, 'call'] },
  { id: 'sanzi', k: ['sanzi', 'sanzi beauty', 'vippeserum', 'vippe serum', 'vippevækst', 'lange vipper', 'brynserum', 'bryn serum', 'mascara', 'læbe', 'lip', 'pudder', 'vegansk makeup'],
    a: `<b>Sanzi Beauty</b> er et dansk mærke med veganske produkter uden tilsat parfume og æteriske olier. Vi har været forhandler siden 2025.<br>• <b>Vippeserum</b>: styrker vipperne og fremmer den naturlige vækst. Bruges dagligt, og de første resultater ses typisk efter 6–8 uger, de fulde efter cirka 16 uger.<br>• <b>Brynserum, mascara, læbeprodukter og pudder</b>.<br><br>Serummet er fri for parabener og hormoner.`, act: [{ label: 'Sanzi-beauty.com', href: 'https://www.sanzi-beauty.com/' }, 'call'] },
  { id: 'hairband', k: ['hairband', 'hair band', 'halo', 'hårbånd', 'bånd extensions', 'uden lim', 'uden clips', 'hårtråd'],
    a: `<b>Hairtalk Hairband</b> er extensions af 100 % ægte Remy-hår på et usynligt, elastisk bånd, der tilpasser sig dit hoved. Ingen lim, tape eller clips. Båndet placeres et par centimeter bag hårgrænsen, dit eget hår lægges hen over, og så børster du det sammen. Det tager under fem minutter, og du tager det selv af igen.<br><br>Perfekt til fest eller til dig, der vil have mere fylde uden permanente extensions.`, act: ['consult', 'call'] },
  { id: 'ghd', k: ['ghd', 'sælger i føntørrer', 'sælger i glattejern', 'sælger i krøllejern', 'købe føntørrer', 'købe glattejern', 'købe krøllejern', 'har i føntørrer', 'har i glattejern', 'glattejern', 'styler', 'føntørrer', 'hårtørrer', 'krøllejern', 'krøllestav', 'stylingværktøj'],
    a: `<b>ghd</b> er et britisk mærke kendt for glattejern, føntørrere og krøllejern. Deres glattejern holder en jævn temperatur på 185 °C, som er en god balance mellem styling og skånsomhed. Du finder ghd på produktvæggen i salonen, og vi hjælper gerne med at vælge det rigtige værktøj til dit hår.<br><br>Husk varmebeskyttelse, og undgå direkte varme på tapefæster, hvis du har extensions.`, act: [{ label: 'Ghdhair.com', href: 'https://www.ghdhair.com/' }, 'call'] },
  { id: 'idhair', k: ['idhair', 'id hair', 'hair paint', 'gloss', 'toner', 'gloss toner', 'colour bomb', 'color bomb', 'farvebalsam', 'hp'],
    a: `<b>idHAIR</b> er et dansk mærke med professionelle hårfarver, og det er dem, vi farver med:<br>• <b>Hair Paint</b>: permanent farve med en cremet formel, der holder længe.<br>• <b>Gloss</b>: demi-permanent toner til toning, farvekorrektion og glans på cirka 20 minutter.<br>• <b>Colour Bomb</b>: farvebalsam, der plejer og friskner din farve op mellem besøgene.`, act: ['book', { label: 'Idhair.dk', href: 'https://idhair.dk/' }] },
  { id: 'advice', k: ['rådgivning', 'råd', 'vejledning', 'konsultation', 'uforpligtende', 'i tvivl', 'inspiration', 'billede', 'billeder', 'hvilken frisure', 'klæde mig', 'kort eller lang', 'ny frisure', 'nyt look'],
    a: `Du får altid <b>gratis rådgivning</b>. Vi tager udgangspunkt i din ansigtsform, hårtype og stil, og du er velkommen til at medbringe inspirationsbilleder. Du kan også bare kigge forbi salonen til en uforpligtende snak.`, act: ['book', 'call'] },
  { id: 'texture', k: ['krøller', 'krøllet', 'bølget', 'naturligt fald', 'tekstur', 'glat'],
    a: `Ja. Vi tilpasser klipningen, så den arbejder med dit naturlige hår, uanset om det er glat, bølget eller krøllet. Så får du en frisure, der er flot både stylet og naturligt.`, act: ['book'] },
  { id: 'styling', k: ['styling', 'stylingtips', 'volumen', 'produkter til', 'style mit hår'],
    a: `Efter klipningen viser vi dig, hvordan du opnår fx et glat look, bløde bølger eller ekstra volumen med de rigtige produkter og teknikker. En god frisure skal være nem at style i hverdagen.`, act: ['book'] },
  { id: 'combo', k: ['klip og farve', 'samme besøg', 'samme dag', 'kombinere'],
    a: `Ja, mange kombinerer en dameklip med farve, balayage eller reflekser i samme besøg. Book gerne i god tid, så vi kan afsætte den nødvendige tid.`, act: ['book'] },
  { id: 'products', k: ['produkter', 'ammoniak', 'silikone', 'parabener', 'sulfater', 'allergi', 'økologisk', 'skånsomme produkter', 'kemi'],
    a: `Vi arbejder med nøje udvalgte produkter <b>uden ammoniak, silikone, parabener og sulfater</b>, så resultatet er skånsomt for dit hår. Farvebehandlinger på mellemlangt og langt hår er inkl. Olaplex. Har du en konkret allergi, så ring og tal med frisøren før din tid.`, act: ['call', 'book'] },
  { id: 'team', k: ['hvem', 'frisører', 'personale', 'team', 'heidi', 'anna', 'karina', 'ejer', 'indehaver', 'medarbejdere'],
    a: `Teamet hos Hot Cut:<br>• <b>Heidi Møller</b>, frisør og indehaver<br>• <b>Anna Sand Daasbjerg</b>, frisør<br>• <b>Karina Andreasen</b>, frisør<br><br>Alle har mange års erfaring, og kunderne roser især, at de bliver husket fra gang til gang.`, act: ['book'] },
  { id: 'reviews', k: ['anmeldelser', 'anmeldelse', 'stjerner', 'rating', 'trustpilot', 'google', 'god frisør', 'bedste frisør', 'tilfredse'],
    a: `Hot Cut har <b>4,6 ★ baseret på 69 anmeldelser</b>. Fx skriver Tina: <i>“Heidi er fantastisk til at huske hvem og hvad man er … 5 store stjerner herfra.”</i>`, act: ['book'] },
  { id: 'everyone', k: ['alle', 'køn', 'alder', 'ældre', 'non-binær', 'både mænd og kvinder', 'unisex'],
    a: `Dørene er åbne for alle, uanset køn, alder eller stil. Vi klipper damer, herrer og børn.`, act: ['book'] },
  { id: 'social', k: ['instagram', 'facebook', 'sociale medier', 'billeder af jeres arbejde', 'cvr'],
    a: `Følg med på Instagram <b>@hotcutherning</b> og Facebook <b>hotcutherning</b>. CVR: 33245041.`, act: [{ label: 'Instagram', href: 'https://www.instagram.com/hotcutherning/' }, 'book'] },
  { id: 'bot', k: ['hvem er du', 'er du en robot', 'er du ai', 'menneske', 'chatbot', 'hvad kan du'],
    a: `Jeg er Hot Cuts AI-assistent. Jeg svarer ud fra informationerne på hotcut.dk: priser, behandlinger, åbningstider, extensions, farve og meget mere. Jeg kan ikke se kalenderen, så selve bookingen foregår online eller på telefon.`, act: ['book'] },
  { id: 'hello', k: ['hej', 'hejsa', 'goddag', 'godmorgen', 'hallo', 'dav', 'hey'],
    a: `Hej! 👋 Hvad kan jeg hjælpe dig med? Spørg fx om priser, åbningstider eller extensions.`, act: [] },
  { id: 'thanks', k: ['tak', 'tusind tak', 'mange tak', 'super', 'perfekt', 'fedt'],
    a: `Så lidt! Vi glæder os til at se dig i salonen. ✂️`, act: ['book'] },
];
const FALLBACK = { a: `Det kan jeg desværre ikke svare sikkert på ud fra hjemmesiden. Ring til salonen på <b>97 12 60 60</b> eller skriv til info@hotcut.dk, så får du et præcist svar.`, act: ['call', 'mail'] };
const CHIPS = ['Priser', 'Åbningstider', 'Book tid', 'Håranalyse', 'Hvilke produkter sælger I?', 'Extensions', 'Balayage', 'Herreklip', 'Hvor ligger I?'];

/* ---------- matching ---------- */
const norm = s => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
const stem = w => w.length > 5 ? w.replace(/(erne|ene|ers|er|en|et|e|s)$/, '') : w;
function answer(q) {
  const t = ' ' + norm(q) + ' ', toks = norm(q).split(' ').filter(Boolean).map(stem);
  const scored = KB.map(e => {
    let sc = 0;
    for (const raw of e.k) {
      const k = norm(raw);
      if (k.includes(' ')) { if (t.includes(' ' + k)) sc += 3 + k.split(' ').length; }
      else {
        const ks = stem(k);
        if (toks.includes(ks) || toks.includes(k)) sc += 3;
        else if (ks.length >= 4 && toks.some(w => w.length >= 4 && (w.startsWith(ks) || ks.startsWith(w)))) sc += 2;
      }
    }
    return { e, sc };
  }).filter(x => x.sc >= 2).sort((a, b) => b.sc - a.sc);
  if (!scored.length) return FALLBACK;
  // generic topics (prices, extensions, booking) give way to a specific answer when one matched
  const specific = scored.find(x => !x.e.base);
  const topic = scored.find(x => x.e.id !== 'prices');           // e.g. "hvad koster extensions" -> extensions
  return (specific || topic || scored[0]).e;
}

/* ---------- UI ---------- */
const ICON = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7.5A3.5 3.5 0 0 1 9.5 4h13A3.5 3.5 0 0 1 26 7.5v10a3.5 3.5 0 0 1-3.5 3.5H14l-5.5 5v-5h-1A1.5 1.5 0 0 1 6 19.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="15.2" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="9.8" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M13.6 14 21 9.2M13.6 11 21 15.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M25.5 1.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="currentColor"/></svg>`;
const root = document.createElement('div');
root.className = 'hc-chat';
root.innerHTML = `
  <button class="hc-fab" aria-label="Åbn Hot Cut AI-assistent" aria-expanded="false" aria-controls="hcPanel">${ICON}<span class="hc-badge">1</span></button>
  <div class="hc-tip" role="status">Spørg vores AI-assistent ✨</div>
  <section class="hc-panel" id="hcPanel" role="dialog" aria-label="Hot Cut AI-assistent" hidden>
    <div class="hc-head">
      <div class="hc-ava">${ICON}</div>
      <div><b>Hot Cut AI-assistent</b><small><i></i>Svarer med det samme</small></div>
      <button class="hc-x" aria-label="Luk chat">✕</button>
    </div>
    <div class="hc-log" aria-live="polite"></div>
    <div class="hc-chips"></div>
    <form class="hc-form"><input type="text" placeholder="Skriv eller tal …" aria-label="Skriv dit spørgsmål" autocomplete="off" maxlength="300"><button type="button" class="hc-mic" aria-label="Stil dit spørgsmål med stemmen" aria-pressed="false" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></g></svg></button><button class="hc-send" aria-label="Send">➤</button></form>
    <p class="hc-note">AI-assistent · svarer ud fra hotcut.dk · ved tvivl: ring 97 12 60 60</p>
  </section>`;
document.body.appendChild(root);
const fab = root.querySelector('.hc-fab'), panel = root.querySelector('.hc-panel'), log = root.querySelector('.hc-log'),
      chips = root.querySelector('.hc-chips'), form = root.querySelector('.hc-form'), input = form.querySelector('input'), tip = root.querySelector('.hc-tip');
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
  log.appendChild(m); log.scrollTop = log.scrollHeight;
}
function reply(q, spoken = false) {
  bubble(q.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])), 'me');
  const typing = document.createElement('div'); typing.className = 'hc-msg bot hc-typing'; typing.innerHTML = '<i></i><i></i><i></i>';
  log.appendChild(typing); log.scrollTop = log.scrollHeight;
  const e = answer(q);
  track('chat_question', { chat_intent: e.id || 'fallback' });
  setTimeout(() => {
    typing.remove(); const html = typeof e.a === 'function' ? e.a() : e.a;
    bubble(html, 'bot', e.act || []);
    if (spoken) speak(html);                                        // answer out loud when the question was spoken
  }, 550 + Math.random() * 400);
}
/* ---------- voice: speak the question (Danish), hear the answer ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = form.querySelector('.hc-mic');
let rec = null, listening = false;
function toSpeech(html) {                                          // tables/links read badly; keep it to the prose
  const d = document.createElement('div'); d.innerHTML = html;
  d.querySelectorAll('table').forEach(t => t.replaceWith('. ' + [...t.rows].map(r => [...r.cells].map(c => c.textContent).join(': ')).join('. ') + '. '));
  return d.textContent.replace(/[📞✉️📍👋✂️]/gu, '').replace(/\s+/g, ' ').replace(/(\d)\.(\d{3})/g, '$1$2').trim();
}
function speak(html) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(toSpeech(html)); u.lang = 'da-DK'; u.rate = 1.02;
  const v = speechSynthesis.getVoices().find(v => /^da/i.test(v.lang)); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function setListening(on) {
  listening = on; mic.classList.toggle('on', on); mic.setAttribute('aria-pressed', on);
  input.placeholder = on ? 'Jeg lytter …' : 'Skriv eller tal …';
}
if (SR) {
  mic.hidden = false;
  mic.addEventListener('click', () => {
    if (listening) { rec && rec.stop(); return; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    rec = new SR(); rec.lang = 'da-DK'; rec.interimResults = true; rec.maxAlternatives = 1;
    let finalText = '';
    rec.onresult = ev => {
      let interim = '';
      for (const r of ev.results) (r.isFinal ? (finalText = r[0].transcript) : (interim += r[0].transcript));
      input.value = finalText || interim;
    };
    rec.onerror = ev => { setListening(false); if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') bubble('Jeg kan ikke bruge mikrofonen. Tillad mikrofon i browseren, eller skriv dit spørgsmål.', 'bot'); };
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
  tip.classList.remove('show'); fab.querySelector('.hc-badge').style.display = 'none';
  document.documentElement.classList.toggle('hc-lock', open && innerWidth <= 760);
  document.documentElement.classList.toggle('chat-open', open);
  if (open && !greeted) {
    greeted = true; track('chat_open');
    bubble(`Hej! 👋 Jeg er <b>Hot Cuts AI-assistent</b>. Spørg mig om priser, behandlinger, extensions eller åbningstider.<br><span class="hc-live">${status()}</span>`, 'bot');
  }
  if (open && innerWidth > 760) setTimeout(() => input.focus(), 50);
}
fab.addEventListener('click', () => toggle(panel.hidden));
root.querySelector('.hc-x').addEventListener('click', () => toggle(false));
addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
setTimeout(() => { if (panel.hidden) tip.classList.add('show'); }, 9000);
setTimeout(() => tip.classList.remove('show'), 17000);
window.hcAssistant = { answer: q => { const e = answer(q); return e.id || 'fallback'; }, open: () => toggle(true) };
})();
