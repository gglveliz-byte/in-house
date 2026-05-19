---
name: Logistics & Commerce System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#424752'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#727784'
  outline-variant: '#c2c6d4'
  surface-tint: '#115cb9'
  primary: '#003f87'
  on-primary: '#ffffff'
  primary-container: '#0056b3'
  on-primary-container: '#bbd0ff'
  inverse-primary: '#acc7ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#3d4245'
  on-tertiary: '#ffffff'
  tertiary-container: '#54595d'
  on-tertiary-container: '#ccd0d4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004491'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1280px
---

## Brand & Style

This design system is built upon the pillars of **efficiency, reliability, and real-time clarity**. Designed for the high-velocity environments of logistics and retail management, the UI prioritizes information density without sacrificing legibility.

The visual direction follows a **Corporate / Modern** aesthetic. It utilizes a structured grid, purposeful whitespace, and a high-contrast palette to ensure that delivery drivers and vendors can make split-second decisions. The style is intentionally utilitarian, removing decorative distractions to focus on task completion and status tracking. 

The emotional response should be one of "controlled urgency"—users should feel that the system is powerful and dependable, providing exactly the information needed at the moment of action.

## Colors

The color palette is anchored by a deep **Corporate Blue (#0056b3)**, signifying institutional trust and stability. 

- **Primary Blue:** Used for primary actions, branding elements, and active progress states.
- **Secondary Slate:** Employed for metadata, secondary icons, and de-emphasized text.
- **Surface Neutrals:** A range of cool grays provides the background for cards and dashboards, ensuring a clean separation of content.
- **Semantic States:** 
    - **En preparación:** Amber (#f59e0b) to signal active work.
    - **Listo para recolectar:** Indigo (#6366f1) to signal a transition point.
    - **En camino:** Primary Blue (#0056b3) to represent the core service in motion.
    - **Entregado:** Emerald (#10b981) to signify successful completion.

## Typography

This design system employs a pairing of **Hanken Grotesk** for headlines and **Inter** for functional UI and body text. 

Hanken Grotesk provides a sharp, contemporary professional feel for titles and key data points. Inter is used for all system-level components, tables, and labels due to its exceptional legibility at small sizes and high x-height. 

For the mobile courier interface, headlines scale down to ensure critical order information remains "above the fold" without excessive scrolling. Labels use a slight letter-spacing increase and uppercase styling to clearly distinguish them from dynamic data.

## Layout & Spacing

The system follows a **12-column fluid grid** for the vendor dashboard and a **single-column vertical stack** for the courier mobile app.

- **Rhythm:** A strict 8px base unit (4px, 8px, 16px, 24px, 32px, 48px, 64px) governs all padding and margins.
- **Dashboard:** Features a fixed left-hand navigation (256px) with a fluid content area. Data tables and stat cards should span column groups (e.g., 3-column spans for KPIs, 12-column spans for order logs).
- **Mobile Courier App:** Uses 16px side margins to maximize the touch target area for order items. High-priority "Action Bars" are pinned to the bottom of the viewport for easy thumb access.

## Elevation & Depth

To maintain a professional and clean appearance, the design system avoids heavy shadows, opting instead for **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Level 0 (Background):** Solid `#f8fafc` surface.
2.  **Level 1 (Cards/Sections):** White surface with a 1px border of `#e2e8f0`. No shadow.
3.  **Level 2 (Hover/Active):** White surface with a very soft, diffused ambient shadow (0px 4px 12px rgba(0, 0, 0, 0.05)) to indicate interactivity.
4.  **Level 3 (Modals/Overlays):** White surface with a more pronounced shadow (0px 12px 24px rgba(0, 86, 179, 0.1)) to focus user attention.

Depth is primarily communicated through color-blocking rather than physical stacking metaphors.

## Shapes

The shape language is **Rounded**, strike a balance between a modern software feel and industrial precision.

- **Standard Components:** Buttons, inputs, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Dashboard panels and modal windows use a 1rem (16px) radius.
- **Status Badges:** Use a "pill" shape (full rounding) to visually distinguish them from interactive buttons.

Consistent rounding across all components ensures the interface feels cohesive and intentionally designed.

## Components

### Status Badges
Used to communicate the life cycle of an order. They consist of a light-tinted background with a high-contrast text label.
- **Preparing:** Amber background / Dark Amber text.
- **Ready:** Indigo background / White text.
- **On the Way:** Primary Blue background / White text.
- **Delivered:** Green background / White text.

### Action Cards (Courier)
Order cards for the courier app must feature the destination address in **Headline-SM**, a prominent status badge in the top right, and a primary action button (e.g., "Start Delivery") at the bottom.

### Data Tables (Vendor)
Used for inventory and order management. Use a "Zebra-stripe" pattern on hover for row tracking. Headers are styled with **Label-MD** in secondary slate.

### Input Fields
Strict rectangular fields with 8px rounding. Focus states must use a 2px solid border in Primary Blue with a subtle 4px outer glow of the same color.

### Primary Action Button
Solid Primary Blue background with white text. High-contrast, bold weight. On mobile, these should be full-width (block level) for easier interaction while on the move.