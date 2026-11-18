/* =====================================================================
   NORTHLINE — STORE SETTINGS
   Products are managed on the owner page: /admin.html
   ===================================================================== */
window.STORE = {
  name: 'NORTHLINE',
  currency: 'AUD',
  contactEmail: 'hello@northline.example',   // TODO: your real email
  contactPhone: '',
  abn: '',

  /* GitHub repo the admin page saves products to */
  github: { owner: 'manishkat', repo: 'northline-store', branch: 'main' },

  /* PAYMENTS — PayPal Checkout (PayPal + debit/credit cards).
     'sb' = TEST mode, no real money. Replace with your LIVE Client ID from developer.paypal.com. */
  paypalClientId: 'sb',

  /* SHIPPING (dollars, GST included) */
  freeShippingOver: 150,
  shipping: [
    { id: 'standard', label: 'Standard delivery', time: '3–7 business days', price: 10 },
    { id: 'express',  label: 'Express delivery',  time: '1–2 business days', price: 18 },
    { id: 'pickup',   label: 'Click & collect — Darwin store', time: 'Ready in 2 hours', price: 0 }
  ],

  /* PROMO CODES: percent off the products subtotal */
  promoCodes: { WELCOME10: 10 }
};
