import { useMemo, useState } from 'react';
import { Key, KeyRound } from 'lucide-react';
import { Select } from '@/components/ui/primitives';
import { Field, WidgetFrame, inputCls, monoBox } from './WidgetFrame';

const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

function gcd(a: bigint, b: bigint): bigint { while (b) [a, b] = [b, a % b]; return a; }
function modpow(b: bigint, e: bigint, m: bigint): bigint {
  let r = 1n; b %= m;
  while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; }
  return r;
}
function modinv(a: bigint, m: bigint): bigint {
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];
  while (r) { const q = oldR / r; [oldR, r] = [r, oldR - q * r]; [oldS, s] = [s, oldS - q * s]; }
  return ((oldS % m) + m) % m;
}

/** Toy RSA with tiny primes so every step of the arithmetic is visible. */
export default function RsaToy() {
  const [p, setP] = useState(61);
  const [q, setQ] = useState(53);
  const [m, setM] = useState(65);
  const k = useMemo(() => {
    const P = BigInt(p), Q = BigInt(q);
    const n = P * Q;
    const phi = (P - 1n) * (Q - 1n);
    const e = [17n, 3n, 5n, 7n, 11n, 13n, 19n, 23n, 65537n].find((x) => x < phi && gcd(x, phi) === 1n) ?? 3n;
    const d = modinv(e, phi);
    return { n, phi, e, d };
  }, [p, q]);
  const valid = p !== q;
  const msg = BigInt(Math.max(0, Math.min(Number(k.n) - 1, m)));
  const c = modpow(msg, k.e, k.n);
  const back = modpow(c, k.d, k.n);
  const hash = msg % k.n; // stand-in for a message digest
  const sig = modpow(hash, k.d, k.n);
  const verify = modpow(sig, k.e, k.n);

  return (
    <WidgetFrame
      title="Toy RSA: public/private key pair, encryption and signatures"
      badge="Step-through math"
      note="Learning model with tiny primes. Real RSA keys use primes hundreds of digits long (2048-bit+ modulus), padding schemes (OAEP/PSS), and sign a cryptographic hash of the message. RSA is slow, so it protects keys and signatures, not bulk data."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Prime p" value={String(p)} onChange={(v) => setP(Number(v))} options={PRIMES.map((x) => ({ value: String(x), label: String(x) }))} />
        <Select label="Prime q" value={String(q)} onChange={(v) => setQ(Number(v))} options={PRIMES.map((x) => ({ value: String(x), label: String(x) }))} />
        <Field label={`Message as a number (0–${Number(k.n) - 1})`}><input type="number" className={inputCls} value={m} min={0} max={Number(k.n) - 1} onChange={(e) => setM(Number(e.target.value))} /></Field>
      </div>
      {!valid ? <p className="mt-3 text-sm text-bad">Choose two different primes.</p> : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ol className="space-y-2 text-sm">
            <li className={monoBox}>1. n = p × q = {p} × {q} = <strong>{String(k.n)}</strong></li>
            <li className={monoBox}>2. φ(n) = (p−1)(q−1) = <strong>{String(k.phi)}</strong></li>
            <li className={monoBox}>3. Pick public exponent e coprime with φ → e = <strong>{String(k.e)}</strong></li>
            <li className={monoBox}>4. Private exponent d = e⁻¹ mod φ → d = <strong>{String(k.d)}</strong> (check: e·d mod φ = {String((k.e * k.d) % k.phi)})</li>
          </ol>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-info/30 bg-info/5 p-3 text-sm"><Key className="h-4 w-4 text-info" /><span><strong>Public key</strong> (share freely): (n={String(k.n)}, e={String(k.e)})</span></div>
            <div className="flex items-center gap-2 rounded-xl border border-bad/30 bg-bad/5 p-3 text-sm"><KeyRound className="h-4 w-4 text-bad" /><span><strong>Private key</strong> (never leaves the owner): d={String(k.d)}</span></div>
            <p className="text-xs text-muted">Security rests on the difficulty of factoring n back into p and q. With 2048-bit n that is infeasible today.</p>
          </div>
          <div className="space-y-2 rounded-xl border border-line p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Confidentiality: encrypt with the RECIPIENT’s public key</div>
            <div className={monoBox}>c = m^e mod n = {String(msg)}^{String(k.e)} mod {String(k.n)} = <strong>{String(c)}</strong></div>
            <div className={monoBox}>m = c^d mod n = {String(c)}^{String(k.d)} mod {String(k.n)} = <strong className={back === msg ? 'text-ok' : 'text-bad'}>{String(back)}</strong></div>
            <p className="text-xs text-muted">Anyone can encrypt with the public key; only the private-key holder can decrypt.</p>
          </div>
          <div className="space-y-2 rounded-xl border border-line p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Authenticity: sign with the SENDER’s private key</div>
            <div className={monoBox}>signature = h^d mod n = {String(hash)}^{String(k.d)} mod {String(k.n)} = <strong>{String(sig)}</strong></div>
            <div className={monoBox}>verify: sig^e mod n = <strong className={verify === hash ? 'text-ok' : 'text-bad'}>{String(verify)}</strong> {verify === hash ? '= h ✓ valid' : '≠ h ✗'}</div>
            <p className="text-xs text-muted">Anyone with the public key can verify; only the private-key holder could have signed → integrity, authentication and non-repudiation.</p>
          </div>
        </div>
      )}
    </WidgetFrame>
  );
}
