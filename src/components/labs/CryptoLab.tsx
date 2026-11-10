import { Suspense, useState } from 'react';
import type { LabProps } from '@/components/labs/registry';
import { WIDGETS } from '@/components/viz/widgets';
import { Callout, Tab, TabList, TabPanel, Tabs } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, type ClassifyItem } from './kit';

const TOOLS = ['Symmetric encryption (AES)', 'Asymmetric encryption (RSA / ECC)', 'Digital signature', 'Hashing (SHA-256)', 'Salted, stretched password hash', 'Key exchange (ECDHE)'];

const QUIZ: ClassifyItem[] = [
  { prompt: 'Encrypt a 4 GB nightly backup file as fast as possible.', fields: [{ label: 'Best tool', options: TOOLS, answer: 0 }], explain: 'Bulk data → symmetric. AES is fast and hardware-accelerated; asymmetric algorithms are far too slow for large data.' },
  { prompt: 'Two systems that have never met must agree on a session key over the Internet.', fields: [{ label: 'Best tool', options: TOOLS, answer: [5, 1] }], explain: 'Key exchange (ephemeral Diffie-Hellman, as TLS 1.3 does) — or, in older designs, encrypting the key with the recipient’s RSA public key.' },
  { prompt: 'Prove that a software update really came from the vendor and was not modified.', fields: [{ label: 'Best tool', options: TOOLS, answer: 2 }], explain: 'A digital signature (hash signed with the vendor’s private key, verified with its public key) gives integrity, authenticity and non-repudiation.' },
  { prompt: 'Store user passwords in a database.', fields: [{ label: 'Best tool', options: TOOLS, answer: 4 }], explain: 'Never encrypt passwords reversibly. Store a salted hash computed with a slow key-stretching function (PBKDF2, bcrypt, scrypt, Argon2).' },
  { prompt: 'Check that a downloaded ISO matches the publisher’s file.', fields: [{ label: 'Best tool', options: TOOLS, answer: [3, 2] }], explain: 'Compare a hash (checksum). If the publisher signed the hash, the signature also proves who published it.' },
  { prompt: 'Send a confidential message that only the recipient can read, without a pre-shared secret.', fields: [{ label: 'Best tool', options: TOOLS, answer: [1, 5] }], explain: 'Encrypt for the recipient’s public key (in practice: hybrid encryption — asymmetric wraps a random symmetric key).' },
];

function W({ id }: { id: string }) {
  const C = WIDGETS[id];
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}><C /></Suspense>;
}

export default function CryptoLab({ onComplete }: LabProps) {
  const [tab, setTab] = useState('sym');
  return (
    <div className="space-y-5">
      <Tabs value={tab} onChange={setTab}>
        <TabList label="Crypto lab sections" className="mb-4">
          <Tab value="sym">1 · Symmetric</Tab>
          <Tab value="asym">2 · Asymmetric</Tab>
          <Tab value="hash">3 · Hashing</Tab>
          <Tab value="chain">4 · Trust chain</Tab>
          <Tab value="check">5 · Choose the tool</Tab>
        </TabList>
        <TabPanel value="sym" className="space-y-4">
          <Callout kind="tip" title="Symmetric = one shared key">Fast, used for bulk data (disks, files, TLS session traffic). The hard part is getting the same key to both sides safely.</Callout>
          <W id="toy-cipher" />
          <W id="aes-gcm" />
        </TabPanel>
        <TabPanel value="asym" className="space-y-4">
          <Callout kind="tip" title="Asymmetric = a key pair">The public key encrypts or verifies; the private key decrypts or signs. Slower, so it protects keys and signatures rather than bulk data.</Callout>
          <W id="rsa-toy" />
          <W id="dh-exchange" />
        </TabPanel>
        <TabPanel value="hash" className="space-y-4">
          <W id="hash-demo" />
        </TabPanel>
        <TabPanel value="chain" className="space-y-4">
          <Callout kind="tip" title="Why trust a public key?">A certificate binds a public key to a name, signed by a CA. Your device trusts a small set of root CAs; everything else must chain up to one of them.</Callout>
          <W id="cert-chain" />
        </TabPanel>
        <TabPanel value="check">
          <LabStep n={5} title="AES vs RSA vs hashing: pick the right tool" sub="Choose the cryptographic solution that BEST fits each requirement.">
            <ClassifyTable items={QUIZ} onScored={(c, t) => onComplete(Math.round((c / t) * 100))} />
          </LabStep>
        </TabPanel>
      </Tabs>
    </div>
  );
}
