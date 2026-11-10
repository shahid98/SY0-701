import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
type W = LazyExoticComponent<ComponentType<any>>;

/** Interactive widgets that lessons can embed with { kind: 'widget', widget: '<key>' }. */
export const WIDGETS: Record<string, W> = {
  'toy-cipher': lazy(() => import('./ToyCipher')),
  'aes-gcm': lazy(() => import('./AesDemo')),
  'rsa-toy': lazy(() => import('./RsaToy')),
  'hash-demo': lazy(() => import('./HashDemo')),
  'dh-exchange': lazy(() => import('./DiffieHellman')),
  'cert-chain': lazy(() => import('./CertChain')),
  'risk-calc': lazy(() => import('./RiskCalc')),
  availability: lazy(() => import('./AvailabilityCalc')),
  'recovery-timeline': lazy(() => import('./RecoveryTimeline')),
  'buffer-overflow': lazy(() => import('./BufferOverflow')),
  sqli: lazy(() => import('./SqliDemo')),
  xss: lazy(() => import('./XssDemo')),
  lab: lazy(() => import('./LabWidget')),
  'l4-l7': lazy(() => import('./L4L7Filter')),
  cvss: lazy(() => import('./CvssCalc')),
  ports: lazy(() => import('./PortTable')),
  'email-auth': lazy(() => import('./EmailAuth')),
  'password-strength': lazy(() => import('./PasswordStrength')),
};
