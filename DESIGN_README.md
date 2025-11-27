# Spectra UI/UX Design Blueprint

> **Version:** 1.0.0  
> **Status:** Production Ready  
> **Platform:** Cross-Platform (Web, iOS, Android)

---

## 1. Executive Summary

**Spectra** is a premium, high-performance streaming platform designed to deliver unlimited entertainment with zero friction. The design philosophy centers on **"Cinematic Immersion"**—the interface recedes to let the content shine, using deep blacks, vibrant accents, and fluid motion to create a premium theater-like experience on any device.

### Core Design Values
1.  **Content First:** UI elements are minimal and unobtrusive. Artwork takes center stage.
2.  **Instant Gratification:** Zero-click playback where possible, instant search, and rapid filtering.
3.  **Universal Access:** A fully responsive design that feels native on a 6-inch phone and a 32-inch monitor.
4.  **Visual Depth:** Use of glassmorphism, subtle gradients, and layering to create hierarchy without clutter.

---

## 2. Brand Identity & Assets

### 2.1 Logo Usage
The Spectra logo is the anchor of our brand identity.

*   **Primary Logo:** `C:\Users\med\Desktop\scrap\spectra-logo.png`
*   **Placement:**
    *   **Desktop:** Top-left of the sticky header (24px height).
    *   **Mobile:** Centered in the top app bar or top-left depending on view depth.
    *   **Splash Screen:** Centered, pulsing animation (scale 1.0 to 1.1).
*   **Safe Area:** Minimum 16px padding on all sides.
*   **Do's:** Use on dark backgrounds.
*   **Don'ts:** Do not rotate, recolor, or place on busy backgrounds without a scrim.

### 2.2 Color Palette
A dark-themed palette optimized for OLED screens and low-light viewing.

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Void Black** | `#0f0f0f` | Main background (App Body) |
| **Deep Charcoal** | `#1a1a1a` | Cards, Modals, Sidebars |
| **Spectra Green** | `#10b981` | Primary Action (Play, Confirm), Brand Accent |
| **Neon Teal** | `#2dd4bf` | Gradients, Hover States, "New" Badges |
| **Text White** | `#ffffff` | Primary Headings |
| **Text Grey** | `#a3a3a3` | Metadata, Descriptions, Secondary Text |
| **Error Red** | `#ef4444` | Error states, "Remove" actions |
| **Gold** | `#fbbf24` | Star Ratings, Premium Badges |

### 2.3 Typography
**Font Family:** 'Inter' or 'Outfit' (Sans-serif, modern, geometric).

*   **Display XL:** 32px/40px (Hero Titles)
*   **Heading L:** 24px/32px (Section Headers)
*   **Body M:** 16px/24px (Synopses, Main Text)
*   **Body S:** 14px/20px (Metadata, Buttons)
*   **Caption:** 12px/16px (Badges, Legal)

---

## 3. Design System Components

### 3.1 Buttons
*   **Primary (CTA):** Solid Spectra Green background, White text, rounded corners (8px). Hover: Brighten + Scale 1.02.
*   **Secondary:** Transparent background, White border (1px), White text. Hover: White background (10% opacity).
*   **Icon Button:** Circular, transparent or semi-transparent background. Used for "Add to List", "Like".

### 3.2 Cards (The "Poster" Component)
*   **Aspect Ratio:** 2:3 (Standard Movie Poster).
*   **Interaction:**
    *   **Default:** Rounded corners (12px), subtle shadow.
    *   **Hover (Desktop):** Scale 1.05, border glow (Spectra Green), reveal "Play" and "Details" overlay.
    *   **Tap (Mobile):** Navigate to Details.
*   **Badges:** Top-right corner overlay (e.g., "HD", "Dubbed", "New").

### 3.3 Input Fields
*   **Search/Filter:** Deep Charcoal background, rounded pills (20px radius).
*   **Focus State:** 2px Spectra Green border.
*   **Placeholder:** Text Grey.

### 3.4 Navigation
*   **Desktop Header:** Sticky, blurred glass effect (`backdrop-filter: blur(10px)`). Links: Home, Movies, TV Shows, Animation, My List.
*   **Mobile Tab Bar:** Fixed bottom. Icons: Home, Search, Browse, My List, Profile.

---

## 4. User Journeys & Screens

### 4.1 Onboarding & Authentication
*   **Splash Screen:** Logo animation on Void Black.
*   **Welcome/Landing:** "Stream Unlimited. Free." Hero background video.
*   **Auth Modal:** Glassmorphism overlay. Tabs for Login/Register. Social login buttons (Google, Apple).

### 4.2 Home & Discovery (The "Lobby")
*   **Hero Carousel:** Full-width, immersive backdrop. Auto-play trailer (muted) after 2s hover.
    *   *Elements:* Title logo, Synopsis (truncated), "Watch Now" (Primary), "More Info" (Secondary).
*   **Horizontal Rails:** "Trending Now", "Top 100", "New Releases", "Continue Watching".
*   **Section Headers:** Bold title left, "View All" chevron right.

### 4.3 Browsing & Filtering (Movies, TV, Animation)
*   **Layout:** Responsive Grid (2 cols mobile, 4 cols tablet, 6+ cols desktop).
*   **Filter Bar:** Sticky top bar below header.
    *   **Sort:** Pill selector (For You, Hottest, Latest).
    *   **Dropdowns:** Genre, Year, Country (Full 30+ country list).
    *   **Range Slider:** Rating (0-10) with live value tooltip.
    *   **Quick Toggles:** Language/Dub buttons (French, Hindi, Arabic, etc.) for rapid switching.
*   **Pagination:** "Load More" infinite scroll trigger or clear "Next/Prev" buttons at bottom.

### 4.4 Content Details (The "Shrine")
*   **Layout:**
    *   **Backdrop:** High-res image with gradient fade to black at bottom.
    *   **Poster:** Floating left (Desktop) or centered top (Mobile).
    *   **Metadata:** Title, Year, Rating (Star icon), Duration, Quality Badge (4K/HD), Dub Badge.
    *   **Actions:** Big "Play" button, "Trailer", "Add to List", "Share".
    *   **Synopsis:** Expandable text block.
    *   **Cast & Crew:** Horizontal scroll of circular avatars.
    *   **Seasons/Episodes (TV Only):** Dropdown for Season. Vertical list for Episodes with thumbnail, title, duration.
    *   **Related:** "You May Also Like" grid.

### 4.5 The Player (The "Cinema")
*   **Interface:** Minimalist. Controls fade out after 3s of inactivity.
*   **Controls:** Play/Pause, 10s Skip Back/Fwd, Scrubber timeline (with preview thumbnails), Volume, Fullscreen.
*   **Settings Menu (Gear Icon):**
    *   **Quality:** Auto, 1080p, 720p, 480p.
    *   **Audio:** Track selection (Original, Dubs).
    *   **Subtitles:** Language selection, Size/Color customization.
    *   **Server:** Source selection (VidSrc, Viper, etc.) if primary fails.

### 4.6 Account & Settings
*   **Profile:** Avatar management, viewing history.
*   **Subscription:** "Go Premium" (if applicable) - Pricing cards, Payment method management.
*   **App Settings:**
    *   **Appearance:** Dark/Light (Default Dark).
    *   **Playback:** Autoplay next episode, Default quality.
    *   **Downloads:** Manage offline content (Mobile).

---

## 5. Responsive & Adaptive Behavior

### 5.1 Breakpoints
*   **Mobile:** < 640px (100% width containers, stacked layouts, bottom nav).
*   **Tablet:** 640px - 1024px (Grid 3-4 cols, side padding 24px).
*   **Desktop:** > 1024px (Grid 6 cols, max-width container 1400px centered).

### 5.2 Mobile Specifics
*   **Touch Targets:** Minimum 44x44px for all interactive elements.
*   **Gestures:** Swipe right to go back. Swipe down to close modals. Double-tap player sides to skip.
*   **Haptics:** Subtle vibration on success actions (e.g., Adding to list).

---

## 6. Accessibility (a11y)

*   **Contrast:** All text meets WCAG AA standard (4.5:1 contrast ratio).
*   **Keyboard Nav:** Full tab support. Focus rings visible (Spectra Green glow).
*   **Screen Readers:** All images have `alt` text. Icons have `aria-label`.
*   **Reduced Motion:** Respects system "Reduce Motion" settings (disables auto-play, simplifies transitions).

---

## 7. Technical Architecture (UX Perspective)

*   **SPA Navigation:** Seamless page transitions without full reloads (using History API).
*   **State Management:** Filters and scroll position preserved when navigating back.
*   **Lazy Loading:** Images load as they enter viewport. "Blur-up" technique for placeholders.
*   **Error Handling:**
    *   **404:** Friendly "Lost in Space" graphic with "Go Home" button.
    *   **No Results:** "No matches found. Try adjusting filters."
    *   **Stream Fail:** "Source unavailable. Switching to backup..." toast notification.

---

## 8. Implementation Checklist (Design)

- [ ] **Global:** Setup CSS variables for Colors and Typography.
- [ ] **Components:** Build Button, Card, Modal, Input primitives.
- [ ] **Layout:** Implement Grid and Flexbox utilities.
- [ ] **Pages:**
    - [ ] Home (Hero + Rails)
    - [ ] Browsers (Movies, TV, Animation) with Filter Logic
    - [ ] Details (Movie & TV variants)
    - [ ] Player (Custom UI overlay)
    - [ ] 404 & Error States
- [ ] **Assets:** Optimize Logo and Placeholder images.

---

*Spectra Design Document - Confidential - Internal Use Only*
