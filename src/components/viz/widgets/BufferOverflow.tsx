import { useState } from 'react';
import { Switch } from '@/components/ui/primitives';
import { Field, WidgetFrame, inputCls } from './WidgetFrame';
import { cn } from '@/lib/utils';

const BUF = 8;
type Region = 'buf' | 'canary' | 'fp' | 'ret' | 'beyond';

/** Visualizes a stack frame: an 8-byte buffer, a saved frame pointer and the return address. */
export default function BufferOverflow() {
  const [input, setInput] = useState('HELLO');
  const [bounds, setBounds] = useState(false);
  const [canary, setCanary] = useState(false);
  const bytes = [...input].slice(0, 24);
  const written = bounds ? bytes.slice(0, BUF - 1) : bytes; // keep room for the terminator when checked
  const cells = Array.from({ length: 20 }, (_, i) => written[i] ?? (i === written.length ? '\\0' : ''));
  const overflowBy = Math.max(0, written.length + 1 - BUF);
  const canaryHit = canary && written.length + 1 > BUF;
  const retHit = written.length + 1 > BUF + (canary ? 4 : 0) + 4;
  const region = (i: number): Region => (i < BUF ? 'buf' : canary && i < BUF + 4 ? 'canary' : i < BUF + (canary ? 8 : 4) ? 'fp' : i < BUF + (canary ? 12 : 8) ? 'ret' : 'beyond');
  const label: Record<Region, string> = { buf: 'buffer[8]', canary: 'stack canary', fp: 'saved frame ptr', ret: 'RETURN ADDRESS', beyond: 'caller frame' };
  const colour: Record<Region, string> = { buf: 'bg-sky-500/10 border-sky-500/30', canary: 'bg-amber-500/15 border-amber-500/40', fp: 'bg-violet-500/10 border-violet-500/30', ret: 'bg-rose-500/15 border-rose-500/40', beyond: 'bg-surface-2 border-line' };
  const status = bounds
    ? { tone: 'ok', text: `Bounds checking truncated the input to ${BUF - 1} characters + terminator. Nothing outside the buffer was touched.` }
    : canaryHit
      ? { tone: 'warn', text: 'The overflow overwrote the stack canary. Before returning, the program checks the canary, sees it changed, and aborts — the attack becomes a crash (denial of service) instead of code execution.' }
      : retHit
        ? { tone: 'bad', text: 'The return address was overwritten. When the function returns, the CPU jumps wherever the attacker’s bytes point — potentially to injected shellcode. This is how buffer overflows become remote code execution.' }
        : overflowBy > 0
          ? { tone: 'warn', text: 'The input spilled past the buffer into the saved frame pointer — memory corruption that can crash the program.' }
          : { tone: 'ok', text: 'The input fits inside the 8-byte buffer (including the string terminator).' };

  return (
    <WidgetFrame title="Stack buffer overflow" badge="Memory simulator" note="Simplified, illustrative stack layout. Real exploitation is also hampered by ASLR, DEP/NX and control-flow integrity; memory-safe languages prevent the bug class entirely.">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Input copied into an 8-byte buffer with strcpy() (try typing more than 7 characters)">
          <input className={cn(inputCls, 'font-mono')} value={input} maxLength={24} onChange={(e) => setInput(e.target.value.toUpperCase())} />
        </Field>
        <div className="flex flex-wrap gap-4">
          <Switch checked={bounds} onChange={setBounds} label="Bounds checking" />
          <Switch checked={canary} onChange={setCanary} label="Stack canary" />
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-[560px] gap-1">
          {cells.map((ch, i) => {
            const r = region(i);
            const over = !bounds && i >= BUF && i < written.length + 1;
            return (
              <div key={i} className={cn('flex w-8 flex-col items-center rounded-md border py-1.5 font-mono text-xs transition-colors', colour[r], over && 'ring-2 ring-bad')}>
                <span className={cn('font-bold', over ? 'text-bad' : 'text-fg')}>{ch || '·'}</span>
                <span className="text-[8px] text-muted">{i}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex min-w-[560px] gap-1 text-[9.5px] font-semibold text-muted">
          {((canary ? ['buf', 'canary', 'fp', 'ret', 'beyond'] : ['buf', 'fp', 'ret', 'beyond']) as Region[]).map((r) => {
            const w = r === 'buf' ? BUF : r === 'beyond' ? 20 - BUF - (canary ? 12 : 8) : 4;
            return <div key={r} style={{ width: `${w * 2.25}rem` }} className="truncate border-t-2 border-line-strong pt-0.5 text-center">{label[r]}</div>;
          })}
        </div>
      </div>
      <p className={cn('mt-4 rounded-lg px-3 py-2 text-sm', status.tone === 'ok' ? 'bg-ok/10' : status.tone === 'warn' ? 'bg-warn/10' : 'bg-bad/10')} aria-live="polite">{status.text}</p>
    </WidgetFrame>
  );
}
