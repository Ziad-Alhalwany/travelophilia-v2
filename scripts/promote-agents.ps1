param(
          [Parameter(Mandatory = $true)]
          [string]$Agents, 
          [string]$IntegrationBranch = "owner/integration",
          [string]$MainBranch = "main",
          [string]$MainProjectBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\Travelophilia v2"
)

# فك الأسماء المكتوبة بينها فواصل
$AgentList = $Agents.Split(",").Trim()

Push-Location $MainProjectBase

Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host " UPWARD PIPELINE: Securing & Promoting Agent Code" -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta

# 1. التأكد إننا على البرانش الأساسي
git checkout $IntegrationBranch | Out-Null
git pull origin $IntegrationBranch | Out-Null

# 2. أخذ لقطة احتياطية (Backup Snapshot)
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$SnapshotTag = "pre-merge-backup_$Timestamp"
git tag $SnapshotTag
Write-Host "-> Safety Snapshot created: $SnapshotTag" -ForegroundColor DarkGray
Write-Host "-----------------------------------------------------" -ForegroundColor DarkGray

$SuccessAgents = @()

# 3. المرور على كل أيجنت وفحصه
foreach ($Agent in $AgentList) {
          $AgentBranch = "agent/$Agent"
          Write-Host "`n[Processing $Agent]" -ForegroundColor Cyan
    
          # التأكد إن البرانش موجود أساساً على جهازك
          $branchExists = git branch --list $AgentBranch
          if (-not $branchExists) {
                    Write-Host "   -> SKIP: Branch '$AgentBranch' does not exist." -ForegroundColor DarkGray
                    continue
          }

          # محاولة الدمج
          $MergeOutput = git merge $AgentBranch --no-ff -m "Merge $AgentBranch into $IntegrationBranch (Auto-Promote)" 2>&1

          # تحليل نتيجة الدمج عشان نفهم إيه اللي حصل بالظبط
          if ($MergeOutput -match "Already up to date") {
                    # مفيش كود جديد اتكتب في البرانش ده
                    Write-Host "   -> INFO: No new changes to merge. Already up to date." -ForegroundColor Blue
          }
          elseif ($LASTEXITCODE -ne 0 -or $MergeOutput -match "CONFLICT") {
                    # فيه مشكلة وتعارض في الكود
                    Write-Host "   -> !! CONFLICT DETECTED !!" -ForegroundColor Red
                    Write-Host "   -> Aborting merge for $Agent to keep project safe." -ForegroundColor Red
                    git merge --abort | Out-Null
          }
          else {
                    # الدمج نجح وفيه كود جديد انضاف
                    Write-Host "   -> SUCCESS: Merged cleanly ✅" -ForegroundColor Green
                    $SuccessAgents += $Agent
          }
}

# 4. الرفع للسيرفر لو فيه حاجة نجحت
if ($SuccessAgents.Count -gt 0) {
          Write-Host "`n=====================================================" -ForegroundColor Magenta
          Write-Host " PUSHING TO SERVERS (Integration & Main)" -ForegroundColor Magenta
    
          git push origin $IntegrationBranch
          git push origin --tags

          git checkout $MainBranch | Out-Null
          git pull origin $MainBranch | Out-Null
          git merge $IntegrationBranch -m "Release: Promote integrated features to Main" | Out-Null
          git push origin $MainBranch
    
          # الرجوع لبرانش المزامنة عشان نكون جاهزين للشغل الجاي
          git checkout $IntegrationBranch | Out-Null

          Write-Host "`n🚀 PROMOTION COMPLETE! Promoted agents: $($SuccessAgents -join ', ')" -ForegroundColor Green
}
else {
          Write-Host "`n⚠️ No new code was promoted to the servers." -ForegroundColor Yellow
}

Pop-Location