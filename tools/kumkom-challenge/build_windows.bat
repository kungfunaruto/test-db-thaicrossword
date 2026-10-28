@echo off
REM Build ThaiWordChallenge.exe (single file, dictionary embedded). Run on Windows.
REM Requires Python 3.11+ (tick "Add python.exe to PATH" when installing) from https://www.python.org/downloads/windows/
cd /d "%~dp0"
where python >nul 2>nul || (echo Python was not found. Install Python 3 and tick "Add python.exe to PATH". & pause & exit /b 1)
python -m pip install --upgrade pip pyinstaller || (echo pip install failed & pause & exit /b 1)
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
python -m PyInstaller --onefile --noconsole --name ThaiWordChallenge --add-data "database\words.txt;database" RBD2026.py || (echo Build failed & pause & exit /b 1)
echo.
echo Done: %~dp0dist\ThaiWordChallenge.exe
pause
