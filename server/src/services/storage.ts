import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

/**
 * Receipts are private operational data. Neither driver produces a publicly
 * reachable URL, and nothing in the Express app serves the upload directory.
 * Organisers read receipts through the token-protected admin endpoint.
 */

export interface StoredFile {
  key: string;
  mimeType: string;
  byteSize: number;
}

export interface StorageDriver {
  put(buffer: Buffer, mimeType: string, originalName: string): Promise<StoredFile>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/** Keys are random, never derived from the participant's filename. */
function buildKey(mimeType: string): string {
  const now = new Date();
  const folder = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const ext = EXTENSIONS[mimeType] ?? 'bin';
  return `receipts/${folder}/${crypto.randomUUID()}.${ext}`;
}

/** Guards against `..` or absolute paths arriving in a key. */
function assertSafeKey(key: string): void {
  if (!/^receipts\/[0-9]{4}-[0-9]{2}\/[a-f0-9-]+\.[a-z]+$/.test(key)) {
    throw new Error('Refusing to touch a storage key outside the receipts namespace');
  }
}

class LocalDriver implements StorageDriver {
  private root = path.resolve(config.UPLOAD_DIR);

  async put(buffer: Buffer, mimeType: string): Promise<StoredFile> {
    const key = buildKey(mimeType);
    const target = path.join(this.root, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer, { mode: 0o600 });
    return { key, mimeType, byteSize: buffer.byteLength };
  }

  async get(key: string): Promise<Buffer> {
    assertSafeKey(key);
    return fs.readFile(path.join(this.root, key));
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    await fs.rm(path.join(this.root, key), { force: true });
  }
}

class S3Driver implements StorageDriver {
  // Imported lazily so local installs need no AWS credentials to boot.
  private clientPromise = (async () => {
    const { S3Client } = await import('@aws-sdk/client-s3');
    return new S3Client({
      region: config.S3_REGION,
      endpoint: config.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(config.S3_ENDPOINT),
      credentials:
        config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY
          ? { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY }
          : undefined,
    });
  })();

  async put(buffer: Buffer, mimeType: string): Promise<StoredFile> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const key = buildKey(mimeType);
    const client = await this.clientPromise;
    await client.send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // No ACL is set — the bucket must block public access at the bucket level.
      }),
    );
    return { key, mimeType, byteSize: buffer.byteLength };
  }

  async get(key: string): Promise<Buffer> {
    assertSafeKey(key);
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.clientPromise;
    const result = await client.send(new GetObjectCommand({ Bucket: config.S3_BUCKET!, Key: key }));
    const chunks: Buffer[] = [];
    for await (const chunk of result.Body as AsyncIterable<Buffer>) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.clientPromise;
    await client.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET!, Key: key }));
  }
}

export const storage: StorageDriver =
  config.STORAGE_DRIVER === 's3' ? new S3Driver() : new LocalDriver();

/**
 * Magic-number check. A participant can rename anything to .pdf, so the declared
 * MIME type is not trusted on its own.
 */
export function sniffMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png';
  if (buffer.subarray(0, 4).toString('ascii') === '%PDF') return 'application/pdf';
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp';
  return null;
}
