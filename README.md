# NORTHLINE — online fashion store

Live store: **https://manishkat.github.io/northline-store/**
Owner admin: **https://manishkat.github.io/northline-store/admin.html**

## What's included
- **Pages:** home page with a slideshow, Women, Men, Shoes, Bags, Accessories, New in and Sale.
- **Shopping:** sub-category tabs, filters (size, colour, max price), sorting, and a 2/4/6-column grid.
- **Search:** live search with popular suggestions.
- **Product pages:** photo gallery with full-screen zoom, size picker with sold-out sizes, size guide, and "You may also like".
- **Extras:** wishlist, quick-add, a slide-out shopping bag with a free-delivery progress bar, recently viewed items, and promo codes (`WELCOME10`).
- **Checkout:** delivery details, choice of Standard, Express or Click & collect, and **PayPal + card payments**.
- **Info pages:** help, privacy, terms and photo credits.

## Managing products (admin page)
1. Open `admin.html` and follow the on-screen steps to create your admin key.
   - The key is a GitHub fine-grained token with **Contents: Read and write** for this repo only.
2. **Add product**: enter the name, category, price, optional sale price, colour, sizes and description.
   - Add photos by uploading them from your phone or computer, or by pasting an image link.
3. Tap a size in the editor to mark it **sold out**. Tick **Hide** to take a product off the store without deleting it.
4. Click **Publish changes**. The live store updates in about 1 minute.
5. Use the **Homepage** tab to change the slideshow and category images.

## Payments
- `config.js` → `paypalClientId: 'sb'` means TEST mode: no real money is taken.
- To take real payments:
  1. Create a free PayPal Business account.
  2. Go to developer.paypal.com → Apps & Credentials → Live → Create App, and copy the Client ID.
  3. In `config.js`, replace `'sb'` with it.
- Paid orders appear in your PayPal account with the buyer's address, items and sizes.
- Check each order total in PayPal before shipping.

## Photos
Demo photos are from Unsplash and are free to use under the Unsplash License. Credits are on the Photo credits page.
Replace them with your own product photos before launch.
