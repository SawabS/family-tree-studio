import {isParent} from './model.js';
import {generations, paletteFor, hexToRgb01, cardBorder, avatarBorder, parentCurve, lineStyle} from './branch.js';

export const papers = {A1: [594, 841], A2: [420, 594], A3: [297, 420], A4: [210, 297]};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Card geometry in board units. These numbers mirror the cards on screen (see .node in index.html and chrome.css),
// so a printed card is the same shape and has the same inner layout as the card in the editor.
const W = 194, H = 86, RADIUS = 16, PAD = 13, AVATAR = 44, AVATAR_RADIUS = 13, TEXT_X = PAD + AVATAR + 11, TEXT_W = W - TEXT_X - 22;
const HINT_SIZE = 10, DATES_SIZE = 9, INITIAL_SIZE = 15;

export function bounds(view) {
  if (!view.people.length) return {x: 0, y: 0, w: W, h: H};
  const x = Math.min(...view.people.map(p => p.position.x)), y = Math.min(...view.people.map(p => p.position.y));
  return {x, y, w: Math.max(...view.people.map(p => p.position.x + W)) - x, h: Math.max(...view.people.map(p => p.position.y + H)) - y};
}

export function plan(view, options) {
  let [w, h] = papers[options.paper] || papers.A4;
  if (options.orientation === 'landscape') [w, h] = [h, w];
  const margin = Number(options.margin), fontSize = Number(options.fontSize);
  if (!Number.isFinite(margin) || margin < 5 || margin > 60 || !Number.isFinite(fontSize) || fontSize < 8 || fontSize > 24) throw Error('Invalid poster margins or typography');
  const innerW = w - 2 * margin, innerH = h - 2 * margin - 22, b = bounds(view);
  if (innerW <= 0 || innerH <= 0) throw Error('Margins leave no printable area');
  const fit = Math.min(innerW / b.w, innerH / b.h), scale = options.scaling === 'fit' ? fit : Number(options.scale) * .264583 / 100;
  if (!Number.isFinite(scale) || scale <= 0) throw Error('Invalid scale');
  const cols = Math.max(1, Math.ceil(b.w * scale / innerW - 1e-9)), rows = Math.max(1, Math.ceil(b.h * scale / innerH - 1e-9));
  if (cols * rows > 100) throw Error('This scale would require more than 100 pages. Reduce the scale or use larger paper.');
  return {w, h, margin, fontSize, innerW, innerH, b, scale, cols, rows, count: cols * rows};
}

// Everything a renderer needs to draw the board: curved parent links, partner lines and styled cards.
// Cards carry the same generation colours and the same caption text as the editor.
export function board(view, accent) {
  const byID = new Map(view.people.map(p => [p.id, p])), depth = generations(view), children = new Map();
  const kinds = new Map();
  for (const r of view.relationships || []) if (isParent(r)) kinds.set(r.person1 + '\n' + r.person2, r.type);
  for (const p of view.people) for (const id of p.parents || []) children.set(id, (children.get(id) || 0) + 1);
  const links = [];
  for (const p of view.people) for (const id of p.parents || []) {
    const parent = byID.get(id);
    if (!parent) continue;
    const kind = kinds.get(id + '\n' + p.id) || 'parent-unknown', style = lineStyle(kind), curve = parentCurve(parent, p, W, H);
    links.push({d: curve.d, width: 2.2, color: style.color, dash: style.dash, box: [Math.min(curve.ax, curve.bx), curve.ay, Math.max(curve.ax, curve.bx), curve.by]});
  }
  for (const r of view.relationships || []) {
    if (isParent(r)) continue;
    const a = byID.get(r.person1), b = byID.get(r.person2);
    if (!a || !b) continue;
    const style = lineStyle('partner'), x1 = a.position.x + W / 2, y1 = a.position.y + H / 2, x2 = b.position.x + W / 2, y2 = b.position.y + H / 2;
    links.push({d: `M${x1} ${y1} L${x2} ${y2}`, width: 2, color: style.color, dash: style.dash, box: [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)]});
  }
  const cards = view.people.map(p => {
    const palette = paletteFor(depth.get(p.id), accent);
    return {
      person: p, x: p.position.x, y: p.position.y, palette, border: cardBorder(palette), avatarBorder: avatarBorder(palette),
      initial: Array.from(p.name)[0] || '',
      hint: `${p.gender || 'Unknown'} · ${children.get(p.id) || 0} children`,
      dates: [p.profile?.birthDate, p.profile?.deathDate].filter(Boolean).join(' – '),
      years: [p.profile?.birthDate, p.profile?.deathDate].filter(Boolean).map(d => d.slice(0, 4)).join(' – '),
    };
  });
  return {links, cards};
}

// The page window in board units, so cards and lines that cannot appear on a page are not written to it.
function windowOf(p, row, col) {
  const tx = p.margin - p.b.x * p.scale - col * p.innerW, ty = p.margin + 18 - p.b.y * p.scale - row * p.innerH;
  return {tx, ty, x0: (p.margin - tx) / p.scale, x1: (p.margin + p.innerW - tx) / p.scale, y0: (p.margin + 18 - ty) / p.scale, y1: (p.margin + 18 + p.innerH - ty) / p.scale};
}
const visible = (win, x0, y0, x1, y1, slack = 8) => x1 + slack >= win.x0 && x0 - slack <= win.x1 && y1 + slack >= win.y0 && y0 - slack <= win.y1;

// Names wrap to two lines inside the text column and shrink slightly before they are cut with an ellipsis.
function wrap(text, size, measure, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let rest = Array.from(word);
    while (measure(rest.join(''), size, true) > max && rest.length > 1) {
      let cut = rest.length - 1;
      while (cut > 1 && measure(rest.slice(0, cut).join(''), size, true) > max) cut--;
      if (line) { lines.push(line); line = '' }
      lines.push(rest.slice(0, cut).join(''));
      rest = rest.slice(cut);
    }
    const word2 = rest.join(''), candidate = line ? line + ' ' + word2 : word2;
    if (line && measure(candidate, size, true) > max) { lines.push(line); line = word2 } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
function ellipsize(text, size, measure, max, bold) {
  let chars = Array.from(text);
  if (measure(text, size, bold) <= max) return text;
  while (chars.length && measure(chars.join('') + '…', size, bold) > max) chars.pop();
  return chars.join('') + '…';
}

// Vertical stack of text inside a card: name (up to two lines), caption, then dates when present, centred like the card on screen.
export function cardLayout(card, baseSize, measure) {
  const name = card.person.name.trim();
  const min = Math.max(6, baseSize * .7);
  let size = baseSize, lines = wrap(name, size, measure, TEXT_W);
  while (lines.length > 2 && size - .5 >= min) { size -= .5; lines = wrap(name, size, measure, TEXT_W) }
  if (lines.length > 2) lines = [lines[0], ellipsize(lines.slice(1).join(' '), size, measure, TEXT_W, true)];
  const rows = lines.map(text => ({text, size, bold: true, lead: size * 1.25, gap: 0, color: card.palette.ink}));
  rows.push({text: ellipsize(card.hint, HINT_SIZE, measure, TEXT_W, false), size: HINT_SIZE, bold: false, lead: HINT_SIZE * 1.2, gap: 5, color: card.palette.muted});
  const dates = card.dates && measure(card.dates, DATES_SIZE, false) > TEXT_W ? card.years : card.dates;
  if (dates) rows.push({text: ellipsize(dates, DATES_SIZE, measure, TEXT_W, false), size: DATES_SIZE, bold: false, lead: DATES_SIZE * 1.2, gap: 2, color: card.palette.muted});
  let y = (H - rows.reduce((sum, row) => sum + row.lead + row.gap, 0)) / 2;
  for (const row of rows) { y += row.gap; row.baseline = y + row.lead / 2 + row.size * .35; y += row.lead }
  return rows;
}

// Browser-free text measurement for the SVG preview. It approximates IBM Plex Sans; the PDF uses real font metrics.
export function estimateWidth(text, size, bold) {
  let units = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    units += code > 0x2e80 ? 1 : /[ijl.,;:'|!]/.test(ch) ? .27 : ch === ' ' ? .26 : /[mwMW]/.test(ch) ? .86 : /[A-Z]/.test(ch) ? .64 : /\d/.test(ch) ? .58 : code > 0x590 && code < 0x700 ? .52 : .55;
  }
  return units * size * (bold ? 1.05 : 1);
}

const roundedPath = (x, y, w, h, r) => {
  const k = .5523 * r;
  return `M${x + r} ${y}H${x + w - r}C${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r}V${y + h - r}C${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h}H${x + r}C${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r}V${y + r}C${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y}Z`;
};

const SANS = "IBM Plex Sans, IBM Plex Sans Arabic, sans-serif";
const photoOf = (options, person) => options.photos === 'on' && /^data:image\/jpeg;base64,/.test(person.profile?.photoDataUrl || '') ? person.profile.photoDataUrl : '';

export function preview(view, options) {
  const p = plan(view, options), {links, cards} = board(view, options.accent), family = options.font === 'serif' ? 'serif' : SANS, pages = [];
  const laid = new Map(cards.map(card => [card, cardLayout(card, Number(options.fontSize), estimateWidth)]));
  for (let row = 0; row < p.rows; row++) for (let col = 0; col < p.cols; col++) {
    const win = windowOf(p, row, col), n = pages.length, page = `${row}-${col}`;
    const lines = links.filter(l => visible(win, ...l.box, 4)).map(l => `<path d="${l.d}" fill="none" stroke="${l.color}" stroke-width="${l.width}" stroke-linecap="round"${l.dash ? ` stroke-dasharray="${l.dash.join(' ')}"` : ''}/>`).join('');
    const defs = [];
    const drawn = cards.filter(c => visible(win, c.x, c.y, c.x + W, c.y + H)).map((c, i) => {
      const photo = photoOf(options, c.person), pal = c.palette, ax = c.x + PAD, ay = c.y + (H - AVATAR) / 2;
      let avatar = `<rect x="${ax}" y="${ay}" width="${AVATAR}" height="${AVATAR}" rx="${AVATAR_RADIUS}" fill="${pal.avatar}" stroke="${c.avatarBorder}"/>`;
      if (photo) {
        defs.push(`<clipPath id="avatar${page}-${i}"><rect x="${ax}" y="${ay}" width="${AVATAR}" height="${AVATAR}" rx="${AVATAR_RADIUS}"/></clipPath>`);
        avatar += `<image href="${photo}" x="${ax}" y="${ay}" width="${AVATAR}" height="${AVATAR}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar${page}-${i})"/>`;
      } else avatar += `<text x="${ax + AVATAR / 2}" y="${ay + AVATAR / 2 + INITIAL_SIZE * .35}" text-anchor="middle" font-family="${esc(family)}" font-size="${INITIAL_SIZE}" font-weight="700" fill="${pal.ink}">${esc(c.initial)}</text>`;
      const text = laid.get(c).map(r => `<text x="${c.x + TEXT_X}" y="${c.y + r.baseline}" font-family="${esc(family)}" font-size="${r.size}"${r.bold ? ' font-weight="700"' : ''} fill="${r.color}">${esc(r.text)}</text>`).join('');
      return `<rect x="${c.x}" y="${c.y + 3}" width="${W}" height="${H}" rx="${RADIUS}" fill="#0f2a20" opacity=".12"/><rect x="${c.x}" y="${c.y}" width="${W}" height="${H}" rx="${RADIUS}" fill="${pal.bg}" stroke="${c.border}"/>${avatar}${text}`;
    }).join('');
    pages.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}mm" height="${p.h}mm" viewBox="0 0 ${p.w} ${p.h}" role="img" aria-label="Poster page ${n + 1}"><defs><clipPath id="paper${page}"><rect x="${p.margin}" y="${p.margin + 18}" width="${p.innerW}" height="${p.innerH}"/></clipPath>${defs.join('')}</defs><text x="${p.margin}" y="${p.margin + 7}" font-family="${esc(family)}" font-size="7" font-weight="700" fill="#254b3e">${esc(options.title)}</text><g clip-path="url(#paper${page})"><g transform="translate(${win.tx} ${win.ty}) scale(${p.scale})">${lines}${drawn}</g></g><text x="${p.margin}" y="${p.h - p.margin + 3}" font-family="${esc(family)}" font-size="3.5" fill="#5b7467">Kinship Studio · ${n + 1}/${p.count} · ${view.people.length} people</text></svg>`);
  }
  return {pages, plan: p};
}

// Fonts: the sans option uses IBM Plex Sans, the typeface of the editor, with Plex Arabic and DejaVu Sans as fallbacks
// for scripts and symbols Plex Sans does not cover. Fonts are embedded only when a text actually needs them.
const FONT_CHAINS = {
  'sans-serif': {regular: ['IBMPlexSans-Regular.ttf', 'IBMPlexSansArabic-Regular.ttf', 'DejaVuSans.ttf'], bold: ['IBMPlexSans-Bold.ttf', 'IBMPlexSansArabic-Bold.ttf', 'DejaVuSans.ttf']},
  serif: {regular: ['DejaVuSerif.ttf', 'DejaVuSans.ttf'], bold: ['DejaVuSerif.ttf', 'DejaVuSans.ttf']},
};

// Arabic-script text needs glyphs that only exist after shaping (joined forms, ligatures), and a subset made from the plain
// character map would drop them and print blanks. Fonts that serve such text are therefore embedded whole.
const complexScript = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/;

function fontSet(doc, name, load) {
  const chain = FONT_CHAINS[name] || FONT_CHAINS['sans-serif'], loaded = new Map();
  const get = (file, whole) => {
    const key = file + (whole ? ':whole' : '');
    if (!loaded.has(key)) loaded.set(key, (async () => {
      const bytes = await load(file), font = await doc.embedFont(bytes, {subset: !whole});
      return {font, chars: new Set(font.getCharacterSet())};
    })());
    return loaded.get(key);
  };
  const cache = new Map();
  return async function pick(text, bold) {
    const key = (bold ? 'b' : 'r') + text, whole = complexScript.test(text);
    if (cache.has(key)) return cache.get(key);
    let found = null, missing = null;
    for (const file of chain[bold ? 'bold' : 'regular']) {
      const entry = await get(file, whole);
      missing = Array.from(text).find(ch => !entry.chars.has(ch.codePointAt(0)) && !/[\s\u200b-\u200f]/.test(ch));
      if (!missing) { found = entry.font; break }
    }
    if (!found) throw Error('The bundled font cannot render ' + missing + '. Use a supported character or export SVG.');
    cache.set(key, found);
    return found;
  };
}

const base64Bytes = dataUrl => Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), c => c.charCodeAt(0));

export async function makePDF(view, options) {
  const p = plan(view, options), lib = globalThis.PDFLib;
  if (!lib || !globalThis.fontkit) throw Error('PDF tools unavailable');
  const doc = await lib.PDFDocument.create();
  doc.registerFontkit(globalThis.fontkit);
  const load = async file => {
    const response = await fetch(new URL('../vendor/' + file, import.meta.url));
    if (!response.ok) throw Error('Poster font unavailable');
    return response.arrayBuffer();
  };
  const pick = fontSet(doc, options.font, load), {rgb} = lib, mm = 72 / 25.4, color = hex => rgb(...hexToRgb01(hex));
  const {links, cards} = board(view, options.accent);

  // Choose fonts and lay out every card before any page is written, so an unsupported character stops the export early.
  // The ellipsis is included in each choice because long names may be shortened with it.
  const titleFont = await pick(options.title + '…', true), footerFont = await pick('Kinship Studio · 0123456789/ people', false);
  const prepared = new Map();
  for (const card of cards) {
    const bold = await pick(card.person.name + '…', true), regular = await pick(card.hint + card.dates + '…', false);
    const initial = card.initial ? await pick(card.initial, true) : bold;
    const measure = (text, size, isBold) => (isBold ? bold : regular).widthOfTextAtSize(text, size);
    prepared.set(card, {bold, regular, initial, rows: cardLayout(card, Number(options.fontSize), measure)});
  }

  const photos = new Map();
  if (options.photos === 'on') for (const card of cards) {
    const url = photoOf(options, card.person);
    if (!url) continue;
    try { photos.set(card, await doc.embedJpg(base64Bytes(url))) } catch { /* A photograph that cannot be embedded falls back to the initial. */ }
  }

  doc.setTitle(options.title);
  doc.setCreator('Kinship Studio');
  for (let row = 0; row < p.rows; row++) for (let col = 0; col < p.cols; col++) {
    const page = doc.addPage([p.w * mm, p.h * mm]), win = windowOf(p, row, col), unit = p.scale * mm;
    // Board units to PDF points: (ox, oy) is the board origin on this page and y grows downward on the board.
    const ox = win.tx * mm, oy = (p.h - win.ty) * mm, X = v => ox + v * unit, Y = v => oy - v * unit;
    const titleSize = 18;
    let title = options.title;
    while (titleFont.widthOfTextAtSize(title, titleSize) > p.innerW * mm && title.length) title = title.slice(0, -1);
    if (title !== options.title) title += '…';
    page.drawText(title, {x: p.margin * mm, y: (p.h - p.margin - 7) * mm, size: titleSize, font: titleFont, color: rgb(.14, .29, .23)});
    page.pushOperators(lib.pushGraphicsState(), lib.rectangle(p.margin * mm, (p.h - p.margin - 18 - p.innerH) * mm, p.innerW * mm, p.innerH * mm), lib.clip(), lib.endPath());
    for (const l of links) {
      if (!visible(win, ...l.box, 4)) continue;
      page.drawSvgPath(l.d, {x: ox, y: oy, scale: unit, borderColor: color(l.color), borderWidth: l.width, borderLineCap: lib.LineCapStyle.Round, ...(l.dash ? {borderDashArray: l.dash} : {})});
    }
    for (const card of cards) {
      if (!visible(win, card.x, card.y, card.x + W, card.y + H)) continue;
      const pal = card.palette, at = {x: X(card.x), y: Y(card.y), scale: unit}, set = prepared.get(card);
      page.drawSvgPath(roundedPath(0, 3, W, H, RADIUS), {...at, color: color('#0f2a20'), opacity: .12});
      page.drawSvgPath(roundedPath(0, 0, W, H, RADIUS), {...at, color: color(pal.bg), borderColor: color(card.border), borderWidth: 1});
      page.drawSvgPath(roundedPath(PAD, (H - AVATAR) / 2, AVATAR, AVATAR, AVATAR_RADIUS), {...at, color: color(pal.avatar), borderColor: color(card.avatarBorder), borderWidth: 1});
      const ax = card.x + PAD, ay = card.y + (H - AVATAR) / 2, photo = photos.get(card);
      if (photo) {
        const x = X(ax), y = Y(ay + AVATAR), side = AVATAR * unit, r = AVATAR_RADIUS * unit, c = .5523 * r;
        page.pushOperators(lib.pushGraphicsState(), lib.moveTo(x + r, y), lib.lineTo(x + side - r, y), lib.appendBezierCurve(x + side - r + c, y, x + side, y + r - c, x + side, y + r), lib.lineTo(x + side, y + side - r), lib.appendBezierCurve(x + side, y + side - r + c, x + side - r + c, y + side, x + side - r, y + side), lib.lineTo(x + r, y + side), lib.appendBezierCurve(x + r - c, y + side, x, y + side - r + c, x, y + side - r), lib.lineTo(x, y + r), lib.appendBezierCurve(x, y + r - c, x + r - c, y, x + r, y), lib.closePath(), lib.clip(), lib.endPath());
        const cover = Math.max(side / photo.width, side / photo.height), dw = photo.width * cover, dh = photo.height * cover;
        page.drawImage(photo, {x: x + (side - dw) / 2, y: y + (side - dh) / 2, width: dw, height: dh});
        page.pushOperators(lib.popGraphicsState());
      } else if (card.initial) {
        const size = INITIAL_SIZE * unit;
        page.drawText(card.initial, {x: X(ax + AVATAR / 2) - set.initial.widthOfTextAtSize(card.initial, size) / 2, y: Y(ay + AVATAR / 2 + INITIAL_SIZE * .35), size, font: set.initial, color: color(pal.ink)});
      }
      for (const r of set.rows) page.drawText(r.text, {x: X(card.x + TEXT_X), y: Y(card.y + r.baseline), size: r.size * unit, font: r.bold ? set.bold : set.regular, color: color(r.color)});
    }
    page.pushOperators(lib.popGraphicsState());
    page.drawText(`Kinship Studio · ${row * p.cols + col + 1}/${p.count} · ${view.people.length} people`, {x: p.margin * mm, y: (p.margin - 3) * mm, font: footerFont, size: 9, color: rgb(.35, .45, .4)});
  }
  return doc.save();
}
