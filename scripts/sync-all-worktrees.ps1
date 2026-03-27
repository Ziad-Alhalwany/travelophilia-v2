param(
          [string]$WorktreesBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_worktrees",
          [string]$Upstream = "origin/owner/integration"
)

Get-ChildItem -Path $WorktreesBase -Directory | ForEach-Object {
          $path = $_.FullName
          Push-Location $path
          try {
                    $branch = (git branch --show-current)
                    $dirty = (git status --porcelain)

                    if ($dirty) {
                              Write-Host "SKIP (dirty): $branch @ $($_.Name)" -ForegroundColor Yellow
                              return
                    }

                    git fetch --all --prune | Out-Null
                    git merge $Upstream -m "chore(sync): merge $Upstream into $branch" | Out-Null

                    $final = (git status --porcelain)
                    if ($final) {
                              Write-Host "WARN (still dirty): $branch @ $($_.Name)" -ForegroundColor Yellow
                    }
                    else {
                              Write-Host "OK (synced): $branch @ $($_.Name)" -ForegroundColor Green
                    }
          }
          finally {
                    Pop-Location
          }
}
