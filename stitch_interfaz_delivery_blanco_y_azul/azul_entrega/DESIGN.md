---
name: Azul Entrega
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#424752'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#727784'
  outline-variant: '#c2c6d4'
  surface-tint: '#115cb9'
  primary: '#003f87'
  on-primary: '#ffffff'
  primary-container: '#0056b3'
  on-primary-container: '#bbd0ff'
  inverse-primary: '#acc7ff'
  secondary: '#526069'
  on-secondary: '#ffffff'
  secondary-container: '#d3e2ed'
  on-secondary-container: '#56656e'
  tertiary: '#404242'
  on-tertiary: '#ffffff'
  tertiary-container: '#575959'
  on-tertiary-container: '#cfd0d0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004491'
  secondary-fixed: '#d6e5ef'
  secondary-fixed-dim: '#bac9d3'
  on-secondary-fixed: '#0f1d25'
  on-secondary-fixed-variant: '#3b4951'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
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
  label-sm:
    fontFamily: Inter
    fontSize: 11px
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
  base: 8px
  margin-mobile: 20px
  gutter-mobile: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for a high-velocity mobile commerce environment where reliability and speed are paramount. The brand personality is professional yet accessible, moving away from the aggressive urgency of competitors toward a more trustworthy, "utility-first" experience.

The visual style follows a **Modern Corporate** aesthetic with a strong emphasis on whitespace and clarity. It utilizes subtle depth cues and a refined color palette to reduce cognitive load during the food and grocery selection process. The emotional response should be one of confidence and ease, ensuring the user feels the service is dependable and the interface is "invisible" to their goal of ordering.

## Colors
The palette is rooted in a "Corporate Blue" that signals institutional trust and efficiency. 

- **Primary (#0056B3):** Used for critical actions (CTAs), progress indicators, and active states.
- **Secondary / Highlight (#E3F2FD):** A soft light blue used for background tints in chips, selected states, and subtle iconography containers.
- **Neutral Background (#F8F9FA):** The primary canvas color to ensure the "Clean White" of the cards and components pop with sufficient contrast.
- **Surface (#FFFFFF):** Reserved for interactive elements like cards and input fields to create a clear "layered" hierarchy against the neutral background.

## Typography
The design system utilizes **Inter** for all roles to leverage its exceptional legibility and systematic feel on mobile screens. 

Headline levels use tighter letter spacing and heavier weights to provide clear entry points for the eye. The `label-md` role is specifically designed for category headers and metadata (e.g., "ENVÍO GRATIS"), using uppercase and increased tracking for distinctness at small sizes. All typography should prioritize Spanish character legibility, ensuring accents and "ñ" do not disrupt line heights.

## Layout & Spacing
This design system employs an **8pt Grid System** to maintain mathematical harmony across all components.

For mobile layouts, we use a fluid grid with **20px side margins** to provide sufficient breathing room, preventing the UI from feeling cramped. Content modules (like restaurant lists) should use **16px gutters**. Vertical rhythm is managed through stack variables: use `stack-sm` for related text items (title/subtitle), `stack-md` for internal card padding, and `stack-lg` to separate distinct sections on the home screen.

## Elevation & Depth
Hierarchy is established through **Tonal Layering** and **Ambient Shadows**. 

The base layer is the `neutral` gray (#F8F9FA). Interactive components like cards and search bars are placed on the `tertiary` white (#FFFFFF) surface. 

To suggest interactivity without clutter, we use a single "Soft Shadow" style: 
- **Character:** 0px offset-x, 4px offset-y, 12px blur, 6% opacity black tint. 
This creates a subtle lift that distinguishes a restaurant card from the background without the heavy, dated look of traditional skeuomorphism.

## Shapes
The shape language is defined as **Rounded**, utilizing a 0.5rem (8px) base radius. 

This level of rounding strikes a balance between professional precision and approachable friendliness. 
- **Standard components (Buttons, Cards, Inputs):** 8px corner radius.
- **Large components (Banners):** 16px (rounded-lg).
- **Interactive UI Pills (Category Bubbles, Search Bar):** Fully rounded (pill-shaped) to maximize the "tappable" affordance.

## Components

### Buttons
- **Primary:** Solid Corporate Blue background with White text. Full-width on mobile for "Finalizar Pedido" actions.
- **Secondary:** Light Blue background (#E3F2FD) with Corporate Blue text. Used for "Ver más" or "Añadir al carrito" within list views.

### Search Bar
- **Style:** A prominent white pill-shaped container with a subtle soft shadow. 
- **Details:** Includes a gray "Buscar comida o locales" placeholder and a Corporate Blue search icon. Stays fixed to the top during scroll for immediate access.

### Category Bubbles
- **Style:** Circular containers with a light gray or secondary blue background.
- **Layout:** Horizontal scrolling list. Icons are clean, simplified line art. Labels are in `label-sm` or `body-md` positioned directly below the icon.

### Restaurant Cards
- **Structure:** A white card with 8px radius and soft shadow. 
- **Visuals:** Full-bleed image at the top (aspect ratio 16:9), followed by a padding section containing the title (Headline-sm), rating (with a small star icon), and delivery time/cost metadata in `body-md`.

### Input Fields
- **Style:** White background with a 1px border (#DEE2E6). On focus, the border changes to Corporate Blue.
- **Labels:** Floating labels or positioned clearly above the field in `label-md`.

### Chips / Badges
- **Style:** Small 4px rounded rectangles used for "Descuento" or "Nuevo". High contrast colors like a soft green for "Abierto" or secondary blue for "Envío Gratis".