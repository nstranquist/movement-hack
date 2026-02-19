# Memory Bank Workflow for Claude Code

A structured development workflow that maintains persistent context across Claude Code sessions. Inspired by [cursor-memory-bank](https://github.com/vanzan01/cursor-memory-bank), adapted for Claude Code's native features (skills, CLAUDE.md, auto-memory).

## Quick Start

```
/van Add user authentication to the app
```

That's it. The workflow guides you from there.

## How It Works

Every task flows through a structured pipeline. The depth of each phase scales with task complexity.

### The 6 Phases

| Phase | Command | Purpose |
|-------|---------|---------|
| **VAN** | `/van [task]` | Initialize, assess complexity, set up memory bank |
| **PLAN** | `/plan` | Create implementation plan (Level 2-4) |
| **CREATIVE** | `/creative` | Explore design decisions (Level 3-4, when needed) |
| **BUILD** | `/build` | Implement with test-driven gates |
| **REFLECT** | `/reflect` | Review what went well and lessons learned |
| **ARCHIVE** | `/archive` | Finalize docs, reset for next task |

### Complexity-Based Routing

`/van` analyzes your task and routes it through the appropriate phases:

```
Level 1 - Quick Bug Fix
  /van -> /build -> /reflect -> /archive

Level 2 - Simple Enhancement
  /van -> /plan -> /build -> /reflect -> /archive

Level 3 - Intermediate Feature
  /van -> /plan -> /creative -> /build -> /reflect -> /archive

Level 4 - Complex System
  /van -> /plan -> /creative -> /build -> /reflect -> /archive
  (with phased implementation gates in /build)
```

### Complexity Decision Guide

| Level | Criteria | Example |
|-------|----------|---------|
| **1** | Single file, clear fix, no decisions | Fix a typo, correct a config value |
| **2** | 2-3 files, straightforward | Add an endpoint, add validation |
| **3** | 4+ files, needs design decisions | Add auth module, build multi-step form |
| **4** | Architectural change, phased work | Redesign data model, add real-time system |

## Memory Bank

All persistent context lives in `memory-bank/` at the project root:

```
memory-bank/
  projectbrief.md      Project foundation (tech stack, structure, conventions)
  activeContext.md      What you're working on right now
  tasks.md             Source of truth for current task (plan, checklists, status)
  progress.md          Implementation log and test results
  creative/            Design decision documents
  reflection/          Review documents
  archive/             Completed task records
```

### How Context Persists

- `/van` creates and updates the memory bank structure
- Each phase reads from previous phases' outputs
- `/archive` preserves the completed task and resets for the next one
- `projectbrief.md` accumulates knowledge about your project over time

### Starting a New Session

If you're resuming work in a new Claude Code session, just run the next command in your workflow. The memory bank files contain all the context needed.

Check `memory-bank/activeContext.md` to see where you left off.

## Phase Details

### /van - Initialize

- Scans your project to populate `projectbrief.md` (first run only)
- Analyzes task complexity using a decision tree
- Creates/updates `tasks.md` and `activeContext.md`
- Routes you to the appropriate next phase

### /plan - Plan

- Reads task context and explores the codebase
- Creates an implementation plan scaled to complexity:
  - **Level 2:** Files to modify, ordered steps, success criteria
  - **Level 3:** Components, dependencies, creative phases needed
  - **Level 4:** Phased architecture with cross-cutting concerns
- Flags components needing design decisions (-> `/creative`)

### /creative - Design

- For each flagged component:
  1. Define the problem and constraints
  2. Generate 2-4 design options
  3. Create a trade-off matrix (complexity, performance, maintainability, etc.)
  4. Select and document the decision with rationale
- Creates `memory-bank/creative/creative-[name].md` for each decision

### /build - Implement

- Follows the plan step-by-step
- For Level 3-4: enforces test-driven phase gates (all tests must pass before proceeding)
- Tracks progress in `memory-bank/progress.md`
- Checks off success criteria in `memory-bank/tasks.md`

### /reflect - Review

- Compares implementation against the plan
- Documents what went well, challenges, and lessons learned
- Creates `memory-bank/reflection/reflection-[task-id].md`
- Scaled from quick summary (L1) to comprehensive analysis (L3-4)

### /archive - Finalize

- Creates a comprehensive archive document
- Moves completed task to the archive section
- Resets active context for the next task
- Suggests saving important patterns to CLAUDE.md or auto-memory

## Tips

- **Skip phases if they don't add value.** The routing is a guide, not a straitjacket. If a Level 2 task is obvious, go straight to `/build`.
- **Check `activeContext.md` when resuming.** It tells you exactly where you left off and what to run next.
- **The memory bank is just markdown.** You can read and edit these files yourself at any time.
- **Git track or gitignore — your choice.** Track `memory-bank/` if you want team visibility. Add it to `.gitignore` if it's personal workflow context.
- **Works with any project.** The workflow is language and framework agnostic.

## Installation in Other Projects

Copy these directories to your project:
```
.agents/skills/van/
.agents/skills/plan/
.agents/skills/creative/
.agents/skills/build/
.agents/skills/reflect/
.agents/skills/archive/
```

Create symlinks in `.claude/skills/`:
```bash
mkdir -p .claude/skills
cd .claude/skills
ln -sf ../../.agents/skills/van van
ln -sf ../../.agents/skills/plan plan
ln -sf ../../.agents/skills/creative creative
ln -sf ../../.agents/skills/build build
ln -sf ../../.agents/skills/reflect reflect
ln -sf ../../.agents/skills/archive archive
```

The `memory-bank/` directory is created automatically on first `/van` run.

## Credits

Adapted from [cursor-memory-bank](https://github.com/vanzan01/cursor-memory-bank) by vanzan01 (Unlicense). Rebuilt for Claude Code's skill system and native features.
