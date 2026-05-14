# TeamBrain Unified UI/UX Design

**Date**: 2026-05-14
**Status**: Approved

## Summary

Unify TeamBrain's UI by properly adopting shadcn/ui components, creating a consistent "Cosmic Glass" design system with light/dark mode support, extracting duplicated patterns into reusable components, and standardizing notifications and error handling.

## Design System: Cosmic Glass

### Color Palette (Space Tech + Navy)

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--bg-deep-space` | `#0B0B10` | `#F8FAFC` | Page background |
| `--bg-midnight` | `#0A0E27` | `#F1F5F9` | 3D scene background |
| `--bg-navy` | `#0F172A` | `#FFFFFF` | Card/surface background |
| `--glass-bg` | `rgba(15,23,42,0.55)` | `rgba(255,255,255,0.75)` | Glass panel overlay |
| `--glass-border` | `rgba(148,163,184,0.12)` | `rgba(0,0,0,0.08)` | Glass panel border |
| `--accent` | `#3B82F6` | `#2563EB` | Primary action, links, focus |
| `--accent-glow` | `0 0 30px rgba(59,130,246,0.15)` | none | Subtle glow on key panels |
| `--text-primary` | `#F8FAFC` | `#0F172A` | Body text |
| `--text-muted` | `#94A3B8` | `#475569` | Secondary text, labels |
| `--success` | `#22C55E` | `#16A34A` | Positive indicators |
| `--warning` | `#F59E0B` | `#D97706` | Warning indicators |
| `--destructive` | `#EF4444` | `#DC2626` | Delete/danger actions |

### Typography

- **Font**: Plus Jakarta Sans (Google Fonts), weights 300/400/500/600/700
- **Scale**: Tailwind default (text-sm 14px, text-base 16px, text-lg 18px, text-xl 20px, text-2xl 24px)
- **Body**: 16px, line-height 1.5
- **Headings**: weight 600-700, line-height 1.25

### Effects

- Glass panels: `backdrop-filter: blur(16px)`, subtle border, no hard edges
- Accent glow: `box-shadow` with low-opacity blue on highlighted cards
- Transitions: 150-300ms, `transition-colors` or `transition-all`
- Homepage: 3D brain retains cosmic holographic feel (particles, glow, connection lines)

## Architecture

### New Shared Components

**GlassCard** — Replaces all `bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg` patterns.
```jsx
<GlassCard variant="default|accent" className="...">
  {children}
</GlassCard>
```

**GlassModal** — Wraps shadcn Dialog with Cosmic Glass styling. Replaces react-modal, hand-crafted fixed div modals, window.confirm, and alert.
```jsx
<GlassModal open={open} onOpenChange={setOpen} title="Title" description="Description">
  {children}
</GlassModal>
```

**FormField** — Combines Label + Input/Textarea/Select + error message. Replaces hand-crafted form field patterns.
```jsx
<FormField label="Name" error={errors.name}>
  <Input {...register("name")} />
</FormField>
```

**PageShell** — Consistent page wrapper with max-width, padding, loading, and error states.
```jsx
<PageShell loading={isLoading} error={error}>
  {children}
</PageShell>
```

### Extract Duplicated Components

- **NodeModal** → `components/shared/NodeModal.jsx` (shared by MyTeamDetail + TeamEditPage)
- **RegionModal** → `components/shared/RegionModal.jsx`
- **DeleteRegionModal** → `components/shared/DeleteRegionModal.jsx`

### Notification Strategy

- All user-facing notifications use **sonner** (`toast.success`, `toast.error`, `toast.info`)
- Remove all `alert()` and `window.confirm()` calls
- Delete confirmations use GlassModal with explicit confirm/cancel buttons

## Implementation Plan

### Phase 1: Design Tokens
1. Update `index.css` with Cosmic Glass CSS variables and `.light` class overrides
2. Add Plus Jakarta Sans font import
3. Configure Tailwind to use CSS variables via theme extension

### Phase 2: Shared Components
1. Create `GlassCard.jsx` — simple wrapper with variant prop
2. Create `GlassModal.jsx` — based on shadcn Dialog
3. Create `FormField.jsx` — wraps Label + Input + error display
4. Create `PageShell.jsx` — consistent page container

### Phase 3: Page Refactoring (in order)
1. Extract NodeModal, RegionModal, DeleteRegionModal to shared components
2. LoginPage — Card + Form + Input + Button from shadcn
3. MyTeams — GlassCard + PageShell
4. TeamSquare, JoinTeam — unified team list cards
5. Profile — FormField + Card
6. MyTeamDetail + TeamEditPage — shared modals + FormField
7. Index (BrainPointCloud) — GlassModal replaces react-modal
8. AdminPage — merge into ProtectedLayout, glass components
9. Navbar + App.jsx — glass navbar + sonner Toaster

### What Does NOT Change
- BrainPointCloud.jsx 3D rendering logic (Three.js)
- MiniBrain.jsx
- Backend API, controllers, services, entities
- Existing shadcn/ui component library files
- Routing structure (HashRouter, route paths)

### Constraints
- No new npm dependencies
- Each phase step is independently testable
- Old styles kept until new component verified

## Notes

- Homepage retains "cosmic holographic projection" aesthetic (deep space background, particle effects, glow)
- Inner pages use professional glassmorphism (cleaner, less sci-fi)
- Light mode is opt-in via `.light` class on `<html>`, dark mode stays default
- Admin sidebar replaced with unified navbar + sub-navigation tabs
