# 81 Require review commit and push

## Summary

Make review, commit, and push mandatory completion steps for every finished task in this repository.

## Requirements

- Replace the instruction that agents commit only when explicitly requested.
- Require a focused review before a task is considered finished.
- Require agents to address review findings, commit the completed task, and push it to the tracked remote.
- Keep commits small and topical.

## Acceptance Criteria

- `AGENTS.md` unambiguously defines review, commit, and push as the default completion sequence for every task.
- The new rule does not conflict with another repository instruction.

## Notes

- Documentation-only workflow change; TDD is not applicable.
