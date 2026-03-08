# Public Information Office — Municipality of Naujan

A web-based public information system for the **Municipality of Naujan, Oriental Mindoro, Philippines**. Built for the LGU's Public Information Office to deliver transparent governance, community services, and real-time municipal updates to citizens.

**Created by:** Mark Gabriel G. Baje
**Program:** BS Information Technology — Mindoro State University, Calapan Campus

---

## What Is This Website?

This is the official digital platform of the Naujan Public Information Office (PIO). It serves two audiences:

- **Citizens** — Access announcements, events, government documents, services, disaster alerts, transparency reports, and submit feedback or complaints.
- **Government Staff** — Manage all public content, track complaints, respond to feedback, and maintain transparency records through a secured admin panel.

---

## Features

### Public-Facing (No Login Required)

| Feature | Description |
|---------|-------------|
| **Home Page** | Hero section with latest news, active disaster alerts, quick links |
| **Announcements** | Municipal notices, advisories, ordinances, resolutions, job postings |
| **Events** | Community events with date, location, and category filtering + search |
| **Documents** | Downloadable government documents (ordinances, forms, permits, reports) |
| **Services** | List of municipal services with requirements, steps, and fees + search |
| **Officials** | Directory of municipal department heads and offices |
| **Disaster Updates** | Real-time alerts with severity levels (info, advisory, warning, critical) |
| **Transparency** | Budget and financial reports for public accountability |
| **Feedback** | Citizens can submit suggestions, compliments, and inquiries |
| **Complaints** | File complaints by category (infrastructure, health, peace & order, etc.) |
| **Track Complaint** | Check complaint status using a tracking number |
| **Contact** | Contact information for the PIO |

### Admin Panel (Login Required)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview stats — total announcements, events, complaints, feedback |
| **Announcements Management** | Create, edit, publish/unpublish announcements with images |
| **Events Management** | Manage community events with dates, locations, categories |
| **Documents Management** | Upload and manage government documents (stored on Cloudinary) |
| **Services Management** | Define services with requirements, steps, processing time |
| **Departments Management** | Manage all 17 municipal departments and their heads |
| **Disaster Alerts** | Post and manage disaster updates with alert levels |
| **Transparency Reports** | Publish budget/financial transparency reports |
| **Feedback Management** | View and respond to citizen feedback |
| **Complaints Management** | Track, assign, and resolve citizen complaints |
| **User Management** | Create/edit users, assign roles and departments |
| **Audit Logs** | Full activity trail — who did what and when |
| **Site Settings** | Configure hero image, logo, and site branding |

---

## User Roles

| Role | Access Level |
|------|-------------|
| **Super Admin** | Full system access — all features and settings |
| **ICT Officer** | Broad access — manages content, documents, services, feedback, complaints, disaster alerts |
| **Department Editor** | Manages announcements, events, documents, services for their department |
| **Mayor's Office** | Manages announcements, events, transparency, feedback, complaints |
| **Public User** | Can submit feedback and complaints (no admin access) |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js v22 |
| **Framework** | Express.js |
| **Template Engine** | EJS with express-ejs-layouts |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Authentication** | JWT (httpOnly cookies) + bcrypt (12 rounds) |
| **2FA** | Email OTP for admin roles |
| **File Storage** | Cloudinary (images, documents, reports) |
| **Email** | Nodemailer with Gmail SMTP |
| **CSS** | Bootstrap 5.3.3 (dark theme) + custom CSS |
| **Security** | Helmet, CSP nonces, CORS, CSRF protection, rate limiting |

---

## Security Features

- **JWT Authentication** — httpOnly cookies with access (8h) + refresh (7d) tokens
- **Password Hashing** — bcrypt with 12 salt rounds
- **2FA Email OTP** — Required for admin-level logins (SHA-256 hashed, 10-min expiry, 3 attempt max)
- **Password Reset** — Secure reset via email with SHA-256 hashed tokens (30-min expiry)
- **Per-Account Lockout** — 5 failed login attempts locks account for 15 minutes
- **Rate Limiting** — Auth endpoints (15/15min), public forms (10/15min), API (200/15min)
- **Content Security Policy** — Per-request nonces for inline scripts
- **CSRF Protection** — Origin/Referer validation on all state-changing requests
- **Input Validation** — Server-side (express-validator) + client-side
- **Audit Logging** — All admin actions are logged with user, action, IP, and timestamp

---

## Project Structure

```
PIO_WEB/
├── server.js              # Express app entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in git)
├── .gitignore
├── config/
│   ├── db.js              # MongoDB connection
│   ├── multer.js          # File upload config (Cloudinary)
│   └── passport.js        # Auth config
├── controllers/           # Route handlers (11 controllers)
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── auditLog.js        # Activity logging
│   ├── roles.js           # Role-based access control
│   └── validators.js      # Input validation rules
├── models/                # Mongoose schemas (12 models)
├── routes/                # Express routes (14 route files + API)
├── seeds/
│   └── seed.js            # Database seeder (roles, departments, admin user)
├── utils/
│   ├── helpers.js         # Template helpers
│   ├── jwt.js             # JWT utilities
│   └── mailer.js          # Email sending (OTP + password reset)
├── views/
│   ├── admin/             # Admin panel views
│   ├── auth/              # Login, register, forgot/reset password
│   ├── errors/            # 404, 500, rate-limit pages
│   ├── layouts/           # Main, admin, auth layouts
│   ├── partials/          # Navbar, footer, sidebar, notification banner
│   └── public/            # Public-facing pages (home, announcements, etc.)
└── public/
    ├── css/style.css      # Custom styles
    └── js/main.js         # Client-side JS (validation, animations, banners)
```

---

## Setup & Installation

### Prerequisites
- **Node.js** v18+ (v22 recommended)
- **MongoDB Atlas** account (or local MongoDB)
- **Cloudinary** account (for file uploads)
- **Gmail** account with App Password (for email features)

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/PIO_WEB.git
cd PIO_WEB
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
# Server
NODE_ENV=development
PORT=3000
APP_NAME=Public Information Office Naujan
APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/pio_naujan

# Authentication
SESSION_SECRET=your-random-64-char-secret
JWT_SECRET=your-random-64-char-secret
JWT_REFRESH_SECRET=your-random-64-char-secret

# Cloudinary (file storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 5 user roles (super_admin, ict_officer, department_editor, mayors_office, public_user)
- 17 municipal departments
- 1 Super Admin account (email: `publicinformationoffice02@gmail.com`, password: `messageme`)

### 4. Start the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Visit **http://localhost:3000** in your browser.

---

## Default Login

| Field | Value |
|-------|-------|
| Email | `publicinformationoffice02@gmail.com` |
| Password | `SuperAdmin123!` |

> **Important:** Change the default password immediately after first login. Admin logins require 2FA email verification — check the inbox for the OTP code.

---

## Deployment (Render)

1. Push code to GitHub
2. Create a **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add all environment variables from `.env` (use production values)
7. Set `NODE_ENV=production`, `APP_URL=https://your-app.onrender.com`, `CORS_ORIGIN=https://your-app.onrender.com`

---

## Municipal Departments

| Code | Department |
|------|-----------|
| OMM | Office of the Municipal Mayor |
| OMVM | Office of the Municipal Vice Mayor |
| SB | Sangguniang Bayan |
| MPDO | Municipal Planning & Development Office |
| MBO | Municipal Budget Office |
| MACCO | Municipal Accounting Office |
| MTO | Municipal Treasurer's Office |
| MAO | Municipal Assessor's Office |
| MCR | Municipal Civil Registrar |
| MHO | Municipal Health Office |
| MSWDO | Municipal Social Welfare & Development Office |
| MAGRO | Municipal Agriculture Office |
| MEO | Municipal Engineering Office |
| MDRRMO | Municipal Disaster Risk Reduction & Management Office |
| MENRO | Municipal Environment & Natural Resources Office |
| HRMO | Human Resource Management Office |
| MICTO | Municipal Information & Communications Technology Office |

---

## License

ISC — Mark Gabriel G. Baje | LGU Naujan ICT Office
