import { useState } from 'react';
import { CircleCheck, CircleX, Lock, LockOpen } from 'lucide-react';
import { Button, Switch } from '@/components/ui/primitives';
import { Field, WidgetFrame, inputCls, monoBox } from './WidgetFrame';

const toHex = (buf: ArrayBuffer | Uint8Array) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function deriveKey(pass: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Real AES-256-GCM using the browser's Web Crypto API. */
export default function AesDemo() {
  const [message, setMessage] = useState('Quarterly payroll file — confidential');
  const [pass, setPass] = useState('correct horse battery staple');
  const [decPass, setDecPass] = useState('correct horse battery staple');
  const [tamper, setTamper] = useState(false);
  const [sealed, setSealed] = useState<{ salt: Uint8Array; iv: Uint8Array; ct: Uint8Array } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const supported = typeof crypto !== 'undefined' && !!crypto.subtle;

  const encrypt = async () => {
    setBusy(true);
    setResult(null);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, new TextEncoder().encode(message)));
    setSealed({ salt, iv, ct });
    setBusy(false);
  };

  const decrypt = async () => {
    if (!sealed) return;
    setBusy(true);
    try {
      const key = await deriveKey(decPass, sealed.salt);
      const data = new Uint8Array(sealed.ct);
      if (tamper) data[0] ^= 0x01;
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sealed.iv as BufferSource }, key, data);
      setResult({ ok: true, text: new TextDecoder().decode(pt) });
    } catch {
      setResult({ ok: false, text: tamper ? 'Decryption failed: the authentication tag did not match — the ciphertext was modified (integrity check).' : 'Decryption failed: wrong key. GCM rejects the data instead of returning garbage.' });
    }
    setBusy(false);
  };

  if (!supported) {
    return <WidgetFrame title="Real AES-256-GCM"><p className="text-sm text-muted">Web Crypto isn’t available here (it needs https or localhost).</p></WidgetFrame>;
  }

  return (
    <WidgetFrame
      title="Real AES-256-GCM encryption in your browser"
      badge="Web Crypto"
      note="This is the real AES algorithm. The key is derived from the passphrase with PBKDF2 (key stretching, 100,000 iterations, random salt). GCM is an authenticated mode: it provides confidentiality and detects tampering."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Message (plaintext)"><input className={inputCls} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        <Field label="Encryption passphrase"><input className={inputCls} value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
      </div>
      <Button className="mt-3" variant="primary" onClick={encrypt} disabled={busy}><Lock className="h-4 w-4" /> Encrypt</Button>
      {sealed && (
        <div className="mt-4 space-y-2">
          <div className={monoBox}><span className="font-sans text-[10px] font-semibold uppercase text-muted">Salt (random, stored with data) </span>{toHex(sealed.salt)}</div>
          <div className={monoBox}><span className="font-sans text-[10px] font-semibold uppercase text-muted">IV / nonce (96-bit, never reuse with the same key) </span>{toHex(sealed.iv)}</div>
          <div className={monoBox}><span className="font-sans text-[10px] font-semibold uppercase text-muted">Ciphertext + 128-bit auth tag ({sealed.ct.length} bytes) </span>{toHex(sealed.ct)}</div>
          <p className="text-xs text-muted">Encrypt again: salt, IV and ciphertext all change even for the same message — randomness prevents pattern leaks.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Decryption passphrase (try changing it)"><input className={inputCls} value={decPass} onChange={(e) => setDecPass(e.target.value)} /></Field>
            <Switch checked={tamper} onChange={setTamper} label="Tamper with 1 bit" />
          </div>
          <Button onClick={decrypt} disabled={busy}><LockOpen className="h-4 w-4" /> Decrypt</Button>
          {result && (
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${result.ok ? 'bg-ok/10' : 'bg-bad/10'}`} aria-live="polite">
              {result.ok ? <CircleCheck className="mt-0.5 h-4 w-4 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 text-bad" />}
              <span className="text-fg">{result.ok ? <>Recovered: <strong>{result.text}</strong></> : result.text}</span>
            </div>
          )}
        </div>
      )}
    </WidgetFrame>
  );
}
