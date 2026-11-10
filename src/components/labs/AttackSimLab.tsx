import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Eye, ShieldCheck, ShieldHalf, Skull, Undo2 } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import type { SequenceVisual, SeqStep, Tone } from '@/types/content';
import { SequenceDiagram } from '@/components/viz/SequenceDiagram';
import { Badge, Button, Card, Segmented } from '@/components/ui/primitives';
import { LabStep } from './kit';
import { cn } from '@/lib/utils';

type Profile = 'commodity' | 'sophisticated';
type Effect = 'prevent' | 'detect' | 'contain' | 'recover';

const STAGES = [
  { name: 'Delivery', from: 'attacker', to: 'mail', msg: 'Phishing email', text: { commodity: 'A phishing email with a macro-laden invoice arrives.', sophisticated: 'A tailored spear-phishing email links to an ISO file hosted on a fresh domain.' } },
  { name: 'User execution', from: 'mail', to: 'ws', msg: 'User opens file', text: { commodity: 'The user opens the attachment and enables macros.', sophisticated: 'The user mounts the ISO and double-clicks a shortcut that looks like a PDF.' } },
  { name: 'Foothold & C2', from: 'ws', to: 'attacker', msg: 'Beacon to C2', text: { commodity: 'Commodity malware runs and beacons to a known-bad command-and-control domain.', sophisticated: 'A fileless PowerShell implant (“living off the land”) beacons to a never-seen domain.' } },
  { name: 'Privilege escalation', from: 'ws', to: 'ws', msg: 'Exploit', text: { commodity: 'The malware exploits a months-old, unpatched local vulnerability to gain admin rights.', sophisticated: 'The attacker uses a zero-day exploit — no patch exists yet.' } },
  { name: 'Lateral movement', from: 'ws', to: 'srv', msg: 'Stolen credentials', text: { commodity: 'Harvested credentials are reused to log in to the file server and domain controller.', sophisticated: 'Dumped admin credentials are replayed to reach the file server and domain controller.' } },
  { name: 'Exfiltration', from: 'srv', to: 'cloud', msg: 'Upload 40 GB', text: { commodity: 'Finance data is compressed and uploaded to an external cloud storage account.', sophisticated: 'Data is staged, encrypted and trickled out to attacker cloud storage.' } },
  { name: 'Impact: ransomware', from: 'attacker', to: 'srv', msg: 'Encrypt servers', text: { commodity: 'Ransomware encrypts servers and deletes local shadow copies.', sophisticated: 'Ransomware detonates across servers and targets online backups.' } },
];

interface Control { id: string; name: string; cost: number; type: string; desc: string; fx: Record<Profile, Partial<Record<number, Effect[]>>> }

const CONTROLS: Control[] = [
  { id: 'gateway', name: 'Email security gateway + sandbox', cost: 3, type: 'Preventive', desc: 'Scans and detonates attachments before delivery.', fx: { commodity: { 0: ['prevent'] }, sophisticated: {} } },
  { id: 'training', name: 'Security awareness training', cost: 2, type: 'Preventive / detective', desc: 'Users spot and report phishing.', fx: { commodity: { 1: ['prevent'] }, sophisticated: { 1: ['detect'] } } },
  { id: 'macros', name: 'Block Office macros (Group Policy)', cost: 1, type: 'Preventive', desc: 'Macros from the Internet cannot run.', fx: { commodity: { 1: ['prevent'] }, sophisticated: {} } },
  { id: 'allow', name: 'Application allow list', cost: 3, type: 'Preventive', desc: 'Only approved executables may run.', fx: { commodity: { 2: ['prevent'] }, sophisticated: {} } },
  { id: 'dns', name: 'DNS filtering', cost: 1, type: 'Preventive', desc: 'Blocks lookups of known-malicious domains.', fx: { commodity: { 2: ['prevent'] }, sophisticated: {} } },
  { id: 'edr', name: 'EDR with auto-isolation', cost: 3, type: 'Detective / containment', desc: 'Behavioural detection on endpoints; isolates compromised hosts.', fx: { commodity: { 2: ['detect', 'contain'] }, sophisticated: { 3: ['detect', 'contain'] } } },
  { id: 'patch', name: 'Patch management', cost: 2, type: 'Preventive', desc: 'Known vulnerabilities are fixed quickly.', fx: { commodity: { 3: ['prevent'] }, sophisticated: {} } },
  { id: 'mfa', name: 'MFA + privileged access management', cost: 3, type: 'Preventive', desc: 'Stolen passwords alone cannot open admin sessions.', fx: { commodity: { 4: ['prevent'] }, sophisticated: { 4: ['prevent'] } } },
  { id: 'seg', name: 'Network segmentation', cost: 2, type: 'Containment', desc: 'Workstation VLANs cannot reach server admin ports.', fx: { commodity: { 4: ['contain'] }, sophisticated: { 4: ['contain'] } } },
  { id: 'siem', name: 'SIEM correlation + SOC response', cost: 3, type: 'Detective', desc: 'Correlates logs; SOC acts on high-fidelity alerts.', fx: { commodity: { 4: ['detect'], 5: ['detect', 'contain'] }, sophisticated: { 4: ['detect'], 5: ['detect', 'contain'] } } },
  { id: 'dlp', name: 'DLP + egress filtering', cost: 2, type: 'Preventive', desc: 'Blocks large uploads of sensitive data to unapproved destinations.', fx: { commodity: { 5: ['prevent'] }, sophisticated: { 5: ['prevent'] } } },
  { id: 'backup', name: 'Offline / immutable backups', cost: 2, type: 'Corrective', desc: 'Clean restore points the attacker cannot encrypt.', fx: { commodity: { 6: ['recover'] }, sophisticated: { 6: ['recover'] } } },
];

const BUDGET = 12;

type Outcome = 'succeeded' | 'prevented' | 'detected' | 'contained' | 'recovered' | 'not reached';

export function simulate(profile: Profile, enabled: Set<string>) {
  const rows: { outcome: Outcome; by: string[] }[] = [];
  let stopped: number | null = null;
  let detectedAt: number | null = null;
  STAGES.forEach((_, s) => {
    if (stopped !== null) { rows.push({ outcome: 'not reached', by: [] }); return; }
    const acting = CONTROLS.filter((c) => enabled.has(c.id) && c.fx[profile][s]);
    const has = (e: Effect) => acting.filter((c) => c.fx[profile][s]!.includes(e)).map((c) => c.name);
    const prevent = has('prevent');
    const contain = has('contain');
    const detect = has('detect');
    const recover = has('recover');
    if (detect.length && detectedAt === null) detectedAt = s;
    if (prevent.length) { rows.push({ outcome: 'prevented', by: prevent }); stopped = s; }
    else if (contain.length) { rows.push({ outcome: 'contained', by: [...new Set([...detect, ...contain])] }); stopped = s; }
    else if (detect.length) rows.push({ outcome: 'detected', by: detect });
    else if (recover.length) rows.push({ outcome: 'recovered', by: recover });
    else rows.push({ outcome: 'succeeded', by: [] });
  });
  const reached = (s: number) => rows[s].outcome === 'succeeded' || rows[s].outcome === 'detected' || rows[s].outcome === 'recovered';
  return { rows, stopped, detectedAt, dataLost: reached(5), encrypted: reached(6), recovered: rows[6].outcome === 'recovered' };
}

const OUT_META: Record<Outcome, { label: string; tone: Tone; icon: typeof ShieldCheck }> = {
  prevented: { label: 'Prevented', tone: 'ok', icon: ShieldCheck },
  contained: { label: 'Contained', tone: 'ok', icon: ShieldHalf },
  detected: { label: 'Detected — attack continues', tone: 'warn', icon: Eye },
  recovered: { label: 'Impact, but recovered', tone: 'info', icon: Undo2 },
  succeeded: { label: 'Succeeded', tone: 'bad', icon: Skull },
  'not reached': { label: 'Not reached', tone: 'neutral', icon: CircleCheck },
};

const CHALLENGES: { title: string; profile: Profile; maxCost: number; check: (r: ReturnType<typeof simulate>) => boolean; hint: string }[] = [
  { title: 'Stop a commodity attack before any malware runs', profile: 'commodity', maxCost: BUDGET, check: (r) => r.stopped !== null && r.stopped <= 1, hint: 'Prevent it at delivery or user execution.' },
  { title: 'Stop a sophisticated attacker before data leaves (stage 6)', profile: 'sophisticated', maxCost: BUDGET, check: (r) => r.stopped !== null && r.stopped <= 4, hint: 'Their email lure, payload and exploit bypass the early controls — what still works after a compromise?' },
  { title: 'Defense in depth on 6 points: sophisticated attacker must be detected early AND stopped', profile: 'sophisticated', maxCost: 6, check: (r) => r.detectedAt !== null && r.detectedAt <= 1 && r.stopped !== null && r.stopped <= 4, hint: 'Combine a detective control at user execution with a later containment control.' },
];

export default function AttackSimLab({ onComplete }: LabProps) {
  const [profile, setProfile] = useState<Profile>('commodity');
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [passed, setPassed] = useState<boolean[]>(CHALLENGES.map(() => false));
  const [ci, setCi] = useState(0);
  const cost = CONTROLS.filter((c) => enabled.has(c.id)).reduce((s, c) => s + c.cost, 0);
  const res = useMemo(() => simulate(profile, enabled), [profile, enabled]);

  const toggle = (id: string) => setEnabled((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  const flow: SequenceVisual = useMemo(() => {
    const steps: SeqStep[] = [];
    STAGES.forEach((st, i) => {
      const row = res.rows[i];
      if (row.outcome === 'not reached') return;
      const m = OUT_META[row.outcome];
      steps.push({
        title: `Stage ${i + 1}: ${st.name} — ${m.label}`,
        text: `${st.text[profile]} ${row.by.length ? `**${row.by.join(' + ')}** → ${m.label.toLowerCase()}.` : 'No enabled control acts at this stage.'}`,
        from: st.from, to: st.to, msg: st.msg,
        tone: row.outcome === 'succeeded' ? 'bad' : row.outcome === 'detected' ? 'warn' : row.outcome === 'recovered' ? 'info' : 'ok',
        status: i === 6 ? { srv: [row.outcome === 'recovered' ? 'Restored from backup' : 'Encrypted', row.outcome === 'recovered' ? 'info' : 'bad'] } : i === 5 && row.outcome !== 'prevented' && row.outcome !== 'contained' ? { cloud: ['Data stolen', 'bad'] } : row.outcome === 'prevented' || row.outcome === 'contained' ? { [st.to]: [m.label, 'ok'] } : undefined,
      });
    });
    return {
      kind: 'sequence',
      title: profile === 'commodity' ? 'Commodity attack run' : 'Sophisticated attack run',
      nodes: [
        { id: 'attacker', label: 'Attacker', icon: 'attacker', x: 10, y: 20, tone: 'bad' },
        { id: 'mail', label: 'Mail system', icon: 'mail', x: 36, y: 20 },
        { id: 'ws', label: 'Workstation', icon: 'laptop', x: 36, y: 72 },
        { id: 'srv', label: 'File server / DC', icon: 'server', x: 66, y: 72 },
        { id: 'cloud', label: 'Attacker cloud', icon: 'cloud', x: 88, y: 30, tone: 'bad' },
      ],
      links: [['attacker', 'mail'], ['mail', 'ws'], ['ws', 'attacker'], ['ws', 'srv'], ['srv', 'cloud'], ['attacker', 'srv']],
      steps,
      note: 'Deterministic learning model: each enabled control reliably performs its listed effect. Real controls are probabilistic and can be bypassed.',
    };
  }, [res, profile]);

  const ch = CHALLENGES[ci];
  const tryChallenge = () => {
    const r = simulate(ch.profile, enabled);
    const ok = cost <= ch.maxCost && ch.check(r);
    const next = passed.map((p, i) => (i === ci ? p || ok : p));
    setPassed(next);
    if (ok && next.every(Boolean)) onComplete(100);
    return ok;
  };
  const [lastTry, setLastTry] = useState<boolean | null>(null);

  return (
    <div className="space-y-5">
      <LabStep n={1} title="Choose the attacker and your controls" sub={`Budget: ${BUDGET} points. Spend them on the layers you think matter most.`}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Segmented label="Attacker profile" value={profile} onChange={(v) => { setProfile(v); setLastTry(null); }} options={[{ value: 'commodity', label: 'Commodity malware' }, { value: 'sophisticated', label: 'Sophisticated (APT-style)' }]} />
          <Badge tone={cost > BUDGET ? 'bad' : 'accent'}>{cost}/{BUDGET} points used</Badge>
          <Button size="sm" variant="ghost" onClick={() => setEnabled(new Set())}>Clear all</Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CONTROLS.map((c) => {
            const on = enabled.has(c.id);
            const affordable = on || cost + c.cost <= BUDGET;
            return (
              <button key={c.id} type="button" onClick={() => affordable && toggle(c.id)} aria-pressed={on} disabled={!affordable}
                className={cn('rounded-xl border p-3 text-left transition-all disabled:opacity-40', on ? 'border-accent bg-accent/10 ring-1 ring-accent/30' : 'border-line bg-surface-2/40 hover:border-line-strong')}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-fg">{c.name}</span>
                  <span className="shrink-0 rounded-md bg-surface-3 px-1.5 text-xs font-bold text-fg-2">{c.cost}</span>
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-accent">{c.type}</div>
                <div className="mt-1 text-xs text-muted">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </LabStep>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <SequenceDiagram key={`${profile}-${[...enabled].sort().join(',')}`} v={flow} />
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-fg">Kill chain outcome</h3>
          <ol className="space-y-1.5">
            {STAGES.map((s, i) => {
              const r = res.rows[i];
              const m = OUT_META[r.outcome];
              return (
                <li key={s.name} className={cn('flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm', r.outcome === 'not reached' && 'opacity-45')}>
                  <m.icon className={cn('mt-0.5 h-4 w-4 shrink-0', { ok: 'text-ok', bad: 'text-bad', warn: 'text-warn', info: 'text-info', neutral: 'text-muted', accent: 'text-accent' }[m.tone])} />
                  <span className="flex-1"><span className="font-medium text-fg">{i + 1}. {s.name}</span><span className="block text-xs text-muted">{m.label}</span></span>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
            <div className={res.dataLost ? 'text-bad' : 'text-ok'}>{res.dataLost ? '✗ Data exfiltrated' : '✓ No data loss'}</div>
            <div className={res.encrypted && !res.recovered ? 'text-bad' : 'text-ok'}>{res.encrypted ? (res.recovered ? '✓ Encrypted, but restored from offline backups' : '✗ Servers encrypted, no clean backups') : '✓ No ransomware impact'}</div>
            <div className={res.detectedAt === null ? 'text-warn' : 'text-ok'}>{res.detectedAt === null ? '! Never detected by a detective control' : `✓ First detected at stage ${res.detectedAt + 1}`}</div>
          </div>
        </Card>
      </div>

      <LabStep n={2} title={`Challenge ${ci + 1}/${CHALLENGES.length}: ${ch.title}`} sub={<>Attacker: <strong>{ch.profile}</strong> · max {ch.maxCost} points. Hint: {ch.hint}</>} done={passed.every(Boolean)}>
        <div className="flex flex-wrap items-center gap-2">
          {CHALLENGES.map((c, i) => (
            <Button key={c.title} size="sm" variant={i === ci ? 'primary' : 'secondary'} onClick={() => { setCi(i); setProfile(c.profile); setLastTry(null); }}>
              {passed[i] ? <CircleCheck className="h-4 w-4" /> : null} Challenge {i + 1}
            </Button>
          ))}
          <Button variant="outline" onClick={() => { setProfile(ch.profile); setLastTry(tryChallenge()); }}>Run challenge check</Button>
          {lastTry !== null && (
            <span className={cn('flex items-center gap-1 text-sm font-semibold', lastTry ? 'text-ok' : 'text-bad')}>
              {lastTry ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
              {lastTry ? 'Passed!' : cost > ch.maxCost ? `Over budget (${cost} > ${ch.maxCost})` : 'Not yet — adjust your controls.'}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">Lesson: no single control stops everything. Preventive controls fail against novel techniques, so you also need detective, containment and corrective layers.</p>
      </LabStep>
    </div>
  );
}
