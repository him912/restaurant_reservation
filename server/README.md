# DineFlow — Backend API (Node.js)

Express + MongoDB REST API for **DineFlow**, a restaurant reservation and review platform. Handles authentication, restaurants, reservations, reviews, payments (Razorpay), and real-time table availability.

**Related repo:** [Frontend (client)](https://github.com/him912/restaurant_reservation/tree/main/client)

## Live API

```
https://restaurant-reservation-g6r0.onrender.com/api
```

## Demo credentials

Use with the [frontend](https://github.com/him912/restaurant_reservation/tree/main/client):

| Role | Email | Password |
|------|-------|----------|
| **Customer** | `dellsaini711@gmail.com` | `123456` |
| **Admin** | `Himanshusaini712@gmail.com` | `secret123` |
| **Restaurant Owner** | `Applelogintest6@gmail.com` | `123456` |
| **Restaurant Owner** | `shivika99@gmail.com` | `123456` |

## Tech stack

- Node.js · Express 5
- MongoDB · Mongoose
- JWT authentication
- Razorpay (payments, INR) · Stripe (optional)
- Socket.io (real-time availability)
- Cloudinary (image uploads)
- Nodemailer / Mailtrap (email)

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Install & run

```bash
npm install
```

Create `.env` in the `server` folder:

```env
PORT=5008
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_CREATE_SECRET=your_admin_registration_secret

# Cloudinary (restaurant & review images)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Frontend URL (for payment redirects & CORS)
CLIENT_URL=http://localhost:3000

# Payments — India (Razorpay, recommended)
PAYMENT_PROVIDER=razorpay
PAYMENT_CURRENCY=inr
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
BOOKING_DEPOSIT_MINOR_UNITS_PER_GUEST=50000

# Email (optional)
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=your_email@gmail.com
MAIL_SMTP_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME=DineFlow
```

```bash
npm start
```

API runs at **http://localhost:5008** (or your `PORT`).

Without Razorpay keys, the API runs in **demo payment mode** (reservations marked paid without opening Razorpay).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default varies) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `ADMIN_CREATE_SECRET` | Yes | Secret to register admin users |
| `CLIENT_URL` | Yes | Frontend URL for CORS & payment redirects |
| `CLOUDINARY_*` | Yes* | Image upload credentials |
| `PAYMENT_PROVIDER` | No | `razorpay` (default for INR) or `stripe` |
| `PAYMENT_CURRENCY` | No | Default `inr` |
| `RAZORPAY_KEY_ID` | For payments | Razorpay test/live key |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay secret |
| `BOOKING_DEPOSIT_MINOR_UNITS_PER_GUEST` | No | Deposit in paise (default ₹500 = `50000`) |

## Project structure

```
server/
├── config/          # Database connection
├── constants/       # Restaurant filter options
├── controllers/     # Route handlers
├── middleware/      # Auth, upload, role guards
├── models/          # Mongoose schemas
├── routes/          # API routes
├── sockets/         # Socket.io availability
├── utils/           # Currency, payment provider, email, Cloudinary
└── server.js        # Entry point
```

## API overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Password reset |

### Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | List/search restaurants |
| GET | `/api/restaurants/filters` | Filter metadata (cities, cuisines, features) |
| GET | `/api/restaurants/:id` | Restaurant details |
| GET | `/api/restaurants/:id/availability` | Slot availability by date |

**Search query params:** `search`, `city`, `cuisineType`, `priceRange`, `ratingMin`, `dietary`, `ambiance`, `features`

### Reservations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reservations` | Create reservation (customers only) |
| GET | `/api/reservations/my` | Customer bookings |
| GET | `/api/reservations/owner` | Owner bookings |
| PUT | `/api/reservations/:id/owner-status` | Owner accept/reject |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/config` | Payment config (currency, deposit) |
| POST | `/api/payments/create-checkout-session` | Create Razorpay order |
| POST | `/api/payments/verify-razorpay` | Verify Razorpay payment |
| POST | `/api/payments/mark-failed` | Mark payment failed |
| GET | `/api/payments/verify/:reservationId` | Check payment status |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/restaurant/:id` | Reviews for restaurant |
| POST | `/api/reviews` | Create review (customers only) |
| POST | `/api/reviews/:id/responses` | Owner reply |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reservations` | All reservations |
| PUT | `/api/admin/reservations/:id/status` | Accept/reject |
| GET | `/api/admin/reviews` | All reviews |
| POST | `/api/admin/reviews/:id/reply` | Admin reply |

## Razorpay setup (India)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Dashboard → **Settings** → **API Keys** → generate **Test** keys (`rzp_test_...`)
3. Add keys to `.env` and set `CLIENT_URL` to your deployed frontend

**Test payments (test mode):**

| Method | Details | Result |
|--------|---------|--------|
| UPI | `success@razorpay` | Success |
| UPI | `failure@razorpay` | Failed |
| Mastercard (domestic) | `5267 3181 8797 5449` | Success |
| Visa (domestic) | `4111 1111 1111 1111` | Success |
| Netbanking | Any bank → Success | Success |

Use any future expiry and any CVV for cards. India accounts often reject **international** test cards.

## Currency (INR)

- Menu prices: whole rupees in `menuItems.price` (e.g. `450` = ₹450)
- Payment amounts: **paise** in `reservations.paymentAmount` (`50000` = ₹500)

## Role rules

| Role | Book table | Post review | Reply to review |
|------|------------|-------------|-----------------|
| Customer | Yes | Yes | No |
| Owner | No | No | Yes (own restaurant) |
| Admin | No | No | Yes (admin panel) |

## Deploy (Render example)

1. New **Web Service** → connect this `server` folder
2. Build: `npm install`
3. Start: `npm start`
4. Add all `.env` variables in the Render dashboard
5. Set `CLIENT_URL` to your Netlify/Vercel frontend URL

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start API server |

## License

Apache-2.0
