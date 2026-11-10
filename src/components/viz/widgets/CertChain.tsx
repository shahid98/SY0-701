import { useMemo, useState } from 'react';
import { BadgeCheck, CircleCheck, CircleMinus, CircleX, Landmark, Lock, TriangleAlert } from 'lucide-react';
import { StepCaption, StepFrame, StepList, useStepPlayer } from '../StepPlayer';
import { Select } from '@/components/ui/primitives';
import { inline } from '@/components/ui/RichText';
import { cn } from '@/lib/utils';

type Fault = 'none' | 'expired' | 'revoked' | 'hostname' | 'wildcard' | 'missing' | 'untrusted' | 'signature';

const FAULTS: { value: Fault; label: string }[] = [
  { value: 'none', label: 'Everything valid' },
  { value: 'expired', label: 'Leaf certificate expired' },
  { value: 'revoked', label: 'Leaf revoked (private key leaked)' },
  { value: 'hostname', label: 'User visits a name not in the SAN' },
  { value: 'wildcard', label: 'Wildcard used two levels deep' },
  { value: 'missing', label: 'Server omits the intermediate' },
  { value: 'untrusted', label: 'Root not in trust store (self-signed/private CA)' },
  { value: 'signature', label: 'Leaf altered after signing' },
];

interface Check { title: string; ok: boolean; text: string; error?: string }

function checks(f: Fault): Check[] {
  const host = f === 'hostname' ? 'pay.example.test' : f === 'wildcard' ? 'eu.shop.example.test' : 'shop.example.test';
  const san = f === 'wildcard' ? '*.example.test' : 'shop.example.test, www.shop.example.test';
  return [
    { title: 'Server presents its certificate chain', ok: true, text: `During the TLS handshake the server for **${host}** sends its leaf certificate${f === 'missing' ? ' — but forgets the intermediate.' : ' plus the intermediate CA certificate.'} The root is NOT sent: the client must already trust it.` },
    { title: 'Build a path to a trusted root', ok: f !== 'missing' && f !== 'untrusted', text: f === 'missing' ? 'The leaf says “issued by Kestrel Issuing CA 2”, but the client has no copy of that certificate, so it cannot build a path to a root. (Some clients fetch it via the AIA URL; many fail.)' : f === 'untrusted' ? 'The chain ends at a root that is **not in the device’s trust store** — e.g. a self-signed certificate or a private CA that this device was never configured to trust.' : 'Leaf → issued by Intermediate → issued by Root. The root is in the operating system/browser **trust store**, the root of trust.', error: f === 'missing' ? 'Incomplete chain — unable to get local issuer certificate' : 'Untrusted root (NET::ERR_CERT_AUTHORITY_INVALID)' },
    { title: 'Verify every signature', ok: f !== 'signature', text: f === 'signature' ? 'Hashing the leaf’s contents and checking it against the intermediate’s signature **fails** — the certificate was modified after the CA signed it.' : 'The client hashes each certificate and verifies the issuer’s digital signature with the issuer’s **public key**: Root signs Intermediate, Intermediate signs Leaf.', error: 'Invalid signature (certificate tampered)' },
    { title: 'Check the validity period', ok: f !== 'expired', text: f === 'expired' ? 'Today is after the leaf’s **Not After** date. Expired certificates are rejected even if everything else is fine.' : 'Today falls between each certificate’s Not Before and Not After dates.', error: 'Certificate expired (NET::ERR_CERT_DATE_INVALID)' },
    { title: 'Match the hostname to the SAN', ok: f !== 'hostname' && f !== 'wildcard', text: f === 'wildcard' ? `The SAN is **${san}**. A wildcard matches exactly **one** label: it covers shop.example.test but **not** eu.shop.example.test.` : f === 'hostname' ? `The user visited **${host}** but the Subject Alternative Name only lists ${san}.` : `The visited name **${host}** appears in the Subject Alternative Name (${san}).`, error: 'Name mismatch (NET::ERR_CERT_COMMON_NAME_INVALID)' },
    { title: 'Check revocation (OCSP / CRL)', ok: f !== 'revoked', text: f === 'revoked' ? 'The **OCSP** response (often stapled by the server) says **revoked**: the CA cancelled the certificate before expiry, e.g. after a key compromise. A CRL lookup would list its serial number.' : 'The stapled **OCSP** response says “good”. Alternatively the client could download the CA’s **CRL** and confirm the serial number is not listed.', error: 'Certificate revoked (NET::ERR_CERT_REVOKED)' },
  ];
}

export default function CertChain() {
  const [fault, setFault] = useState<Fault>('none');
  const list = useMemo(() => checks(fault), [fault]);
  const firstFail = list.findIndex((c) => !c.ok);
  const steps = [...list, { title: firstFail < 0 ? 'Result: trusted connection' : 'Result: browser warning', ok: firstFail < 0, text: firstFail < 0 ? 'All checks passed — the padlock appears and the session keys negotiated in the handshake are used for encryption.' : `Validation failed at step ${firstFail + 1}: **${list[firstFail].error}**. The browser shows a full-page warning; users should not click through.` }];
  const player = useStepPlayer(steps.length, { interval: 3600 });
  const i = player.index;
  const state = (k: number) => (firstFail >= 0 && k > firstFail ? 'skipped' : steps[k].ok ? 'ok' : 'fail');

  return (
    <StepFrame
      player={player}
      title="Certificate chain validation"
      caption={<StepCaption index={i} title={steps[i].title} text={inline(steps[i].text)} />}
      listView={<StepList steps={steps.map((s) => ({ title: s.title, text: s.text.replace(/\*\*/g, '') }))} />}
      toolbar={<Select label="Scenario" value={fault} onChange={(v) => { setFault(v as Fault); player.restart(); }} options={FAULTS} className="min-w-56" />}
      note="Learning model of browser validation order. Real clients differ in revocation behaviour (soft-fail vs hard-fail) and may fetch missing intermediates."
    >
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div className="flex flex-col items-center gap-1.5">
          {[
            { icon: Landmark, name: 'Kestrel Root CA R1', sub: fault === 'untrusted' ? 'Not in trust store' : 'Self-signed · in trust store', bad: fault === 'untrusted' },
            { icon: BadgeCheck, name: 'Kestrel Issuing CA 2', sub: fault === 'missing' ? 'Not sent by server' : 'Intermediate · signed by root', bad: fault === 'missing' },
            { icon: Lock, name: fault === 'wildcard' ? '*.example.test' : 'shop.example.test', sub: fault === 'expired' ? 'Leaf · EXPIRED' : fault === 'revoked' ? 'Leaf · REVOKED' : fault === 'signature' ? 'Leaf · tampered' : 'Leaf (end-entity)', bad: ['expired', 'revoked', 'signature', 'hostname', 'wildcard'].includes(fault) },
          ].map((c, k) => (
            <div key={c.name} className="flex w-full flex-col items-center">
              {k > 0 && <span className="h-4 w-0.5 bg-line-strong" aria-hidden="true" />}
              <div className={cn('flex w-full items-center gap-2 rounded-xl border-2 bg-surface px-3 py-2', c.bad ? 'border-bad/60' : 'border-line-strong', k === 0 && 'border-dashed')}>
                <c.icon className={cn('h-5 w-5 shrink-0', c.bad ? 'text-bad' : 'text-accent')} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-fg">{c.name}</div>
                  <div className={cn('text-[10.5px]', c.bad ? 'text-bad' : 'text-muted')}>{c.sub}</div>
                </div>
              </div>
            </div>
          ))}
          <p className="mt-1 text-center text-[10.5px] text-muted">Trust flows down from the root; validation walks up from the leaf.</p>
        </div>
        <ol className="space-y-1.5">
          {steps.map((s, k) => {
            const st = state(k);
            return (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => player.goTo(k)}
                  className={cn('flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all', k === i ? 'border-accent bg-accent/10' : 'border-line bg-surface-2/40', k > i && 'opacity-50')}
                >
                  {k > i ? <span className="h-4 w-4 rounded-full border border-line-strong" /> : st === 'ok' ? <CircleCheck className="h-4 w-4 text-ok" /> : st === 'fail' ? <CircleX className="h-4 w-4 text-bad" /> : <CircleMinus className="h-4 w-4 text-muted" />}
                  <span className="flex-1 text-fg">{s.title}</span>
                  {k <= i && st === 'skipped' && <span className="text-[11px] text-muted">not reached</span>}
                </button>
              </li>
            );
          })}
          {i === steps.length - 1 && firstFail >= 0 && (
            <li className="flex items-center gap-2 rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad"><TriangleAlert className="h-4 w-4" /> Your connection is not private</li>
          )}
          {i === steps.length - 1 && firstFail < 0 && (
            <li className="flex items-center gap-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok"><Lock className="h-4 w-4" /> https://shop.example.test — secure</li>
          )}
        </ol>
      </div>
    </StepFrame>
  );
}
