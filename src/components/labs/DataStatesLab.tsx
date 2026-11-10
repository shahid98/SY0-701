import type { LabProps } from '@/components/labs/registry';
import { Callout } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, type ClassifyItem } from './kit';

const STATES = ['Data at rest', 'Data in transit', 'Data in use'];
const PROTECT = [
  'Full-disk / volume encryption (e.g. BitLocker with TPM)',
  'TLS / IPsec tunnel',
  'Secure enclave / trusted execution environment',
  'Database or record-level encryption / tokenization',
  'Data masking in the user interface',
  'Encrypted, offsite backup media',
];

const ITEMS: ClassifyItem[] = [
  { prompt: 'A sales laptop containing a customer list is left in a taxi.', fields: [{ label: 'State', options: STATES, answer: 0 }, { label: 'Best protection', options: PROTECT, answer: 0 }], explain: 'Stored data on a device = at rest. Full-disk encryption keeps it unreadable without the key.' },
  { prompt: 'A browser submits a payment form to an online store.', fields: [{ label: 'State', options: STATES, answer: 1 }, { label: 'Best protection', options: PROTECT, answer: 1 }], explain: 'Moving across a network = in transit. TLS encrypts the session.' },
  { prompt: 'A server decrypts patient records into RAM to run an analytics model.', fields: [{ label: 'State', options: STATES, answer: 2 }, { label: 'Best protection', options: PROTECT, answer: 2 }], explain: 'Being processed in memory/CPU = in use. Secure enclaves (confidential computing) protect data while it is processed.' },
  { prompt: 'Card numbers are stored in an e-commerce database.', fields: [{ label: 'State', options: STATES, answer: 0 }, { label: 'Best protection', options: PROTECT, answer: 3 }], explain: 'At rest in a database. Tokenization or column/record-level encryption protects individual sensitive fields even from DB admins.' },
  { prompt: 'Branch office traffic travels to headquarters across the Internet.', fields: [{ label: 'State', options: STATES, answer: 1 }, { label: 'Best protection', options: PROTECT, answer: 1 }], explain: 'In transit between sites — a site-to-site IPsec VPN tunnel protects it.' },
  { prompt: 'Call-center agents need to confirm a customer’s identity but should see only the last 4 digits of the SSN.', fields: [{ label: 'State', options: STATES, answer: 2 }, { label: 'Best protection', options: PROTECT, answer: 4 }], explain: 'The data is being displayed/used. Masking hides most of it while keeping it usable.' },
  { prompt: 'Nightly backup tapes are shipped to an offsite vault.', fields: [{ label: 'State', options: STATES, answer: 0 }, { label: 'Best protection', options: PROTECT, answer: 5 }], explain: 'Stored media = at rest (even while being driven to the vault, the data is not traversing a network). Encrypt backups.' },
  { prompt: 'An email with an attachment travels between two mail servers.', fields: [{ label: 'State', options: STATES, answer: 1 }, { label: 'Best protection', options: PROTECT, answer: 1 }], explain: 'In transit between servers — TLS between mail transfer agents (STARTTLS/MTA-STS).' },
  { prompt: 'A cryptographic key is loaded into memory to sign transactions.', fields: [{ label: 'State', options: STATES, answer: 2 }, { label: 'Best protection', options: PROTECT, answer: 2 }], explain: 'In use. Hardware isolation (secure enclave, HSM, TPM) keeps the key from ever being exposed in normal memory.' },
];

export default function DataStatesLab({ onComplete }: LabProps) {
  return (
    <div className="space-y-5">
      <Callout kind="tip" title="Three states, three questions">Is it <strong>stored</strong> (at rest)? Is it <strong>moving across a network</strong> (in transit)? Is it <strong>being processed</strong> in memory or on screen (in use)?</Callout>
      <LabStep n={1} title="Identify the state and the protection" sub="For each scenario choose the data state and the protection that fits BEST.">
        <ClassifyTable items={ITEMS} onScored={(c, t) => onComplete(Math.round((c / t) * 100))} />
      </LabStep>
    </div>
  );
}
