// Pure helpers shared by the canvas, the SVG poster preview and the PDF export.
// Nothing here touches the DOM, so every rule can be unit tested in Node.

// Card colours by generation: roots are the darkest forest green and each later generation is lighter.
// Each entry is [card, text, secondary text, avatar]. The text colours are chosen so that every step
// keeps a contrast ratio above 4.5:1 against its card (checked in tests/branch.test.mjs).
const RAMP = [
  ['#123023', '#f3faf6', '#879991', '#385247'],
  ['#1c4a34', '#f3faf6', '#a1b7ac', '#416855'],
  ['#276342', '#f3faf6', '#c2d6cb', '#487b5f'],
  ['#327b50', '#f3faf6', '#ebf5ef', '#367e53'],
  ['#4bb470', '#0b2018', '#173b28', '#409b61'],
  ['#70c289', '#0b2018', '#254a35', '#5fa676'],
  ['#95d0a3', '#0b2018', '#345542', '#7eb28b'],
  ['#b5debd', '#0b2018', '#415d4d', '#98bea1'],
  ['#d5ecd8', '#0b2018', '#54695d', '#b3c9b7'],
  ['#eef7ef', '#0b2018', '#61726a', '#c7d2ca'],
];
export const GENERATION_PALETTE = RAMP.map(([bg, ink, muted, avatar]) => Object.freeze({ bg, ink, muted, avatar }));

export const hexToRgb01 = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);

// Mix two #rrggbb colours: t = 0 gives a, t = 1 gives b.
export const mixHex = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');

// Card and avatar outlines are derived from the card colours so the printed result matches the screen.

const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
function hsl(h, sat, light) {
  sat /= 100; light /= 100;
  const k = n => (n + h / 30) % 12, a = sat * Math.min(light, 1 - light), f = n => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return toHex(f(0), f(8), f(4));
}
const rgbToHsl = hex => {
  const [r, g, b] = hexToRgb01(hex), max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  return { s: d ? d / (1 - Math.abs(2 * l - 1)) * 100 : 0, l: l * 100 };
};
const luminance = hex => { const [r, g, b] = hexToRgb01(hex).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b };
export const contrastRatio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) };

// Other accents reuse the lightness and softness of the green ramp and change only the hue, so every accent
// has the same depth cues. Text colours are then derived from each card so contrast stays above 4.5:1.
function rampFor(hue) {
  return RAMP.map(([bg]) => {
    const { s, l } = rgbToHsl(bg), card = hsl(hue, Math.min(s, 46), l);
    const light = hsl(hue, 30, 96), dark = hsl(hue, 45, 9);
    const ink = contrastRatio(light, card) >= contrastRatio(dark, card) ? light : dark;
    let muted = ink; for (let t = 0.5; t >= 0; t -= 0.02) { const m = mixHex(ink, card, t); if (contrastRatio(m, card) >= 4.6) { muted = m; break } }
    let avatar = card; for (let t = 0.2; t >= 0; t -= 0.02) { const a = mixHex(card, ink, t); if (contrastRatio(ink, a) >= 4.6) { avatar = a; break } }
    return Object.freeze({ bg: card, ink, muted, avatar });
  });
}

// Seven pastel accents, one per colour of the rainbow. Green is the original hand tuned ramp.
const ACCENT_DEFS = [
  ['rose', 'Rose', 350], ['apricot', 'Apricot', 24], ['lemon', 'Lemon', 48], ['green', 'Green', 150],
  ['sky', 'Sky', 207], ['periwinkle', 'Periwinkle', 236], ['lavender', 'Lavender', 276],
];
export const ACCENTS = Object.freeze(ACCENT_DEFS.map(([id, name, hue]) => {
  const palette = id === 'green' ? GENERATION_PALETTE : rampFor(hue);
  const flow = id === 'green' ? ['#8df2c0', '#5fd9a4', '#12a56b', '#1a8a5c'] : [hsl(hue, 78, 78), hsl(hue, 60, 66), hsl(hue, 62, 36), hsl(hue, 58, 31)];
  return Object.freeze({ id, name, hue, palette, swatch: palette[4].bg, flow: flow[0], line: flow[1], flowLight: flow[2], lineLight: flow[3] });
}));
export const DEFAULT_ACCENT = 'green';
export const accentOf = id => ACCENTS.find(a => a.id === id) || ACCENTS.find(a => a.id === DEFAULT_ACCENT);

// Generations deeper than the ramp keep the lightest tone.
export const paletteFor = (depth, accent = DEFAULT_ACCENT) => {
  const ramp = accentOf(accent).palette;
  return ramp[Math.max(0, Math.min(ramp.length - 1, Math.trunc(Number(depth)) || 0))];
};

// CSS for the glow, line and arrival colours of an accent in both themes.
export const accentCSS = a => {
  const rgba = (hex, al) => hex + Math.round(al * 255).toString(16).padStart(2, '0');
  const block = (f, l) => `--flow:${f};--flow-soft:${rgba(f, .4)};--flow-glow:${rgba(f, .7)};--branch-line:${l};--arrive-peak:0 0 0 3px ${rgba(f, .8)},0 0 30px 4px ${rgba(f, .67)};--arrive-rest:0 0 0 2px ${rgba(f, .4)},0 0 12px ${rgba(f, .33)}`;
  return `:root{${block(a.flow, a.line)}}:root[data-theme="light"]{${block(a.flowLight, a.lineLight)}}`;
};

export const cardBorder = c => mixHex(c.bg, c.ink, 0.24);
export const avatarBorder = c => mixHex(c.avatar, c.ink, 0.28);

// Generation depth: the longest chain of parents above each person, the same rule used by the layout.
// Kahn's algorithm keeps this iterative, so a 5,000 generation chain cannot overflow the call stack.
export function generations(view) {
  const ids = new Set(view.people.map(p => p.id)), children = new Map(), remaining = new Map(), depth = new Map();
  for (const p of view.people) { children.set(p.id, []); depth.set(p.id, 0) }
  for (const p of view.people) {
    const parents = (p.parents || []).filter(id => ids.has(id));
    remaining.set(p.id, parents.length);
    for (const id of parents) children.get(id).push(p.id);
  }
  const queue = view.people.filter(p => !remaining.get(p.id)).map(p => p.id);
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    for (const child of children.get(id)) {
      depth.set(child, Math.max(depth.get(child), depth.get(id) + 1));
      remaining.set(child, remaining.get(child) - 1);
      if (!remaining.get(child)) queue.push(child);
    }
  }
  return depth;
}

export function childMap(view) {
  const children = new Map(view.people.map(p => [p.id, []]));
  for (const p of view.people) for (const id of p.parents || []) children.get(id)?.push(p.id);
  return children;
}

// A selected person together with every descendant. levels maps each id to its distance from the root
// (0 for the selected person); depth is the largest distance; edges counts parent links inside the branch.
// Biological, adoptive, guardian and other parent links all count, and shared children appear once.
export function branchOf(view, rootId, children = childMap(view)) {
  const levels = new Map();
  if (!children.has(rootId)) return { ids: new Set(), levels, depth: 0, edges: 0 };
  levels.set(rootId, 0);
  const queue = [rootId];
  let depth = 0, edges = 0;
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    for (const child of children.get(id)) {
      edges++;
      if (levels.has(child)) continue;
      levels.set(child, levels.get(id) + 1);
      depth = Math.max(depth, levels.get(child));
      queue.push(child);
    }
  }
  return { ids: new Set(levels.keys()), levels, depth, edges };
}

// Energy flow timing. Light travels one generation per slot, then the whole branch rests before repeating.
export const FLOW = Object.freeze({ slot: 0.6, rest: 1.4, cap: 24, maxAnimatedEdges: 150 });

export function flowPlan(depth) {
  const steps = Math.max(1, Math.min(Math.trunc(depth) || 0, FLOW.cap));
  const cycle = +((steps + FLOW.rest) * FLOW.slot).toFixed(3);
  return { steps, cycle, fraction: FLOW.slot / cycle };
}

const modulo = (value, size) => ((value % size) + size) % size;

// Negative animation delays place every edge at the right moment of a shared clock, so the wave keeps its
// rhythm when the lines are redrawn (for example while a card is dragged). Edge level 0 leaves the selected card.
export function edgeDelay(plan, level, now = 0) {
  return +(-modulo(now - (level % plan.steps) * FLOW.slot, plan.cycle)).toFixed(3) + 0;
}

// A card at level L lights up when the pulse on its incoming edge (level L - 1) arrives.
export function arrivalDelay(plan, level, now = 0) {
  return +(-modulo(now - (((level - 1) % plan.steps) + 1) * FLOW.slot, plan.cycle)).toFixed(3) + 0;
}

export function flowCSS(plan) {
  const pulse = +(plan.fraction * 100).toFixed(3), arrive = +(plan.fraction * 100 * 1.8).toFixed(3);
  return `@keyframes kin-flow{0%{stroke-dashoffset:14}${pulse}%{stroke-dashoffset:-100}100%{stroke-dashoffset:-100}}`
    + `@keyframes kin-arrive{0%{box-shadow:var(--arrive-peak)}${Math.min(arrive, 99)}%{box-shadow:var(--arrive-rest)}100%{box-shadow:var(--arrive-rest)}}`
    + `#world{--flow-cycle:${plan.cycle}s}`;
}

// Relationship line styling shared by the canvas, SVG preview and PDF so printed lines match the screen.
export const LINE_STYLE = Object.freeze({
  biological: { color: '#7aa690', dash: null },
  adoptive: { color: '#af945f', dash: [6, 4] },
  guardian: { color: '#927bb1', dash: [6, 4] },
  other: { color: '#7aa690', dash: [6, 4] },
  partner: { color: '#d69ab8', dash: [6, 6] },
});
export const lineStyle = kind => ['adoptive', 'guardian', 'biological'].includes(kind) ? LINE_STYLE[kind] : LINE_STYLE.other;

// Curve control values shared by every renderer: a vertical cubic from the bottom of the parent to the top of the child.
export function parentCurve(parent, child, width = 194, height = 86) {
  const ax = parent.position.x + width / 2, ay = parent.position.y + height, bx = child.position.x + width / 2, by = child.position.y;
  const dy = Math.max(35, (by - ay) / 2);
  return { ax, ay, bx, by, dy, d: `M${ax} ${ay} C${ax} ${ay + dy} ${bx} ${by - dy} ${bx} ${by}` };
}
