// Same word filter as the server (magyarotyesz-server/src/moderation.ts): it gives instant feedback in the forms; the server has the last word.
/*
  Keeps slurs and swearing out of the two free-text fields (a place's name and
  its note). Codes can't carry words: they only allow keypad characters.

  This is a safety net, not a promise: no filter catches everything, which is
  why people can also report a place and an admin can remove it quickly.

  It looks at whole words (so "Szarvas" and "Scunthorpe" stay fine), ignores
  accents and capitals, sees through the usual disguises (sz@r, f u c k,
  fuuuck) and also catches a few long, unambiguous words inside compounds.
*/

// Lowercase, ASCII, one letter per run of the same letter ("fuuuck" -> "fuck").
const squash = (s: string) => s.replace(/(.)\1+/g, '$1');
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const LEET: Record<string, string> = { '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't', '8': 'b' };

// Whole words (matched as separate words). Hungarian and English; already without accents.
const WORDS = [
  // Hungarian
  'kurva', 'kurvak', 'kurvara', 'kurvanyad', 'geci', 'gecis', 'gecilada', 'fasz', 'faszt', 'faszom', 'faszfej', 'faszkalap', 'faszszopo',
  'picsa', 'picsaba', 'szar', 'szaros', 'szarhazi', 'bazdmeg', 'bazmeg', 'baszd', 'baszod', 'baszik', 'baszki', 'kibaszott', 'megbaszott',
  'seggfej', 'rohadek', 'mocskos', 'buzi', 'buzik', 'buzeran', 'csicska', 'szopd', 'szopjal', 'anyadat', 'fostalicska', 'ocsmany',
  // English
  'fuck', 'fucks', 'fucker', 'fucking', 'fuckin', 'motherfucker', 'shit', 'shitty', 'bullshit', 'bitch', 'bitches', 'cunt', 'asshole', 'arsehole',
  'bastard', 'whore', 'slut', 'nigger', 'niggers', 'nigga', 'niggas', 'faggot', 'faggots', 'fag', 'fags', 'retard', 'retarded', 'tranny',
  'kike', 'chink', 'spic', 'spick', 'wetback', 'gook', 'coon', 'paki', 'towelhead', 'raghead', 'beaner', 'sandnigger', 'hitler', '1488',
];

// Long, unambiguous words that are also caught inside bigger words ("kurvanyad", "motherfucker").
const INSIDE = ['kurva', 'bazdmeg', 'bazmeg', 'nigger', 'faggot', 'fuck', 'faszfej', 'faszkalap', 'faszom', 'kibaszott', 'megbaszott', 'szarhazi'];

// Short phrases, matched as whole words in a row.
const PHRASES = ['heil hitler', 'sieg heil', 'white power', 'gas the jews', 'kill all', 'kill yourself', 'mocskos cigany', 'mocskos zsido', 'piszkos zsido', 'dogoljon meg'];

// "cigany" (Roma) and "zsido" (Jewish) are ordinary words and part of real place names (Zsidonegyed, a
// Zsido Muzeum), so on their own they pass; they are only turned away with an insult next to them, or
// in the verb/noun forms that are only ever used as abuse. Plain mentions still land in the admin's
// "flagged" list through watch().
const ETHNIC = ['cigany', 'ciganyok', 'ciganyt', 'ciganyokat', 'ciganynak', 'ciganyoknak', 'ciganyul', 'zsido', 'zsidok', 'zsidot', 'zsidokat', 'zsidonak', 'zsidoknak', 'zsidoja', 'zsidojai'];
const ABUSIVE_FORMS = ['zsidozik', 'zsidozas', 'zsidozni', 'zsidozo', 'zsidozd', 'ciganyozik', 'ciganyozas', 'ciganyozni', 'ciganyozo', 'ciganyozd', 'zsidobuzi', 'ciganybuzi', 'ciganypecsenye', 'ciganykurva', 'zsidokurva', 'zsidopenz'];
const INSULTS = ['mocskos', 'piszkos', 'koszos', 'buzos', 'buzhodt', 'rohadt', 'rohadek', 'szar', 'szaros', 'szemet', 'patkany', 'parazita', 'tolvaj', 'lopo', 'gazember', 'piszok', 'dog', 'dogoljon', 'dogoljatok', 'pusztuljon', 'pusztuljatok', 'kifele', 'irtsd', 'irtsuk', 'agyonutni', 'gyilkos', 'hazug', 'ronda', 'undorito', 'allat', 'disznok', 'hullak', 'gazok', 'gaz', 'kurva', 'buzi'];
const ethnic = new Set(ETHNIC.map(squash)), abusive = new Set(ABUSIVE_FORMS.map(squash)), insults = new Set(INSULTS.map(w => squash(fold(w))));

const blocked = new Set(WORDS.map(w => squash(w)));
const inside = INSIDE.map(w => squash(w));
const phrases = PHRASES.map(p => p.split(' ').map(squash).join(' '));

const tokens = (text: string) => text.split(/[^a-z0-9]+/).filter(Boolean);

/** "f u c k" or "f.u.c.k" -> "fuck": runs of single letters become one word. */
function joinSingles(list: string[]) {
  const out: string[] = [];
  let run = '';
  for (const t of list) {
    if (t.length === 1 && /[a-z0-9]/.test(t)) { run += t; continue; }
    if (run.length >= 3) out.push(run);
    run = '';
    out.push(t);
  }
  if (run.length >= 3) out.push(run);
  return out;
}

export type Verdict = { ok: true } | { ok: false; term: string };

export function check(text: string): Verdict {
  const plain = fold(text);
  const leet = plain.replace(/[@4310!$578+]/g, c => LEET[c] ?? c);
  // A third view closes up asterisk/underscore masking inside a word ("fu*ck"); other punctuation stays a separator.
  const views = [plain, leet, plain.replace(/[*_]/g, '')];
  for (const view of views) {
    // Turn separators that people use to dodge filters ("f*u*c*k") into nothing for the single-letter join.
    const list = joinSingles(tokens(view.replace(/[*_\-.]/g, ' ')));
    const squashed = list.map(squash);
    for (const [i, word] of squashed.entries()) {
      const original = list[i]!;
      const letters = /^[a-z]+$/.test(original);
      // Digits in the disguised view only count when the word is long enough to be sure ("f4sz"), never short ones.
      if (view === leet && word.length < 4) continue;
      if (blocked.has(word)) return { ok: false, term: word };
      if (letters || view === leet) for (const part of inside) if (word.includes(part)) return { ok: false, term: part };
    }
    if (squashed.some(w => abusive.has(w))) return { ok: false, term: squashed.find(w => abusive.has(w))! };
    if (squashed.some(w => ethnic.has(w))) { const bad = squashed.find(w => insults.has(w)); if (bad) return { ok: false, term: bad }; }
    const joined = ' ' + squashed.join(' ') + ' ';
    for (const phrase of phrases) if (joined.includes(' ' + phrase + ' ')) return { ok: false, term: phrase };
  }
  return { ok: true };
}

/** Name and note of a place (either may be missing, e.g. an edit that changes only one). */
export function checkFields(fields: { name?: string; note?: string }): Verdict {
  for (const value of [fields.name, fields.note]) {
    if (!value) continue;
    const verdict = check(value);
    if (!verdict.ok) return verdict;
  }
  return { ok: true };
}

/** Words that are fine on their own but worth a look: what the admin's "flagged" list adds to the hard filter. */
export function watch(text: string): string | null {
  const words = tokens(fold(text)).map(squash);
  return words.find(w => ethnic.has(w) || abusive.has(w)) ?? null;
}

/** The hard filter, then the watch list: why a text deserves a moderator's eye. */
export function flag(text: string): string | null {
  const v = check(text);
  return v.ok ? watch(text) : v.term;
}
