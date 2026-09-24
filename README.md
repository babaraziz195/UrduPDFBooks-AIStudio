# UrduPDFBooks - Digital Library & PDF Reader

A modern digital Urdu library and web application built with React, TypeScript, Tailwind CSS, Supabase, and Backblaze B2 Cloud Storage.

## Overview

UrduPDFBooks provides an elegant online reading experience for Urdu literature, novels, poetry, history, and classical manuscripts with a dedicated, secure administration panel for library catalog management.

### Key Architecture & Features

- **Frontend & Reader**:
  - Responsive, typography-focused UI using Google Fonts (`Noto Nastaliq Urdu`, `Amiri`, `Cormorant Garamond`, `Plus Jakarta Sans`).
  - Native in-browser PDF reader with zoom, page navigation, fullscreen, and dual reading modes.
  - Category and author discovery, search, filtering, and book details.
  - Access control distinguishing Free Public Editions from Premium Books with verified purchasing.

- **Admin Management Panel (`/admin`)**:
  - Secure role-based administration with Supabase Auth (restricted to `admin` / `superadmin` profiles).
  - Books management: create, edit, draft/publish, feature/unfeature, and safe deletion.
  - Categories and authors management.
  - Direct PDF uploads to Backblaze B2 via secure presigned PUT URLs with real-time progress indicators.
  - Audit logging of administrative actions.

- **Storage & Database**:
  - **Supabase**: PostgreSQL database for book metadata, categories, authors, user profiles, orders, and purchase grants with strict Row Level Security (RLS).
  - **Backblaze B2 (Private Bucket)**: Secure object storage for large PDF files using S3-compatible APIs. Book PDFs are never stored directly in the database or made publicly accessible without temporary signed URLs.

---

## Getting Started

### 1. Prerequisites

- **Node.js**: v18+ or v20+
- **Supabase Account**: A Supabase project with database and authentication enabled.
- **Backblaze B2 Account**: A private B2 bucket and an Application Key with Read/Write permissions.

---

### 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Client-side configuration (prefixed with VITE_)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"

# Server-side configuration (kept strictly private, never exposed to client)
PORT=3000
B2_KEY_ID="your_backblaze_key_id"
B2_APPLICATION_KEY="your_backblaze_application_key"
B2_BUCKET_NAME="book-library-pdfs-727"
B2_ENDPOINT="https://s3.us-east-005.backblazeb2.com"
B2_REGION="us-east-005"
```

---

### 3. Database Setup (Supabase)

1. Open your **Supabase Dashboard** -> **SQL Editor** -> **New Query**.
2. Copy the entire contents of `supabase-schema.sql` included in this repository.
3. Paste and run the script. This creates:
   - `profiles` table with automatic signup trigger and role-escalation prevention.
   - `categories`, `authors`, `books`, `orders`, `purchases`, and `admin_logs` tables.
   - Foreign keys, performance indexes, and automatic `updated_at` triggers.
   - Strict Row Level Security (RLS) policies enforcing that only `admin` users can manage library assets.
   - Initial category seed data.

#### Setting an Initial Admin User
To grant admin access to an account:
1. Register an account using Supabase Auth (or via your app).
2. In Supabase Table Editor -> `public.profiles`, update the user's `role` column to `'admin'` or `'superadmin'`.

---

### 4. Backblaze B2 Bucket & CORS Configuration

1. In the **Backblaze B2 Console**, create a **Private Bucket** (e.g. `book-library-pdfs-727`).
2. Generate an **Application Key** with access to your bucket.
3. Configure **CORS Rules** on your bucket to allow direct browser uploads:

```json
[
  {
    "corsRuleName": "AllowDirectBrowserUploads",
    "allowedOrigins": [
      "https://*.run.app",
      "https://*.pages.dev",
      "http://localhost:3000"
    ],
    "allowedOperations": [
      "s3_head",
      "s3_get",
      "s3_put",
      "s3_delete"
    ],
    "allowedHeaders": [
      "*"
    ],
    "exposeHeaders": [
      "ETag"
    ],
    "maxAgeSeconds": 3600
  }
]
```

---

### 5. Installation & Local Development

Install project dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application runs on `http://localhost:3000`.

---

### 6. Production Build

To build the client bundle:

```bash
npm run build
```

To run the full-stack server in production:

```bash
npm start
```

---

## Project Structure

```text
├── functions/             # Cloudflare Pages Functions (B2 signed URLs & upload endpoints)
├── public/                # Static assets
├── src/
│   ├── admin/             # Admin panel views, forms, and dashboard
│   ├── components/        # Public UI components (Navbar, Footer, Reader, Modals)
│   ├── data/              # Initial catalog and mock fallback data
│   ├── lib/               # Supabase client initialization & helpers
│   ├── pages/             # Public pages (Home, Catalog, BookDetail, Reader, Authors, About)
│   ├── services/          # Storage, books, and public catalogue services
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Main application router and view controller
│   └── main.tsx           # React DOM root entry
├── server.ts              # Full-stack Node/Express server & B2 S3 proxy
├── supabase-schema.sql    # Production Supabase database schema & RLS rules
├── SETUP.md               # Detailed step-by-step setup documentation
└── package.json           # Scripts and dependencies
```

## License

Private & Proprietary. All rights reserved.
