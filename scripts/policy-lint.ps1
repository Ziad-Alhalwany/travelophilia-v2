param(
          [string]$RepoRoot = "."
)

$errors = @()

# 1) Forbidden tracked/untracked path docs/agents
if (Test-Path (Join-Path $RepoRoot "docs\agents")) {
          $errors += "FORBIDDEN: docs/agents exists inside repo. Must be removed. Use _shared instead."
}

# 2) Check if any TP-*.md exists under docs/agents (if folder exists)
$tp = Get-ChildItem -Path (Join-Path $RepoRoot "docs\agents") -Recurse -Filter "TP-*.md" -ErrorAction SilentlyContinue
if ($tp) {
          $errors += "FORBIDDEN: TP reports found under docs/agents. Move to _shared and delete from repo."
}

# 3) Basic git status check
$dirty = git status --porcelain
if ($dirty) {
          $errors += "INFO: working tree is dirty (not necessarily a policy violation)."
}

if ($errors.Count -eq 0) {
          Write-Host "OK: policy lint passed." -ForegroundColor Green
          exit 0
}
else {
          Write-Host "Policy Lint النتائج:" -ForegroundColor Yellow
          $errors | ForEach-Object { Write-Host "- $_" }
          exit 1
}
