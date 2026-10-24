/**
 * Parses "1-3, 5, 8-" into groups of 0-based page indices.
 * Each comma-separated range becomes one group. Open-ended ranges run to the last page.
 */
export function parseRanges(input: string, pageCount: number): { groups: number[][]; error: string | null } {
  const parts = input
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { groups: [], error: "Enter at least one page range." };
  const groups: number[][] = [];
  for (const part of parts) {
    const m = part.match(/^(\d*)\s*(?:-|–|to)\s*(\d*)$/i) ?? part.match(/^(\d+)$/);
    if (!m) return { groups: [], error: `“${part}” is not a valid range.` };
    const isRange = m.length === 3;
    const start = m[1] ? Number(m[1]) : 1;
    const end = isRange ? (m[2] ? Number(m[2]) : pageCount) : start;
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      return { groups: [], error: `“${part}” is outside 1–${pageCount}.` };
    }
    const [a, b] = start <= end ? [start, end] : [end, start];
    const group: number[] = [];
    for (let p = a; p <= b; p++) group.push(p - 1);
    if (start > end) group.reverse();
    groups.push(group);
  }
  return { groups, error: null };
}

export function chunkPages(pageCount: number, size: number): number[][] {
  const groups: number[][] = [];
  for (let i = 0; i < pageCount; i += size) {
    groups.push(Array.from({ length: Math.min(size, pageCount - i) }, (_, k) => i + k));
  }
  return groups;
}

export function describeGroup(group: number[]): string {
  if (group.length === 1) return `p${group[0] + 1}`;
  return `p${group[0] + 1}-${group[group.length - 1] + 1}`;
}
