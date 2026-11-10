import { useMemo, useState } from 'react';
import type { LabProps } from '@/components/labs/registry';
import type { SequenceVisual, SeqStep } from '@/types/content';
import { SequenceDiagram } from '@/components/viz/SequenceDiagram';
import { Segmented } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, type ClassifyItem } from './kit';

type Scenario = 'ok' | 'badpw' | 'expired' | 'mab';

const NODES: SequenceVisual['nodes'] = [
  { id: 'sup', label: 'Supplicant', sub: 'Laptop / phone with 802.1X client', icon: 'laptop', x: 12, y: 62 },
  { id: 'auth', label: 'Authenticator', sub: 'Switch port / wireless AP', icon: 'switch', x: 42, y: 62 },
  { id: 'as', label: 'Authentication server', sub: 'RADIUS (AAA)', icon: 'server', x: 72, y: 62 },
  { id: 'dir', label: 'Directory / CA', sub: 'Accounts, groups, CRL', icon: 'database', x: 88, y: 20 },
  { id: 'lan', label: 'Corporate network', sub: 'VLANs behind the port', icon: 'network', x: 42, y: 18 },
];

const start: SeqStep[] = [
  { title: 'Device connects — port is unauthorized', text: 'The link comes up, but the authenticator keeps the port in the **unauthorized** state: only EAPOL (EAP over LAN) frames are allowed. No DHCP, no DNS, no access.', active: ['sup', 'auth'], status: { auth: ['Port: unauthorized', 'bad'], sup: ['No network access', 'bad'] } },
  { title: 'Authenticator asks for an identity', from: 'auth', to: 'sup', msg: 'EAP-Request/Identity', text: 'The switch or AP starts the conversation using **EAPOL** frames.' },
];

function steps(s: Scenario): SeqStep[] {
  if (s === 'mab') {
    return [
      { ...start[0], text: 'A network printer plugs in. Like any device it lands on an **unauthorized** port.', status: { auth: ['Port: unauthorized', 'bad'], sup: ['Printer — no 802.1X client', 'warn'] } },
      { title: 'EAP requests go unanswered', from: 'auth', to: 'sup', msg: 'EAP-Request/Identity ×3', text: 'The printer has no supplicant software, so the requests **time out**.', tone: 'warn' },
      { title: 'Fallback: MAC Authentication Bypass (MAB)', from: 'auth', to: 'as', msg: 'Access-Request (user = MAC address)', text: 'The switch sends the device’s **MAC address** to RADIUS as the identity. This is weaker than 802.1X because MAC addresses can be spoofed.', tone: 'warn' },
      { title: 'RADIUS checks the asset inventory', from: 'as', to: 'dir', msg: 'MAC in printer allow list?', text: 'The server looks the MAC up in an allow list built from asset inventory (and ideally device profiling).' },
      { title: 'Limited access granted', from: 'as', to: 'auth', msg: 'Access-Accept + VLAN 99 (printers)', tone: 'ok', text: 'RADIUS accepts but assigns a **restricted VLAN** that can only reach the print servers — compensating for MAB’s weaker assurance.', status: { auth: ['Port: authorized (VLAN 99 only)', 'warn'] } },
      { title: 'Printer reaches only what it needs', from: 'sup', to: 'lan', msg: 'Print traffic only', tone: 'ok', text: 'Segmentation plus MAB lets headless devices on the network without trusting them like a managed laptop.', status: { sup: ['Restricted access', 'warn'] } },
    ];
  }
  const tls = s !== 'badpw';
  const fail = s !== 'ok';
  const out: SeqStep[] = [
    ...start,
    { title: 'Supplicant answers with its identity', from: 'sup', to: 'auth', msg: tls ? 'EAP-Response: host/laptop-042' : 'EAP-Response: alice@corp', text: 'The identity is just a name — nothing is trusted yet.' },
    { title: 'Authenticator relays to RADIUS', from: 'auth', to: 'as', msg: 'RADIUS Access-Request (EAP inside)', text: 'The authenticator **does not judge credentials**. It wraps the EAP message inside RADIUS and forwards it to the authentication server.' },
    { title: tls ? 'EAP-TLS: server proves itself' : 'PEAP: protected tunnel is built', from: 'as', to: 'sup', msg: 'Server certificate (TLS)', text: tls ? 'The RADIUS server presents its certificate; the supplicant validates it so it doesn’t hand credentials to a rogue server. (Messages pass through the authenticator.)' : 'PEAP builds a TLS tunnel using only the **server’s** certificate; the user’s password is then sent inside that tunnel.' },
    { title: tls ? 'Client presents its certificate' : 'Inner authentication: username + password', from: 'sup', to: 'as', msg: tls ? 'Client certificate + proof of key' : 'MSCHAPv2 inside the tunnel', text: tls ? '**EAP-TLS** is mutual certificate authentication — no password to phish. The device proves it holds the private key.' : s === 'badpw' ? 'The user typed the **wrong password**.' : 'The user’s credentials travel encrypted inside the tunnel.', tone: s === 'badpw' ? 'bad' : undefined },
    { title: 'RADIUS checks the directory / CA', from: 'as', to: 'dir', msg: tls ? 'Cert valid? revoked? group?' : 'Verify password, group', text: s === 'expired' ? 'Validation finds the client certificate **expired**.' : s === 'badpw' ? 'The directory rejects the credentials.' : 'The certificate chains to the corporate CA, is not revoked, and the device belongs to the “Corporate laptops” group.', tone: fail ? 'bad' : 'ok' },
  ];
  if (!fail) {
    out.push(
      { title: 'Access-Accept with authorization attributes', from: 'as', to: 'auth', msg: 'Access-Accept + VLAN 20', tone: 'ok', text: 'RADIUS returns **Access-Accept** plus authorization attributes such as the VLAN — authentication and authorization in one exchange (AAA).' },
      { title: 'EAP-Success — the port opens', from: 'auth', to: 'sup', msg: 'EAP-Success', tone: 'ok', text: 'The authenticator moves the port to the **authorized** state on VLAN 20. On Wi-Fi, keys derived during EAP now protect the link (WPA2/WPA3-Enterprise).', status: { auth: ['Port: authorized (VLAN 20)', 'ok'], sup: ['Network access', 'ok'] } },
      { title: 'Traffic flows and accounting starts', from: 'sup', to: 'lan', msg: 'DHCP, DNS, apps', tone: 'ok', text: 'Normal traffic now passes. The switch sends **RADIUS Accounting** start records — the “accounting” in AAA.' },
    );
  } else {
    out.push(
      { title: 'Access-Reject', from: 'as', to: 'auth', msg: 'Access-Reject', tone: 'bad', text: 'Authentication failed, so RADIUS rejects the request.' },
      { title: 'EAP-Failure — the port stays closed', from: 'auth', to: 'sup', msg: 'EAP-Failure', tone: 'bad', text: 'The port remains **unauthorized** (or, if configured, moves to a guest/remediation VLAN). The device never touched the corporate network. You can retry from the start.', status: { auth: ['Port: unauthorized', 'bad'], sup: ['Denied', 'bad'] } },
    );
  }
  return out;
}

const QUIZ: ClassifyItem[] = [
  { prompt: 'Which component runs on the laptop and responds to EAP requests?', fields: [{ label: 'Role', options: ['Supplicant', 'Authenticator', 'Authentication server'], answer: 0 }], explain: 'The supplicant is the client software on the device asking for access.' },
  { prompt: 'Which component controls whether the port is open but never validates the credentials itself?', fields: [{ label: 'Role', options: ['Supplicant', 'Authenticator', 'Authentication server'], answer: 1 }], explain: 'The switch/AP is the authenticator: it relays EAP to RADIUS and enforces the result.' },
  { prompt: 'Which component checks the certificate or password against the directory?', fields: [{ label: 'Role', options: ['Supplicant', 'Authenticator', 'Authentication server'], answer: 2 }], explain: 'The RADIUS authentication server makes the decision.' },
  { prompt: 'Which EAP method uses certificates on both client and server (no passwords)?', fields: [{ label: 'Method', options: ['EAP-TLS', 'PEAP', 'EAP-FAST', 'MAB'], answer: 0 }], explain: 'EAP-TLS is mutual certificate authentication; PEAP and EAP-FAST use a tunnel to protect a password-based inner method; MAB isn’t EAP at all.' },
  { prompt: 'A badge printer has no 802.1X client. What lets it join a restricted VLAN?', fields: [{ label: 'Mechanism', options: ['EAP-TLS', 'PEAP', 'MAC Authentication Bypass', 'WPA3-Personal'], answer: 2 }], explain: 'MAB authenticates by MAC address — weaker (spoofable), so pair it with a restricted VLAN.' },
];

export default function Dot1xLab({ onComplete }: LabProps) {
  const [s, setS] = useState<Scenario>('ok');
  const v: SequenceVisual = useMemo(() => ({ kind: 'sequence', title: '802.1X / EAP authentication flow', nodes: NODES, steps: steps(s), links: [['sup', 'auth'], ['auth', 'as'], ['as', 'dir'], ['auth', 'lan'], ['sup', 'lan']], note: 'Condensed message flow. Real EAP-TLS/PEAP exchanges have more round trips (TLS handshake records, key derivation, EAPOL-Key on Wi-Fi).' }), [s]);
  return (
    <div className="space-y-5">
      <LabStep n={1} title="Watch the authentication flow" sub="Pick a scenario, press Play (or step with the arrows), and watch the port state badge under the switch.">
        <Segmented label="Scenario" value={s} onChange={setS} className="mb-4 flex-wrap" options={[
          { value: 'ok', label: 'Valid certificate' }, { value: 'badpw', label: 'Wrong password' }, { value: 'expired', label: 'Expired certificate' }, { value: 'mab', label: 'Printer (no supplicant)' },
        ]} />
        <SequenceDiagram key={s} v={v} />
      </LabStep>
      <LabStep n={2} title="Check your understanding" sub="Name the role or mechanism.">
        <ClassifyTable items={QUIZ} onScored={(c, t) => onComplete(Math.round((c / t) * 100))} />
      </LabStep>
    </div>
  );
}
