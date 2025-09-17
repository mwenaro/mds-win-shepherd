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
      name: 'MdsWinShepherd-Agent-01',
      ip: 'localhost:3001',
      status: 'offline',
      lastSeen: new Date().toISOString(),
      shepherdId: 'MdsWinShepherd-01'
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
        status: 'offline' as const
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
      {/* PC Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pcs.map((pc) => (
          <div
            key={pc.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPC === pc.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
            onClick={() => setSelectedPC(pc.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-semibold text-lg">{pc.pcName || pc.name}</h3>
                {pc.shepherdId && (
                  <span className="text-blue-600 text-sm font-medium">{pc.shepherdId}</span>
                )}
              </div>
              <div className={`w-3 h-3 rounded-full ${
                pc.status === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <p className="text-gray-600 text-sm">{pc.ip}</p>
            {pc.agentId && (
              <p className="text-gray-500 text-xs">Agent: {pc.agentId}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Last seen: {new Date(pc.lastSeen).toLocaleString()}
            </p>
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