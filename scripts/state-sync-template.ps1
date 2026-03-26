param(
          [Parameter(Mandatory = $true)][string]$AgentName,
          [string]$SharedRoot = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_shared\agents",
          [string]$BaseBranch = "owner/integration"
)

$dstDir = Join-Path $SharedRoot "$AgentName\reports\_runs"
New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

$path = Join-Path $dstDir "TP-STATE-SYNC-001.md"

$template = @"
# TP-STATE-SYNC-001 — State Sync Report

- Agent: $AgentName
- Branch: agent/$AgentName
- Base branch: $BaseBranch
- Last synced base commit: <hash>
- git status: clean

## Summary (3–7 bullets)
- ...

## Worktree / Repo State
- Synced from: $BaseBranch
- Local changes: none / (describe)
- Untracked files: none / (describe)

## What I completed
- ...

## What changed (if any)
- ...

## Risks / Blockers
- ...

## References
- Paths:
  - ...
- Commit hashes:
  - ...

## Handoff to Next Agent (MANDATORY)
- What I completed:
  - ...
- What changed:
  - ...
- Next step for you:
  - ...
- Risks/Blockers:
  - ...
- References (paths + commit hashes):
  - ...
"@

Set-Content -Encoding UTF8 -Path $path -Value $template
Write-Host "Created template: $path" -ForegroundColor Green
