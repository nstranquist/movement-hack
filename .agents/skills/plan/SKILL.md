---
name: plan
description: "Create a detailed implementation plan for the current task. Reads task context from memory-bank, analyzes the codebase, and produces a structured plan scaled to task complexity. Use after /van."
allowed-tools: Read, Glob, Grep, Write, Edit
---

# PLAN - Task Planning

You are the PLAN agent. Your job is to create a detailed implementation plan based on the task initialized by `/van`.

## Prerequisites

Read `memory-bank/tasks.md` to get:
- Task description
- Complexity level
- Any existing context

If tasks.md doesn't show VAN as complete, tell the user to run `/van` first.

## Planning Process

### 1. Understand the Context

Read these Memory Bank files:
- `memory-bank/tasks.md` - Task requirements
- `memory-bank/activeContext.md` - Current context
- `memory-bank/projectbrief.md` - Project foundation

Then explore the codebase:
- Identify files that will need changes
- Understand existing patterns and conventions
- Note dependencies between components

### 2. Create the Plan (Scaled to Complexity)

#### Level 2 - Simple Plan
```markdown
## Implementation Plan

### Files to Modify
- [file]: [what changes]

### Steps
1. [Step with clear deliverable]
2. [Step with clear deliverable]
...

### Success Criteria
- [ ] [Testable criterion]
- [ ] [Testable criterion]
```

#### Level 3 - Comprehensive Plan
```markdown
## Implementation Plan

### Components
1. [Component]: [purpose]
   - Files: [list]
   - Dependencies: [list]

### Implementation Steps
1. [Step]: [details, files, approach]
2. [Step]: [details, files, approach]
...

### Creative Phases Needed
- [ ] [Component requiring design decisions] - Type: [architecture|ui-ux|algorithm]

### Success Criteria
- [ ] [Testable criterion]
- [ ] [Testable criterion]

### Risks & Mitigations
- [Risk]: [mitigation]
```

#### Level 4 - Architectural Plan
```markdown
## Implementation Plan

### Architecture Overview
[High-level description of the system changes]

### Phases
#### Phase 1: [Name]
- Objective: [what this phase accomplishes]
- Components: [list]
- Files: [list]
- Success criteria: [list]
- Estimated scope: [small/medium/large]

#### Phase 2: [Name]
[same structure, noting dependencies on Phase 1]

### Creative Phases Needed
- [ ] [Component] - Type: [architecture|ui-ux|algorithm]

### Cross-Cutting Concerns
- [Concern]: [approach]

### Success Criteria
- [ ] [Testable criterion per phase]

### Risks & Mitigations
- [Risk]: [mitigation]
```

### 3. Identify Creative Phases

For Level 3-4, flag components that need design exploration:
- Multiple valid approaches exist
- Architectural decisions with trade-offs
- UI/UX patterns to evaluate
- Algorithm selection needed

Document these as "Creative Phases Needed" in the plan.

### 4. Update Memory Bank

Update `memory-bank/tasks.md`:
- Add the complete implementation plan
- Mark planning as complete
- List creative phases if any

Update `memory-bank/activeContext.md`:
- Current phase: PLAN (complete)
- Next phase: CREATIVE or BUILD
- Key files identified

## Output Format

Display the plan, then:

```
== PLAN COMPLETE ==

Complexity:       Level [N]
Components:       [count]
Creative phases:  [count or "none"]
Next step:        /[creative or build]
```

## Routing

- If creative phases were identified: "Run `/creative` to explore design decisions."
- If no creative phases: "Run `/build` to start implementation."
