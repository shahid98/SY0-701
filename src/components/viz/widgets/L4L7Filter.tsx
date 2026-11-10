import { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import { Select } from '@/components/ui/primitives';
import { WidgetFrame } from './WidgetFrame';
import { cn } from '@/lib/utils';

const REQUESTS = [
  { id: 'normal', label: 'Normal page view', port: 443, app: 'HTTPS (web)', payload: 'GET /products?page=2', malicious: false, why: 'Legitimate web request.' },
  { id: 'sqli', label: 'SQL injection in a parameter', port: 443, app: 'HTTPS (web)', payload: "GET /products?id=1' UNION SELECT card_no FROM payments--", malicious: true, why: 'Attack hidden inside allowed port-443 traffic; only content inspection sees it.' },
  { id: 'tunnel', label: 'File-sharing app over port 443', port: 443, app: 'BitTorrent-like P2P', payload: '[P2P handshake disguised on 443]', malicious: true, why: 'A disallowed application using an allowed port; app identification catches it.' },
  { id: 'rdp', label: 'RDP from the Internet', port: 3389, app: 'RDP', payload: '[RDP connection request]', malicious: true, why: 'Blocked by port alone — even a Layer 4 firewall catches this.' },
];

/** Compares what a Layer 4 (port-based) filter and a Layer 7 (application-aware) filter can see. */
export default function L4L7Filter() {
  const [id, setId] = useState('sqli');
  const r = REQUESTS.find((x) => x.id === id)!;
  const l4Allows = r.port === 443; // rule: allow tcp/443 to the web server
  const l7Allows = !r.malicious;
  return (
    <WidgetFrame title="Layer 4 vs Layer 7 filtering" badge="Simulation" note="Simplified: Layer 7 inspection of HTTPS requires TLS termination/inspection at the WAF/NGFW.">
      <Select label="Incoming request" value={id} onChange={setId} options={REQUESTS.map((x) => ({ value: x.id, label: x.label }))} className="max-w-sm" />
      <div className="mt-4 grid gap-2 font-mono text-xs sm:grid-cols-[auto_1fr]">
        <span className="rounded-md bg-sky-500/15 px-2 py-1 text-sky-700 dark:text-sky-300">L3 IP header</span>
        <span className="rounded-md border border-line px-2 py-1">src 203.0.113.9 → dst 198.51.100.20 (web server)</span>
        <span className="rounded-md bg-violet-500/15 px-2 py-1 text-violet-700 dark:text-violet-300">L4 TCP header</span>
        <span className="rounded-md border border-line px-2 py-1">dst port {r.port}</span>
        <span className="rounded-md bg-amber-500/15 px-2 py-1 text-amber-700 dark:text-amber-300">L7 application data</span>
        <span className="break-all rounded-md border border-line px-2 py-1">{r.app}: {r.payload}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          { name: 'Layer 4 firewall', sees: 'IP addresses, ports, protocol, connection state', allow: l4Allows, rule: 'Rule: allow TCP 443 to the web server; deny everything else.' },
          { name: 'Layer 7 (NGFW / WAF)', sees: 'Everything L4 sees + application identity and request content', allow: l7Allows, rule: 'Policy: allow the web application; block SQLi/XSS patterns and unapproved apps.' },
        ].map((f) => {
          const correct = f.allow === !r.malicious;
          return (
            <div key={f.name} className={cn('rounded-xl border p-3', correct ? 'border-ok/40 bg-ok/5' : 'border-bad/40 bg-bad/5')}>
              <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                {f.allow ? <CircleCheck className="h-4 w-4 text-ok" /> : <CircleX className="h-4 w-4 text-bad" />}{f.name}: {f.allow ? 'ALLOW' : 'BLOCK'}
              </div>
              <p className="mt-1 text-xs text-muted">Sees: {f.sees}</p>
              <p className="mt-1 text-xs text-fg-2">{f.rule}</p>
              <p className={cn('mt-2 text-xs font-semibold', correct ? 'text-ok' : 'text-bad')}>{correct ? 'Correct decision' : 'Wrong decision — the threat gets through'}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg-2">{r.why}</p>
    </WidgetFrame>
  );
}
