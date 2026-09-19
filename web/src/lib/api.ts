import type { RegistrationFormValues } from './validation';

/** Every network call the site makes. Errors arrive typed so the form can map them to fields. */

export interface EventStatus {
  registration: {
    open: boolean;
    isFull: boolean;
    placesRemaining: number;
    maxCapacity: number;
    closedReason: string | null;
  };
  terms: { version: string };
  upload: { maxBytes: number; allowedMimeTypes: string[] };
}

export interface RegistrationResult {
  id: string;
  fullName: string;
  email: string;
  category: string;
  tshirtSize: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  registrationStatus: string;
  createdAt: string;
}

export class ApiFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body?.error;
    throw new ApiFailure(
      error?.code ?? 'internal_error',
      error?.message ?? 'Something went wrong. Try again in a moment.',
      error?.fields,
    );
  }
  return body as T;
}

export async function fetchEventStatus(): Promise<EventStatus> {
  return parse<EventStatus>(await fetch('/api/event'));
}

export async function uploadPaymentProof(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  // XHR rather than fetch, because upload progress is worth showing on a phone.
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/uploads');

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      let body: { uploadRef?: string; error?: { code: string; message: string } } = {};
      try {
        body = JSON.parse(request.responseText);
      } catch {
        /* falls through to the generic failure below */
      }
      if (request.status >= 200 && request.status < 300 && body.uploadRef) resolve(body.uploadRef);
      else
        reject(
          new ApiFailure(
            body.error?.code ?? 'upload_rejected',
            body.error?.message ?? 'That file could not be uploaded.',
          ),
        );
    };

    request.onerror = () =>
      reject(new ApiFailure('upload_rejected', 'The upload failed. Check your connection and try again.'));

    request.send(form);
  });
}

export async function submitRegistration(
  values: RegistrationFormValues,
  uploadRef: string,
  idempotencyKey: string,
): Promise<{ registration: RegistrationResult; duplicate: boolean }> {
  const response = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ registration: values, uploadRef }),
  });
  return parse(response);
}

/** Stable across retries, so a double tap or a flaky connection cannot book two places. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
