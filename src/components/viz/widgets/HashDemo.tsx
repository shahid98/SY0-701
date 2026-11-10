import { useEffect, useState } from 'react';
import { Button, Switch } from '@/components/ui/primitives';
import { Field, WidgetFrame, inputCls, monoBox } from './WidgetFrame';
import { cn } from '@/lib/utils';

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function sha256(s: string) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
function bitDiff(a: string, b: string) {
  let n = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 2) {
    let x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    while (x) { n += x & 1; x >>= 1; }
  }
  return n;
}

/** SHA-256 avalanche effect, salting and key stretching (PBKDF2), all computed for real. */
export default function HashDemo() {
  const [a, setA] = useState('Transfer $100 to Alice');
  const [b, setB] = useState('Transfer $900 to Alice');
  const [ha, setHa] = useState('');
  const [hb, setHb] = useState('');
  const [salted, setSalted] = useState(false);
  const [salts] = useState(() => [crypto.getRandomValues(new Uint8Array(8)), crypto.getRandomValues(new Uint8Array(8))].map((s) => [...s].map((x) => x.toString(16).padStart(2, '0')).join('')));
  const [pw] = useState('Summer2026!');
  const [userHashes, setUserHashes] = useState<string[]>(['', '']);
  const [iters, setIters] = useState(100_000);
  const [timing, setTiming] = useState<number | null>(null);
  const supported = typeof crypto !== 'undefined' && !!crypto.subtle;

  useEffect(() => {
    if (!supported) return;
    sha256(a).then(setHa);
    sha256(b).then(setHb);
  }, [a, b, supported]);

  useEffect(() => {
    if (!supported) return;
    Promise.all([0, 1].map((i) => sha256((salted ? salts[i] : '') + pw))).then(setUserHashes);
  }, [salted, salts, pw, supported]);

  const stretch = async () => {
    const t0 = performance.now();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
    await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salts[0]), iterations: iters, hash: 'SHA-256' }, base, 256);
    setTiming(performance.now() - t0);
  };

  if (!supported) return <WidgetFrame title="Hashing"><p className="text-sm text-muted">Web Crypto isn’t available in this context.</p></WidgetFrame>;
  const diff = ha && hb ? bitDiff(ha, hb) : 0;

  return (
    <WidgetFrame title="Hashing, salting and key stretching (real SHA-256 / PBKDF2)" badge="Web Crypto" note="Hashes are one-way fingerprints: you can’t decrypt a hash. Salts defeat precomputed rainbow tables; key stretching makes each password guess expensive.">
      <div className="space-y-5">
        <section>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">1 · Avalanche effect & integrity</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Message A"><input className={inputCls} value={a} onChange={(e) => setA(e.target.value)} /></Field>
            <Field label="Message B (change one character)"><input className={inputCls} value={b} onChange={(e) => setB(e.target.value)} /></Field>
          </div>
          <div className={cn(monoBox, 'mt-2')}>A: {ha}</div>
          <div className={cn(monoBox, 'mt-1')}>B: {hb}</div>
          <p className="mt-2 text-sm text-fg-2">
            {a === b ? 'Identical input → identical hash (hashing is deterministic).' : <><strong>{diff} of 256 bits</strong> differ ({Math.round((diff / 256) * 100)}%). A tiny change in input flips about half the output bits, so any tampering is obvious.</>}
          </p>
        </section>
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">2 · Salting stored passwords</span>
            <Switch checked={salted} onChange={setSalted} label="Add a unique salt per user" />
          </div>
          <p className="mb-2 text-sm text-fg-2">Two users both chose the password <code className="rounded bg-surface-3 px-1 font-mono">{pw}</code>.</p>
          {['alice', 'bob'].map((u, i) => (
            <div key={u} className={cn(monoBox, 'mt-1')}>
              <span className="font-sans text-[11px] font-semibold text-muted">{u}{salted ? ` · salt ${salts[i]}` : ''}: </span>{userHashes[i]}
            </div>
          ))}
          <p className={cn('mt-2 text-sm', salted ? 'text-ok' : 'text-bad')}>
            {salted ? 'Different salts → different hashes. An attacker can’t spot shared passwords or use a precomputed rainbow table.' : 'Unsalted: identical hashes reveal that both users share a password, and a rainbow table lookup cracks both at once.'}
          </p>
        </section>
        <section>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">3 · Key stretching (PBKDF2)</div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="range" min={1000} max={600000} step={1000} value={iters} onChange={(e) => setIters(Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label="PBKDF2 iterations" />
            <span className="w-32 text-right font-mono text-sm text-fg">{iters.toLocaleString()} rounds</span>
            <Button size="sm" onClick={stretch}>Run</Button>
          </div>
          {timing !== null && (
            <p className="mt-2 text-sm text-fg-2">
              One guess took <strong>{timing.toFixed(0)} ms</strong> on this device. An attacker testing 1 billion candidate passwords would need roughly <strong>{Math.round((timing * 1e9) / 1000 / 86400 / 365).toLocaleString()} CPU-years</strong> at this cost — versus seconds for a single fast hash.
            </p>
          )}
        </section>
      </div>
    </WidgetFrame>
  );
}
