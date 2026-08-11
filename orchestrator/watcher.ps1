<#
    Sendlo — executor watcher

    Closes the last manual step in the loop. The orchestrator (Claude in Cowork)
    writes orchestrator/WORKORDER.md with Status: PENDING. This script notices,
    flips it to IN_PROGRESS so it cannot fire twice, and runs Claude Code
    non-interactively to execute it.

    Result: the orchestrator issues work and the executor performs it with no
    human in between.

    Run once in a terminal:
        powershell -ExecutionPolicy Bypass -File orchestrator\watcher.ps1

    Or install as a scheduled task (see orchestrator/SETUP.md).
#>

param(
    [string] $RepoRoot     = "C:\Users\khask\logistics-app",
    [int]    $PollSeconds  = 30,
    # The CLI default may be a model the account has no credits for, which fails
    # instantly with "requires usage credits". Pin one the subscription covers.
    [string] $Model        = "sonnet",
    [switch] $Once
)

$ErrorActionPreference = "Stop"

$OrderPath  = Join-Path $RepoRoot "orchestrator\WORKORDER.md"
$StatusPath = Join-Path $RepoRoot "orchestrator\STATUS.md"
$LogPath    = Join-Path $RepoRoot "orchestrator\watcher.log"
$LockPath   = Join-Path $RepoRoot "orchestrator\.watcher.lock"

function Write-Log {
    param([string] $Message, [string] $Level = "INFO")
    $line = "{0} [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    Write-Host $line
    Add-Content -Path $LogPath -Value $line -Encoding UTF8
}

function Get-OrderStatus {
    if (-not (Test-Path $OrderPath)) { return $null }
    $content = Get-Content $OrderPath -Raw -Encoding UTF8
    if ($content -match '(?m)^\*\*Status:\*\*\s*(\w+)') { return $Matches[1] }
    return $null
}

function Set-OrderStatus {
    param([string] $NewStatus)
    $content = Get-Content $OrderPath -Raw -Encoding UTF8
    $updated = [regex]::Replace(
        $content,
        '(?m)^(\*\*Status:\*\*\s*)\w+',
        "`${1}$NewStatus",
        [System.Text.RegularExpressions.RegexOptions]::None,
        [System.TimeSpan]::FromSeconds(2)
    )
    Set-Content -Path $OrderPath -Value $updated -Encoding UTF8 -NoNewline
}

function Get-OrderId {
    $content = Get-Content $OrderPath -Raw -Encoding UTF8
    if ($content -match '(?m)^#\s*WORKORDER\s+(\S+)') { return $Matches[1] }
    return "unknown"
}

function Invoke-Executor {
    param([string] $OrderId)

    $prompt = @"
Execute orchestrator/WORKORDER.md following the rules in orchestrator/PROTOCOL.md.

You are the EXECUTOR. Non-negotiable:
- Do only what the work order says. Nothing else.
- Never push a failing build. Fix it, retry, and after three attempts write
  Result: BLOCKED in orchestrator/STATUS.md and stop.
- Never merge a branch. Push only.
- Never touch production, SSH or the database.
- Report honestly. If a build fails, paste the real error into STATUS.md.
- All user-facing text in this project is French.

When finished — success, failure or blocked — you MUST overwrite
orchestrator/STATUS.md using the format in PROTOCOL.md. The orchestrator reads
only that file. If you do not write it, the work is invisible.
"@

    Write-Log "Running executor for WORKORDER $OrderId"

    Push-Location $RepoRoot
    try {
        # --dangerously-skip-permissions keeps it non-interactive. Remove it if
        # you would rather approve each tool call.
        & claude -p $prompt --model $Model --dangerously-skip-permissions 2>&1 |
            Tee-Object -FilePath $LogPath -Append
        $code = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($code -ne 0) {
        Write-Log "Executor exited with code $code" "WARN"
    }
    return $code
}

# ── guard against two watchers running at once ────────────────────────────────
if (Test-Path $LockPath) {
    $age = (Get-Date) - (Get-Item $LockPath).LastWriteTime
    if ($age.TotalMinutes -lt 120) {
        Write-Log "Another watcher appears to be running (lock is $([int]$age.TotalMinutes)m old). Exiting." "WARN"
        exit 0
    }
    Write-Log "Stale lock found ($([int]$age.TotalMinutes)m). Taking over." "WARN"
}
New-Item -Path $LockPath -ItemType File -Force | Out-Null

try {
    Write-Log "Watcher started. Polling every ${PollSeconds}s. Repo: $RepoRoot"

    do {
        try {
            $status = Get-OrderStatus

            if ($status -eq "PENDING") {
                $id = Get-OrderId
                Write-Log "PENDING work order detected: $id"

                # Flip first, so a crash mid-run cannot cause a re-trigger loop.
                Set-OrderStatus "IN_PROGRESS"

                $code = Invoke-Executor -OrderId $id

                if (Test-Path $StatusPath) {
                    $result = (Get-Content $StatusPath -Raw -Encoding UTF8)
                    if ($result -match '(?m)^\*\*Result:\*\*\s*(\w+)') {
                        Write-Log "Executor reported: $($Matches[1])"
                    } else {
                        Write-Log "STATUS.md written but Result line not found" "WARN"
                    }
                } else {
                    Write-Log "Executor did not write STATUS.md" "ERROR"
                }

                Set-OrderStatus "DONE"
                Write-Log "Work order $id complete. Waiting for the next one."
            }
            elseif ($status) {
                # IN_PROGRESS / DONE / BLOCKED — nothing to do.
            }
        }
        catch {
            Write-Log "Watcher error: $($_.Exception.Message)" "ERROR"
        }

        if (-not $Once) { Start-Sleep -Seconds $PollSeconds }

    } while (-not $Once)
}
finally {
    Remove-Item $LockPath -Force -ErrorAction SilentlyContinue
    Write-Log "Watcher stopped."
}
