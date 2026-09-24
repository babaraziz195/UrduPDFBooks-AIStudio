import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface Env {
  B2_KEY_ID?: string;
  B2_APPLICATION_KEY?: string;
  B2_BUCKET_NAME?: string;
  B2_ENDPOINT?: string;
  B2_REGION?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

export function getB2Client(env: Env) {
  const b2KeyId = env.B2_KEY_ID || '';
  const b2ApplicationKey = env.B2_APPLICATION_KEY || '';
  let b2Endpoint = env.B2_ENDPOINT || '';
  let b2Region = env.B2_REGION || '';

  if (b2Endpoint && !b2Endpoint.startsWith('http://') && !b2Endpoint.startsWith('https://')) {
    b2Endpoint = `https://${b2Endpoint}`;
  }

  if (!b2Region && b2Endpoint) {
    const match = b2Endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
    if (match && match[1]) {
      b2Region = match[1];
    }
  }
  if (!b2Region) {
    b2Region = 'us-east-005';
  }

  const isConfigured = Boolean(
    b2KeyId &&
    b2ApplicationKey &&
    b2KeyId !== 'your_b2_key_id_here' &&
    b2ApplicationKey !== 'your_b2_application_key_here' &&
    b2Endpoint
  );

  const bucketName = env.B2_BUCKET_NAME || 'book-library-pdfs-727';

  let client: S3Client | null = null;
  if (isConfigured) {
    client = new S3Client({
      endpoint: b2Endpoint,
      region: b2Region,
      credentials: {
        accessKeyId: b2KeyId,
        secretAccessKey: b2ApplicationKey,
      },
    });
  }

  return { client, isConfigured, bucketName, b2Endpoint, b2Region };
}
