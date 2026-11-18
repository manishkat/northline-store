/* NORTHLINE store admin — edits products.json in the GitHub repo through the GitHub API. */
(function () {
'use strict';
const S = window.STORE, G = S.github;
const API = `https://api.github.com/repos/${G.owner}/${G.repo}/contents/`;
const root = document.getElementById('root');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SIZESETS = { 'Women XS–XL': ['XS', 'S', 'M', 'L', 'XL'], 'Men S–XXL': ['S', 'M', 'L', 'XL', 'XXL'], 'Shoes 36–44': ['36', '37', '38', '39', '40', '41', '42', '43', '44'], 'One size': ['One size'] };

let token = sessionStorage.getItem('nl-admin-token') || localStorage.getItem('nl-admin-token') || '';
let DATA = null, SHA = null, dirty = false, tab = 'products', q = '', fcat = '', msg = null;

/* ---------- GitHub helpers ---------- */
const b64ToText = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), c => c.charCodeAt(0)));
const textToB64 = t => { const bytes = new TextEncoder().encode(t); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
async function gh(path, opts = {}) {
  const r = await fetch(API + path + (opts.method ? '' : `?ref=${G.branch}&t=${Date.now()}`), {
    method: opts.method || 'GET',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.message || ('GitHub error ' + r.status)); e.status = r.status; throw e; }
  return j;
}
async function load() {
  const j = await gh('products.json');
  SHA = j.sha; DATA = JSON.parse(b64ToText(j.content)); dirty = false;
}
async function publish() {
  const btn = document.getElementById('publish'); if (btn) { btn.disabled = true; btn.textContent = 'Publishing…'; }
  try {
    const j = await gh('products.json', { method: 'PUT', body: { message: 'Update products from store admin', content: textToB64(JSON.stringify(DATA, null, 1)), sha: SHA, branch: G.branch } });
    SHA = j.content.sha; dirty = false;
    msg = ['ok', 'Published! Your live store will show the changes within about 1 minute.'];
  } catch (e) {
    msg = ['err', e.status === 409 ? 'Someone else changed the products since you loaded them. Click “Reload” and redo your change.' : 'Could not publish: ' + e.message];
  }
  render();
}
async function uploadImage(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', 0.85);
  const name = 'images/' + (file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'photo') + '-' + Date.now() + '.jpg';
  await gh(name, { method: 'PUT', body: { message: 'Upload product photo ' + name, content: dataUrl.split(',')[1], branch: G.branch } });
  return name;
}

/* ---------- views ---------- */
function loginView(err) {
  root.innerHTML = `<div class="wrap"><div class="card login">
   <h1>Store owner sign-in</h1><p class="hint">Manage products for <b>${esc(G.owner)}/${esc(G.repo)}</b>. Changes go live on your website.</p>
   ${err ? `<div class="msg err" style="margin-top:14px">${esc(err)}</div>` : ''}
   <p style="margin-top:16px"><b>First time? Create your admin key (2 minutes):</b></p>
   <ol><li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → New fine-grained token</a> (sign in as <b>${esc(G.owner)}</b>).</li>
   <li>Name: <i>Store admin</i>. Expiration: up to 1 year.</li>
   <li>Repository access: <b>Only select repositories</b> → <b>${esc(G.repo)}</b>.</li>
   <li>Permissions → Repository permissions → <b>Contents: Read and write</b>.</li>
   <li>Click <b>Generate token</b>, copy it and paste it below. Keep it private, like a password.</li></ol>
   <form id="lf" style="display:flex;flex-direction:column;gap:12px">
    <label>Admin key (GitHub token)<input type="password" id="tok" required autocomplete="off" placeholder="github_pat_…"></label>
    <label class="chk"><input type="checkbox" id="rem"> Keep me signed in on this device</label>
    <button class="btn" type="submit">Sign in</button></form>
   <p class="hint" style="margin-top:14px">Your key stays in this browser only and is sent only to GitHub. <a href="./">← Back to store</a></p></div></div>`;
  document.getElementById('lf').onsubmit = async e => {
    e.preventDefault(); token = document.getElementById('tok').value.trim();
    const rem = document.getElementById('rem').checked;
    e.target.querySelector('button').textContent = 'Signing in…';
    try { await load(); (rem ? localStorage : sessionStorage).setItem('nl-admin-token', token); render(); }
    catch (er) { token = ''; loginView(er.status === 401 ? 'That key was not accepted. Check you copied all of it.' : er.status === 404 ? `The key works but can’t see ${G.repo}/products.json. Check “Repository access” and “Contents: Read and write”.` : er.message); }
  };
}
function signOut() { if (dirty && !window.confirm('You have unpublished changes. Sign out anyway?')) return; sessionStorage.removeItem('nl-admin-token'); localStorage.removeItem('nl-admin-token'); token = ''; DATA = null; loginView(); }

function render() {
  if (!DATA) return loginView();
  const P = DATA.products;
  const cats = DATA.categories;
  const top = `<div class="top"><b>NORTHLINE · ADMIN</b><div class="r">${dirty ? '<span class="dirty">Unpublished changes</span>' : ''}
   <button class="btn green" id="publish" ${dirty ? '' : 'disabled'}>Publish changes</button>
   <a class="btn ghost" href="./" target="_blank" rel="noopener">View store ↗</a><button class="btn ghost" id="reload">Reload</button><button class="btn ghost" id="out">Sign out</button></div></div>`;
  const m = msg ? `<div class="msg ${msg[0]}">${esc(msg[1])}</div>` : ''; msg = null;
  let body = '';
  if (tab === 'products') {
    const list = P.filter(p => (!fcat || p.category === fcat) && (!q || (p.name + ' ' + p.subcategory + ' ' + p.colour).toLowerCase().includes(q.toLowerCase())));
    body = `<div class="stat"><div><b>${P.length}</b>Products</div><div><b>${P.filter(p => !p.hidden).length}</b>Visible</div><div><b>${P.filter(p => p.salePrice).length}</b>On sale</div><div><b>${P.filter(p => (p.soldOut || []).length >= p.sizes.length).length}</b>Fully sold out</div></div>
    <div class="bar"><input type="text" id="q" placeholder="Search products…" value="${esc(q)}"><select id="fcat"><option value="">All categories</option>${cats.map(c => `<option value="${c.id}" ${fcat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button class="btn" id="addp">+ Add product</button></div>
    <div class="card" style="padding:0;overflow:auto"><table><thead><tr><th></th><th>Product</th><th class="hide-m">Category</th><th>Price</th><th class="hide-m">Stock</th><th></th></tr></thead><tbody>
    ${list.map(p => `<tr><td><img src="${esc(thumb(p.images[0]))}" alt=""></td><td><b>${esc(p.name)}</b><div class="hint">${esc(p.colour)} · #${p.id}</div><div>${p.isNew ? '<span class="tag new">New</span>' : ''}${p.salePrice ? '<span class="tag sale">Sale</span>' : ''}${p.hidden ? '<span class="tag hid">Hidden</span>' : ''}</div></td>
     <td class="hide-m">${esc((cats.find(c => c.id === p.category) || {}).name || p.category)}<div class="hint">${esc(p.subcategory)}</div></td>
     <td>${p.salePrice ? `<s class="hint">$${p.price}</s> <b style="color:#b00020">$${p.salePrice}</b>` : '$' + p.price}</td>
     <td class="hide-m">${(p.soldOut || []).length ? `<span class="hint">Out: ${esc(p.soldOut.join(', '))}</span>` : '<span class="hint">All sizes</span>'}</td>
     <td><div class="acts"><button class="btn out" data-edit="${p.id}">Edit</button><button class="btn out" data-dup="${p.id}">Copy</button><button class="btn red" data-del="${p.id}">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="hint" style="padding:30px;text-align:center">No products found.</td></tr>'}
    </tbody></table></div>`;
  } else if (tab === 'home') {
    body = `<div class="card"><h2 style="font-size:16px;margin-bottom:6px">Homepage slideshow</h2><p class="hint">The big images at the top of your homepage. Drag order with ↑ ↓.</p>
     ${DATA.hero.map((h, i) => `<div class="slide"><img src="${esc(thumb(h.image))}" alt=""><div class="row">
      <label>Image URL<input type="url" data-h="${i}" data-k="image" value="${esc(h.image)}"></label><label>Title<input type="text" data-h="${i}" data-k="title" value="${esc(h.title)}"></label>
      <label>Subtitle<input type="text" data-h="${i}" data-k="subtitle" value="${esc(h.subtitle)}"></label><label>Button text<input type="text" data-h="${i}" data-k="button" value="${esc(h.button)}"></label>
      <label>Button goes to<select data-h="${i}" data-k="link">${linkOpts(h.link)}</select></label>
      <div class="acts" style="align-items:end"><button class="btn out" data-hm="${i}" data-d="-1">↑</button><button class="btn out" data-hm="${i}" data-d="1">↓</button><button class="btn red" data-hdel="${i}">Remove</button></div></div></div>`).join('')}
     <div style="margin-top:14px"><button class="btn" id="addslide">+ Add slide</button></div></div>
     <div class="card" style="margin-top:16px"><h2 style="font-size:16px;margin-bottom:6px">Category images</h2><p class="hint">Shown in “Shop by category”.</p>
     ${cats.map((c, i) => `<div class="slide"><img src="${esc(thumb(c.image))}" alt=""><div class="row"><label>Name<input type="text" data-c="${i}" data-k="name" value="${esc(c.name)}"></label><label>Image URL<input type="url" data-c="${i}" data-k="image" value="${esc(c.image)}"></label></div></div>`).join('')}</div>`;
  } else {
    body = `<div class="card"><h2 style="font-size:16px;margin-bottom:10px">Orders &amp; payments</h2>
     <p>Orders are paid through PayPal. Every paid order — with the buyer’s name, email, delivery address, items, sizes and SKUs — appears in your PayPal account.</p>
     <p style="margin-top:12px"><a class="btn" href="https://www.paypal.com/activities" target="_blank" rel="noopener">Open PayPal activity ↗</a> <a class="btn out" href="https://www.sandbox.paypal.com/activities" target="_blank" rel="noopener">Test (sandbox) orders ↗</a></p>
     <p class="hint" style="margin-top:14px">Payment mode: <b>${S.paypalClientId === 'sb' ? 'TEST — no real money' : 'LIVE'}</b>. To switch to live payments, edit <code>paypalClientId</code> in <code>config.js</code> on GitHub.</p>
     <p class="hint" style="margin-top:8px">Tip: check each order total in PayPal against your prices before shipping.</p></div>
     <div class="card" style="margin-top:16px"><h2 style="font-size:16px;margin-bottom:10px">Backup</h2><p class="hint">Download a copy of all your products.</p><p style="margin-top:10px"><button class="btn out" id="backup">Download products.json</button></p></div>`;
  }
  root.innerHTML = top + `<div class="wrap">${m}<div class="tabs"><button class="tab ${tab === 'products' ? 'on' : ''}" data-tab="products">Products</button><button class="tab ${tab === 'home' ? 'on' : ''}" data-tab="home">Homepage</button><button class="tab ${tab === 'orders' ? 'on' : ''}" data-tab="orders">Orders</button></div>${body}</div><div class="overlay" id="ov"></div>`;
  bind();
}
const thumb = s => !s ? '' : s.includes('images.unsplash.com') ? s.replace(/w=\d+/, 'w=200') : s;
const linkOpts = cur => [['#shop-new', 'New in'], ['#shop-sale', 'Sale'], ['#shop-all', 'All products'], ...DATA.categories.map(c => ['#shop-' + c.id, c.name])].map(([v, t]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${esc(t)}</option>`).join('');
const change = () => { dirty = true; const t = document.querySelector('.top .r'); if (t && !t.querySelector('.dirty')) { t.insertAdjacentHTML('afterbegin', '<span class="dirty">Unpublished changes</span>'); } const pb = document.getElementById('publish'); if (pb) pb.disabled = false; };

function bind() {
  const $ = id => document.getElementById(id);
  $('publish').onclick = publish;
  $('out').onclick = signOut;
  $('reload').onclick = async () => { if (dirty && !window.confirm('Discard unpublished changes?')) return; try { await load(); msg = ['info', 'Reloaded the latest products from GitHub.']; } catch (e) { msg = ['err', e.message]; } render(); };
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
  if (tab === 'products') {
    $('q').oninput = e => { q = e.target.value; const pos = e.target.selectionStart; render(); const n = $('q'); n.focus(); n.setSelectionRange(pos, pos); };
    $('fcat').onchange = e => { fcat = e.target.value; render(); };
    $('addp').onclick = () => editor(null);
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editor(+b.dataset.edit));
    document.querySelectorAll('[data-dup]').forEach(b => b.onclick = () => { const p = DATA.products.find(x => x.id === +b.dataset.dup); const c = JSON.parse(JSON.stringify(p)); c.id = nextId(); c.name += ' (copy)'; c.hidden = true; DATA.products.unshift(c); change(); msg = ['info', `Copied “${p.name}”. The copy is hidden until you edit and show it.`]; render(); });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const p = DATA.products.find(x => x.id === +b.dataset.del); if (!window.confirm(`Delete “${p.name}”? You can still undo this by clicking Reload before publishing.`)) return; DATA.products = DATA.products.filter(x => x !== p); change(); render(); });
  } else if (tab === 'home') {
    document.querySelectorAll('[data-h]').forEach(i => i.onchange = () => { DATA.hero[+i.dataset.h][i.dataset.k] = i.value; change(); if (i.dataset.k === 'image') render(); });
    document.querySelectorAll('[data-c]').forEach(i => i.onchange = () => { DATA.categories[+i.dataset.c][i.dataset.k] = i.value; change(); if (i.dataset.k === 'image') render(); });
    document.querySelectorAll('[data-hm]').forEach(b => b.onclick = () => { const i = +b.dataset.hm, j = i + +b.dataset.d; if (j < 0 || j >= DATA.hero.length) return; [DATA.hero[i], DATA.hero[j]] = [DATA.hero[j], DATA.hero[i]]; change(); render(); });
    document.querySelectorAll('[data-hdel]').forEach(b => b.onclick = () => { if (DATA.hero.length <= 1) return alert('Keep at least one slide.'); DATA.hero.splice(+b.dataset.hdel, 1); change(); render(); });
    $('addslide').onclick = () => { DATA.hero.push({ image: DATA.categories[0].image, title: 'New slide', subtitle: '', link: '#shop-new', button: 'Shop now' }); change(); render(); };
  } else {
    $('backup').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(DATA, null, 1)], { type: 'application/json' })); a.download = 'products-backup.json'; a.click(); };
  }
}
const nextId = () => Math.max(0, ...DATA.products.map(p => p.id)) + 1;

/* ---------- product editor ---------- */
function editor(id) {
  const isNew = id == null;
  const p = isNew ? { id: nextId(), name: '', category: DATA.categories[0].id, subcategory: '', price: '', salePrice: null, colour: '', colourHex: '#000000', sizes: SIZESETS['Women XS–XL'].slice(), soldOut: [], images: [], description: '', isNew: true, hidden: false, credit: '' }
                  : JSON.parse(JSON.stringify(DATA.products.find(x => x.id === id)));
  const subs = [...new Set(DATA.products.map(x => x.subcategory).filter(Boolean))];
  const ov = document.getElementById('ov');
  const draw = (err) => {
    ov.innerHTML = `<div class="panel"><h2>${isNew ? 'Add product' : 'Edit product'}<button class="btn out" data-x>✕</button></h2>
     ${err ? `<div class="msg err">${esc(err)}</div>` : ''}
     <div class="row"><label style="grid-column:1/-1">Product name *<input type="text" id="e-name" value="${esc(p.name)}" placeholder="e.g. Linen Blazer"></label></div>
     <div class="row"><label>Category *<select id="e-cat">${DATA.categories.map(c => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <label>Sub-category<input type="text" id="e-sub" list="subs" value="${esc(p.subcategory)}" placeholder="e.g. Dresses"><datalist id="subs">${subs.map(s => `<option value="${esc(s)}">`).join('')}</datalist></label>
      <label>Price (AUD) *<input type="number" id="e-price" min="0" step="0.01" value="${esc(p.price)}"></label>
      <label>Sale price (optional)<input type="number" id="e-sale" min="0" step="0.01" value="${esc(p.salePrice || '')}" placeholder="Leave empty if not on sale"></label></div>
     <div class="row"><label>Colour name<input type="text" id="e-col" value="${esc(p.colour)}" placeholder="e.g. Black"></label><label>Colour swatch<input type="color" id="e-hex" value="${esc(p.colourHex || '#000000')}" style="height:40px;padding:2px"></label></div>
     <label>Description<textarea id="e-desc" placeholder="Fabric, fit and details">${esc(p.description)}</textarea></label>
     <div><div style="font-size:12px;font-weight:500;color:#555;margin-bottom:6px">Sizes — quick sets</div><div class="chips">${Object.keys(SIZESETS).map(k => `<button class="chip" data-set="${k}">${k}</button>`).join('')}</div>
      <label style="margin-top:10px">Sizes (comma separated)<input type="text" id="e-sizes" value="${esc(p.sizes.join(', '))}"></label>
      <div style="font-size:12px;font-weight:500;color:#555;margin:10px 0 6px">Out of stock — tap a size to mark it sold out</div><div class="chips" id="e-so">${p.sizes.map(s => `<button class="chip ${p.soldOut.includes(s) ? 'out' : ''}" data-so="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
     <div><div style="font-size:12px;font-weight:500;color:#555;margin-bottom:6px">Photos * (first photo is the main one)</div>
      <div class="imgs">${p.images.map((s, i) => `<div class="imgbox"><img src="${esc(s.startsWith('images/') ? './' + s : thumb(s))}" alt=""><div class="ctl"><button data-im="${i}" data-d="-1">←</button><button data-im="${i}" data-d="1">→</button><button data-imx="${i}">✕</button></div></div>`).join('')}</div>
      <div class="row" style="margin-top:10px"><label>Upload photo from your device<input type="file" id="e-file" accept="image/*" multiple></label><label>…or paste an image link<span style="display:flex;gap:6px"><input type="url" id="e-url" placeholder="https://…"><button class="btn out" data-addurl>Add</button></span></label></div>
      <div class="hint" id="e-up"></div>
      <label style="margin-top:10px">Photo credit (optional)<input type="text" id="e-credit" value="${esc(p.credit)}" placeholder="e.g. Photo: @name on Unsplash"></label></div>
     <div style="display:flex;gap:20px;flex-wrap:wrap"><label class="chk"><input type="checkbox" id="e-new" ${p.isNew ? 'checked' : ''}> Show “New” badge</label><label class="chk"><input type="checkbox" id="e-hid" ${p.hidden ? 'checked' : ''}> Hide from store</label></div>
     <div class="foot"><button class="btn out" data-x>Cancel</button><button class="btn" data-save>${isNew ? 'Add product' : 'Save product'}</button></div>
     <p class="hint">After saving, click <b>Publish changes</b> at the top to put it live.</p></div>`;
    ov.classList.add('open');
  };
  const read = () => {
    const v = id => document.getElementById(id);
    p.name = v('e-name').value.trim(); p.category = v('e-cat').value; p.subcategory = v('e-sub').value.trim();
    p.price = v('e-price').value === '' ? '' : Math.round(+v('e-price').value * 100) / 100;
    const sp = v('e-sale').value; p.salePrice = sp === '' ? null : Math.round(+sp * 100) / 100;
    p.colour = v('e-col').value.trim(); p.colourHex = v('e-hex').value; p.description = v('e-desc').value.trim();
    p.sizes = v('e-sizes').value.split(',').map(s => s.trim()).filter(Boolean); p.soldOut = p.soldOut.filter(s => p.sizes.includes(s));
    p.isNew = v('e-new').checked; p.hidden = v('e-hid').checked; p.credit = v('e-credit').value.trim();
  };
  draw();
  ov.onclick = async e => {
    const t = e.target;
    if (t.closest('[data-x]') || t === ov) { ov.classList.remove('open'); return; }
    if (t.closest('[data-set]')) { read(); p.sizes = SIZESETS[t.closest('[data-set]').dataset.set].slice(); p.soldOut = []; draw(); return; }
    if (t.closest('[data-so]')) { read(); const s = t.closest('[data-so]').dataset.so; p.soldOut = p.soldOut.includes(s) ? p.soldOut.filter(x => x !== s) : [...p.soldOut, s]; draw(); return; }
    if (t.closest('[data-im]')) { read(); const b = t.closest('[data-im]'), i = +b.dataset.im, j = i + +b.dataset.d; if (j >= 0 && j < p.images.length) [p.images[i], p.images[j]] = [p.images[j], p.images[i]]; draw(); return; }
    if (t.closest('[data-imx]')) { read(); p.images.splice(+t.closest('[data-imx]').dataset.imx, 1); draw(); return; }
    if (t.closest('[data-addurl]')) { read(); const u = document.getElementById('e-url').value.trim(); if (/^https:\/\//.test(u)) { p.images.push(u); draw(); } else draw('Image links must start with https://'); return; }
    if (t.closest('[data-save]')) {
      read();
      if (!p.name) return draw('Please enter a product name.');
      if (p.price === '' || !(p.price > 0)) return draw('Please enter a price.');
      if (p.salePrice != null && !(p.salePrice > 0 && p.salePrice < p.price)) return draw('Sale price must be lower than the normal price.');
      if (!p.sizes.length) return draw('Add at least one size (use “One size” for bags and accessories).');
      if (!p.images.length) return draw('Add at least one photo.');
      if (isNew) DATA.products.unshift(p); else DATA.products[DATA.products.findIndex(x => x.id === p.id)] = p;
      ov.classList.remove('open'); change(); msg = ['info', `“${p.name}” saved. Click “Publish changes” to put it live.`]; render();
    }
  };
  ov.onchange = async e => {
    if (e.target.id !== 'e-file') return;
    read(); const files = [...e.target.files]; const up = document.getElementById('e-up');
    for (const [i, f] of files.entries()) {
      up.textContent = `Uploading photo ${i + 1} of ${files.length}…`;
      try { p.images.push(await uploadImage(f)); } catch (er) { draw('Photo upload failed: ' + er.message); return; }
    }
    draw(); document.getElementById('e-up').textContent = 'Photo uploaded. It can take a minute to appear on the live store.';
  };
}

window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
if (token) { root.innerHTML = '<div class="wrap"><p class="hint">Loading…</p></div>'; load().then(render).catch(e => { token = ''; sessionStorage.removeItem('nl-admin-token'); localStorage.removeItem('nl-admin-token'); loginView(e.status === 401 ? 'Your key has expired or was removed. Please sign in again.' : e.message); }); }
else loginView();
})();
