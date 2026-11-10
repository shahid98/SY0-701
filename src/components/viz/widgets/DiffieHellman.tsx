import { useState } from 'react';
import { StepCaption, StepFrame, StepList, useStepPlayer } from '../StepPlayer';
import { cn } from '@/lib/utils';

const P = 23;
const G = 5;
const mp = (b: number, e: number, m: number) => { let r = 1; for (let i = 0; i < e; i++) r = (r * b) % m; return r; };

function Swatch({ color, label, sub, dim }: { color: string; label: string; sub?: string; dim?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center text-center transition-opacity', dim && 'opacity-25')}>
      <span className="h-10 w-10 rounded-full border-2 border-surface shadow-md ring-1 ring-line" style={{ background: color }} />
      <span className="mt-1 text-[11px] font-semibold text-fg">{label}</span>
      {sub && <span className="font-mono text-[10px] text-muted">{sub}</span>}
    </div>
  );
}

/** Diffie-Hellman key exchange: paint-mixing analogy plus the real (tiny) modular arithmetic. */
export default function DiffieHellman() {
  const [a, setA] = useState(6);
  const [b, setB] = useState(15);
  const A = mp(G, a, P);
  const B = mp(G, b, P);
  const sA = mp(B, a, P);
  const sB = mp(A, b, P);
  const steps = [
    { title: 'Agree on public values', text: `Both sides publicly agree on a prime p = ${P} and base g = ${G} (the shared “yellow paint”). An eavesdropper sees these.` },
    { title: 'Each side picks a private secret', text: `Alice secretly picks a = ${a}; Bob secretly picks b = ${b}. These never leave their devices.` },
    { title: 'Mix and send', text: `Alice sends A = gᵃ mod p = ${A}; Bob sends B = gᵇ mod p = ${B}. Mixed paint can’t practically be “un-mixed”: recovering a from A is the discrete logarithm problem.` },
    { title: 'Mix in your own secret again', text: `Alice computes Bᵃ mod p = ${sA}; Bob computes Aᵇ mod p = ${sB}. Both arrive at the same value without ever sending it.` },
    { title: 'Shared secret → symmetric session key', text: 'The shared value is fed into a key-derivation function to create a symmetric key (e.g. AES). This is how TLS uses ephemeral Diffie-Hellman (ECDHE) to achieve perfect forward secrecy.' },
  ];
  const player = useStepPlayer(steps.length, { interval: 4000 });
  const i = player.index;
  return (
    <StepFrame
      player={player}
      title="Key exchange: Diffie-Hellman"
      caption={<StepCaption index={i} title={steps[i].title} text={steps[i].text} />}
      listView={<StepList steps={steps} />}
      note="Tiny numbers for learning. Real deployments use 2048-bit+ groups or elliptic curves (ECDHE). Unauthenticated DH is vulnerable to on-path attacks, so TLS signs the exchange with the server’s certificate key."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-fg-2">Alice’s secret a
          <input type="range" min={2} max={20} value={a} onChange={(e) => setA(Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label="Alice secret" />
          <span className="w-6 font-mono text-fg">{a}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-2">Bob’s secret b
          <input type="range" min={2} max={20} value={b} onChange={(e) => setB(Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label="Bob secret" />
          <span className="w-6 font-mono text-fg">{b}</span>
        </label>
      </div>
      <div className="grid grid-cols-3 items-start gap-2 rounded-xl border border-line bg-surface-2/40 p-4">
        <div className="space-y-3">
          <div className="text-center text-xs font-bold uppercase text-muted">Alice</div>
          <Swatch color="#facc15" label="Public paint" sub={`g=${G}, p=${P}`} dim={i < 0} />
          <Swatch color="#ef4444" label="Secret" sub={`a=${a}`} dim={i < 1} />
          <Swatch color="#f97316" label="Mixed (sent)" sub={`A=${A}`} dim={i < 2} />
          <Swatch color="#7c2d12" label="Shared secret" sub={String(sA)} dim={i < 3} />
        </div>
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div className="text-xs font-bold uppercase text-muted">Public channel</div>
          <div className={cn('rounded-lg border border-dashed border-line-strong px-2 py-1 text-[11px] text-fg-2', i >= 0 ? 'opacity-100' : 'opacity-25')}>p={P}, g={G}</div>
          <div className={cn('rounded-lg border border-dashed border-line-strong px-2 py-1 text-[11px] text-fg-2 transition-opacity', i >= 2 ? 'opacity-100' : 'opacity-25')}>A={A} → ← B={B}</div>
          <div className="text-[11px] text-muted">Eve sees all of this, but not a, b or the shared secret.</div>
        </div>
        <div className="space-y-3">
          <div className="text-center text-xs font-bold uppercase text-muted">Bob</div>
          <Swatch color="#facc15" label="Public paint" sub={`g=${G}, p=${P}`} dim={i < 0} />
          <Swatch color="#3b82f6" label="Secret" sub={`b=${b}`} dim={i < 1} />
          <Swatch color="#22c55e" label="Mixed (sent)" sub={`B=${B}`} dim={i < 2} />
          <Swatch color="#7c2d12" label="Shared secret" sub={String(sB)} dim={i < 3} />
        </div>
      </div>
      {i >= 3 && <p className={cn('mt-3 text-center text-sm font-semibold', sA === sB ? 'text-ok' : 'text-bad')}>{sA === sB ? `Both computed ${sA} — the same secret, never transmitted.` : 'Mismatch'}</p>}
    </StepFrame>
  );
}
