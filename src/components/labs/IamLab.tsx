import { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { Badge, Card, Select, Switch } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, type ClassifyItem } from './kit';
import { cn } from '@/lib/utils';

type Role = 'Nurse' | 'Doctor' | 'Billing clerk';
type Clear = 'Public' | 'Confidential' | 'Secret';
const LEVEL: Record<Clear, number> = { Public: 0, Confidential: 1, Secret: 2 };

interface Subj { role: Role; clearance: Clear; dept: 'Cardiology' | 'Oncology'; hour: number; location: 'Hospital network' | 'Remote VPN' | 'Unknown network'; shared: boolean }

function decide(s: Subj) {
  const rec = { classification: 'Confidential' as Clear, dept: 'Cardiology', owner: 'Dr. Osei' };
  return [
    { model: 'Discretionary (DAC)', ok: s.shared, why: s.shared ? `The owner (${rec.owner}) added Alice to the record’s ACL.` : `Only the owner (${rec.owner}) decides who gets access, and they haven’t shared it with Alice.` },
    { model: 'Mandatory (MAC)', ok: LEVEL[s.clearance] >= LEVEL[rec.classification], why: `Label check set by administrators: clearance ${s.clearance} ${LEVEL[s.clearance] >= LEVEL[rec.classification] ? '≥' : '<'} classification ${rec.classification}. Users cannot change labels.` },
    { model: 'Role-based (RBAC)', ok: s.role !== 'Billing clerk', why: s.role === 'Billing clerk' ? 'The Billing clerk role has permission to invoices, not clinical records.' : `The ${s.role} role includes “read patient records”.` },
    { model: 'Rule-based', ok: s.hour >= 7 && s.hour < 19 && s.location === 'Hospital network', why: 'Global rule for everyone: clinical records only 07:00–19:00 from the hospital network.' },
    {
      model: 'Attribute-based (ABAC)',
      ok: s.role !== 'Billing clerk' && s.dept === rec.dept && s.location !== 'Unknown network' && (s.role === 'Doctor' || (s.hour >= 7 && s.hour < 19)),
      why: `Policy combines attributes: clinical role ✓/✗, department = ${rec.dept} (${s.dept}), known network (${s.location}), and nurses only during their 07–19 shift.`,
    },
  ];
}

const MODEL_QUIZ: ClassifyItem[] = [
  { prompt: 'A file owner right-clicks a folder and grants a colleague “Modify”.', fields: [{ label: 'Model', options: ['DAC', 'MAC', 'RBAC', 'Rule-based', 'ABAC'], answer: 0 }], explain: 'The owner’s discretion → DAC (e.g. NTFS permissions).' },
  { prompt: 'A military system lets a user read a document only if their clearance is at least the document’s label.', fields: [{ label: 'Model', options: ['DAC', 'MAC', 'RBAC', 'Rule-based', 'ABAC'], answer: 1 }], explain: 'Labels and clearances set centrally → MAC (e.g. SELinux, classified systems).' },
  { prompt: 'New hires in Accounts Payable automatically get the permissions of the “AP Clerk” group.', fields: [{ label: 'Model', options: ['DAC', 'MAC', 'RBAC', 'Rule-based', 'ABAC'], answer: 2 }], explain: 'Permissions attached to a job function → RBAC.' },
  { prompt: 'A firewall-style rule blocks all logins between 22:00 and 06:00 for everyone.', fields: [{ label: 'Model', options: ['DAC', 'MAC', 'RBAC', 'Rule-based', 'ABAC'], answer: 3 }], explain: 'A global rule applied to all subjects regardless of identity → rule-based (time-of-day restriction).' },
  { prompt: 'Access is granted if department = Finance AND device is compliant AND country = home country.', fields: [{ label: 'Model', options: ['DAC', 'MAC', 'RBAC', 'Rule-based', 'ABAC'], answer: 4 }], explain: 'Several subject, object and environment attributes evaluated together → ABAC.' },
];

const FACTORS = [
  { id: 'pw', label: 'Password', cat: 'Something you know' },
  { id: 'pin', label: 'PIN', cat: 'Something you know' },
  { id: 'q', label: 'Security question', cat: 'Something you know' },
  { id: 'push', label: 'Authenticator app push', cat: 'Something you have' },
  { id: 'key', label: 'FIDO2 security key', cat: 'Something you have' },
  { id: 'card', label: 'Smart card', cat: 'Something you have' },
  { id: 'fp', label: 'Fingerprint', cat: 'Something you are' },
  { id: 'face', label: 'Face recognition', cat: 'Something you are' },
  { id: 'geo', label: 'GPS / IP geolocation', cat: 'Somewhere you are' },
];

const MFA_QUIZ: ClassifyItem[] = [
  { prompt: 'Password + security question', fields: [{ label: 'Result', options: ['True MFA', 'Single factor (multi-step)'], answer: 1 }], explain: 'Both are “something you know”.' },
  { prompt: 'Smart card + PIN', fields: [{ label: 'Result', options: ['True MFA', 'Single factor (multi-step)'], answer: 0 }], explain: 'Have + know.' },
  { prompt: 'Fingerprint + face scan', fields: [{ label: 'Result', options: ['True MFA', 'Single factor (multi-step)'], answer: 1 }], explain: 'Two biometrics are the same category — “something you are”.' },
  { prompt: 'Password + one-time code from an authenticator app', fields: [{ label: 'Result', options: ['True MFA', 'Single factor (multi-step)'], answer: 0 }], explain: 'Know + have (the phone holding the TOTP seed).' },
  { prompt: 'FIDO2 key unlocked with a fingerprint', fields: [{ label: 'Result', options: ['True MFA', 'Single factor (multi-step)'], answer: 0 }], explain: 'Have (key) + are (biometric) — and phishing-resistant.' },
  { prompt: 'Password + PIN', fields: [{ label: 'Result', options: ['True MFA', 'Single factor (multi-step)'], answer: 1 }], explain: 'Both knowledge factors.' },
];

export default function IamLab({ onComplete }: LabProps) {
  const [s, setS] = useState<Subj>({ role: 'Nurse', clearance: 'Confidential', dept: 'Cardiology', hour: 14, location: 'Hospital network', shared: false });
  const [picked, setPicked] = useState<Set<string>>(new Set(['pw', 'push']));
  const [scores, setScores] = useState<{ a?: [number, number]; b?: [number, number] }>({});
  const res = decide(s);
  const cats = new Set(FACTORS.filter((f) => picked.has(f.id)).map((f) => f.cat));
  const done = (k: 'a' | 'b', v: [number, number]) => {
    const n = { ...scores, [k]: v };
    setScores(n);
    if (n.a && n.b) onComplete(Math.round(((n.a[0] + n.b[0]) / (n.a[1] + n.b[1])) * 100));
  };
  const set = <K extends keyof Subj>(k: K, v: Subj[K]) => setS((x) => ({ ...x, [k]: v }));

  return (
    <div className="space-y-5">
      <LabStep n={1} title="One request, five access control models" sub="Alice requests patient record #4471 (Confidential, Cardiology, owner Dr. Osei). Change her attributes and watch each model decide.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Role" value={s.role} onChange={(v) => set('role', v as Role)} options={['Nurse', 'Doctor', 'Billing clerk'].map((x) => ({ value: x, label: x }))} />
          <Select label="Clearance" value={s.clearance} onChange={(v) => set('clearance', v as Clear)} options={['Public', 'Confidential', 'Secret'].map((x) => ({ value: x, label: x }))} />
          <Select label="Department" value={s.dept} onChange={(v) => set('dept', v as Subj['dept'])} options={['Cardiology', 'Oncology'].map((x) => ({ value: x, label: x }))} />
          <Select label="Network" value={s.location} onChange={(v) => set('location', v as Subj['location'])} options={['Hospital network', 'Remote VPN', 'Unknown network'].map((x) => ({ value: x, label: x }))} />
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">Time: {String(s.hour).padStart(2, '0')}:00
            <input type="range" min={0} max={23} value={s.hour} onChange={(e) => set('hour', Number(e.target.value))} className="accent-[var(--accent)]" aria-label="Hour of day" />
          </label>
          <div className="flex items-end pb-1"><Switch checked={s.shared} onChange={(v) => set('shared', v)} label="Owner shared it with Alice" /></div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-5">
          {res.map((r) => (
            <div key={r.model} className={cn('rounded-xl border p-3', r.ok ? 'border-ok/40 bg-ok/5' : 'border-bad/40 bg-bad/5')}>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-fg">{r.ok ? <CircleCheck className="h-4 w-4 text-ok" /> : <CircleX className="h-4 w-4 text-bad" />}{r.model}</div>
              <div className={cn('mt-0.5 text-xs font-bold', r.ok ? 'text-ok' : 'text-bad')}>{r.ok ? 'ALLOW' : 'DENY'}</div>
              <p className="mt-1 text-[12px] leading-snug text-fg-2">{r.why}</p>
            </div>
          ))}
        </div>
      </LabStep>
      <LabStep n={2} title="Name the model" sub="Which access control model does each description use?" done={!!scores.a}>
        <ClassifyTable items={MODEL_QUIZ} onScored={(c, t) => done('a', [c, t])} />
      </LabStep>
      <LabStep n={3} title="Is it really multifactor?" sub="MFA requires factors from at least two DIFFERENT categories. Build a combination, then classify the challenge list." done={!!scores.b}>
        <div className="mb-4 flex flex-wrap gap-2">
          {FACTORS.map((f) => (
            <button key={f.id} type="button" aria-pressed={picked.has(f.id)} onClick={() => setPicked((p) => { const n = new Set(p); if (n.has(f.id)) n.delete(f.id); else n.add(f.id); return n; })}
              className={cn('rounded-lg border px-2.5 py-1.5 text-left text-sm', picked.has(f.id) ? 'border-accent bg-accent/10' : 'border-line bg-surface-2/40 hover:border-line-strong')}>
              <span className="block font-medium text-fg">{f.label}</span><span className="block text-[11px] text-muted">{f.cat}</span>
            </button>
          ))}
        </div>
        <Card className={cn('mb-4 p-3', cats.size >= 2 ? 'border-ok/40' : 'border-warn/40')}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <strong className="text-fg">{picked.size} factor{picked.size === 1 ? '' : 's'}, {cats.size} categor{cats.size === 1 ? 'y' : 'ies'}:</strong>
            {[...cats].map((c) => <Badge key={c} tone="accent">{c}</Badge>)}
            <span className={cn('font-semibold', cats.size >= 2 ? 'text-ok' : 'text-warn')}>{picked.size === 0 ? '' : cats.size >= 2 ? '→ True multifactor authentication' : '→ Single factor, even if it takes several steps'}</span>
          </div>
        </Card>
        <ClassifyTable items={MFA_QUIZ} onScored={(c, t) => done('b', [c, t])} />
      </LabStep>
    </div>
  );
}
