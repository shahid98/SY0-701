import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { WidgetFrame } from './WidgetFrame';
import { cn, shuffle } from '@/lib/utils';

export const PROTOCOLS = [
  { insecure: 'Telnet', iport: 'TCP 23', secure: 'SSH', sport: 'TCP 22', use: 'Remote command-line administration' },
  { insecure: 'FTP', iport: 'TCP 20/21', secure: 'SFTP (over SSH) or FTPS', sport: 'TCP 22 / TCP 989–990', use: 'File transfer' },
  { insecure: 'TFTP', iport: 'UDP 69', secure: 'SFTP / SCP', sport: 'TCP 22', use: 'Simple file transfer (device configs)' },
  { insecure: 'HTTP', iport: 'TCP 80', secure: 'HTTPS (HTTP over TLS)', sport: 'TCP 443', use: 'Web traffic' },
  { insecure: 'SMTP (relay, plaintext)', iport: 'TCP 25', secure: 'SMTPS / submission with STARTTLS', sport: 'TCP 465 / TCP 587', use: 'Sending email' },
  { insecure: 'POP3', iport: 'TCP 110', secure: 'POP3S', sport: 'TCP 995', use: 'Retrieving email' },
  { insecure: 'IMAP', iport: 'TCP 143', secure: 'IMAPS', sport: 'TCP 993', use: 'Retrieving email' },
  { insecure: 'LDAP', iport: 'TCP 389', secure: 'LDAPS', sport: 'TCP 636', use: 'Directory queries' },
  { insecure: 'SNMPv1/v2c', iport: 'UDP 161/162', secure: 'SNMPv3', sport: 'UDP 161/162', use: 'Network device monitoring' },
  { insecure: 'DNS (plaintext)', iport: 'UDP/TCP 53', secure: 'DNS over TLS / DNS over HTTPS (+ DNSSEC for integrity)', sport: 'TCP 853 / TCP 443', use: 'Name resolution' },
  { insecure: 'Syslog (UDP)', iport: 'UDP 514', secure: 'Syslog over TLS', sport: 'TCP 6514', use: 'Log forwarding' },
  { insecure: 'SIP', iport: 'TCP/UDP 5060', secure: 'SIPS (SIP over TLS) + SRTP for media', sport: 'TCP 5061', use: 'VoIP signalling' },
  { insecure: 'NTP (unauthenticated)', iport: 'UDP 123', secure: 'NTS (Network Time Security)', sport: 'UDP 123 + TCP 4460', use: 'Time synchronization' },
];

/** Secure protocol reference with search and a quick replacement quiz. */
export default function PortTable() {
  const [q, setQ] = useState('');
  const [quiz, setQuiz] = useState(false);
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const list = PROTOCOLS.filter((p) => `${p.insecure} ${p.secure} ${p.iport} ${p.sport} ${p.use}`.toLowerCase().includes(q.toLowerCase()));
  const items = useMemo(() => shuffle(PROTOCOLS).slice(0, 5).map((p) => ({ p, options: shuffle([p.secure, ...shuffle(PROTOCOLS.filter((x) => x !== p)).slice(0, 2).map((x) => x.secure)]) })), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <WidgetFrame
      title="Secure protocols and ports"
      badge="Reference + quiz"
      toolbar={<Button size="xs" variant={quiz ? 'primary' : 'secondary'} onClick={() => { setQuiz(!quiz); setPicks({}); }}>{quiz ? 'Back to table' : 'Quiz me'}</Button>}
      note="Port numbers are defaults; services can run elsewhere. Prefer protocols that encrypt and authenticate, and disable the insecure versions."
    >
      {!quiz ? (
        <>
          <label className="relative mb-3 block max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter, e.g. 636, email, SNMP" className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-sm text-fg focus:border-accent focus:outline-none" aria-label="Filter protocols" />
          </label>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead><tr className="text-left text-xs text-muted"><th className="py-1.5 pr-2">Use</th><th className="pr-2">Insecure</th><th className="pr-2">Port</th><th className="pr-2">Secure alternative</th><th>Port</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.insecure} className="border-t border-line">
                    <td className="py-1.5 pr-2 text-fg-2">{p.use}</td>
                    <td className="pr-2 font-medium text-bad">{p.insecure}</td>
                    <td className="pr-2 font-mono text-xs text-muted">{p.iport}</td>
                    <td className="pr-2 font-medium text-ok">{p.secure}</td>
                    <td className="font-mono text-xs text-muted">{p.sport}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {items.map(({ p, options }, i) => (
            <div key={`${round}-${p.insecure}`} className="rounded-xl border border-line p-3">
              <div className="text-sm font-medium text-fg">Replace <span className="text-bad">{p.insecure}</span> ({p.iport}) for {p.use.toLowerCase()} with…</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {options.map((o) => {
                  const chosen = picks[i] === o;
                  const done = picks[i] !== undefined;
                  return (
                    <button key={o} type="button" disabled={done} onClick={() => setPicks((x) => ({ ...x, [i]: o }))}
                      className={cn('flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs', !done && 'border-line hover:border-line-strong', done && o === p.secure && 'border-ok/60 bg-ok/10', done && chosen && o !== p.secure && 'border-bad/60 bg-bad/10')}>
                      {done && o === p.secure && <CircleCheck className="h-3.5 w-3.5 text-ok" />}{done && chosen && o !== p.secure && <CircleX className="h-3.5 w-3.5 text-bad" />}{o}
                    </button>
                  );
                })}
              </div>
              {picks[i] !== undefined && <p className="mt-1.5 text-xs text-muted">Answer: {p.secure} on {p.sport}.</p>}
            </div>
          ))}
          <Button size="sm" onClick={() => { setRound((r) => r + 1); setPicks({}); }}><RotateCcw className="h-4 w-4" /> New questions</Button>
        </div>
      )}
    </WidgetFrame>
  );
}
