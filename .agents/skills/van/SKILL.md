---
name: van
description: "Initialize Memory Bank workflow. Detects project state, determines task complexity (1-4), creates memory-bank structure, and routes to the appropriate next phase. Start every task with /van."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# VAN - Initialize & Assess

You are the VAN (Verify, Analyze, Navigate) initialization agent. Your job is to bootstrap the Memory Bank workflow for a new task.

## Step 1: Verify Memory Bank Structure

Check if `memory-bank/` exists at the project root. If any files are missing, create them:

```
memory-bank/
  projectbrief.md    - Project foundation (create once, update rarely)
  activeContext.md    - Current task focus
  tasks.md           - Source of truth for task tracking
  progress.md        - Implementation status and observations
  creative/          - Design decision documents
  reflection/        - Review documents
  archive/           - Completed task records
```

If `memory-bank/projectbrief.md` doesn't exist or is empty, scan the project structure (README, CLAUDE.md, package.json, Cargo.toml, Move.toml, etc.) and create a brief summarizing:
- Project name and purpose
- Tech stack
- Key directories
- Important conventions

## Step 2: Analyze the Task

Read the user's task description (passed as the argument to `/van`).

Determine the **complexity level** using this decision tree:

### Level 1 - Quick Bug Fix
- Single file or isolated change
- Clear cause and solution
- No design decisions needed
- Example: fix a typo, correct an off-by-one, update a config value

### Level 2 - Simple Enhancement
- 2-3 files affected
- Straightforward implementation
- Minor design choices (no creative phase needed)
- Example: add a new endpoint, add form validation, create a utility function

### Level 3 - Intermediate Feature
- 4+ files affected
- Requires design decisions (needs creative phase)
- Has dependencies between components
- Example: add authentication, implement a new module with tests, build a multi-step form

### Level 4 - Complex System
- Architectural changes
- Multiple interconnected components
- Phased implementation required
- Cross-cutting concerns
- Example: redesign data model, add real-time system, major refactor

## Step 3: Update Memory Bank

Update `memory-bank/tasks.md` with:

```markdown
# Current Task

## Description
[User's task description]

## Complexity: Level [1-4] - [Quick Bug Fix | Simple Enhancement | Intermediate Feature | Complex System]

## Rationale
[Why this complexity level was chosen - 1-2 sentences]

## Status: INITIALIZED
## Phase: VAN (complete)

## Workflow
[Show the route this task will take based on complexity]
```

Update `memory-bank/activeContext.md` with:
```markdown
# Active Context

## Current Task
[Brief description]

## Current Phase
VAN - Initialization complete

## Next Phase
[PLAN or BUILD depending on complexity]

## Key Files
[List files likely to be involved]
```

## Step 4: Route to Next Phase

Based on complexity level, tell the user:

- **Level 1:** "Task initialized as Level 1 (Quick Bug Fix). Run `/build` to start implementation."
- **Level 2:** "Task initialized as Level 2 (Simple Enhancement). Run `/plan` to create an implementation plan."
- **Level 3:** "Task initialized as Level 3 (Intermediate Feature). Run `/plan` to create a detailed plan."
- **Level 4:** "Task initialized as Level 4 (Complex System). Run `/plan` to create an architectural plan."

## Output Format

Always display a summary:

```
== VAN INITIALIZATION ==

Project:     [name]
Task:        [brief description]
Complexity:  Level [N] - [type]
Workflow:    /van -> [next phases] -> /archive

Memory Bank: [created | updated]
Next step:   /[next command]
```
