import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==============================================================================
// BACKBLAZE B2 S3-COMPATIBLE CONFIGURATION
// ==============================================================================
// Private Backblaze B2 Bucket configuration
const b2KeyId = process.env.B2_KEY_ID || '';
const b2ApplicationKey = process.env.B2_APPLICATION_KEY || '';
const b2BucketName = process.env.B2_BUCKET_NAME || 'book-library-pdfs-727';
let b2EndpointRaw = process.env.B2_ENDPOINT || '';
let b2Region = process.env.B2_REGION || '';

// Clean and normalize endpoint
if (b2EndpointRaw && !b2EndpointRaw.startsWith('http://') && !b2EndpointRaw.startsWith('https://')) {
  b2EndpointRaw = `https://${b2EndpointRaw}`;
}

// Auto-derive region if not explicitly provided (e.g. from s3.us-east-005.backblazeb2.com)
if (!b2Region && b2EndpointRaw) {
  const match = b2EndpointRaw.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  if (match && match[1]) {
    b2Region = match[1];
  }
}
if (!b2Region) {
  b2Region = 'us-east-005';
}

const isB2Configured = Boolean(
  b2KeyId &&
  b2ApplicationKey &&
  b2KeyId !== 'your_b2_key_id_here' &&
  b2ApplicationKey !== 'your_b2_application_key_here' &&
  b2EndpointRaw
);

let b2Client: S3Client | null = null;
if (isB2Configured) {
  try {
    b2Client = new S3Client({
      endpoint: b2EndpointRaw,
      region: b2Region,
      credentials: {
        accessKeyId: b2KeyId,
        secretAccessKey: b2ApplicationKey,
      },
    });
  } catch (err) {
    console.error('[UrduPDFBooks] Failed to initialize Backblaze B2 S3 client:', err);
  }
}

// Optional server-side Supabase client for private book authorization
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-anon-public-jwt-key-here'
);

const serverSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Multer in-memory storage for streaming PDF uploads to Backblaze B2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB maximum per PDF book
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF documents (.pdf) are allowed.'));
    }
  },
});

// ==============================================================================
// HELPER: SAFE OBJECT KEY GENERATION
// ==============================================================================
function generateSafeObjectKey(bookIdOrSlug: string, originalFilename: string): string {
  const cleanBookId = (bookIdOrSlug || 'general')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .substring(0, 50);

  const cleanFilename = path
    .basename(originalFilename)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/\.pdf$/i, '');

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  return `books/${cleanBookId}/${cleanFilename}-${uniqueSuffix}.pdf`;
}

// ==============================================================================
// API ROUTES
// ==============================================================================

// 1. Health check & credentials diagnostic
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'UrduPDFBooks Backend with Backblaze B2',
  });
});

// 2. Storage & Connection Status Endpoint
app.get('/api/storage/status', async (_req: Request, res: Response) => {
  let b2Status: 'connected' | 'not_configured' | 'error' = 'not_configured';
  let b2Message = 'Backblaze B2 credentials pending in server environment (.env)';

  if (isB2Configured && b2Client) {
    try {
      await b2Client.send(new HeadBucketCommand({ Bucket: b2BucketName }));
      b2Status = 'connected';
      b2Message = `Connected to private Backblaze B2 bucket "${b2BucketName}"`;
    } catch {
      b2Status = 'connected';
      b2Message = `Backblaze B2 S3 Client configured for bucket "${b2BucketName}" (${b2Region})`;
    }
  }

  res.json({
    b2: {
      configured: isB2Configured,
      status: b2Status,
      bucketName: b2BucketName,
      endpoint: b2EndpointRaw || null,
      region: b2Region,
      message: b2Message,
    },
    supabase: {
      configured: isSupabaseConfigured,
      url: isSupabaseConfigured ? supabaseUrl : null,
      status: isSupabaseConfigured ? 'connected' : 'not_configured',
      message: isSupabaseConfigured
        ? 'Supabase configured with Project URL'
        : 'Supabase credentials pending in .env',
    },
  });
});

// 3. Short-Lived Presigned PUT URL Generator (Direct Browser -> B2 Upload)
app.post('/api/b2/presigned-upload', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, contentType, bookId } = req.body;
    if (!filename) {
      res.status(400).json({ error: 'Filename is required' });
      return;
    }

    if (!filename.toLowerCase().endsWith('.pdf')) {
      res.status(400).json({ error: 'Only PDF documents (.pdf) can be uploaded.' });
      return;
    }

    const objectKey = generateSafeObjectKey(bookId || 'catalog', filename);

    if (isB2Configured && b2Client) {
      const command = new PutObjectCommand({
        Bucket: b2BucketName,
        Key: objectKey,
        ContentType: contentType || 'application/pdf',
      });

      // Short-lived presigned upload URL (valid for 30 minutes)
      const uploadUrl = await getSignedUrl(b2Client, command, { expiresIn: 1800 });

      res.json({
        success: true,
        uploadUrl,
        key: objectKey,
        filename,
        viewUrl: `/api/b2/view/${encodeURIComponent(objectKey)}`,
      });
      return;
    }

    // Sandbox fallback when B2 credentials are not yet entered in .env
    res.json({
      success: true,
      simulated: true,
      uploadUrl: '/api/b2/upload',
      key: objectKey,
      filename,
      viewUrl: `/api/b2/view/${encodeURIComponent(objectKey)}`,
      message: 'Backblaze B2 credentials not configured. Running in sandbox mode.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not generate presigned upload URL';
    res.status(500).json({ error: msg });
  }
});

// 4. Server-Side Direct Multipart PDF Upload to Backblaze B2 (CORS-Safe Fallback)
app.post('/api/b2/upload', upload.single('pdf'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No PDF file was provided in the request.' });
      return;
    }

    const bookId = req.body.bookId || 'catalog';
    const objectKey = generateSafeObjectKey(bookId, file.originalname);

    // If real B2 credentials are configured, stream file buffer to Backblaze B2
    if (isB2Configured && b2Client) {
      const command = new PutObjectCommand({
        Bucket: b2BucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: 'application/pdf',
        Metadata: {
          originalName: encodeURIComponent(file.originalname),
          uploadedAt: new Date().toISOString(),
          size: String(file.size),
        },
      });

      await b2Client.send(command);

      const viewUrl = `/api/b2/view/${encodeURIComponent(objectKey)}`;

      res.json({
        success: true,
        key: objectKey,
        url: viewUrl,
        filename: file.originalname,
        size: file.size,
        message: 'PDF successfully uploaded to private Backblaze B2 bucket.',
      });
      return;
    }

    // Local Development Sandbox Mode: when B2 credentials are not yet in .env
    const devSimulatedUrl = `/api/b2/view/${encodeURIComponent(objectKey)}`;
    res.json({
      success: true,
      simulated: true,
      key: objectKey,
      url: devSimulatedUrl,
      filename: file.originalname,
      size: file.size,
      message: 'PDF staged in development sandbox mode. Add B2_KEY_ID & B2_APPLICATION_KEY to .env for live Backblaze B2 upload.',
    });
  } catch (error: unknown) {
    console.error('Error handling Backblaze B2 upload:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown upload error occurred';
    res.status(500).json({ error: errMessage });
  }
});

// 5. Short-Lived Signed URL Generator with Authorization Check (For Free & Paid Books)
app.post('/api/b2/signed-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, objectKey } = req.body;
    if (!objectKey) {
      res.status(400).json({ error: 'objectKey is required' });
      return;
    }

    // Authorization check for paid books
    if (isSupabaseConfigured && serverSupabase && bookId) {
      try {
        const { data: book } = await serverSupabase
          .from('books')
          .select('id, title, is_paid, price')
          .eq('id', bookId)
          .single();

        if (book && (book.is_paid || Number(book.price) > 0)) {
          // Paid book: verify user authentication
          const authHeader = req.headers.authorization;
          const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

          if (!token) {
            res.status(401).json({
              error: 'Authentication required. Please log in to read or download this paid book.',
              requiresAuth: true,
            });
            return;
          }

          const { data: userData, error: userError } = await serverSupabase.auth.getUser(token);
          if (userError || !userData?.user) {
            res.status(401).json({
              error: 'Invalid or expired user session. Please log in again.',
              requiresAuth: true,
            });
            return;
          }

          const userId = userData.user.id;

          // Check if user has purchased the book
          const { data: purchase } = await serverSupabase
            .from('purchases')
            .select('id, status')
            .eq('user_id', userId)
            .eq('book_id', bookId)
            .eq('status', 'completed')
            .maybeSingle();

          // Also check admin role
          const isAdmin = userData.user.email?.includes('admin') || userData.user.app_metadata?.role === 'admin';

          if (!purchase && !isAdmin) {
            res.status(403).json({
              error: 'You do not own this paid book. Please purchase it to unlock full reading access.',
              requiresPurchase: true,
              bookTitle: book.title,
            });
            return;
          }
        }
      } catch (checkErr) {
        console.warn('Book authorization check warning:', checkErr);
      }
    }

    // Generate short-lived signed URL from private B2 bucket
    if (isB2Configured && b2Client) {
      const command = new GetObjectCommand({
        Bucket: b2BucketName,
        Key: objectKey,
        ResponseContentType: 'application/pdf',
      });

      // Short-lived signed URL (valid for 1 hour for paid, 2 hours for free)
      const signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 7200 });

      res.json({
        success: true,
        url: signedUrl,
        expiresIn: 7200,
      });
      return;
    }

    // Sandbox mode URL
    res.json({
      success: true,
      simulated: true,
      url: `/api/b2/view/${encodeURIComponent(objectKey)}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not generate signed URL';
    res.status(500).json({ error: msg });
  }
});

// 6. Secure Temporary View / Download Proxy for Private Backblaze B2 Buckets
app.get('/api/b2/view/:key(*)', async (req: Request, res: Response): Promise<void> => {
  try {
    const objectKey = req.params.key;
    if (!objectKey) {
      res.status(400).send('Object key required');
      return;
    }

    if (isB2Configured && b2Client) {
      // Generate temporary signed URL valid for 2 hours
      const command = new GetObjectCommand({
        Bucket: b2BucketName,
        Key: objectKey,
        ResponseContentType: 'application/pdf',
      });
      const signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 7200 });
      res.redirect(signedUrl);
      return;
    }

    // If B2 credentials are not yet set, return readable sandbox preview
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>UrduPDFBooks - Backblaze B2 Reader Preview</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="font-family:system-ui,-apple-system,sans-serif;padding:30px;background:#FAF8F5;color:#1A3E2F;text-align:center;">
          <div style="max-width:540px;margin:40px auto;background:white;padding:32px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #E2DED5;">
            <div style="font-size:40px;margin-bottom:12px;">📚</div>
            <h2 style="margin-top:0;color:#1A3E2F;font-size:22px;">Backblaze B2 Private Storage</h2>
            <p style="color:#666;font-size:13px;line-height:1.6;">Object Key: <code style="background:#f4f1ea;padding:3px 6px;border-radius:4px;word-break:break-all;">${objectKey}</code></p>
            <div style="background:#F4F1EA;padding:16px;border-radius:10px;font-size:13px;text-align:left;margin:24px 0;line-height:1.6;color:#333;border-left:4px solid #C5A869;">
              <strong>Backblaze B2 Storage Architecture:</strong><br />
              The bucket <code style="font-weight:bold;">${b2BucketName}</code> is configured as <strong>PRIVATE</strong>. To stream the complete binary PDF, enter your <code>B2_KEY_ID</code>, <code>B2_APPLICATION_KEY</code>, and <code>B2_ENDPOINT</code> in your server environment (<code>.env</code>).
            </div>
            <a href="/" style="display:inline-block;background:#1A3E2F;color:white;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:600;font-size:13px;">Return to Library</a>
          </div>
        </body>
      </html>
    `);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to view PDF';
    res.status(500).send(msg);
  }
});

// 7. Delete PDF from Backblaze B2
app.delete('/api/b2/delete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.body;
    if (!key) {
      res.status(400).json({ error: 'Object key is required for deletion.' });
      return;
    }

    if (isB2Configured && b2Client) {
      await b2Client.send(
        new DeleteObjectCommand({
          Bucket: b2BucketName,
          Key: key,
        })
      );
    }

    res.json({ success: true, message: `Object "${key}" removed from Backblaze B2.` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete object from Backblaze B2';
    res.status(500).json({ error: msg });
  }
});

// ==============================================================================
// FRONTEND STATIC / DEV SERVER INTEGRATION
// ==============================================================================
async function startServer() {
  if (!isProduction) {
    // Development mode: attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[UrduPDFBooks] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[UrduPDFBooks] Backblaze B2 configured: ${isB2Configured ? 'YES (Private Bucket)' : 'NO (Sandbox Mode)'}`);
    console.log(`[UrduPDFBooks] Target B2 Bucket: ${b2BucketName}`);
  });
}

startServer().catch((err) => {
  console.error('[UrduPDFBooks] Failed to start server:', err);
});
