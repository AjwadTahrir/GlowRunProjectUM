import { eventConfig } from '../../config/event';
import { Reveal, Stars, Tape, type StarSpec } from '../Graphics';
import { SectionShell, Title } from '../ui';

const STARS: StarSpec[] = [
  { x: 8, y: 30, s: 24, c: 'gold', twinkle: 2 },
  { x: 92, y: 20, s: 30, c: 'lavender' },
  { x: 60, y: 90, s: 8, c: 'paper', kind: 'dot' },
];

/** 09  BEFORE THE NIGHT. The WhatsApp group, shown once someone is registered. */
export function Community({ registered }: { registered: boolean }) {
  const { inviteUrl, qrImage, visibility } = eventConfig.whatsapp;
  if (visibility === 'after_registration' && !registered) return null;

  return (
    <SectionShell
      id="whatsapp"
      tone="purple"
      cut="b"
      className="overflow-hidden pb-[calc(var(--cut)+4rem)] pt-[calc(var(--cut)+4rem)]"
    >
      <Stars items={STARS} />
      <div className="shell relative grid items-center gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal from="left" tilt={-2}>
            <Title id="whatsapp" index="09" className="display text-[clamp(2.75rem,6.2vw,6rem)] leading-[0.86] text-paper">
              Before the night
            </Title>
          </Reveal>
          <p className="lede mt-6">Announcements, reminders and last-minute changes go out on WhatsApp first.</p>
          {inviteUrl ? (
            <a href={inviteUrl} target="_blank" rel="noreferrer noopener" className="btn-gold mt-8">
              Join WhatsApp group
            </a>
          ) : (
            <p className="mt-8 text-lg text-paper/85">The group link will be added here.</p>
          )}
        </div>

        {qrImage && (
          <Reveal from="right" tilt={3} className="relative lg:col-span-4 lg:col-start-9 lg:justify-self-end">
            <Tape tone="gold" tilt={-8} className="absolute -top-4 left-1/2 z-10 w-28 -translate-x-1/2">
              <span className="block h-5" />
            </Tape>
            <img
              src={qrImage}
              alt="QR code for the Witches Glow Run WhatsApp group"
              className="h-52 w-52 border-8 border-paper bg-paper"
            />
          </Reveal>
        )}
      </div>
    </SectionShell>
  );
}
