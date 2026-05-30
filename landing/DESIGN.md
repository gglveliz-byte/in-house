---
name: BlueExpress Core
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#00658d'
  on-secondary: '#ffffff'
  secondary-container: '#2dbcfe'
  on-secondary-container: '#004866'
  tertiary: '#381300'
  on-tertiary: '#ffffff'
  tertiary-container: '#592300'
  on-tertiary-container: '#d8885c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#c6e7ff'
  secondary-fixed-dim: '#82cfff'
  on-secondary-fixed: '#001e2d'
  on-secondary-fixed-variant: '#004c6b'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#723610'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system for this delivery service is built on the pillars of **reliability, speed, and precision**. It utilizes a refined **Minimalist** aesthetic to reduce cognitive load for users who are often in a hurry to track or book shipments. 

The visual narrative avoids unnecessary ornamentation, favoring heavy whitespace to create a "breathable" interface that feels efficient and trustworthy. By combining professional corporate foundations with modern, approachable geometry, the UI evokes an emotional response of being "in safe hands" while remaining technologically forward-thinking.

## Colors

The palette is anchored by **Deep Navy (#003366)**, representing the traditional stability and institutional trust of a logistics leader. This is contrasted by **Vibrant Cyan (#00AEEF)**, used sparingly as a high-visibility accent for primary actions and "live" status updates (e.g., "Out for Delivery").

- **Primary (Deep Navy):** Use for headers, primary branding, and high-level navigation.
- **Accent (Vibrant Cyan):** Reserved for call-to-action buttons, active tracking indicators, and progress bars.
- **Backgrounds:** A tiered system of White (#FFFFFF) for cards and Off-White (#F8FAFC) for page backgrounds to maintain clarity.
- **Feedback:** Use standard semantic greens for "Delivered" and reds for "Action Required" or "Delayed."

## Typography

This design system utilizes **Inter** for its exceptional legibility and neutral, systematic tone. The type hierarchy is designed to be highly functional, prioritizing the "Tracking Number" and "Status" as the primary focal points.

- **Weight Usage:** Use Semi-Bold (600) for headlines and labels to ensure hierarchy against the clean background.
- **Scale:** On mobile, headlines should scale down by approximately 25% to prevent awkward text wrapping in tracking dashboards.
- **Letter Spacing:** Apply slight negative tracking to large display headings to maintain a compact, premium feel.

## Layout & Spacing

The layout follows a **Fluid Grid** model built on an 8px base unit (with a 4px sub-grid for tight components). 

- **Desktop:** 12-column grid with 24px gutters and wide 64px outer margins to enforce a centered, minimalist look.
- **Mobile:** 4-column grid with 16px margins.
- **Rhythm:** Vertical rhythm should be generous. Group related information (like "Shipper" and "Receiver" details) with 16px spacing, but separate distinct sections with at least 48px to prevent the UI from feeling cluttered.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. This creates a physical sense of "parcels" moving through the interface.

- **Shadows:** Use extremely soft, low-opacity shadows (e.g., `box-shadow: 0 4px 20px rgba(0, 51, 102, 0.08)`). The shadow color should be slightly tinted with the primary Navy to avoid a "dirty" grey appearance.
- **Surfaces:** Use the "Surface-Container" approach. The background is `#F8FAFC`, while active cards and input fields are pure `#FFFFFF`.
- **Transitions:** Elevation should subtly increase on hover for interactive cards to provide tactile feedback.

## Shapes

The shape language is **Rounded**, using a 12px base radius for cards and containers. This softens the professional tone, making the service feel approachable and modern.

- **Standard Radius:** 12px for standard cards and large containers.
- **Button Radius:** 12px to match cards, or 50% height for small status chips.
- **Form Inputs:** 8px radius to maintain a slightly more structured look for data entry.

## Components

- **Buttons:** Primary buttons use the Vibrant Cyan background with White text. Secondary buttons use a Navy outline with Navy text.
- **Tracking Cards:** The core component. Features a 12px border radius, subtle ambient shadow, and a progress bar using the Cyan accent.
- **Input Fields:** Use an 8px radius with a light grey border (#E2E8F0). On focus, the border should change to Cyan with a soft outer glow.
- **Status Chips:** Small, pill-shaped indicators. Use low-saturation background tints (e.g., light blue for "Pending", light green for "Delivered") with high-contrast text.
- **Steppers:** Vertical steppers for tracking history should use a solid Cyan dot for the current location and a muted Navy line for the path traveled.