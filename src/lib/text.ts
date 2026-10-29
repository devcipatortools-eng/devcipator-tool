/* ------------------------------ Word counter ------------------------------ */

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingSeconds: number;
  speakingSeconds: number;
  avgWordLength: number;
}

const WORD = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

const HAS_ALNUM = /[\p{L}\p{N}]/u;

/** Abbreviations whose full stop doesn't end a sentence ("Dr. Smith", "e.g. this"). */
const ABBREVIATIONS = new Set(
  "mr mrs ms dr prof sr jr st mt vs etc e.g i.e approx dept est fig inc ltd co no vol a.m p.m u.s jan feb mar apr jun jul aug sep sept oct nov dec".split(" "),
);

let graphemes: Intl.Segmenter | null | undefined;
/** Counts user-perceived characters, so "👍🏽" or "é" written as e + accent count once. */
function characterCount(text: string): number {
  if (graphemes === undefined) graphemes = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  if (!graphemes) return [...text].length;
  let n = 0;
  const it = graphemes.segment(text)[Symbol.iterator]();
  while (!it.next().done) n++;
  return n;
}
const endsWithAbbreviation = (s: string) => ABBREVIATIONS.has((s.match(/(\S+)\.$/)?.[1] ?? "").replace(/^[^\p{L}]+/u, "").toLowerCase());

export function textStats(text: string): TextStats {
  // Like Word and Google Docs: a word is any whitespace-separated token, so "$3.50", "a.b@c.com" and "e-mail" count once.
  const words = (text.match(/\S+/g) ?? []).filter((w) => HAS_ALNUM.test(w)).map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""));
  const trimmed = text.trim();
  // A sentence ends at . ! ? … (plus closing quotes/brackets) followed by whitespace, so decimals and emails don't split it.
  let sentences = 0;
  if (trimmed) {
    const parts = trimmed.split(/(?<=[.!?…]+["'”’)\]]*)\s+/u);
    parts.forEach((part, i) => {
      // A part ending in an abbreviation runs on into the next one, so it isn't a sentence of its own.
      if (HAS_ALNUM.test(part) && !(i < parts.length - 1 && endsWithAbbreviation(part))) sentences++;
    });
  }
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const letters = words.reduce((n, w) => n + w.length, 0);
  return {
    words: words.length,
    characters: characterCount(text),
    charactersNoSpaces: characterCount(text.replace(/\s/g, "")),
    sentences,
    paragraphs,
    lines: text ? text.split("\n").length : 0,
    readingSeconds: (words.length / 238) * 60,
    speakingSeconds: (words.length / 150) * 60,
    avgWordLength: words.length ? letters / words.length : 0,
  };
}

const STOPWORDS = new Set(
  "a an and are as at be but by for from has have he her his i if in into is it its me my not of on or our she so that the their them they this to was we were what when which who will with you your".split(" "),
);

export function topKeywords(text: string, limit = 8): Array<{ word: string; count: number; share: number }> {
  const words = (text.toLowerCase().match(WORD) ?? []).filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, share: count / words.length }));
}

export function formatSeconds(s: number): string {
  if (s < 1) return "0 sec";
  if (s < 60) return `${Math.round(s)} sec`;
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const min = Math.round((s % 3600) / 60);
    return min ? `${h} hr ${min} min` : `${h} hr`;
  }
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return sec ? `${m} min ${sec} sec` : `${m} min`;
}

/* ----------------------------- Case converter ----------------------------- */

export type CaseStyle = "upper" | "lower" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "constant";

const SMALL_WORDS = new Set("a an and as at but by en for if in nor of on or per the to v vs via".split(" "));

/** Splits identifiers and prose into words: "parseHTTPResponse_v2" → parse, HTTP, Response, v2. */
export function splitWords(text: string): string[] {
  return text
    .replace(/(\p{L})['’](\p{L})/gu, "$1$2") // "dog's" → dogs, not dog_s
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Uppercases the first letter unless that would change its length ("ß" → "SS"). */
const upperFirst = (w: string) => {
  const first = [...w][0] ?? "";
  const up = first.toUpperCase();
  return (up.length === first.length ? up : first) + w.slice(first.length);
};
const cap = (w: string) => upperFirst(w.toLowerCase());

function convertLine(line: string, style: CaseStyle): string {
  switch (style) {
    case "upper":
      return line.toUpperCase();
    case "lower":
      return line.toLowerCase();
    case "sentence":
      return line.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (m) => m.toUpperCase());
    case "title": {
      // Small words stay lowercase except at the start of the line or of a sentence.
      return line.replace(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu, (w, offset: number) => {
        const lower = w.toLowerCase();
        const before = line.slice(0, offset);
        const first = !/[\p{L}\p{N}]/u.test(before) || /[.!?:]["'”’)\]]*\s+$/u.test(before);
        if (!first && SMALL_WORDS.has(lower)) return lower;
        // Keep deliberate inner capitals ("myXMLParser" → "MyXMLParser"); all-caps words are still normalised.
        const mixed = /\p{Ll}/u.test(w) && /\p{Lu}/u.test(w.slice(1));
        // Brand-style names that start lowercase ("iPhone", "eBay") are left exactly as written.
        if (mixed && /^\p{Ll}\p{Lu}/u.test(w)) return w;
        return mixed ? upperFirst(w) : cap(w);
      });
    }
    default: {
      const words = splitWords(line);
      if (words.length === 0) return line;
      if (style === "camel") return words.map((w, i) => (i === 0 ? w.toLowerCase() : cap(w))).join("");
      if (style === "pascal") return words.map(cap).join("");
      if (style === "snake") return words.map((w) => w.toLowerCase()).join("_");
      if (style === "kebab") return words.map((w) => w.toLowerCase()).join("-");
      return words.map((w) => w.toUpperCase()).join("_");    }
  }
}

/** Converts each line separately so line breaks survive. */
export function convertCase(text: string, style: CaseStyle): string {
  return text
    .split("\n")
    .map((line) => convertLine(line, style))
    .join("\n");
}
