/* =====================================================================
   NORTHLINE STORE SETTINGS — this is the only file you need to edit.
   ===================================================================== */
window.STORE = {
  name: 'Northline',
  currency: 'AUD',
  contactEmail: 'hello@northline.example',   // TODO: your real email
  contactPhone: '',                          // optional, e.g. '0400 000 000'
  abn: '',                                   // optional ABN shown in footer

  /* PAYMENTS (PayPal — takes PayPal AND debit/credit cards, no PayPal account needed for shoppers)
     'sb' = PayPal TEST mode. Nobody is charged real money.
     To take real payments: paste your LIVE Client ID from developer.paypal.com
     (Apps & Credentials → Live → your app → Client ID). */
  paypalClientId: 'sb',

  /* SHIPPING (all prices in dollars, GST included) */
  freeShippingOver: 150,
  shipping: [
    { id: 'standard', label: 'Standard (Australia Post)', time: '3–7 business days', price: 12 },
    { id: 'express',  label: 'Express (Australia Post)',  time: '1–3 business days', price: 20 }
  ],

  /* PRODUCTS
     - image: upload a photo to the repo (Add file → Upload files) and write its file name, e.g. 'overshirt.jpg'.
       Leave image empty ('') to show the coloured placeholder.
     - soldOut: list sizes that are out of stock. */
  products: [
    { id: 1, name: 'Linen Overshirt',          colour: 'Sand',     colours: 3, price: 189, type: 'Tops',      cats: ['women','men'],         isNew: true, tone: '#BFB2A0', shape: 'shirt', image: '', soldOut: ['XL'],
      desc: 'A relaxed overshirt cut from washed European linen. Wear it buttoned as a shirt or open over a tee — it gets softer with every wash.' },
    { id: 2, name: 'Relaxed Cotton Tee',       colour: 'Bone',     colours: 5, price: 59,  type: 'Tops',      cats: ['women','men','essentials'], isNew: true, tone: '#D8CFC1', shape: 'tee', light: true, image: '', soldOut: [],
      desc: 'Our everyday tee in heavyweight organic cotton jersey. Boxy fit, slightly dropped shoulder and a neckline that keeps its shape.' },
    { id: 3, name: 'Pleated Wide-Leg Trouser', colour: 'Olive',    colours: 2, price: 169, type: 'Bottoms',   cats: ['women'],               isNew: true, tone: '#8C7B68', shape: 'pants', image: '', soldOut: ['XS'],
      desc: 'High-rise, double-pleated trousers in a breathable cotton-linen twill. An elasticated back waist keeps them easy on hot days.' },
    { id: 4, name: 'Merino Crew Knit',         colour: 'Charcoal', colours: 4, price: 219, type: 'Knitwear',  cats: ['women','men'],         isNew: true, tone: '#5E5A52', shape: 'knit', image: '', soldOut: [],
      desc: 'A fine-gauge crew knit in extra-fine Australian merino. Light enough for air-conditioned offices and cool dry-season evenings.' },
    { id: 5, name: 'Gauze Midi Dress',         colour: 'Clay',     colours: 2, price: 209, type: 'Dresses',   cats: ['women'],               tone: '#C9B9A6', shape: 'dress', light: true, image: '', soldOut: [],
      desc: 'An airy midi dress in double-layer cotton gauze with a tie waist and deep side pockets. Made for the build-up.' },
    { id: 6, name: 'Canvas Utility Jacket',    colour: 'Stone',    colours: 1, price: 289, type: 'Outerwear', cats: ['men'],                 tone: '#9E968A', shape: 'shirt', image: '', soldOut: ['XS'],
      desc: 'A four-pocket chore jacket in garment-dyed cotton canvas. Breaks in like your favourite pair of jeans.' },
    { id: 7, name: 'Everyday Chino Short',     colour: 'Sand',     colours: 3, price: 99,  type: 'Bottoms',   cats: ['men','essentials'],    tone: '#CFC3B0', shape: 'short', light: true, image: '', soldOut: [],
      desc: 'A 7-inch chino short in lightweight stretch cotton. Clean front, two back pockets and a relaxed straight leg.' },
    { id: 8, name: 'Organic Rib Tank',         colour: 'White',    colours: 4, price: 45,  type: 'Tops',      cats: ['women','essentials'],  tone: '#E6E0D6', shape: 'tank', light: true, image: '', soldOut: [],
      desc: 'A fitted rib tank in organic cotton with a touch of stretch. The layering piece you will reach for every week.' }
  ]
};
