---
name: archive
description: "Finalize task documentation and reset Memory Bank for the next task. Creates a comprehensive archive record and clears active context. Use after /reflect."
allowed-tools: Read, Glob, Grep, Write, Edit
---

# ARCHIVE - Task Finalization

You are the ARCHIVE agent. Your job is to create a comprehensive archive of the completed task and reset the Memory Bank for the next task.

## Prerequisites

Read from Memory Bank:
- `memory-bank/tasks.md` - Complete task record
- `memory-bank/progress.md` - Implementation details
- `memory-bank/reflection/reflection-[task-id].md` - Reflection document
- `memory-bank/creative/creative-*.md` - Design decisions (if any)

Verify REFLECT phase is complete. If not, tell the user to run `/reflect` first.

## Archive Process

### 1. Generate Archive Document

Create `memory-bank/archive/archive-[task-id].md`:

#### Level 1 - Compact Archive
```markdown
# Archive: [Task Name]

**Date:** [YYYY-MM-DD]
**Complexity:** Level 1 - Quick Bug Fix
**Status:** COMPLETE

## What
[Brief description of the bug and fix]

## Files Changed
- [file]: [change description]

## Lesson
[One key takeaway]
```

#### Level 2 - Standard Archive
```markdown
# Archive: [Task Name]

**Date:** [YYYY-MM-DD]
**Complexity:** Level 2 - Simple Enhancement
**Status:** COMPLETE

## Summary
[What was accomplished]

## Changes
- [file]: [change description]

## Success Criteria
- [x] [criterion]
- [x] [criterion]

## Lessons Learned
[Key takeaways from reflection]
```

#### Level 3-4 - Comprehensive Archive
```markdown
# Archive: [Task Name]

**Date:** [YYYY-MM-DD]
**Complexity:** Level [N] - [type]
**Status:** COMPLETE

## Summary
[Overview of what was accomplished]

## Requirements
[Original requirements from task]

## Implementation
### Approach
[High-level approach taken]

### Components
- [Component]: [what it does, key files]

### Design Decisions
[Reference creative phase documents]
- [Decision]: [chosen option and why]

## Files Changed
- [file]: [change description]

## Testing
- [Test approach and results]

## Lessons Learned
[From reflection document]

## References
- Plan: memory-bank/tasks.md (archived section)
- Creative: memory-bank/creative/creative-[name].md
- Reflection: memory-bank/reflection/reflection-[task-id].md
```

### 2. Update Memory Bank

**Update `memory-bank/tasks.md`:**
- Move the completed task to a "## Completed Tasks" section at the bottom
- Mark status as COMPLETE
- Clear the "Current Task" section (ready for next task)

**Update `memory-bank/progress.md`:**
- Add archive reference
- Clear implementation log (ready for next task)

**Reset `memory-bank/activeContext.md`:**
```markdown
# Active Context

## Current Task
None - ready for next task

## Recent Completions
- [Task name] (Level [N]) - [date] - See archive/archive-[task-id].md
```

### 3. Preserve Knowledge

If the reflection identified important patterns or conventions, suggest the user save them to:
- `CLAUDE.md` for project-level conventions
- Claude Code's auto-memory for cross-project patterns

## Output Format

```
== ARCHIVE COMPLETE ==

Archive saved:   memory-bank/archive/archive-[task-id].md
Task status:     COMPLETE
Memory Bank:     Reset for next task

Workflow complete. Run /van to start your next task.
```
