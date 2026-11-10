import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import type { SequenceVisual } from '@/types/content';
import { SequenceDiagram } from '@/components/viz/SequenceDiagram';
import { Badge, Button, Select } from '@/components/ui/primitives';
import { LabStep, ResultBanner } from './kit';
import { cn } from '@/lib/utils';

type Decision = 'ALLOW' | 'STEP-UP' | 'DENY';

interface Req {
  role: 'finance' | 'contractor' | 'admin';
  auth: 'password' | 'mfa' | 'fido2';
  device: 'compliant' | 'unpatched' | 'unmanaged';
  location: 'office' | 'home' | 'foreign';
  time: 'business' | 'night';
  resource: 'wiki' | 'finance' | 'dbadmin';
}

const LABELS = {
  role: { finance: 'Employee (Finance)', contractor: 'Contractor', admin: 'IT administrator' },
  auth: { password: 'Password only', mfa: 'Password + push MFA', fido2: 'Phishing-resistant MFA (FIDO2 key)' },
  device: { compliant: 'Corporate, compliant', unpatched: 'Corporate, missing patches', unmanaged: 'Personal, unmanaged' },
  location: { office: 'Office network', home: 'Home broadband', foreign: 'Unfamiliar country (impossible travel)' },
  time: { business: 'Business hours', night: '02:00 local time' },
  resource: { wiki: 'Company wiki (low)', finance: 'Finance reports (high)', dbadmin: 'Production DB admin (critical)' },
} as const;

const THRESHOLD = { wiki: 60, finance: 30, dbadmin: 15 };

export function evaluate(r: Req): { decision: Decision; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const add = (n: number, why: string) => { if (n) { score += n; reasons.push(`+${n} risk: ${why}`); } };
  add(r.auth === 'password' ? 30 : r.auth === 'mfa' ? 5 : 0, LABELS.auth[r.auth]);
  add(r.device === 'unmanaged' ? 40 : r.device === 'unpatched' ? 25 : 0, LABELS.device[r.device]);
  add(r.location === 'foreign' ? 45 : r.location === 'home' ? 5 : 0, LABELS.location[r.location]);
  add(r.time === 'night' ? 15 : 0, 'unusual time of day');

  // Policy-driven access control: hard rules first (least privilege), then adaptive risk.
  if (r.resource === 'dbadmin' && r.role !== 'admin') return { decision: 'DENY', score, reasons: [...reasons, 'Policy: only IT administrators may reach the production DB admin console.'] };
  if (r.resource === 'finance' && r.role !== 'finance') return { decision: 'DENY', score, reasons: [...reasons, 'Policy: finance reports are limited to the Finance role (least privilege — admins do not get data access by default).'] };
  if (r.device === 'unmanaged' && r.resource !== 'wiki') return { decision: 'DENY', score, reasons: [...reasons, 'Policy: unmanaged devices may only reach low-sensitivity resources.'] };
  if (r.resource === 'dbadmin' && r.auth !== 'fido2') {
    return { decision: 'STEP-UP', score, reasons: [...reasons, 'Policy: privileged access requires phishing-resistant MFA — step-up challenge issued.'] };
  }
  const t = THRESHOLD[r.resource];
  reasons.push(`Resource threshold for ${LABELS.resource[r.resource]}: risk ≤ ${t}`);
  if (score <= t) return { decision: 'ALLOW', score, reasons };
  if (score <= t + 25 && r.auth !== 'fido2') return { decision: 'STEP-UP', score, reasons: [...reasons, 'Risk slightly above threshold — adaptive identity asks for stronger authentication.'] };
  return { decision: 'DENY', score, reasons: [...reasons, 'Risk far above the threshold for this resource.'] };
}

function buildFlow(r: Req, d: Decision): SequenceVisual {
  const outcome =
    d === 'ALLOW'
      ? { title: 'PEP opens a per-session connection', from: 'pep', to: 'res', msg: 'Session granted (this resource only)', tone: 'ok' as const, text: 'The PEP admits **only this session to this resource**. Every new request is evaluated again — trust is never implicit or permanent.' }
      : d === 'STEP-UP'
        ? { title: 'PEP challenges the subject', from: 'pep', to: 'user', msg: 'Step-up MFA required', tone: 'warn' as const, text: 'Adaptive identity: rather than a flat deny, the PEP demands stronger authentication. If the subject passes, the request is re-evaluated.' }
        : { title: 'PEP blocks the request', from: 'pep', to: 'user', msg: 'Access denied', tone: 'bad' as const, text: 'The PEP never connects the subject to the resource. Threat scope is reduced: even a valid password cannot reach what policy forbids.' };
  return {
    kind: 'sequence',
    title: 'Zero Trust decision flow',
    nodes: [
      { id: 'user', label: 'Subject', sub: `${LABELS.role[r.role]} · ${LABELS.device[r.device]}`, icon: 'user', x: 12, y: 70 },
      { id: 'pep', label: 'Policy Enforcement Point', sub: 'Data plane gateway', icon: 'firewall', x: 42, y: 70 },
      { id: 'res', label: 'Resource', sub: LABELS.resource[r.resource], icon: 'database', x: 85, y: 70 },
      { id: 'pa', label: 'Policy Administrator', sub: 'Control plane', icon: 'settings', x: 42, y: 20 },
      { id: 'pe', label: 'Policy Engine', sub: 'Control plane', icon: 'brain', x: 72, y: 20 },
      { id: 'sig', label: 'Signals', sub: 'IdP · MDM · threat intel', icon: 'radar', x: 88, y: 45 },
    ],
    links: [['user', 'pep'], ['pep', 'res'], ['pep', 'pa'], ['pa', 'pe'], ['sig', 'pe']],
    steps: [
      { title: 'Subject requests access', from: 'user', to: 'pep', msg: 'GET resource', text: 'The request lands on the **Policy Enforcement Point** first. Being “inside the network” grants nothing — there is no implicit trust zone around the resource.' },
      { title: 'PEP asks the control plane', from: 'pep', to: 'pa', msg: 'Session request + context', text: 'The PEP forwards the request and its context to the **Policy Administrator** on the control plane.' },
      { title: 'Administrator asks the engine to decide', from: 'pa', to: 'pe', msg: 'Evaluate', text: 'The **Policy Engine** is the brain: it decides. The administrator acts on the decision.' },
      { title: 'Engine gathers signals', from: 'sig', to: 'pe', msg: 'Identity · posture · location · threat', text: `Signals feed the decision: authentication (${LABELS.auth[r.auth]}), device posture (${LABELS.device[r.device]}), location (${LABELS.location[r.location]}) and time (${LABELS.time[r.time]}).` },
      { title: `Decision: ${d}`, text: 'Policy-driven access control combines fixed rules (who may ever access this resource) with adaptive, risk-based evaluation.', active: ['pe'], status: { pe: [d, d === 'ALLOW' ? 'ok' : d === 'STEP-UP' ? 'warn' : 'bad'] } },
      { title: 'Administrator instructs the PEP', from: 'pa', to: 'pep', msg: d === 'ALLOW' ? 'Establish session' : d === 'STEP-UP' ? 'Challenge subject' : 'Reject', tone: d === 'ALLOW' ? 'ok' : d === 'STEP-UP' ? 'warn' : 'bad', text: 'The Policy Administrator configures the enforcement point — generating session tokens/credentials when access is allowed.', status: { pep: [d === 'ALLOW' ? 'Path open' : 'Path closed', d === 'ALLOW' ? 'ok' : 'bad'] } },
      outcome,
    ],
    note: 'Learning model of the NIST SP 800-207 roles. Real products merge or split these components differently.',
  };
}

const CHALLENGES: Req[] = [
  { role: 'finance', auth: 'mfa', device: 'compliant', location: 'office', time: 'business', resource: 'finance' },
  { role: 'contractor', auth: 'fido2', device: 'compliant', location: 'office', time: 'business', resource: 'finance' },
  { role: 'finance', auth: 'password', device: 'compliant', location: 'home', time: 'business', resource: 'finance' },
  { role: 'admin', auth: 'mfa', device: 'compliant', location: 'office', time: 'business', resource: 'dbadmin' },
  { role: 'finance', auth: 'mfa', device: 'unmanaged', location: 'home', time: 'business', resource: 'wiki' },
  { role: 'finance', auth: 'fido2', device: 'compliant', location: 'foreign', time: 'night', resource: 'finance' },
];

export default function ZeroTrustLab({ onComplete }: LabProps) {
  const [req, setReq] = useState<Req>(CHALLENGES[0]);
  const [ci, setCi] = useState(0);
  const [guess, setGuess] = useState<Decision | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const res = useMemo(() => evaluate(req), [req]);
  const flow = useMemo(() => buildFlow(req, res.decision), [req, res.decision]);
  const inChallenge = ci < CHALLENGES.length;

  const predict = (d: Decision) => {
    setGuess(d);
    const next = [...results, d === res.decision];
    setResults(next);
    if (next.length === CHALLENGES.length) onComplete(Math.round((next.filter(Boolean).length / next.length) * 100));
  };

  const set = <K extends keyof Req>(k: K, v: Req[K]) => setReq((r) => ({ ...r, [k]: v }));
  const DIcon = res.decision === 'ALLOW' ? ShieldCheck : res.decision === 'STEP-UP' ? ShieldAlert : ShieldX;

  return (
    <div className="space-y-5">
      <LabStep
        n={1}
        title={inChallenge ? `Challenge ${ci + 1} of ${CHALLENGES.length}: predict the decision` : 'Free play: build any access request'}
        sub={inChallenge ? 'Read the request, predict what the policy engine will decide, then watch the flow.' : 'All challenges done — change any signal and watch the decision update.'}
        done={!inChallenge}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(LABELS) as (keyof Req)[]).map((k) => (
            <Select
              key={k}
              label={k === 'role' ? 'Subject role' : k === 'auth' ? 'Authentication' : k === 'device' ? 'Device posture' : k === 'location' ? 'Location' : k === 'time' ? 'Time' : 'Resource requested'}
              value={req[k]}
              onChange={(v) => !inChallenge && set(k, v as never)}
              options={Object.entries(LABELS[k]).map(([value, label]) => ({ value, label }))}
            />
          ))}
        </div>
        {inChallenge && (
          <div className="mt-4">
            {guess === null ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-fg">Your prediction:</span>
                {(['ALLOW', 'STEP-UP', 'DENY'] as Decision[]).map((d) => (
                  <Button key={d} variant="outline" onClick={() => predict(d)}>{d}</Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn('flex items-center gap-1.5 text-sm font-semibold', guess === res.decision ? 'text-ok' : 'text-bad')}>
                  {guess === res.decision ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
                  You predicted {guess}; the engine decided {res.decision}.
                </span>
                <Button variant="primary" size="sm" onClick={() => { const n = ci + 1; setCi(n); setGuess(null); if (n < CHALLENGES.length) setReq(CHALLENGES[n]); }}>
                  {ci + 1 < CHALLENGES.length ? 'Next challenge' : 'Finish & free play'}
                </Button>
              </div>
            )}
          </div>
        )}
        {!inChallenge && <ResultBanner score={results.filter(Boolean).length} total={CHALLENGES.length} message="predictions correct" />}
      </LabStep>

      {(guess !== null || !inChallenge) && (
        <>
          <div className={cn('flex flex-wrap items-start gap-3 rounded-2xl border p-4', res.decision === 'ALLOW' ? 'border-ok/40 bg-ok/5' : res.decision === 'STEP-UP' ? 'border-warn/40 bg-warn/5' : 'border-bad/40 bg-bad/5')}>
            <DIcon className={cn('h-8 w-8', res.decision === 'ALLOW' ? 'text-ok' : res.decision === 'STEP-UP' ? 'text-warn' : 'text-bad')} />
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="text-lg font-bold text-fg">{res.decision}</span><Badge>risk score {res.score}</Badge></div>
              <ul className="mt-1 space-y-0.5 text-sm text-fg-2">{res.reasons.map((x) => <li key={x}>• {x}</li>)}</ul>
            </div>
          </div>
          <SequenceDiagram key={JSON.stringify(req)} v={flow} />
        </>
      )}
    </div>
  );
}
