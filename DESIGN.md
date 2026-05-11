---
name: infrafund-front-pro-design-system
source_file: InfraFund-local
source_page: Multi-page system audit
source_figma_url: https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local
extracted_at: 2026-05-12
---

# InfraFund Figma-first Design System

## Source of truth

Figma is the only source of truth for visual design, component structure,
interaction states, layout behavior, and content hierarchy.

Current implementation in this repository is not design authority. Existing
pages may be partially aligned, outdated, or materially different from the
Figma file and must not be used to infer product design rules.

If implementation and Figma disagree:

- Figma wins.
- Implementation should be considered drift.
- Future refresh work should bring code back into alignment with Figma.

Primary file:

- [InfraFund-local](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local)

This system guidance was derived from multiple representative frames across
the file, including:

- contractor dashboard
- client dashboard / create-project flow
- investor explore-project flow
- tokenization flow
- investment portal forms

## Purpose

This file defines shared visual and interaction rules for the whole product,
not a single page. It exists to help engineers build and later refresh pages
so the app converges on one coherent Figma-aligned system.

## Product character

InfraFund is a dark, cinematic, dashboard-oriented interface with:

- deep charcoal backgrounds
- glass-like panel overlays
- neon-green primary emphasis
- Chakra Petch for interface hierarchy
- IBM Plex Mono for data, labels, and system detail
- rounded surfaces with strong spacing rhythm
- semantic status color used sparingly and intentionally

## Global product rules

- Must follow Figma over existing implementation.
- Must reuse system patterns across roles and flows instead of redesigning
  each page locally.
- Must preserve consistent shell, navigation, card, and form behavior across
  all major surfaces.
- Must separate visual primitives from page-specific business logic.
- Must treat generated design-context code as reference only, never as final
  production architecture.

## Representative audited surfaces

The broader system was inferred from multiple Figma surfaces rather than only
one contractor page.

### 1. App shell and role dashboards

Observed across contractor, investor, and client-oriented dashboards.

Shared system signals:

- left persistent sidebar in a large rounded glass shell
- top page header with title and account/action area
- dark full-screen background with blurred glow ellipses
- modular dashboard cards and summary panels
- role-specific content inside a stable frame

### 2. Explore-project surfaces

Observed in investor-facing explore pages.

Shared system signals:

- same app shell and nav language
- project cards with prominent imagery and metadata
- dense information panels using mixed headline + data typography
- clear CTA hierarchy without abandoning the base shell

### 3. Create-project and client-dashboard surfaces

Observed in create-project and related dashboard/withdraw frames.

Shared system signals:

- stable shell reused across authoring workflows
- form-driven layout with strong section grouping
- multi-step information hierarchy
- disabled/locked nav states for unavailable routes or gated steps

### 4. Tokenization surfaces

Observed in network selection and tokenization flow pages.

Shared system signals:

- shell consistency is preserved even when content type changes
- cards become decision surfaces
- primary action remains neon-green
- content panels support technical copy and network selection affordances

### 5. Investment portal forms

Observed in contact-information and project-information frames.

Shared system signals:

- form sections use the same dark surface system
- labels, inputs, and subheaders follow a repeated hierarchy
- grouped fields are arranged with spacious but controlled vertical rhythm
- system typography remains consistent with the rest of the product

## Foundation tokens

### Color palette

Use the Figma palette as canonical.

#### Brand

- primary: `#24FF8E`
- primary hover: `#1AD87A`
- primary pressed: `#11B367`
- primary disabled: `#A2F4CC`
- primary 50: `#EDFFF5`
- primary 100: `#D5FFEA`
- primary 200: `#AEFFD6`
- primary 300: `#6FFFB7`

#### Neutrals

- gray 50: `#F5F6F8`
- gray 100: `#EDEEF2`
- gray 200: `#DEE0E7`
- gray 300: `#C7CAD5`
- gray 400: `#B3B6C6`
- gray 500: `#9FA1B5`
- gray 600: `#8A89A2`
- gray 700: `#77768C`
- gray 800: `#616172`
- gray 900: `#51515E`

#### Semantic

- success: `#22C55E`
- warning: `#FACC15`
- error: `#EF4444`
- info: `#3B82F6`

#### Surfaces

- page background: `#0C0C0D`
- card background: `#151E2F80`
- selected surface: `#1F2A40`
- translucent border: `#FFFFFF1A`
- shell border usage often appears as dark blue-gray outline values close to
  `#152133` or `#30363D`, depending on panel depth

### Token mapping expectation

Where repo tokens exist, they should be updated or extended to mirror Figma,
not the other way around.

Current implementation tokens such as these should be treated as a transport
layer for Figma values:

- `--color-primary`
- `--color-primary-hover`
- `--color-primary-pressed`
- `--color-primary-disabled`
- `--color-gray-50` through `--color-gray-900`
- `--color-success`
- `--color-warning`
- `--color-error`
- `--color-info`
- `--color-card-bg`
- `--color-card-border`
- `--color-card-selected-bg`

If a repo token does not match Figma, the repo token should be changed later.

## Typography system

Typography is one of the strongest cross-product consistency markers.

### Typeface roles

#### Chakra Petch

Use for:

- page titles
- section titles
- navigation labels
- dashboard headings
- buttons
- high-emphasis interface text

Observed Figma styles include:

- Headline 4: 31px, regular, tracking 0.25px
- Headline 6: 18px, medium, tracking 0.15px
- Sidebar / Navbar: 16px, regular, tracking 0.15px
- Button: 14px, semibold, tracking 1.25px
- larger hero/dashboard heading usage at about 40px bold in page headers
- subheader usage around 16px with more relaxed line height

#### IBM Plex Mono

Use for:

- metadata
- labels
- wallet/account text
- timestamps
- supporting body copy
- structured field content
- data-rich descriptions and helper text

Observed Figma styles include:

- Body 1: 14px, line-height about 180%, tracking 0.5px
- Body 2: 12px
- Label: 14px to 16px, medium
- monospace account/address strings in header and account contexts

### Typography rules

- Must not swap type roles casually between Chakra Petch and IBM Plex Mono.
- Must keep page hierarchy driven by Chakra Petch.
- Must keep system/data readability driven by IBM Plex Mono.
- Should preserve letter-spacing behavior when recreating high-fidelity UI.

## Spacing system

Use the Figma spacing scale as the canonical rhythm:

- 4
- 8
- 12
- 16
- 24
- 32
- 48

Spacing rules:

- dense inline groups usually cluster around 8 to 16
- default component padding often lands at 16 or 24
- major section separation often lands at 24, 32, or 48
- spacing should feel deliberate and modular, not improvised

## Radius, borders, and effects

### Radius tiers

Observed recurring radius tiers:

- 4px for compact controls in some utility/button contexts
- 8px for nested records and compact cards
- 12px for active nav items and some mid-level panels
- 20px for summary/stat cards
- 40px for large shell containers such as sidebars
- full pill / circular radii for chips and avatars

### Border behavior

- Borders are subtle and usually low-contrast against dark surfaces.
- Border presence is important for depth separation.
- Different depths may use different dark-border treatments.

### Blur and glass treatment

- Major shells and cards often use translucent dark fills plus backdrop blur.
- Glass treatment is part of the system language, not a one-off flourish.
- Blur should support depth, not obscure content.

## Layout system

### Global app shell

The global authenticated shell must be understood as a system primitive.

It includes:

- full-screen dark stage
- two large ambient blur ellipses
- left sidebar shell
- top header row
- main content region aligned to a shared content start line

This shell appears across dashboards, forms, flows, and exploration pages.

### Page header block

Across multiple pages, the page header follows a repeated pattern:

- role or greeting metadata line may appear above the page title
- large page title anchors the content area
- utility/account actions align to the upper right

### Content region behavior

The content region changes by page type, but the system is consistent:

- dashboards: stat-card rows plus larger feature panels
- forms: grouped vertical sections and multi-field areas
- exploration: project cards and rich metadata panels
- flows: choice cards, progress groupings, and actions

## Core component families

### Sidebar navigation

Sidebar must:

- preserve the glass shell treatment
- use Chakra Petch 16px nav labels
- use 24px icon sizing for standard nav affordances
- mark the active destination with selected surface + primary color
- keep inactive items in gray tones
- support disabled/locked entries when the Figma surface shows them

Sidebar should:

- be configuration-driven by role and route availability
- reuse one primitive with different data per role, not separate ad hoc builds

### Header and account region

Header must:

- preserve right-aligned utility/action/account grouping
- keep icon utilities compact and icon-only where Figma does
- use monospace for wallet/account strings
- keep page title visually dominant in the content header area

Header should:

- support role metadata when present in Figma
- separate product navigation concerns from wallet/session concerns

### Stat cards

Stat cards are shared KPI primitives.

Stat cards must:

- use dark translucent panel styling
- use medium/large Chakra Petch typography for value hierarchy
- use semantic emphasis only where needed
- maintain generous padding and clear label/value separation

### Glass panels

Large feature panels appear across dashboards and flows.

They must:

- reuse the same surface language as the shell
- support titles, metadata, nested cards, and CTAs
- preserve strong spacing rhythm and readable hierarchy

### Nested item cards

Nested item cards appear inside larger panels and lists.

They must:

- use a darker, more opaque fill than the parent panel
- maintain smaller radius than parent containers
- support status pill, metadata, progress, and action placement

### Project cards

Project cards are an important cross-page pattern.

They must:

- support prominent image or media area where Figma shows it
- preserve content hierarchy between title, project metadata, status, and CTA
- maintain strong readability through overlay treatment where text sits on image
- scale across dashboard and explore-project contexts without losing identity

### Forms

Forms are a first-class system pattern, not a secondary utility.

Forms must:

- group fields into clear sections
- use consistent label, input, helper, and section-title hierarchy
- preserve dark surfaces and contrast-safe field treatment
- keep field spacing systematic across all flows

Forms should:

- support multi-step authoring flows cleanly
- converge on a reusable field primitive set later in implementation refresh work

### Inputs and selects

Inputs and selects must:

- follow Figma, even if current code differs
- use dark surfaces with clear focus visibility
- support invalid state and helper copy clearly
- preserve readable spacing and label placement

### Buttons and text actions

Buttons must:

- use Chakra Petch semibold at button scale
- preserve tracked uppercase/high-emphasis behavior where Figma shows it
- define default, hover, focus-visible, active, disabled, and loading states
- use primary green as the default emphasis color

Text actions should:

- use primary or semantic info depending on context
- remain clearly actionable on dark surfaces
- not rely solely on underline for discoverability

### Status chips

Status chips are reused across dashboard tasks, approvals, and workflows.

They must:

- be pill-shaped
- combine tinted fill, semantic border, and semantic text
- stay short and scannable
- support these typical meanings:
  - success / complete
  - warning / attention needed
  - info / in progress / awaiting verification
  - neutral / not started
  - error / blocked

### Progress bars

Progress bars must:

- sit on dark tracks
- use primary green by default unless semantic state changes meaning
- be paired with textual metadata or percentage/progress descriptors
- never rely on color alone to communicate meaning

### Avatars and identity badges

These must:

- remain circular or pill-based where Figma shows them
- support initials or address presentation cleanly
- use IBM Plex Mono for wallet/address strings

## Interaction rules

Every interactive component must define:

- default
- hover
- focus-visible
- active
- disabled
- loading, when relevant

Interaction behavior must stay stable across the product.

### Keyboard behavior

All interactive controls must:

- be keyboard reachable
- show visible focus on dark backgrounds
- support Escape dismissal for menus, dropdowns, and overlays where relevant
- preserve semantic button/link/input behavior

### Pointer behavior

- Hover should reinforce hierarchy, not cause major layout jumps.
- Cursor behavior must reflect actual interactivity.
- Disabled states must look and behave disabled.

## Responsive guidance

The Figma system is strongly desktop-first.

Until explicit mobile designs are audited, implementation should:

- preserve desktop hierarchy first
- collapse columns carefully rather than shrinking content aggressively
- stack major dashboard sections vertically on smaller widths
- avoid destroying the shell rhythm through accidental overflow behavior

Responsive adaptation must follow system intent, not convenience shortcuts.

## Accessibility requirements

All implementation refreshed from this system must:

- meet WCAG 2.2 AA contrast expectations
- preserve semantic HTML structure
- provide labels for icon-only controls
- maintain visible focus indicators
- avoid color-only status communication
- preserve keyboard usability for forms, menus, panels, and overlays

## Implementation policy for this repo

### What the repo is allowed to contribute

The current codebase may inform:

- framework and technology choices
- file organization
- reusable component architecture
- token transport mechanism
- state management and routing structure

### What the repo is not allowed to define

The current codebase must not define:

- visual styling authority
- final component anatomy
- final spacing, typography, or surface rules
- interaction states when those differ from Figma

In short:

- code architecture may guide implementation shape
- Figma defines what the UI should be

## Anti-patterns

Do not:

- treat a currently implemented page as design guidance when it conflicts with
  Figma
- infer the whole system from a single page if broader Figma evidence exists
- introduce one-off colors, spacing, or radii when an audited Figma pattern
  already exists
- rebuild role dashboards as unrelated products
- copy raw generated Figma JSX/Tailwind output directly into production
- hide focus states to make the UI feel cleaner

## Future refresh policy

A later audit/refresh pass should review already implemented pages and update
all drifted surfaces to align with this Figma-first system.

That future work should compare the current app against Figma page by page and
component by component.

## QA checklist

Before shipping UI work, confirm:

- the visual decision came from Figma, not legacy implementation
- the shell pattern matches audited Figma surfaces
- typography roles match the system
- surface, radius, border, and blur treatments match the correct component
  family
- active, hover, focus, disabled, and loading states exist where needed
- role-specific variations still feel like the same product
- forms, dashboards, and exploration pages all share one coherent design
  language

## Figma references

- [InfraFund-local file](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local)
- [Contractor dashboard reference](https://www.figma.com/design/Zq04RInLJpyFTA83nEdO4y/InfraFund-local?node-id=25140-14114&m=dev)
