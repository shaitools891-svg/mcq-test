# Haptic Feedback Implementation Plan

## Overview
This document outlines where and how to implement haptic feedback throughout the PaperKnife app to enhance user experience.

## Current Implementation

### Existing Haptic Functions
Located in [`src/utils/haptics.ts`](src/utils/haptics.ts):

| Function | Purpose | Capacitor API |
|----------|---------|---------------|
| `hapticImpact(style?)` | General impact feedback | `ImpactStyle.Light/Medium/Heavy` |
| `hapticSuccess()` | Success notification | `NotificationType.Success` |
| `hapticSelection()` | Selection start | `selectionStart()` |

### Currently Implemented Locations

| Component | Location | Trigger |
|-----------|----------|---------|
| [`Layout.tsx:124`](src/components/Layout.tsx:124) | FAB click | `hapticImpact()` |
| [`Settings.tsx:187`](src/components/Settings.tsx:187) | Admin mode toggle | `hapticImpact()` |
| [`Settings.tsx:214`](src/components/Settings.tsx:214) | Cloud upload | `hapticImpact()` |
| [`Settings.tsx:235`](src/components/Settings.tsx:235) | Cloud download | `hapticImpact()` |
| [`Settings.tsx:248`](src/components/Settings.tsx:248) | Export backup | `hapticImpact()` |
| [`Settings.tsx:260`](src/components/Settings.tsx:260) | Share backup | `hapticImpact()` |
| [`Settings.tsx:278`](src/components/Settings.tsx:278) | Import backup | `hapticImpact()` |
| [`Settings.tsx:295`](src/components/Settings.tsx:295) | Setting change | `hapticImpact()` |
| [`Settings.tsx:379`](src/components/Settings.tsx:379) | Theme selection | `hapticImpact()` |
| [`SuccessState.tsx:22`](src/components/tools/shared/SuccessState.tsx:22) | Operation success | `hapticSuccess()` |

---

## Recommended Haptic Implementation

### 1. Navigation Haptics - Light Impact

| Component | Location | Trigger | Function |
|-----------|----------|---------|----------|
| [`Layout.tsx:158`](src/components/Layout.tsx:158) | Back button | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`Layout.tsx:168`](src/components/Layout.tsx:168) | Dropdown open | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`Layout.tsx:183`](src/components/Layout.tsx:183) | Tool selection | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`Layout.tsx:290-317`](src/components/Layout.tsx:290) | Bottom nav tabs | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`NativeToolLayout.tsx:40`](src/components/tools/shared/NativeToolLayout.tsx:40) | Back button | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`ToolHeader.tsx:19`](src/components/tools/shared/ToolHeader.tsx:19) | Back button | `onClick` | `hapticImpact(ImpactStyle.Light)` |

### 2. Action Button Haptics - Medium Impact

| Component | Location | Trigger | Function |
|-----------|----------|---------|----------|
| [`AndroidView.tsx:86`](src/components/AndroidView.tsx:86) | File picker tap | `onClick` | `hapticImpact()` |
| [`AndroidHistoryView.tsx:66`](src/components/AndroidHistoryView.tsx:66) | Clear history | `onClick` | `hapticImpact()` |
| [`PdfPreview.tsx:150`](src/components/PdfPreview.tsx:150) | Close preview | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`SuccessState.tsx:115`](src/components/tools/shared/SuccessState.tsx:115) | Preview button | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`SuccessState.tsx:123`](src/components/tools/shared/SuccessState.tsx:123) | Share button | `onClick` | `hapticImpact()` |
| [`SuccessState.tsx:131`](src/components/tools/shared/SuccessState.tsx:131) | Download button | `onClick` | `hapticImpact()` |
| [`SuccessState.tsx:140`](src/components/tools/shared/SuccessState.tsx:140) | Start over | `onClick` | `hapticImpact(ImpactStyle.Light)` |

### 3. Tool Action Haptics - Medium/Heavy Impact

| Component | Location | Trigger | Function |
|-----------|----------|---------|----------|
| All tools | Action buttons | Primary action click | `hapticImpact(ImpactStyle.Medium)` |
| [`MergeTool.tsx:372`](src/components/tools/MergeTool.tsx:372) | Merge PDFs | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |
| [`CompressTool.tsx:232`](src/components/tools/CompressTool.tsx:232) | Compress | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |
| [`SplitTool.tsx:166`](src/components/tools/SplitTool.tsx:166) | Split PDF | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |
| [`ProtectTool.tsx:97`](src/components/tools/ProtectTool.tsx:97) | Encrypt | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |
| [`UnlockTool.tsx:69`](src/components/tools/UnlockTool.tsx:69) | Unlock | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |

### 4. Selection Haptics - Selection Style

| Component | Location | Trigger | Function |
|-----------|----------|---------|----------|
| [`RotateTool.tsx:153`](src/components/tools/RotateTool.tsx:153) | Page rotation tap | `onClick` | `hapticSelection()` |
| [`RearrangeTool.tsx`](src/components/tools/RearrangeTool.tsx) | Page drag | `onDragEnd` | `hapticSelection()` |
| [`SplitTool.tsx:264`](src/components/tools/SplitTool.tsx:264) | Page selection | `onClick` | `hapticSelection()` |
| [`PdfToImageTool.tsx:135`](src/components/tools/PdfToImageTool.tsx:135) | Format selection | `onClick` | `hapticSelection()` |
| [`WatermarkTool.tsx:182`](src/components/tools/WatermarkTool.tsx:182) | Color selection | `onClick` | `hapticSelection()` |
| [`PageNumberTool.tsx:157`](src/components/tools/PageNumberTool.tsx:157) | Position selection | `onClick` | `hapticSelection()` |
| [`CompressTool.tsx:286`](src/components/tools/CompressTool.tsx:286) | Quality selection | `onClick` | `hapticSelection()` |

### 5. CRUD Operations - Medium Impact

| Component | Location | Trigger | Function |
|-----------|----------|---------|----------|
| [`StudentDirectory.tsx:251`](src/components/routine/StudentDirectory.tsx:251) | Edit student | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`StudentDirectory.tsx:257`](src/components/routine/StudentDirectory.tsx:257) | Delete student | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |
| [`TeacherDatabase.tsx:230`](src/components/routine/TeacherDatabase.tsx:230) | Edit teacher | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`TeacherDatabase.tsx:236`](src/components/routine/TeacherDatabase.tsx:236) | Delete teacher | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |
| [`ClassRoutine.tsx:372`](src/components/routine/ClassRoutine.tsx:372) | Edit schedule | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`ClassRoutine.tsx:378`](src/components/routine/ClassRoutine.tsx:378) | Delete schedule | `onClick` | `hapticImpact(ImpactStyle.Heavy)` |

### 6. Error/Warning Haptics - Heavy Impact

| Scenario | Trigger | Function |
|----------|---------|----------|
| Password incorrect | Unlock failure | `hapticImpact(ImpactStyle.Heavy)` |
| File too large | Error toast | `hapticImpact(ImpactStyle.Heavy)` |
| Operation failed | Error catch | `hapticImpact(ImpactStyle.Heavy)` |
| Delete confirmation | Dialog open | `hapticImpact(ImpactStyle.Heavy)` |

### 7. Toggle Haptics - Light Impact

| Component | Location | Trigger | Function |
|-----------|----------|---------|----------|
| [`Settings.tsx:23`](src/components/Settings.tsx:23) | Toggle switch | `onChange` | `hapticImpact(ImpactStyle.Light)` |
| [`Layout.tsx:212`](src/components/Layout.tsx:212) | Theme toggle | `onClick` | `hapticImpact(ImpactStyle.Light)` |
| [`AndroidView.tsx:73`](src/components/AndroidView.tsx:73) | Theme toggle | `onClick` | `hapticImpact(ImpactStyle.Light)` |

---

## Implementation Priority

### Phase 1: High Impact - User Delight
1. Tool action buttons - Primary operations
2. Success states - Already implemented
3. Navigation - Back buttons, tabs

### Phase 2: Selection Feedback
1. Page selection in tools
2. Format/quality selectors
3. Color pickers

### Phase 3: CRUD Operations
1. Edit/delete actions
2. Form submissions
3. Data operations

### Phase 4: Polish
1. Toggle switches
2. Error states
3. Micro-interactions

---

## Haptic Style Guidelines

| Style | Use Case | Intensity |
|-------|----------|-----------|
| `Light` | Navigation, toggles, selections | Subtle tap |
| `Medium` | Actions, buttons, confirmations | Standard tap |
| `Heavy` | Destructive actions, errors, warnings | Strong tap |
| `Success` | Operation completed successfully | Double pulse |
| `Selection` | Picker/selector changes | Tick feel |

---

## Code Example

```typescript
import { hapticImpact, hapticSelection, hapticSuccess } from '../utils/haptics'
import { ImpactStyle } from '@capacitor/haptics'

// Light impact for navigation
<button onClick={() => { hapticImpact(ImpactStyle.Light); navigate(-1); }}>

// Medium impact for actions
<button onClick={() => { hapticImpact(); handleSave(); }}>

// Heavy impact for destructive actions
<button onClick={() => { hapticImpact(ImpactStyle.Heavy); handleDelete(); }}>

// Selection for pickers
<button onClick={() => { hapticSelection(); setFormat('png'); }}>

// Success for completed operations
useEffect(() => {
  if (operationComplete) {
    hapticSuccess()
  }
}, [operationComplete])
```

---

## Testing Checklist

- [ ] Test on physical Android device - haptics don't work on simulators
- [ ] Verify haptics respect the settings toggle
- [ ] Test with different intensity levels
- [ ] Ensure haptics don't fire too frequently - debounce if needed
- [ ] Test accessibility - haptics should complement, not replace visual feedback
