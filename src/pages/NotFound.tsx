import { Compass } from 'lucide-react';
import { ButtonLink, EmptyState } from '@/components/ui/primitives';

export default function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <EmptyState
      icon={<Compass className="h-8 w-8" />}
      title={`That ${what} doesn’t exist`}
      as="h1"
      action={<ButtonLink to="/learn" variant="primary">Open the learning path</ButtonLink>}
    >
      The link may be outdated. Use search (Ctrl/⌘ K) or the learning path to find what you need.
    </EmptyState>
  );
}
