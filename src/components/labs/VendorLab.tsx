import { useState } from 'react';
import type { LabProps } from '@/components/labs/registry';
import { Callout } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, type ClassifyItem } from './kit';

const AGREEMENTS = ['SLA', 'MOU', 'MOA', 'MSA', 'SOW / work order', 'NDA', 'BPA'];
const AGR: ClassifyItem[] = [
  { prompt: 'The hosting provider guarantees 99.95% uptime and a 1-hour response to severity-1 tickets, with service credits if missed.', fields: [{ label: 'Agreement', options: AGREEMENTS, answer: 0 }], explain: 'Service-level agreement: measurable service levels and remedies.' },
  { prompt: 'Two universities agree in broad, non-binding terms to explore a shared research network.', fields: [{ label: 'Agreement', options: AGREEMENTS, answer: 1 }], explain: 'Memorandum of understanding: a statement of intent, usually not legally binding.' },
  { prompt: 'Two agencies formally agree who will provide which staff and funding for a joint project, with defined responsibilities.', fields: [{ label: 'Agreement', options: AGREEMENTS, answer: 2 }], explain: 'Memorandum of agreement: more formal than an MOU, defining specific responsibilities (often conditionally binding).' },
  { prompt: 'A long-term contract with a consultancy sets payment terms, liability, IP ownership and confidentiality for all future projects.', fields: [{ label: 'Agreement', options: AGREEMENTS, answer: 3 }], explain: 'Master service agreement: the umbrella terms; individual projects are added as SOWs.' },
  { prompt: 'Under that contract, a document defines a penetration test: scope, deliverables, timeline and price.', fields: [{ label: 'Agreement', options: AGREEMENTS, answer: 4 }], explain: 'Statement of work / work order: the specific project under an MSA.' },
  { prompt: 'Before sharing source code with a potential acquirer, both parties promise to keep it secret.', fields: [{ label: 'Agreement', options: AGREEMENTS, answer: 5 }], explain: 'Non-disclosure agreement protects confidential information.' },
  { prompt: 'Two companies form a partnership to co-sell a product and define profit sharing and each partner’s duties.', fields: [{ label: 'Agreement', options: AGREEMENTS, answer: 6 }], explain: 'Business partners agreement governs a partnership’s responsibilities and profits.' },
];

const COMP: ClassifyItem[] = [
  { prompt: 'Before signing, the company reviews the vendor’s SOC 2 report, financials and breach history.', fields: [{ label: 'Concept', options: ['Due diligence', 'Due care'], answer: 0 }], explain: 'Due diligence = investigating before you commit (assessing risk).' },
  { prompt: 'After signing, the company keeps monitoring the vendor and patches its own integration promptly.', fields: [{ label: 'Concept', options: ['Due diligence', 'Due care'], answer: 1 }], explain: 'Due care = acting responsibly on an ongoing basis (doing what a reasonable organisation would).' },
  { prompt: 'A retailer decides what customer data to collect and why; a cloud CRM stores it on the retailer’s instructions.', fields: [{ label: 'The cloud CRM is the…', options: ['Data controller', 'Data processor', 'Data subject'], answer: 1 }], explain: 'The processor handles personal data on behalf of the controller, which determines the purposes.' },
  { prompt: 'The contract lets the customer inspect the vendor’s security controls or commission an audit.', fields: [{ label: 'Clause', options: ['Right-to-audit clause', 'Rules of engagement', 'Non-compete'], answer: 0 }], explain: 'A right-to-audit clause grants verification rights.' },
  { prompt: 'A pen-test firm and the client agree on in-scope IPs, testing hours, allowed techniques and emergency contacts.', fields: [{ label: 'Document', options: ['Rules of engagement', 'SLA', 'NDA'], answer: 0 }], explain: 'Rules of engagement define how a test may be conducted.' },
  { prompt: 'Employees annually sign that they have read and will follow the security policy.', fields: [{ label: 'Concept', options: ['Attestation / acknowledgement', 'Exemption', 'Due diligence'], answer: 0 }], explain: 'Attestation and acknowledgement document awareness and acceptance for compliance.' },
  { prompt: 'A regulator finds a company stored health data without required safeguards. Which consequence is MOST directly regulatory?', fields: [{ label: 'Consequence', options: ['Fines and sanctions', 'Reputational damage', 'Lost revenue'], answer: 0 }], explain: 'Fines and sanctions are imposed by regulators; reputational and financial losses follow indirectly.' },
];

export default function VendorLab({ onComplete }: LabProps) {
  const [s, setS] = useState<{ a?: [number, number]; b?: [number, number] }>({});
  const done = (k: 'a' | 'b', v: [number, number]) => {
    const n = { ...s, [k]: v };
    setS(n);
    if (n.a && n.b) onComplete(Math.round(((n.a[0] + n.b[0]) / (n.a[1] + n.b[1])) * 100));
  };
  return (
    <div className="space-y-5">
      <Callout kind="tip" title="Memory map">MOU = intent · MOA = who does what · MSA = umbrella terms · SOW = this project · SLA = measurable service level · NDA = keep it secret · BPA = partnership.</Callout>
      <LabStep n={1} title="Which agreement fits?" done={!!s.a}>
        <ClassifyTable items={AGR} onScored={(c, t) => done('a', [c, t])} />
      </LabStep>
      <LabStep n={2} title="Compliance and third-party decisions" done={!!s.b}>
        <ClassifyTable items={COMP} onScored={(c, t) => done('b', [c, t])} />
      </LabStep>
    </div>
  );
}
