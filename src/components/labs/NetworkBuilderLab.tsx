import { useCallback, useMemo, useState } from 'react';
import {
  Background, Controls, ReactFlow, ReactFlowProvider, useNodesState, type Edge, type Node, type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CircleCheck, CircleX, Play, RotateCcw } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { Icon } from '@/components/ui/icons';
import { Button, Callout, Card, Select } from '@/components/ui/primitives';
import { useIsDark } from '@/components/layout/AppShell';
import { LabStep, ResultBanner } from './kit';
import { cn } from '@/lib/utils';

/* ---------- Model ---------- */

type ZoneId = 'internet' | 'dmz' | 'internal' | 'mgmt' | 'restricted' | 'unplaced';
const LANES: { id: Exclude<ZoneId, 'unplaced'>; label: string; x: number; tint: string }[] = [
  { id: 'internet', label: 'Internet (untrusted)', x: 0, tint: 'rgba(244,63,94,0.07)' },
  { id: 'dmz', label: 'Screened subnet (DMZ)', x: 220, tint: 'rgba(245,158,11,0.08)' },
  { id: 'internal', label: 'Internal user LAN', x: 440, tint: 'rgba(14,165,233,0.07)' },
  { id: 'mgmt', label: 'Management zone', x: 660, tint: 'rgba(139,92,246,0.08)' },
  { id: 'restricted', label: 'Restricted data zone', x: 880, tint: 'rgba(16,185,129,0.08)' },
];
const LANE_W = 190;
const LANE_H = 380;
const ORDER: Exclude<ZoneId, 'unplaced'>[] = ['internet', 'dmz', 'internal', 'mgmt', 'restricted'];

type Appliance = 'none' | 'fw' | 'ngfw' | 'waf';
const BOUNDARIES = ['Internet ↔ DMZ', 'DMZ ↔ Internal', 'Internal ↔ Management', 'Management ↔ Restricted'];
const APPLIANCES: { value: Appliance; label: string }[] = [
  { value: 'none', label: 'Nothing (direct connection)' },
  { value: 'fw', label: 'Stateful firewall (L4)' },
  { value: 'ngfw', label: 'NGFW (L7, app-aware)' },
  { value: 'waf', label: 'Firewall + WAF' },
];

const DEVICES: { id: string; label: string; icon: string; want: ZoneId[]; why: string }[] = [
  { id: 'web', label: 'Public web server', icon: 'globe', want: ['dmz'], why: 'Internet-facing services belong in the screened subnet so a compromise doesn’t land inside the internal network.' },
  { id: 'db', label: 'Customer database', icon: 'database', want: ['restricted'], why: 'Sensitive data sits in the most restricted zone, reachable only by the app tier and administrators via the jump server.' },
  { id: 'ws', label: 'Employee workstations', icon: 'laptop', want: ['internal'], why: 'User endpoints live on the internal LAN, never in the DMZ.' },
  { id: 'jump', label: 'Jump server', icon: 'terminal', want: ['mgmt'], why: 'A hardened jump (bastion) host in a management zone is the only path for administrative access to restricted systems.' },
  { id: 'vpn', label: 'VPN concentrator', icon: 'vpn', want: ['dmz'], why: 'Remote-access gateways terminate at the edge (screened subnet), then pass authenticated users inward through the firewall.' },
  { id: 'ids', label: 'IDS sensor', icon: 'ids', want: ['dmz', 'internal', 'restricted'], why: 'A passive sensor (SPAN/tap) watches traffic where attacks are likely — DMZ, internal or data zones are all reasonable.' },
  { id: 'proxy', label: 'Forward web proxy', icon: 'proxy', want: ['dmz', 'internal'], why: 'User web traffic leaves through a proxy that filters URLs and content; DMZ or internal placement both work.' },
];

/* ---------- React Flow nodes ---------- */

function ZoneNode({ data }: NodeProps) {
  const d = data as { label: string; tint: string };
  return (
    <div className="h-full w-full rounded-2xl border-2 border-dashed border-line-strong" style={{ background: d.tint, width: LANE_W, height: LANE_H }}>
      <div className="px-3 pt-2 text-[11px] font-bold uppercase tracking-wide text-fg-2">{d.label}</div>
    </div>
  );
}

function DeviceNode({ data }: NodeProps) {
  const d = data as { label: string; icon: string; zone: string; fixed?: boolean };
  return (
    <div className={cn('flex w-[150px] items-center gap-2 rounded-xl border-2 bg-surface px-2 py-1.5 shadow-md', d.fixed ? 'border-bad/50' : 'border-line-strong hover:border-accent')}>
      <Icon name={d.icon} className={cn('h-5 w-5 shrink-0', d.fixed ? 'text-bad' : 'text-accent')} />
      <div className="min-w-0">
        <div className="truncate text-[11px] font-semibold leading-tight text-fg">{d.label}</div>
        <div className="truncate text-[9.5px] text-muted">{d.zone}</div>
      </div>
    </div>
  );
}

const nodeTypes = { zone: ZoneNode, device: DeviceNode };

function zoneAt(n: Node): ZoneId {
  const cx = n.position.x + 75;
  const cy = n.position.y + 22;
  if (cy < 0 || cy > LANE_H) return 'unplaced';
  const lane = LANES.find((l) => cx >= l.x && cx <= l.x + LANE_W);
  return lane ? lane.id : 'unplaced';
}

const zoneLabel = (z: ZoneId) => (z === 'unplaced' ? 'Not placed' : LANES.find((l) => l.id === z)!.label);

const ZONE_OPTIONS: { value: ZoneId; label: string }[] = [{ value: 'unplaced', label: 'Not placed' }, ...ORDER.map((z) => ({ value: z, label: zoneLabel(z) }))];

/** Tray position for a device that is not in any lane. */
function trayPosition(i: number) {
  return { x: 10 + (i % 4) * 270, y: 420 + Math.floor(i / 4) * 70 };
}

function initialNodes(): Node[] {
  const zones: Node[] = LANES.map((l) => ({
    id: `zone-${l.id}`, type: 'zone', position: { x: l.x, y: 0 }, data: { label: l.label, tint: l.tint },
    draggable: false, selectable: false, zIndex: -1, style: { width: LANE_W, height: LANE_H },
  }));
  const fixed: Node[] = [
    { id: 'user', type: 'device', position: { x: 20, y: 80 }, data: { label: 'Internet users', icon: 'users', zone: 'Internet', fixed: true }, draggable: false },
    { id: 'attacker', type: 'device', position: { x: 20, y: 250 }, data: { label: 'Attacker', icon: 'attacker', zone: 'Internet', fixed: true }, draggable: false },
  ];
  const devices: Node[] = DEVICES.map((d, i) => ({
    id: d.id, type: 'device', position: trayPosition(i), data: { label: d.label, icon: d.icon, zone: 'Not placed' },
  }));
  return [...zones, ...fixed, ...devices];
}

/* ---------- Simulation ---------- */

function crossing(a: ZoneId, b: ZoneId): number[] {
  const i = ORDER.indexOf(a as never);
  const j = ORDER.indexOf(b as never);
  if (i < 0 || j < 0) return [];
  const [lo, hi] = i < j ? [i, j] : [j, i];
  return Array.from({ length: hi - lo }, (_, k) => lo + k);
}

interface Flow { id: string; from: string; to: string; label: string; expect: 'allow' | 'block'; why: string }
const FLOWS: Flow[] = [
  { id: 'f1', from: 'user', to: 'web', label: 'HTTPS 443 → web server', expect: 'allow', why: 'Customers must reach the public website.' },
  { id: 'f2', from: 'attacker', to: 'db', label: 'SQL 1433 → database', expect: 'block', why: 'The database must never be reachable from the Internet.' },
  { id: 'f3', from: 'web', to: 'db', label: 'App tier → DB 1433', expect: 'allow', why: 'Only the web/app server may query the database.' },
  { id: 'f4', from: 'attacker', to: 'ws', label: 'RDP 3389 → workstation', expect: 'block', why: 'No inbound connections from the Internet to user devices.' },
  { id: 'f5', from: 'jump', to: 'db', label: 'Admin SSH via jump server', expect: 'allow', why: 'Administration flows through the hardened jump server.' },
  { id: 'f6', from: 'ws', to: 'db', label: 'Workstation → DB directly', expect: 'block', why: 'Users reach data through the application, not directly (least privilege).' },
];

/** Zone policy enforced by any firewall on the path. Returns true if the policy would permit the flow. */
function policyAllows(f: Flow, zones: Record<string, ZoneId>): boolean {
  if (f.id === 'f1') return zones.web === 'dmz';
  if (f.id === 'f3') return true;
  if (f.id === 'f5') return zones.jump === 'mgmt';
  return false; // f2, f4, f6 are never approved
}

function simulateFlows(zones: Record<string, ZoneId>, gates: Appliance[]) {
  return FLOWS.map((f) => {
    const za = zones[f.from];
    const zb = zones[f.to];
    if (za === 'unplaced' || zb === 'unplaced' || !za || !zb) return { f, result: 'n/a' as const, ok: false, note: 'A device in this flow has not been placed yet.' };
    const path = crossing(za, zb);
    const firewalls = path.filter((b) => gates[b] !== 'none');
    const allowed = firewalls.length === 0 ? true : policyAllows(f, zones);
    const ok = (f.expect === 'allow') === allowed;
    let note: string;
    if (ok) note = f.expect === 'allow' ? 'Allowed as intended.' : `Blocked by the firewall at ${firewalls.map((b) => BOUNDARIES[b]).join(', ')}.`;
    else if (f.expect === 'block') note = path.length === 0 ? 'Both endpoints are in the same zone — nothing filters this traffic. Move one of them.' : 'No firewall on this path, so the traffic flows freely.';
    else note = 'The firewall policy blocks this required flow — the device is in a zone where this service isn’t permitted.';
    return { f, result: allowed ? ('allow' as const) : ('block' as const), ok, note };
  });
}

/* ---------- Component ---------- */

function Builder({ onComplete }: LabProps) {
  const dark = useIsDark();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes());
  const [gates, setGates] = useState<Appliance[]>(['none', 'none', 'none', 'none']);
  const [sim, setSim] = useState<ReturnType<typeof simulateFlows> | null>(null);

  const zones = useMemo(() => {
    const z: Record<string, ZoneId> = { user: 'internet', attacker: 'internet' };
    for (const n of nodes) if (n.type === 'device' && !['user', 'attacker'].includes(n.id)) z[n.id] = zoneAt(n);
    return z;
  }, [nodes]);

  // Keep each device's zone label in sync as it is dragged.
  const onNodeDragStop = useCallback((_: unknown, node: Node) => {
    setNodes((ns) => ns.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, zone: zoneLabel(zoneAt(node)) } } : n)));
    setSim(null);
  }, [setNodes]);

  // Keyboard/screen-reader alternative to dragging: move a device into the chosen lane.
  const placeIn = (id: string, zone: ZoneId) => {
    setNodes((ns) => {
      const i = DEVICES.findIndex((d) => d.id === id);
      const lane = LANES.find((l) => l.id === zone);
      const slot = lane ? ns.filter((n) => n.type === 'device' && n.id !== id && zoneAt(n) === zone).length : 0;
      const position = lane ? { x: lane.x + 20, y: Math.min(40 + slot * 56, LANE_H - 60) } : trayPosition(i);
      return ns.map((n) => (n.id === id ? { ...n, position, data: { ...n.data, zone: zoneLabel(zone) } } : n));
    });
    setSim(null);
  };

  const checks = useMemo(() => {
    const out = DEVICES.map((d) => ({ label: `${d.label} → ${d.want.map(zoneLabel).join(' or ')}`, ok: d.want.includes(zones[d.id]), why: d.why }));
    out.push({ label: 'Internet ↔ DMZ edge inspects web traffic (NGFW or firewall + WAF)', ok: gates[0] === 'ngfw' || gates[0] === 'waf', why: 'A web-facing DMZ needs application-layer inspection (WAF/NGFW) to stop SQLi/XSS, not just port filtering.' });
    out.push({ label: 'DMZ ↔ Internal is firewalled', ok: gates[1] !== 'none', why: 'A screened subnet sits between two filters; if the DMZ falls, the inner firewall still protects the LAN.' });
    out.push({ label: 'Restricted data zone is firewalled', ok: gates[3] !== 'none', why: 'Segment the most sensitive data with its own enforcement point.' });
    return out;
  }, [zones, gates]);

  const edges: Edge[] = useMemo(() => {
    if (!sim) return [];
    return sim.filter((s) => s.result !== 'n/a').map((s) => ({
      id: s.f.id, source: s.f.from, target: s.f.to, animated: s.result === 'allow',
      label: `${s.f.label}: ${s.result.toUpperCase()}`,
      style: { stroke: s.ok ? '#10b981' : '#f43f5e', strokeWidth: 2, strokeDasharray: s.result === 'block' ? '4 4' : undefined },
      labelStyle: { fontSize: 10, fill: dark ? '#e8eef8' : '#0b1220', fontWeight: 600 },
      labelBgStyle: { fill: dark ? '#0b1220' : '#ffffff' },
      type: 'smoothstep',
    }));
  }, [sim, dark]);

  const run = () => {
    const s = simulateFlows(zones, gates);
    setSim(s);
    const passed = checks.filter((c) => c.ok).length + s.filter((x) => x.ok).length;
    const total = checks.length + s.length;
    if (s.every((x) => x.result !== 'n/a')) onComplete(Math.round((passed / total) * 100));
  };

  const reset = () => { setNodes(initialNodes()); setGates(['none', 'none', 'none', 'none']); setSim(null); };
  const score = sim ? checks.filter((c) => c.ok).length + sim.filter((x) => x.ok).length : 0;

  return (
    <div className="space-y-5">
      <LabStep n={1} title="Place every device in a zone" sub="Drag devices from the tray (bottom) into a lane, or use the zone pickers below the canvas. Pan/zoom with the controls; on touch screens drag with one finger.">
        <div className="h-[520px] overflow-hidden rounded-xl border border-line bg-surface-2/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            minZoom={0.3}
            maxZoom={1.6}
            colorMode={dark ? 'dark' : 'light'}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted">Prefer not to drag? Choose each device’s zone here — the canvas updates to match.</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DEVICES.map((d) => (
              <Select key={d.id} label={d.label} value={zones[d.id] ?? 'unplaced'} onChange={(v) => placeIn(d.id, v as ZoneId)} options={ZONE_OPTIONS} />
            ))}
          </div>
        </div>
      </LabStep>

      <LabStep n={2} title="Choose what sits on each zone boundary" sub="Traffic crossing a boundary with a firewall is checked against the zone policy; a boundary with nothing lets everything through.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BOUNDARIES.map((b, i) => (
            <Select key={b} label={b} value={gates[i]} onChange={(v) => { setGates((g) => g.map((x, k) => (k === i ? (v as Appliance) : x))); setSim(null); }} options={APPLIANCES} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={run}><Play className="h-4 w-4" /> Simulate traffic</Button>
          <Button onClick={reset}><RotateCcw className="h-4 w-4" /> Reset design</Button>
        </div>
      </LabStep>

      {sim && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-fg">Traffic flows</h3>
            <ul className="space-y-2">
              {sim.map((s) => (
                <li key={s.f.id} className="flex gap-2 text-sm">
                  {s.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />}
                  <span><strong className="text-fg">{s.f.label}</strong> <span className="text-xs text-muted">(should {s.f.expect})</span><span className="block text-fg-2">{s.note} <span className="text-muted">{s.f.why}</span></span></span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-fg">Design review</h3>
            <ul className="space-y-2">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2 text-sm">
                  {c.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />}
                  <span><strong className="text-fg">{c.label}</strong>{!c.ok && <span className="block text-fg-2">{c.why}</span>}</span>
                </li>
              ))}
            </ul>
          </Card>
          <div className="lg:col-span-2">
            <ResultBanner score={score} total={checks.length + sim.length} message={score === checks.length + sim.length ? 'A defensible, segmented design.' : 'Adjust placements or boundaries and simulate again.'} />
          </div>
        </div>
      )}
      <Callout kind="note" title="Concepts in play">Screened subnet (DMZ), security zones, segmentation, device placement, jump server, proxy, IDS sensor placement (passive), Layer 4 vs Layer 7 filtering, and least-privilege flows.</Callout>
    </div>
  );
}

export default function NetworkBuilderLab(props: LabProps) {
  return (
    <ReactFlowProvider>
      <Builder {...props} />
    </ReactFlowProvider>
  );
}
