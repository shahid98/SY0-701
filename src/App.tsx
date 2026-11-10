import { lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const LearningPath = lazy(() => import('@/pages/LearningPath'));
const DomainPage = lazy(() => import('@/pages/DomainPage'));
const ObjectivePage = lazy(() => import('@/pages/ObjectivePage'));
const ConceptPage = lazy(() => import('@/pages/ConceptPage'));
const LabsIndex = lazy(() => import('@/pages/LabsIndex'));
const LabPage = lazy(() => import('@/pages/LabPage'));
const Flashcards = lazy(() => import('@/pages/Flashcards'));
const Vocabulary = lazy(() => import('@/pages/Vocabulary'));
const Practice = lazy(() => import('@/pages/Practice'));
const PbqIndex = lazy(() => import('@/pages/PbqIndex'));
const PbqPage = lazy(() => import('@/pages/PbqPage'));
const MockExam = lazy(() => import('@/pages/MockExam'));
const Revision = lazy(() => import('@/pages/Revision'));
const ProgressPage = lazy(() => import('@/pages/ProgressPage'));
const Coverage = lazy(() => import('@/pages/Coverage'));
const Compare = lazy(() => import('@/pages/Compare'));
const Scenarios = lazy(() => import('@/pages/Scenarios'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="learn" element={<LearningPath />} />
          <Route path="learn/:domainId" element={<DomainPage />} />
          <Route path="learn/:domainId/:objectiveId" element={<ObjectivePage />} />
          <Route path="learn/:domainId/:objectiveId/:conceptId" element={<ConceptPage />} />
          <Route path="labs" element={<LabsIndex />} />
          <Route path="labs/:labId" element={<LabPage />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="vocabulary" element={<Vocabulary />} />
          <Route path="practice" element={<Practice />} />
          <Route path="pbq" element={<PbqIndex />} />
          <Route path="pbq/:pbqId" element={<PbqPage />} />
          <Route path="mock-exam" element={<MockExam />} />
          <Route path="revision" element={<Revision />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="coverage" element={<Coverage />} />
          <Route path="compare" element={<Compare />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
