# Northline — online clothing store

A complete static online store: home, shop with filters, product pages, bag, checkout with PayPal + card payments, order confirmation, help, privacy and terms pages. Works on phone and desktop. No server needed, so it runs free on GitHub Pages.

## Put it live on GitHub Pages (about 5 minutes)

1. Go to **github.com/new**.
   - Repository name: `northline-store`
   - Public, then click **Create repository**.
2. On the new repo page, click **uploading an existing file**.
   - Unzip `northline-store.zip`, then drag all the files inside it into the upload box: `index.html`, `style.css`, `app.js`, `config.js` and `README.md`.
   - Click **Commit changes**.
3. Go to **Settings → Pages**.
   - Source: **Deploy from a branch**. Branch: **main**, folder **/ (root)**. Click **Save**.
4. Wait 1–2 minutes. Your store is live at:
   **https://manishkat.github.io/northline-store/**

## Payments

Payments use **PayPal Checkout**. Shoppers can pay with PayPal **or any debit/credit card** without a PayPal account. Money goes straight into your PayPal account.

The store starts in **TEST MODE** (`paypalClientId: 'sb'` in `config.js`). An orange banner shows, and no real money moves.

### Test a purchase
1. Go to developer.paypal.com and log in, then open **Testing Tools → Sandbox Accounts**.
2. Use the *Personal* sandbox account's email and password at checkout.

### Take real money
1. You need a **PayPal Business account** (free) at paypal.com/au/business.
2. Go to **developer.paypal.com → Apps & Credentials**, switch to **Live** and click **Create App**.
3. Copy the **Client ID**. This is a public ID, not a password.
4. In GitHub, open `config.js`, click the ✏️ pencil and replace `'sb'` with your Client ID, keeping the quotes. Commit.
5. The test banner disappears and real payments start.

**Before going live:**
- Add your real products and photos.
- Set your real email in `config.js`.
- Check your refunds and returns policy.
- Have a lawyer or accountant glance at the Privacy and Terms pages.

Paid orders appear in your **PayPal dashboard** with the buyer's shipping address and the items (name, size, SKU). Fulfil the orders from there.

## Editing the store (all in `config.js`)
- **Products:** name, price, colour, sizes sold out, description, category.
- **Photos:** in the repo click **Add file → Upload files** and upload a photo (for example `overshirt.jpg`). Then set `image: 'overshirt.jpg'` on that product.
- **Shipping:** prices, the free-shipping threshold, contact email, ABN.

## Good to know
- GitHub Pages is static. The store doesn't track stock automatically, so mark sizes as `soldOut` in `config.js` when you run out.
- Prices in `config.js` are what PayPal charges. Someone could edit the page in their own browser before paying, so **check each order total in PayPal before you ship**. For automatic server-side price checks later, move to Shopify or add a small serverless function.
