---
description: Sync development plans with latest codebase and context
---

Run this workflow whenever the codebase or `.agents/CONTEXT.md` is updated to ensure roadmaps and project plans remain accurate.

1. **Scan for Changes**: Review recent file changes and updates in `.agents/CONTEXT.md`.
2. **Review Plans**: Check current plan files (e.g., `apps/web/plans/frontend-roadmap.md` or any files in `docs/plans/`).
3. **Analyze Alignment**: Determine if the current progress or structural changes in the codebase render parts of the existing plans obsolete or completed.
4. **Prompt User**:
   - Notify the user of the detected changes.
   - Ask: "I've detected updates in the codebase/context. Would you like me to update the current development plans and roadmaps to reflect this progress?"
5. **Update Plans**: If confirmed, update the relevant plan files with `[x]` marks, new priorities, or structural changes.
