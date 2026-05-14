# CuuNet - Push to GitHub Script
# Chạy script này để push code lên GitHub

Write-Host "🚀 CuuNet - Push to GitHub" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor DarkGray

# Check current remote
Write-Host "`n📡 Remote hiện tại:" -ForegroundColor Yellow
git remote -v

# Set remote nếu chưa có
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "`n➕ Thêm remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/nphu211206/CuuNet.git
} else {
    Write-Host "`n✅ Remote origin đã có" -ForegroundColor Green
    # Update URL để chắc chắn đúng
    git remote set-url origin https://github.com/nphu211206/CuuNet.git
}

# Check status
Write-Host "`n📋 Git status:" -ForegroundColor Yellow
git status --short

# Stage tất cả
Write-Host "`n📦 Staging tất cả files..." -ForegroundColor Yellow
git add -A

# Commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMsg = "feat: CuuNet v1.0 - 7-phase AI disaster management platform ($timestamp)"
Write-Host "`n💾 Commit: $commitMsg" -ForegroundColor Yellow
git commit -m $commitMsg

# Push
Write-Host "`n🚀 Pushing lên GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main --force

Write-Host "`n✅ HOÀN THÀNH!" -ForegroundColor Green
Write-Host "🔗 Link: https://github.com/nphu211206/CuuNet" -ForegroundColor Cyan
Write-Host "`nBây giờ paste link này vào Mục 05 của form!" -ForegroundColor White
