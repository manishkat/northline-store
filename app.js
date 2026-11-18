/* Northline store — app logic. Settings live in config.js */
(function () {
const S = window.STORE;
const P = S.products;
const CUR = S.currency || 'AUD';
const G = {
  shirt:'<path d="M30 10l-18 8-8 22 12 5 4-10v55h60V35l4 10 12-5-8-22-18-8c-2 8-10 12-20 12S32 18 30 10z"/>',
  tee:'<path d="M32 10L10 20l6 18 10-4v56h48V34l10 4 6-18-22-10c-2 7-9 11-18 11s-16-4-18-11z"/>',
  pants:'<path d="M24 6h52l8 88H58L50 36l-8 58H16z"/>',
  knit:'<path d="M32 10L8 22l4 56 12-2V40v50h52V40v36l12 2 4-56-24-12c-3 6-10 9-18 9s-15-3-18-9z"/>',
  dress:'<path d="M38 6h24l2 18 10 6-8 10 16 54H18l16-54-8-10 10-6z"/>',
  short:'<path d="M20 20h60l6 56H58l-8-28-8 28H14z"/>',
  tank:'<path d="M36 8h8c0 10 12 10 12 0h8l2 22c8 6 10 14 10 22v42H24V52c0-8 2-16 10-22z"/>'
};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + n.toFixed(2);
const byId = id => P.find(p => p.id === +id);

/* ---------- bag (saved in this browser) ---------- */
let bag = [];
try { bag = JSON.parse(localStorage.getItem('nl-bag') || '[]').filter(b => byId(b.id)); } catch (e) { bag = []; }
let lastOrder = null;
try { lastOrder = JSON.parse(sessionStorage.getItem('nl-last-order') || 'null'); } catch (e) {}
const save = () => {
  try { localStorage.setItem('nl-bag', JSON.stringify(bag)); } catch (e) {}
  $('#bagcount').textContent = bag.reduce((a, b) => a + b.qty, 0);
};
const subtotal = () => bag.reduce((a, b) => a + byId(b.id).price * b.qty, 0);
let shipChoice = (S.shipping[0] || {}).id;
const shipCost = () => {
  const o = S.shipping.find(s => s.id === shipChoice) || S.shipping[0];
  if (!o) return 0;
  if (o.id === S.shipping[0].id && subtotal() >= S.freeShippingOver) return 0;
  return o.price;
};

/* ---------- small templates ---------- */
const ph = (p, label, extra = '', style = '') =>
  `<div class="ph ${p.light ? 'lt' : ''} ${extra}" style="--c:${p.tone};${style}">` +
  (p.image ? `<img class="photo" src="${esc(p.image)}" alt="${esc(p.name || label)}" loading="lazy">`
           : `<svg class="garment" viewBox="0 0 100 100" fill="${p.light ? '#1C1B19' : '#fff'}" aria-hidden="true">${G[p.shape] || G.shirt}</svg>`) +
  (label && !p.image ? `<span class="tag">${esc(label)}</span>` : '') + `</div>`;
const card = p => `<a class="pcard" href="#product-${p.id}">${ph(p, '').replace(/<\/div>$/, (p.isNew ? '<span class="badge">New</span>' : '') + '</div>')}
  <div class="info"><div>${esc(p.name)}<div class="sub">${esc(p.colour)} · ${p.colours} colour${p.colours > 1 ? 's' : ''}</div></div><div>$${p.price}</div></div></a>`;
const shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, v + amt)); return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };
const title = t => `<h1 class="h1" style="font-size:clamp(40px,5vw,64px)">${t}</h1>`;

/* ---------- pages ---------- */
const views = {
home: () => `
<div class="hero">
  <div class="copy"><span class="eyebrow">Summer ’26 Collection</span><h1 class="h1">Clothes for the long way round.</h1><p class="muted" style="font-size:17px;max-width:460px">Easy linen, breathable cotton and knits that soften with every wear. Designed in the Top End for heat, humidity and everything after.</p><div class="row"><a class="btn dark" href="#shop">Shop the collection</a><a class="btn outline" href="#about">Our story</a></div></div>
  ${ph({ tone: '#BFB2A0', shape: 'shirt' }, 'Campaign — Summer ’26')}
</div>
<section class="wrap"><div class="shead"><h2 class="h2">Shop by category</h2><a class="link" href="#shop">View all →</a></div>
<div class="grid3">${[['Women', '#C9B9A6', 'dress', 'Dresses, shirts & relaxed tailoring', 'women'], ['Men', '#9E968A', 'shirt', 'Overshirts, tees & lightweight chinos', 'men'], ['Essentials', '#D8CFC1', 'tee', 'Everyday basics in organic cotton', 'essentials', 1]].map(([n, c, g, d, k, lt]) => `<a class="cat" href="#shop-${k}">${ph({ tone: c, shape: g, light: lt }, '')}<div><div class="h3">${n}</div><div class="muted" style="font-size:14px">${d}</div></div></a>`).join('')}</div></section>
<section class="wrap" style="padding-top:0"><div class="shead"><h2 class="h2">New arrivals</h2><a class="link" href="#shop-new">Shop all new →</a></div><div class="grid4">${P.filter(p => p.isNew).slice(0, 4).map(card).join('')}</div></section>
<div class="editorial"><h2 class="h1" style="font-size:clamp(38px,5vw,72px)">Made in small runs.<br>Made to last.</h2><p>Every piece is cut in limited quantities with our partner workshops — less waste, better made.</p><a class="btn light" href="#about">Read our story</a></div>
<section class="wrap"><div class="values">${[['01', 'Natural fibres', 'Linen, organic cotton and merino wool. No synthetic blends, ever.'], ['02', 'Fairly made', 'We partner with three family-run workshops and visit each one every season.'], ['03', 'Free repairs', 'Loose seam or missing button? Send it back and we will fix it for free.']].map(([n, t, d]) => `<div><div class="n">${n}</div><div class="h3">${t}</div><p>${d}</p></div>`).join('')}</div></section>
<div class="news"><h2 class="h2">Join the Northline list</h2><p class="muted">New drops, restocks and 10% off your first order.</p><form id="newsform"><input class="field" type="email" required placeholder="Your email address" aria-label="Email address"><button class="btn dark">Subscribe</button></form></div>`,

shop: f => {
  const titles = { all: 'All clothing', new: 'New in', women: 'Women', men: 'Men', essentials: 'Essentials' };
  return `<div class="phead"><div class="crumb"><a href="#home">Home</a> / Shop${f !== 'all' ? ' / ' + titles[f] : ''}</div>${title(titles[f] || titles.all)}<p class="muted" style="margin-top:8px">Pieces designed for warm days and cooler nights.</p></div>
  <div class="filters"><div class="chips" id="chips">${['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Knitwear'].map((c, i) => `<button class="chip ${i ? '' : 'on'}" data-t="${c}">${c}</button>`).join('')}</div>
  <select class="sort" id="sort" aria-label="Sort"><option value="new">Sort: Newest</option><option value="low">Price: Low to high</option><option value="high">Price: High to low</option></select></div>
  <div class="wrap" style="padding-bottom:110px"><div class="grid4" id="grid"></div><p class="muted" id="count" style="text-align:center;margin-top:48px;font-size:14px"></p></div>`;
},

product: id => {
  const p = byId(id) || P[0]; const rel = P.filter(x => x.id !== p.id).slice(0, 4);
  const so = p.soldOut || [];
  return `<div class="phead" style="padding-bottom:20px"><div class="crumb"><a href="#home">Home</a> / <a href="#shop">Shop</a> / ${esc(p.type)} / ${esc(p.name)}</div></div>
  <div class="pmain"><div class="gallery">${ph(p, p.name + ' — front', 'main')}${ph({ ...p, image: '', tone: shade(p.tone, 12) }, 'Detail', 'th')}${ph({ ...p, image: '', tone: shade(p.tone, -10) }, 'On model', 'th')}${ph({ ...p, image: '', tone: shade(p.tone, -22) }, 'Back', 'th')}</div>
  <div class="pinfo">${p.isNew ? '<span class="eyebrow">New season</span>' : ''}
   <div><h1 class="h1" style="font-size:clamp(38px,4vw,56px)">${esc(p.name)}</h1><div style="font-weight:500;font-size:20px;margin-top:10px">$${p.price} ${CUR}</div><div class="muted" style="font-size:13px">Price includes GST</div></div>
   <p class="muted" style="line-height:1.65">${esc(p.desc)}</p>
   <div style="border-top:1px solid var(--line)"></div>
   <div><div class="lbl" style="margin-bottom:12px">Colour — <span>${esc(p.colour)}</span></div><div class="swatches"><span class="sw on" style="--c:${p.tone}" aria-label="${esc(p.colour)}"></span></div></div>
   <div><div class="lbl" style="margin-bottom:12px">Size <span style="text-decoration:underline;cursor:pointer" id="sizeguide">Size guide</span></div><div class="sizes">${['XS', 'S', 'M', 'L', 'XL'].map(s => `<button class="size ${so.includes(s) ? 'out' : ''}" data-s="${s}" ${so.includes(s) ? 'disabled title="Sold out"' : ''}>${s}</button>`).join('')}</div><div class="err" id="err" role="alert"></div></div>
   <button class="btn dark block" id="add" style="padding:20px">Add to bag — $${p.price}</button>
   <p class="muted" style="font-size:13px">Free shipping over $${S.freeShippingOver} · Free 30-day returns · Ships in 1–2 business days</p>
   <div class="accs"><details open><summary>Details &amp; fit</summary><p>Relaxed fit — true to size. Model is 183 cm and wears size M. Designed and tested in Darwin.</p></details><details><summary>Fabric &amp; care</summary><p>100% natural fibres. Machine wash cold on gentle, line dry in the shade, warm iron if needed.</p></details><details><summary>Shipping &amp; returns</summary><p>Standard shipping is free on orders over $${S.freeShippingOver}. Free returns within 30 days — see <a href="#help" style="text-decoration:underline">Help</a>.</p></details></div>
  </div></div>
  <section class="wrap" style="padding-top:0"><div class="shead"><h2 class="h2">You may also like</h2><a class="link" href="#shop">Shop all →</a></div><div class="grid4">${rel.map(card).join('')}</div></section>`;
},

about: () => `
<div class="intro"><span class="eyebrow">Our story</span><h1 class="h1">We make fewer things,<br>and make them well.</h1><p class="muted">Northline is a small clothing label from Darwin, making breathable everyday pieces for warm climates and long seasons.</p></div>
<div class="wrap">${ph({ tone: '#5E5A52', shape: 'shirt' }, 'Studio — Darwin, NT', '', 'aspect-ratio:1312/620')}</div>
<div class="story"><h2 class="h2">Started in a small studio in Darwin.</h2><div><p>We started Northline because we could not find clothes that felt good in thirty-five degrees and still looked considered. So we began making our own — one overshirt at a time.</p><p>Today we design two collections a year and produce them in small runs. Every fabric is natural, every pattern is tested in the Top End heat, and every piece comes with free repairs.</p></div></div>
<div class="stats">${[['NT', 'Designed in Darwin'], ['100%', 'Natural fibres'], ['Free', 'Repairs for life'], ['30 days', 'Free returns']].map(([n, l]) => `<div class="stat"><b>${n}</b><span class="muted" style="font-size:14px">${l}</span></div>`).join('')}</div>
<div class="cta"><h2 class="h2">See the new collection</h2><a class="btn light" href="#shop">Shop now</a></div>`,

bag: () => {
  if (!bag.length) return `<div class="phead">${title('Your bag')}</div><div class="empty wrap"><p class="muted">Your bag is empty.</p><a class="btn dark" href="#shop">Start shopping</a></div>`;
  const sub = subtotal(); const free = sub >= S.freeShippingOver;
  return `<div class="phead">${title('Your bag')}<p class="muted" style="margin-top:6px">${bag.reduce((a, b) => a + b.qty, 0)} item(s)</p></div>
  <div class="bagmain"><div class="items">${bag.map((b, i) => { const p = byId(b.id); return `<div class="item"><a href="#product-${p.id}">${ph(p, '')}</a><div class="meta"><a href="#product-${p.id}" class="h3" style="font-size:26px">${esc(p.name)}</a><span class="muted" style="font-size:14px">${esc(p.colour)} · Size ${b.size}</span><div class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease">–</button><span>${b.qty}</span><button data-q="${i}" data-d="1" aria-label="Increase">+</button></div><button class="rm" data-q="${i}" data-d="-99">Remove</button></div><div class="price" style="font-weight:500">${money(p.price * b.qty)}</div></div>`; }).join('')}</div>
  <div class="summary"><div class="h3">Order summary</div><div class="sline"><span>Subtotal</span><span style="color:var(--ink)">${money(sub)}</span></div><div class="sline"><span>Shipping</span><span style="color:var(--ink)">${free ? 'Free' : 'Calculated at checkout'}</span></div>${free ? '' : `<div class="muted" style="font-size:13px">Add ${money(S.freeShippingOver - sub)} more for free standard shipping.</div>`}<div class="sline total"><span>Subtotal</span><span>${money(sub)} ${CUR}</span></div><div class="muted" style="font-size:12px">Includes GST of ${money(sub / 11)}</div>
  <a class="btn dark block" style="padding:20px" href="#checkout">Checkout</a><p class="muted" style="font-size:12px;text-align:center">Pay with PayPal or debit/credit card</p><a class="link" href="#shop" style="align-self:center">← Continue shopping</a></div></div>`;
},

checkout: () => {
  if (!bag.length) return views.bag();
  const states = ['NT', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT'];
  const fld = (label, name, attrs = '', full) => `<label class="fl ${full ? 'full' : ''}">${label}<input class="field" name="${name}" ${attrs}></label>`;
  return `<div class="phead"><div class="crumb"><a href="#bag">Bag</a> / Checkout</div>${title('Checkout')}</div>
  <div class="bagmain">
   <form class="cform" id="cform" novalidate>
    <div class="h3">Contact</div>
    <div class="fgrid">${fld('Email', 'email', 'type="email" required autocomplete="email"', 1)}${fld('Phone', 'phone', 'type="tel" required autocomplete="tel" placeholder="For delivery updates"', 1)}</div>
    <div class="h3">Shipping address</div>
    <div class="fgrid">${fld('First name', 'first', 'required autocomplete="given-name"')}${fld('Last name', 'last', 'required autocomplete="family-name"')}${fld('Street address', 'address1', 'required autocomplete="address-line1"', 1)}${fld('Apartment, unit (optional)', 'address2', 'autocomplete="address-line2"', 1)}${fld('Suburb', 'city', 'required autocomplete="address-level2"')}
     <label class="fl">State<select class="field" name="state" required autocomplete="address-level1">${states.map(s => `<option ${s === 'NT' ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
     ${fld('Postcode', 'postcode', 'required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="postal-code"')}
     <label class="fl">Country<input class="field" value="Australia" disabled></label></div>
    <div class="h3">Delivery</div>
    <div id="shipopts">${S.shipping.map((o, i) => `<label class="shipopt"><input type="radio" name="ship" value="${o.id}" ${o.id === shipChoice ? 'checked' : ''}><span class="grow">${esc(o.label)}<small>${esc(o.time)}</small></span><b>${i === 0 && subtotal() >= S.freeShippingOver ? 'Free' : money(o.price)}</b></label>`).join('')}</div>
    <div class="h3">Payment</div>
    <div class="secure"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Secure payment by PayPal. Pay with your PayPal account or any debit/credit card — no account needed.</div>
    <div class="err" id="cerr" role="alert"></div>
    <div class="paybox"><div id="paypal-buttons"></div><p class="muted" id="paystatus" style="font-size:14px">Loading secure payment…</p></div>
    <p class="muted" style="font-size:12px">By placing your order you agree to our <a href="#terms" style="text-decoration:underline">Terms of sale</a> and <a href="#privacy" style="text-decoration:underline">Privacy policy</a>.</p>
   </form>
   <aside class="summary" id="csum"></aside>
  </div>`;
},

'order-confirmed': () => {
  if (!lastOrder) return views.home();
  const o = lastOrder;
  return `<div class="confirm"><div class="tick"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M5 12l5 5 9-10"/></svg></div>
  <span class="eyebrow">Order confirmed</span>${title('Thank you, ' + esc(o.first) + '.')}
  <p class="muted">Your payment was successful and your order is being prepared. A receipt has been sent to <b style="color:var(--ink)">${esc(o.email)}</b>.</p>
  <div class="summary" style="width:100%;text-align:left;position:static"><div class="sline"><span>Order number</span><span style="color:var(--ink)">${esc(o.id)}</span></div>${o.items.map(i => `<div class="sline"><span>${esc(i.name)} × ${i.qty}</span><span style="color:var(--ink)">${money(i.total)}</span></div>`).join('')}<div class="sline"><span>Shipping</span><span style="color:var(--ink)">${o.ship ? money(o.ship) : 'Free'}</span></div><div class="sline total"><span>Total paid</span><span>${money(o.total)} ${CUR}</span></div><div class="muted" style="font-size:13px">Shipping to ${esc(o.address)}</div></div>
  <a class="btn dark" href="#shop">Continue shopping</a></div>`;
},

help: () => `<div class="phead">${title('Help &amp; contact')}</div><div class="help">
<h2 class="h3">Contact us</h2><p>Email <b style="color:var(--ink)">${esc(S.contactEmail)}</b>${S.contactPhone ? ' or call <b style="color:var(--ink)">' + esc(S.contactPhone) + '</b>' : ''}. We reply within one business day (Darwin time).</p>
<h2 class="h3">Shipping</h2><ul><li>We ship Australia-wide from Darwin with Australia Post.</li>${S.shipping.map((o, i) => `<li>${esc(o.label)}: ${esc(o.time)} — ${money(o.price)}${i === 0 ? ` (free on orders over $${S.freeShippingOver})` : ''}.</li>`).join('')}<li>Orders are dispatched within 1–2 business days. You will receive tracking by email.</li></ul>
<h2 class="h3">Returns &amp; exchanges</h2><p>Changed your mind? Return unworn items with tags attached within 30 days of delivery for a refund or exchange. Email us your order number to start a return. This does not affect your rights under the Australian Consumer Law — if an item is faulty you are entitled to a repair, replacement or refund.</p>
<h2 class="h3">Size guide</h2><ul><li>XS — AU 6–8 · S — AU 8–10 · M — AU 10–12 · L — AU 12–14 · XL — AU 14–16</li><li>Most pieces are a relaxed fit. Between sizes? Size down for a neater fit.</li></ul>
<h2 class="h3">Payment</h2><p>We accept PayPal and all major debit and credit cards through PayPal’s secure checkout. We never see or store your card details. All prices are in Australian dollars and include GST.</p></div>`,

privacy: () => `<div class="phead">${title('Privacy policy')}</div><div class="help">
<p>${esc(S.name)} collects only the information needed to process and deliver your order: your name, email, phone number and shipping address. Payments are processed by PayPal; we do not receive or store card numbers.</p>
<p>We use your details to fulfil orders, send order updates and, if you subscribe, our newsletter (you can unsubscribe at any time). We do not sell your personal information. Your shopping bag is saved only in your own browser.</p>
<p>To access or correct your information, or to make a privacy complaint, email ${esc(S.contactEmail)}. We handle personal information in line with the Australian Privacy Principles.</p></div>`,

terms: () => `<div class="phead">${title('Terms of sale')}</div><div class="help">
<p>All prices are in Australian dollars and include GST. We may correct pricing errors and cancel affected orders with a full refund.</p>
<p>Your order is accepted once payment is successful and you receive an order confirmation. Delivery times are estimates. Risk passes to you on delivery.</p>
<p>Returns are accepted within 30 days as described on our <a href="#help" style="text-decoration:underline">Help</a> page. Nothing in these terms limits your rights under the Australian Consumer Law.</p>
<p>Questions? Email ${esc(S.contactEmail)}.</p></div>`
};

/* ---------- UI helpers ---------- */
const toast = html => { const t = $('#toast'); t.innerHTML = html; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2800); };
const openModal = (t, x) => { $('#mtitle').textContent = t; $('#mtext').textContent = x; $('#modal').classList.add('open'); };
window.closeModal = () => $('#modal').classList.remove('open');
window.drawer = o => $('#drawer').classList.toggle('open', o);

/* ---------- router ---------- */
function route() {
  const h = (location.hash || '#home').slice(1); drawer(false);
  let html, after;
  if (h.startsWith('product-')) { const id = h.split('-')[1]; html = views.product(id); after = () => bindProduct(+id); }
  else if (h.startsWith('shop')) { const f = h.split('-')[1] || 'all'; html = views.shop(f); after = () => bindShop(f); }
  else if (h === 'checkout') { html = views.checkout(); after = bag.length ? bindCheckout : null; }
  else if (h === 'bag') { html = views.bag(); after = bindBag; }
  else if (views[h]) { html = views[h](); after = h === 'home' ? bindHome : null; }
  else { html = views.home(); after = bindHome; }
  app.innerHTML = html; app.style.animation = 'none'; app.offsetHeight; app.style.animation = '';
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === h));
  document.title = (h === 'home' ? '' : (h.split('-')[0].replace(/^\w/, c => c.toUpperCase()) + ' — ')) + S.name;
  if (after) after();
  window.scrollTo(0, 0);
}
function bindHome() {
  const f = $('#newsform'); if (f) f.onsubmit = e => { e.preventDefault(); f.innerHTML = '<p style="font-weight:500">Thanks — you are on the list.</p>'; };
}
function bindShop(f) {
  let type = 'All', sort = 'new';
  const draw = () => {
    let list = P.filter(p => f === 'all' || (f === 'new' ? p.isNew : (p.cats || []).includes(f))).filter(p => type === 'All' || p.type === type);
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
    $('#grid').innerHTML = list.length ? list.map(card).join('') : '<p class="muted">Nothing here yet — try another filter.</p>';
    $('#count').textContent = `Showing ${list.length} piece${list.length === 1 ? '' : 's'}`;
  };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip').forEach(c => c.classList.toggle('on', c === b)); type = b.dataset.t; draw(); };
  $('#sort').onchange = e => { sort = e.target.value; draw(); };
  draw();
}
function bindProduct(id) {
  let size = null; const p = byId(id) || P[0];
  $$('.size:not(.out)').forEach(b => b.onclick = () => { $$('.size').forEach(x => x.classList.toggle('on', x === b)); size = b.dataset.s; $('#err').textContent = ''; });
  $('#sizeguide').onclick = () => openModal('Size guide', 'Relaxed fit — true to size. XS = AU 6–8 · S = 8–10 · M = 10–12 · L = 12–14 · XL = 14–16. Between sizes? Size down for a neater fit.');
  $('#add').onclick = () => {
    if (!size) { $('#err').textContent = 'Please choose a size.'; $('#err').style.marginTop = '8px'; return; }
    const ex = bag.find(b => b.id === p.id && b.size === size); ex ? ex.qty++ : bag.push({ id: p.id, size, qty: 1 });
    save(); toast(`Added ${esc(p.name)} (${size}) <a href="#bag">View bag</a>`);
  };
}
function bindBag() {
  app.onclick = e => { const b = e.target.closest('[data-q]'); if (!b || location.hash !== '#bag') return; const i = +b.dataset.q; bag[i].qty += +b.dataset.d; if (bag[i].qty < 1) bag.splice(i, 1); else if (bag[i].qty > 10) bag[i].qty = 10; save(); route(); };
}

/* ---------- checkout + PayPal ---------- */
function drawSummary() {
  const sub = subtotal(), ship = shipCost();
  $('#csum').innerHTML = `<div class="h3">Your order</div>${bag.map(b => { const p = byId(b.id); return `<div class="mini">${ph(p, '')}<div>${esc(p.name)}<div class="muted" style="font-size:13px">Size ${b.size} · Qty ${b.qty}</div></div><div>${money(p.price * b.qty)}</div></div>`; }).join('')}
  <div class="sline" style="border-top:1px solid #D8CFC1;padding-top:14px"><span>Subtotal</span><span style="color:var(--ink)">${money(sub)}</span></div><div class="sline"><span>Shipping</span><span style="color:var(--ink)">${ship ? money(ship) : 'Free'}</span></div><div class="sline total"><span>Total</span><span>${money(sub + ship)} ${CUR}</span></div><div class="muted" style="font-size:12px">Includes GST of ${money((sub + ship) / 11)}</div><a class="link" href="#bag" style="align-self:center">← Edit bag</a>`;
}
function formData() { const f = $('#cform'); const d = {}; new FormData(f).forEach((v, k) => d[k] = String(v).trim()); return d; }
function validate() {
  const f = $('#cform'); $$('#cform .field').forEach(i => i.classList.add('touched'));
  if (!f.checkValidity()) { const bad = f.querySelector(':invalid'); $('#cerr').textContent = 'Please complete your contact and shipping details.'; if (bad) bad.focus(); return false; }
  $('#cerr').textContent = ''; return true;
}
let sdkPromise = null;
function loadPayPal() {
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(S.paypalClientId)}&currency=${CUR}&intent=capture&components=buttons`;
    s.onload = res; s.onerror = () => { sdkPromise = null; rej(new Error('PayPal failed to load')); };
    document.head.appendChild(s);
  });
  return sdkPromise;
}
function bindCheckout() {
  drawSummary();
  $('#shipopts').onchange = e => { if (e.target.name === 'ship') { shipChoice = e.target.value; drawSummary(); } };
  const status = $('#paystatus');
  if (!S.paypalClientId) { status.textContent = 'Payments are not set up yet. Please contact us to order.'; return; }
  loadPayPal().then(() => {
    if (location.hash !== '#checkout') return;
    status.textContent = '';
    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay', height: 48 },
      onClick: (data, actions) => validate() ? actions.resolve() : actions.reject(),
      createOrder: (data, actions) => {
        const d = formData(), sub = subtotal(), ship = shipCost();
        return actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [{
            description: S.name + ' order',
            amount: { currency_code: CUR, value: (sub + ship).toFixed(2), breakdown: { item_total: { currency_code: CUR, value: sub.toFixed(2) }, shipping: { currency_code: CUR, value: ship.toFixed(2) } } },
            items: bag.map(b => { const p = byId(b.id); return { name: (p.name + ' — ' + b.size).slice(0, 127), sku: `NL-${p.id}-${b.size}`, quantity: String(b.qty), unit_amount: { currency_code: CUR, value: p.price.toFixed(2) }, category: 'PHYSICAL_GOODS' }; }),
            shipping: { name: { full_name: (d.first + ' ' + d.last).slice(0, 300) }, address: { address_line_1: d.address1, address_line_2: d.address2 || undefined, admin_area_2: d.city, admin_area_1: d.state, postal_code: d.postcode, country_code: 'AU' } }
          }],
          payer: { email_address: d.email, name: { given_name: d.first, surname: d.last } },
          application_context: { brand_name: S.name, shipping_preference: 'SET_PROVIDED_ADDRESS', user_action: 'PAY_NOW' }
        });
      },
      onApprove: (data, actions) => actions.order.capture().then(det => {
        const d = formData(), sub = subtotal(), ship = shipCost();
        lastOrder = { id: det.id, first: d.first, email: d.email, ship, total: sub + ship,
          address: [d.address1, d.address2, d.city, d.state, d.postcode].filter(Boolean).join(', '),
          items: bag.map(b => { const p = byId(b.id); return { name: p.name + ' (' + b.size + ')', qty: b.qty, total: p.price * b.qty }; }) };
        try { sessionStorage.setItem('nl-last-order', JSON.stringify(lastOrder)); } catch (e) {}
        bag = []; save(); location.hash = '#order-confirmed';
      }),
      onCancel: () => { $('#cerr').textContent = 'Payment cancelled — your bag is still saved.'; },
      onError: err => { console.error(err); $('#cerr').textContent = 'Payment could not be completed. Please try again or use another card.'; }
    }).render('#paypal-buttons').catch(() => { status.textContent = 'Secure payment could not load. Please refresh the page.'; });
  }).catch(() => { status.textContent = 'Secure payment could not load. Check your connection and refresh the page.'; });
}

/* ---------- start ---------- */
if (S.paypalClientId === 'sb') $('#demo').hidden = false;
if (S.abn) $('#abn').textContent = ' ABN ' + S.abn;
window.addEventListener('hashchange', route);
save(); route();
})();
