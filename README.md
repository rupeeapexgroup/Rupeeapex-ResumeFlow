# ResumeFlow – Rupeeapex Groups of Companies
## Production-Ready Full-Stack HR Job Application Management Portal

ResumeFlow is a modern, enterprise-grade, secure full-stack HR Job Application Management System custom-engineered for **Rupeeapex Groups of Companies**.

---

## 📌 Executive Summary & Architecture

The portal provides two segregated application experiences:

1. **Public Candidate Application Portal (`/apply`)**:
   - Candidates scan **ONE common QR code** displayed at the Rupeeapex reception desk.
   - Candidates immediately access the digital application form on their mobile browser without creating an account or logging in.
   - Preserves all 10 sections of the official Rupeeapex paper Job Application Form.
   - Requires mandatory selection of preferred group division: **GOLD**, **NIDHI**, **MFI**, **CHIT**, or **INSURANCE**.
   - Captures/uploads candidate photographs directly from mobile camera or gallery.
   - Generates an atomic, collision-proof sequence Application ID (`RAP-YYYY-000001`).
   - Strictly isolated: Candidates can never browse, view, search, or edit other candidates' submissions.

2. **Private Internal HR Management Portal (`/admin/dashboard`, `/admin/candidates`)**:
   - Strictly accessible only to **two pre-authorized HR administrators**.
   - Pre-provisioned accounts with bcrypt password hashing, brute-force lockout protection (5 failed attempts locks for 15 minutes), and secure HTTP-only JWT sessions.
   - **Dashboard**: Real-time MongoDB metrics (Total, New, Under Review, Shortlisted, Selected, Rejected) and role-wise breakdown (GOLD, NIDHI, MFI, CHIT, INSURANCE).
   - **Candidate Management**: Searchable and filterable table with server-side pagination, search by Candidate Name, Application ID, and Mobile Number, and filters by Preferred Role, Status, and Date.
   - **Candidate Details & Status Management**: Full profile view with private photograph retrieval, live status updates, and recruitment notes.
   - **Printable A4 PDF Generation**: Generates official Rupeeapex paper-style PDF document featuring the full company banner, candidate photograph, application details, and signature section.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Rupeeapex Green `#006B3C` and Yellow `#F5C400`)
- **Database & ODM**: MongoDB & Mongoose (with atomic counter sequences and indexed queries)
- **Authentication**: Custom zero-dependency Jose JWT session system with HTTP-only secure cookies
- **Password Security**: `bcryptjs` with salt rounds = 12
- **Validation**: Zod schema validation
- **QR Generation**: `qrcode` (Generates high-resolution PNG QR and A4 reception poster)
- **PDF Generation**: `pdf-lib` (Server-side pure JavaScript A4 PDF engine with embedded JPEG/PNG banners and photos)
- **Icons**: Lucide React

---

## 📁 Project Structure

```
HR job Application/
├── public/
│   ├── logo/
│   │   ├── rupeeapex-logo.jpeg            # Official Rupeeapex emblem logo
│   │   ├── rupeeapex-banner.jpeg          # Compact company banner
│   │   └── Rupeeapex-fullBanner.jpeg      # Official Rupeeapex full header banner
│   └── qr/
│       ├── reception-qr.png               # High-res permanent reception QR code
│       └── reception-poster.pdf           # Print-ready A4 Reception Poster PDF
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Portal Home / Reception Entry
│   │   ├── apply/page.tsx                 # Candidate Application Form (10 Sections)
│   │   ├── login/page.tsx                 # HR Secure Sign-In
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx         # HR Recruitment Dashboard & Metrics
│   │   │   └── candidates/
│   │   │       ├── page.tsx               # Searchable Candidate Table & Filters
│   │   │       └── [id]/page.tsx          # Full Candidate Profile & Status Updater
│   │   └── api/
│   │       ├── auth/                      # login, logout, me
│   │       ├── applications/              # Public candidate submission endpoint
│   │       ├── candidates/                # HR candidate list & search
│   │       │   └── [id]/                  # Single candidate view & status patch
│   │       │       ├── pdf/               # Authenticated PDF generator
│   │       │       └── photo/             # Authenticated private photo streamer
│   │       └── admin/stats/               # MongoDB live dashboard aggregation
│   ├── components/
│   │   ├── branding/                      # CompanyHeader, Brand Logos
│   │   └── layout/                        # AdminSidebar
│   ├── lib/
│   │   ├── mongodb.ts                     # MongoDB connection pool & caching
│   │   ├── auth.ts                        # JWT cookie sessions & password hashing
│   │   ├── validation.ts                  # Zod validation schemas
│   │   ├── storage.ts                     # Private photo storage & magic bytes checker
│   │   └── constants.ts                   # Group roles, statuses, branding tokens
│   ├── models/
│   │   ├── Admin.ts                       # Admin schema & lockout logic
│   │   ├── Candidate.ts                   # 10-section candidate schema & indexes
│   │   └── Counter.ts                     # Atomic sequence counter (RAP-YYYY-XXXXXX)
│   ├── services/
│   │   ├── adminService.ts                # HR authentication & provisioning
│   │   ├── candidateService.ts            # Submission, search, filters & stats
│   │   └── pdfService.ts                  # A4 Job Application PDF generator
│   └── types/                             # TypeScript definitions
├── scripts/
│   ├── create-admins.ts                   # Provision the 2 authorized HR accounts
│   └── generate-qr.ts                     # Generate QR PNG & A4 Reception Poster
├── storage/
│   └── uploads/                           # Private photograph storage (never public)
├── tests/
│   └── system.test.ts                     # Comprehensive 18-step automated test suite
├── .env.example                           # Sample environment configuration
├── .env.local                             # Local development credentials
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+ (tested on Node.js v25)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/resumeflow`) or a MongoDB Atlas cluster URI.

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Key configuration settings in `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/resumeflow
SESSION_SECRET=resumeflow_rupeeapex_super_secure_jwt_session_secret_32chars!
STORAGE_DIR=./storage/uploads

HR_ADMIN_1_USERNAME=hr.admin1
HR_ADMIN_1_PASSWORD=RupeeapexHR1@2026

HR_ADMIN_2_USERNAME=hr.admin2
HR_ADMIN_2_PASSWORD=RupeeapexHR2@2026
```

### 4. Provision Authorized HR Accounts
Provision the two authorized HR administrators:
```bash
npm run seed
```
Output:
```
--- RESUMEFLOW: Initializing HR Accounts ---
Newly Provisioned Accounts: [ 'hr.admin1', 'hr.admin2' ]
Total HR Accounts Available: 2
Successfully completed HR account provisioning.
```

### 5. Generate Reception QR Code & A4 Poster
The project owner generates the permanent reception QR assets:
```bash
npm run generate-qr
```
This produces:
- `public/qr/reception-qr.png`: High-resolution QR code pointing to `/apply`
- `public/qr/reception-poster.pdf`: Ready-to-print A4 Reception Poster with Rupeeapex branding and instructions.

### 6. Run Automated Test Suite
Run the 18 automated test cases covering authentication, magic bytes, submissions, search, role filters, status updates, and PDF generation:
```bash
npm test
```
Result:
```
==================================================
ALL 18 TEST CASES PASSED WITH 100% SUCCESS!
==================================================
```

### 7. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Architecture

1. **Strict HR Authorization**:
   - Only 2 pre-authorized HR accounts exist. Public admin registration is permanently blocked.
   - Passwords hashed with `bcrypt` (12 salt rounds).
   - Brute-force protection: 5 failed login attempts locks the account for 15 minutes.
2. **Session Integrity**:
   - HTTP-only, SameSite=Lax, Secure cookies (`resumeflow_session`).
   - Server-side verification on every API route and dashboard page (`verifySessionFromRequest`).
3. **Private Photograph Storage**:
   - Uploaded candidate photographs are stored outside the public web root in `storage/uploads/`.
   - File contents verified using magic bytes (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG).
   - Filenames are cryptographically randomized hex tokens.
   - Photographs are accessible only through authenticated HR route `/api/candidates/[id]/photo`.
4. **Candidate Isolation**:
   - Candidates have no account or login credentials.
   - Candidates receive a unique Application ID upon submission and cannot query, list, search, or view any other candidate's record.

---

## 📑 Manual Verification & Acceptance Testing

1. **Reception QR Test**:
   - Open `/public/qr/reception-poster.pdf` or visit `/`.
   - Scan the QR code using your smartphone camera or navigate to [http://localhost:3000/apply](http://localhost:3000/apply).
2. **Candidate Application Submission**:
   - Fill in personal details, family details, contact, address, education, and previous experience.
   - Select Preferred Role: **GOLD**, **NIDHI**, **MFI**, **CHIT**, or **INSURANCE**.
   - Upload a passport photograph.
   - Accept the declaration and submit.
   - Confirm receipt of unique ID (e.g., `RAP-2026-000001`).
3. **HR Login**:
   - Visit [http://localhost:3000/login](http://localhost:3000/login).
   - Login with `hr.admin1` and password `RupeeapexHR1@2026`.
4. **HR Dashboard & Filtering**:
   - Verify statistics cards update dynamically from MongoDB.
   - Check role-wise application breakdown for GOLD, NIDHI, MFI, CHIT, INSURANCE.
   - Click **Candidate Applications** to search candidates by name, ID, or mobile.
   - Filter by job role, application status, and date.
5. **Candidate Details & PDF Download**:
   - Click **View** on any candidate to inspect the full application details.
   - Change application status (e.g. from `NEW` to `SHORTLISTED`) and save notes.
   - Click **Download Official PDF** to verify the printable A4 document.

---

## 🚢 Production Deployment

### Option A: MongoDB Atlas + Vercel / Node Server
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Set `MONGODB_URI` in your production environment variables to your Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/resumeflow?retryWrites=true&w=majority
   ```
3. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://careers.rupeeapex.com`).
4. Set a strong random `SESSION_SECRET` (at least 32 characters).
5. Run `npm run seed` to initialize the 2 authorized HR accounts on MongoDB Atlas.
6. Run `npm run generate-qr` to produce the reception QR code pointing to your production domain.
7. Build and start:
   ```bash
   npm run build
   npm run start
   ```

---

## 🏢 Rupeeapex Groups of Companies
- **Primary Corporate Color**: `#006B3C` (Rupeeapex Forest Green)
- **Secondary Accent Color**: `#F5C400` (Rupeeapex Gold)
- **System Version**: ResumeFlow v1.0 Production

