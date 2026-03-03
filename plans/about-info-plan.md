# About Info Implementation Plan - Routine Scrapper

## Overview
Update the About component to reflect the new "Routine Scrapper" app branding, developer information, and attribution to the original PaperKnife project.

## Developer Information
- **Developer Name:** Shakib
- **Developer Organization:** Math ERROR
- **Package Name:** com.matherror.routinescrapper
- **App Name:** Routine Scrapper
- **Forked From:** PaperKnife by potatameister

---

## Files to Update

### 1. [`src/components/About.tsx`](src/components/About.tsx)

#### Changes Required:

**A. Update App Branding (Both Web & APK versions)**
- Change "PaperKnife" → "Routine Scrapper" in titles and headings
- Update hero section messaging to reflect routine/task management focus
- Update version display

**B. Update Developer Attribution**
- Replace "potatameister" → "Shakib"
- Add organization: "Math ERROR"
- Update footer credits

**C. Add Fork Attribution Section**
- Add prominent "Forked from PaperKnife" section
- Credit original author (potatameister)
- Link to original repository: https://github.com/potatameister/PaperKnife

**D. Sponsor Section**
- ✅ REMOVED entirely (per user request)
- All sponsor/funding sections have been removed from both Web and APK versions

**E. Update Technical Description**
- Modify description to reflect Routine Scrapper's purpose
- Keep core privacy/local processing messaging (still applicable)

---

### 2. [`src/components/Thanks.tsx`](src/components/Thanks.tsx) (Optional)
- Update credits/hall of fame to include:
  - Original PaperKnife author (potatameister)
  - Any additional contributors

---

### 3. [`package.json`](package.json) (Line 2)
- Change `"name": "paperknife"` → `"name": "routine-scrapper"`

---

## Detailed Component Changes

### AboutWeb Component Updates:

```tsx
// Hero Section - Update title and description
<h1>Privacy is a Human Right.</h1>
// Keep privacy messaging but update app name references

// Sustainability Card - Update attribution
<h3>Fuel the Engine.</h3>
<p>Routine Scrapper is a fork of PaperKnife...</p>

// Footer - Update developer credit
<p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-400">
  Developed by Shakib • Math ERROR
</p>
```

### AboutAPK Component Updates:

```tsx
// App Identity Section
<h2 className="text-2xl font-black">Routine Scrapper</h2>
<p className="text-[9px] font-black uppercase tracking-widest text-rose-500">
  v{APP_VERSION} • Forked from PaperKnife
</p>

// Footer
<p className="text-[8px] font-black uppercase text-center text-gray-400 tracking-[0.5em]">
  Developed by Shakib • Math ERROR
</p>
```

---

## New Section: Fork Attribution

Add a new section to both Web and APK versions:

```tsx
// Fork Attribution Card
<div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-gray-100">
  <h4 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-2">
    Forked From
  </h4>
  <p className="text-sm text-gray-600 dark:text-zinc-300">
    Routine Scrapper is a fork of{" "}
    <a href="https://github.com/potatameister/PaperKnife" 
       className="text-rose-500 font-bold hover:underline">
      PaperKnife
    </a>{" "}
    by potatameister.
  </p>
  <p className="text-xs text-gray-400 mt-2">
    Original project: AGPL v3 License
  </p>
</div>
```

---

## Implementation Order

1. [x] Update `package.json` name field
2. [x] Update `AboutWeb` component:
   - [x] Hero section branding
   - [x] Remove sponsor/sustainability card
   - [x] Technical specification section
   - [x] Footer credits
   - [x] Add fork attribution
3. [x] Update `AboutAPK` component:
   - [x] App identity section
   - [x] Remove support/sponsor section
   - [x] Protocol section
   - [x] Action tiles
   - [x] Footer credits
   - [x] Add fork attribution
4. [ ] Update `Thanks.tsx` if needed (optional)
5. [ ] Test both web and APK views

---

## Key Considerations

1. **License Compliance:** AGPL v3 requires attribution when forking
2. **Sponsor Links:** Decide whether to keep original author's sponsor link
3. **Privacy Messaging:** Core privacy/local processing features remain relevant
4. **Branding Consistency:** Ensure app name is consistent across all components

---

## Summary

The About component needs comprehensive updates to:
- Rebrand from "PaperKnife" to "Routine Scrapper"
- Credit developer "Shakib" and organization "Math ERROR"
- Properly attribute the original PaperKnife project
- Maintain AGPL v3 license compliance with proper attribution
