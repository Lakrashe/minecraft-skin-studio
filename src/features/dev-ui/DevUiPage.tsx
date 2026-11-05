/**
 * Developer-only design-system gallery at /dev/ui.
 * Registered only when `import.meta.env.DEV` is true, so it never ships in
 * production builds or navigation. Copy here is intentionally not translated:
 * it is a developer tool, not user-facing UI.
 */
import { Suspense, useState } from 'react';
import { useT } from '@/i18n';
import { LazySceneCanvas } from '@/renderer3d';
import { useSettings } from '@/state';
import {
  Badge,
  Button,
  Dialog,
  IconButton,
  Kbd,
  Panel,
  PixelLoader,
  SegmentedControl,
  Select,
  Slider,
  Spinner,
  Switch,
  TextField,
  toast,
} from '@/ui';
import { SmokeTestScene } from './SmokeTestScene';

export function DevUiPage() {
  const t = useT();
  const accent = useSettings((s) => s.accent);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [size, setSize] = useState(4);
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a');
  const [choice, setChoice] = useState<'one' | 'two'>('one');
  const [loading, setLoading] = useState(false);
  const [show3d, setShow3d] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Design system</h1>
      <p className="mt-2 text-muted">Developer preview of the shared UI primitives.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Panel title="Buttons" description="Variants, sizes and loading state.">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Primary</Button>
            <Button>Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={() => {
                setLoading(true);
                window.setTimeout(() => {
                  setLoading(false);
                }, 1500);
              }}
            >
              Click to load
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <IconButton icon="settings" label="Settings" shortcut="Ctrl ," />
            <IconButton icon="palette" label="Active tool" active />
          </div>
        </Panel>

        <Panel title="Feedback" description="Toasts, dialog, badges and loaders.">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast.info('Information toast')}>Info</Button>
            <Button onClick={() => toast.success('Saved successfully')}>Success</Button>
            <Button onClick={() => toast.warning('Careful with that')}>Warning</Button>
            <Button onClick={() => toast.error('Something failed')}>Error</Button>
            <Button
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              Open dialog
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge>Neutral</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Spinner />
            <PixelLoader />
            <span className="text-sm text-muted">
              Undo <Kbd>Ctrl</Kbd> <Kbd>Z</Kbd>
            </span>
          </div>
        </Panel>

        <Panel title="Form controls">
          <div className="flex flex-col gap-5">
            <TextField label="Project name" placeholder="My skin" hint="Shown in My Projects." />
            <TextField label="With error" defaultValue="??" error="Invalid name." />
            <Select
              label="Select"
              value={choice}
              onChange={setChoice}
              options={[
                { value: 'one', label: 'Option one' },
                { value: 'two', label: 'Option two' },
              ]}
            />
            <Slider label="Brush size" min={1} max={8} value={size} onChange={setSize} />
            <Switch
              label="Pixel grid"
              description="Show grid lines on the canvas."
              checked={switchOn}
              onChange={setSwitchOn}
            />
            <SegmentedControl
              label="Segmented"
              value={segment}
              onChange={setSegment}
              options={[
                { value: 'a', label: 'Alpha' },
                { value: 'b', label: 'Beta' },
                { value: 'c', label: 'Gamma' },
              ]}
            />
          </div>
        </Panel>

        <Panel
          title="3D pipeline"
          description="Lazy-loads Three.js + React Three Fiber in its own chunk."
          actions={
            <Button
              size="sm"
              onClick={() => {
                setShow3d((v) => !v);
              }}
            >
              {show3d ? 'Unload' : 'Load 3D'}
            </Button>
          }
        >
          <div className="flex h-72 items-center justify-center overflow-hidden rounded-control border border-line bg-bg-raised">
            {show3d ? (
              <Suspense fallback={<PixelLoader />}>
                <LazySceneCanvas
                  className="size-full"
                  label="Rotating test cube"
                  fallback={<p className="p-4 text-sm text-muted">{t('webgl.unavailable')}</p>}
                >
                  <SmokeTestScene color={accent} />
                </LazySceneCanvas>
              </Suspense>
            ) : (
              <p className="text-sm text-subtle">Three.js not loaded</p>
            )}
          </div>
        </Panel>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title="Example dialog"
        description="Native <dialog>: Escape closes, focus is trapped, background is inert."
        footer={
          <>
            <Button
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDialogOpen(false);
                toast.success('Confirmed');
              }}
            >
              Confirm
            </Button>
          </>
        }
      />
    </div>
  );
}
