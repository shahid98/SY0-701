import { useState } from 'react';
import { CircleCheck, CircleX, Flag, Mail, MessageSquare, Paperclip, Phone } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { Badge, Button, Callout, Card, Select } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { ResultBanner } from './kit';

type Seg = string | { id: string; text: string; flag: boolean; why: string; href?: string };

interface Msg {
  id: string;
  channel: 'email' | 'sms' | 'voice';
  from: Seg;
  replyTo?: Seg;
  subject?: Seg;
  attachment?: Seg;
  body: Seg[];
  verdict: number; // index in VERDICTS
  action: number; // index in ACTIONS
  lesson: string;
}

const VERDICTS = ['Legitimate', 'Credential phishing', 'Business email compromise (BEC)', 'Smishing', 'Vishing', 'Malware attachment'];
const ACTIONS = ['Report it to the security team', 'Verify through a known, separate channel', 'Comply / click / reply', 'No action needed (legitimate)'];

const h = (id: string, text: string, flag: boolean, why: string, href?: string): Seg => ({ id, text, flag, why, href });

const MESSAGES: Msg[] = [
  {
    id: 'bank', channel: 'email',
    from: h('from', 'Kestrel Bank Security <alerts@kestrel-bank-secure.com>', true, 'Lookalike domain: the bank uses kestrelbank.com, not “kestrel-bank-secure.com”.'),
    subject: h('subj', 'URGENT: Unusual sign-in — account will be suspended', true, 'Urgency and threat of suspension pressure you to act without thinking.'),
    body: [h('greet', 'Dear Valued Customer,', true, 'Generic greeting — your real bank knows your name.'), '\n\nWe detected a sign-in from a new device. To keep your account active you must ', h('ask', 'verify your username, password and card PIN', true, 'Legitimate banks never ask for passwords or PINs by email.'), ' within ', h('time', '24 hours', true, 'Artificial deadline.'), '.\n\n', h('link', 'https://kestrelbank.com/verify', true, 'The visible text says kestrelbank.com, but the real destination (hover) is a different, attacker-controlled site.', 'http://kestrel-bank-secure.com/login.php?id=88123'), '\n\nKestrel Bank Security Team'],
    verdict: 1, action: 0, lesson: 'Credential phishing combines a lookalike sender, urgency and a mismatched link. Report it; never use the link — visit the site by typing its address.',
  },
  {
    id: 'bec', channel: 'email',
    from: h('from', 'Dana Whitfield (CEO) <dana.whitfield@acmecorp-group.co>', true, 'Display name is the CEO, but the domain is not the company’s acmecorp.com.'),
    replyTo: h('reply', 'Reply-To: dana.w.office@freemail.example', true, 'Replies would go to an external free-mail account — a classic BEC tell.'),
    subject: 'Quick favour — confidential',
    body: ['Hi Sam,\n\nI’m stuck in board meetings all day. ', h('wire', 'I need you to process a wire of $48,500 to a new supplier today', true, 'Unusual, high-value payment request to a new payee.'), '. ', h('secret', 'Please keep this between us', true, 'Secrecy is used to stop you from checking with anyone.'), ' and ', h('bypass', "don't call — just reply here with confirmation", true, 'Discourages verification through a normal channel.'), '.\n\nThanks,\nDana'],
    verdict: 2, action: 1, lesson: 'Business email compromise impersonates an executive to trigger payments. Verify by calling the executive on a known number and follow the payment-approval process; then report it.',
  },
  {
    id: 'maint', channel: 'email',
    from: h('from', 'IT Service Desk <servicedesk@acmecorp.com>', false, 'The sender uses the genuine corporate domain.'),
    subject: 'Planned maintenance: Saturday 22:00–02:00',
    body: ['Hello all,\n\nEmail and VPN will be unavailable during the planned maintenance window this Saturday from 22:00 to 02:00. ', h('noaction', 'No action is required from you.', false, 'Nothing is being requested — no credentials, payments or downloads.'), '\n\nDetails are on the intranet: ', h('link', 'https://intranet.acmecorp.com/it/maintenance', false, 'The link text and destination match the real internal domain.', 'https://intranet.acmecorp.com/it/maintenance'), '\n\nIT Service Desk'],
    verdict: 0, action: 3, lesson: 'Not every email is malicious. This one requests nothing, matches a known process and links to the genuine internal domain. Over-reporting is better than under-reporting, but recognising legitimate mail matters too.',
  },
  {
    id: 'parcel', channel: 'sms',
    from: h('from', '+1 (555) 013-7782', true, 'Unknown mobile number rather than the courier’s registered short code.'),
    body: ['Orbital Parcel: your package is on hold due to an ', h('fee', 'unpaid customs fee of $1.99', true, 'A tiny fee lowers your guard; the real goal is your card details.'), '. Pay within 12h or it will be returned: ', h('link', 'orbita1-parcel.top/pay', true, 'Lookalike domain (digit “1” instead of “l”) on an unusual top-level domain.', 'http://orbita1-parcel.top/pay')],
    verdict: 3, action: 0, lesson: 'Smishing is phishing by SMS. Delivery-fee lures are common. Check the delivery in the courier’s official app and report the text (many carriers accept forwards to 7726).',
  },
  {
    id: 'call', channel: 'voice',
    from: h('from', 'Caller ID: “IT Help Desk” (internal extension shown)', true, 'Caller ID can be spoofed — it is not proof of identity.'),
    body: ['“Hi, this is Mike from the help desk. ', h('pretext', 'We’re seeing sync errors on your account and I need to fix them before end of day', true, 'Pretext: a believable story plus time pressure.'), '. ', h('otp', 'You’ll get a six-digit code on your phone in a second — just read it back to me', true, 'No legitimate support staff asks for your MFA code; it lets the caller log in as you.'), ', and we’re all set.”'],
    verdict: 4, action: 1, lesson: 'Vishing uses voice calls and pretexting. Hang up and call the help desk back on the number from the intranet, never share MFA codes, and report the attempt.',
  },
  {
    id: 'invoice', channel: 'email',
    from: h('from', 'Accounts <billing@fabrikam-invoices.net>', true, 'An unfamiliar sender domain for a supplier you don’t recognise.'),
    subject: 'Overdue invoice #INV-20931 — final notice',
    attachment: h('att', 'Invoice_INV-20931.pdf.exe', true, 'Double extension: it looks like a PDF but is an executable program.'),
    body: ['Hello,\n\nPlease see the attached overdue invoice. ', h('macro', 'If the document does not display, click “Enable content”.', true, 'Asking you to enable macros/content is a common way to run malware.'), '\n\nRegards,\nAccounts Receivable'],
    verdict: 5, action: 0, lesson: 'File-based vectors hide malware in attachments. Don’t open unexpected attachments; report them so the security team can block the sender and hunt for other recipients.',
  },
  {
    id: 'hr', channel: 'email',
    from: h('from', 'People Team <hr@acmecorp.com>', false, 'Genuine corporate domain.'),
    subject: 'Reminder: benefits enrollment closes Friday',
    body: ['Hi everyone,\n\nOpen enrollment closes on Friday. ', h('portal', 'Please sign in through the employee portal using your usual bookmark', false, 'It sends you to a known resource via your own bookmark rather than a link in the email.'), '. ', h('never', 'HR will never ask for your password by email.', false, 'Good practice language — a reassurance, not a red flag.'), '\n\nPeople Team'],
    verdict: 0, action: 3, lesson: 'Legitimate messages often tell you to use known channels and never request secrets. No link, no attachment, no secrecy, no urgency beyond a known deadline.',
  },
];

function hotspots(m: Msg): Exclude<Seg, string>[] {
  return [m.from, m.replyTo, m.subject, m.attachment, ...m.body].filter((s): s is Exclude<Seg, string> => !!s && typeof s !== 'string');
}

export default function PhishingLab({ onComplete }: LabProps) {
  const [cur, setCur] = useState(0);
  const [flags, setFlags] = useState<Record<string, Set<string>>>({});
  const [answers, setAnswers] = useState<Record<string, { v: number; a: number }>>({});
  const [submitted, setSubmitted] = useState<Record<string, number>>({});
  // Last link the learner tapped: touch screens have no hover, so its destination is shown under the message.
  const [peek, setPeek] = useState<{ msg: string; href: string } | null>(null);
  const m = MESSAGES[cur];
  const myFlags = flags[m.id] ?? new Set<string>();
  const done = submitted[m.id] !== undefined;
  const ans = answers[m.id];

  const toggleFlag = (id: string) => {
    if (done) return;
    const s = new Set(myFlags);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setFlags((f) => ({ ...f, [m.id]: s }));
  };

  const submit = () => {
    if (!ans) return;
    const hs = hotspots(m);
    const real = hs.filter((x) => x.flag);
    const found = real.filter((x) => myFlags.has(x.id)).length;
    const wrongFlags = hs.filter((x) => !x.flag && myFlags.has(x.id)).length;
    const flagScore = real.length ? Math.max(0, (found - wrongFlags) / real.length) : wrongFlags ? 0 : 1;
    const score = Math.round((ans.v === m.verdict ? 40 : 0) + (ans.a === m.action ? 30 : 0) + 30 * flagScore);
    const next = { ...submitted, [m.id]: score };
    setSubmitted(next);
    if (Object.keys(next).length === MESSAGES.length) onComplete(Math.round(Object.values(next).reduce((a, b) => a + b, 0) / MESSAGES.length));
  };

  const renderSeg = (s: Seg | undefined, key: string) => {
    if (!s) return null;
    if (typeof s === 'string') return <span key={key} className="whitespace-pre-wrap">{s}</span>;
    const flagged = myFlags.has(s.id);
    const reveal = done;
    return (
      <span key={key} className="group relative inline">
        <button
          type="button"
          onClick={() => { toggleFlag(s.id); if (s.href) setPeek({ msg: m.id, href: s.href }); }}
          title={s.href ? `Link destination: ${s.href}` : 'Click to flag as suspicious'}
          className={cn(
            'rounded px-0.5 text-left transition-colors',
            s.href && 'text-info underline',
            !reveal && flagged && 'bg-warn/25 ring-1 ring-warn',
            !reveal && !flagged && 'hover:bg-surface-3',
            reveal && s.flag && (flagged ? 'bg-ok/20 ring-1 ring-ok' : 'bg-bad/20 ring-1 ring-bad'),
            reveal && !s.flag && flagged && 'bg-bad/10 line-through decoration-bad',
          )}
        >
          {s.text}
        </button>
        {s.href && (
          <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-xs rounded-md bg-fg px-2 py-1 font-mono text-[11px] text-bg shadow-lg group-hover:block pointer-fine:group-focus-within:block">
            → {s.href}
          </span>
        )}
      </span>
    );
  };

  const total = Object.keys(submitted).length;
  const Icon = m.channel === 'email' ? Mail : m.channel === 'sms' ? MessageSquare : Phone;

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <Card className="p-2">
        <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">Inbox · {total}/{MESSAGES.length} triaged</div>
        <ul className="space-y-1">
          {MESSAGES.map((x, i) => {
            const I = x.channel === 'email' ? Mail : x.channel === 'sms' ? MessageSquare : Phone;
            const sc = submitted[x.id];
            const fromText = typeof x.from === 'string' ? x.from : x.from.text;
            const subj = x.subject ? (typeof x.subject === 'string' ? x.subject : x.subject.text) : x.channel === 'sms' ? 'Text message' : 'Phone call';
            return (
              <li key={x.id}>
                <button type="button" onClick={() => setCur(i)} className={cn('flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left', i === cur ? 'bg-accent/12' : 'hover:bg-surface-2')}>
                  <I className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-fg">{fromText.split('<')[0]}</span>
                    <span className="block truncate text-[11px] text-muted">{subj}</span>
                  </span>
                  {sc !== undefined && <Badge tone={sc >= 80 ? 'ok' : sc >= 50 ? 'warn' : 'bad'}>{sc}</Badge>}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-4">
        <Callout kind="info" title="How to play">Tap or click every element you find suspicious — sender, links, attachments, wording. Tapping a link also shows where it really goes, just below the message (with a mouse you can hover instead). Then choose a verdict and the correct response.</Callout>
        <Card className="overflow-hidden">
          <div className="space-y-1 border-b border-line bg-surface-2/50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><Icon className="h-3.5 w-3.5" /> {m.channel === 'email' ? 'Email' : m.channel === 'sms' ? 'SMS' : 'Call transcript'}</div>
            <div><span className="text-muted">{m.channel === 'voice' ? 'Caller: ' : 'From: '}</span>{renderSeg(m.from, 'from')}</div>
            {m.replyTo && <div>{renderSeg(m.replyTo, 'reply')}</div>}
            {m.subject && <div><span className="text-muted">Subject: </span><span className="font-semibold text-fg">{renderSeg(m.subject, 'subj')}</span></div>}
            {m.attachment && <div className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5 text-muted" />{renderSeg(m.attachment, 'att')}</div>}
          </div>
          <div className={cn('px-4 py-4 text-[14.5px] leading-relaxed text-fg', m.channel === 'voice' && 'italic')}>
            {m.body.map((s, i) => renderSeg(s, `b${i}`))}
          </div>
          {peek?.msg === m.id && (
            <div className="border-t border-line bg-surface-2/50 px-4 py-2.5 text-xs" aria-live="polite">
              <span className="font-semibold text-fg-2">Link preview: </span>
              <span className="text-muted">this link really goes to </span>
              <span className="break-all font-mono text-fg">{peek.href}</span>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Select label="Verdict" value={ans ? String(ans.v) : ''} onChange={(v) => !done && setAnswers((a) => ({ ...a, [m.id]: { v: Number(v), a: a[m.id]?.a ?? -1 } }))} className="min-w-56"
              options={[{ value: '', label: 'Choose…' }, ...VERDICTS.map((v, i) => ({ value: String(i), label: v }))]} />
            <Select label="Your response" value={ans && ans.a >= 0 ? String(ans.a) : ''} onChange={(v) => !done && setAnswers((a) => ({ ...a, [m.id]: { v: a[m.id]?.v ?? -1, a: Number(v) } }))} className="min-w-64"
              options={[{ value: '', label: 'Choose…' }, ...ACTIONS.map((v, i) => ({ value: String(i), label: v }))]} />
            <span className="flex items-center gap-1 text-sm text-muted"><Flag className="h-4 w-4 text-warn" /> {myFlags.size} flagged</span>
            {!done && <Button variant="primary" onClick={submit} disabled={!ans || ans.v < 0 || ans.a < 0}>Submit triage</Button>}
            {done && cur + 1 < MESSAGES.length && <Button variant="primary" onClick={() => setCur(cur + 1)}>Next message</Button>}
          </div>
          {done && (
            <div className="mt-4 space-y-3">
              <ResultBanner score={submitted[m.id]} total={100} message={`Verdict: ${VERDICTS[m.verdict]} · Response: ${ACTIONS[m.action]}`} />
              <ul className="space-y-1.5 text-sm">
                {hotspots(m).map((x) => (
                  <li key={x.id} className="flex gap-2">
                    {x.flag ? (myFlags.has(x.id) ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />) : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" />}
                    <span className="text-fg-2"><strong className="text-fg">{x.flag ? 'Red flag' : 'Not suspicious'}: </strong>“{x.text.length > 60 ? `${x.text.slice(0, 60)}…` : x.text}” — {x.why}{x.flag && !myFlags.has(x.id) && <em className="text-bad"> (missed)</em>}{!x.flag && myFlags.has(x.id) && <em className="text-bad"> (false flag)</em>}</span>
                  </li>
                ))}
              </ul>
              <Callout kind="memory" title="Lesson">{m.lesson}</Callout>
            </div>
          )}
        </Card>
        {total === MESSAGES.length && <ResultBanner score={Math.round(Object.values(submitted).reduce((a, b) => a + b, 0) / MESSAGES.length)} total={100} message="average triage score across all messages" />}
      </div>
    </div>
  );
}
