import { useRef, useState } from 'react';
import { Download, Monitor, Moon, RotateCcw, Sun, Upload } from 'lucide-react';
import { exportProgress, parseImport, useProgress, type ProgressData } from '@/store/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Callout, Card, Dialog, Segmented, Switch } from '@/components/ui/primitives';
import { dayKey, downloadText } from '@/lib/utils';

export default function Settings() {
  const settings = useProgress((s) => s.settings);
  const setSetting = useProgress((s) => s.setSetting);
  const importData = useProgress((s) => s.importData);
  const resetAll = useProgress((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: ProgressData; summary: string } | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    const r = parseImport(text);
    if (!r.ok) setMessage({ kind: 'bad', text: r.error });
    else setPending({ data: r.data, summary: r.summary });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-3xl">
      <PageHeader crumbs={[{ label: 'Settings & Data' }]} title="Settings & Data" subtitle="Preferences and your learning data. Everything is stored locally in this browser — no account, no server." />

      <Card className="mb-5 space-y-5 p-5">
        <h2 className="font-semibold text-fg">Appearance & learning</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="text-sm font-medium text-fg">Theme</div><div className="text-xs text-muted">System follows your OS setting.</div></div>
          <Segmented label="Theme" value={settings.theme} onChange={(v) => setSetting('theme', v)} options={[
            { value: 'system', label: <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" />System</span> },
            { value: 'light', label: <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" />Light</span> },
            { value: 'dark', label: <span className="flex items-center gap-1"><Moon className="h-3.5 w-3.5" />Dark</span> },
          ]} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="text-sm font-medium text-fg">Default explanation mode</div><div className="text-xs text-muted">Toggle any time with the M key.</div></div>
          <Segmented label="Explanation mode" value={settings.mode} onChange={(v) => setSetting('mode', v)} options={[{ value: 'beginner', label: 'Beginner' }, { value: 'exam', label: 'Exam' }]} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="text-sm font-medium text-fg">Motion</div><div className="text-xs text-muted">“Reduce” turns animations into static step lists.</div></div>
          <Segmented label="Motion" value={settings.motion} onChange={(v) => setSetting('motion', v)} options={[{ value: 'system', label: 'System' }, { value: 'reduce', label: 'Reduce' }, { value: 'full', label: 'Full' }]} />
        </div>
        <Switch checked={settings.guided} onChange={(v) => setSetting('guided', v)} label="Guided lessons" description="Reveal lesson sections one at a time with a Continue button." />
        <Switch checked={settings.reading} onChange={(v) => setSetting('reading', v)} label="Distraction-free reading mode" description="Hides navigation; toggle with F." />
        <label className="flex flex-wrap items-center gap-3 text-sm">
          <span className="w-48 font-medium text-fg">Daily goal</span>
          <input type="range" min={20} max={300} step={10} value={settings.dailyGoal} onChange={(e) => setSetting('dailyGoal', Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label="Daily XP goal" />
          <span className="w-20 text-right font-semibold tabular-nums text-fg">{settings.dailyGoal} XP</span>
        </label>
        <label className="flex flex-wrap items-center gap-3 text-sm">
          <span className="w-48 font-medium text-fg">New flashcards per session</span>
          <input type="range" min={5} max={60} step={5} value={settings.newCardsPerDay} onChange={(e) => setSetting('newCardsPerDay', Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label="New cards per session" />
          <span className="w-20 text-right font-semibold tabular-nums text-fg">{settings.newCardsPerDay}</span>
        </label>
        <p className="text-xs text-muted">XP: correct answer 10 · attempt 2 · flashcard review 2 · finished lesson 15 · lab 30 · PBQ up to 25.</p>
      </Card>

      <Card className="mb-5 space-y-4 p-5">
        <h2 className="font-semibold text-fg">Your learning data</h2>
        <p className="text-sm text-fg-2">Export a JSON backup to move progress to another browser or device, or keep it safe before clearing browser data.</p>
        {message && <Callout kind={message.kind === 'ok' ? 'ok' : 'bad'}>{message.text}</Callout>}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => { downloadText(`sy0-701-progress-${dayKey()}.json`, exportProgress()); setMessage({ kind: 'ok', text: 'Progress exported.' }); }}>
            <Download className="h-4 w-4" /> Export progress (JSON)
          </Button>
          <Button onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import progress…</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Choose progress file" />
          <Button variant="ghost" className="text-bad" onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" /> Reset all progress</Button>
        </div>
      </Card>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Import progress"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => setPending(null)}>Cancel</Button>
            <Button onClick={() => { importData(pending!.data, 'merge'); setPending(null); setMessage({ kind: 'ok', text: 'Imported and merged (newest record wins).' }); }}>Merge with current</Button>
            <Button variant="primary" onClick={() => { importData(pending!.data, 'replace'); setPending(null); setMessage({ kind: 'ok', text: 'Imported — current progress replaced.' }); }}>Replace current</Button>
          </div>
        }
      >
        <p className="text-sm text-fg-2">The file contains: {pending?.summary}.</p>
        <p className="mt-2 text-sm text-muted">Merge keeps the newest record of each item; Replace overwrites everything.</p>
      </Dialog>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all progress?"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { resetAll(); setConfirmReset(false); setMessage({ kind: 'ok', text: 'All progress was reset. Settings were kept.' }); }}>Reset everything</Button>
          </div>
        }
      >
        <p className="text-sm text-fg-2">This deletes answers, flashcard schedules, lesson history, labs, PBQs and exams. Consider exporting first. Settings are kept.</p>
      </Dialog>
    </div>
  );
}
