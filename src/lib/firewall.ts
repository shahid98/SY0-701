/** Stateless, first-match ACL engine with an implicit deny at the end. */
export type Proto = 'tcp' | 'udp' | 'icmp' | 'any';

export interface FwRule {
  id: string;
  action: 'allow' | 'deny';
  proto: Proto;
  src: string; // "any", an IP, or CIDR
  dst: string;
  port: string; // "any", "443", "80,443" or "1000-2000" (ignored for ICMP)
}

export interface Packet {
  proto: Exclude<Proto, 'any'>;
  src: string;
  dst: string;
  port: number;
}

export function ipToInt(ip: string): number | null {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

export function validAddr(spec: string): boolean {
  const s = spec.trim().toLowerCase();
  if (s === 'any') return true;
  const [ip, bits] = s.split('/');
  if (ipToInt(ip) === null) return false;
  if (bits === undefined) return true;
  const b = Number(bits);
  return Number.isInteger(b) && b >= 0 && b <= 32;
}

export function inAddr(ip: string, spec: string): boolean {
  const s = spec.trim().toLowerCase();
  if (s === 'any') return true;
  const target = ipToInt(ip);
  const [base, bits] = s.split('/');
  const b = ipToInt(base);
  if (target === null || b === null) return false;
  const n = bits === undefined ? 32 : Number(bits);
  if (n === 0) return true;
  const mask = n === 32 ? 0xffffffff : (~((1 << (32 - n)) - 1)) >>> 0;
  return ((target & mask) >>> 0) === ((b & mask) >>> 0);
}

export function validPort(spec: string): boolean {
  const s = spec.trim().toLowerCase();
  if (s === 'any') return true;
  return s.split(',').every((part) => {
    const r = part.trim().match(/^(\d{1,5})(?:-(\d{1,5}))?$/);
    if (!r) return false;
    const a = Number(r[1]);
    const b = r[2] ? Number(r[2]) : a;
    return a >= 0 && b <= 65535 && a <= b;
  });
}

export function inPort(port: number, spec: string): boolean {
  const s = spec.trim().toLowerCase();
  if (s === 'any') return true;
  return s.split(',').some((part) => {
    const [a, b] = part.trim().split('-').map(Number);
    return b === undefined || Number.isNaN(b) ? port === a : port >= a && port <= b;
  });
}

export function ruleError(r: FwRule): string | null {
  if (!validAddr(r.src)) return `Invalid source “${r.src}”`;
  if (!validAddr(r.dst)) return `Invalid destination “${r.dst}”`;
  if (r.proto !== 'icmp' && !validPort(r.port)) return `Invalid port “${r.port}”`;
  return null;
}

export interface TraceStep {
  index: number;
  matched: boolean;
  reason: string;
}

export function evaluate(rules: FwRule[], p: Packet): { action: 'allow' | 'deny'; index: number; trace: TraceStep[] } {
  const trace: TraceStep[] = [];
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    const fails: string[] = [];
    if (r.proto !== 'any' && r.proto !== p.proto) fails.push(`protocol ${p.proto} ≠ ${r.proto}`);
    if (!inAddr(p.src, r.src)) fails.push(`source ${p.src} not in ${r.src}`);
    if (!inAddr(p.dst, r.dst)) fails.push(`destination ${p.dst} not in ${r.dst}`);
    if (p.proto !== 'icmp' && r.proto !== 'icmp' && !inPort(p.port, r.port)) fails.push(`port ${p.port} not in ${r.port}`);
    if (fails.length === 0) {
      trace.push({ index: i, matched: true, reason: `matches → ${r.action.toUpperCase()} (first match wins; evaluation stops)` });
      return { action: r.action, index: i, trace };
    }
    trace.push({ index: i, matched: false, reason: fails.join('; ') });
  }
  trace.push({ index: -1, matched: true, reason: 'no rule matched → implicit deny' });
  return { action: 'deny', index: -1, trace };
}

export const packetLabel = (p: Packet) => `${p.proto.toUpperCase()} ${p.src} → ${p.dst}${p.proto === 'icmp' ? '' : `:${p.port}`}`;
