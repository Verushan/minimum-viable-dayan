import type { Raga } from '../engine/types';

/**
 * Hand-curated raga profiles, alphabetical by Hindustani name (the "Unknown" fallback first).
 * Swaras: uppercase = shuddha, lowercase = komal, M = teevra Ma. Where a raga uses both forms
 * of a note (e.g. N in aroha, n in avaroha) both are listed.
 *
 * Carnatic ragas with the same scale are merged as aliases (Kalyani → Yaman, Mohanam → Bhupali …).
 * Distinct ragas are kept apart even when their scales coincide (Bhairavi vs Punnagavarali).
 * Bhajan books use "A/B" labels; where A and B are different ragas the first one wins (see
 * findRagaByLabel), which is a provisional choice to be corrected with use.
 * Vadi/samvadi follow common Hindustani teaching; Carnatic-only ragas have none and are ranked
 * by consonance alone. Entries marked "verify" in notes had conflicting sources.
 * Pakads are from ragakosh.com (fetched November 2026), in the same notation: lowercase komal,
 * M teevra, *X lower octave, X* upper octave, commas between phrases. Bageshri and Vibhas are
 * omitted because ragakosh's pakad uses notes outside the scale recorded here.
 */
export const RAGAS: Raga[] = [
  { id: 'unknown', name: 'Unknown / mixed', swaras: ['S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N'],
    notes: 'Fallback when the raga is not known: every note allowed, ranked by consonance only.' },

  { id: 'ahir-bhairav', name: 'Ahir Bhairav', aliases: ['Chakravakam'],
    pakad: 'm P D n D m P G m r S',
    swaras: ['S', 'r', 'G', 'm', 'P', 'D', 'n'], vadi: 'm', samvadi: 'S' },
  { id: 'bageshri', name: 'Bageshri',
    swaras: ['S', 'R', 'g', 'm', 'P', 'D', 'n'], vadi: 'm', samvadi: 'S' },
  { id: 'bairagi', name: 'Bairagi Bhairav', aliases: ['Bairagi', 'Bhairagi Bhairav', 'Revathi', 'Revati'],
    pakad: '*n r m P, n P n, n m r *n r S',
    swaras: ['S', 'r', 'm', 'P', 'n'], vadi: 'm', samvadi: 'S' },
  { id: 'basant-mukhari', name: 'Basant Mukhari', aliases: ['Vakulabharanam', 'Basant'],
    pakad: 'S r G, G m, P m, P d n d P m, P m G m, G r, r S, *N *d *n S r, r G m, G r S, G m r S',
    swaras: ['S', 'r', 'G', 'm', 'P', 'd', 'n'], vadi: 'G', samvadi: 'S',
    notes: 'The book labels "Vakulabharanam/Basant" and "Basant" map here; the Purvi-thaat raga Basant proper is a different scale.' },
  { id: 'bhairav', name: 'Bhairav', aliases: ['Mayamalavagowla', 'Mayamalagowla'],
    pakad: 'G m d, d P, G m r r, S',
    swaras: ['S', 'r', 'G', 'm', 'P', 'd', 'N'], vadi: 'd', samvadi: 'r' },
  { id: 'bhairavi', name: 'Bhairavi', aliases: ['Sindhu Bhairavi', 'Sindhubhairavi'],
    pakad: 'g S r S, g m P, d m d n S*, r* S* d P g m r S',
    swaras: ['S', 'r', 'g', 'm', 'P', 'd', 'n'], vadi: 'm', samvadi: 'S',
    notes: 'The book label "Sindhu Bhairavi/Darbari Kanada" maps here; pick Darbari Kanada explicitly if needed.' },
  { id: 'bhimpalasi', name: 'Bhimpalasi', aliases: ['Abheri', 'Bhimpalas'],
    pakad: '*n S m g m P m S g R S',
    swaras: ['S', 'R', 'g', 'm', 'P', 'D', 'n'], vadi: 'm', samvadi: 'S' },
  { id: 'bhupali', name: 'Bhupali', aliases: ['Bhoopali', 'Bhoop', 'Mohanam'],
    pakad: 'S G P G R S G P D S*',
    swaras: ['S', 'R', 'G', 'P', 'D'], vadi: 'G', samvadi: 'D' },
  { id: 'bhupeshwari', name: 'Bhupeshwari', aliases: ['Vasanthi', 'Vasanti'],
    swaras: ['S', 'R', 'G', 'P', 'd'], vadi: 'P', samvadi: 'S' },
  { id: 'bihag', name: 'Bihag',
    pakad: '*N S G m P, P M P G m G R S',
    swaras: ['S', 'R', 'G', 'm', 'M', 'P', 'D', 'N'], vadi: 'G', samvadi: 'N' },
  { id: 'bilawal', name: 'Bilawal', aliases: ['Bilaval', 'Shankarabharanam'],
    pakad: 'G R, G P D P, m G, m R S',
    swaras: ['S', 'R', 'G', 'm', 'P', 'D', 'N'], vadi: 'D', samvadi: 'G' },
  { id: 'brindavani-sarang', name: 'Brindavani Sarang', aliases: ['Brindavan Sarang', 'Vrindavani Sarang'],
    pakad: '*N S R, m R, P m R, *N S',
    swaras: ['S', 'R', 'm', 'P', 'n', 'N'], vadi: 'R', samvadi: 'P' },
  { id: 'chandrakauns', name: 'Chandrakauns',
    pakad: 'g m g *N S',
    swaras: ['S', 'g', 'm', 'd', 'N'], vadi: 'm', samvadi: 'S' },
  { id: 'charukeshi', name: 'Charukeshi', aliases: ['Charukesi'],
    pakad: '*d *n S R G m G R, R G m d P, R G m R S',
    swaras: ['S', 'R', 'G', 'm', 'P', 'd', 'n'], vadi: 'P', samvadi: 'S' },
  { id: 'darbari', name: 'Darbari Kanada', aliases: ['Darbari', 'Kanada'],
    pakad: 'g R R, S, *d *n S R S',
    swaras: ['S', 'R', 'g', 'm', 'P', 'd', 'n'], vadi: 'R', samvadi: 'P' },
  { id: 'des', name: 'Des', aliases: ['Desh'],
    pakad: 'R m P, n D P, D m G R, G S',
    swaras: ['S', 'R', 'G', 'm', 'P', 'D', 'n', 'N'], vadi: 'R', samvadi: 'P' },
  { id: 'dhani', name: 'Dhani', aliases: ['Shuddha Dhanyasi', 'Suddha Dhanyasi'],
    swaras: ['S', 'g', 'm', 'P', 'n'], vadi: 'g', samvadi: 'n', notes: 'verify vadi/samvadi' },
  { id: 'durga', name: 'Durga', aliases: ['Shuddha Saveri'],
    swaras: ['S', 'R', 'm', 'P', 'D'], vadi: 'm', samvadi: 'S' },
  { id: 'gavati', name: 'Gavati', aliases: ['Gavti', 'Veena Vadini'],
    swaras: ['S', 'G', 'm', 'P', 'D', 'n'], notes: 'vadi/samvadi not established; ranked by consonance' },
  { id: 'gurjari-todi', name: 'Gurjari Todi', aliases: ['Gujari Todi', 'Gurujadi Todi'],
    pakad: 'd, M d, N d, M d M g r, r g r S',
    swaras: ['S', 'r', 'g', 'M', 'd', 'N'], vadi: 'd', samvadi: 'r' },
  { id: 'hamsadhwani', name: 'Hamsadhwani', aliases: ['Hamsadhvani', 'Hansadhwani'],
    pakad: 'S R G P G R G P N P G R S',
    swaras: ['S', 'R', 'G', 'P', 'N'], vadi: 'R', samvadi: 'P', notes: 'verify vadi: some sources give Sa/Pa' },
  { id: 'jaijaiwanti', name: 'Jaijaiwanti', aliases: ['Jaijaivanti', 'Jayjaywanti'],
    pakad: 'R g R S, *n *D *P, R, S',
    swaras: ['S', 'R', 'g', 'G', 'm', 'P', 'D', 'n', 'N'], vadi: 'R', samvadi: 'P' },
  { id: 'jaunpuri', name: 'Jaunpuri', aliases: ['Asavari', 'Natabhairavi'],
    pakad: 'm P d n d P, d, n m P g, R m P',
    swaras: ['S', 'R', 'g', 'm', 'P', 'd', 'n'], vadi: 'd', samvadi: 'g',
    notes: 'Natural minor; Asavari shares the scale and is merged here. The book label "Natabhairavi/Kharaharapriya" maps here.' },
  { id: 'jhinjhoti', name: 'Jhinjhoti', aliases: ['Jinjhoti', 'Senjurutti'],
    pakad: '*D S R m G, R G S R *n *D *P *D S, *P *D S R G m G, m G R S, R *n *D S ',
    swaras: ['S', 'R', 'G', 'm', 'P', 'D', 'n'], vadi: 'G', samvadi: 'n' },
  { id: 'jog', name: 'Jog', aliases: ['Nattai'],
    pakad: 'G m P n P, P n P m G m, G m g S',
    swaras: ['S', 'g', 'G', 'm', 'P', 'n'], vadi: 'G', samvadi: 'S',
    notes: 'Carnatic Nattai is a different scale; the book label "Jog/Nattai" maps here.' },
  { id: 'kafi', name: 'Kafi', aliases: ['Kharaharapriya', 'Khanaharapriya', 'Kapi'],
    pakad: 'g R, m P, m P D P, D n S*, n D P',
    swaras: ['S', 'R', 'g', 'm', 'P', 'D', 'n'], vadi: 'P', samvadi: 'R' },
  { id: 'kalavati', name: 'Kalavati', aliases: ['Janasammohini', 'Valaji'],
    pakad: 'S G P D, P D n D, D P, G P D S n, D n S, n P, D G, P G S, *n *D S',
    swaras: ['S', 'G', 'P', 'D', 'n'], vadi: 'P', samvadi: 'S' },
  { id: 'kalyanavasantam', name: 'Kalyanavasantam', aliases: ['Kalyana Vasantham', 'Kalyana Vasantam'],
    swaras: ['S', 'R', 'g', 'm', 'P', 'd', 'N'], notes: 'Carnatic janya of Kirwani (Re only in avaroha); no vadi/samvadi' },
  { id: 'kedar', name: 'Kedar', aliases: ['Hameer Kalyani', 'Hamir Kalyani'],
    pakad: 'S, m, m P, D P m, P m, R S',
    swaras: ['S', 'R', 'G', 'm', 'M', 'P', 'D', 'N'], vadi: 'm', samvadi: 'S' },
  { id: 'khamaj', name: 'Khamaj', aliases: ['Harikambhoji', 'Harikamboji'],
    swaras: ['S', 'R', 'G', 'm', 'P', 'D', 'n', 'N'], vadi: 'G', samvadi: 'N' },
  { id: 'kirwani', name: 'Kirwani', aliases: ['Keeravani', 'Kiravani', 'Harmonic Minor'],
    pakad: 'P d S*, S* N S* R* g* R* S* N d P, d P m P, P m g R, g m, g R S,N,d,N R S',
    swaras: ['S', 'R', 'g', 'm', 'P', 'd', 'N'], vadi: 'P', samvadi: 'S' },
  { id: 'kuntalavarali', name: 'Kuntalavarali',
    swaras: ['S', 'm', 'P', 'D', 'n'], notes: 'Carnatic; no vadi/samvadi' },
  { id: 'maand', name: 'Maand', aliases: ['Mand'],
    swaras: ['S', 'R', 'G', 'm', 'P', 'D', 'N'], vadi: 'S', samvadi: 'P',
    notes: 'The book label "Maand/Nand" maps here.' },
  { id: 'madhmad-sarang', name: 'Madhmad Sarang', aliases: ['Madhumaad Sarang', 'Madhyamavati', 'Madhumad Sarang'],
    swaras: ['S', 'R', 'm', 'P', 'n'], vadi: 'R', samvadi: 'P' },
  { id: 'madhuvanti', name: 'Madhuvanti', aliases: ['Dharmavati'],
    pakad: 'g M P, N S* D P, M g, M g R S R S',
    swaras: ['S', 'R', 'g', 'M', 'P', 'D', 'N'], vadi: 'P', samvadi: 'S' },
  { id: 'malayamarutam', name: 'Malayamarutam', aliases: ['Malayamarutham'],
    swaras: ['S', 'r', 'G', 'P', 'D', 'n'], notes: 'Carnatic; no vadi/samvadi' },
  { id: 'malkauns', name: 'Malkauns', aliases: ['Malkosh', 'Hindolam', 'Hindol'],
    pakad: '*d *n S g m, g m n d m, d n S*, g* S* n d',
    swaras: ['S', 'g', 'm', 'd', 'n'], vadi: 'm', samvadi: 'S' },
  { id: 'marwa', name: 'Marwa', aliases: ['Marva'],
    pakad: 'D M G r, G M G r, S',
    swaras: ['S', 'r', 'G', 'M', 'D', 'N'], vadi: 'r', samvadi: 'D',
    notes: 'Vadi komal Re clashes with the Sa drone, so the dayan falls back to Dha (samvadi).' },
  { id: 'miyan-malhar', name: 'Miyan ki Malhar', aliases: ['Miyan Malhar', 'Mian ki Malhar'],
    pakad: 'S R P g m R S, *n *D *N S',
    swaras: ['S', 'R', 'g', 'm', 'P', 'D', 'n', 'N'], vadi: 'm', samvadi: 'S' },
  { id: 'nand', name: 'Nand', aliases: ['Anandi Kalyan', 'Anandi'],
    pakad: 'S G m D P R S, G m P D N, D P, P D P m m P, G m D P R S',
    swaras: ['S', 'R', 'G', 'm', 'M', 'P', 'D', 'N'], vadi: 'S', samvadi: 'P' },
  { id: 'natakurinji', name: 'Natakurinji', aliases: ['Nattakurinji'],
    swaras: ['S', 'R', 'G', 'm', 'D', 'n'], notes: 'Carnatic; no vadi/samvadi' },
  { id: 'pahadi', name: 'Pahadi', aliases: ['Pahari'],
    swaras: ['S', 'R', 'G', 'm', 'P', 'D', 'N'], vadi: 'S', samvadi: 'P',
    notes: 'Bhupali skeleton with m and N as passing notes; verify vadi/samvadi' },
  { id: 'patdeep', name: 'Patdeep', aliases: ['Patdip', 'Gowri Manohari', 'Gourimanohari'],
    pakad: 'g m P N S* D P, mg mP N N N S*, D P m g m P, P g m, g R S *N *N S',
    swaras: ['S', 'R', 'g', 'm', 'P', 'D', 'N'], vadi: 'P', samvadi: 'S' },
  { id: 'pilu', name: 'Pilu', aliases: ['Peelu'],
    pakad: 'g m d P g *N S',
    swaras: ['S', 'R', 'g', 'G', 'm', 'P', 'd', 'D', 'n', 'N'], vadi: 'g', samvadi: 'N',
    notes: 'The book label "Pilu/Jaijaivanti" maps here.' },
  { id: 'punnagavarali', name: 'Punnagavarali',
    swaras: ['S', 'r', 'g', 'm', 'P', 'd', 'n'], notes: 'Carnatic; same scale as Bhairavi; no vadi/samvadi' },
  { id: 'puriya-dhanashree', name: 'Puriya Dhanashree', aliases: ['Pantuvarali', 'Kamavardhini'],
    pakad: '*N r G, M P, d P, M G, M G, r S',
    swaras: ['S', 'r', 'G', 'M', 'P', 'd', 'N'], vadi: 'P', samvadi: 'r',
    notes: 'The book label "Pantuvarali/Todi" maps here: Pantuvarali (mela 51) is this scale, not Miyan ki Todi.' },
  { id: 'shanmukhapriya', name: 'Shanmukhapriya',
    swaras: ['S', 'R', 'g', 'M', 'P', 'd', 'n'], notes: 'Carnatic; no vadi/samvadi' },
  { id: 'shivaranjani', name: 'Shivaranjani', aliases: ['Sivaranjani'],
    pakad: 'R g P, D P g R, g S R D S',
    swaras: ['S', 'R', 'g', 'P', 'D'], vadi: 'P', samvadi: 'S' },
  { id: 'shuddha-sarang', name: 'Shuddha Sarang', aliases: ['Shudh Sarang'],
    pakad: 'R M P R m R S R *N S',
    swaras: ['S', 'R', 'm', 'M', 'P', 'N'], vadi: 'R', samvadi: 'P' },
  { id: 'sohini', name: 'Sohini', aliases: ['Sohni', 'Hamsanandi'],
    pakad: 'G M D N S* r* S*, S* N D M D G r S',
    swaras: ['S', 'r', 'G', 'M', 'D', 'N'], vadi: 'D', samvadi: 'G' },
  { id: 'tilak-kamod', name: 'Tilak Kamod',
    swaras: ['S', 'R', 'G', 'm', 'P', 'D', 'N'], vadi: 'R', samvadi: 'P' },
  { id: 'tilang', name: 'Tilang',
    pakad: '*N S G m P, n P, G m G S',
    swaras: ['S', 'G', 'm', 'P', 'n', 'N'], vadi: 'G', samvadi: 'N' },
  { id: 'todi', name: 'Todi (Miyan ki)', aliases: ['Todi', 'Miyan ki Todi', 'Shubhapantuvarali', 'Shubha Pantuvarali'],
    pakad: 'g M d, M d N d N d P, M d M g, r g r g r S',
    swaras: ['S', 'r', 'g', 'M', 'P', 'd', 'N'], vadi: 'd', samvadi: 'g',
    notes: 'The book label "Shubha Pantuvarali/Gurujadi Todi" maps here; pick Gurjari Todi explicitly if needed.' },
  { id: 'vibhas', name: 'Vibhas', aliases: ['Bibhas', 'Revagupti', 'Bowli', 'Bauli'],
    swaras: ['S', 'r', 'G', 'P', 'd'], vadi: 'd', samvadi: 'r' },
  { id: 'yaman', name: 'Yaman', aliases: ['Kalyan', 'Kalyani', 'Yaman Kalyan'],
    pakad: '*N R G, G R G M P R, *N R S',
    swaras: ['S', 'R', 'G', 'M', 'P', 'D', 'N'], vadi: 'G', samvadi: 'N' },
];

export const RAGA_MAP = new Map(RAGAS.map((r) => [r.id, r]));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9/]/g, '');

const LABEL_INDEX = new Map<string, Raga>();
for (const r of RAGAS) {
  LABEL_INDEX.set(norm(r.name), r);
  LABEL_INDEX.set(norm(r.id), r);
  for (const a of r.aliases ?? []) LABEL_INDEX.set(norm(a), r);
}

/**
 * Resolve a free-text raga label to a raga. "A/B" pairs and "A, B" lists resolve to the first
 * name that matches, in order — so where a book pairs two different ragas, the first one wins.
 */
export function findRagaByLabel(label: string): Raga | undefined {
  for (const name of label.split(/[,/]/)) {
    const r = LABEL_INDEX.get(norm(name));
    if (r) return r;
  }
  return undefined;
}
