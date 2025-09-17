#!/bin/bash
echo "Direct Agent Connection Test"
echo "==========================="
echo "Testing connection to 192.168.0.24:3001..."
echo ""

# Test with curl
echo "1. Testing with curl..."
curl -m 10 "http://192.168.0.24:3001/status" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Agent is responding!"
else
    echo "❌ Agent not responding or connection failed"
fi

echo ""
echo "2. Testing with PowerShell..."
powershell -Command "
try { 
    \$response = Invoke-WebRequest -Uri 'http://192.168.0.24:3001/status' -TimeoutSec 10
    Write-Host '✅ Agent HTTP Response:'
    \$response.Content
} catch {
    Write-Host '❌ Failed:' \$_.Exception.Message
}
"

echo ""
echo "3. Testing manual agent addition..."
echo "If agent responds, you can add it manually in the controller UI:"
echo "   IP: 192.168.0.24:3001"
echo ""