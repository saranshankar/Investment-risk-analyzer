# TipCheck — Frontend UI/UX Redesign Specification
**Product Type:** Consumer Financial Safety & Claim Verification Assistant  
**Theme:** Pure Light Theme  
**Status:** Implementation Blueprint v2.0  

---

## 1. Executive Summary & Design Philosophy

TipCheck is an AI-assisted evidence engine that verifies investment tips against official SEBI records. The previous interface resembled a dark, cyber-themed AI developer dashboard with neon cyan accents, glow effects, floating cards, and technical jargon ("Schema JSON Agent", "Inference", "Strands Pipeline").

This redesign transforms TipCheck into a **human-designed, calm, trustworthy consumer financial safety tool** (similar to modern consumer fintech products like Stripe, Wise, Wealthfront, or Apple Support). Normal retail investors, students, and first-time earners can instantly understand, trust, and use it without any AI or cybersecurity background.

### Core Principles
1. **Calm & Trustworthy (Not Alarmist):** Replaces screaming neon red cards and flashing sirens with dignified, restrained visual signals. Even high-risk messages are presented calmly and factually.
2. **Human-Centered Language:** Replaces "Agent 1", "Token processing", and "Run Strands Pipeline" with natural human steps: *"Reading the message"*, *"Finding the claims"*, *"Checking official records"*, and *"Putting everything together"*.
3. **Evidence-First Hierarchy:** De-emphasizes the raw mathematical score (e.g., "Score 70/100") and elevates the clear plain-English conclusion, side-by-side evidence comparison (*"Message says"* vs. *"We verified"*), and actionable practical steps (*"Before you send any money"*).
4. **Light Theme Foundation:** Soft warm white backgrounds, crisp white content surfaces, deep charcoal text, muted borders, and a refined deep teal accent (`#0f766e` / `#0d9488`).
5. **No Card Overuse:** Information is structured through typography, whitespace, subtle dividers, and clean grouping rather than nesting cards within cards.

---

## 2. Design Token System (`index.css`)

### Color Palette (Light, Low-Saturation, Accessible)
- **Background (Page):** `#f8fafc` (Warm, neutral off-white; clean and easy on the eyes)
- **Surface (Primary Content):** `#ffffff` (Pure white for readability)
- **Surface Secondary (Muted Panels):** `#f1f5f9` (Subtle container tone for code/quotes)
- **Text Primary:** `#0f172a` (Deep slate charcoal, optimal WCAG AAA contrast)
- **Text Secondary:** `#475569` (Slate gray for descriptions and body copy)
- **Text Muted:** `#94a3b8` (Subtle tertiary hints, timestamps, icons)
- **Borders & Dividers:** `#e2e8f0` (Subtle, crisp slate border)
- **Border Focus/Active:** `#0f766e` (Refined teal)

### Primary Accent
- **Primary Teal:** `#0f766e` (Deep, credible financial teal)
- **Primary Hover:** `#115e59`
- **Primary Subtle / Tint:** `#f0fdfa` (Soft mint-teal background tint)
- **Primary Border Tint:** `#ccfbf1`

### Semantic Risk & Status Colors (Soft, Restrained)
- **Low Concern / Verified (Green):**
  - Text/Icon: `#15803d` (Forest green)
  - Surface: `#f0fdf4`
  - Border: `#bbf7d0`
- **Needs Verification / Warning (Amber):**
  - Text/Icon: `#b45309` (Warm ochre/amber)
  - Surface: `#fffbeb`
  - Border: `#fde68a`
- **High-Risk Indicators (Red):**
  - Text/Icon: `#b91c1c` (Restrained crimson)
  - Surface: `#fef2f2`
  - Border: `#fecaca`
- **Informational (Blue):**
  - Text/Icon: `#1d4ed8`
  - Surface: `#eff6ff`
  - Border: `#bfdbfe`

### Typography
- **Headings & Brand:** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, sans-serif
- **Body:** `Inter`, sans-serif (15px/16px baseline, 1.6 line height for effortless reading)
- **Monospace (Only for Registration Numbers & Codes):** `JetBrains Mono`, monospace (used sparingly)

### Radii & Shadows
- **Border Radii:** Restrained (4px subtle, 8px inputs/buttons, 12px main panels, 9999px pills only where semantic).
- **Shadows:** Soft, natural elevation (`0 1px 3px rgba(0,0,0,0.05)`, `0 4px 12px rgba(0,0,0,0.04)`). No glowing neon halos or harsh dark dropshadows.

---

## 3. Component Transformation Plan

### 1. Navigation (`Navbar.tsx`)
- **Visuals:** Clean white bar with a soft bottom border (`#e2e8f0`). No blur-transparency over dark background.
- **Brand:** Calm teal shield mark with deep charcoal "TipCheck" and a quiet subtitle: *"Investment message verification"*.
- **Controls:** Minimal, clean links: *"Check a tip"*, *"Sample tips"*, *"Directory search"*, *"How it works"*, and *"History"* with a subtle counter badge.

### 2. Main Check Experience (`Hero.tsx` + `Analyzer.tsx`)
- **Headline:** 
  > **Check an investment message before you act on it.**  
  > *Paste a message or upload a screenshot. We'll help you verify the claims and point out anything worth checking.*
- **Input Area:** Single humanized, generous text box with comfortable padding:
  - Clean tabs: **[ Paste message ]** and **[ Upload screenshot ]**
  - Large placeholder: *"Paste the investment message you received on WhatsApp, Telegram, or SMS..."*
  - Clean action button: **Check this message**
  - Affordances: Clear button, clean character indicator, drag-and-drop file zone with clear JPEG/PNG badges.
- **Sample Presets ("Not sure what to paste?"):**
  - Replaces cyber badges with 3 realistic, relatable example buttons:
    1. *"High-risk example (Guaranteed returns + fake SEBI number)"*
    2. *"Needs verification example (Valid SEBI number but aggressive promise)"*
    3. *"Low-concern example (Legitimate research note with risks disclosed)"*
  - Clicking any example loads realistic text and triggers the check smoothly.

### 3. Humanized Progress State (`PipelineSteps.tsx`)
- Appears smoothly during processing.
- Replaces tech jargon with simple, natural steps:
  1. *Reading the message*
  2. *Finding the claims*
  3. *Checking official records*
  4. *Looking for warning signs*
  5. *Putting everything together*
- Subtle progress indicator with calm green/teal checkmarks as each completes.

### 4. Results Experience (`VerdictView.tsx`)
Redesigned with the human information hierarchy:
1. **Result Header:** Calm status banner:
   - For High-Risk: Light rose tint (`#fef2f2`), restrained red indicator, clear calm title: **High-risk indicators**, subtitle: **"I'd pause before acting on this message."** with a brief 2-sentence summary.
   - For Needs Verification: Light amber tint (`#fffbeb`), amber indicator, title: **Needs verification**, subtitle: **"Some claims in this message could not be confirmed."**
   - For Low Concern: Light mint tint (`#f0fdf4`), green indicator, title: **Low concern**, subtitle: **"The registration matches official SEBI records and no manipulation patterns were found."**
   - No giant numerical "Score 87/100" billboard. Numeric tally is placed as secondary reference.
2. **Plain-English Explanation:** What this means in plain language, readable in 10 seconds.
3. **Structured Evidence Section:** Clear labels without card explosion:
   - **Message says:** (Quoted text of what the tip claimed)
   - **We verified:** (Matching official registry record, active status, snapshot date)
   - **We couldn't verify:** (Unregistered number, mismatched entity name, or personal payment handle)
   - **Warning signs:** (Guaranteed returns, artificial urgency, payment before service)
4. **Editable Confirmation:** Collapsible or subtle inline edit allowing the user to correct OCR typos in the registration number or name and re-check.
5. **"Before you send any money" Section:** Prominent, practical numbered advice with official links to SEBI SCORES and Cyber Crime Portal.
6. **Regulatory Disclaimer:** Quiet, dignified footer reminding users that TipCheck provides verification signals and does not constitute financial advice.

### 5. Modals & Drawers (`RegistrySearchModal`, `MethodologyModal`, `HistoryDrawer`)
- Replaced with crisp light-themed dialogs.
- Clean typography, high contrast, smooth closing transitions, and friendly empty states.

---

## 4. Preservation of Functionality & APIs

The redesign strictly touches **frontend UI/UX presentation only**:
- All API contracts (`/analyze/text`, `/analyze/image`, `/verification`, `/registry/search`, `/system/status`, `/api/sample-cases`) remain unchanged.
- All backend data models (`ExtractedClaim`, `VerificationResult`, `RiskSignal`, `Evidence`, `FinalVerdict`) remain intact.
- OCR upload flow, drag-and-drop, reverification, history tracking, and sample case selection are preserved 100%.
- All 20 automated tests will continue to pass without modification.
