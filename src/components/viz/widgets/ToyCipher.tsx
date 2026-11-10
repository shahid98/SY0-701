import { useMemo, useState } from 'react';
import { StepCaption, StepFrame, StepList, useStepPlayer } from '../StepPlayer';
import { Field, inputCls, monoBox } from './WidgetFrame';
import { Switch } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const enc = new TextEncoder();
const hex = (b: number) => b.toString(16).padStart(2, '0');
const bin = (b: number) => b.toString(2).padStart(8, '0');

/** Simplified symmetric encryption/decryption: a repeating-key XOR "toy stream cipher". */
export default function ToyCipher() {
  const [plain, setPlain] = useState('MEET AT NOON');
  const [key, setKey] = useState('K3Y');
  const [wrongKey, setWrongKey] = useState(false);
  const p = useMemo(() => [...enc.encode(plain.slice(0, 24))], [plain]);
  const k = useMemo(() => [...enc.encode(key || 'K')], [key]);
  const ks = p.map((_, i) => k[i % k.length]);
  const c = p.map((b, i) => b ^ ks[i]);
  const wk = [...enc.encode('BAD')];
  const dKey = wrongKey ? p.map((_, i) => wk[i % wk.length]) : ks;
  const d = c.map((b, i) => b ^ dKey[i]);
  const dText = String.fromCharCode(...d.map((x) => (x >= 32 && x < 127 ? x : 46)));

  const steps = [
    { title: 'Plaintext becomes bytes', text: 'Computers encrypt numbers, not letters. Each character of the **plaintext** is encoded as a byte (shown in hex).' },
    { title: 'The shared secret key is stretched to fit', text: 'Both sides already hold the **same secret key** — that is what makes it *symmetric*. This toy repeats the key to match the message length.' },
    { title: 'Combine each byte with the key (XOR)', text: 'Each plaintext bit is XORed with a key bit: equal bits → 0, different bits → 1. The result is **ciphertext**.' },
    { title: 'Ciphertext travels over the network', text: 'An eavesdropper sees only scrambled bytes. Without the key the pattern is meaningless — **confidentiality** in transit.' },
    { title: 'Decrypt with the same key', text: 'XOR is reversible: ciphertext ⊕ key = plaintext. The receiver uses the **same** key to recover the message.' },
    { title: 'Wrong key → garbage', text: 'Try the “use the wrong key” switch: decryption produces nonsense. Protecting and distributing the key is the hard part of symmetric crypto (key exchange).' },
  ];
  const player = useStepPlayer(steps.length, { interval: 3800 });
  const i = player.index;

  return (
    <StepFrame
      player={player}
      title="Symmetric encryption & decryption (toy cipher)"
      caption={<StepCaption index={i} title={steps[i].title} text={steps[i].text} />}
      listView={<StepList steps={steps} />}
      note="Simplified learning model. Repeating-key XOR is NOT secure (patterns leak). Real symmetric ciphers such as AES use 128-bit blocks, 128/192/256-bit keys and many rounds of substitution, permutation and mixing."
      toolbar={<Switch checked={wrongKey} onChange={(v) => { setWrongKey(v); if (v) player.goTo(5); }} label="Use the wrong key" />}
    >
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <Field label="Plaintext (max 24 chars)"><input className={inputCls} value={plain} onChange={(e) => setPlain(e.target.value)} maxLength={24} /></Field>
        <Field label="Shared secret key"><input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} maxLength={12} /></Field>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-separate border-spacing-y-1 font-mono text-[11.5px]">
          <tbody>
            <Row label="Plaintext" show={i >= 0} cells={p.map((b) => String.fromCharCode(b))} sub={p.map(hex)} tone="text-fg" />
            <Row label="Key stream" show={i >= 1} cells={ks.map((b) => String.fromCharCode(b))} sub={ks.map(hex)} tone="text-violet-500" />
            <Row label="Ciphertext" show={i >= 2} cells={c.map(hex)} sub={c.map((b) => bin(b).slice(0, 4) + '…')} tone="text-bad" />
            <Row label={wrongKey ? 'Decrypted (wrong key)' : 'Decrypted'} show={i >= 4} cells={d.map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : '·'))} sub={d.map(hex)} tone={wrongKey ? 'text-warn' : 'text-ok'} />
          </tbody>
        </table>
      </div>
      {i >= 2 && p.length > 0 && (
        <div className={cn('mt-3 grid gap-2 text-[11.5px] sm:grid-cols-3', 'font-mono')}>
          <div className={monoBox}><div className="mb-0.5 font-sans text-[10px] font-semibold uppercase text-muted">First byte</div>{bin(p[0])} ({String.fromCharCode(p[0])})</div>
          <div className={monoBox}><div className="mb-0.5 font-sans text-[10px] font-semibold uppercase text-muted">⊕ key byte</div>{bin(ks[0])} ({String.fromCharCode(ks[0])})</div>
          <div className={monoBox}><div className="mb-0.5 font-sans text-[10px] font-semibold uppercase text-muted">= cipher byte</div>{bin(c[0])} (0x{hex(c[0])})</div>
        </div>
      )}
      {i >= 3 && <div className={cn(monoBox, 'mt-3')}><span className="font-sans text-[10px] font-semibold uppercase text-muted">On the wire: </span>{c.map(hex).join(' ')}</div>}
      {i >= 4 && <div className={cn('mt-2 rounded-lg px-3 py-2 text-sm', wrongKey ? 'bg-warn/10 text-fg' : 'bg-ok/10 text-fg')}>Receiver reads: <strong className="font-mono">{dText}</strong></div>}
    </StepFrame>
  );
}

function Row({ label, cells, sub, show, tone }: { label: string; cells: string[]; sub: string[]; show: boolean; tone: string }) {
  return (
    <tr className={cn('transition-opacity duration-500', show ? 'opacity-100' : 'opacity-15')}>
      <th className="w-28 pr-2 text-left font-sans text-[11px] font-semibold text-muted">{label}</th>
      {cells.map((ch, j) => (
        <td key={j} className="rounded bg-surface-2/70 px-1 py-0.5 text-center align-top">
          <div className={cn('font-semibold', tone)}>{ch === ' ' ? '␠' : ch}</div>
          <div className="text-[9.5px] text-muted">{sub[j]}</div>
        </td>
      ))}
    </tr>
  );
}
