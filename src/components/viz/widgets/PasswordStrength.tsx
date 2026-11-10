import { useState } from 'react';
import { Field, WidgetFrame, inputCls } from './WidgetFrame';
import { cn } from '@/lib/utils';

const COMMON = ['password', '123456', '12345678', 'qwerty', 'letmein', 'welcome', 'admin', 'iloveyou', 'p@ssw0rd', 'password1', 'winter2026!', 'summer2026!', 'spring2026!', 'company123'];

function analyse(pw: string) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  const common = COMMON.includes(pw.toLowerCase());
  const bits = common ? 4 : pw.length * Math.log2(Math.max(pool, 1));
  return { pool, bits, common };
}

function human(seconds: number): string {
  if (!isFinite(seconds)) return 'forever';
  const units: [number, string][] = [[31536000 * 1e9, 'billion years'], [31536000 * 1e6, 'million years'], [31536000 * 1000, 'thousand years'], [31536000, 'years'], [86400, 'days'], [3600, 'hours'], [60, 'minutes'], [1, 'seconds']];
  for (const [s, u] of units) if (seconds >= s) return `${(seconds / s).toFixed(seconds / s < 10 ? 1 : 0)} ${u}`;
  return 'instantly';
}

/** Rough brute-force estimate showing why length (and slow hashing, and MFA) matter. */
export default function PasswordStrength() {
  const [pw, setPw] = useState('P@ssw0rd!');
  const [pw2, setPw2] = useState('correct horse battery staple');
  const rows = [pw, pw2].map((p) => ({ p, ...analyse(p) }));
  return (
    <WidgetFrame title="Password strength: length vs complexity" badge="Estimator" note="Simplified entropy estimate assuming random choices; human-chosen passwords are weaker than the math suggests. Never type real passwords into tools.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Password A"><input className={cn(inputCls, 'font-mono')} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Password B"><input className={cn(inputCls, 'font-mono')} value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((r, i) => {
          const guessesNeeded = Math.pow(2, r.bits) / 2;
          return (
            <div key={i} className={cn('rounded-xl border p-3', r.common || r.bits < 40 ? 'border-bad/40 bg-bad/5' : r.bits < 70 ? 'border-warn/40 bg-warn/5' : 'border-ok/40 bg-ok/5')}>
              <div className="text-xs font-bold uppercase text-muted">Password {i ? 'B' : 'A'} · {r.p.length} characters</div>
              <div className="mt-1 text-2xl font-bold text-fg">{r.common ? 'Common password!' : `~${Math.round(r.bits)} bits`}</div>
              <div className="mt-2 space-y-0.5 text-xs text-fg-2">
                <div>Character pool: {r.pool}</div>
                <div>Fast hash, offline GPU (10¹¹ guesses/s): <strong>{human(guessesNeeded / 1e11)}</strong></div>
                <div>bcrypt/Argon2 (10⁴ guesses/s): <strong>{human(guessesNeeded / 1e4)}</strong></div>
                <div>Online login with lockout (10 guesses/hour): <strong>{human(guessesNeeded / (10 / 3600))}</strong></div>
              </div>
            </div>
          );
        })}
      </div>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-fg-2">
        <li><strong>Length</strong> adds far more strength than swapping letters for symbols — passphrases are long and memorable.</li>
        <li><strong>Reuse</strong> is the real killer: a leaked password from one site is tried everywhere (credential stuffing).</li>
        <li>Modern guidance (e.g. NIST SP 800-63B) favours length, breached-password checks and MFA over forced periodic <strong>expiration</strong>; a minimum password <strong>age</strong> stops users cycling back to an old password immediately.</li>
      </ul>
    </WidgetFrame>
  );
}
