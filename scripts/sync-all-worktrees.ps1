param(
          [string]$WorktreesBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_worktrees",
          [string]$SharedBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_shared",
          [string]$MainProjectBase = "D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\Travelophilia v2",
          [string]$Upstream = "origin/owner/integration"
)

Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host " PHASE 1: 1-to-1 Mapping (_shared -> Central Project)" -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta

# جلب كل مجلدات الأيجنتس من مجلد الـ shared
$sharedAgents = Get-ChildItem -Path "$SharedBase\agents" -Directory
foreach ($Agent in $AgentList) {
          $agentName = $agent.Name
          $sourceReports = Join-Path $agent.FullName "reports\_runs"
    
          # لو الأيجنت ده مطلع تقارير
          if (Test-Path $sourceReports) {
                    # التطابق بالاسم: نحط التقرير في مجلد المشروع الأساسي تحت اسم نفس الأيجنت
                    $destReports = Join-Path $MainProjectBase "docs\agents\$agentName\reports\_runs"
        
                    # إنشاء المجلدات لو مش موجودة
                    if (-not (Test-Path $destReports)) {
                              New-Item -ItemType Directory -Path $destReports -Force | Out-Null
                    }
        
                    # النسخ مع احترام خصوصية كل أيجنت
                    Copy-Item -Path "$sourceReports\*.md" -Destination $destReports -Force -ErrorAction SilentlyContinue
                    Write-Host "-> Mapped: $agentName (_shared) ---> $agentName (Central Bank)" -ForegroundColor DarkGray
          }
}


Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host " PHASE 2: Aggregation & Sync (_worktrees)            " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# النجمة هنا هتجمع *كل* التقارير من *كل* الأيجنتس اللي اتنظمت في المشروع الأساسي
$AllCentralReports = "$MainProjectBase\docs\agents\*\reports\_runs\*.md"

Get-ChildItem -Path $WorktreesBase -Directory | ForEach-Object {
          $path = $_.FullName
          $agentName = $_.Name
          Push-Location $path
    
          try {
                    $branch = (git branch --show-current)
        
                    # [ميزة الحفظ التلقائي]: لو الأيجنت سايب شغل مكشوف، احفظه الأول
                    $dirty = (git status --porcelain)
                    if ($dirty) {
                              Write-Host "Saving WIP for $agentName before sync..." -ForegroundColor DarkCyan
                              git add .
                              git commit -m "chore(auto): save work-in-progress before global sync" | Out-Null
                    }

                    # المزامنة الأساسية للكود (Fetch & Merge)
                    git fetch --all --prune | Out-Null
                    git merge $Upstream -m "chore(sync): merge $Upstream into $branch" | Out-Null

                    # تحديد مسار التجميع النهائي جوه الوورك تري لكل أيجنت
                    $TargetDocs = Join-Path $path "docs\reports"
        
                    # [ميزة التنظيف]: مسح التقارير القديمة عشان لو مسحت حاجة من الأساسي تتمسح هنا كمان
                    if (Test-Path $TargetDocs) {
                              Remove-Item -Path "$TargetDocs\*" -Recurse -Force -ErrorAction SilentlyContinue
                    }
                    else {
                              New-Item -ItemType Directory -Path $TargetDocs -Force | Out-Null
                    }

                    # زرع "كل التقارير المجمعة" في فولدر هذا الأيجنت
                    Copy-Item -Path $AllCentralReports -Destination $TargetDocs -Force -ErrorAction SilentlyContinue

                    # عمل كوميت صامت للتقارير عشان المجلد ميبقاش Dirty
                    $docsDirty = (git status --porcelain docs/reports)
                    if ($docsDirty) {
                              git add docs/reports/*
                              git commit -m "docs(sync): update centralized knowledge base reports" | Out-Null
                    }

                    # الفحص النهائي والطباعة
                    $final = (git status --porcelain)
                    if ($final) {
                              Write-Host "WARN (still dirty): $branch @ $agentName" -ForegroundColor Yellow
                    }
                    else {
                              Write-Host "OK (synced): $branch @ $agentName" -ForegroundColor Green
                    }
          }
          finally {
                    Pop-Location
          }
}