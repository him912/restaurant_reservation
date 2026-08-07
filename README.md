# DineFlow — Restaurant Reservation Platform

DineFlow is a full-stack restaurant reservation and review platform. Customers can browse restaurants, book tables, and leave reviews. Restaurant owners manage their venue, menu, and reservations. Admins oversee restaurants, reservations, and reviews across the platform.

## Live Demo

- **Frontend:** Deploy on Vercel / Netlify (configure `VITE_API_URL`)
- **Backend API:** `https://restaurant-reservation-g6r0.onrender.com/api`

## Demo Credentials

Use these accounts to test the app without signing up:

| Role | Email | Password |
|------|-------|----------|
| **Customer** | `dellsaini711@gmail.com` | `123456` |
| **Admin** | `Himanshusaini712@gmail.com` | `secret123` |
| **Restaurant Owner** | `Applelogintest6@gmail.com` | `123456` |
| **Restaurant Owner** | `shivika99@gmail.com` | `123456` |

### Role capabilities

- **Customer** — Browse restaurants, reserve tables, write/edit/delete own reviews, manage bookings
- **Restaurant Owner** — Manage restaurant profile, menu, gallery, and reservation desk
- **Admin** — Manage restaurants, accept/reject reservations, reply to or delete reviews

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT |
| Payments | Razorpay (India, default) · Stripe (optional) |
| Real-time | Socket.io (table availability updates) |
| Media | Cloudinary (review & restaurant images) |

## Project Structure

```
Restaurant Reservation/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/       # Home, RestaurantDetails, dashboards, AdminPanel
│       ├── components/  # Navbar, AuthModal, SuccessModal, etc.
│       ├── context/     # AppContext (auth, state)
│       └── api.js       # API client
└── server/          # Express API
    ├── controllers/
    ├── models/
    ├── routes/
    └── middleware/
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (local or Atlas)

### Backend setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_CREATE_SECRET=your_admin_registration_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Payments — India (Razorpay, recommended)
PAYMENT_PROVIDER=razorpay
PAYMENT_CURRENCY=inr
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLIENT_URL=http://localhost:5173
BOOKING_DEPOSIT_MINOR_UNITS_PER_GUEST=50000   # ₹500.00 per guest (amount in paise)

# Optional: Stripe (only if your business is incorporated outside India)
# PAYMENT_PROVIDER=stripe
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

Without Razorpay keys, the API runs in **demo payment mode** (reservation is marked paid without opening a payment window).

### Razorpay setup (India)

1. Sign up at [https://razorpay.com](https://razorpay.com) (no invite required for Indian businesses)
2. Dashboard → **Settings** → **API Keys** → generate **Test** keys
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `server/.env`
4. Redeploy the backend

**Test payments (Razorpay test mode only — use `rzp_test_...` keys):**

Indian Razorpay accounts often accept **domestic cards only**. If you see *"accepts domestic (Indian) card payments only"*, do **not** use international test cards — use one of these instead:

| Method | Details | Result |
|--------|---------|--------|
| **UPI** (easiest) | Enter `success@razorpay` | Success |
| **UPI** | Enter `failure@razorpay` | Failed payment |
| **Visa (domestic)** | `4111 1111 1111 1111` | Success |
| **Mastercard (domestic)** | `5267 3181 8797 5449` | Success |
| **RuPay (domestic)** | `6070 1000 2000 0004` | Success |
| **Netbanking** | Pick any bank → mock Success page | Success |

For cards: any **future expiry**, any **CVV**. If 3DS OTP appears, use `1234`.

**Do not use** international test cards (e.g. `4012 8888 8888 1881`) on an India domestic-only account.

**Checklist if payment fails:**
1. Razorpay Dashboard is in **Test Mode** (not Live)
2. Server uses `RAZORPAY_KEY_ID=rzp_test_...` (not `rzp_live_...`)
3. Prefer **UPI** `success@razorpay` or **Netbanking** for quickest testing
4. Dashboard → **Settings** → **Payment methods** → cards/UPI enabled

### Currency (India / INR)

The app defaults to **INR (₹)**. Payment amounts in MongoDB are stored in **paise** (minor units): `50000` = ₹500.

| Field | Example | Meaning |
|-------|---------|---------|
| `menuItems[].price` | `450` | ₹450 (whole rupees) |
| `reservations.paymentAmount` | `50000` | ₹500 deposit (paise) |
| `reservations.paymentCurrency` | `inr` | Indian Rupee |
| `restaurants.priceRange` | `$$$` | Affordability tier (not currency) — no change needed |

**Update existing reservations in MongoDB** (if any were saved as `usd`):

```javascript
db.reservations.updateMany(
  { paymentCurrency: "usd" },
  { $set: { paymentCurrency: "inr" } }
)
```

Only run the above if old test data used USD. Real paid amounts would need manual conversion.

**Menu prices:** store whole rupees in `menuItems.price` (e.g. `299`, `1299`). No DB migration needed if values are already rupee amounts.

### Stripe (optional, non-India)

Stripe is **invite-only in India**. If your company is registered outside India, set `PAYMENT_PROVIDER=stripe` and use Stripe keys instead.

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |

```bash
npm start
```

API runs at `http://localhost:3000`

### Frontend setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev
```

App runs at `http://localhost:3000`

## Key Features

- Restaurant discovery with filters, ratings, and menus
- Real-time table availability by date and time slot
- Reservation flow with **Razorpay deposit payment** (INR) and confirmation ticket
- Pending → admin/owner-approved reservation workflow
- Customer reviews with star distribution breakdown
- Owner replies to reviews
- Admin panel for restaurants, reservations, and reviews

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login |
| `POST /api/auth/register` | User registration |
| `GET /api/restaurants` | List restaurants |
| `GET /api/restaurants/:id/availability` | Slot availability by date |
| `POST /api/reservations` | Create reservation |
| `POST /api/payments/create-checkout-session` | Create Razorpay order / Stripe session |
| `POST /api/payments/verify-razorpay` | Verify Razorpay payment signature |
| `GET /api/payments/verify/:reservationId` | Verify payment status |
| `POST /api/payments/webhook` | Stripe webhook (Stripe only) |
| `GET /api/reviews/restaurant/:id` | Reviews for a restaurant |
| `GET /api/admin/reservations` | Admin: all reservations |
| `GET /api/admin/reviews` | Admin: all reviews |

## License

Apache-2.0
