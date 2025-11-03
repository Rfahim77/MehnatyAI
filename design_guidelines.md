# Design Guidelines: AI-First Career Agent (Arabic/KSA)

## Design Approach

**Selected Framework:** Material Design adapted for Arabic RTL + Conversational AI patterns inspired by ChatGPT and Notion AI

**Rationale:** This is a utility-focused productivity tool requiring clear information hierarchy, consistent patterns, and efficient workflows. Material Design provides robust RTL support and component libraries while allowing customization for the conversational interface.

---

## Typography System

### Font Families
- **Arabic Primary:** "IBM Plex Sans Arabic" (comprehensive Arabic support, professional)
- **English Fallback:** "Inter" for any English text
- **Monospace:** "IBM Plex Mono" for code/JSON previews

### Hierarchy
- **Hero/Welcome:** 2xl (24px) regular for Arabic microcopy
- **Section Headers:** xl (20px) semibold
- **Card Titles:** lg (18px) medium
- **Body Text:** base (16px) regular, line-height 1.75 for Arabic readability
- **Micro Labels:** sm (14px) medium
- **Buttons:** base (16px) medium

---

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 3, 4, 6, 8, 12, 16** for consistent rhythm
- **Component padding:** p-4, p-6, p-8
- **Section spacing:** space-y-6, space-y-8
- **Card gaps:** gap-4, gap-6
- **Button padding:** px-6 py-3

### Grid Structure
- **Container:** max-w-7xl centered, px-4 md:px-6
- **Chat Interface:** max-w-4xl for conversation column
- **Cards Display:** Grid when showing multiple outputs (2-3 columns on desktop, single on mobile)

---

## Core Interface Components

### Start Screen (Landing)
**Layout:** Full-viewport centered welcome
- RTL logo/brand top-left (Arabic convention)
- Centered hero text: "مرحباً! كيف تحب نبدأ؟"
- 8 option cards in 2x4 grid (desktop), single column (mobile)
- Each card: emoji icon + title + 1-line description

**Option Cards:**
- Rounded corners (rounded-xl)
- Border treatment with hover lift effect
- Icon size: 2.5rem, title below
- Equal height cards (h-32)
- Generous padding (p-6)

### Conversational Interface
**Layout Pattern:** ChatGPT-inspired split
- **Left Panel (desktop only, 280px fixed):** 
  - Session history/topics
  - Language toggle (العربية/English)
  - Settings/export access
- **Main Chat Column (max-w-4xl centered):**
  - Messages list with generous spacing (space-y-6)
  - User messages: right-aligned (RTL), max-w-3xl
  - AI messages: left-aligned (RTL), max-w-3xl
  - Input bar fixed bottom: full-width with shadow

**Message Bubbles:**
- User: subtle border, no background fill
- AI: light background fill, border
- Padding: px-6 py-4
- Rounded-2xl corners
- Typography: base size, 1.75 line-height

### Input Bar
- Sticky bottom, backdrop-blur-lg
- Container: p-4, rounded-3xl
- Textarea: auto-expand to 5 lines max
- Right side (RTL): Send button (icon)
- Left side: Upload button (when applicable), mic icon
- Border treatment matches theme

### Output Cards (Pinned Results)
**Card Types:** Resume drafts, JD matches, career plans
- Full-width in chat flow, max-w-3xl
- Header: title + metadata (e.g., "السيرة الذاتية - نسخة 1")
- Content preview: truncated with "عرض المزيد" expand
- Action bar at bottom:
  - Primary actions: تنزيل DOCX, تنزيل PDF
  - Secondary: إعادة الصياغة, أقوى أفعال, نبرة نجدية
  - Icon + text buttons, horizontal scroll on mobile
- Border + subtle shadow
- Rounded-xl

### Quick Action Buttons
Floating suggestion chips above input when contextual:
- Pill-shaped (rounded-full)
- Small size (text-sm, px-4 py-2)
- Horizontal scrollable row
- Examples: "أضف خبرة", "راجع التواريخ", "اقترح مهارات"

---

## File Upload Component

**Trigger State:** Dashed border card (when upload requested)
- Center: upload icon (3rem)
- Text: "اسحب الملف أو اضغط للاختيار"
- Supported formats hint: PDF, DOCX, صور
- Rounded-xl, p-8

**Processing State:** 
- Spinner + filename
- Progress indicator for OCR extraction

**Success State:**
- Checkmark icon
- File details (size, type)
- "تم" confirmation

---

## Data Display Components

### Resume JSON Preview
- Collapsible sections (الخبرة, التعليم, المهارات)
- Each entry: card within card
- Edit icons next to editable fields
- Validation errors: inline, red text with icon

### Skills Gap Matrix
Table layout:
- Headers: المهارة, المستوى الحالي, الأولوية
- Progress bars for current level (0-5 scale)
- Priority badges (A/B/C): pill shaped, color-coded indicators

### Career Path Timeline
Vertical stepper (Material Design pattern, RTL adapted):
- Nodes for each role/milestone
- Connecting lines
- Month labels
- Expandable cards for details per step

---

## Mobile Adaptations

- Hide left sidebar, use hamburger menu
- Single column cards
- Sticky bottom input (shorter)
- Action buttons: icon-only with tooltips
- Horizontal scroll for action bars

---

## RTL Considerations

- **Text alignment:** Right-aligned default for Arabic
- **Icons:** Flip directional icons (arrows, back buttons)
- **Form fields:** Labels right-aligned above inputs
- **Navigation:** Top-right to top-left flow
- **Layouts:** Grid/flex direction reversed
- **Shadows:** Adjust for right-to-left light source convention

---

## Interaction Patterns

### Conversational Flow
- Smooth scroll to new messages
- Typing indicator (3 dots) for AI responses
- Message timestamps: subtle, relative time
- Edit previous message: icon appears on hover

### Card Interactions
- Expand/collapse: chevron icon (RTL appropriate)
- Download: immediate trigger, success toast
- Regenerate: modal confirmation if major changes

### Empty States
- Centered illustration (simple line art)
- Encouraging Arabic microcopy
- Primary action button

---

## Accessibility

- **Focus indicators:** 2px outline, high contrast
- **Button min-height:** 44px touch targets
- **Form labels:** Always visible (no placeholder-only)
- **Error messages:** Aria-live regions for screen readers
- **Keyboard navigation:** Tab order respects RTL
- **Color contrast:** WCAG AA minimum for all text

---

## Animation Strategy

**Use sparingly:**
- Message fade-in: 200ms ease
- Card expand/collapse: 300ms ease-out
- Button hover: subtle scale (1.02)
- **No:** Parallax, complex scroll animations, distracting motion

---

## Images

**Hero Section:** No large hero image for this application. The start screen is text and option cards focused.

**Icons:** Use Material Icons or Heroicons via CDN, ensure RTL variants where needed (arrows, navigation).

**Empty States:** Simple SVG illustrations for "no resume yet", "no messages", "upload prompt" - keep minimal and on-brand.