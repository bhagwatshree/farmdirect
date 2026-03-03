@echo off
REM =============================================================================
REM FarmDirect — Start Jenkins locally
REM Usage: jenkins\start.bat
REM =============================================================================

setlocal

set JAVA_HOME=C:\Program Files\Java\jdk-11.0.3
set JENKINS_HOME=%~dp0home
set PATH=%JAVA_HOME%\bin;D:\Node;%~dp0tools;%PATH%

echo.
echo ========================================
echo   FarmDirect Jenkins (local)
echo   JAVA_HOME  : %JAVA_HOME%
echo   JENKINS_HOME: %JENKINS_HOME%
echo   URL        : http://localhost:8080
echo ========================================
echo.

if not exist "%~dp0jenkins.war" (
    echo [ERROR] jenkins.war not found. Run setup.ps1 first.
    echo   powershell -ExecutionPolicy Bypass -File jenkins\setup.ps1
    pause
    exit /b 1
)

echo Starting Jenkins on port 8080 ...
echo Press Ctrl+C to stop.
echo.

"%JAVA_HOME%\bin\java.exe" -jar "%~dp0jenkins.war" --httpPort=8080

endlocal
