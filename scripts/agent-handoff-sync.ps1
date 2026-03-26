param(
  [string]$SharedRoot = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_shared\agents",
  [string]$AgentsIndex = ".\docs\agents-index.md",
  [string]$ReportName = "TP-STATE-SYNC-001.md",
  [string]$BaseBranch = "owner/integration",
  [switch]$DryRun,
  [switch]$AutoCommit,
  [switch]$AutoPush
)

function Ensure-RepoCleanOrFail() {
  $dirty = git status --porcelain
  if ($dirty) {
    Write-Host "ABORT: Working tree is dirty. Commit/stash first:" -ForegroundColor Red
    Write-Host $dirty
    exit 1
  }
}

function Switch-ToBaseBranch($base) {
  $cur = (git branch --show-current)
  if ($cur -eq $base) { return }

  Ensure-RepoCleanOrFail

  Write-Host "Switching branch: $cur -> $base" -ForegroundColor Yellow
  git checkout $base | Out-Null
  $now = (git branch --show-current)
  if ($now -ne $base) {
    Write-Host "ABORT: Failed to checkout $base" -ForegroundColor Red
    exit 1
  }
}

function Read-Report($path) {
  if (-not (Test-Path $path)) { return $null }
  $txt = Get-Content -Raw -Encoding UTF8 $path

  $branch = ([regex]::Match($txt, '(?im)^\s*-\s*Branch:\s*(.+)\s*$')).Groups[1].Value.Trim()
  $commit = ([regex]::Match($txt, '(?im)^\s*-\s*Last\s+synced.*commit.*:\s*(.+)\s*$')).Groups[1].Value.Trim()
  $status = ([regex]::Match($txt, '(?im)^\s*-\s*git\s+status:\s*(.+)\s*$')).Groups[1].Value.Trim()

  $handoff = ""
  $m = [regex]::Match($txt, '(?ims)^##\s*\d*\)?\s*Handoff.*?\r?\n(.*?)(\r?\n##\s+|\z)')
  if ($m.Success) { $handoff = $m.Groups[1].Value.Trim() }

  return [pscustomobject]@{
    Branch  = $branch
    Commit  = $commit
    Status  = $status
    Handoff = $handoff
  }
}

function Upsert-SnapshotBlock($indexPath, $block) {
  $start = "<!-- BEGIN STATE SYNC SNAPSHOT -->"
  $end = "<!-- END STATE SYNC SNAPSHOT -->"

  if (-not (Test-Path $indexPath)) {
    throw "agents-index not found: $indexPath"
  }

  $content = Get-Content -Raw -Encoding UTF8 $indexPath

  if ($content -match [regex]::Escape($start) -and $content -match [regex]::Escape($end)) {
    $pattern = "(?s)$([regex]::Escape($start)).*?$([regex]::Escape($end))"
    $replacement = "$start`r`n$block`r`n$end"
    return [regex]::Replace($content, $pattern, $replacement)
  }
  else {
    return ($content.TrimEnd() + "`r`n`r`n$start`r`n$block`r`n$end`r`n")
  }
}

# ========== MAIN FLOW ==========

# 0) Ensure we are on the working base branch (auto-switch)
Switch-ToBaseBranch $BaseBranch

# 1) Validate shared root exists
if (-not (Test-Path $SharedRoot)) {
  Write-Host "ABORT: SharedRoot not found: $SharedRoot" -ForegroundColor Red
  exit 1
}

# 2) Collect agent folders (ignore folders starting with "_" مثل _imports)
$agents = Get-ChildItem -Directory $SharedRoot |
Where-Object { $_.Name -notmatch '^_' } |
Select-Object -ExpandProperty Name |
Sort-Object

$now = Get-Date -Format "yyyy-MM-dd dddd HH:mm:ss"

$rows = @()
foreach ($a in $agents) {
  $report = Join-Path $SharedRoot "$a\reports\_runs\$ReportName"
  $r = Read-Report $report

  if ($null -eq $r) {
    $rows += "### $a`r`n- Report: NOT FOUND ($ReportName)`r`n"
    continue
  }

  $h = $r.Handoff
  if ([string]::IsNullOrWhiteSpace($h)) { $h = "_(Handoff section missing)_" }

  $b = $r.Branch
  $c = $r.Commit
  $s = $r.Status
  if ([string]::IsNullOrWhiteSpace($b)) { $b = "_" }
  if ([string]::IsNullOrWhiteSpace($c)) { $c = "_" }
  if ([string]::IsNullOrWhiteSpace($s)) { $s = "_" }

  $rows += @"
### $a
- Branch: $b
- Last synced commit: $c
- git status: $s

**Handoff**
$h

"@
}

$block = @"
> Auto-generated from `_shared` - $now

$($rows -join "`r`n")
"@

if ($DryRun) {
  Write-Host "=== DRY RUN: Snapshot block ==="
  Write-Host $block
  exit 0
}

# 3) Update docs/agents-index.md snapshot block
$newContent = Upsert-SnapshotBlock $AgentsIndex $block
Set-Content -Encoding UTF8 -Path $AgentsIndex -Value $newContent
Write-Host "Updated: $AgentsIndex" -ForegroundColor Green

# 4) Optional: commit + push
if ($AutoCommit) {
  git add $AgentsIndex | Out-Null
  $staged = git diff --staged --name-only
  if (-not $staged) {
    Write-Host "No staged changes to commit." -ForegroundColor Yellow
    exit 0
  }

  git commit -m "docs(agents): update state sync snapshot" | Out-Null
  Write-Host "Committed snapshot update." -ForegroundColor Green

  if ($AutoPush) {
    git push origin $BaseBranch | Out-Null
    Write-Host "Pushed to origin/$BaseBranch" -ForegroundColor Green
  }
}
