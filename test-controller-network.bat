@echo off
echo MdsWinShepherd Controller Network Test
echo =======================================
echo Controller PC Network Diagnostics
echo.

echo 1. Checking controller PC network configuration...
echo Your IP addresses:
ipconfig | findstr "IPv4"

echo.
echo 2. Testing connectivity to target agent (192.168.0.24:3001)...
echo.
echo Testing ping first...
ping -n 2 192.168.0.24
if %errorlevel% == 0 (
    echo ✅ Target PC is reachable via ping
) else (
    echo ❌ Target PC not reachable via ping
    echo    → Check network connection and IP address
)

echo.
echo Testing port 3001 connectivity...
powershell -Command "try { $result = Test-NetConnection -ComputerName '192.168.0.24' -Port 3001 -InformationLevel Quiet; if($result) { Write-Host '✅ Port 3001 is accessible' } else { Write-Host '❌ Port 3001 is blocked' } } catch { Write-Host '❌ Connection test failed' }"

echo.
echo 3. Testing HTTP request to agent...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://192.168.0.24:3001/status' -TimeoutSec 10; Write-Host '✅ Agent responds to HTTP requests'; Write-Host 'Response:' $response.Content } catch { Write-Host '❌ Agent HTTP request failed:' $_.Exception.Message }"

echo.
echo 4. Checking if controller is running...
netstat -an | find "3030" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Controller is running on port 3030
    netstat -an | find "3030"
) else (
    echo ❌ Controller is not running on port 3030
)

echo.
echo 5. Testing controller web interface...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3030' -TimeoutSec 5; Write-Host '✅ Controller web interface is accessible' } catch { Write-Host '❌ Controller web interface failed:' $_.Exception.Message }"

echo.
echo ========================================
echo Network Test Complete
echo.
echo If ping works but port 3001 fails:
echo → Target PC firewall is blocking connections
echo → Run setup-firewall.ps1 on target PC as Administrator
echo.
echo If HTTP request fails:
echo → Agent may not be running on target PC  
echo → Start MdsWinShepherd-agent.exe on target PC
echo.
echo If controller not running:
echo → Start controller with: npm run dev
echo ========================================
pause