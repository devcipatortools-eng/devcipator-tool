import { TOOLS, type ToolConfig } from "@/config/tools.config";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const INDEX = TOOLS.map((tool) => ({
  tool,
  title: normalize(tool.title),
  keywords: normalize(tool.keywords.join(" ")),
  body: normalize(`${tool.description} ${tool.category} ${tool.slug.replace(/-/g, " ")}`),
}));

/** Ranks tools by how well every query word matches title, keywords and description. */
export function searchTools(query: string, pool: ToolConfig[] = TOOLS): ToolConfig[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return pool;
  const allowed = new Set(pool.map((t) => t.slug));
  const scored: Array<{ tool: ToolConfig; score: number }> = [];
  for (const entry of INDEX) {
    if (!allowed.has(entry.tool.slug)) continue;
    let score = 0;
    let matchedAll = true;
    for (const w of words) {
      let s = 0;
      if (entry.title.split(" ").some((t) => t.startsWith(w))) s = 10;
      else if (entry.title.includes(w)) s = 7;
      else if (entry.keywords.includes(w)) s = 5;
      else if (entry.body.includes(w)) s = 2;
      if (s === 0) {
        matchedAll = false;
        break;
      }
      score += s;
    }
    if (matchedAll) scored.push({ tool: entry.tool, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.tool);
}
