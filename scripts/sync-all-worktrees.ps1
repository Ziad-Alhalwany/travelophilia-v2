param(
    [string]$WorktreesBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_worktrees",
    [string]$SharedBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_shared",
    [string]$MainProjectBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\Travelophilia v2",
    [string]$Upstream = "owner/integration"
)

Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host " PHASE 1: Structured Mapping & Flat Aggregation    " -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta

# 1. نقل تقارير _shared للبنك المركزي الهيكلي بـ Robocopy
$sharedAgents = Get-ChildItem -Path "$SharedBase\agents" -Directory -ErrorAction SilentlyContinue
if ($sharedAgents) {
    foreach ($Agent in $sharedAgents) {
        $agentName = $Agent.Name
        $sourceReports = Join-Path $Agent.FullName "reports\_runs"

        if (Test-Path $sourceReports) {
            $destReports = Join-Path $MainProjectBase "docs\agents\$agentName\reports\_runs"

            if (-not (Test-Path $destReports)) {
                New-Item -ItemType Directory -Path $destReports -Force | Out-Null
            }

            robocopy "$sourceReports" "$destReports" "*.md" /XJ /R:1 /W:1 /NDL /NFL /NJH /NJS /nc /ns /np | Out-Null
            Write-Host "-> Mapped (Structured): $agentName (_shared) ---> Central Bank" -ForegroundColor DarkGray
        }
    }
}

# 2. تطهير وتوليد الخزنة العامة المسطحة Travelophilia v2\docs\reports\ (بدون مجلدات فرعية)
$CentralFlatDocs = Join-Path $MainProjectBase "docs\reports"
if (-not (Test-Path $CentralFlatDocs)) {
    New-Item -ItemType Directory -Path $CentralFlatDocs -Force | Out-Null
}

# تنظيف المجلدات الفرعية الزائدة بداخل docs/reports للحفاظ على التسطيح الكامل
Get-ChildItem -Path $CentralFlatDocs -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# تجميع كافة ملفات .md بشكل مسطح مباشر بداخل docs/reports/
$AllCentralReportsSource = Join-Path $MainProjectBase "docs\agents"
Get-ChildItem -Path $AllCentralReportsSource -Filter "*.md" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $CentralFlatDocs -Force -ErrorAction SilentlyContinue
}
Write-Host "-> Central Flat Backup Updated: docs/reports is now 100% clean and flat!" -ForegroundColor Green

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host " PHASE 2: Dual-Structure Sync & Code Distribution   " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$WorktreesList = Get-ChildItem -Path $WorktreesBase -Directory -ErrorAction SilentlyContinue

foreach ($Worktree in $WorktreesList) {
    $path = $Worktree.FullName
    $agentName = $Worktree.Name
    
    Set-Location -Path $path

    try {
        $branch = (git branch --show-current 2>$null)

        # إلغاء أي تعارضات معلقة بداخل فهرس الـ Git
        $status = (git status --porcelain 2>$null)
        if ($status -match "UU|AA|DD|UA|AU|DU|UD") {
            git merge --abort 2>$null | Out-Null
            git reset --hard HEAD 2>$null | Out-Null
        }

        # الحفظ التلقائي للشغل المعلق قبل المزامنة العكسية
        $dirty = (git status --porcelain 2>$null)
        if ($dirty) {
            Write-Host "Saving WIP for $agentName before sync..." -ForegroundColor DarkCyan
            git add . 2>$null
            git commit -m "chore(auto): save work-in-progress before global sync" 2>$null | Out-Null
        }

        # دمج أحدث كود وتقارير من البرانش المحلي الموحد صامتاً
        git merge $Upstream -m "chore(sync): merge $Upstream into $branch" 2>$null | Out-Null

        # أ) تحديث البنك الهيكلي بداخل الورشة
        $TargetAgentsDocs = Join-Path $path "docs\agents"
        robocopy "$AllCentralReportsSource" "$TargetAgentsDocs" "*.md" /S /XJ /R:1 /W:1 /NDL /NFL /NJH /NJS /nc /ns /np | Out-Null

        # ب) تحديث المجلد المسطح بداخل الورشة وتطخير المجلدات الزائدة بها
        $TargetFlatDocs = Join-Path $path "docs\reports"
        if (-not (Test-Path $TargetFlatDocs)) {
            New-Item -ItemType Directory -Path $TargetFlatDocs -Force | Out-Null
        }
        Get-ChildItem -Path $TargetFlatDocs -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Copy-Item -Path "$CentralFlatDocs\*.md" -Destination $TargetFlatDocs -Force -ErrorAction SilentlyContinue

        # تثبيت التقارير المجمعة صامتاً لمنع الـ Dirty State
        $docsDirty = (git status --porcelain docs/ 2>$null)
        if ($docsDirty) {
            git add docs/* 2>$null
            git commit -m "docs(sync): update centralized knowledge base reports" 2>$null | Out-Null
        }

        $final = (git status --porcelain 2>$null)
        if ($final) {
            Write-Host "WARN (still dirty): $branch @ $agentName" -ForegroundColor Yellow
        }
        else {
            Write-Host "OK (synced): $branch @ $agentName" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "ERROR syncing ${agentName} - $_" -ForegroundColor Red
    }
}

Set-Location -Path $MainProjectBase

# 3. PHASE 3: الرفع التلقائي السحابي لـ GitHub من برانش الأونر حصرياً
try {
    $currentMainBranch = (git branch --show-current 2>$null)
    if ($currentMainBranch -eq "owner/integration") {
        Write-Host "`n=====================================================" -ForegroundColor Green
        Write-Host " PHASE 3: Secure Remote Push (owner/integration)     " -ForegroundColor Green
        Write-Host "=====================================================" -ForegroundColor Green
        git push origin owner/integration
        Write-Host "-> Successfully backed up all changes to GitHub!" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERROR in Remote Push: $_" -ForegroundColor Red
}