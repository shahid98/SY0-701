import { useState } from 'react';
import { CircleCheck, CircleX, Siren } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { Badge, Button, Callout, Card, Select } from '@/components/ui/primitives';
import { LogExplorer, type LogLine } from './LogExplorer';
import { ResultBanner } from './kit';
import { cn } from '@/lib/utils';

const SOURCES = { auth: 'Auth', fw: 'Firewall', dns: 'DNS', proxy: 'Proxy', edr: 'EDR', chg: 'Change log' };

const LOGS: LogLine[] = [
  { ts: '01:00:02', src: 'chg', text: 'CHG-2231 approved: weekly vulnerability scan host=VULN-SCAN-01 src=10.0.8.50 window=01:00-04:00 owner=secops' },
  { ts: '01:05:11', src: 'fw', text: 'ALLOW tcp src=10.0.8.50 dst=10.0.4.0/24 ports=1-1024 SYN count=12044 rule=scanner-allow', sev: 'warn' },
  { ts: '01:07:40', src: 'fw', text: 'ALLOW tcp src=10.0.8.50 dst=10.0.6.0/24 ports=1-1024 SYN count=11870 rule=scanner-allow', sev: 'warn' },
  { ts: '02:10:03', src: 'auth', text: 'FAIL user=a.ruiz src=203.0.113.77 protocol=IMAP reason=bad_password' },
  { ts: '02:10:05', src: 'auth', text: 'FAIL user=b.okafor src=203.0.113.77 protocol=IMAP reason=bad_password' },
  { ts: '02:10:08', src: 'auth', text: 'FAIL user=c.lindqvist src=203.0.113.77 protocol=IMAP reason=bad_password' },
  { ts: '02:10:10', src: 'auth', text: 'FAIL user=d.tanaka src=203.0.113.77 protocol=IMAP reason=bad_password' },
  { ts: '02:10:13', src: 'auth', text: 'FAIL user=e.novak src=203.0.113.77 protocol=IMAP reason=bad_password' },
  { ts: '02:10:16', src: 'auth', text: 'FAIL user=f.adeyemi src=203.0.113.77 protocol=IMAP reason=bad_password' },
  { ts: '02:10:19', src: 'auth', text: 'SUCCESS user=m.chen src=203.0.113.77 protocol=IMAP mfa=not_applied (legacy auth)', sev: 'crit' },
  { ts: '02:11:02', src: 'auth', text: 'FAIL user=g.silva src=203.0.113.77 protocol=IMAP reason=bad_password' },
  { ts: '02:14:45', src: 'auth', text: 'MAILBOX_RULE_CREATED user=m.chen src=203.0.113.77 rule="forward *invoice* to ext-archive@freemail.example"', sev: 'crit' },
  { ts: '02:47:12', src: 'proxy', text: 'UPLOAD host=FS-02 user=svc_backup dst=files.dropzone-share.example bytes=19327352832 category=unsanctioned-cloud-storage', sev: 'crit' },
  { ts: '02:47:13', src: 'fw', text: 'ALLOW tcp src=10.0.2.15 dst=198.51.100.200 port=443 bytes_out=19327352832 duration=3620s', sev: 'warn' },
  { ts: '03:00:00', src: 'proxy', text: 'UPLOAD host=FS-02 user=svc_backup dst=backup.corp.internal bytes=2147483648 category=corporate (scheduled nightly backup)' },
  { ts: '08:58:31', src: 'edr', text: 'PROCESS host=WS-0142 user=t.morgan proc=powershell.exe parent=WINWORD.EXE cmd="powershell -nop -w hidden -enc SQBFAFgA..."', sev: 'crit' },
  { ts: '08:58:40', src: 'dns', text: 'QUERY host=WS-0142 src=10.0.4.88 domain=update-cdn-sync.top type=A answer=203.0.113.150 domain_age=2d', sev: 'warn' },
  { ts: '08:59:40', src: 'dns', text: 'QUERY host=WS-0142 src=10.0.4.88 domain=update-cdn-sync.top type=A answer=203.0.113.150', sev: 'warn' },
  { ts: '09:00:40', src: 'dns', text: 'QUERY host=WS-0142 src=10.0.4.88 domain=update-cdn-sync.top type=A answer=203.0.113.150', sev: 'warn' },
  { ts: '09:00:41', src: 'fw', text: 'ALLOW tcp src=10.0.4.88 dst=203.0.113.150 port=443 bytes_out=1840 bytes_in=312 (60s interval)', sev: 'warn' },
  { ts: '09:02:10', src: 'auth', text: 'SUCCESS user=m.chen src=10.0.4.31 protocol=modern mfa=push_approved geo=London-HQ' },
  { ts: '10:15:02', src: 'auth', text: 'SUCCESS user=k.patel src=198.51.100.23 geo=Frankfurt-DE mfa=push_approved device=CORP-LT-311 compliant=true' },
  { ts: '10:22:47', src: 'auth', text: 'SUCCESS user=k.patel src=10.0.6.12 geo=London-HQ mfa=push_approved device=CORP-LT-311 compliant=true' },
  { ts: '10:23:00', src: 'chg', text: 'ASSET 198.51.100.23 = corporate VPN egress node (Frankfurt PoP), owner=network-team' },
];

interface Q { q: string; options: string[]; answer: number }
interface Alert {
  id: string; title: string; sev: 'Medium' | 'High' | 'Critical'; ts: string; rule: string; pivot: string;
  questions: Q[]; verdict: 'TP' | 'FP'; responses: string[]; response: number; debrief: string;
}

const ALERTS: Alert[] = [
  {
    id: 'a1', title: 'Many failed logins from one IP, then a success', sev: 'High', ts: '02:10:19', rule: 'AUTH-07: ≥5 accounts fail from one source within 5 min, followed by a success', pivot: '203.0.113.77',
    questions: [
      { q: 'What attack pattern do the logs show?', options: ['Brute force against one account', 'Password spraying across many accounts', 'Credential replay of a stolen token', 'Impossible travel'], answer: 1 },
      { q: 'Which account was compromised?', options: ['a.ruiz', 'g.silva', 'm.chen', 'k.patel'], answer: 2 },
      { q: 'Why did MFA not stop it?', options: ['The attacker had the MFA device', 'Legacy authentication (IMAP) bypassed MFA', 'MFA was approved by the user', 'MFA only applies inside the office'], answer: 1 },
    ],
    verdict: 'TP', response: 0,
    responses: ['Reset m.chen’s password, revoke sessions, remove the forwarding rule and block legacy auth', 'Close as false positive', 'Lock every account in the company', 'Block the IP only and take no account action'],
    debrief: 'One source tried a few common passwords against many accounts (spraying — avoids per-account lockout). m.chen succeeded via IMAP, which can’t do MFA, then a mail-forwarding rule was created — a BEC setup. Contain the account, remove persistence (the rule), and disable legacy protocols so MFA can’t be bypassed.',
  },
  {
    id: 'a2', title: 'Impossible travel: k.patel (Frankfurt → London in 7 min)', sev: 'Medium', ts: '10:22:47', rule: 'UEBA-03: sign-ins from locations >500 km apart within 1 hour', pivot: 'k.patel',
    questions: [
      { q: 'What explains the Frankfurt sign-in?', options: ['An attacker in Germany', 'The corporate VPN egress node is in Frankfurt', 'A stolen session cookie', 'DNS poisoning'], answer: 1 },
      { q: 'Which evidence supports your conclusion?', options: ['Same compliant corporate device and MFA in both sign-ins + asset record of the VPN IP', 'The time of day', 'The user’s job title', 'There is no evidence either way'], answer: 0 },
    ],
    verdict: 'FP', response: 1,
    responses: ['Disable k.patel and start incident response', 'Close as false positive and tune the rule to treat VPN egress IPs as known locations', 'Ignore it — UEBA alerts are always noise', 'Re-image CORP-LT-311'],
    debrief: 'Both sessions came from the same compliant corporate laptop with MFA; the “foreign” IP is the company’s own VPN egress. That’s a false positive — tune the rule (alert tuning) so known egress points don’t trigger it, rather than ignoring the alert type entirely.',
  },
  {
    id: 'a3', title: 'Workstation beaconing to a newly registered domain', sev: 'High', ts: '09:00:41', rule: 'NET-12: periodic connections (60s ± 2s) to a domain younger than 30 days', pivot: 'WS-0142',
    questions: [
      { q: 'Which host is affected?', options: ['FS-02', 'WS-0142', 'VULN-SCAN-01', 'CORP-LT-311'], answer: 1 },
      { q: 'What most likely started the malicious activity?', options: ['A user opened a document whose macro launched encoded PowerShell', 'A scheduled vulnerability scan', 'A Windows update', 'A misconfigured DNS server'], answer: 0 },
    ],
    verdict: 'TP', response: 0,
    responses: ['Isolate WS-0142 with EDR, block the domain/IP, and preserve evidence before reimaging', 'Reboot the workstation and monitor', 'Close as false positive', 'Delete the user’s mailbox'],
    debrief: 'WINWORD spawning hidden, encoded PowerShell, followed by regular 60-second beacons to a 2-day-old domain, is classic command-and-control. Contain first (isolate the host, block the indicators), preserve evidence, then eradicate and hunt for the same IoCs elsewhere.',
  },
  {
    id: 'a4', title: 'Internal port scan from 10.0.8.50', sev: 'Medium', ts: '01:05:11', rule: 'NET-02: >5,000 SYNs to many hosts from one internal source', pivot: '10.0.8.50',
    questions: [
      { q: 'What is 10.0.8.50?', options: ['A compromised workstation', 'The approved vulnerability scanner running in its change window', 'The file server', 'An attacker’s VPN address'], answer: 1 },
    ],
    verdict: 'FP', response: 1,
    responses: ['Isolate 10.0.8.50 immediately', 'Close as false positive and suppress this rule for the scanner during approved windows', 'Disable vulnerability scanning permanently', 'Escalate to law enforcement'],
    debrief: 'The change log shows CHG-2231: VULN-SCAN-01 (10.0.8.50) scans 01:00–04:00. Authorized scanning looks exactly like reconnaissance, so correlate with change records and suppress narrowly (this source, this window) — never globally.',
  },
  {
    id: 'a5', title: '18 GB upload to unsanctioned cloud storage', sev: 'Critical', ts: '02:47:12', rule: 'DLP-05: >5 GB to an uncategorised or unsanctioned destination', pivot: 'svc_backup',
    questions: [
      { q: 'Which system sent the data?', options: ['WS-0142', 'FS-02 (file server) using svc_backup', 'VULN-SCAN-01', 'm.chen’s mailbox'], answer: 1 },
      { q: 'Why is this suspicious even though svc_backup normally moves data?', options: ['Backups always go to backup.corp.internal at 03:00 — this went to an unsanctioned external site at 02:47', 'The file was too small', 'It used port 443', 'Backups are never run at night'], answer: 0 },
    ],
    verdict: 'TP', response: 0,
    responses: ['Escalate to incident response: block the destination, disable/rotate svc_backup, preserve logs (possible breach)', 'Close as normal backup traffic', 'Delete the file server', 'Email the vendor of the cloud storage site'],
    debrief: 'A service account sending 18 GB to an unsanctioned site outside its normal schedule and destination is likely exfiltration. Treat it as a potential data breach: contain, preserve evidence (legal hold may apply), and notify according to the IR plan.',
  },
];

interface CaseState { answers: Record<number, number>; verdict?: 'TP' | 'FP'; response?: number; score?: number }

export default function SocLab({ onComplete }: LabProps) {
  const [cur, setCur] = useState(0);
  const [query, setQuery] = useState(ALERTS[0].pivot);
  const [cases, setCases] = useState<Record<string, CaseState>>({});
  const a = ALERTS[cur];
  const c: CaseState = cases[a.id] ?? { answers: {} };
  const closed = c.score !== undefined;
  const ready = a.questions.every((_, i) => c.answers[i] !== undefined) && c.verdict && c.response !== undefined;

  const set = (patch: Partial<CaseState>) => setCases((all) => ({ ...all, [a.id]: { ...c, ...patch } }));

  const submit = () => {
    const qOk = a.questions.filter((q, i) => c.answers[i] === q.answer).length;
    const pts = qOk + (c.verdict === a.verdict ? 2 : 0) + (c.response === a.response ? 2 : 0);
    const max = a.questions.length + 4;
    const score = Math.round((pts / max) * 100);
    const next = { ...cases, [a.id]: { ...c, score } };
    setCases(next);
    if (ALERTS.every((x) => next[x.id]?.score !== undefined)) onComplete(Math.round(ALERTS.reduce((s, x) => s + (next[x.id].score ?? 0), 0) / ALERTS.length));
  };

  const closedCount = ALERTS.filter((x) => cases[x.id]?.score !== undefined).length;

  return (
    <div className="space-y-4">
      <Callout kind="info" icon={<Siren className="h-4 w-4 text-info" />} title="Your shift in the SOC">
        The SIEM has raised five alerts overnight. For each one: read the rule, pivot through the logs, answer the investigation questions, decide <strong>true or false positive</strong>, and choose the response.
      </Callout>
      <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
        <Card className="h-fit p-2">
          <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">Alert queue · {closedCount}/{ALERTS.length} closed</div>
          <ul className="space-y-1">
            {ALERTS.map((x, i) => {
              const st = cases[x.id];
              return (
                <li key={x.id}>
                  <button type="button" onClick={() => { setCur(i); setQuery(x.pivot); }} className={cn('w-full rounded-lg px-2.5 py-2 text-left', i === cur ? 'bg-accent/12' : 'hover:bg-surface-2')}>
                    <div className="flex items-center gap-1.5">
                      <Badge tone={x.sev === 'Critical' ? 'bad' : x.sev === 'High' ? 'warn' : 'info'}>{x.sev}</Badge>
                      <span className="text-[11px] text-muted">{x.ts}</span>
                      {st?.score !== undefined && <Badge tone={st.score >= 80 ? 'ok' : 'warn'} className="ml-auto">{st.score}</Badge>}
                    </div>
                    <div className="mt-1 text-xs font-semibold leading-snug text-fg">{x.title}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={a.sev === 'Critical' ? 'bad' : a.sev === 'High' ? 'warn' : 'info'}>{a.sev}</Badge>
              <h3 className="font-semibold text-fg">{a.title}</h3>
            </div>
            <p className="mt-1 font-mono text-xs text-muted">Rule {a.rule}</p>
            <p className="mt-2 text-xs text-fg-2">Start by pivoting on <button type="button" className="font-mono font-semibold text-accent underline" onClick={() => setQuery(a.pivot)}>{a.pivot}</button>, then widen the search (clear it to see every event).</p>
          </Card>

          <LogExplorer logs={LOGS} sources={SOURCES} query={query} setQuery={setQuery} />

          <Card className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-fg">Investigation</h3>
            {a.questions.map((q, i) => (
              <Select key={q.q} label={`${i + 1}. ${q.q}`} value={c.answers[i] !== undefined ? String(c.answers[i]) : ''} onChange={(v) => !closed && set({ answers: { ...c.answers, [i]: Number(v) } })}
                options={[{ value: '', label: 'Choose…' }, ...q.options.map((o, k) => ({ value: String(k), label: o }))]} />
            ))}
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-xs font-medium text-muted">Verdict:</span>
              {(['TP', 'FP'] as const).map((v) => (
                <Button key={v} size="sm" variant={c.verdict === v ? 'primary' : 'outline'} onClick={() => !closed && set({ verdict: v })}>{v === 'TP' ? 'True positive' : 'False positive'}</Button>
              ))}
            </div>
            <Select label="Response" value={c.response !== undefined ? String(c.response) : ''} onChange={(v) => !closed && set({ response: Number(v) })}
              options={[{ value: '', label: 'Choose…' }, ...a.responses.map((o, k) => ({ value: String(k), label: o }))]} />
            {!closed ? (
              <Button variant="primary" disabled={!ready} onClick={submit}>Close case</Button>
            ) : (
              <div className="space-y-3">
                <ResultBanner score={c.score!} total={100} message={`Correct verdict: ${a.verdict === 'TP' ? 'true positive' : 'false positive'}`} />
                <ul className="space-y-1 text-sm">
                  {a.questions.map((q, i) => (
                    <li key={q.q} className="flex gap-2">{c.answers[i] === q.answer ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />}<span className="text-fg-2">{q.q} <strong className="text-fg">{q.options[q.answer]}</strong></span></li>
                  ))}
                  <li className="flex gap-2">{c.response === a.response ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />}<span className="text-fg-2">Best response: <strong className="text-fg">{a.responses[a.response]}</strong></span></li>
                </ul>
                <Callout kind="memory" title="Analyst debrief">{a.debrief}</Callout>
                {cur + 1 < ALERTS.length && <Button onClick={() => { setCur(cur + 1); setQuery(ALERTS[cur + 1].pivot); }}>Next alert</Button>}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
