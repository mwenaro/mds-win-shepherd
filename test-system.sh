#!/bin/bash

echo "🚀 Testing Windows Management System..."
echo ""

# Test 1: Agent Health Check
echo "1️⃣  Testing Agent Health Check..."
curl -s http://localhost:3001/health | echo "Response: $(cat)"
echo ""

# Test 2: Agent Status
echo "2️⃣  Testing Agent Status..."
curl -s http://localhost:3001/status | echo "Response: $(cat)"
echo ""

echo "✅ Basic agent tests completed!"
echo ""
echo "📝 To test the full system:"
echo "   1. Start agent: cd agent && npm run dev"
echo "   2. Start controller: cd controller && npm run dev"
echo "   3. Open http://localhost:3000 in browser"
echo ""
echo "🎯 Available agent endpoints:"
echo "   GET  http://localhost:3001/health"
echo "   GET  http://localhost:3001/status"  
echo "   POST http://localhost:3001/start   (body: {\"path\": \"C:\\\\Program.exe\"})"
echo "   POST http://localhost:3001/stop    (body: {\"name\": \"program\"})"
echo "   POST http://localhost:3001/restart"
echo "   POST http://localhost:3001/disconnect"
echo "   POST http://localhost:3001/reconnect"