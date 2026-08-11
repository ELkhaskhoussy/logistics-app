# Executor watcher — setup

One-time setup. After this, you describe a need and give a green light; nothing
else is required from you until something genuinely needs a human.

---

## 1. Install the Claude Code CLI

Antigravity bundles Claude Code inside the IDE, but a background script cannot
call that copy — it needs `claude` on the PATH. In PowerShell:

```powershell
npm install -g @anthropic-ai/claude-code
```

Verify:

```powershell
claude --version
```

If that prints a version, the watcher can drive it.

---

## 2. Log the CLI in

```powershell
claude
```

Choose the same account you used in Antigravity, then exit with `/exit`. The
login is stored, so the watcher runs unattended from then on.

---

## 3. Try one cycle by hand

Work order 001 is already written and `PENDING`:

```powershell
cd C:\Users\khask\logistics-app
powershell -ExecutionPolicy Bypass -File orchestrator\watcher.ps1 -Once
```

`-Once` runs a single pass and exits — good for confirming it works before
leaving it running. Watch `orchestrator/watcher.log`.

**Expect the first run to surface real errors.** The backend files in order 001
have never been compiled. That is the point of running it first.

---

## 4. Leave it running

Either keep a terminal open:

```powershell
powershell -ExecutionPolicy Bypass -File orchestrator\watcher.ps1
```

…or register it as a scheduled task so it survives reboots:

```powershell
$action  = New-ScheduledTaskAction -Execute "powershell.exe" `
           -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File C:\Users\khask\logistics-app\orchestrator\watcher.ps1"
$trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "Sendlo executor watcher" `
                       -Action $action -Trigger $trigger -RunLevel Highest
```

Remove it later with:

```powershell
Unregister-ScheduledTask -TaskName "Sendlo executor watcher" -Confirm:$false
```

---

## How it behaves

| Work order status | Watcher |
|---|---|
| `PENDING` | Flips to `IN_PROGRESS`, runs the executor, then sets `DONE` |
| `IN_PROGRESS` | Ignores — a run is already underway |
| `DONE` / `BLOCKED` | Ignores — waits for the next order |

The status flips **before** the executor starts, so a crash mid-run cannot cause
a re-trigger loop. A lock file prevents two watchers running at once, and a lock
older than two hours is treated as stale.

---

## The loop, once this is done

```
You:          describe a need
Orchestrator: confirms scope          ← your only required input
You:          "go"
Orchestrator: writes WORKORDER.md (PENDING)
Watcher:      fires within 30 seconds
Executor:     branch → code → build → test → push → STATUS.md
CI:           compiles and bundles the branch
Orchestrator: reads STATUS.md + CI, validates production, issues the next order
```

---

## Honest limitations

**The watcher only runs while your machine is on.** It is a local process, not a
service in the cloud. If the machine is asleep, work orders queue until it wakes.

**`--dangerously-skip-permissions` is on.** That is what makes it
non-interactive — the executor will not stop to ask before editing files or
running commands. It is constrained by `PROTOCOL.md` (never merge, never touch
production, never push a failing build), but those are instructions, not
sandboxing. If you would rather approve each action, remove that flag from
`watcher.ps1` and the executor will prompt — at the cost of needing you present.

**The orchestrator still has to be running** to write the next work order and
read status. Full autonomy across the whole cycle would mean moving the
orchestrator into GitHub Actions too, losing the accumulated project context.
That trade-off is worth revisiting only once this loop is proven.
