@echo off
setlocal

pushd "%~dp0"
if errorlevel 1 (
    echo ERROR: Could not access the project directory.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found. Install Node.js and try again.
    popd
    pause
    exit /b 1
)

echo Building Regex Extract ^& Tabular...
call npm run build
if errorlevel 1 goto build_failed

echo.
echo Build completed successfully.
echo Output: src-tauri\target\release\regex-extract-tabular.exe
popd
pause
exit /b 0

:build_failed
set "BUILD_EXIT_CODE=%ERRORLEVEL%"
echo.
echo ERROR: Build failed with exit code %BUILD_EXIT_CODE%.
popd
pause
exit /b %BUILD_EXIT_CODE%
