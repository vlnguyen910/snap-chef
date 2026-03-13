# Agent Rules: Plan Synchronization

To maintain project alignment, the agent must follow these rules:

1. **Proactive Context Monitoring**: Every time a significant change is made to the codebase or when `.agents/CONTEXT.md` is modified, the agent MUST evaluate if existing plans/roadmaps are still accurate.
2. **Mandatory Checkpoint**: After such changes, the agent MUST ask the user if they wish to update the active plans (e.g., `apps/web/plans/frontend-roadmap.md`).
3. **Alignment First**: Before starting any new task, verify that it aligns with the current goals in `CONTEXT.md` and the active roadmap.
