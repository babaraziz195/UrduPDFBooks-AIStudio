export interface B2UploadResult {
  success: boolean;
  key: string;
  url: string;
  filename: string;
  size: number;
  simulated?: boolean;
  message?: string;
}

export const storageService = {
  /**
   * Uploads PDF file to private Backblaze B2 bucket.
   * Prefers short-lived presigned PUT URL for high-performance direct upload,
   * with automatic fallback to secure backend proxy streaming if CORS is restricted.
   */
  async uploadPdf(
    file: File,
    bookId: string = 'catalog',
    onProgress?: (percentage: number) => void
  ): Promise<B2UploadResult> {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      throw new Error('Only PDF documents (.pdf) are permitted.');
    }

    // Step 1: Request a short-lived presigned upload URL from the server
    try {
      const presignedRes = await fetch('/api/b2/presigned-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: 'application/pdf',
          bookId,
        }),
      });

      if (presignedRes.ok) {
        const presignedData = await presignedRes.json();

        // If direct S3 presigned URL is returned (and not simulated fallback)
        if (
          presignedData.uploadUrl &&
          presignedData.uploadUrl.startsWith('http') &&
          !presignedData.simulated
        ) {
          try {
            return await this.uploadViaPresignedUrl(file, presignedData, onProgress);
          } catch (presignedErr) {
            console.warn(
              'Direct presigned upload encountered CORS or network issue. Falling back to server upload proxy:',
              presignedErr
            );
            // Fall through to server proxy upload below
          }
        }
      }
    } catch (presignedFetchErr) {
      console.warn('Presigned URL negotiation failed, falling back to upload proxy:', presignedFetchErr);
    }

    // Step 2: Fallback / standard backend proxy upload with progress
    return this.uploadViaServerProxy(file, bookId, onProgress);
  },

  /**
   * Upload file directly to Backblaze B2 using short-lived Presigned PUT URL
   */
  async uploadViaPresignedUrl(
    file: File,
    presignedData: { uploadUrl: string; key: string; filename: string; viewUrl: string },
    onProgress?: (percentage: number) => void
  ): Promise<B2UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedData.uploadUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/pdf');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100);
          resolve({
            success: true,
            key: presignedData.key,
            url: presignedData.viewUrl || `/api/b2/view/${encodeURIComponent(presignedData.key)}`,
            filename: presignedData.filename || file.name,
            size: file.size,
            message: 'PDF successfully uploaded to Backblaze B2.',
          });
        } else {
          reject(new Error(`Backblaze B2 upload rejected with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network or CORS error connecting to Backblaze B2.'));
      };

      xhr.send(file);
    });
  },

  /**
   * Upload file via backend multipart streaming proxy
   */
  async uploadViaServerProxy(
    file: File,
    bookId: string,
    onProgress?: (percentage: number) => void
  ): Promise<B2UploadResult> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('bookId', bookId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/b2/upload');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (onProgress) onProgress(100);
            resolve(data);
          } catch {
            reject(new Error('Invalid JSON response from server'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Failed to upload PDF to Backblaze B2'));
          } catch {
            reject(new Error(`Upload failed with status code ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during PDF upload. Check connection.'));
      };

      xhr.send(formData);
    });
  },

  /**
   * Delete PDF from Backblaze B2 bucket
   */
  async deletePdf(key: string): Promise<boolean> {
    if (!key) return true;
    try {
      const res = await fetch('/api/b2/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to delete PDF from Backblaze B2:', err);
      return false;
    }
  },

  /**
   * Request a short-lived signed URL for reading or downloading a private B2 PDF
   * (Enforces authorization for paid books)
   */
  async getSignedPdfUrl(
    objectKey: string,
    bookId?: string,
    userAuthToken?: string
  ): Promise<{ url: string; error?: string; requiresAuth?: boolean; requiresPurchase?: boolean }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userAuthToken) {
        headers['Authorization'] = `Bearer ${userAuthToken}`;
      }

      const res = await fetch('/api/b2/signed-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ objectKey, bookId }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          url: '',
          error: data.error || 'Access denied',
          requiresAuth: data.requiresAuth,
          requiresPurchase: data.requiresPurchase,
        };
      }
      return { url: data.url };
    } catch (err) {
      console.warn('Error obtaining signed PDF URL:', err);
      return { url: `/api/b2/view/${encodeURIComponent(objectKey)}` };
    }
  },

  /**
   * Cover image upload (optimizes and converts to data URL / storage URL)
   */
  async uploadCover(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; size: number }> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported image format. Please upload JPG, PNG, or WEBP.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image file is too large. Maximum size is 10 MB.');
    }

    if (onProgress) onProgress(30);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (onProgress) onProgress(100);
        const result = e.target?.result as string;
        resolve({
          url: result,
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Fetch backend storage status and Backblaze B2 connection diagnostics
   */
  async getStorageStatus(): Promise<{
    b2: {
      configured: boolean;
      status: string;
      bucketName: string;
      endpoint: string | null;
      region: string;
      message: string;
    };
    supabase: {
      configured: boolean;
      status: string;
      url: string | null;
      message: string;
    };
  }> {
    try {
      const res = await fetch('/api/storage/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error fetching storage status:', err);
    }

    return {
      b2: {
        configured: false,
        status: 'not_configured',
        bucketName: 'book-library-pdfs-727',
        endpoint: null,
        region: 'us-east-005',
        message: 'Could not connect to backend server',
      },
      supabase: {
        configured: false,
        status: 'not_configured',
        url: null,
        message: 'Supabase credentials pending in .env',
      },
    };
  },

  /**
   * Format bytes into readable MB or GB
   */
  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 MB';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
};
