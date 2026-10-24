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
    const mid = box.length >> 1;
    boxes = [...boxes.slice(0, target), box.slice(0, mid), box.slice(mid), ...boxes.slice(target + 1)];
  }
  return boxes
    .filter((b) => b.length > 0)
    .map((box) => {
      const sum = box.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
      return { rgb: sum.map((v) => Math.round(v / box.length)) as Rgb, share: box.length / colors.length };
    })
    .sort((a, b) => b.share - a.share);
}
