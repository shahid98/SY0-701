import type { ObjectiveId } from '@/types/content';

export interface LabMeta {
  id: string;
  title: string;
  summary: string;
  objectives: ObjectiveId[];
  icon: string;
  minutes: number;
  /** What the simulation simplifies compared with production systems. */
  model: string;
}

export const LABS: LabMeta[] = [
  {
    id: 'cia-controls', title: 'CIA Triad & Control Classification', icon: 'shield-half', minutes: 10, objectives: ['1.1', '1.2'],
    summary: 'Classify real-world controls by category and type, and decide which CIA property each incident violates.',
    model: 'Real controls often belong to several types at once; this lab scores the primary function CompTIA usually expects.',
  },
  {
    id: 'zero-trust', title: 'Zero Trust Policy Decision & Enforcement', icon: 'scan-search', minutes: 10, objectives: ['1.2'],
    summary: 'Compose an access request (identity, device, location, risk) and watch the policy engine, administrator and enforcement point act.',
    model: 'The policy rules are a small illustrative set. Real policy engines weigh many more signals and are vendor-specific.',
  },
  {
    id: 'crypto', title: 'AES vs RSA & Certificate Trust Chains', icon: 'key', minutes: 20, objectives: ['1.4'],
    summary: 'Encrypt with real AES-GCM in your browser, step through toy RSA, see hashing avalanche effects and break a certificate chain.',
    model: 'Toy RSA uses tiny primes so you can follow the arithmetic; real RSA keys are 2048+ bits. AES-GCM here is the real Web Crypto implementation.',
  },
  {
    id: 'phishing', title: 'Phishing & Social Engineering Recognition', icon: 'fish', minutes: 12, objectives: ['2.2', '5.6'],
    summary: 'Inspect realistic emails, texts and call transcripts, flag the red flags and choose the correct response.',
    model: 'Messages are fictional and harmless. Real phishing evolves constantly, so habits matter more than memorising examples.',
  },
  {
    id: 'attack-mitigation', title: 'Network Attacks & Mitigation Controls', icon: 'swords', minutes: 15, objectives: ['2.4', '2.5'],
    summary: 'Run a simulated intrusion against an enterprise and toggle controls to see which stages are prevented, detected or contained.',
    model: 'Each control is modelled as reliably doing its primary job. Real controls fail, get bypassed and need tuning.',
  },
  {
    id: 'network-builder', title: 'Enterprise Network Architecture Builder', icon: 'network', minutes: 20, objectives: ['3.1', '3.2'],
    summary: 'Place devices into zones (Internet, screened subnet, internal, management, restricted) by dragging or from a list, choose what guards each boundary, and simulate traffic between systems.',
    model: 'Traffic rules are evaluated per zone crossing. Real networks add routing, NAT, stateful inspection and many protocols.',
  },
  {
    id: 'dot1x', title: '802.1X Port-Based Authentication', icon: 'ethernet', minutes: 8, objectives: ['3.2', '4.1'],
    summary: 'Watch the supplicant, authenticator and RADIUS server exchange EAP messages, then change conditions to see failures.',
    model: 'Message exchange is condensed. Real EAP-TLS/PEAP exchanges contain more round trips and key derivation steps.',
  },
  {
    id: 'shared-responsibility', title: 'Cloud Shared Responsibility', icon: 'cloud', minutes: 8, objectives: ['3.1'],
    summary: 'Assign each stack layer to the customer or provider for on-premises, IaaS, PaaS and SaaS.',
    model: 'Shows the typical split. Every provider publishes its own responsibility matrix, and contracts can shift items.',
  },
  {
    id: 'data-states', title: 'Data Protection States', icon: 'database', minutes: 8, objectives: ['3.3'],
    summary: 'Decide whether data is at rest, in transit or in use, and pick the protection that fits.',
    model: 'Real data moves between states constantly; each scenario freezes one moment.',
  },
  {
    id: 'backup-dr', title: 'Backup Strategies & Disaster Recovery', icon: 'backup', minutes: 15, objectives: ['3.4', '5.2'],
    summary: 'Compare full, incremental and differential schedules, restore after a failure, and choose a recovery site from RTO/RPO and budget.',
    model: 'Restore times use simple per-set estimates. Real restores depend on media, bandwidth and verification.',
  },
  {
    id: 'firewall-acl', title: 'Firewall & ACL Rule Evaluation', icon: 'firewall', minutes: 15, objectives: ['4.5', '3.2'],
    summary: 'Edit an ordered rule base, fire test packets, and watch first-match evaluation and the implicit deny.',
    model: 'A stateless, first-match ACL engine. Stateful firewalls also track connections and allow return traffic automatically.',
  },
  {
    id: 'soc-siem', title: 'SOC: SIEM Alert Investigation', icon: 'siem', minutes: 25, objectives: ['4.4', '4.9', '4.8'],
    summary: 'Work an alert queue in a simulated SOC: triage, pivot through correlated logs, decide true/false positive and respond.',
    model: 'Logs are synthetic and simplified. Real SIEM data is far noisier, and correlation rules need continuous tuning.',
  },
  {
    id: 'iam-mfa', title: 'IAM Permissions & MFA', icon: 'user-check', minutes: 12, objectives: ['4.6'],
    summary: 'Evaluate the same request under DAC, MAC, RBAC, rule-based and ABAC, then decide which factor combinations are true MFA.',
    model: 'Policy evaluation is simplified to a few attributes; real IAM platforms combine many policies and inheritance rules.',
  },
  {
    id: 'incident-response', title: 'Incident Response Workflow', icon: 'siren', minutes: 15, objectives: ['4.8'],
    summary: 'Lead a ransomware incident through preparation to lessons learned, choosing actions in the right phase and preserving evidence.',
    model: 'Phases are shown sequentially; real incidents loop between analysis, containment and eradication.',
  },
  {
    id: 'risk-bia', title: 'Risk Calculations & Business Impact Analysis', icon: 'calculator', minutes: 15, objectives: ['5.2', '3.4'],
    summary: 'Calculate SLE, ARO and ALE, judge whether a control is worth its cost, and derive RTO/RPO/MTTR/MTBF from a BIA.',
    model: 'Quantitative analysis is only as good as its estimates; real assessments mix it with qualitative judgement.',
  },
  {
    id: 'vendor-compliance', title: 'Vendor Agreements & Compliance Decisions', icon: 'handshake', minutes: 10, objectives: ['5.3', '5.4', '5.5'],
    summary: 'Pick the right agreement (SLA, MOU, MOA, MSA, SOW, NDA, BPA) and compliance response for realistic business situations.',
    model: 'Legal definitions vary by jurisdiction and organisation; the lab follows the general meanings CompTIA tests.',
  },
];

export const LAB_BY_ID = Object.fromEntries(LABS.map((l) => [l.id, l]));
