# Sendlo — automation roadmap

Implementation sequence for [AUTOMATION_PLAN.md](AUTOMATION_PLAN.md).

Each milestone is independently useful and independently reversible. Nothing
later depends on anything later being finished — so you can stop at any
milestone and still be better off than before it.

Legend: **You** = needs a human (credentials, settings, approvals) ·
**Claude** = Claude does it · **Auto** = runs by itself once set up.

---

## M0 — Unblock (do first)

Without this, every cycle still needs two git commands from you.

| # | Step | Who | Effort |
|---|---|---|---|
| 0.1 | Delete the stale lock files Claude left: `.git/index.lock` and `.git/_writetest` in `logistics-app` | You | 1 min |
| 0.2 | Authorize the `engineering:github` MCP connector (connector settings, or `/mcp` in an interactive Claude Code session) | You | 5 min |
| 0.3 | Confirm `SERVER_HOST` secret is `82.25.97.49`, and `SERVER_USER` is `deploy` | You | 2 min |
| 0.4 | Verify Claude can create a branch and read workflow runs | Claude | 5 min |

**Done when:** Claude creates a throwaway branch, pushes an empty commit, reads
the run status, and deletes the branch — with no input from you.

**If 0.2 is not possible**, everything still works; you run two commands per
cycle (`git checkout -b`, `git push`). Decide this before building M3+, because
n8n orchestrating a loop that stalls on a human is worse than no n8n.

---

## M1 — Every branch gets compiled ✅ written, needs pushing

Files already exist, uncommitted:

- `logistics-app/.github/workflows/verify.yml`
- `transportation-app/.github/workflows/verify.yml`

| # | Step | Who | Effort |
|---|---|---|---|
| 1.1 | Push both `verify.yml` files on a test branch | Claude *(after M0)* or You | 5 min |
| 1.2 | Confirm both run and pass on that branch | Claude | 10 min |
| 1.3 | Fix whatever the first real backend compile surfaces | Claude | unknown — this is the first time the Java is compiled |
| 1.4 | Enable branch protection on `develop`: require both verify workflows | You | 5 min |

**Done when:** a branch push produces a green build in both repos, and `develop`
refuses a merge without it.

> ⚠️ **Expect 1.3 to find real errors.** The backend changes from the bug-fix
> pass — `TripInfoDTO`, the booking guards, the trip-alert fan-out — have never
> been compiled. That is the entire point of this milestone.

---

## M2 — Deploys ship config, not just images ✅ written, needs pushing

Already edited: `transportation-app/.github/workflows/CI.yml` now scp's
`docker-compose.prod.yml` and `Caddyfile` before deploying, backs up what it
replaces, and reloads Caddy when it changed.

| # | Step | Who | Effort |
|---|---|---|---|
| 2.1 | Verify the server's config currently matches the repo (it was patched by hand) | Claude | 5 min |
| 2.2 | Merge, and watch the first config-syncing deploy closely | Claude | 15 min |
| 2.3 | Confirm the backup files appear and the app still serves | Claude | 5 min |

**Done when:** a deploy reports `config unchanged` for both files — proving repo
and server agree.

**Rollback:** every replaced file is kept as `<name>.bak.<timestamp>` on the
server.

---

## M3 — Review agent

| # | Step | Who | Effort |
|---|---|---|---|
| 3.1 | Add `ANTHROPIC_API_KEY` as a repo secret in both repos | You | 5 min |
| 3.2 | Add the review workflow (runs on `pull_request`, comments on the diff) | Claude | 30 min |
| 3.3 | Run it against a real PR and tune the prompt to this codebase | Claude | 1 h |
| 3.4 | Decide the merge rule | You | — |

**Recommended merge rule:** CI green **+** review approved **+** you press merge.
Revisit auto-merge after three clean cycles. Every production incident so far
was silent and caught by a human noticing; do not remove that control while the
loop is still new.

**Done when:** opening a PR produces a useful review comment within a few
minutes, and Claude can read and act on it.

---

## M4 — n8n orchestration

### M4a — Get n8n running

| # | Step | Who | Effort |
|---|---|---|---|
| 4.1 | Decide: n8n Cloud, or self-host on `82.25.97.49` | You | — |
| 4.2 | If self-hosting: add the n8n service to `docker-compose.prod.yml` + a `n8n.sendlo.fr` block in `Caddyfile`, with a DNS A record | Claude + You (DNS) | 45 min |
| 4.3 | Set up an escalation email sender — **not** `transportappservice@gmail.com` | You | 20 min |

> The existing Gmail account carries verification and password-reset mail, is
> capped near 500/day, and its app password is in git history and still
> unrotated. A separate sender keeps a noisy alert loop from breaking signup.

### M4b — Pipeline watcher

| # | Step | Who | Effort |
|---|---|---|---|
| 4.4 | Add a GitHub webhook → n8n for `workflow_run`, `pull_request`, `push` | Claude + You (webhook secret) | 30 min |
| 4.5 | Build the routing logic | Claude | 2 h |
| 4.6 | Build the escalation email template | Claude | 30 min |

Routing:

| Event | Action |
|---|---|
| CI failed, attempt < 3 | Flag for Claude to fix |
| CI failed, attempt ≥ 3 | **Email you** — Claude is looping |
| Review requested changes | Flag for Claude |
| Review approved + CI green | Ready to merge |
| CD failed | **Email you**, with the failing step |
| Deploy succeeded | Trigger post-deploy validation |

### Escalation triggers — agree these explicitly

Everything else should be automatic:

- CI red after 3 self-fix attempts
- Any secret, credential, or GitHub setting
- A database migration on production
- Anything destructive or irreversible
- Production validation failing after a deploy
- A product decision Claude should not make alone

**Done when:** a deliberately broken branch produces an email to you with the
failing step and a direct link.

---

## M5 — Trello trigger

| # | Step | Who | Effort |
|---|---|---|---|
| 5.1 | Trello API key + token into n8n | You | 10 min |
| 5.2 | Agree the board columns that drive the flow | You + Claude | 15 min |
| 5.3 | Card → requirement → branch name (`feat/NN` / `fix/NN`) | Claude | 1 h |
| 5.4 | Move the card as the pipeline progresses; comment PR and deploy links | Claude | 1 h |

**Done when:** moving a card to *Ready for dev* starts a cycle and the card
tracks it to *Deployed* without you typing anything.

---

## Sequencing

```
M0 ──> M1 ──> M2 ──> [run 2–3 real stories] ──> M3 ──> M4 ──> M5
       │       │                                  
       └───────┴──> most of the risk is gone here
```

**M1 + M2 are the high-value pair.** Between them they close the compile gap and
the config-drift gap — the two causes of nearly every production problem in this
project. Everything after that removes *your effort*, which is worth doing, but
only on top of a loop that is already trustworthy.

**Run real stories between M2 and M3.** Automating a process you have not yet
watched work is how you end up debugging the automation and the process at once.

---

## Rough totals

| Milestone | Your time | Claude's time |
|---|---|---|
| M0 | ~15 min | ~5 min |
| M1 | ~10 min | 1 h + unknown for first compile |
| M2 | 0 | ~30 min |
| M3 | ~10 min | ~2 h |
| M4 | ~30 min + DNS | ~4 h |
| M5 | ~25 min | ~2 h |

Your total across all five: **roughly 1.5 hours**, nearly all of it credentials
and settings.

---

## Open decisions

1. **n8n Cloud or self-hosted?** Self-hosting is free and the server has room,
   but it is another container to keep alive — and if n8n dies, the loop stalls
   silently.
2. **Auto-merge, or you press the button?** Recommendation: you press it, until
   three clean cycles have passed.
3. **Escalation email sender** — a second Gmail, or a proper provider
   (Brevo/Mailjet free tiers include bounce tracking).
4. **Does the loop need to run when you are asleep?** If yes, the coding agent
   has to move into GitHub Actions and lose the accumulated project context.
   That is a real trade-off, not a formality.
