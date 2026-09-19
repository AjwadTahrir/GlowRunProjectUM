import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Lock } from 'lucide-react';
import { eventConfig } from '../config/event';
import {
  ApiFailure,
  newIdempotencyKey,
  submitRegistration,
  uploadPaymentProof,
  type EventStatus,
  type RegistrationResult,
} from '../lib/api';
import { CATEGORIES, CATEGORY_LABELS, registrationSchema, type RegistrationFormValues } from '../lib/validation';
import { MissingAsset, PosterFrame } from './ui';

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; name: string; percent: number }
  | { phase: 'ready'; name: string; ref: string }
  | { phase: 'error'; name: string; message: string };

export function RegistrationForm({
  status,
  onRegistered,
}: {
  status: EventStatus | null;
  onRegistered: (result: RegistrationResult) => void;
}) {
  const [upload, setUpload] = useState<UploadState>({ phase: 'idle' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Generated once per attempt and reused on retry, so a double tap, a slow
  // connection or a refresh cannot book two places.
  const idempotencyKey = useRef(newIdempotencyKey());

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    defaultValues: { category: undefined, tshirtSize: '', termsAccepted: false as never },
  });

  const category = watch('category');
  const isStudent = category === 'um_student';

  const closed = status && (!status.registration.open || status.registration.isFull);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUpload({ phase: 'uploading', name: file.name, percent: 0 });
    try {
      const ref = await uploadPaymentProof(file, (percent) =>
        setUpload({ phase: 'uploading', name: file.name, percent }),
      );
      setUpload({ phase: 'ready', name: file.name, ref });
    } catch (error) {
      setUpload({
        phase: 'error',
        name: file.name,
        message: error instanceof ApiFailure ? error.message : 'That file could not be uploaded.',
      });
    }
  }

  async function onSubmit(values: RegistrationFormValues) {
    if (upload.phase !== 'ready') {
      setSubmitError('Upload your proof of payment before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: RegistrationFormValues = {
        ...values,
        // A matriculation number typed before switching category never leaves the browser.
        matriculationNumber: values.category === 'um_student' ? values.matriculationNumber : undefined,
      };

      const result = await submitRegistration(payload, upload.ref, idempotencyKey.current);
      onRegistered(result.registration);
    } catch (error) {
      if (error instanceof ApiFailure) {
        // Server-side field errors land on the matching inputs.
        if (error.fields) {
          for (const [field, message] of Object.entries(error.fields)) {
            setError(field as keyof RegistrationFormValues, { message });
          }
        }
        if (error.code === 'invalid_upload_reference') {
          setUpload({ phase: 'idle' });
        }
        setSubmitError(error.message);
      } else {
        setSubmitError('We could not reach the server. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (closed) {
    return (
      <div className="panel border-glow/30">
        <h3 className="font-display text-2xl text-white">
          {status!.registration.isFull ? 'All places have been taken' : 'Registration is closed'}
        </h3>
        <p className="lede">
          {status!.registration.isFull
            ? `Witches Glow Run is capped at ${status!.registration.maxCapacity} participants and every place is now filled. There is no waiting list.`
            : (status!.registration.closedReason ?? 'Registration is not open at the moment.')}
        </p>
        <p className="mt-4 text-sm text-violet-mist">
          Already registered? Keep your registration ID — the organiser will contact you about payment verification.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-10">
      <fieldset className="panel space-y-5">
        <legend className="font-display text-xl text-white">Your details</legend>

        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="field-error" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="fullName" className="field-label">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="field-input"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : 'fullName-hint'}
            {...register('fullName')}
          />
          <p id="fullName-hint" className="field-hint">
            As it appears on your identification, for race pack collection.
          </p>
          {errors.fullName && (
            <p id="fullName-error" className="field-error" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="field-label">
            Participant category
          </label>
          <select
            id="category"
            className="field-input"
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'category-error' : undefined}
            defaultValue=""
            {...register('category')}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id="category-error" className="field-error" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Only UM students see this. Everyone else is never asked. */}
        {isStudent && (
          <div>
            <label htmlFor="matriculationNumber" className="field-label">
              Matriculation number
            </label>
            <input
              id="matriculationNumber"
              type="text"
              className="field-input"
              aria-invalid={Boolean(errors.matriculationNumber)}
              aria-describedby={errors.matriculationNumber ? 'matric-error' : undefined}
              {...register('matriculationNumber')}
            />
            {errors.matriculationNumber && (
              <p id="matric-error" className="field-error" role="alert">
                <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                {errors.matriculationNumber.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="phoneNumber" className="field-label">
            Phone number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className="field-input"
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={errors.phoneNumber ? 'phone-error' : 'phone-hint'}
            {...register('phoneNumber')}
          />
          <p id="phone-hint" className="field-hint">
            Malaysian or international. For example 012-345 6789 or +60 12-345 6789.
          </p>
          {errors.phoneNumber && (
            <p id="phone-error" className="field-error" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.phoneNumber.message}
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="panel space-y-5">
        <legend className="font-display text-xl text-white">T-shirt size</legend>

        {eventConfig.posters.sizeChart ? (
          <PosterFrame
            src={eventConfig.posters.sizeChart}
            alt="Official T-shirt size chart with measurements"
            caption="Tap to enlarge the size chart."
          />
        ) : (
          <MissingAsset what="T-shirt size chart" />
        )}

        <p className="field-hint">
          {eventConfig.tshirt.chartNote.confirmed ? (
            eventConfig.tshirt.chartNote.value
          ) : (
            <span className="placeholder-flag">Measurements not supplied</span>
          )}
        </p>

        <div>
          <label htmlFor="tshirtSize" className="field-label">
            Your size
          </label>
          <select
            id="tshirtSize"
            className="field-input"
            aria-invalid={Boolean(errors.tshirtSize)}
            aria-describedby={errors.tshirtSize ? 'size-error' : undefined}
            {...register('tshirtSize')}
          >
            <option value="" disabled>
              Choose a size
            </option>
            {eventConfig.tshirt.sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {errors.tshirtSize && (
            <p id="size-error" className="field-error" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.tshirtSize.message}
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="panel space-y-4">
        <legend className="font-display text-xl text-white">Proof of payment</legend>
        <p className="text-sm text-violet-mist">
          Upload your transfer receipt. Only the organising committee can open it — receipts are never published.
        </p>

        <label htmlFor="paymentProof" className="field-label">
          Receipt file
        </label>
        <input
          id="paymentProof"
          type="file"
          accept={(status?.upload.allowedMimeTypes ?? ['image/jpeg', 'image/png', 'application/pdf']).join(',')}
          onChange={onFileChange}
          className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-glow file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink"
          aria-describedby="upload-status"
        />

        <div id="upload-status" aria-live="polite" className="text-sm">
          {upload.phase === 'uploading' && (
            <div className="text-violet-mist">
              <span className="flex items-center gap-2">
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Uploading {upload.name} — {upload.percent}%
              </span>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-glow transition-all" style={{ width: `${upload.percent}%` }} />
              </div>
            </div>
          )}
          {upload.phase === 'ready' && (
            <p className="flex items-center gap-2 text-glow">
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              {upload.name} uploaded
            </p>
          )}
          {upload.phase === 'error' && (
            <p className="field-error" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {upload.message}
            </p>
          )}
          {upload.phase === 'idle' && (
            <p className="flex items-center gap-2 text-violet-mist">
              <FileUp aria-hidden className="h-4 w-4" />
              JPG, PNG, WebP or PDF, up to{' '}
              {Math.round((status?.upload.maxBytes ?? 5 * 1024 * 1024) / 1024 / 1024)} MB.
            </p>
          )}
        </div>
      </fieldset>

      <fieldset id="terms" className="panel space-y-4">
        <legend className="font-display text-xl text-white">Terms and conditions</legend>

        <details className="rounded-xl border border-white/10 bg-ink/50 p-4">
          <summary className="cursor-pointer text-white">Read the full terms ({eventConfig.terms.version})</summary>
          <div className="mt-3 max-w-prose text-sm text-violet-mist">
            {eventConfig.terms.body.confirmed ? (
              eventConfig.terms.body.value
            ) : (
              <>
                <span className="placeholder-flag">Not approved</span>
                <p className="mt-2">{eventConfig.terms.body.value}</p>
              </>
            )}
          </div>
        </details>

        <div className="flex items-start gap-3">
          <input
            id="termsAccepted"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 rounded border-white/30 bg-ink accent-[#F5C542]"
            aria-invalid={Boolean(errors.termsAccepted)}
            aria-describedby={errors.termsAccepted ? 'terms-error' : undefined}
            {...register('termsAccepted')}
          />
          <label htmlFor="termsAccepted" className="text-sm text-white">
            {eventConfig.terms.checkboxLabel}
          </label>
        </div>
        {errors.termsAccepted && (
          <p id="terms-error" className="field-error" role="alert">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {errors.termsAccepted.message}
          </p>
        )}
      </fieldset>

      {submitError && (
        <p className="panel border-red-400/40 text-red-200" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
              Registering…
            </>
          ) : (
            'Complete registration'
          )}
        </button>
        <p className="flex items-center gap-2 text-sm text-violet-mist">
          <Lock aria-hidden className="h-4 w-4" />
          Your place is confirmed only once the server accepts it.
        </p>
      </div>
    </form>
  );
}
