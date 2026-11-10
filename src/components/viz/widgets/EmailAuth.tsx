import { useState } from 'react';
import { CircleCheck, CircleMinus, CircleX } from 'lucide-react';
import { Segmented, Select } from '@/components/ui/primitives';
import { WidgetFrame, monoBox } from './WidgetFrame';
import { cn } from '@/lib/utils';

type R = 'pass' | 'fail' | 'none';
const SCENARIOS: { id: string; label: string; from: string; ip: string; spf: R; spfDomain: string; dkim: R; dkimDomain: string; explain: string }[] = [
  { id: 'legit', label: 'Legitimate mail from example.com', from: 'billing@example.com', ip: '203.0.113.25 (authorized mail server)', spf: 'pass', spfDomain: 'example.com', dkim: 'pass', dkimDomain: 'example.com', explain: 'The sending IP is listed in example.com’s SPF record and the message carries a valid DKIM signature for example.com — both align with the From domain.' },
  { id: 'spoof', label: 'Attacker spoofs From: example.com', from: 'ceo@example.com', ip: '198.51.100.66 (attacker server)', spf: 'fail', spfDomain: 'example.com', dkim: 'none', dkimDomain: '—', explain: 'The attacker’s IP isn’t authorized by SPF and they can’t produce a DKIM signature without example.com’s private key. DMARC fails, and the domain owner’s policy decides the fate of the message.' },
  { id: 'forward', label: 'Forwarded through a mailing list', from: 'news@example.com', ip: '192.0.2.40 (list server)', spf: 'fail', spfDomain: 'example.com', dkim: 'pass', dkimDomain: 'example.com', explain: 'Forwarding breaks SPF (the list server’s IP isn’t authorized), but the DKIM signature survives unchanged. DMARC passes because DKIM is aligned — this is why DKIM matters.' },
  { id: 'lookalike', label: 'Lookalike domain exampIe.com (capital i)', from: 'billing@exampIe.com', ip: '198.51.100.77 (attacker server)', spf: 'pass', spfDomain: 'exampIe.com', dkim: 'pass', dkimDomain: 'exampIe.com', explain: 'The attacker owns exampIe.com and set up valid SPF, DKIM and DMARC for it, so everything passes. Email authentication protects your exact domain — not lookalikes. Users, filters and typosquat monitoring must catch this one.' },
];

const Mark = ({ r }: { r: R }) => (r === 'pass' ? <CircleCheck className="h-4 w-4 text-ok" /> : r === 'fail' ? <CircleX className="h-4 w-4 text-bad" /> : <CircleMinus className="h-4 w-4 text-muted" />);

/** SPF / DKIM / DMARC evaluation simulator. */
export default function EmailAuth() {
  const [id, setId] = useState('spoof');
  const [policy, setPolicy] = useState<'none' | 'quarantine' | 'reject'>('reject');
  const s = SCENARIOS.find((x) => x.id === id)!;
  const fromDomain = s.from.split('@')[1];
  const spfAligned = s.spf === 'pass' && s.spfDomain === fromDomain;
  const dkimAligned = s.dkim === 'pass' && s.dkimDomain === fromDomain;
  const dmarc: R = spfAligned || dkimAligned ? 'pass' : 'fail';
  const outcome = dmarc === 'pass' ? 'Delivered to inbox' : policy === 'reject' ? 'Rejected by the receiving server' : policy === 'quarantine' ? 'Delivered to spam/quarantine' : 'Delivered (p=none: monitor only) — but reported to the domain owner';
  return (
    <WidgetFrame title="Email authentication: SPF, DKIM and DMARC" badge="Simulation" note="Simplified: real DMARC alignment can be strict or relaxed, and receivers also apply their own reputation and content filtering.">
      <div className="flex flex-wrap items-end gap-3">
        <Select label="Incoming message" value={id} onChange={setId} options={SCENARIOS.map((x) => ({ value: x.id, label: x.label }))} className="min-w-64" />
        <div>
          <div className="mb-1 text-xs font-medium text-muted">example.com DMARC policy</div>
          <Segmented label="DMARC policy" size="sm" value={policy} onChange={setPolicy} options={[{ value: 'none', label: 'p=none' }, { value: 'quarantine', label: 'p=quarantine' }, { value: 'reject', label: 'p=reject' }]} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <div className={monoBox}><div className="mb-0.5 font-sans text-[10px] font-semibold uppercase text-muted">SPF (TXT example.com)</div>v=spf1 ip4:203.0.113.0/24 -all</div>
        <div className={monoBox}><div className="mb-0.5 font-sans text-[10px] font-semibold uppercase text-muted">DKIM (TXT s1._domainkey)</div>v=DKIM1; k=rsa; p=MIIBIj…</div>
        <div className={monoBox}><div className="mb-0.5 font-sans text-[10px] font-semibold uppercase text-muted">DMARC (TXT _dmarc)</div>v=DMARC1; p={policy}; rua=mailto:dmarc@example.com</div>
      </div>
      <div className="mt-4 rounded-xl border border-line p-3 text-sm">
        <div className="mb-2 text-fg-2"><span className="font-semibold text-fg">From:</span> {s.from} · <span className="font-semibold text-fg">Sent by:</span> {s.ip}</div>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2"><Mark r={s.spf} /> <strong>SPF {s.spf}</strong> <span className="text-muted">— is the sending IP authorized for {s.spfDomain}?{s.spf === 'pass' && !spfAligned ? ' (not aligned with From)' : ''}</span></li>
          <li className="flex items-center gap-2"><Mark r={s.dkim} /> <strong>DKIM {s.dkim}</strong> <span className="text-muted">— valid signature from {s.dkimDomain}’s private key? (proves integrity and domain)</span></li>
          <li className="flex items-center gap-2"><Mark r={dmarc} /> <strong>DMARC {dmarc}</strong> <span className="text-muted">— does SPF or DKIM pass AND align with the visible From domain?</span></li>
        </ul>
        <p className={cn('mt-3 rounded-lg px-3 py-2 font-semibold', dmarc === 'pass' ? (id === 'lookalike' ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok') : policy === 'none' ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok')}>Result: {outcome}</p>
        <p className="mt-2 text-fg-2">{s.explain}</p>
      </div>
    </WidgetFrame>
  );
}
