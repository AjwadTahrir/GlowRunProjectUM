import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Artwork, MissingAsset } from './ui';

/**
 * The form is presented as a paper entry form — ruled fields, numbered parts,
 * mono labels — but the logic is untouched: same validation, same signed upload
 * reference, same idempotency key, same server as the authority on capacity.
 */

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; name: string; percent: number }
  | { phase: 'ready'; name: string; ref: string }
  | { phase: 'error'; name: string; message: string };

/** A numbered part of the form. Editorial markers, not a multi-screen wizard. */
function Part({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-8 border-t border-[color:var(--rule)] pt-8 lg:grid-cols-12">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-baseline gap-4 lg:col-span-3 lg:flex-col lg:gap-1">
        <span className="font-mono text-xs text-gold">{index}</span>
        <span className="tech text-paper">{title}</span>
      </div>
      <div className="space-y-8 lg:col-span-8">{children}</div>
    </fieldset>
  );
}

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

  // Generated once per attempt and reused on retry, so a double tap or a flaky
  // connection cannot book two places.
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

  const isStudent = watch('category') === 'um_student';
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
        // A matric number typed before switching category never leaves the browser.
        matriculationNumber: values.category === 'um_student' ? values.matriculationNumber : undefined,
      };

      const result = await submitRegistration(payload, upload.ref, idempotencyKey.current);
      onRegistered(result.registration);
    } catch (error) {
      if (error instanceof ApiFailure) {
        if (error.fields) {
          for (const [field, message] of Object.entries(error.fields)) {
            setError(field as keyof RegistrationFormValues, { message });
          }
        }
        if (error.code === 'invalid_upload_reference') setUpload({ phase: 'idle' });
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
      <div className="border-t border-gold pt-10">
        <h3 className="display-lg">
          {status!.registration.isFull ? 'All places have been taken' : 'Registration is closed'}
        </h3>
        <p className="mt-6 max-w-[46ch] leading-relaxed text-paper/70">
          {status!.registration.isFull
            ? `Witches Glow Run is capped at ${status!.registration.maxCapacity} participants and every place is filled. There is no waiting list.`
            : (status!.registration.closedReason ?? 'Registration is not open at the moment.')}
        </p>
        <p className="tech mt-8 normal-case tracking-normal text-grey">
          Already registered? Keep your registration ID — the organiser will be in touch about payment verification.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-12">
      <Part index="01" title="Participant">
        <div>
          <label htmlFor="email" className="tech block">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="field"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="fullName" className="tech block">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="field"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : 'fullName-hint'}
            {...register('fullName')}
          />
          <p id="fullName-hint" className="tech mt-2 normal-case tracking-normal">
            As printed on your identification, for race pack collection.
          </p>
          {errors.fullName && (
            <p id="fullName-error" className="field-error" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="tech block">
            Phone number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className="field"
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={errors.phoneNumber ? 'phone-error' : 'phone-hint'}
            {...register('phoneNumber')}
          />
          <p id="phone-hint" className="tech mt-2 normal-case tracking-normal">
            Malaysian or international — 012-345 6789, or +60 12-345 6789.
          </p>
          {errors.phoneNumber && (
            <p id="phone-error" className="field-error" role="alert">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>
      </Part>

      <Part index="02" title="Category">
        <div>
          <label htmlFor="category" className="tech block">
            Participant category
          </label>
          <select
            id="category"
            className="field"
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
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Only UM students are asked. Everyone else never sees this field. */}
        {isStudent && (
          <div>
            <label htmlFor="matriculationNumber" className="tech block">
              Matriculation number
            </label>
            <input
              id="matriculationNumber"
              type="text"
              className="field"
              aria-invalid={Boolean(errors.matriculationNumber)}
              aria-describedby={errors.matriculationNumber ? 'matric-error' : undefined}
              {...register('matriculationNumber')}
            />
            {errors.matriculationNumber && (
              <p id="matric-error" className="field-error" role="alert">
                {errors.matriculationNumber.message}
              </p>
            )}
          </div>
        )}
      </Part>

      <Part index="03" title="Shirt">
        {eventConfig.posters.sizeChart ? (
          <Artwork
            src={eventConfig.posters.sizeChart}
            alt="Official T-shirt size chart with measurements"
            caption="Tap to enlarge the size chart"
          />
        ) : (
          <MissingAsset what="T-shirt size chart" />
        )}

        <p className="tech normal-case tracking-normal">
          {eventConfig.tshirt.chartNote.confirmed ? (
            eventConfig.tshirt.chartNote.value
          ) : (
            <span className="flag">Measurements not supplied</span>
          )}
        </p>

        <div>
          <label htmlFor="tshirtSize" className="tech block">
            Your size
          </label>
          <select
            id="tshirtSize"
            className="field"
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
              {errors.tshirtSize.message}
            </p>
          )}
        </div>
      </Part>

      <Part index="04" title="Payment">
        <div>
          <label htmlFor="paymentProof" className="tech block">
            Proof of payment
          </label>
          <input
            id="paymentProof"
            type="file"
            accept={(status?.upload.allowedMimeTypes ?? ['image/jpeg', 'image/png', 'application/pdf']).join(',')}
            onChange={onFileChange}
            className="field py-4 file:mr-4 file:border-0 file:bg-gold file:px-4 file:py-2 file:font-mono file:text-xs file:uppercase file:tracking-[0.14em] file:text-ink"
            aria-describedby="upload-status"
          />

          <div id="upload-status" aria-live="polite" className="mt-3">
            {upload.phase === 'uploading' && (
              <>
                <p className="tech normal-case tracking-normal">
                  Uploading {upload.name} — {upload.percent}%
                </p>
                <div className="mt-2 h-px w-full bg-[color:var(--rule)]">
                  <div className="h-px bg-gold transition-all" style={{ width: `${upload.percent}%` }} />
                </div>
              </>
            )}
            {upload.phase === 'ready' && (
              <p className="tech-gold normal-case tracking-normal">{upload.name} uploaded</p>
            )}
            {upload.phase === 'error' && (
              <p className="field-error" role="alert">
                {upload.message}
              </p>
            )}
            {upload.phase === 'idle' && (
              <p className="tech normal-case tracking-normal">
                JPG, PNG, WebP or PDF, up to{' '}
                {Math.round((status?.upload.maxBytes ?? 5 * 1024 * 1024) / 1024 / 1024)} MB. Only the
                organising committee can open it.
              </p>
            )}
          </div>
        </div>

        <div id="terms" className="border-t border-[color:var(--rule)] pt-6">
          <details>
            <summary className="tech cursor-pointer text-paper">
              Terms and conditions — {eventConfig.terms.version}
            </summary>
            <div className="mt-4 max-w-[54ch] text-sm leading-relaxed text-paper/70">
              {!eventConfig.terms.body.confirmed && <span className="flag">Not approved</span>}
              <p className="mt-2">{eventConfig.terms.body.value}</p>
            </div>
          </details>

          <div className="mt-6 flex items-start gap-4">
            <input
              id="termsAccepted"
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 rounded-none border border-paper/40 bg-transparent accent-[#F5C542]"
              aria-invalid={Boolean(errors.termsAccepted)}
              aria-describedby={errors.termsAccepted ? 'terms-error' : undefined}
              {...register('termsAccepted')}
            />
            <label htmlFor="termsAccepted" className="max-w-[54ch] text-sm leading-relaxed text-paper/80">
              {eventConfig.terms.checkboxLabel}
            </label>
          </div>
          {errors.termsAccepted && (
            <p id="terms-error" className="field-error" role="alert">
              {errors.termsAccepted.message}
            </p>
          )}
        </div>
      </Part>

      {submitError && (
        <p className="border-l-2 border-red-400 py-2 pl-4 font-mono text-sm text-red-300" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-6 border-t border-[color:var(--rule)] pt-8">
        <button type="submit" className="btn-gold" disabled={submitting}>
          {submitting ? 'Registering…' : 'Complete registration'}
        </button>
        <p className="tech normal-case tracking-normal">
          Your place is confirmed only once the server accepts it.
        </p>
      </div>
    </form>
  );
}
