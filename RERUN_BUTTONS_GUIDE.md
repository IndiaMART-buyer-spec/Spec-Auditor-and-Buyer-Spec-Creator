# Rerun Buttons Guide

## Overview

Added three independent rerun buttons to the Final Results screen that allow users to rerun different stages with specific behavior:

## Buttons & Behavior

### 1. **Rerun Stage 1** (Amber Button)
- **Color**: Amber/Orange
- **Function**: `handleRerunStage1()`
- **Behavior**: Re-audits the original specifications independently
- **What it does**:
  - Takes the original specifications from Stage 1
  - Calls Gemini API to re-audit them
  - Updates audit results on Stage 1 tab
  - Does NOT affect Stage 2 or Stage 3
- **Use case**: When you want to re-audit specifications with fresh Gemini insights

### 2. **Rerun Stage 2 + 3** (Blue Button)
- **Color**: Blue
- **Function**: `handleRerunStage2AndStage3()`
- **Behavior**: Re-extracts ISQs AND automatically regenerates Buyer ISQs
- **What it does**:
  - Takes the URLs from Stage 2
  - Calls Gemini API to re-extract ISQs
  - Automatically finds common specs between Stage 1 and new Stage 2 ISQs
  - Automatically regenerates Buyer ISQs for Stage 3
  - Updates both Stage 2 AND Stage 3 results
- **Use case**: When you want fresh ISQ extraction from URLs (which cascades to Stage 3)

### 3. **Rerun Stage 3** (Green Button)
- **Color**: Green
- **Function**: `handleRerunStage3()`
- **Behavior**: Regenerates Buyer ISQs independently
- **What it does**:
  - Uses existing common specs (from previous Stage 3 run)
  - Calls Gemini API to regenerate Buyer ISQs
  - Updates only Stage 3 results
  - Does NOT re-extract Stage 2 ISQs
- **Use case**: When you want to regenerate Buyer ISQs without re-running Stage 2

### 4. **New Analysis** (Gray Button)
- **Color**: Gray
- **Function**: `handleReset()`
- **Behavior**: Start completely over
- **What it does**:
  - Clears all data
  - Returns to Stage 1 input
  - Allows uploading new file
- **Use case**: Starting a completely new analysis

---

## Execution Flow

```
┌─────────────────────────────────────────────────────┐
│        Final Results Screen (All Data Ready)        │
└─────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────┐
        │           │           │          │
        ▼           ▼           ▼          ▼
    Stage 1     Stage 2+3    Stage 3   New Analysis
    (Amber)      (Blue)      (Green)     (Gray)
        │           │           │          │
        │           │           │          │
        │      ┌────┴────┐      │          │
        │      │         │      │          │
        ▼      ▼         ▼      ▼          ▼
    Re-audit  Stage2  Stage3   Stage3   Reset All
    Specs     ISQs    (Auto)   ISQs
             ▼
           Spec Matching
             ▼
           Buyer ISQs
```

---

## Important Points

### Dependencies
- **Stage 1 can run alone** ✅ Independent
- **Stage 2 triggers Stage 3** ⚡ Dependent (automatic cascade)
- **Stage 3 can run alone** ✅ Independent (uses existing common specs)
- **All stages need data** - Each button validates that required data exists

### Data Requirements
- **Rerun Stage 1**: Needs original specifications
- **Rerun Stage 2+3**: Needs URLs from Stage 2
- **Rerun Stage 3**: Needs common specs from previous runs
- **New Analysis**: No data required (clears everything)

### State Management
- All rerun operations maintain existing data if they fail
- Loading state prevents multiple simultaneous runs
- Error messages display which data is missing
- Auto-tabs to relevant stage after completion

---

## Code Implementation

### Handler Functions

```typescript
handleRerunStage1()
├─ Validates originalSpecs exist
├─ Calls auditSpecificationsWithGemini()
├─ Updates audit results
└─ Tabs to Stage 1

handleRerunStage2AndStage3()
├─ Validates urls exist
├─ Calls extractISQWithGemini()
├─ Calls findCommonSpecsWithGemini()
├─ Calls generateBuyerISQsWithGemini()
├─ Updates ISQs and common specs
└─ Tabs to Stage 2

handleRerunStage3()
├─ Validates isqs and commonSpecs exist
├─ Calls generateBuyerISQsWithGemini()
├─ Updates buyer ISQs only
└─ Tabs to Stage 3
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Final Results                                   [Stage 1][Stage2+3][Stage3][New] │
│ Complete audit and ISQ extraction for MCAT                                      │
└─────────────────────────────────────────────────────────────────┘
│ Tab Selection: Stage 1 | Stage 2 | Stage 3
├─────────────────────────────────────────────────────────────────┤
│ [Selected Tab Content Here]
│
│ [Download Buttons for Selected Tab]
└─────────────────────────────────────────────────────────────────┘
```

All buttons are responsive and wrap on smaller screens.

---

## Tooltips (Hover Messages)

- **Rerun Stage 1**: "Rerun Stage 1: Audit specifications independently"
- **Rerun Stage 2 + 3**: "Rerun Stage 2: This will automatically rerun Stage 3 as well"
- **Rerun Stage 3**: "Rerun Stage 3: Regenerate Buyer ISQs independently"

---

## Processing States

During execution, users see:
1. Button becomes disabled (opacity 50%)
2. Top-left status message appears: "Re-auditing specifications..." / "Re-extracting ISQs..." / "Regenerating buyer ISQs..."
3. On error: Red alert appears in top-right with error message
4. On success: Tab automatically switches to relevant stage with updated results

---

## Example Usage Scenarios

### Scenario 1: Audit Results Look Off
1. Click **"Rerun Stage 1"** (Amber)
2. Wait for re-audit to complete
3. Check updated results in Stage 1 tab
4. Proceed to Stage 2 if needed

### Scenario 2: Want Fresh ISQ Extraction
1. Click **"Rerun Stage 2 + 3"** (Blue)
2. Wait for Stage 2 extraction + automatic Stage 3 generation
3. Check results in both Stage 2 and Stage 3 tabs

### Scenario 3: Just Regenerate Buyer ISQs
1. Click **"Rerun Stage 3"** (Green)
2. Wait for Buyer ISQs to regenerate
3. Check updated results in Stage 3 tab

### Scenario 4: Start Over
1. Click **"New Analysis"** (Gray)
2. Upload new file
3. Start fresh analysis

---

## Build Status
```
✓ 1478 modules transformed
✓ built in 9.28s
No TypeScript errors
```

**Status**: ✅ SUCCESS
