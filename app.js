/* NORTHLINE storefront. Products live in products.json (edited from admin.html). */
(function () {
'use strict';
const S = window.STORE, CUR = S.currency || 'AUD';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Number(n).toFixed(2);
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const ICON = {
  heart: f => `<svg width="20" height="20" viewBox="0 0 24 24" fill="${f ? '#000' : 'none'}" stroke="#000" stroke-width="1.3"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`,
  close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  lock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
};

/* ---------- data ---------- */
let DATA = { categories: [], hero: [], products: [] };
let P = [];
const byId = id => P.find(p => p.id === +id);
const priceOf = p => (p.salePrice && p.salePrice < p.price) ? p.salePrice : p.price;
const onSale = p => p.salePrice && p.salePrice < p.price;
const catName = id => ({ new: 'New in', sale: 'Sale', all: 'All products' }[id] || (DATA.categories.find(c => c.id === id) || {}).name || id);
const img = (src, w) => src && src.includes('images.unsplash.com') ? src.replace(/w=\d+/, 'w=' + w) : src;

/* ---------- state ---------- */
let bag = store.get('nl2-bag', []), wish = store.get('nl2-wish', []), recent = store.get('nl2-recent', []);
let promo = store.get('nl2-promo', null);
let lastOrder = null; try { lastOrder = JSON.parse(sessionStorage.getItem('nl2-order') || 'null'); } catch (e) {}
let shipChoice = S.shipping[0].id;
let gridCols = store.get('nl2-cols', 4);
const save = () => { bag = bag.filter(b => byId(b.id)); store.set('nl2-bag', bag); store.set('nl2-wish', wish); counts(); };
const counts = () => { const n = bag.reduce((a, b) => a + b.qty, 0); $('#bagcount').textContent = n || ''; $('#bagn').textContent = n; $('#wishcount').textContent = wish.length || ''; };
const subtotal = () => bag.reduce((a, b) => a + priceOf(byId(b.id)) * b.qty, 0);
const discount = () => promo && S.promoCodes[promo] ? Math.round(subtotal() * S.promoCodes[promo]) / 100 : 0;
const shipCost = () => { const o = S.shipping.find(s => s.id === shipChoice) || S.shipping[0]; if (o.price === 0) return 0; return (subtotal() - discount()) >= S.freeShippingOver && o.id === 'standard' ? 0 : o.price; };

/* ---------- templates ---------- */
const priceHTML = p => onSale(p) ? `<span class="price"><span class="was">${money(p.price)}</span><span class="now">${money(p.salePrice)}</span></span>` : `<span class="price">${money(p.price)}</span>`;
const card = p => {
  const w = wish.includes(p.id); const so = p.soldOut || [];
  return `<div class="pc" data-id="${p.id}">
   <div class="im"><a href="#product-${p.id}" aria-label="${esc(p.name)}"><img src="${esc(img(p.images[0], 700))}" alt="${esc(p.name)}" loading="lazy">${p.images[1] ? `<img class="alt" src="${esc(img(p.images[1], 700))}" alt="" loading="lazy">` : ''}</a>
    ${onSale(p) ? `<span class="tag s">-${Math.round((1 - p.salePrice / p.price) * 100)}%</span>` : p.isNew ? '<span class="tag">New</span>' : ''}
    <button class="heart" data-wish="${p.id}" aria-label="Save to wishlist">${ICON.heart(w)}</button>
    <div class="qa"><span class="t">Quick add — select size</span><div class="sz">${p.sizes.map(s => `<button data-qa="${p.id}" data-s="${esc(s)}" ${so.includes(s) ? 'disabled' : ''}>${esc(s)}</button>`).join('')}</div></div>
   </div>
   <a href="#product-${p.id}" class="meta"><span class="n">${esc(p.name)}</span>${priceHTML(p)}</a>
   <div class="sw"><i style="background:${esc(p.colourHex || '#ccc')}" title="${esc(p.colour)}"></i></div></div>`;
};
const crumbs = list => `<div class="crumb">${list.map(([t, h]) => h ? `<a href="${h}">${esc(t)}</a>` : esc(t)).join(' / ')}</div>`;

/* ---------- pages ---------- */
const V = {};
V.home = () => {
  const H = DATA.hero || [];
  const newIn = P.filter(p => p.isNew).slice(0, 12), sale = P.filter(onSale).slice(0, 8);
  return `<section class="hero" id="hero">${H.map((h, i) => `<div class="slide ${i ? '' : 'on'}"><img src="${esc(img(h.image, 2000))}" alt="" ${i ? 'loading="lazy"' : ''}><div class="slidetxt"><h2>${esc(h.title)}</h2><p>${esc(h.subtitle)}</p><a class="btn white" href="${esc(h.link)}">${esc(h.button || 'Shop now')}</a></div></div>`).join('')}
   <div class="dots">${H.map((h, i) => `<button class="${i ? '' : 'on'}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div></section>
  <div class="usp"><div><b>Free delivery</b>On orders over $${S.freeShippingOver}</div><div><b>Free returns</b>Within 30 days</div><div><b>Click &amp; collect</b>Ready in 2 hours</div><div><b>Secure payment</b>Cards &amp; PayPal</div></div>
  <section class="sec"><div class="shead"><h2 class="h2">Shop by category</h2><a class="lnk" href="#shop-all">View all</a></div>
   <div class="cats">${DATA.categories.map(c => `<a class="cat" href="#shop-${c.id}"><img src="${esc(img(c.image, 900))}" alt="${esc(c.name)}" loading="lazy"><span>${esc(c.name)}</span></a>`).join('')}</div></section>
  <section class="sec" style="padding-top:0"><div class="shead"><h2 class="h2">New in</h2><a class="lnk" href="#shop-new">See all</a></div><div class="rail">${newIn.map(card).join('')}</div></section>
  ${DATA.categories[1] ? `<section class="split"><div class="img"><img src="${esc(img(DATA.categories[1].image, 1400))}" alt="" loading="lazy"></div><div class="txt"><span class="mute up" style="font-size:11px">The tailoring edit</span><h2 class="h1">Sharp lines.<br>Easy fits.</h2><p>Suits, overcoats and shirts cut for warm days and cool nights. Made to wear on repeat.</p><div><a class="btn" href="#shop-men">Shop men</a></div></div></section>` : ''}
  ${sale.length ? `<div class="salebar"><span class="up" style="font-size:11px">Limited time</span><h3>SALE · UP TO 30% OFF</h3><a class="btn white" href="#shop-sale" style="color:var(--sale)">Shop sale</a></div>
  <section class="sec"><div class="shead"><h2 class="h2">On sale now</h2><a class="lnk" href="#shop-sale">See all</a></div><div class="rail">${sale.map(card).join('')}</div></section>` : ''}
  ${DATA.categories[0] ? `<section class="split"><div class="txt"><span class="mute up" style="font-size:11px">Outerwear</span><h2 class="h1">Coats for<br>every season.</h2><p>Wool blends, trenches and tailored blazers — the layers that finish every outfit.</p><div><a class="btn" href="#shop-women">Shop women</a></div></div><div class="img"><img src="${esc(img(DATA.categories[0].image, 1400))}" alt="" loading="lazy"></div></section>` : ''}
  ${recent.length ? `<section class="sec"><div class="shead"><h2 class="h2">Recently viewed</h2></div><div class="rail">${recent.map(byId).filter(Boolean).map(card).join('')}</div></section>` : ''}`;
};

V.shop = (cat) => {
  const subs = [...new Set(P.filter(p => cat === 'all' || cat === 'new' || cat === 'sale' || p.category === cat).map(p => p.subcategory).filter(Boolean))];
  const cats = DATA.categories;
  return `<div class="lhead">${crumbs([['Home', '#home'], [catName(cat)]])}<h1 class="h1">${esc(catName(cat))}</h1>
   <div class="subnav">${['all', 'new', 'sale'].includes(cat)
     ? cats.map(c => `<a class="chip" href="#shop-${c.id}">${esc(c.name)}</a>`).join('')
     : `<button class="chip on" data-sub="">View all</button>` + subs.map(s => `<button class="chip" data-sub="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
  <div class="toolbar"><div class="l"><button id="openfilters">Filters <span id="fcount"></span></button><span class="mute" id="rescount"></span></div>
   <div class="r"><select id="sort" aria-label="Sort"><option value="rel">Sort: Featured</option><option value="new">Newest</option><option value="low">Price low–high</option><option value="high">Price high–low</option></select>
   <span class="view"><button data-cols="2" class="${gridCols === 2 ? 'on' : ''}" aria-label="Large view">▢▢</button> <button data-cols="4" class="${gridCols === 4 ? 'on' : ''}" aria-label="Medium view">▦</button> <button data-cols="6" class="${gridCols === 6 ? 'on' : ''}" aria-label="Small view">▦▦</button></span></div></div>
  <div class="listing"><div class="grid g${gridCols}" id="grid"></div></div>`;
};

V.product = id => {
  const p = byId(id); if (!p) return `<div class="page empty"><p>This product isn’t available.</p><a class="btn" href="#shop-all">Continue shopping</a></div>`;
  const so = p.soldOut || [], w = wish.includes(p.id);
  const rel = P.filter(x => x.id !== p.id && x.category === p.category).slice(0, 8);
  const sizeTable = p.category === 'shoes' ? '' : '';
  return `<div class="pdp"><div class="pimgs">${p.images.map((s, i) => `<img src="${esc(img(s, 1100))}" alt="${esc(p.name)} — image ${i + 1}" data-zoom="${i}" ${i ? 'loading="lazy"' : ''}>`).join('')}</div>
  <div class="pinfo">${crumbs([['Home', '#home'], [catName(p.category), '#shop-' + p.category], [p.subcategory || '']])}
   <div><h1>${esc(p.name)}</h1><div style="margin-top:8px">${priceHTML(p)}</div><div class="mute" style="font-size:11px;margin-top:4px">Price includes GST</div></div>
   <p class="desc">${esc(p.description)}</p>
   <div><div class="lbl"><span>Colour: ${esc(p.colour)}</span></div><span style="display:inline-block;width:24px;height:24px;background:${esc(p.colourHex || '#ccc')};border:1px solid #000;outline:2px solid #fff;outline-offset:-4px"></span></div>
   <div><div class="lbl"><span>Size</span>${p.sizes.length > 1 ? '<button id="sizeguide">Size guide</button>' : ''}</div>
    <div class="sizes">${p.sizes.map(s => `<button class="size" data-s="${esc(s)}" ${so.includes(s) ? 'disabled title="Out of stock"' : ''}>${esc(s)}</button>`).join('')}</div>
    <div class="err" id="err" role="alert"></div>${so.length ? `<div class="mute" style="font-size:11px">Crossed-out sizes are out of stock.</div>` : ''}</div>
   <div class="prow"><button class="btn" id="add">Add to bag</button><button class="btn out heartbtn" data-wish="${p.id}" aria-label="Save to wishlist">${ICON.heart(w)}</button></div>
   <div class="mute" style="font-size:11px">Free delivery over $${S.freeShippingOver} · Free returns within 30 days · Click &amp; collect available</div>
   <div><details open><summary>Composition &amp; care</summary><ul><li>Machine wash at 30°C, gentle cycle</li><li>Do not tumble dry</li><li>Iron at low temperature</li></ul></details>
    <details><summary>Delivery</summary><p>${S.shipping.map(o => `${esc(o.label)}: ${esc(o.time)} — ${o.price ? money(o.price) : 'Free'}`).join('<br>')}<br>Standard delivery is free on orders over $${S.freeShippingOver}.</p></details>
    <details><summary>Returns</summary><p>Free returns within 30 days of delivery. Items must be unworn with tags attached.</p></details></div>
   ${p.credit ? `<div class="credit">${esc(p.credit)}</div>` : ''}
  </div></div>
  ${rel.length ? `<section class="sec"><div class="shead"><h2 class="h2">You may also like</h2></div><div class="rail">${rel.map(card).join('')}</div></section>` : ''}
  <div class="zoom" id="zoom"><button class="ib" onclick="document.getElementById('zoom').classList.remove('open')" aria-label="Close">${ICON.close}</button><div id="zoomimgs"></div></div>`;
};

V.wishlist = () => {
  const list = wish.map(byId).filter(Boolean);
  return `<div class="page"><h1 class="h1" style="margin-bottom:26px">Wishlist (${list.length})</h1>${list.length ? `<div class="grid g4">${list.map(card).join('')}</div>` : `<div class="empty"><p>Your wishlist is empty. Tap the heart on any item to save it.</p><a class="btn" href="#shop-new">Discover new in</a></div>`}</div>`;
};
V.bag = () => `<div class="page"><h1 class="h1" style="margin-bottom:20px">Shopping bag</h1><div style="max-width:760px" id="bagpage"></div></div>`;

V.checkout = () => {
  if (!bag.length) return V.bag();
  const states = ['NT', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT'];
  const f = (l, n, a = '', full) => `<label class="fl ${full ? 'full' : ''}">${l}<input class="field" name="${n}" ${a}></label>`;
  return `<div class="page"><h1 class="h1" style="margin-bottom:30px">Checkout</h1><div class="cogrid">
   <form class="cform" id="cform" novalidate>
    <h2 class="h2">1. Contact</h2><div class="fgrid">${f('Email', 'email', 'type="email" required autocomplete="email"')}${f('Phone', 'phone', 'type="tel" required autocomplete="tel"')}</div>
    <h2 class="h2" style="margin-top:12px">2. Delivery address</h2>
    <div class="fgrid">${f('First name', 'first', 'required autocomplete="given-name"')}${f('Last name', 'last', 'required autocomplete="family-name"')}${f('Street address', 'address1', 'required autocomplete="address-line1"', 1)}${f('Apartment, unit (optional)', 'address2', 'autocomplete="address-line2"', 1)}${f('Suburb', 'city', 'required autocomplete="address-level2"')}
     <label class="fl">State<select class="field" name="state" required>${states.map(s => `<option ${s === 'NT' ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
     ${f('Postcode', 'postcode', 'required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="postal-code"')}<label class="fl">Country<input class="field" value="Australia" disabled></label></div>
    <h2 class="h2" style="margin-top:12px">3. Delivery method</h2>
    <div id="shipopts">${S.shipping.map(o => `<label class="opt"><input type="radio" name="ship" value="${o.id}" ${o.id === shipChoice ? 'checked' : ''}><span class="g">${esc(o.label)}<small>${esc(o.time)}</small></span><b id="sp-${o.id}"></b></label>`).join('')}</div>
    <h2 class="h2" style="margin-top:12px">4. Payment</h2>
    <div class="secure">${ICON.lock} Secure payment by PayPal — pay with PayPal or any Visa, Mastercard or Amex card. No account needed.</div>
    <div class="err" id="cerr" role="alert"></div>
    <div class="paybox"><div id="paypal-buttons"></div><p class="mute" id="paystatus">Loading secure payment…</p></div>
    <p class="mute" style="font-size:11px">By placing your order you agree to our <a href="#terms" style="text-decoration:underline">Terms of sale</a> and <a href="#privacy" style="text-decoration:underline">Privacy policy</a>.</p>
   </form><aside class="sumbox" id="csum"></aside></div></div>`;
};

V['order-confirmed'] = () => {
  if (!lastOrder) return V.home();
  const o = lastOrder;
  return `<div class="page"><div class="confirm"><span class="up mute" style="font-size:11px">Order confirmed</span><h1 class="h1">Thank you, ${esc(o.first)}</h1>
   <p class="mute">Your payment was successful. A receipt has been sent to <b style="color:#000">${esc(o.email)}</b>. We’ll email you tracking details when your order ships.</p>
   <div class="sumbox" style="width:100%;text-align:left;position:static"><div class="line"><span>Order number</span><b>${esc(o.id)}</b></div>${o.items.map(i => `<div class="line"><span>${esc(i.name)} × ${i.qty}</span><span>${money(i.total)}</span></div>`).join('')}${o.discount ? `<div class="line"><span>Discount</span><span>−${money(o.discount)}</span></div>` : ''}<div class="line"><span>Delivery</span><span>${o.ship ? money(o.ship) : 'Free'}</span></div><div class="line tot"><span>Total paid</span><span>${money(o.total)} ${CUR}</span></div><div class="mute" style="font-size:11px">${esc(o.method)} · ${esc(o.address)}</div></div>
   <a class="btn" href="#home">Continue shopping</a></div></div>`;
};

const textPage = (t, body) => `<div class="page"><h1 class="h1">${t}</h1><div class="text">${body}</div></div>`;
V.help = () => textPage('Help &amp; contact', `<h2>Contact us</h2><p>Email <b>${esc(S.contactEmail)}</b>${S.contactPhone ? ' or call <b>' + esc(S.contactPhone) + '</b>' : ''}. We reply within one business day.</p>
 <h2>Delivery</h2><ul>${S.shipping.map(o => `<li>${esc(o.label)} — ${esc(o.time)} — ${o.price ? money(o.price) : 'Free'}</li>`).join('')}<li>Standard delivery is free on orders over $${S.freeShippingOver}. Orders ship within 1–2 business days with tracking.</li></ul>
 <h2>Returns &amp; refunds</h2><p>Return unworn items with tags attached within 30 days of delivery for a full refund to your original payment method. Email us your order number to start a return. This does not affect your rights under the Australian Consumer Law.</p>
 <h2>Size guide</h2><p>Clothing: XS = AU 6 · S = AU 8–10 · M = AU 12 · L = AU 14 · XL = AU 16 · XXL = AU 18. Shoes are listed in EU sizes (EU 38 ≈ AU women 7 / men 5).</p>
 <h2>Payment</h2><p>We accept Visa, Mastercard, American Express and PayPal through PayPal’s secure checkout. We never see or store your card details. Prices are in Australian dollars and include GST.</p>
 <h2>Promo codes</h2><p>Enter your code at checkout. New subscribers get <b>WELCOME10</b> for 10% off.</p>`);
V.about = () => textPage('About us', `<p>NORTHLINE is an independent fashion label based in Darwin, Australia. We design modern essentials for women and men — clean lines, considered fabrics and pieces you will wear for years.</p><p>Every collection is produced in limited runs. When a style sells out, it may not come back, so if you love it, don’t wait.</p>`);
V.privacy = () => textPage('Privacy policy', `<p>We collect only what we need to process and deliver your order: your name, email, phone and delivery address. Payments are processed by PayPal and we never receive your card details.</p><p>We use your details to fulfil orders and, if you subscribe, to send our newsletter. We never sell your personal information. Your bag and wishlist are stored only in your own browser.</p><p>To access or correct your information, email ${esc(S.contactEmail)}. We handle personal information in line with the Australian Privacy Principles.</p>`);
V.terms = () => textPage('Terms of sale', `<p>All prices are in Australian dollars and include GST. We may correct pricing errors and cancel affected orders with a full refund.</p><p>Your order is accepted once payment succeeds and you receive a confirmation. Delivery times are estimates.</p><p>Returns are accepted within 30 days as described on the Help page. Nothing in these terms limits your rights under the Australian Consumer Law.</p>`);
V.credits = () => textPage('Photo credits', `<p>Product and campaign photography is from <a href="https://unsplash.com" style="text-decoration:underline">Unsplash</a>, used under the Unsplash License. Thank you to the photographers:</p><ul>${[...new Set(P.map(p => p.credit).filter(Boolean))].map(c => `<li>${esc(c.replace('Photo: ', ''))}</li>`).join('')}</ul>`);

/* ---------- UI helpers ---------- */
const UI = window.UI = {
  menu(o) { $('#menu').classList.toggle('open', o); },
  bag(o) { if (o) drawBag('#bagbody', true); $('#bagdrawer').classList.toggle('open', o); },
  search(o) { $('#searchlayer').classList.toggle('open', o); document.body.style.overflow = o ? 'hidden' : ''; if (o) { setTimeout(() => $('#q').focus(), 50); doSearch(); } },
  modal(html) { $('#modalbody').innerHTML = html; $('#modal').classList.add('open'); },
  closeModal() { $('#modal').classList.remove('open'); }
};
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') UI.closeModal(); });
const toast = html => { const t = $('#toast'); t.innerHTML = html; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3000); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { UI.menu(false); UI.bag(false); UI.search(false); UI.closeModal(); const z = $('#zoom'); if (z) z.classList.remove('open'); } });

function addToBag(id, size) {
  const p = byId(id); if (!p) return;
  const ex = bag.find(b => b.id === p.id && b.size === size);
  if (ex) ex.qty = Math.min(10, ex.qty + 1); else bag.push({ id: p.id, size, qty: 1 });
  save(); UI.bag(true);
}
function toggleWish(id) {
  id = +id; const i = wish.indexOf(id);
  if (i > -1) wish.splice(i, 1); else wish.push(id);
  save(); $$(`[data-wish="${id}"]`).forEach(b => b.innerHTML = ICON.heart(wish.includes(id)));
  toast(i > -1 ? 'Removed from wishlist' : 'Saved to wishlist <a href="#wishlist">View</a>');
  if (location.hash === '#wishlist') route();
}
function drawBag(sel, drawer) {
  const el = $(sel); if (!el) return;
  if (!bag.length) { el.innerHTML = `<div class="empty" style="padding:60px 28px"><p>Your bag is empty.</p><a class="btn" href="#shop-new" onclick="UI.bag(false)">Shop new in</a></div>`; return; }
  const sub = subtotal(), left = Math.max(0, S.freeShippingOver - sub);
  el.innerHTML = `<div class="bitems">${bag.map((b, i) => { const p = byId(b.id); return `<div class="bi"><a href="#product-${p.id}"><img src="${esc(img(p.images[0], 300))}" alt="${esc(p.name)}"></a><div><div class="line"><span class="n">${esc(p.name)}</span><span>${money(priceOf(p) * b.qty)}</span></div><div class="o">${esc(p.colour)} · ${esc(b.size)}</div><div class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease">−</button><span>${b.qty}</span><button data-q="${i}" data-d="1" aria-label="Increase">+</button></div><button class="rm" data-q="${i}" data-d="-99">Remove</button></div></div>`; }).join('')}</div>
   <div class="bfoot"><div class="ship-note">${left ? `Add <b>${money(left)}</b> more for free delivery` : 'You’ve unlocked <b>free delivery</b>'}</div><div class="bar"><i style="width:${Math.min(100, sub / S.freeShippingOver * 100)}%"></i></div>
   <div class="line tot"><span>Subtotal</span><span>${money(sub)} ${CUR}</span></div><div class="ship-note">Delivery and promo codes calculated at checkout.</div>
   <a class="btn block" href="#checkout" onclick="UI.bag(false)">Checkout</a>${drawer ? '<a class="btn out block" href="#shop-all" onclick="UI.bag(false)">Continue shopping</a>' : ''}</div>`;
}
document.addEventListener('click', e => {
  const w = e.target.closest('[data-wish]'); if (w) { e.preventDefault(); toggleWish(w.dataset.wish); return; }
  const qa = e.target.closest('[data-qa]'); if (qa) { e.preventDefault(); addToBag(qa.dataset.qa, qa.dataset.s); return; }
  const q = e.target.closest('[data-q]'); if (q) { const i = +q.dataset.q, it = bag[i]; if (!it) return; it.qty += +q.dataset.d; if (it.qty < 1) bag.splice(i, 1); else if (it.qty > 10) it.qty = 10; save(); drawBag('#bagbody', true); drawBag('#bagpage'); if (location.hash === '#checkout') route(); return; }
  if (e.target.closest('.pc .im') && window.matchMedia('(hover:none)').matches) { /* touch: let link work */ }
});

/* ---------- search ---------- */
function doSearch() {
  const t = $('#q').value.trim().toLowerCase();
  const sugg = ['Coat', 'Dress', 'Knitwear', 'Suit', 'Sneakers', 'Leather bag', 'Sunglasses', 'White', 'Black', 'Sale'];
  $('#searchsugg').innerHTML = t ? '' : '<span class="mute up" style="font-size:11px;align-self:center;margin-right:6px">Popular:</span>' + sugg.map(s => `<button data-sg="${s}">${s}</button>`).join('');
  if (!t) { $('#searchres').innerHTML = P.filter(p => p.isNew).slice(0, 8).map(card).join(''); return; }
  const words = t.split(/\s+/);
  const res = P.filter(p => { const hay = [p.name, p.colour, p.category, p.subcategory, p.description, onSale(p) ? 'sale' : ''].join(' ').toLowerCase(); return words.every(w => hay.includes(w.replace(/s$/, ''))); });
  $('#searchres').innerHTML = res.length ? res.map(card).join('') : `<p class="mute" style="grid-column:1/-1;padding:30px 0">No results for “${esc(t)}”. Try another word.</p>`;
}
$('#q').addEventListener('input', doSearch);
$('#searchsugg').addEventListener('click', e => { const b = e.target.closest('[data-sg]'); if (b) { $('#q').value = b.dataset.sg; doSearch(); } });
$('#searchres').addEventListener('click', e => { if (e.target.closest('a')) UI.search(false); });

/* ---------- listing behaviour ---------- */
function bindShop(cat) {
  const base = P.filter(p => cat === 'all' ? true : cat === 'new' ? p.isNew : cat === 'sale' ? onSale(p) : p.category === cat);
  const F = { sub: '', sizes: [], colours: [], max: Math.ceil(Math.max(...base.map(priceOf), 0) / 10) * 10, sort: 'rel' };
  const allSizes = [...new Set(base.flatMap(p => p.sizes))], allCols = [...new Map(base.map(p => [p.colour, p.colourHex])).entries()];
  const maxP = F.max;
  const draw = () => {
    let list = base.filter(p => (!F.sub || p.subcategory === F.sub) && (!F.sizes.length || F.sizes.some(s => p.sizes.includes(s) && !(p.soldOut || []).includes(s))) && (!F.colours.length || F.colours.includes(p.colour)) && priceOf(p) <= F.max);
    if (F.sort === 'low') list.sort((a, b) => priceOf(a) - priceOf(b));
    if (F.sort === 'high') list.sort((a, b) => priceOf(b) - priceOf(a));
    if (F.sort === 'new') list.sort((a, b) => (b.isNew - a.isNew) || b.id - a.id);
    $('#grid').innerHTML = list.length ? list.map(card).join('') : `<div class="empty" style="grid-column:1/-1"><p>No items match these filters.</p><button class="btn out" id="clearf">Clear filters</button></div>`;
    $('#rescount').textContent = list.length + ' items';
    const n = F.sizes.length + F.colours.length + (F.max < maxP ? 1 : 0); $('#fcount').textContent = n ? `(${n})` : '';
    const c = $('#clearf'); if (c) c.onclick = () => { F.sizes = []; F.colours = []; F.max = maxP; draw(); };
  };
  $$('.subnav [data-sub]').forEach(b => b.onclick = () => { $$('.subnav [data-sub]').forEach(x => x.classList.toggle('on', x === b)); F.sub = b.dataset.sub; draw(); });
  $('#sort').onchange = e => { F.sort = e.target.value; draw(); };
  $$('.view [data-cols]').forEach(b => b.onclick = () => { gridCols = +b.dataset.cols; store.set('nl2-cols', gridCols); $$('.view button').forEach(x => x.classList.toggle('on', x === b)); $('#grid').className = 'grid g' + gridCols; });
  $('#openfilters').onclick = () => {
    const html = `<div class="layer open" id="flayer"><div class="scrim"></div><aside class="side right"><div class="sidetop"><b>FILTERS</b><button class="ib" data-fclose aria-label="Close">${ICON.close}</button></div>
     <div class="fbody fpanel"><h5>Size</h5><div class="opts">${allSizes.map(s => `<button data-fs="${esc(s)}" class="${F.sizes.includes(s) ? 'on' : ''}">${esc(s)}</button>`).join('')}</div>
     <h5>Colour</h5><div class="opts">${allCols.map(([c, h]) => `<button data-fc="${esc(c)}" class="${F.colours.includes(c) ? 'on' : ''}"><span class="cdot" style="background:${esc(h)}"></span>${esc(c)}</button>`).join('')}</div>
     <h5>Max price: <span id="fmaxv">${money(F.max)}</span></h5><div class="range"><input type="range" id="fmax" min="0" max="${maxP}" step="5" value="${F.max}"></div></div>
     <div class="ffoot"><button class="btn out" data-fclear>Clear</button><button class="btn" data-fclose>View results</button></div></aside></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const L = $('#flayer');
    L.onclick = e => {
      if (e.target.closest('[data-fclose]') || e.target.classList.contains('scrim')) { L.remove(); return; }
      const s = e.target.closest('[data-fs]'), c = e.target.closest('[data-fc]');
      if (s) { const v = s.dataset.fs; F.sizes = F.sizes.includes(v) ? F.sizes.filter(x => x !== v) : [...F.sizes, v]; s.classList.toggle('on'); draw(); }
      if (c) { const v = c.dataset.fc; F.colours = F.colours.includes(v) ? F.colours.filter(x => x !== v) : [...F.colours, v]; c.classList.toggle('on'); draw(); }
      if (e.target.closest('[data-fclear]')) { F.sizes = []; F.colours = []; F.max = maxP; L.remove(); draw(); }
    };
    $('#fmax').oninput = e => { F.max = +e.target.value; $('#fmaxv').textContent = money(F.max); draw(); };
  };
  draw();
}
function bindProduct(id) {
  const p = byId(id); if (!p) return;
  recent = [p.id, ...recent.filter(x => x !== p.id)].slice(0, 8); store.set('nl2-recent', recent);
  let size = p.sizes.length === 1 && !(p.soldOut || []).includes(p.sizes[0]) ? p.sizes[0] : null;
  if (size) $$('.size').forEach(b => b.classList.add('on'));
  $$('.size:not(:disabled)').forEach(b => b.onclick = () => { $$('.size').forEach(x => x.classList.toggle('on', x === b)); size = b.dataset.s; $('#err').textContent = ''; });
  $('#add').onclick = () => { if (!size) { $('#err').textContent = 'Please select a size.'; return; } addToBag(p.id, size); };
  const sg = $('#sizeguide'); if (sg) sg.onclick = () => UI.modal(p.category === 'shoes'
    ? `<h2 class="h2">Shoe size guide</h2><table><tr><th>EU</th><th>AU women</th><th>AU men</th><th>Foot length</th></tr>${[[36, 5, 3, 23], [37, 6, 4, 23.7], [38, 7, 5, 24.3], [39, 8, 6, 25], [40, 9, 7, 25.7], [41, 10, 8, 26.3], [42, 11, 9, 27], [43, 12, 10, 27.7], [44, '—', 11, 28.3]].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]} cm</td></tr>`).join('')}</table>`
    : `<h2 class="h2">Size guide</h2><table><tr><th>Size</th><th>AU</th><th>Chest/bust</th><th>Waist</th></tr>${[['XS', 6, 80, 62], ['S', '8–10', 86, 68], ['M', 12, 92, 74], ['L', 14, 98, 80], ['XL', 16, 104, 86], ['XXL', 18, 110, 92]].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]} cm</td><td>${r[3]} cm</td></tr>`).join('')}</table><p class="mute" style="margin-top:12px;font-size:12px">Between sizes? Choose the larger size for a relaxed fit.</p>`);
  $$('[data-zoom]').forEach(im => im.onclick = () => { if (window.innerWidth < 860) return; $('#zoomimgs').innerHTML = p.images.map(s => `<img src="${esc(img(s, 2000))}" alt="">`).join(''); $('#zoom').classList.add('open'); $('#zoom').scrollTop = +im.dataset.zoom * window.innerHeight; });
}
let heroTimer;
function bindHome() {
  const slides = $$('.slide'), dots = $$('.dots button'); let i = 0;
  const go = n => { i = (n + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
  dots.forEach(d => d.onclick = () => { go(+d.dataset.slide); clearInterval(heroTimer); heroTimer = setInterval(() => go(i + 1), 6000); });
  clearInterval(heroTimer); if (slides.length > 1) heroTimer = setInterval(() => go(i + 1), 6000);
}

/* ---------- checkout ---------- */
function drawSummary() {
  const sub = subtotal(), d = discount(), sh = shipCost();
  S.shipping.forEach(o => { const el = $('#sp-' + o.id); if (el) el.textContent = o.price === 0 ? 'Free' : (o.id === 'standard' && sub - d >= S.freeShippingOver ? 'Free' : money(o.price)); });
  $('#csum').innerHTML = `<h2 class="h2">Order summary</h2>${bag.map(b => { const p = byId(b.id); return `<div class="mini"><img src="${esc(img(p.images[0], 200))}" alt=""><div>${esc(p.name)}<div class="mute">${esc(b.size)} · Qty ${b.qty}</div></div><div>${money(priceOf(p) * b.qty)}</div></div>`; }).join('')}
   <form class="promo" id="promoform"><input class="field" id="promocode" placeholder="Promo code" value="${esc(promo || '')}" aria-label="Promo code"><button class="btn out" style="min-height:40px;padding:8px 16px">${promo ? 'Remove' : 'Apply'}</button></form><div class="err" id="perr"></div>
   <div class="line"><span>Subtotal</span><span>${money(sub)}</span></div>${d ? `<div class="line"><span>Discount (${esc(promo)})</span><span>−${money(d)}</span></div>` : ''}<div class="line"><span>Delivery</span><span>${sh ? money(sh) : 'Free'}</span></div>
   <div class="line tot"><span>Total</span><span>${money(sub - d + sh)} ${CUR}</span></div><div class="mute" style="font-size:11px">Includes GST of ${money((sub - d + sh) / 11)}</div>`;
  $('#promoform').onsubmit = e => { e.preventDefault(); if (promo) { promo = null; } else { const c = $('#promocode').value.trim().toUpperCase(); if (!S.promoCodes[c]) { $('#perr').textContent = 'That code isn’t valid.'; return; } promo = c; } store.set('nl2-promo', promo); drawSummary(); };
}
const formData = () => { const d = {}; new FormData($('#cform')).forEach((v, k) => d[k] = String(v).trim()); return d; };
function validate() {
  const f = $('#cform'); $$('#cform .field').forEach(i => i.classList.add('touched'));
  if (!f.checkValidity()) { $('#cerr').textContent = 'Please complete your contact and delivery details.'; const b = f.querySelector(':invalid'); if (b) b.focus(); return false; }
  $('#cerr').textContent = ''; return true;
}
let sdk = null;
const loadPayPal = () => window.paypal ? Promise.resolve() : (sdk = sdk || new Promise((res, rej) => { const s = document.createElement('script'); s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(S.paypalClientId)}&currency=${CUR}&intent=capture&components=buttons`; s.onload = res; s.onerror = () => { sdk = null; rej(); }; document.head.appendChild(s); }));
function bindCheckout() {
  drawSummary();
  $('#shipopts').onchange = e => { if (e.target.name === 'ship') { shipChoice = e.target.value; drawSummary(); } };
  const st = $('#paystatus');
  if (!S.paypalClientId) { st.textContent = 'Online payment is not set up yet.'; return; }
  loadPayPal().then(() => {
    if (location.hash !== '#checkout') return; st.textContent = '';
    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay', height: 48 },
      onClick: (d, a) => validate() ? a.resolve() : a.reject(),
      createOrder: (d, a) => {
        const f = formData(), sub = subtotal(), dc = discount(), sh = shipCost(), m = S.shipping.find(s => s.id === shipChoice);
        const pickup = shipChoice === 'pickup';
        return a.order.create({
          intent: 'CAPTURE',
          purchase_units: [{
            description: S.name + ' order — ' + m.label,
            amount: { currency_code: CUR, value: (sub - dc + sh).toFixed(2), breakdown: { item_total: { currency_code: CUR, value: sub.toFixed(2) }, shipping: { currency_code: CUR, value: sh.toFixed(2) }, discount: { currency_code: CUR, value: dc.toFixed(2) } } },
            items: bag.map(b => { const p = byId(b.id); return { name: (p.name + ' — ' + b.size).slice(0, 127), sku: `NL-${p.id}-${b.size}`.slice(0, 127), quantity: String(b.qty), unit_amount: { currency_code: CUR, value: priceOf(p).toFixed(2) }, category: 'PHYSICAL_GOODS' }; }),
            shipping: { name: { full_name: (f.first + ' ' + f.last).slice(0, 300) }, address: { address_line_1: f.address1, address_line_2: f.address2 || undefined, admin_area_2: f.city, admin_area_1: f.state, postal_code: f.postcode, country_code: 'AU' } }
          }],
          application_context: { brand_name: S.name, shipping_preference: pickup ? 'NO_SHIPPING' : 'SET_PROVIDED_ADDRESS', user_action: 'PAY_NOW' }
        });
      },
      onApprove: (d, a) => a.order.capture().then(det => {
        const f = formData(), sub = subtotal(), dc = discount(), sh = shipCost();
        lastOrder = { id: det.id, first: f.first, email: f.email, ship: sh, discount: dc, total: sub - dc + sh, method: S.shipping.find(s => s.id === shipChoice).label,
          address: [f.address1, f.address2, f.city, f.state, f.postcode].filter(Boolean).join(', '),
          items: bag.map(b => { const p = byId(b.id); return { name: p.name + ' (' + b.size + ')', qty: b.qty, total: priceOf(p) * b.qty }; }) };
        try { sessionStorage.setItem('nl2-order', JSON.stringify(lastOrder)); } catch (e) {}
        bag = []; promo = null; store.set('nl2-promo', null); save(); location.hash = '#order-confirmed';
      }),
      onCancel: () => { $('#cerr').textContent = 'Payment cancelled — your bag is still saved.'; },
      onError: () => { $('#cerr').textContent = 'Payment could not be completed. Please try again or use another card.'; }
    }).render('#paypal-buttons').catch(() => { st.textContent = 'Secure payment could not load. Please refresh the page.'; });
  }).catch(() => { st.textContent = 'Secure payment could not load. Check your connection and refresh.'; });
}

/* ---------- router ---------- */
function headerMode() { const h = $('#hdr'); const home = (location.hash || '#home') === '#home'; h.classList.toggle('clear', home && window.scrollY < window.innerHeight - 80); }
window.addEventListener('scroll', headerMode, { passive: true });
function route() {
  const h = (location.hash || '#home').slice(1);
  UI.menu(false); UI.search(false); $('#bagdrawer').classList.remove('open'); const fl = $('#flayer'); if (fl) fl.remove();
  let html, after;
  if (h.startsWith('product-')) { const id = +h.split('-')[1]; html = V.product(id); after = () => bindProduct(id); }
  else if (h.startsWith('shop')) { const c = h.slice(5) || 'all'; html = V.shop(c); after = () => bindShop(c); }
  else if (h === 'checkout') { html = V.checkout(); after = bag.length ? bindCheckout : () => drawBag('#bagpage'); }
  else if (h === 'bag') { html = V.bag(); after = () => drawBag('#bagpage'); }
  else if (V[h]) { html = V[h](); if (h === 'home') after = bindHome; }
  else { html = V.home(); after = bindHome; }
  app.innerHTML = html;
  $$('#topcats a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + h));
  const p = h.startsWith('product-') && byId(+h.split('-')[1]);
  document.title = p ? p.name + ' — ' + S.name : (h === 'home' ? S.name + ' — Women, Men, Shoes & Bags' : catName(h.replace('shop-', '')).replace(/^\w/, c => c.toUpperCase()) + ' — ' + S.name);
  if (after) after();
  window.scrollTo(0, 0); headerMode();
}

/* ---------- start ---------- */
function navs() {
  const links = [...DATA.categories.map(c => [c.name, '#shop-' + c.id]), ['New in', '#shop-new'], ['Sale', '#shop-sale']];
  $('#topcats').innerHTML = links.slice(0, 2).concat([['New in', '#shop-new'], ['Sale', '#shop-sale']]).map(([t, h]) => `<a href="${h}">${esc(t)}</a>`).join('');
  $('#menulinks').innerHTML = links.map(([t, h]) => `<a href="${h}" class="${t === 'Sale' ? 'sale' : ''}">${esc(t)}<span>→</span></a>`).join('') + '<a href="#shop-all">View all<span>→</span></a>';
}
if (S.paypalClientId === 'sb') { $('#demo').hidden = false; document.body.classList.add('hasdemo'); }
if (S.abn) $('#abn').textContent = ' · ABN ' + S.abn;
$('#newsform').onsubmit = e => { e.preventDefault(); e.target.innerHTML = '<p style="padding:10px 0">Thanks! Use code <b>WELCOME10</b> for 10% off.</p>'; };
fetch('products.json?v=' + Date.now()).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
  DATA = d; P = (d.products || []).filter(p => !p.hidden && p.images && p.images.length);
  navs(); save(); route(); window.addEventListener('hashchange', route);
}).catch(() => { app.innerHTML = '<div class="page empty"><p>Sorry, the store could not load. Please refresh the page.</p></div>'; });
})();
