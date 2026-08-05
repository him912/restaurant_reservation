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
```

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
- Reservation flow with confirmation ticket
- Pending → admin-approved reservation workflow
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
| `GET /api/reviews/restaurant/:id` | Reviews for a restaurant |
| `GET /api/admin/reservations` | Admin: all reservations |
| `GET /api/admin/reviews` | Admin: all reviews |

## License

Apache-2.0
