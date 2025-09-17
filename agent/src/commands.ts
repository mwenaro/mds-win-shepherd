import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Start a program with the given path
 */
export async function startProgram(programPath: string): Promise<string> {
  try {
    const command = `start "" "${programPath}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('The system cannot find the file specified')) {
      throw new Error(stderr);
    }
    
    return `Program started successfully: ${programPath}`;
  } catch (error: any) {
    throw new Error(`Failed to start program: ${error.message}`);
  }
}

/**
 * Stop/kill a program by its process name
 */
export async function stopProgram(programName: string): Promise<string> {
  try {
    // Add .exe if not present
    const processName = programName.endsWith('.exe') ? programName : `${programName}.exe`;
    
    // Use PowerShell to kill the process (works in all Windows environments)
    const command = `powershell -Command "Stop-Process -Name '${programName}' -Force"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.includes('Cannot find a process')) {
      throw new Error(`Program not found or already stopped: ${programName}`);
    }
    
    return `Program stopped successfully: ${processName}`;
  } catch (error: any) {
    if (error.message.includes('Cannot find a process') || error.message.includes('not found')) {
      throw new Error(`Program not found or already stopped: ${programName}`);
    }
    throw new Error(`Failed to stop program: ${error.message}`);
  }
}

/**
 * Restart the PC
 */
export async function restartPC(): Promise<string> {
  try {
    // Restart immediately (0 second delay) - Use PowerShell
    const command = 'powershell -Command "Restart-Computer -Force"';
    await execAsync(command);
    
    return 'Restart command sent successfully';
  } catch (error: any) {
    throw new Error(`Failed to restart PC: ${error.message}`);
  }
}

/**
 * Get the active network adapter being used for internet connection
 */
export async function getActiveNetworkAdapter(): Promise<{ name: string; type: string; status: string }> {
  try {
    const command = 'powershell.exe -Command "Get-NetAdapter | Where-Object {$_.Status -eq \'Up\' -and $_.Virtual -eq $false} | Select-Object Name, MediaType, Status | ConvertTo-Json"';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    const adapters = JSON.parse(stdout);
    
    // If multiple adapters, try to find the one with internet access
    if (Array.isArray(adapters)) {
      // Check which adapter has a default route (internet gateway)
      const routeCommand = 'powershell.exe -Command "Get-NetRoute -DestinationPrefix \'0.0.0.0/0\' | Select-Object InterfaceAlias | ConvertTo-Json"';
      const { stdout: routeOutput } = await execAsync(routeCommand);
      const routes = JSON.parse(routeOutput);
      
      const internetAdapter = Array.isArray(routes) ? routes[0]?.InterfaceAlias : routes?.InterfaceAlias;
      
      if (internetAdapter) {
        const activeAdapter = adapters.find(adapter => adapter.Name === internetAdapter);
        if (activeAdapter) {
          return {
            name: activeAdapter.Name,
            type: activeAdapter.MediaType || 'Unknown',
            status: activeAdapter.Status
          };
        }
      }
      
      // Fallback to first active adapter
      return {
        name: adapters[0].Name,
        type: adapters[0].MediaType || 'Unknown', 
        status: adapters[0].Status
      };
    }
    
    return {
      name: adapters.Name,
      type: adapters.MediaType || 'Unknown',
      status: adapters.Status
    };
  } catch (error: any) {
    throw new Error(`Failed to get network adapter: ${error.message}`);
  }
}

/**
 * Disconnect internet by targeting the specific active network adapter
 * Note: Effective disconnection requires administrator privileges
 */
export async function disconnectInternet(): Promise<string> {
  try {
    const adapter = await getActiveNetworkAdapter();
    const adapterType = adapter.type.includes('802.11') || adapter.type.includes('Wireless') ? 'Wi-Fi' : 
                       adapter.type.includes('802.3') || adapter.type.includes('Ethernet') ? 'Ethernet' : 
                       adapter.type;
    
    // Try to disable the network adapter (requires admin privileges)
    const disableCommand = `powershell.exe -Command "Disable-NetAdapter -Name '${adapter.name}' -Confirm:$false"`;
    
    try {
      await execAsync(disableCommand);
      return `✅ Internet disconnected successfully! ${adapterType} adapter '${adapter.name}' has been disabled.`;
    } catch (error: any) {
      if (error.message.includes('Access is denied')) {
        return `❌ Internet disconnect failed - Administrator privileges required. 

🔍 Detected: ${adapterType} adapter '${adapter.name}'

💡 To actually disconnect internet:
1. Right-click on MdsWinShepherd and select "Run as Administrator"
2. Or manually disable '${adapter.name}' in Network Settings
3. Or physically unplug the ${adapterType === 'Ethernet' ? 'network cable' : 'Wi-Fi'}

⚠️ Windows security prevents regular users from disabling network adapters.`;
      }
      return `❌ Internet disconnect failed: ${error.message}`;
    }
  } catch (error: any) {
    return `❌ Error detecting network adapter: ${error.message}`;
  }
}

/**
 * Reconnect internet by re-enabling network adapters
 */
export async function reconnectInternet(): Promise<string> {
  try {
    // Get all disabled adapters and try to re-enable them
    const getDisabledCommand = 'powershell.exe -Command "Get-NetAdapter | Where-Object {$_.Status -eq \'Disabled\' -and $_.Virtual -eq $false} | Select-Object Name, MediaType | ConvertTo-Json"';
    const { stdout: disabledOutput } = await execAsync(getDisabledCommand);
    
    if (disabledOutput.trim() === '') {
      return 'No disabled network adapters found - internet may already be connected';
    }
    
    const disabledAdapters = JSON.parse(disabledOutput);
    const adapters = Array.isArray(disabledAdapters) ? disabledAdapters : [disabledAdapters];
    
    let reconnectedAdapters: string[] = [];
    
    for (const adapter of adapters) {
      const adapterType = adapter.MediaType?.includes('802.11') || adapter.MediaType?.includes('Wireless') ? 'Wi-Fi' : 
                         adapter.MediaType?.includes('802.3') || adapter.MediaType?.includes('Ethernet') ? 'Ethernet' : 
                         adapter.MediaType || 'Unknown';
      
      try {
        // Try to enable the specific adapter
        const enableCommand = `powershell.exe -Command "Enable-NetAdapter -Name '${adapter.Name}' -Confirm:$false"`;
        await execAsync(enableCommand);
        reconnectedAdapters.push(`${adapterType} '${adapter.Name}'`);
      } catch (enableError: any) {
        if (enableError.message.includes('Access is denied')) {
          reconnectedAdapters.push(`${adapterType} '${adapter.Name}' (requires admin privileges)`);
        }
      }
    }
    
    if (reconnectedAdapters.length > 0) {
      return `Internet reconnected: ${reconnectedAdapters.join(', ')}`;
    } else {
      return 'Internet reconnect attempted - no adapters were re-enabled';
    }
  } catch (error: any) {
    return `Internet reconnect failed: ${error.message}`;
  }
}

/**
 * Get detailed network connection information
 */
export async function getNetworkConnectionDetails(): Promise<any> {
  try {
    // Get all network adapters with detailed information
    const adapterCommand = 'powershell.exe -Command "Get-NetAdapter | Select-Object Name, MediaType, Status, LinkSpeed, FullDuplex | ConvertTo-Json"';
    const { stdout: adapterOutput } = await execAsync(adapterCommand);
    const adapters = JSON.parse(adapterOutput);
    
    // Get IP configuration for active adapters
    const ipCommand = 'powershell.exe -Command "Get-NetIPConfiguration | Where-Object {$_.NetAdapter.Status -eq \'Up\'} | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway | ConvertTo-Json"';
    const { stdout: ipOutput } = await execAsync(ipCommand);
    const ipConfigs = ipOutput.trim() ? JSON.parse(ipOutput) : [];
    
    // Get current internet connectivity status
    const connectivityCommand = 'powershell.exe -Command "Get-NetConnectionProfile | Select-Object Name, NetworkCategory, IPv4Connectivity, IPv6Connectivity | ConvertTo-Json"';
    const { stdout: connectivityOutput } = await execAsync(connectivityCommand);
    const connectivity = connectivityOutput.trim() ? JSON.parse(connectivityOutput) : [];
    
    return {
      adapters: Array.isArray(adapters) ? adapters : [adapters],
      ipConfigurations: Array.isArray(ipConfigs) ? ipConfigs : ipConfigs ? [ipConfigs] : [],
      connectivity: Array.isArray(connectivity) ? connectivity : connectivity ? [connectivity] : [],
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      error: `Failed to get network details: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get PC identification information including name and agent ID
 */
export function getPCIdentification(): any {
  try {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    
    // Generate a unique agent identifier based on hostname and system info
    const agentId = `agent-${hostname.toLowerCase()}-${platform}-${arch}`.replace(/[^a-z0-9-]/g, '-');
    
    return {
      pcName: hostname,
      agentId: agentId,
      displayName: `MdsWinShepherd Agent (${hostname})`,
      platform: platform,
      architecture: arch,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    throw new Error(`Failed to get PC identification: ${error.message}`);
  }
}

/**
 * Get current system status and information
 */
export function getSystemStatus(): any {
  try {
    const pcInfo = getPCIdentification();
    
    return {
      ...pcInfo,
      hostname: os.hostname(), // Keep for backward compatibility
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      networkInterfaces: os.networkInterfaces(),
      status: 'online',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    throw new Error(`Failed to get system status: ${error.message}`);
  }
}

/**
 * Get list of running processes (Windows specific)
 */
export async function getRunningProcesses(): Promise<string> {
  try {
    const command = 'powershell -Command "Get-Process | Select-Object Name,Id,CPU,WorkingSet | ConvertTo-Csv -NoTypeInformation"';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(`Failed to get running processes: ${error.message}`);
  }
}

/**
 * Check if a specific program is running
 */
export async function isProgramRunning(programName: string): Promise<boolean> {
  try {
    const command = `powershell -Command "Get-Process -Name '${programName}' -ErrorAction SilentlyContinue | Select-Object -First 1"`;
    const { stdout } = await execAsync(command);
    
    return stdout.trim().length > 0;
  } catch (error: any) {
    return false;
  }
}

/**
 * Get network adapter status
 */
export async function getNetworkStatus(): Promise<string> {
  try {
    const command = 'powershell.exe -Command "Get-NetAdapter | Select-Object Name, Status, LinkSpeed | ConvertTo-Json"';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(`Failed to get network status: ${error.message}`);
  }
}

/**
 * Find the correct path for Office applications by detecting installed versions
 */
export async function findOfficePath(appName: string): Promise<string | null> {
  try {
    // Common Office versions to check (newest first)
    const officeVersions = ['Office16', 'Office15', 'Office14', 'Office12', 'Office11'];
    const programFilesOptions = [
      'C:\\Program Files\\Microsoft Office\\root',
      'C:\\Program Files (x86)\\Microsoft Office\\root',
      'C:\\Program Files\\Microsoft Office',
      'C:\\Program Files (x86)\\Microsoft Office'
    ];

    for (const programFiles of programFilesOptions) {
      for (const version of officeVersions) {
        const possiblePath = `${programFiles}\\${version}\\${appName}`;
        
        // Check if file exists
        try {
          const command = `powershell.exe -Command "Test-Path '${possiblePath}'"`;
          const { stdout } = await execAsync(command);
          if (stdout.trim() === 'True') {
            return possiblePath;
          }
        } catch (error) {
          // Continue searching
        }
      }
    }

    return null;
  } catch (error: any) {
    return null;
  }
}

/**
 * Find program path using Windows registry or common locations
 */
export async function findProgramPath(programName: string): Promise<string | null> {
  try {
    // Office applications mapping
    const officeApps: { [key: string]: string } = {
      'winword': 'WINWORD.EXE',
      'excel': 'EXCEL.EXE', 
      'powerpnt': 'POWERPNT.EXE',
      'mspub': 'MSPUB.EXE',
      'msaccess': 'MSACCESS.EXE',
      'outlook': 'OUTLOOK.EXE'
    };

    // If it's an Office app, use Office detection
    if (officeApps[programName.toLowerCase()]) {
      const officePath = await findOfficePath(officeApps[programName.toLowerCase()]);
      if (officePath) return officePath;
    }

    // Common program locations
    const commonPaths: { [key: string]: string[] } = {
      'chrome': [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ],
      'firefox': [
        'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
        'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe'
      ],
      'msedge': [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ],
      'notepad': ['C:\\Windows\\System32\\notepad.exe'],
      'calc': ['C:\\Windows\\System32\\calc.exe'],
      'mspaint': ['C:\\Windows\\System32\\mspaint.exe'],
      'taskmgr': ['C:\\Windows\\System32\\Taskmgr.exe'],
      'wordpad': [
        'C:\\Program Files\\Windows NT\\Accessories\\wordpad.exe',
        'C:\\Windows\\System32\\write.exe'
      ]
    };

    const paths = commonPaths[programName.toLowerCase()] || [];
    
    for (const path of paths) {
      try {
        const command = `powershell.exe -Command "Test-Path '${path}'"`;
        const { stdout } = await execAsync(command);
        if (stdout.trim() === 'True') {
          return path;
        }
      } catch (error) {
        // Continue searching
      }
    }

    return null;
  } catch (error: any) {
    return null;
  }
}

/**
 * Start a program with smart path detection
 */
export async function startProgramSmart(programNameOrPath: string): Promise<string> {
  try {
    let programPath = programNameOrPath;

    // If it doesn't look like a full path, try to find it
    if (!programNameOrPath.includes('\\') && !programNameOrPath.includes('/')) {
      const foundPath = await findProgramPath(programNameOrPath);
      if (foundPath) {
        programPath = foundPath;
      } else {
        // Try as program name directly (for system programs)
        programPath = programNameOrPath;
      }
    }

    // Check if the path exists before trying to start
    if (programPath.includes('\\')) {
      try {
        const command = `powershell.exe -Command "Test-Path '${programPath}'"`;
        const { stdout } = await execAsync(command);
        if (stdout.trim() !== 'True') {
          throw new Error(`Program not found at path: ${programPath}`);
        }
      } catch (pathError: any) {
        throw new Error(`Cannot verify program path: ${programPath}. ${pathError.message}`);
      }
    }

    // Use the existing startProgram function
    return await startProgram(programPath);
  } catch (error: any) {
    console.error(`Failed to start program '${programNameOrPath}':`, error);
    throw new Error(`Failed to start program '${programNameOrPath}': ${error.message}`);
  }
}