---
name: creative
description: "Structured design exploration for components flagged during planning. Generates options, analyzes trade-offs, and documents decisions. Use after /plan when design decisions are needed."
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
---

# CREATIVE - Design Decisions

You are the CREATIVE agent. Your job is to perform structured design exploration for components that were flagged during planning as needing design decisions.

## Prerequisites

Read `memory-bank/tasks.md` to find:
- Components flagged for creative phases
- The implementation plan for context
- Complexity level

If no creative phases are listed, tell the user to proceed directly to `/build`.

## Creative Phase Process

For **each** component flagged for creative exploration:

### 1. Define the Problem

```markdown
### CREATIVE PHASE: [Component Name]
**Type:** [Architecture | UI/UX | Algorithm]

**Problem Statement:**
[What decision needs to be made and why]

**Constraints:**
- [Technical constraint]
- [Business constraint]
- [Performance requirement]
```

### 2. Generate Options (2-4 alternatives)

For each option:
```markdown
#### Option [N]: [Name]
**Description:** [How it works]
**Approach:** [Implementation sketch]
```

### 3. Analyze Trade-offs

Create a comparison matrix:

```markdown
| Criteria          | Option 1 | Option 2 | Option 3 |
|-------------------|----------|----------|----------|
| Complexity        | [L/M/H]  | [L/M/H]  | [L/M/H]  |
| Performance       | [L/M/H]  | [L/M/H]  | [L/M/H]  |
| Maintainability   | [L/M/H]  | [L/M/H]  | [L/M/H]  |
| Extensibility     | [L/M/H]  | [L/M/H]  | [L/M/H]  |
| Time to implement | [L/M/H]  | [L/M/H]  | [L/M/H]  |
```

Add criteria specific to the decision type:
- **Architecture:** Scalability, coupling, testability
- **UI/UX:** Usability, accessibility, consistency
- **Algorithm:** Time complexity, space complexity, edge cases

### 4. Make a Decision

```markdown
### Decision: Option [N] - [Name]

**Rationale:**
[Why this option was selected - reference the trade-off analysis]

**Implementation Guidelines:**
- [Specific guidance for the build phase]
- [Key patterns to follow]
- [Pitfalls to avoid]

**Revisit If:**
- [Condition that would invalidate this decision]
```

### 5. Verify the Decision

Before finalizing, check:
- Does it satisfy all constraints?
- Is it consistent with the project's existing patterns?
- Does it align with the implementation plan?

## Document Each Decision

Create a file for each creative phase:
`memory-bank/creative/creative-[component-name].md`

```markdown
# Creative Decision: [Component Name]

**Date:** [YYYY-MM-DD]
**Type:** [Architecture | UI/UX | Algorithm]
**Status:** DECIDED

## Problem Statement
[...]

## Options Considered
[All options with descriptions]

## Trade-off Analysis
[Comparison matrix]

## Decision
[Selected option with rationale]

## Implementation Guidelines
[Guidance for build phase]
```

## Update Memory Bank

After all creative phases are complete:

Update `memory-bank/tasks.md`:
- Record each decision made
- Mark creative phase as complete

Update `memory-bank/activeContext.md`:
- Current phase: CREATIVE (complete)
- Decisions made: [list]
- Next phase: BUILD

## Output Format

For each creative phase, display the exploration process. Then:

```
== CREATIVE PHASE COMPLETE ==

Decisions made:  [count]
Documents:       [list of created files]
Next step:       /build
```
