// Launch Radar dashboard: board, detail view, model panel, live comparables.
// Static page, no network: all data arrives in ../data.js as window.RADAR.
// Routes are hash-based so each view can be screenshotted on its own:
//   (empty)        the ranked board
//   #/p/<slug>     one protocol's detail view, with its farm plan
//   #/f/<category> the board filtered to one category

const D = window.RADAR;
const $ = (id) => document.getElementById(id);

function money(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n;
}
function pct(v) {
  if (v === null || v === undefined) return '—';
  const s = (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  return '<span class="' + (v >= 0 ? 'up' : 'down') + '">' + s + '</span>';
}
function ageText(days) {
  if (days === null || days === undefined) return '—';
  if (days < 365) return Math.round(days / 30) + ' mo';
  return (days / 365).toFixed(1) + ' y';
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderStats() {
  $('asOf').textContent = 'Snapshot ' + D.as_of + ' · ' + D.board_size + ' pre-token protocols ranked';
  $('srcLine').textContent = 'Source: DefiLlama protocols';
  $('footAsOf').textContent = D.as_of;
  $('globalMult').textContent = D.global_multiple.toFixed(3);
  const top = D.rows[0];
  $('stats').innerHTML =
    stat(money(top.implied_value_usd), 'Top implied value — ' + top.name) +
    stat(String(D.watchlist_size), 'Watchlist protocols covered (all of them)') +
    stat(String(D.early_size), 'Early finds below the $50M floor') +
    stat(String(D.live_size), 'Live-token comparables priced by the market');
  function stat(b, s) { return '<div class="stat"><b>' + esc(b) + '</b><span>' + esc(s) + '</span></div>'; }
}

function fillSelects() {
  const cats = [...new Set(D.rows.map((r) => r.category).filter(Boolean))].sort();
  for (const c of cats) $('cat').append(new Option(c, c));
  const chains = [...new Set(D.rows.flatMap((r) => r.chains))].sort();
  for (const c of chains) $('chain').append(new Option(c, c));
}

let sortKey = 'rank';
function filtered() {
  const q = $('q').value.trim().toLowerCase();
  const cat = $('cat').value, chain = $('chain').value, minTvl = +$('minTvl').value;
  let rows = D.rows.filter((r) =>
    (!q || r.name.toLowerCase().includes(q) || r.slug.includes(q)) &&
    (!cat || r.category === cat) &&
    (!chain || r.chains.includes(chain)) &&
    r.tvl_usd >= minTvl);
  const by = {
    rank: (a, b) => a.rank - b.rank,
    tvl: (a, b) => b.tvl_usd - a.tvl_usd,
    growth: (a, b) => (b.change_7d ?? -1e9) - (a.change_7d ?? -1e9),
    age: (a, b) => (b.age_days ?? -1) - (a.age_days ?? -1),
  };
  rows.sort(by[sortKey] || by.rank);
  return rows;
}

function renderBoard() {
  const rows = filtered();
  $('count').textContent = rows.length + ' matching · top 60 shown';
  $('rows').innerHTML = rows.slice(0, 60).map((r) => '<tr data-slug="' + esc(r.slug) + '">' +
    '<td>' + r.rank + '</td>' +
    '<td><strong>' + esc(r.name) + '</strong><br><span class="dim small">' + esc(r.slug) + '</span> <span class="badge">PRE-TOKEN</span></td>' +
    '<td>' + esc(r.category || '—') + '</td>' +
    '<td>' + r.chains.slice(0, 3).map((c) => '<span class="tag">' + esc(c) + '</span>').join('') + '</td>' +
    '<td class="num">' + money(r.tvl_usd) + '</td>' +
    '<td class="num">' + pct(r.change_7d) + '</td>' +
    '<td class="num">' + ageText(r.age_days) + '</td>' +
    '<td class="num"><strong>' + money(r.implied_value_usd) + '</strong></td></tr>').join('');
  for (const tr of document.querySelectorAll('#rows tr')) {
    tr.addEventListener('click', () => { location.hash = '#/p/' + tr.dataset.slug; });
  }
}

function renderDetail(slug) {
  const r = D.rows.find((x) => x.slug === slug);
  if (!r) { showView('board'); return; }
  const steps = r.farm_steps.map((s) => {
    const m = s.match(/^(.*) Cost: (.*)\. Time: (.*)\.$/);
    if (!m) return '<li>' + esc(s) + '</li>';
    return '<li>' + esc(m[1]) + '<br><span class="cost">Cost: ' + esc(m[2]) + ' · Time: ' + esc(m[3]) + '</span></li>';
  }).join('');
  $('detail').innerHTML = '<div class="detail-card">' +
    '<h2>#' + r.rank + ' ' + esc(r.name) + '</h2>' +
    '<p><span class="badge">PRE-TOKEN</span> ' + esc(r.category || 'Uncategorised') + ' · ' +
    r.chains.map((c) => '<span class="tag">' + esc(c) + '</span>').join('') +
    ' · tracked since ' + esc(r.listed_at || 'unknown date') + '</p>' +
    '<div class="math">' +
    '<div><b>' + money(r.tvl_usd) + '</b><span>TVL</span></div>' +
    '<div><b>× ' + r.category_multiple.toFixed(3) + '</b><span>category multiple (' + esc(r.category || 'global') + ')</span></div>' +
    '<div><b>× ' + r.growth_multiplier.toFixed(2) + '</b><span>growth (' + (r.change_7d === null ? 'n/a' : r.change_7d.toFixed(1) + '% in 7d') + ')</span></div>' +
    '<div><b>× ' + r.age_multiplier.toFixed(2) + '</b><span>age (' + ageText(r.age_days) + ' with no token)</span></div>' +
    '<div><b>' + money(r.implied_value_usd) + '</b><span>implied value</span></div></div>' +
    '<p class="dim">Implied value = ' + money(r.tvl_usd) + ' × ' + r.category_multiple.toFixed(3) + ' × ' +
    r.growth_multiplier.toFixed(2) + ' × ' + r.age_multiplier.toFixed(2) + ' = ' + money(r.implied_value_usd) +
    '. The snapshot records no token for this protocol; that is a record, not proof it has none.</p>' +
    '<h3>How to farm it</h3><ol class="steps">' + steps + '</ol></div>';
  showView('detail');
}

function renderModel() {
  $('multRows').innerHTML = D.multiples.map((m) =>
    '<tr><td>' + esc(m.category) + '</td><td class="num">' + m.multiple.toFixed(3) + '</td><td class="num">' + m.samples + '</td></tr>').join('');
  $('liveRows').innerHTML = D.live.map((p) =>
    '<tr><td><strong>' + esc(p.name) + '</strong></td><td>' + esc(p.category || '—') + '</td>' +
    '<td class="num">' + money(p.tvl_usd) + '</td><td class="num">' + money(p.mcap_usd) + '</td>' +
    '<td class="num">' + p.mcap_tvl.toFixed(3) + '</td></tr>').join('');
}

function showView(name) {
  for (const v of ['board', 'detail', 'model', 'live']) $('view-' + v).classList.toggle('hidden', v !== name);
  for (const b of document.querySelectorAll('#views button')) b.classList.toggle('active', b.dataset.view === (name === 'detail' ? 'board' : name));
}

function route() {
  const h = location.hash || '';
  const detail = h.match(/^#\/p\/(.+)$/);
  if (detail) { renderDetail(decodeURIComponent(detail[1])); return; }
  const filt = h.match(/^#\/f\/(.+)$/);
  if (filt) {
    const cat = decodeURIComponent(filt[1]);
    if ([...$('cat').options].some((o) => o.value === cat)) $('cat').value = cat;
    renderBoard(); showView('board'); return;
  }
  renderBoard(); showView('board');
}

for (const id of ['q', 'cat', 'chain', 'minTvl', 'sort']) {
  $(id).addEventListener('input', () => { if (id === 'sort') sortKey = $('sort').value; renderBoard(); });
}
document.querySelectorAll('#board thead th').forEach((th) => {
  th.addEventListener('click', () => {
    const map = { rank: 'rank', tvl: 'tvl', growth: 'growth', age: 'age' };
    if (map[th.dataset.k]) { sortKey = map[th.dataset.k]; $('sort').value = sortKey; renderBoard(); }
  });
});
for (const b of document.querySelectorAll('#views button')) {
  b.addEventListener('click', () => {
    location.hash = '';
    if (b.dataset.view === 'model') { renderModel(); showView('model'); }
    else if (b.dataset.view === 'live') { renderModel(); showView('live'); }
    else showView('board');
  });
}
$('back').addEventListener('click', () => { location.hash = ''; route(); });
window.addEventListener('hashchange', route);

renderStats();
fillSelects();
renderModel();
route();
