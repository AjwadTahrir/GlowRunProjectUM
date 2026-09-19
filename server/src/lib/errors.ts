import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger.js';

export type ErrorCode =
  | 'validation_failed'
  | 'registration_full'
  | 'registration_closed'
  | 'duplicate_email'
  | 'invalid_upload_reference'
  | 'upload_rejected'
  | 'not_found'
  | 'unauthorised'
  | 'rate_limited'
  | 'internal_error';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (code: ErrorCode, message: string, fieldErrors?: Record<string, string>) =>
  new ApiError(400, code, message, fieldErrors);

export const conflict = (code: ErrorCode, message: string) => new ApiError(409, code, message);

function zodToFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_';
    if (!(path in out)) out[path] = issue.message;
  }
  return out;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: { code: 'validation_failed', message: 'Some fields need fixing', fields: zodToFieldErrors(error) },
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, fields: error.fieldErrors },
    });
    return;
  }

  logger.error('unhandled_error', { detail: error instanceof Error ? error.message : String(error) });
  res.status(500).json({
    error: { code: 'internal_error', message: 'Something went wrong on our side. Try again in a moment.' },
  });
}
