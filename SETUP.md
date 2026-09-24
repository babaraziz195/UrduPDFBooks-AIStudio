# UrduPDFBooks - Production Setup Guide (Supabase & Backblaze B2)

Welcome to the **UrduPDFBooks** administration setup guide. This document explains step-by-step how to configure **Supabase** for database & admin authentication, and **Backblaze B2 Cloud Storage** for secure, private PDF book storage (5–10+ GB with zero egress fees via Cloudflare integration).

---

## Quick Overview of Architecture

| Service | Purpose | Where Credentials Live |
| :--- | :--- | :--- |
| **Supabase Database & Auth** | Stores book details, categories, authors, user accounts, and purchases | Safe client variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| **Backblaze B2 Cloud Storage** | Stores actual high-resolution PDF book files in a **PRIVATE** bucket | Secret server-side variables (`B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_ENDPOINT`, `B2_REGION`) |
| **UrduPDFBooks Admin Panel** | Uploads covers, streams PDFs directly to B2 via presigned URLs, manages catalog | Accessible at `/admin` or `/admin/login` |

---

## PART A: Supabase Setup (Database & Authentication)

### Step 1: Create a Supabase Project
1. Open [https://supabase.com](https://supabase.com) and log in or create an account.
2. In your Supabase Dashboard, click **New Project**.
3. Choose your Organization, enter:
   - **Name**: `urdupdfbooks`
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Choose a region closest to your readers (e.g., *Singapore*, *Frankfurt*, or *Mumbai*).
4. Click **Create new project** and wait 1-2 minutes for provisioning to finish.

### Step 2: Run the Database Schema SQL
1. In your Supabase project menu on the left, click **SQL Editor** (icon looking like `>_`).
2. Click **+ New query**.
3. Open the file `supabase-schema.sql` from this project. Copy its **entire** contents.
4. Paste the SQL into the Supabase SQL Editor.
5. Click the green **Run** button (or press `Ctrl + Enter`).
6. You should see `Success. No rows returned`. All tables (`books`, `categories`, `authors`, `admin_logs`, `purchases`), indexes, triggers, and Row Level Security policies are now created!

### Step 3: Create Your First Admin User
1. In the left menu, click **Authentication** (icon looking like two people).
2. Click **Users**, then click the **Add user** button in the top right.
3. Choose **Create user**:
   - **Email**: Enter your personal admin email (e.g., `admin@urdupdfbooks.com` or your personal email).
   - **Password**: Enter a secure password.
   - Toggle **Auto Confirm User?** to **ON** (checked).
4. Click **Create user**.
5. This email and password will be your credentials to log in at `/admin/login`.

### Step 4: Copy Supabase API Keys
1. In the left menu, click the **Project Settings** gear icon at the bottom.
2. Click **API** (under Configuration).
3. Find:
   - **Project URL**: Copy this URL (e.g. `https://xyzcompany.supabase.co`).
   - **Project API Keys** > `anon` `public`: Copy this key (starts with `ey...`).
4. Keep these ready for Part C.

---

## PART B: Backblaze B2 Setup (Private PDF Storage)

Backblaze B2 provides S3-compatible cloud object storage. In this project, the bucket is **PRIVATE**, and PDFs are accessed only through short-lived presigned/signed URLs generated on the server.

### Step 1: Create the Backblaze B2 Private Bucket
1. Open [https://www.backblaze.com/b2/cloud-storage.html](https://www.backblaze.com/b2/cloud-storage.html) and sign in.
2. In the left sidebar, click **Buckets** under *B2 Cloud Storage*.
3. Click **Create a Bucket**:
   - **Bucket Unique Name**: `book-library-pdfs-727`
   - **Files in Bucket are**: Select **Private** (Crucial: Keep private so unauthenticated users cannot bypass access).
   - **Default Encryption**: Enabled (SSE-B2) or disabled as preferred.
   - **Object Lock**: Disabled.
4. Click **Create a Bucket**.
5. Note down the **Endpoint** shown in the bucket details (e.g., `s3.us-east-005.backblazeb2.com`).

### Step 2: Configure CORS for Direct In-Browser Uploads
To allow the Admin Panel to upload large book PDFs directly to Backblaze B2 via presigned PUT URLs, configure the CORS rules on your bucket:
1. On the Buckets page, find `book-library-pdfs-727` and click **Bucket Settings** (or use the B2 CLI / S3 API):
2. Set the CORS policy to allow your domains:
```json
[
  {
    "corsRuleName": "adminPdfUploadRule",
    "allowedOrigins": [
      "*"
    ],
    "allowedOperations": [
      "s3_put",
      "s3_get",
      "s3_head",
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

### Step 3: Create Backblaze B2 Application Key (S3 Credentials)
1. In the Backblaze left sidebar, click **Application Keys**.
2. Scroll down to **Add a New Application Key** and click it.
3. Configure the key:
   - **Name of Key**: `urdupdfbooks-admin-key`
   - **Allow access to Bucket(s)**: Select `book-library-pdfs-727` (or *All*).
   - **Type of Access**: Select **Read and Write**.
   - **File name prefix**: Leave empty (allows access to `books/*`).
   - **Duration**: Leave empty (no expiry).
4. Click **Create New Key**.
5. **CRITICAL WARNING**: Backblaze displays `applicationKey` **ONLY ONCE**. Copy immediately:
   - **keyID**: Copy this value (this will be `B2_KEY_ID`).
   - **applicationKey**: Copy this value (this will be `B2_APPLICATION_KEY`).

---

## PART C: Configure Environment Variables

Create or edit your `.env` file in the project root:

```bash
# --------------------------------------------------------------------------
# SAFE CLIENT-SIDE VARIABLES (Prefixed with VITE_, safe for browser bundle)
# --------------------------------------------------------------------------
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# --------------------------------------------------------------------------
# SECRET SERVER-SIDE VARIABLES (NEVER exposed to browser / client bundle)
# --------------------------------------------------------------------------
PORT=3000
B2_KEY_ID=your_b2_key_id_here
B2_APPLICATION_KEY=your_b2_application_key_here
B2_BUCKET_NAME=book-library-pdfs-727
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
```

### Deploying to Cloudflare Pages:
When deploying from GitHub to Cloudflare Pages:
1. Go to Cloudflare Dashboard > **Workers & Pages** > Select your project > **Settings** > **Environment Variables**.
2. Add the secret environment variables:
   - `B2_KEY_ID`
   - `B2_APPLICATION_KEY`
   - `B2_BUCKET_NAME` (`book-library-pdfs-727`)
   - `B2_ENDPOINT` (`https://s3.us-east-005.backblazeb2.com`)
   - `B2_REGION` (`us-east-005`)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. The serverless functions in `/functions/api/b2/*` automatically read these variables securely.

---

## PART D: How to Use the Admin Panel

1. Open your browser and navigate to:
   - `http://localhost:3000/admin` or click **Admin Portal** in the website footer.
2. Enter your Supabase Admin email and password created in **Part A, Step 3**.
3. You are now inside the **UrduPDFBooks Admin Dashboard**!

### Adding a Complete Book:
1. Click **Add New Book** in the sidebar.
2. Enter the **Book Title** (e.g., *Pir-e-Kamil*), **Author**, and **Category**.
3. (Optional) Enter Subtitle, Publication Year, Pages, and Descriptions.
4. Upload a high-resolution **Cover Image** (JPG, PNG, or WEBP).
5. In the **PDF File** section, click **Select Book PDF** and choose your `.pdf` file.
6. Click **Upload to Backblaze B2**. Watch the progress bar reach 100%. The file is uploaded to your private B2 bucket and tagged with a unique safe key (`books/slug-timestamp-uuid/filename.pdf`).
7. Choose access type:
   - **Free (Public Domain)**: Readable by all library visitors via secure signed URLs.
   - **Premium (Requires Purchase)**: Verified against the Supabase `purchases` table before generating signed URLs.
8. Choose status:
   - **Draft**: Saved in admin panel only, hidden from the public.
   - **Published**: Instantly visible to all readers on the live website!
9. Click **Publish Book**.

---

## PART E: Local Testing & Verification Checklist

- [x] Try visiting `/admin/login` directly.
- [x] Attempting to visit `/admin` without logging in redirects to `/admin/login`.
- [x] Check that `/admin/storage` displays your Backblaze B2 connection status and private bucket metrics.
- [x] Add a category, author, and book with an attached PDF.
- [x] Check that published books appear on the public library and homepage.
- [x] Check that the PDF reader loads the signed PDF from Backblaze B2 without exposing permanent credentials.
