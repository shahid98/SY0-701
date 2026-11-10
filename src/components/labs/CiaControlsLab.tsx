import { useState } from 'react';
import type { LabProps } from '@/components/labs/registry';
import { ClassifyTable, LabStep, type ClassifyItem } from './kit';

const CIA = ['Confidentiality', 'Integrity', 'Availability'];
const CATS = ['Technical', 'Managerial', 'Operational', 'Physical'];
const TYPES = ['Preventive', 'Deterrent', 'Detective', 'Corrective', 'Compensating', 'Directive'];

const INCIDENTS: ClassifyItem[] = [
  { prompt: 'A stolen, unencrypted laptop exposes a customer spreadsheet.', fields: [{ label: 'Property violated', options: CIA, answer: 0 }], explain: 'Unauthorized **disclosure** breaks confidentiality. Full-disk encryption would have prevented it.' },
  { prompt: 'An attacker changes the bank account number on a supplier invoice in the finance system.', fields: [{ label: 'Property violated', options: CIA, answer: 1 }], explain: 'Unauthorized **modification** of data breaks integrity. Hashing, digital signatures and change logging help detect it.' },
  { prompt: 'A DDoS attack makes the online store unreachable for six hours.', fields: [{ label: 'Property violated', options: CIA, answer: 2 }], explain: 'Authorized users cannot reach the service — availability. Mitigations include DDoS scrubbing, CDNs and redundancy.' },
  { prompt: 'Ransomware encrypts the file server and the company cannot open its documents.', fields: [{ label: 'Primary property violated', options: CIA, answer: 2 }], explain: 'The data still exists but legitimate users cannot use it — availability (modern “double extortion” adds a confidentiality breach if data is also stolen).' },
  { prompt: 'Someone watches over a nurse’s shoulder and writes down her password.', fields: [{ label: 'Property violated', options: CIA, answer: 0 }], explain: 'Shoulder surfing discloses a secret — confidentiality.' },
  { prompt: 'A web page is defaced with political slogans.', fields: [{ label: 'Property violated', options: CIA, answer: 1 }], explain: 'Content was altered without authorization — integrity. (If the site is taken offline, availability too.)' },
  { prompt: 'A data center loses power and the generator fails to start.', fields: [{ label: 'Property violated', options: CIA, answer: 2 }], explain: 'Systems are down — availability. UPS, generator testing and redundant feeds protect it.' },
  { prompt: 'An on-path attacker reads unencrypted HTTP session cookies on public Wi-Fi.', fields: [{ label: 'Property violated', options: CIA, answer: 0 }], explain: 'Eavesdropping discloses data in transit — confidentiality. TLS protects it.' },
];

const CONTROLS: ClassifyItem[] = [
  { prompt: 'An IPS drops packets matching an exploit signature.', fields: [{ label: 'Category', options: CATS, answer: 0 }, { label: 'Type', options: TYPES, answer: 0 }], explain: 'Implemented by technology (technical) and blocks the attack (preventive). An IPS also detects, but blocking is its distinguishing job.' },
  { prompt: 'Signs at the perimeter fence read “Private property — trespassers prosecuted.”', fields: [{ label: 'Category', options: CATS, answer: 3 }, { label: 'Type', options: TYPES, answer: [1, 5] }], explain: 'A physical sign that discourages entry (deterrent). Because it also states a rule, “directive” is accepted.' },
  { prompt: 'The CISO approves an information security policy.', fields: [{ label: 'Category', options: CATS, answer: 1 }, { label: 'Type', options: TYPES, answer: 5 }], explain: 'A management document (managerial) that tells people what to do (directive).' },
  { prompt: 'The SOC reviews authentication logs every morning for anomalies.', fields: [{ label: 'Category', options: CATS, answer: 2 }, { label: 'Type', options: TYPES, answer: 2 }], explain: 'People performing a routine (operational) that identifies events after they occur (detective).' },
  { prompt: 'Administrators restore a corrupted database from last night’s backup.', fields: [{ label: 'Category', options: CATS, answer: [0, 2] }, { label: 'Type', options: TYPES, answer: 3 }], explain: 'Restoring returns the system to normal (corrective). It is a technical capability carried out by staff, so technical or operational is accepted.' },
  { prompt: 'A legacy point-of-sale terminal can’t be upgraded, so it is placed on an isolated VLAN with strict ACLs.', fields: [{ label: 'Category', options: CATS, answer: 0 }, { label: 'Type', options: TYPES, answer: 4 }], explain: 'A technical arrangement standing in for the preferred control (patching/upgrade) — compensating.' },
  { prompt: 'Concrete bollards stop vehicles from reaching the lobby glass.', fields: [{ label: 'Category', options: CATS, answer: 3 }, { label: 'Type', options: TYPES, answer: 0 }], explain: 'A tangible barrier (physical) that blocks the threat (preventive).' },
  { prompt: 'All staff complete annual security awareness training.', fields: [{ label: 'Category', options: CATS, answer: 2 }, { label: 'Type', options: TYPES, answer: [0, 5] }], explain: 'Delivered by people (operational). Training aims to prevent incidents by changing behaviour; directive is also accepted because it instructs staff.' },
];

export default function CiaControlsLab({ onComplete }: LabProps) {
  const [a, setA] = useState<[number, number] | null>(null);
  const [b, setB] = useState<[number, number] | null>(null);
  const finish = (x: [number, number] | null, y: [number, number] | null) => {
    if (x && y) onComplete(Math.round(((x[0] + y[0]) / (x[1] + y[1])) * 100));
  };
  return (
    <div className="space-y-5">
      <LabStep n={1} title="Which part of the CIA triad was violated?" sub="Confidentiality = no unauthorized disclosure · Integrity = no unauthorized change · Availability = usable when needed." done={!!a}>
        <ClassifyTable items={INCIDENTS} onScored={(c, t) => { setA([c, t]); finish([c, t], b); }} />
      </LabStep>
      <LabStep n={2} title="Classify each control by category and type" sub="Category = how it is implemented. Type = what it does to the threat. Some rows accept more than one valid type." done={!!b}>
        <ClassifyTable items={CONTROLS} onScored={(c, t) => { setB([c, t]); finish(a, [c, t]); }} />
      </LabStep>
    </div>
  );
}
