# TeamBrain Cosmic Glass Design System

**Created**: 2026-05-14
**Source**: UI/UX Pro Max + Manual Refinement
**Status**: Implemented

## Overview

TeamBrain is a team knowledge management platform with 3D brain visualization. The design system blends Space Tech aesthetics with professional glassmorphism — cosmic holographic on the homepage, clean glassmorphism on inner pages.

## Color Palette

### Dark Mode (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep-space` | `#0B0B10` | Page background |
| `--bg-midnight` | `#0A0E27` | 3D scene background |
| `--bg-navy` | `#0F172A` | Card/surface background |
| `--glass-bg` | `rgba(15, 23, 42, 0.55)` | Glass panel background |
| `--glass-blur` | `16px` | Backdrop blur amount |
| `--glass-border` | `rgba(148, 163, 184, 0.12)` | Glass panel border |
| `--accent` | `#3B82F6` | Primary action, links, focus |
| `--accent-soft` | `#60A5FA` | Hover states, secondary accents |
| `--accent-glow` | `0 0 30px rgba(59, 130, 246, 0.15)` | Subtle glow on key panels |
| `--text-primary` | `#F8FAFC` | Body text |
| `--text-muted` | `#94A3B8` | Secondary text, labels |
| `--success` | `#22C55E` | Positive indicators |
| `--warning` | `#F59E0B` | Warning indicators |
| `--destructive` | `#EF4444` | Delete/danger actions |

### Light Mode (`.light` class)

| Token | Value |
|-------|-------|
| `--bg-deep-space` | `#F8FAFC` |
| `--bg-midnight` | `#F1F5F9` |
| `--bg-navy` | `#FFFFFF` |
| `--glass-bg` | `rgba(255, 255, 255, 0.75)` |
| `--glass-border` | `rgba(0, 0, 0, 0.08)` |
| `--accent` | `#2563EB` |
| `--accent-soft` | `#3B82F6` |
| `--accent-glow` | `none` |
| `--text-primary` | `#0F172A` |
| `--text-muted` | `#475569` |
| `--success` | `#16A34A` |
| `--warning` | `#D97706` |
| `--destructive` | `#DC2626` |

## Typography

- **Font**: Plus Jakarta Sans (Google Fonts), weights 300/400/500/600/700
- **Body**: 16px, line-height 1.5
- **Headings**: weight 600-700, line-height 1.25
- **Scale**: Tailwind default — text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px)

## Effects

- **Glass Panels**: `backdrop-filter: blur(16px)` + subtle border + glass-bg color
- **Accent Glow**: Blue box-shadow on highlighted/featured cards
- **Transitions**: 150-300ms, prefer `transition-colors` or `transition-all`
- **Homepage 3D**: Deep space background with particle effects, glow, connection lines (BrainPointCloud)

## Component Patterns

### GlassCard
```jsx
<GlassCard variant="default|accent" className="...">
  {children}
</GlassCard>
```
`default`: glass background + glass border
`accent`: glass background + accent border + blue glow shadow

### GlassModal
```jsx
<GlassModal open={open} onOpenChange={setOpen} title="Title" description="Description">
  {children}
</GlassModal>
```
Wraps shadcn `Dialog` with Cosmic Glass styling. Max height 85vh with scroll.

### FormField
```jsx
<FormField label="Label" error="Error message">
  <Input ... />
</FormField>
```
Combines `Label` + Input/Textarea/Select + error display.

### PageShell
```jsx
<PageShell loading={isLoading} error={error} maxWidth="max-w-4xl">
  {children}
</PageShell>
```
Page container with loading/error states and consistent max-width.

## Shared Components Location

```
frontend/src/components/shared/
  GlassCard.jsx
  GlassModal.jsx
  FormField.jsx
  PageShell.jsx
  NodeModal.jsx
  RegionModal.jsx
  DeleteRegionModal.jsx
```

## Key Rules

1. **No emoji icons** — use lucide-react SVG icons only
2. **No alert()** — use `toast.error()` / `toast.success()` from sonner
3. **No inline glassmorphism** — use GlassCard or CSS variables directly
4. **CSS variables** over raw Tailwind values for theming support
5. **Dark mode default**, light mode via `.light` class on `<html>`
6. **shadcn/ui** for all interactive elements (Button, Input, Select, Dialog, etc.)
7. **cursor-pointer** on all clickable elements
8. **150-300ms transitions** for hover/active states

## Implementation Reference

- Spec: `docs/superpowers/specs/2026-05-14-unified-ui-ux-design.md`
- Plan: `docs/superpowers/plans/2026-05-14-unified-ui-ux-plan.md`
- CSS: `frontend/src/index.css`
- Tailwind: `frontend/tailwind.config.js`
