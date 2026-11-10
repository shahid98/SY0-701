import type { Domain, DomainId, Objective, ObjectiveId } from '@/types/content';

export const DOMAINS: Domain[] = [
  {
    id: 'd1',
    number: 1,
    title: 'General Security Concepts',
    weight: 12,
    summary: 'The vocabulary of security: control types, the CIA triad, AAA, Zero Trust, physical and deception controls, change management and cryptography.',
    color: 'cyan',
    icon: 'shield',
  },
  {
    id: 'd2',
    number: 2,
    title: 'Threats, Vulnerabilities, and Mitigations',
    weight: 22,
    summary: 'Who attacks, how they get in, which weaknesses they exploit, the indicators they leave behind and the mitigations that stop them.',
    color: 'rose',
    icon: 'bug',
  },
  {
    id: 'd3',
    number: 3,
    title: 'Security Architecture',
    weight: 18,
    summary: 'Cloud and on-premises models, secure network design, data protection strategies, and resilience and recovery.',
    color: 'violet',
    icon: 'network',
  },
  {
    id: 'd4',
    number: 4,
    title: 'Security Operations',
    weight: 28,
    summary: 'Day-to-day defence: hardening, asset and vulnerability management, monitoring, IAM, automation, incident response and investigations.',
    color: 'emerald',
    icon: 'radar',
  },
  {
    id: 'd5',
    number: 5,
    title: 'Security Program Management and Oversight',
    weight: 20,
    summary: 'Governance, risk management, third parties, compliance and privacy, audits and assessments, and security awareness.',
    color: 'amber',
    icon: 'landmark',
  },
];

export const OBJECTIVES: Objective[] = [
  // ---------- Domain 1 ----------
  {
    id: '1.1', domainId: 'd1', title: 'Security Controls',
    official: 'Compare and contrast various types of security controls.',
    summary: 'Classify controls two ways at once: by category (who/what implements it) and by type (what it does to a threat).',
    special: [{ title: 'CIA & control classification lab', description: 'Classify realistic controls by category, type and CIA property.', to: '/labs/cia-controls' }],
  },
  {
    id: '1.2', domainId: 'd1', title: 'Fundamental Security Concepts',
    official: 'Summarize fundamental security concepts.',
    summary: 'CIA, non-repudiation, AAA, gap analysis, Zero Trust planes, physical security, sensors and deception technology.',
    special: [{ title: 'Zero Trust decision lab', description: 'Build an access request and watch the policy engine, administrator and enforcement point decide.', to: '/labs/zero-trust' }],
  },
  {
    id: '1.3', domainId: 'd1', title: 'Change Management',
    official: 'Explain the importance of change management processes and the impact to security.',
    summary: 'How approvals, impact analysis, testing, backout plans, maintenance windows and documentation keep changes from becoming incidents.',
  },
  {
    id: '1.4', domainId: 'd1', title: 'Cryptographic Solutions',
    official: 'Explain the importance of using appropriate cryptographic solutions.',
    summary: 'Symmetric vs asymmetric encryption, key exchange, hashing, signatures, PKI and certificates, crypto hardware and obfuscation.',
    special: [
      { title: 'TLS certificate validation', description: 'Animated walk-through of how a browser validates a certificate chain.', to: '/learn/d1/1.4/tls-certificate-validation' },
      { title: 'AES vs RSA & trust chain lab', description: 'Encrypt for real with AES-GCM, step through toy RSA, and break a certificate chain.', to: '/labs/crypto' },
    ],
  },
  // ---------- Domain 2 ----------
  {
    id: '2.1', domainId: 'd2', title: 'Threat Actors & Motivations',
    official: 'Compare and contrast common threat actors and motivations.',
    summary: 'Nation-states, organized crime, hacktivists, insiders, unskilled attackers and shadow IT — their resources, sophistication and goals.',
  },
  {
    id: '2.2', domainId: 'd2', title: 'Threat Vectors & Attack Surfaces',
    official: 'Explain common threat vectors and attack surfaces.',
    summary: 'The paths attackers use: messages, files, voice, removable media, vulnerable software, insecure networks, supply chains and people.',
    special: [{ title: 'Phishing recognition lab', description: 'Inspect realistic messages and find the red flags.', to: '/labs/phishing' }],
  },
  {
    id: '2.3', domainId: 'd2', title: 'Types of Vulnerabilities',
    official: 'Explain various types of vulnerabilities.',
    summary: 'Memory flaws, race conditions, injection, hardware and virtualization weaknesses, supply chain, crypto, misconfiguration, mobile and zero-days.',
  },
  {
    id: '2.4', domainId: 'd2', title: 'Indicators of Malicious Activity',
    official: 'Given a scenario, analyze indicators of malicious activity.',
    summary: 'Recognise malware, physical, network, application, cryptographic and password attacks from the evidence they leave.',
    special: [{ title: 'DNS resolution & poisoning step-through', description: 'Follow a DNS lookup hop by hop, then see where poisoning redirects it.', to: '/learn/d2/2.4/dns-attacks' }],
  },
  {
    id: '2.5', domainId: 'd2', title: 'Enterprise Mitigation Techniques',
    official: 'Explain the purpose of mitigation techniques used to secure the enterprise.',
    summary: 'Segmentation, access control, allow lists, isolation, patching, encryption, monitoring, least privilege and hardening.',
    special: [{ title: 'Attack progression simulator', description: 'Switch controls on and watch which attack stages are prevented, detected or contained.', to: '/labs/attack-mitigation' }],
  },
  // ---------- Domain 3 ----------
  {
    id: '3.1', domainId: 'd3', title: 'Architecture Models',
    official: 'Compare and contrast security implications of different architecture models.',
    summary: 'Cloud responsibility, IaC, serverless, microservices, SDN, virtualization, containers, IoT/ICS/embedded and the trade-offs between them.',
    special: [{ title: 'Shared responsibility lab', description: 'Assign each layer to the customer or provider for IaaS, PaaS and SaaS.', to: '/labs/shared-responsibility' }],
  },
  {
    id: '3.2', domainId: 'd3', title: 'Securing Enterprise Infrastructure',
    official: 'Given a scenario, apply security principles to secure enterprise infrastructure.',
    summary: 'Zones, device placement, failure modes, appliances, 802.1X/EAP, firewall types, VPN/TLS/IPsec, SD-WAN and SASE.',
    special: [
      { title: 'Network architecture builder', description: 'Place devices into zones, choose what guards each boundary, and simulate traffic.', to: '/labs/network-builder' },
      { title: '802.1X authentication lab', description: 'Watch supplicant, authenticator and RADIUS server decide port access.', to: '/labs/dot1x' },
    ],
  },
  {
    id: '3.3', domainId: 'd3', title: 'Data Protection',
    official: 'Compare and contrast concepts and strategies to protect data.',
    summary: 'Data types and classifications, states (rest/transit/use), sovereignty, and the methods that protect each.',
    special: [{ title: 'Data states lab', description: 'Match data scenarios to their state and the right protection.', to: '/labs/data-states' }],
  },
  {
    id: '3.4', domainId: 'd3', title: 'Resilience & Recovery',
    official: 'Explain the importance of resilience and recovery in security architecture.',
    summary: 'High availability, recovery sites, diversity, capacity planning, testing, backups and power.',
    special: [
      { title: 'Backup & disaster recovery lab', description: 'Plan backup sets, restore after failure and pick a recovery site.', to: '/labs/backup-dr' },
      { title: 'Supplementary: BIA metrics (RTO, RPO, MTTR, MTBF)', description: 'Bridge lesson linking resilience design to the recovery targets set in objective 5.2.', to: '/learn/d3/3.4/recovery-metrics-bridge' },
      { title: 'Business impact analysis (objective 5.2)', description: 'The full BIA lesson with recovery calculations.', to: '/learn/d5/5.2/business-impact-analysis' },
    ],
  },
  // ---------- Domain 4 ----------
  {
    id: '4.1', domainId: 'd4', title: 'Hardening Computing Resources',
    official: 'Given a scenario, apply common security techniques to computing resources.',
    summary: 'Secure baselines, hardening targets, wireless installation and security, mobile deployment models and application security.',
  },
  {
    id: '4.2', domainId: 'd4', title: 'Asset Management',
    official: 'Explain the security implications of proper hardware, software, and data asset management.',
    summary: 'Procurement, ownership and classification, inventory and enumeration, sanitization, destruction, certification and retention.',
  },
  {
    id: '4.3', domainId: 'd4', title: 'Vulnerability Management',
    official: 'Explain various activities associated with vulnerability management.',
    summary: 'Finding vulnerabilities, confirming and prioritising them (CVE/CVSS), remediating, validating and reporting.',
  },
  {
    id: '4.4', domainId: 'd4', title: 'Alerting & Monitoring',
    official: 'Explain security alerting and monitoring concepts and tools.',
    summary: 'Log aggregation, alerting and tuning, SIEM, SCAP and benchmarks, agents, AV, DLP, SNMP traps, NetFlow and scanners.',
  },
  {
    id: '4.5', domainId: 'd4', title: 'Enhancing Enterprise Capabilities',
    official: 'Given a scenario, modify enterprise capabilities to enhance security.',
    summary: 'Firewall rules, IDS/IPS signatures, web and DNS filtering, Group Policy/SELinux, secure protocols, email authentication, FIM, NAC, EDR/XDR and UBA.',
    special: [{ title: 'Firewall & ACL rule lab', description: 'Write ordered rules and test packets against them.', to: '/labs/firewall-acl' }],
  },
  {
    id: '4.6', domainId: 'd4', title: 'Identity & Access Management',
    official: 'Given a scenario, implement and maintain identity and access management.',
    summary: 'Account lifecycle, federation and SSO, access control models, MFA, passwords and passwordless, and privileged access management.',
    special: [
      { title: 'IAM permissions & MFA lab', description: 'Evaluate access requests under different models and test MFA combinations.', to: '/labs/iam-mfa' },
      { title: 'SAML single sign-on flow', description: 'Step through an identity provider issuing a signed assertion to a service provider.', to: '/learn/d4/4.6/federation-sso' },
    ],
  },
  {
    id: '4.7', domainId: 'd4', title: 'Automation & Orchestration',
    official: 'Explain the importance of automation and orchestration related to secure operations.',
    summary: 'Use cases, benefits and risks of automating security operations.',
  },
  {
    id: '4.8', domainId: 'd4', title: 'Incident Response',
    official: 'Explain appropriate incident response activities.',
    summary: 'The incident response process, training and testing, root cause analysis, threat hunting and digital forensics.',
    special: [{ title: 'Incident response workflow lab', description: 'Run an incident from detection to lessons learned.', to: '/labs/incident-response' }],
  },
  {
    id: '4.9', domainId: 'd4', title: 'Investigation Data Sources',
    official: 'Given a scenario, use data sources to support an investigation.',
    summary: 'Which logs and data sources answer which investigation questions.',
    special: [{ title: 'SOC & SIEM investigation', description: 'Work a simulated SOC queue: triage alerts, pivot through logs and build the case.', to: '/labs/soc-siem' }],
  },
  // ---------- Domain 5 ----------
  {
    id: '5.1', domainId: 'd5', title: 'Security Governance',
    official: 'Summarize elements of effective security governance.',
    summary: 'Policies, standards, procedures and guidelines; external considerations; governance structures; data roles.',
  },
  {
    id: '5.2', domainId: 'd5', title: 'Risk Management',
    official: 'Explain elements of the risk management process.',
    summary: 'Identify, assess, analyse (SLE/ARO/ALE), register, treat and report risk; business impact analysis.',
    special: [
      { title: 'Risk & BIA simulator', description: 'Calculate SLE/ALE, compare controls, and set RTO/RPO from a BIA.', to: '/labs/risk-bia' },
      { title: 'Quantitative risk calculator', description: 'Change asset value, exposure factor and ARO and watch SLE and ALE update.', to: '/learn/d5/5.2/risk-analysis' },
    ],
  },
  {
    id: '5.3', domainId: 'd5', title: 'Third-Party Risk',
    official: 'Explain the processes associated with third-party risk assessment and management.',
    summary: 'Vendor assessment and selection, agreement types, monitoring, questionnaires and rules of engagement.',
    special: [{ title: 'Vendor agreements & compliance lab', description: 'Choose the right agreement and compliance response for each situation.', to: '/labs/vendor-compliance' }],
  },
  {
    id: '5.4', domainId: 'd5', title: 'Compliance & Privacy',
    official: 'Summarize elements of effective security compliance.',
    summary: 'Compliance reporting and monitoring, consequences of non-compliance, and privacy obligations.',
  },
  {
    id: '5.5', domainId: 'd5', title: 'Audits & Assessments',
    official: 'Explain types and purposes of audits and assessments.',
    summary: 'Attestation, internal and external audits, and penetration testing approaches.',
  },
  {
    id: '5.6', domainId: 'd5', title: 'Security Awareness',
    official: 'Given a scenario, implement security awareness practices.',
    summary: 'Phishing campaigns, anomalous behaviour, user training topics and running an awareness programme.',
    special: [{ title: 'Phishing identification exercises', description: 'Spot the red flags in realistic messages.', to: '/labs/phishing' }],
  },
];

export const DOMAIN_BY_ID = Object.fromEntries(DOMAINS.map((d) => [d.id, d])) as Record<DomainId, Domain>;
export const OBJECTIVE_BY_ID = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o])) as Record<ObjectiveId, Objective>;

export function objectivesOf(domainId: DomainId): Objective[] {
  return OBJECTIVES.filter((o) => o.domainId === domainId);
}

export function domainOfObjective(objectiveId: string): DomainId {
  return `d${objectiveId.charAt(0)}` as DomainId;
}

/** Tailwind class sets per domain colour (written out in full so Tailwind can see them). */
export const DOMAIN_STYLE: Record<
  Domain['color'],
  { text: string; bg: string; soft: string; border: string; grad: string; dot: string; ring: string; hex: string }
> = {
  cyan: {
    text: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-500',
    soft: 'bg-cyan-500/10 dark:bg-cyan-400/10',
    border: 'border-cyan-500/30',
    grad: 'from-cyan-500 to-sky-500',
    dot: 'bg-cyan-500',
    ring: 'ring-cyan-500/40',
    hex: '#06b6d4',
  },
  rose: {
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500',
    soft: 'bg-rose-500/10 dark:bg-rose-400/10',
    border: 'border-rose-500/30',
    grad: 'from-rose-500 to-orange-500',
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/40',
    hex: '#f43f5e',
  },
  violet: {
    text: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500',
    soft: 'bg-violet-500/10 dark:bg-violet-400/10',
    border: 'border-violet-500/30',
    grad: 'from-violet-500 to-indigo-500',
    dot: 'bg-violet-500',
    ring: 'ring-violet-500/40',
    hex: '#8b5cf6',
  },
  emerald: {
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500',
    soft: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    border: 'border-emerald-500/30',
    grad: 'from-emerald-500 to-teal-500',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/40',
    hex: '#10b981',
  },
  amber: {
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500',
    soft: 'bg-amber-500/10 dark:bg-amber-400/10',
    border: 'border-amber-500/30',
    grad: 'from-amber-500 to-orange-500',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/40',
    hex: '#f59e0b',
  },
};

export function domainStyle(domainId: DomainId) {
  return DOMAIN_STYLE[DOMAIN_BY_ID[domainId].color];
}
