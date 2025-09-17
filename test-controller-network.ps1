Write-Host "MdsWinShepherd Controller Network Test" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Controller PC Network Diagnostics" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Checking controller PC network configuration..." -ForegroundColor Green
Write-Host "Your IP addresses:"
Get-NetIPAddress -AddressFamily IPv4 -Type Unicast | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | ForEach-Object {
    Write-Host "   $($_.IPAddress) (Interface: $($_.InterfaceAlias))" -ForegroundColor White
}

Write-Host ""
Write-Host "2. Testing connectivity to target agent (192.168.0.24:3001)..." -ForegroundColor Green
Write-Host ""
Write-Host "Testing ping first..."
$pingResult = Test-Connection -ComputerName "192.168.0.24" -Count 2 -Quiet
if ($pingResult) {
    Write-Host "✅ Target PC is reachable via ping" -ForegroundColor Green
} else {
    Write-Host "❌ Target PC not reachable via ping" -ForegroundColor Red
    Write-Host "   → Check network connection and IP address" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing port 3001 connectivity..."
try {
    $portTest = Test-NetConnection -ComputerName "192.168.0.24" -Port 3001 -InformationLevel Quiet
    if ($portTest) {
        Write-Host "✅ Port 3001 is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Port 3001 is blocked" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Connection test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Testing HTTP request to agent..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://192.168.0.24:3001/status" -TimeoutSec 10
    Write-Host "✅ Agent responds to HTTP requests" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Agent HTTP request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Checking if controller is running..." -ForegroundColor Green
$controllerPort = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue
if ($controllerPort) {
    Write-Host "✅ Controller is running on port 3030" -ForegroundColor Green
    $controllerPort | ForEach-Object {
        Write-Host "   $($_.LocalAddress):$($_.LocalPort) -> State: $($_.State)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Controller is not running on port 3030" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Testing controller web interface..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3030" -TimeoutSec 5
    Write-Host "✅ Controller web interface is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Controller web interface failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Network Test Complete" -ForegroundColor Yellow
Write-Host ""
Write-Host "If ping works but port 3001 fails:" -ForegroundColor Yellow
Write-Host "→ Target PC firewall is blocking connections" -ForegroundColor Yellow
Write-Host "→ Run setup-firewall.ps1 on target PC as Administrator" -ForegroundColor Yellow
Write-Host ""
Write-Host "If HTTP request fails:" -ForegroundColor Yellow
Write-Host "→ Agent may not be running on target PC" -ForegroundColor Yellow
Write-Host "→ Start MdsWinShepherd-agent.exe on target PC" -ForegroundColor Yellow
Write-Host ""
Write-Host "If controller not running:" -ForegroundColor Yellow
Write-Host "→ Start controller with: npm run dev" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Read-Host "Press Enter to continue..."