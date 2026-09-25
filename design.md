# Design — Better Autostart

A locked design system for Better Autostart desktop application. Every UI component reads from this specification.

## Genre
modern-minimal

## Macrostructure family
- App pages: Workbench (structured sequence table, real-time pacing telemetry, quiet contextual actions, strict column alignment)

## Theme — Cobalt Technical Dark
- `--color-paper`:      oklch(0.16 0.005 260); /* Deep carbon canvas #16181c */
- `--color-paper-2`:    oklch(0.20 0.006 260); /* Toolbars, dialog surfaces, table rows #20232a */
- `--color-paper-3`:    oklch(0.25 0.008 260); /* Hover states, nested input frames #2a2d36 */
- `--color-ink`:        oklch(0.96 0.002 260); /* Primary typography #f4f5f7 */
- `--color-ink-2`:      oklch(0.68 0.005 260); /* Secondary labels, paths, shortcuts #a0a4b0 */
- `--color-ink-3`:      oklch(0.48 0.006 260); /* Muted captions, sequence indices #6b7080 */
- `--color-rule`:       oklch(0.28 0.008 260); /* Crisp hairlines, table borders #323642 */
- `--color-accent`:     oklch(0.58 0.22 260);  /* Electric cobalt signal accent #2563eb */
- `--color-signal-run`: oklch(0.68 0.16 150);  /* Execution state, verified running #10b981 */
- `--color-signal-warn`:oklch(0.72 0.16 75);   /* Admin elevation warning #f59e0b */
- `--color-signal-err`: oklch(0.62 0.20 25);   /* Execution failure indicator #ef4444 */
- `--color-focus`:      oklch(0.65 0.18 260);  /* Focus ring */

## Typography
- Display / Headings: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  - Weight: 600 (Semibold), tracking: -0.015em, style: normal (no italic headers).
- Body / UI Labels: Same sans family, weight: 400 & 500, style: normal.
- Monospace / Data: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "JetBrains Mono", monospace`
  - Used for sequence numbers (`01`, `02`), executable paths, command arguments, timers (`tabular-nums`).

## Spacing & Metrics
- 4-point scale: 4px (`0.25rem`), 8px (`0.5rem`), 12px (`0.75rem`), 16px (`1rem`), 20px (`1.25rem`), 24px (`1.5rem`).
- Border radii:
  - `--radius-btn`: 4px (tight, purposeful desktop buttons)
  - `--radius-card`: 6px (table row / container)
  - `--radius-dialog`: 8px (modals & inspectors)
  - `--radius-pill`: 9999px (compact 14px status dots and toggles)

## Motion & Transitions
- Microtransitions strictly 100ms–150ms on `color`, `background-color`, `border-color`, `opacity`.
- Zero bouncing, zero overshoots, zero layout jumps.

## Interaction & 8-State Discipline
Every interactive element must provide explicit styling for:
- Default, Hover, Active, Focus-visible, Disabled, Loading, Error, Success.

## Component Voice
- Toolbar: Razor-sharp 1px border separation, compact 32px height buttons with keyboard hints.
- Sequence Table: Fixed column grid, tabular number index, quiet action buttons on hover only.
- Switch: Compact 14px height mechanical-feeling toggle.
