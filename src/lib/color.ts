export type Rgb = [number, number, number];

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function toRgbString([r, g, b]: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function toHsl([r, g, b]: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function toHslString(rgb: Rgb): string {
  const [h, s, l] = toHsl(rgb);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** Relative luminance check so swatch labels stay readable. */
export function isLight([r, g, b]: Rgb): boolean {
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

/**
 * Median-cut quantization: repeatedly splits the box with the widest colour
 * range at its median, returning box averages ordered by pixel count.
 */
export function medianCut(pixels: Uint8ClampedArray, count: number): Array<{ rgb: Rgb; share: number }> {
  const colors: Rgb[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue; // ignore transparent pixels
    colors.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  if (colors.length === 0) return [];
  let boxes: Rgb[][] = [colors];
  while (boxes.length < count) {
    let target = -1;
    let widest = 0;
    let channel = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = 255;
        let hi = 0;
        for (const p of box) {
          if (p[c] < lo) lo = p[c];
          if (p[c] > hi) hi = p[c];
        }
        if (hi - lo > widest) {
          widest = hi - lo;
          target = i;
          channel = c;
        }
      }
    });
    if (target < 0 || widest === 0) break;
    const box = boxes[target].sort((a, b) => a[channel] - b[channel]);
    // Split where the value changes nearest the median, so a flat area isn't halved into two identical swatches.
    const v = box[box.length >> 1][channel];
    let mid = box.findIndex((p) => p[channel] >= v);
    if (mid <= 0) mid = box.findIndex((p) => p[channel] > v);
    boxes = [...boxes.slice(0, target), box.slice(0, mid), box.slice(mid), ...boxes.slice(target + 1)];
  }
  // Each box is shown as its most common exact colour, not its average, so a swatch is always a colour that is
  // really in the image (an average of blue and white would invent #8080FF). Identical swatches are merged.
  const merged = new Map<string, { rgb: Rgb; share: number }>();
  for (const box of boxes) {
    if (box.length === 0) continue;
    const counts = new Map<number, number>();
    let best = 0;
    let bestCount = 0;
    for (const p of box) {
      const key = (p[0] << 16) | (p[1] << 8) | p[2];
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      if (n > bestCount) {
        best = key;
        bestCount = n;
      }
    }
    const rgb: Rgb = [best >> 16, (best >> 8) & 255, best & 255];
    const key = rgb.join();
    const prev = merged.get(key);
    merged.set(key, { rgb, share: (prev?.share ?? 0) + box.length / colors.length });
  }
  // Slivers under 1% are usually anti-aliased edges or compression noise, not colours anyone would pick.
  const swatches = [...merged.values()].sort((a, b) => b.share - a.share);
  const significant = swatches.filter((s) => s.share >= 0.01);
  return significant.length ? significant : swatches.slice(0, 1);
}
