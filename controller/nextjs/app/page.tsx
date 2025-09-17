'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface PC {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  lastSeen: string
  pcName?: string
  agentId?: string
  shepherdId?: string // MdsWinShepherd-01, MdsWinShepherd-02, etc.
}

interface AgentStatus {
  hostname: string
  platform: string
  status: string
  timestamp: string
}

interface PCInfo {
  pcName: string
  agentId: string
  displayName: string
  platform: string
  architecture: string
  timestamp: string
}

export default function Dashboard() {
  const [pcs, setPcs] = useState<PC[]>([
    {
      id: '1',
      name: 'Local Agent',
      ip: 'localhost:3001',
      status: 'offline',
      lastSeen: new Date().toISOString(),
      shepherdId: 'MdsWinShepherd-01',
      pcName: undefined // Will be updated when agent responds
    }
  ])
  const [selectedPC, setSelectedPC] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const [programPath, setProgramPath] = useState('C:\\Windows\\System32\\notepad.exe')
  const [programName, setProgramName] = useState('notepad')
  const [selectedProgram, setSelectedProgram] = useState('notepad')
  const [customPath, setCustomPath] = useState('')
  const [customName, setCustomName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastOperationStatus, setLastOperationStatus] = useState<'success' | 'error' | null>(null)
  const [newAgentIP, setNewAgentIP] = useState('')
  const [showAgentManager, setShowAgentManager] = useState(false)

  // Common Windows programs - paths will be auto-detected
  const commonPrograms = [
    { name: 'Notepad', path: 'notepad', processName: 'notepad' },
    { name: 'Paint', path: 'mspaint', processName: 'mspaint' },
    { name: 'Calculator', path: 'calc', processName: 'calculator' },
    { name: 'Word Pad', path: 'wordpad', processName: 'wordpad' },
    { name: 'MS Word', path: 'winword', processName: 'winword' },
    { name: 'MS Excel', path: 'excel', processName: 'excel' },
    { name: 'MS PowerPoint', path: 'powerpnt', processName: 'powerpnt' },
    { name: 'MS Publisher', path: 'mspub', processName: 'mspub' },
    { name: 'Google Chrome', path: 'chrome', processName: 'chrome' },
    { name: 'Mozilla Firefox', path: 'firefox', processName: 'firefox' },
    { name: 'Edge', path: 'msedge', processName: 'msedge' },
    { name: 'File Explorer', path: 'explorer', processName: 'explorer' },
    { name: 'Task Manager', path: 'taskmgr', processName: 'taskmgr' },
    { name: 'Control Panel', path: 'control', processName: 'control' },
    { name: 'Other (Custom)', path: '', processName: '' }
  ]

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)])
  }

  const handleProgramSelect = (programKey: string) => {
    setSelectedProgram(programKey)
    const program = commonPrograms.find(p => p.processName === programKey)
    if (program && program.path) {
      setProgramPath(program.path)
      setProgramName(program.processName)
    } else if (programKey === '') {
      // Other/Custom selected
      setProgramPath(customPath)
      setProgramName(customName)
    }
  }

  const handleCustomPathChange = (path: string) => {
    setCustomPath(path)
    if (selectedProgram === '') {
      setProgramPath(path)
    }
  }

  const handleCustomNameChange = (name: string) => {
    setCustomName(name)
    if (selectedProgram === '') {
      setProgramName(name)
    }
  }

  const generateShepherdId = (pcList: PC[], newPcName: string) => {
    // Check if we already have a shepherd ID for this PC name
    const existingPc = pcList.find(p => p.pcName === newPcName && p.shepherdId)
    if (existingPc) {
      return existingPc.shepherdId
    }

    // Generate new sequential ID
    const existingIds = pcList
      .map(p => p.shepherdId)
      .filter(id => id && id.startsWith('MdsWinShepherd-'))
      .map(id => parseInt(id!.replace('MdsWinShepherd-', '')))
      .filter(num => !isNaN(num))
    
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
    return `MdsWinShepherd-${nextId.toString().padStart(2, '0')}`
  }

  const sendCommand = async (endpoint: string, data: any = {}, showLoading = true) => {
    if (!selectedPC) {
      addLog('Please select a PC first')
      setLastOperationStatus('error')
      return { success: false, message: 'No PC selected' }
    }

    if (showLoading) {
      setIsLoading(true)
      setLastOperationStatus(null)
    }

    try {
      const pc = pcs.find(p => p.id === selectedPC)
      if (!pc) {
        setIsLoading(false)
        return { success: false, message: 'PC not found' }
      }

      addLog(`Executing ${endpoint}...`)
      const response = await axios.post(`http://${pc.ip}${endpoint}`, data)
      
      if (response.data.success) {
        addLog(`✅ ${endpoint}: ${response.data.data || response.data.message || 'Success'}`)
        setLastOperationStatus('success')
        setIsLoading(false)
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setLastOperationStatus(null)
        }, 3000)
        
        return { success: true, message: response.data.data || response.data.message }
      } else {
        addLog(`❌ ${endpoint}: ${response.data.error || 'Failed'}`)
        setLastOperationStatus('error')
        setIsLoading(false)
        
        // Clear error status after 5 seconds
        setTimeout(() => {
          setLastOperationStatus(null)
        }, 5000)
        
        return { success: false, message: response.data.error }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      addLog(`❌ Error ${endpoint}: ${errorMessage}`)
      setLastOperationStatus('error')
      setIsLoading(false)
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setLastOperationStatus(null)
      }, 5000)
      
      return { success: false, message: errorMessage }
    }
  }

  const addAgent = async () => {
    if (!newAgentIP.trim()) {
      addLog('Please enter an agent IP address')
      return
    }

    const agentIP = newAgentIP.trim()
    const newId = (pcs.length + 1).toString()
    
    addLog(`🔗 Attempting to connect to agent at ${agentIP}...`)
    
    // Test connection to the agent
    try {
      const response = await axios.get(`http://${agentIP}/status`, {
        timeout: 10000 // Increased timeout for network connections
      })
      
      addLog(`📡 Received response from ${agentIP}: ${JSON.stringify(response.data)}`)
      
      if (response.data.success) {
        const newPC: PC = {
          id: newId,
          name: `Agent-${newId}`,
          ip: agentIP,
          status: 'online',
          lastSeen: new Date().toISOString()
        }
        
        setPcs(prev => [...prev, newPC])
        setNewAgentIP('')
        addLog(`✅ Agent added successfully: ${agentIP}`)
      } else {
        addLog(`❌ Agent responded but status is not successful: ${JSON.stringify(response.data)}`)
      }
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message || 'Unknown error'
      addLog(`❌ Failed to connect to agent at ${agentIP}`)
      addLog(`   Error details: ${errorMsg}`)
      addLog(`   Error code: ${error.code || 'N/A'}`)
    }
  }

  const removeAgent = (pcId: string) => {
    setPcs(prev => prev.filter(pc => pc.id !== pcId))
    if (selectedPC === pcId) {
      setSelectedPC('')
    }
    addLog(`Agent removed: ${pcId}`)
  }

  const scanForAgents = async () => {
    addLog('🔍 Scanning network for agents...')
    setIsLoading(true)
    
    // Scan common network ranges
    const networkRanges = [
      '192.168.0.',  // Common router default
      '192.168.1.',  // Most common home network range  
      '10.0.0.',     // Another common range
    ]
    
    const promises = []
    
    // Scan each network range
    for (const baseIP of networkRanges) {
      for (let i = 1; i <= 254; i++) {
        const ip = `${baseIP}${i}:3001`
        promises.push(
          axios.get(`http://${ip}/status`, { timeout: 1500 })
            .then(() => ({ ip, success: true }))
            .catch(() => ({ ip, success: false }))
        )
      }
    }
    
    try {
      const results = await Promise.all(promises)
      const foundAgents = results.filter(r => r.success)
      
      for (const agent of foundAgents) {
        // Check if we already have this agent
        if (!pcs.find(pc => pc.ip === agent.ip)) {
          const newId = (pcs.length + 1).toString()
          const newPC: PC = {
            id: newId,
            name: `Discovered-${newId}`,
            ip: agent.ip,
            status: 'online',
            lastSeen: new Date().toISOString()
          }
          setPcs(prev => [...prev, newPC])
        }
      }
      
      addLog(`🎯 Network scan complete. Found ${foundAgents.length} new agents`)
    } catch (error) {
      addLog('❌ Network scan failed')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPCStatus = async (pc: PC) => {
    try {
      // First check basic status
      const statusResponse = await axios.get(`http://${pc.ip}/status`, {
        timeout: 5000
      })
      
      // Then get PC identification info
      let pcInfo: PCInfo | null = null
      try {
        const pcInfoResponse = await axios.get(`http://${pc.ip}/pc-info`, {
          timeout: 3000
        })
        pcInfo = pcInfoResponse.data.data
      } catch (pcInfoError) {
        // PC info fetch failed, but status worked, so just continue
      }

      const pcName = pcInfo?.pcName || pc.pcName || 'Unknown PC'
      const shepherdId = pc.shepherdId || generateShepherdId(pcs, pcName)

      return {
        ...pc,
        status: 'online' as const,
        lastSeen: new Date().toISOString(),
        pcName: pcName,
        agentId: pcInfo?.agentId || pc.agentId || 'unknown-agent',
        shepherdId: shepherdId,
        name: pcName // Update the display name to PC name
      }
    } catch (error) {
      return {
        ...pc,
        status: 'offline' as const,
        lastSeen: new Date().toISOString()
      }
    }
  }

  useEffect(() => {
    const checkAllPCs = async () => {
      const updatedPCs = await Promise.all(
        pcs.map(pc => checkPCStatus(pc))
      )
      setPcs(updatedPCs)
    }

    checkAllPCs()
    const interval = setInterval(checkAllPCs, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Agent Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">MdsWinShepherd - Network Controller</h1>
            <div className="text-sm text-gray-600">
              {pcs.length} agent{pcs.length !== 1 ? 's' : ''} • {pcs.filter(pc => pc.status === 'online').length} online
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
              title="Refresh all agents"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowAgentManager(!showAgentManager)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showAgentManager ? 'Hide' : 'Manage Agents'}
            </button>
          </div>
        </div>
        
        {showAgentManager && (
          <div className="border-t pt-4 space-y-4">
            <h2 className="text-lg font-semibold">Agent Management</h2>
            
            {/* Add Agent */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Agent IP:Port (e.g., 192.168.1.100:3001)"
                value={newAgentIP}
                onChange={(e) => setNewAgentIP(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addAgent}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Agent
              </button>
              <button
                onClick={scanForAgents}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Scanning...' : 'Auto Discover'}
              </button>
            </div>
            
            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
              <p><strong>📋 How to Add Agents:</strong></p>
              <p>1. <strong>Start agent</strong> on target PC (run install.bat or start-agent.bat)</p>
              <p>2. <strong>Get IP address</strong> from agent console (e.g., "192.168.1.100:3001")</p>
              <p>3. <strong>Enter the IP:Port</strong> in the box above and click "Add Agent"</p>
              <p>4. <strong>Never use 0.0.0.0</strong> - that's not a real network address!</p>
              <p>• Each PC will have a different IP address (192.168.1.100, 192.168.1.101, etc.)</p>
            </div>
          </div>
        )}
      </div>

      {/* PC Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pcs.map((pc) => (
          <div
            key={pc.id}
            className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
              selectedPC === pc.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
            onClick={() => setSelectedPC(pc.id)}
          >
            {/* Selected indicator */}
            {selectedPC === pc.id && (
              <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
            {/* Header with status and remove button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${
                  pc.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  pc.status === 'online' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {pc.status === 'online' ? '✅ Running and ready for connections' : '❌ Offline'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAgent(pc.id);
                }}
                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                title="Remove agent"
              >
                ✕
              </button>
            </div>

            {/* Agent Details */}
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">URL:</span>
                <p className="text-sm font-mono text-blue-600">http://{pc.ip}</p>
              </div>
              
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">PC Name:</span>
                <p className="text-sm font-semibold text-gray-800">
                  {pc.pcName ? (
                    pc.pcName
                  ) : pc.status === 'offline' ? (
                    <span className="text-gray-500 italic">Unknown - Agent Offline</span>
                  ) : (
                    <span className="text-gray-500 italic">Fetching...</span>
                  )}
                </p>
              </div>
              
              {pc.agentId && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agent ID:</span>
                  <p className="text-xs font-mono text-gray-600 break-all">{pc.agentId}</p>
                </div>
              )}
              
              {pc.shepherdId && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shepherd ID:</span>
                  <p className="text-sm text-blue-600 font-medium">{pc.shepherdId}</p>
                </div>
              )}
              
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Seen:</span>
                <p className="text-xs text-gray-500">{new Date(pc.lastSeen).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Control Panel</h2>
        
        {/* Program Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Program Control</h3>
            
            {/* Program Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => handleProgramSelect(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {commonPrograms.map((program) => (
                  <option key={program.processName} value={program.processName}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Program Inputs (shown when "Other" is selected) */}
            {selectedProgram === '' && (
              <div className="space-y-3 p-3 bg-gray-50 rounded border">
                <h4 className="font-medium text-sm text-gray-700">Custom Program</h4>
                <div>
                  <label className="block text-xs font-medium mb-1">Program Path</label>
                  <input
                    type="text"
                    value={customPath}
                    onChange={(e) => handleCustomPathChange(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="C:\\Path\\To\\Program.exe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Process Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => handleCustomNameChange(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="program_name"
                  />
                </div>
              </div>
            )}

            {/* Current Selection Display */}
            {selectedProgram !== '' && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-medium text-sm text-blue-800 mb-2">Selected Program</h4>
                <p className="text-xs text-blue-600 break-all">Path: {programPath}</p>
                <p className="text-xs text-blue-600">Process: {programName}</p>
              </div>
            )}

            {/* Status Indicator */}
            {(isLoading || lastOperationStatus) && (
              <div className={`p-3 rounded border ${
                isLoading 
                  ? 'bg-blue-50 border-blue-200 text-blue-800' 
                  : lastOperationStatus === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isLoading && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm font-medium">Processing...</span>
                      </>
                    )}
                    {!isLoading && lastOperationStatus === 'success' && (
                      <>
                        <div className="text-green-600 mr-2">✅</div>
                        <span className="text-sm font-medium">Operation completed successfully</span>
                      </>
                    )}
                    {!isLoading && lastOperationStatus === 'error' && (
                      <>
                        <div className="text-red-600 mr-2">❌</div>
                        <span className="text-sm font-medium">Operation failed - check logs</span>
                      </>
                    )}
                  </div>
                  {!isLoading && (
                    <button
                      onClick={() => setLastOperationStatus(null)}
                      className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                  {isLoading && (
                    <button
                      onClick={() => {
                        setIsLoading(false)
                        setLastOperationStatus(null)
                        addLog('⚠️ Loading state manually cleared')
                      }}
                      className="text-xs px-2 py-1 bg-red-200 hover:bg-red-300 rounded text-red-700"
                    >
                      Force Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => sendCommand('/start', { path: programPath })}
                disabled={!selectedPC || !programPath || isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors text-sm font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting...
                  </>
                ) : (
                  'Start Program'
                )}
              </button>
              <button
                onClick={() => sendCommand('/stop', { name: programName })}
                disabled={!selectedPC || !programName || isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors text-sm font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Stopping...
                  </>
                ) : (
                  'Stop Program'
                )}
              </button>
            </div>
          </div>

          {/* System Controls */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">System Control</h3>
            <button
              onClick={() => sendCommand('/restart')}
              disabled={!selectedPC}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
            >
              Restart PC
            </button>
            <button
              onClick={() => sendCommand('/disconnect')}
              disabled={!selectedPC}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
            >
              Disconnect Internet
            </button>
            <button
              onClick={() => sendCommand('/reconnect')}
              disabled={!selectedPC}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
            >
              Reconnect Internet
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No activity yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
        >
          Clear Logs
        </button>
      </div>
    </div>
  )
}