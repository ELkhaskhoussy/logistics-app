# Sendlo — delivery automation plan

Goal: you describe a need, validate it with Claude, give a green light — and the
work reaches verified production without you touching anything. You are emailed
only when something genuinely needs a human.

---

## Architecture — who does what, and why

The temptation is to put everything in n8n. That does not work, because the
agent writing the code needs the repositories, the production server and the
history of the project. n8n has none of those. So the split is:

| Layer | Responsibility | Why it lives there |
|---|---|---|
| **Claude in chat** | Validate the need, design, write code, fix CI failures, monitor deploys, validate in prod | Has both repos mounted, SSH to production, and the accumulated context |
| **GitHub Actions** | Compile, test, bundle, review the diff, merge | Real repo access; already exists; free |
| **n8n** | Watch for events, decide when a human is needed, send email, later read Trello | Good at glue and notification; bad at code |

n8n is the **nervous system**, not the brain. Its job is: notice something
happened, decide whether Claude or a human should act, and route it.

---

## Prerequisites — Phase 0

Three things, done once.

**1. Authorize the GitHub MCP connector.** Claude currently cannot reach
github.com from its sandbox (proxy returns 403) and cannot write to `.git`.
This is the single blocker for autonomy. Authorizing the bundled
`engineering:github` server gives branch, commit, PR, workflow-run and merge
access through the GitHub API. Without it every cycle needs you to run two git
commands.

**2. An n8n instance with a reachable URL.** GitHub webhooks must be able to
POST to it. Options: n8n Cloud, or self-host on the existing server
(`82.25.97.49` has 5.3 GB RAM free and 92 GB disk — plenty). Self-hosting adds
a Caddy site block and a container to the existing compose file.

**3. An email channel for escalations.** Do **not** reuse
`transportappservice@gmail.com` — it already carries verification and
password-reset mail, is rate-limited to ~500/day, and its app password is in git
history and still needs rotating. A separate sender keeps a broken alert from
taking down signup.

---

## Phase 1 — CI verifies every branch ✅ built, not yet pushed

`verify.yml` in both repos. On any branch push or PR, **without deploying**:

- Backend: `mvn clean package`, `mvn test`, and a Docker build of all five services
- Frontend: `tsc`, `eslint`, and a real `expo export` web bundle

This is the most important piece. Claude cannot compile Java in its sandbox — no
Maven, and only Java 11 — which is why backend code has repeatedly shipped
unverified. This closes that gap permanently.

Typecheck and lint start non-gating because the project carries pre-existing
errors; the bundle build **does** gate.

---

## Phase 2 — CD ships config, not just images ✅ built, not yet pushed

`CI.yml` now scp's `docker-compose.prod.yml` and `Caddyfile` to the server before
deploying, backs up what it replaces, and reloads Caddy gracefully when it changed.

Three production incidents had this one cause:

| Incident | Missing on server |
|---|---|
| 12-day mail outage | `MAIL_USERNAME` / `MAIL_PASSWORD` |
| Blank page on mobile | `www.sendlo.fr` site block (no TLS cert) |
| Trip alerts silently dead | `NOTIFICATION_SERVICE_URL` |

Every one looked like a green deploy. This retires the whole class.

---

## Phase 3 — the GitHub review agent

A workflow that runs Claude against each PR diff and comments. Claude-in-chat
reads those comments, pushes fixes, and the cycle repeats until the review is
satisfied.

**Recommendation: do not let it auto-merge yet.** All three incidents above
reached production silently and were caught only because you noticed something
odd. Auto-merge removes the one control that has actually been working. Let it
approve; merge on green CI + approval once the loop has proven itself over a few
cycles.

Needs: `ANTHROPIC_API_KEY` as a repo secret, and branch protection on `develop`
requiring the verify workflow to pass.

---

## Phase 4 — n8n orchestration and escalation

Two workflows.

**A. Pipeline watcher.** GitHub webhook → n8n on `workflow_run` and
`pull_request` events. It records state and decides:

| Event | Action |
|---|---|
| CI failed, attempt < 3 | Notify Claude to fix |
| CI failed, attempt ≥ 3 | **Email you** — Claude is looping |
| Review left changes requested | Notify Claude |
| Review approved + CI green | Ready to merge |
| CD failed | **Email you** with the failing step |
| Deploy succeeded | Trigger post-deploy validation |

**B. Escalation mailer.** One template: what is blocked, what was already tried,
what exactly you need to do, and a direct link.

### What actually requires you

Worth agreeing explicitly, because everything else should be automatic:

- CI red after 3 self-fix attempts (Claude is stuck)
- Any secret, credential or GitHub setting
- A database migration on production
- Anything destructive or irreversible
- Production validation failing after deploy
- A product decision Claude should not make alone

---

## Phase 5 — Trello trigger

n8n watches a list. A card moved to **Ready for dev** starts the cycle: card
title and description become the requirement, `feat/NN` or `fix/NN` is derived
from the card, and the card moves across the board as the pipeline progresses —
In progress → In review → Deployed. A comment carries the PR and deploy links.

This is last deliberately. It is convenience on top of a working loop, and
building it first would mean automating a process that is not yet reliable.

---

## Honest limitations

**Claude still cannot run the app locally.** Long-running processes do not
survive between shell calls, and there is no Maven. "Test locally" is replaced by
"CI compiles and bundles it, then validate the real deployment in production" —
which is stronger evidence, not weaker.

**Claude-in-chat is not always running.** It acts when the conversation is open.
n8n can queue work and email you, but it cannot wake Claude. If you want the loop
to run entirely unattended, the coding agent has to live in GitHub Actions rather
than in chat — at the cost of starting cold each run, with no memory of why the
mail outage happened. That is a real trade-off, worth revisiting once Phases 1–4
are working.

---

## Suggested order

1. **Phase 0.1** — authorize the GitHub connector *(unblocks everything)*
2. **Phases 1 + 2** — already written, just need pushing
3. **Phase 3** — review agent, no auto-merge
4. Run two or three real stories through it and fix what breaks
5. **Phase 4** — n8n watcher and escalation email
6. **Phase 5** — Trello

Phases 1 and 2 alone remove most of the current risk. Everything after that is
about removing *your* effort, which is worth doing — but only on top of a loop
that is already trustworthy.
