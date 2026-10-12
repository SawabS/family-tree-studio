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

// Generations deeper than the ramp keep the lightest tone.
export const paletteFor = depth => GENERATION_PALETTE[Math.max(0, Math.min(GENERATION_PALETTE.length - 1, Math.trunc(Number(depth)) || 0))];

export const hexToRgb01 = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);

// Mix two #rrggbb colours: t = 0 gives a, t = 1 gives b.
export const mixHex = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');

// Card and avatar outlines are derived from the card colours so the printed result matches the screen.
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
    + `@keyframes kin-arrive{0%{border-color:var(--flow);box-shadow:var(--arrive-peak)}${Math.min(arrive, 99)}%{border-color:var(--arrive-border);box-shadow:var(--arrive-rest)}100%{border-color:var(--arrive-border);box-shadow:var(--arrive-rest)}}`
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
