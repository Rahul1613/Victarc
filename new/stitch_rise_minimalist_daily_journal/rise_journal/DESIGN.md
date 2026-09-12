---
name: Rise Journal
colors:
  surface: '#0f1512'
  surface-dim: '#0f1512'
  surface-bright: '#343b38'
  surface-container-lowest: '#090f0d'
  surface-container-low: '#171d1a'
  surface-container: '#1b211e'
  surface-container-high: '#252b29'
  surface-container-highest: '#303633'
  on-surface: '#dee4e0'
  on-surface-variant: '#bacbbd'
  inverse-surface: '#dee4e0'
  inverse-on-surface: '#2b322f'
  outline: '#859588'
  outline-variant: '#3b4a40'
  surface-tint: '#15e292'
  primary: '#c7ffda'
  on-primary: '#003921'
  primary-container: '#38f2a0'
  on-primary-container: '#006a42'
  inverse-primary: '#006d43'
  secondary: '#9bd2b6'
  on-secondary: '#003826'
  secondary-container: '#19503b'
  on-secondary-container: '#8ac1a6'
  tertiary: '#c8ffdc'
  on-tertiary: '#003822'
  tertiary-container: '#4bf1a6'
  on-tertiary-container: '#006a44'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#51ffad'
  primary-fixed-dim: '#15e292'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005231'
  secondary-fixed: '#b7efd2'
  secondary-fixed-dim: '#9bd2b6'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#19503b'
  tertiary-fixed: '#5bfeb2'
  tertiary-fixed-dim: '#33e198'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005233'
  background: '#0f1512'
  on-background: '#dee4e0'
  surface-variant: '#303633'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies serene clarity, introspective calm, and focused elevation. Crafted for a dedicated daily free-writing journal, the aesthetic balances modern reductionism with atmospheric, nocturnal immersion. The experience evokes early dawn before the world awakens—misty mountain silhouettes, deep alpine shadows, and sharp neon bioluminescence cutting through quiet contemplation.

Key design tenants:
- **Quiet Depth:** The canvas avoids stark artificial greys in favor of deeply saturated forest blacks and nocturnal pine surfaces.
- **Luminous Intent:** Neon mint green accents are deployed sparingly as glowing signposts for focus, streaks, and vital CTAs rather than gratuitous decoration.
- **Tactile Softness:** Pill geometries and generous negative space yield an unhurried, peaceful canvas free from visual clutter or aggressive urgency.

## Colors

The color architecture is built strictly for high-contrast legibility against deep, immersive green-blacks:

- **Canvas & Backdrops:** Base foundation starts at `#020805` for root backgrounds, elevating to `#050A08` for structural frames and canvas regions.
- **Card Containers & Surfaces:** `#07130F` forms the secondary surface tier for inactive cards, elevating to `#0B1914` for active cards, drawers, and modal sheets.
- **Accents & Sparks:** `#38F2A0` functions as the primary neon focal color (active states, streak tallies, primary actions), with `#50F5AA` reserved for interactive hover states and focal neon glow highlights.
- **Structure & Subtlety:** `#164D38` serves as a muted emerald for track indicators, subdued badges, and secondary buttons. `#153A2D` defines hair-thin container borders and dividers.
- **Typography:** `#F5F7F6` ensures crisp, high-contrast readability across headlines and body copy, while `#A8B1AE` provides comfortable, subdued secondary copy for timestamps, metadata, and placeholder states.

## Typography

The typography leverages Inter to deliver a systematic, distraction-free writing environment.

- **Editorial Body Flow:** `body-md` and `body-lg` are prioritized with relaxed leading (`26px` and `28px`) to prevent visual strain during sustained drafting sessions.
- **Headings & Hierarchy:** Tight negative tracking on display levels creates confident, architectural silhouettes reminiscent of high-end editorial tools.
- **Labels & Metrics:** Subtle tracking expansion (`0.01em` to `0.04em`) on labels and streak data maintains legible precision at minute scales without overpowering the narrative prose.

## Layout & Spacing

The layout is built upon an intentional, single-focus container philosophy designed to cultivate deep work.

- **Desktop (1024px+):** Centered maximum reading column width of 768px for the editor workspace, flanked by dynamic gutter buffers. Multi-pane dashboard layouts implement an asymmetrical 12-column grid (gutter `1.5rem`, canvas margin `2rem`).
- **Tablet (768px - 1023px):** Fluid single or dual-column structure with `1.5rem` margins and `1rem` gutters.
- **Mobile (<768px):** Edge-to-edge canvas with `1rem` horizontal safe margin. Secondary sidebars collapse into bottom sheets to preserve vertical typing space.
- **Vertical Rhythm:** Paragraphs are spaced via `space-md` (1rem), component stacks via `space-lg` (1.5rem), and thematic section breaks via `space-xl` (2.5rem).

## Elevation & Depth

Visual hierarchy avoids generic grey dropshadows, leaning instead into tonal surface stacking, luminous neon halos, and subtle atmospheric depth:

- **Surface Tiers:**
  - *Base Canvas:* `#020805`
  - *Layer 1 (Cards, panels):* `#07130F` with a 1px border of `#153A2D`
  - *Layer 2 (Hover cards, active inputs):* `#0B1914` with a 1px border of `#1A4737`
  - *Layer 3 (Floating sheets, popovers):* `#0E221B` with 1px border of `#245C47`
- **Neon Diffuse Radiance:** Critical interactive elements and milestones leverage neon green light spill: `0px 0px 24px -4px rgba(56, 242, 160, 0.18)`.
- **Atmospheric Background Layers:** Vector silhouettes of distant mountains sit at low opacity (6% to 12%) in `#164D38` anchored to the screen bottom, softly blending into `#020805` via subtle vertical gradients.

## Shapes

The design system employs a soft, pill-forward shape hierarchy:

- **Buttons, Badges, and Chips:** Set to full pill curvature (`border-radius: 9999px` or standard 28px height radii) to provide an organic, tactile counterpoint to the structured grid.
- **Content Cards & Containers:** Standardized at `rounded-lg` (2rem / 32px) or `rounded-md` (1rem / 16px) depending on density, maintaining sweeping, smooth edges that mirror natural landscape contours.
- **Inner Form Controls:** Form inputs match the button radius (typically 24px - 28px radius) to maintain a continuous, organic silhouette throughout user input flows.

## Components

- **Buttons:**
  - *Primary:* Neon mint `#38F2A0` background, deep midnight `#020805` text, pill radius (28px height standard for compact, 48px for hero actions). Ambient hover aura: `box-shadow: 0 0 20px rgba(56, 242, 160, 0.35)`.
  - *Secondary:* `#0B1914` background with 1px `#153A2D` stroke, `#F5F7F6` text. Hover transitions stroke to `#38F2A0` at 50% opacity.
  - *Ghost / Tertiary:* Transparent background, `#A8B1AE` text, shifting to `#38F2A0` on hover.
- **Writing Cards & Entry Previews:**
  - Container in `#07130F`, border 1px solid `#153A2D`, corner radius `24px`, interior padding `space-lg`.
  - Title in `#F5F7F6` (`headline-sm`), snippet in `#A8B1AE` (`body-sm`), footer metadata accented with neon date stamps.
- **Chips & Mood Tags:**
  - Pill geometry, background `#0B1914`, border 1px solid `#153A2D`, text `#A8B1AE` (`label-md`).
  - Selected state: background `#164D38`, border `#38F2A0`, text `#38F2A0`.
- **Form & Journal Inputs:**
  - Free-writing canvas is borderless with `#020805` background; caret color is `#38F2A0`.
  - Standard inputs: `#07130F` container, 1px `#153A2D` stroke, `#F5F7F6` text, `#A8B1AE` placeholder. Focused state transitions stroke to `#38F2A0` accompanied by a 2px soft outer glow.
- **Selection Controls (Checkboxes & Radios):**
  - Checkbox: 20px rounded square (6px radius), border `#153A2D`, checked fill `#38F2A0` with `#020805` check icon.
  - Radio: Pill circle, base border `#153A2D`, selected indicator features a `#38F2A0` solid dot surrounded by a 2px inset void.
- **Word Count & Streak Trackers:**
  - Minimal horizontal pill docks floating at bottom center: `#07130F` semi-translucent backdrop (`backdrop-filter: blur(12px)`), 1px `#153A2D` border, displaying glowing `#38F2A0` metrics alongside `#A8B1AE` labels.