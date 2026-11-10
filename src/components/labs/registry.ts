import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface LabProps {
  /** Call when the learner finishes the lab's task; score 0-100. */
  onComplete: (score: number) => void;
}

export const LAB_COMPONENTS: Record<string, LazyExoticComponent<ComponentType<LabProps>>> = {
  'cia-controls': lazy(() => import('@/components/labs/CiaControlsLab')),
  'zero-trust': lazy(() => import('@/components/labs/ZeroTrustLab')),
  crypto: lazy(() => import('@/components/labs/CryptoLab')),
  phishing: lazy(() => import('@/components/labs/PhishingLab')),
  'attack-mitigation': lazy(() => import('@/components/labs/AttackSimLab')),
  'network-builder': lazy(() => import('@/components/labs/NetworkBuilderLab')),
  dot1x: lazy(() => import('@/components/labs/Dot1xLab')),
  'shared-responsibility': lazy(() => import('@/components/labs/SharedResponsibilityLab')),
  'data-states': lazy(() => import('@/components/labs/DataStatesLab')),
  'backup-dr': lazy(() => import('@/components/labs/BackupDrLab')),
  'firewall-acl': lazy(() => import('@/components/labs/FirewallLab')),
  'soc-siem': lazy(() => import('@/components/labs/SocLab')),
  'iam-mfa': lazy(() => import('@/components/labs/IamLab')),
  'incident-response': lazy(() => import('@/components/labs/IrLab')),
  'risk-bia': lazy(() => import('@/components/labs/RiskLab')),
  'vendor-compliance': lazy(() => import('@/components/labs/VendorLab')),
};

