'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface PC {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  lastSeen: string
}

interface AgentStatus {
  hostname: string
  platform: string
  status: string
  timestamp: string
}

export default function Dashboard() {
  const [pcs, setPcs] = useState<PC[]>([
    {
      id: '1',
      name: 'PC-AGENT-01',
      ip: 'localhost:3001',
      status: 'offline',
      lastSeen: new Date().toISOString()
    }
  ])
  const [selectedPC, setSelectedPC] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const [programPath, setProgramPath] = useState('C:\\Windows\\System32\\notepad.exe')
  const [programName, setProgramName] = useState('notepad')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)])
  }

  const sendCommand = async (endpoint: string, data: any = {}) => {
    if (!selectedPC) {
      addLog('Please select a PC first')
      return
    }

    try {
      const pc = pcs.find(p => p.id === selectedPC)
      if (!pc) return

      const response = await axios.post(`http://${pc.ip}${endpoint}`, data)
      addLog(`${endpoint}: ${response.data.message || 'Success'}`)
    } catch (error: any) {
      addLog(`Error ${endpoint}: ${error.message}`)
    }
  }

  const checkPCStatus = async (pc: PC) => {
    try {
      const response = await axios.get(`http://${pc.ip}/status`, {
        timeout: 5000
      })
      return {
        ...pc,
        status: 'online' as const,
        lastSeen: new Date().toISOString()
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
              <h3 className="font-semibold text-lg">{pc.name}</h3>
              <div className={`w-3 h-3 rounded-full ${
                pc.status === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <p className="text-gray-600 text-sm">{pc.ip}</p>
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
            <div>
              <label className="block text-sm font-medium mb-2">Program Path</label>
              <input
                type="text"
                value={programPath}
                onChange={(e) => setProgramPath(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="C:\\Path\\To\\Program.exe"
              />
            </div>
            <button
              onClick={() => sendCommand('/start', { path: programPath })}
              disabled={!selectedPC}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
            >
              Start Program
            </button>
            
            <div>
              <label className="block text-sm font-medium mb-2">Program Name</label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="notepad"
              />
            </div>
            <button
              onClick={() => sendCommand('/stop', { name: programName })}
              disabled={!selectedPC}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
            >
              Stop Program
            </button>
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