@echo off
cd /d E:\projects\flux
echo Rebasing onto origin/master and pushing...
git rebase origin/master
if %errorlevel% neq 0 (
  echo Rebase failed! Aborting.
  pause
  exit /b 1
)
echo.
echo Pushing...
git push origin master
echo.
echo Done!
pause
