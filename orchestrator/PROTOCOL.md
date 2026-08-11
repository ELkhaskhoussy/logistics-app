# Orchestrator ⇄ Executor protocol

Two agents, one shared folder, no network between them.

| Role | Who | Can | Cannot |
|---|---|---|---|
| **Orchestrator** | Claude in Cowork | Project history, SSH to production, planning, prod validation | git, build, run the app |
| **Executor** | Claude Code in Antigravity | git, terminal, Maven, npm, push | Reach production, remember previous sessions |
| **Verifier** | GitHub Actions | Compile, test, bundle | — |

The orchestrator decides. The executor acts. Neither guesses at the other's job.

## Files

| File | Written by | Read by |
|---|---|---|
| `WORKORDER.md` | Orchestrator | Executor |
| `STATUS.md` | Executor | Orchestrator |
| `PROTOCOL.md` | — | Both |

All in `orchestrator/`, committed to the repo — so the executor sees them on any
machine and the history is auditable.

## The cycle

```
1. You describe a need
2. Orchestrator confirms scope with you        ← your only required input
3. You say go
4. Orchestrator writes WORKORDER.md
5. Executor runs it: branch → code → build → test → push
6. Executor writes STATUS.md
7. CI verifies the branch
8. Orchestrator reads STATUS.md + CI + production
9. Not done? → back to 4 with a new order
10. Done? → merge, deploy, orchestrator validates in prod
```

Steps 4–10 need nothing from you. Step 5 is triggered by:

```bash
claude -p "Execute orchestrator/WORKORDER.md following orchestrator/PROTOCOL.md"
```

run by a watcher, or pasted once by you until the watcher exists.

## Work order format

The orchestrator writes exactly this.

```markdown
# WORKORDER <id>

**Status:** PENDING            <!-- PENDING | IN_PROGRESS | DONE | BLOCKED -->
**Branch:** feat/NN | fix/NN
**Repos:** logistics-app | transportation-app | both

## Goal
One paragraph. What must be true when this is finished.

## Changes
- path/to/file — what to change and why

## Verify before pushing
- [ ] `npx tsc --noEmit` — error count not above baseline
- [ ] `mvn clean install -DskipTests` — must pass
- [ ] anything else specific to this order

## Acceptance
How the orchestrator will confirm it worked, in production.

## Do not
Explicit out-of-scope. Prevents scope creep.
```

## Status format

The executor overwrites this at the end of every run.

```markdown
# STATUS <id>

**Result:** SUCCESS | FAILED | BLOCKED
**Branch:** feat/NN
**Commit:** <sha>
**Pushed:** yes | no

## Verification
| Check | Result | Detail |
|---|---|---|
| tsc | pass | 7 errors, baseline 7 |
| mvn | fail | BookingService.java:412 cannot find symbol |

## What I did
Two or three sentences.

## Blocked on
Only when BLOCKED. Be specific — this is what gets escalated to the human.
```

## Rules for the executor

1. **Never invent scope.** Do only what the work order says. Anything else goes
   in `STATUS.md` as a note.
2. **Never push a failing build.** If verification fails, fix it. After three
   attempts, write `BLOCKED` and stop.
3. **Never merge.** Push the branch; merging is the orchestrator's call.
4. **Never touch production.** No SSH, no database. The orchestrator owns that.
5. **Report honestly.** A red build reported as green destroys the loop. Paste
   the real error.
6. **All user-facing text is French.** This project has shipped English strings
   to production more than once.
7. **Stage selectively.** The working tree carries line-ending churn; commit
   only the files named in the work order.

## Rules for the orchestrator

1. **Confirm scope with the human before writing an order.** That is the one
   approval gate.
2. **One order at a time.** No parallel branches.
3. **Never claim something is verified when it isn't.** Say what was checked and
   what wasn't.
4. **Validate in production after every deploy** — containers, logs, config
   drift, and the specific feature.
5. **Escalate** when: CI red after three attempts, a credential or setting is
   needed, a database migration is required, anything irreversible, or prod
   validation fails.

## Project rules both agents must respect

- **Hibernate `ddl-auto: update`** adds columns but never updates CHECK
  constraints, and adds `NOT NULL` columns without a default — which Postgres
  rejects on a non-empty table, so the service fails to start. Any new enum
  value or non-null column needs an entry in `migration.sql`, applied **before**
  the deploy.
- **Config drift caused three production incidents** (12-day mail outage,
  blank page on mobile, trip alerts silently dead). CD historically shipped
  images only. After any deploy, confirm the server config matches the repo.
- **Errors are swallowed by design.** `handleRuntimeException` returns 400
  without logging; notification failures are caught and logged only. A feature
  can be completely dead while every request looks fine. Verify by observing the
  effect, not the absence of errors.
- **`react-native-toast-message` needs exactly one `<Toast />`** — singleton ref.
- **Distinguish load errors from empty states.** Rendering a failed fetch as
  "no results" has misled users here before.
- **The backend has no test suite.** `mvn test` compiles but runs nothing, so a
  green build means "it compiles", not "it works".
