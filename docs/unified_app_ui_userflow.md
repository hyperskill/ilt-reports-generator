# Unified App UX — “Performance Segmentation” & “Dynamic/Easing Segmentation”
*A product-level description of screens, flows, and states (no technical requirements).*

---

## 0) Concept & Navigation
The app supports **two complementary analysis modes** that share a single onboarding flow and data workspace:

- **Performance Segmentation** — builds a static performance profile per learner (grades, attempts, persistence, meeting attendance) and assigns a **simple segment** (e.g., *Leader efficient*, *Balanced middle*, etc.).  
- **Dynamic/Easing Segmentation** — analyzes **temporal activity** and classifies each learner’s cumulative behavior as a **CSS-like easing** (*linear*, *ease*, *ease-in*, *ease-out*, *ease-in-out*).

**Top-level navigation**
- **Header**: App name, Dataset switcher (if multiple runs), Help (“What does this mean?”), Profile.
- **Left rail**:  
  - **Home** (Upload → Review → Exclusions → Settings)  
  - **Results**  
    - **Performance Segmentation**  
    - **Dynamic/Easing Segmentation**  
  - **Explorer** (comparison views for both modes)  
  - **Exports**

A **mode switch** lives on the Results screen to quickly jump between **Performance** and **Dynamic/Easing** without leaving the dataset context.

---

## 1) Home: Upload
**Screen: “Get Started”**
- Short explanation of what each mode produces.
- Four labeled upload tiles:
  - `grade_book.csv` (Required)
  - `learners.csv` (Required)
  - `submissions.csv` (Required)
  - `meetings.csv` (Optional, recommended)
- Each tile shows: file name, size/row count, status chip (Required/Optional), actions (**Replace**, **Remove**).  
- **Primary CTA:** “Continue”  
- **Secondary CTA:** “See sample files” (modal with small examples).

**States**
- *Empty*: dashed dropzones with “Drag & drop or click” hint.  
- *Uploading*: spinner inside the tile, filename ghosted.  
- *Success*: green check, row count, “Just now” timestamp.  
- *Missing required file*: red chip + inline “This file is required.”  
- *Obvious mismatch (e.g., no user_id)*: red chip + “Unrecognized structure; please check columns.”

---

## 2) Review & Column Check
**Goal:** ensure the app recognized the key fields and date formats used by both modes.

**Screen: “Review & Confirm”**
- Compact previews (10 rows) for each file, with recognized columns highlighted: `user_id`, `total`, `first_name/last_name`, `status`, `timestamp`, and meeting columns (`[dd.mm.yyyy] Event`).
- “Detected mappings” as read-only chips per file.
- **Issues panel** with friendly messages (e.g., “No timestamps found → Dynamic mode will default to Weekly buckets”).  
- **Primary CTA:** “Looks good”  
- **Secondary:** “Back” to re-upload.

**States**
- *All good*: green banner “All required fields recognized.”  
- *Warnings*: amber banner with consequences for each mode.  
- *Blocking*: red banner; “Looks good” disabled until fixed.

---

## 3) Exclusions
**Screen: “Exclude IDs”**
- Tokenized input field for `user_id` with chip tags; paste-friendly.
- Inline counter: “Excluding N learners” (updates live).
- Secondary option: “Upload a list” (textarea or CSV snippet).  
- **Primary CTA:** “Apply exclusions”  
- **Secondary CTA:** “Skip for now”

**States**
- *Empty*: hint “You can always exclude later from Results.”  
- *With entries*: removable chips, count badge.

---

## 4) Display Settings (Shared)
**Screen: “Display Settings”**
- **Time bucketing**: Daily / Weekly (Default: Daily; recommended Weekly if sparse timestamps). *(Both modes use this for charts; Dynamic mode relies on it for curves.)*
- **Smoothing**: Off / Light / Strong (Short, non-technical descriptions). *(Affects Dynamic mode curves; optional for Performance charts.)*
- **Meetings usage**: Toggle “Include meetings in activity (Dynamic mode)” and “Use meetings in segmentation (Performance mode)” if available.
- Short tip cards explain how these choices will change visualizations or segments.  
- **Primary CTA:** “Build results”  
- **Secondary:** “Back”

**States**
- *Contextual hints*: e.g., “Weekly view recommended: timestamps are sporadic.”

---

## 5) Processing
**Screen: “Crunching your data…”**
- Progress steps: Merge data → Compute metrics → Build curves → Assign segments.
- Non-technical log strip (e.g., “Parsed 12 meeting columns; 9 with valid dates”).  
- On finish → auto-advance to **Results**.

**States**
- *Success*: checkmark, summary (“124 learners processed”).  
- *Partial*: yellow banner (“3 learners had no activity → labeled as ‘no-activity’ in Dynamic mode”).  
- *Failure*: red banner with “Go back to Review & Fix”.

---

## 6) Results — Mode Switch
**Screen: “Results Overview”**
- Mode selector tabs: **Performance Segmentation** | **Dynamic/Easing Segmentation**  
- A short explainer for each mode; last used mode is remembered per dataset.  
- Shared **filters toolbar** (persists across modes where relevant):
  - Text search (name / user_id)
  - Cohort filters (optional): e.g., program/group if present
  - “Has meetings data” toggle

**State**
- *No data for mode*: neutral card explaining what’s missing (e.g., no timestamps → Dynamic requires Weekly view).

---

## 7) Performance Segmentation (Static Mode)
**Top summary cards**
- Learners processed
- Distribution by **simple segments** (and enhanced variants if meetings affect rules)  
- Avg `total_pct`, avg `success_rate`, avg `meetings_attended_pct`

**Filters (mode-specific)**
- Segment pills: *Leader efficient*, *Balanced middle*, *Hardworking but struggling*, *Low engagement*, etc.
- Sliders/ranges for: `total_pct`, `success_rate`, `persistence`, `efficiency`
- Toggle: “Use meetings in segments” (if toggled on in Settings)

**Main table**
- Columns: `user_id`, `name`, `total`, `total_pct`, `submissions`, `unique_steps`, `success_rate`, `persistence`, `efficiency`, segment label, `meetings_attended`, `meetings_attended_pct` (if available).
- Row actions: **View details**, **Pin**, **Export row**.

**Student detail drawer / page**
- **Performance panel**: big numbers for `total_pct`, `success_rate`, `persistence`, `efficiency`.
- **Meetings panel** (if present): `% attended`, count, mini timeline (markers from `[dd.mm.yyyy]` headers).
- **“Why this segment?”**: human language explanation of the rules that fired (inc. meetings if used).
- Navigation: **Previous / Next**, actions: **Export row**, **Copy summary**.

**States**
- *Filtered empty*: “No learners match your filters” + **Clear filters**.
- *Missing meetings*: grey helper line “No meetings uploaded.”

---

## 8) Dynamic/Easing Segmentation (Temporal Mode)
**Top summary cards**
- Distribution by **easing label** (linear/ease/ease-in/ease-out/ease-in-out)
- Avg **Frontload Index** (tooltip: `> 0` early load, `< 0` late load)
- Optional: share of meetings in activity (if included)

**Filters (mode-specific)**
- Easing label pills
- Range slider: **Frontload Index** (e.g., -0.5 → +0.5)
- Toggle: “Include meetings in activity” (on/off)

**Main table**
- Columns: `user_id`, `name`, **easing_label** (colored pill), **frontload_index**, quartiles `t25/t50/t75`, Bezier control points `p1/p2` (collapsed by default), optional `total_pct` for context.
- Row actions: **View curve**, **Pin**, **Export row**.

**Student curve view**
- **Normalized curve** chart (x: 0→1, y: 0→1), with hover tooltip (date, cum. totals).  
- Overlay toggle to compare canonical easings or show the learner’s Bezier proxy.  
- Quartile markers (25/50/75%).  
- If meetings included: stacked daily bars for platform vs meetings below the curve.  
- Right facts: `frontload_index`, `t25/t50/t75`, `p1/p2`, optional `total_pct`.

**States**
- *No activity*: neutral explanation instead of the chart.  
- *Sparse data*: hint to switch to Weekly & stronger smoothing in Settings.

---

## 9) Explorer (Compare)
**Goal:** compare multiple learners or cohorts across modes.

**Screen: “Explorer”**
- **Left selection panel**: search + multi-select checkboxes; tabs for “Performance” vs “Dynamic/Easing” cohorts.  
- **Chips** show active filters (segments, ease labels, FI range).
- **Main area**:
  - **Performance view**: small multiples of KPI cards or bar lines per learner.  
  - **Dynamic view**: overlaid normalized curves (distinct colors & legend) or small multiples grid.  
- Mode toggle inside Explorer switches visualization logic while preserving the selection.

**States**
- *Too many selected*: suggestion to switch to small multiples.  
- *Mixed availability (no timestamps)*: info ribbon; disable Dynamic for those learners.

---

## 10) Exports
**Dialog: “Export”**
- Choose: **Performance Summary**, **Dynamic Summary**, **Series (Dynamic)**, **Current Filtered View**.  
- Format: CSV.  
- Options (where relevant): “Include normalized coordinates (x_norm, y_norm)”, “Include Bezier proxy (p1/p2)”.  
- **Download** button; toast “Export ready”.

**Quick Actions**
- From Results tables: **Export summary CSV** (respects active filters).
- From Student pages: **Export this row**, **Export this curve (PNG)**.

---

## 11) Session, Undo & Mode Memory
- **Sticky Undo**: when filters/settings change, a toast offers “Undo”.  
- **Autosave**: “Last saved at 14:32” in the header.  
- **Mode memory**: the app returns to the last-used mode for the current dataset.  
- **Reset session**: clears data and returns to Upload (confirmation required).

---

## 12) Errors & Edge States
- **Incomplete uploads**: red ribbon linking to missing tiles.  
- **Unrecognized columns**: inline hints on Review; suggest minimal requirements per mode.  
- **ID mismatches**: non-blocking info (“Showing some rows by ID only”).  
- **Meetings parsing issues**: yellow chip (“Some meeting headers ignored”).  
- **Short courses / sparse timestamps**: recommendation to switch to Weekly + Strong smoothing.  
- **Empty results** after exclusions/filters: friendly empty state with “Clear filters”.

---

## 13) Microcopy & Guidance
- Tooltips:
  - **Frontload Index**: “How early activity accumulates; >0 = early, <0 = late.”  
  - **Easing label**: “Closest CSS-like pattern of cumulative activity.”  
  - **Simple segment**: “Rule-based performance segment; click to see why.”
- “What am I looking at?” links in each mode explain the visual and the logic using two tiny examples.

---

## 14) Primary Flows (Happy Paths)

**First-time user**
1. **Get Started** → upload required files → **Continue**  
2. **Review & Confirm** → all good → **Looks good**  
3. **Exclude IDs** (optional) → **Apply exclusions**  
4. **Display Settings** (optional tweaks) → **Build results**  
5. **Results** → **Performance Segmentation** (table → detail) → switch tab to **Dynamic/Easing** (curves → detail)  
6. **Explorer** to compare a short list → **Exports** as needed

**Returning user**
- Lands on **Results** in the **last-used mode**, with previous filters remembered for the dataset.
