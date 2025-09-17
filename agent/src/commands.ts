import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Start a Windows program by its file path
 */
export async function startProgram(programPath: string): Promise<string> {
  try {
    // Use 'start' command to launch the program in a new window
    const command = `start "" "${programPath}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
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
    
    const command = `taskkill /IM "${processName}" /F`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('SUCCESS')) {
      throw new Error(stderr);
    }
    
    return `Program stopped successfully: ${processName}`;
  } catch (error: any) {
    if (error.message.includes('not found')) {
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
    // Restart immediately (0 second delay)
    const command = 'shutdown /r /t 0';
    await execAsync(command);
    
    return 'Restart command sent successfully';
  } catch (error: any) {
    throw new Error(`Failed to restart PC: ${error.message}`);
  }
}

/**
 * Disconnect internet by disabling network adapters
 */
export async function disconnectInternet(): Promise<string> {
  try {
    // Disable all active network adapters
    const command = 'powershell.exe "Get-NetAdapter | Where-Object {$_.Status -eq \'Up\'} | Disable-NetAdapter -Confirm:$false"';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    return 'Internet disconnected successfully';
  } catch (error: any) {
    throw new Error(`Failed to disconnect internet: ${error.message}`);
  }
}

/**
 * Reconnect internet by enabling network adapters
 */
export async function reconnectInternet(): Promise<string> {
  try {
    // Enable all disabled network adapters
    const command = 'powershell.exe "Get-NetAdapter | Where-Object {$_.Status -eq \'Disabled\'} | Enable-NetAdapter -Confirm:$false"';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    return 'Internet reconnected successfully';
  } catch (error: any) {
    throw new Error(`Failed to reconnect internet: ${error.message}`);
  }
}

/**
 * Get current system status and information
 */
export function getSystemStatus(): any {
  try {
    const status = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      networkInterfaces: os.networkInterfaces(),
      timestamp: new Date().toISOString(),
      status: 'online'
    };
    
    return status;
  } catch (error: any) {
    throw new Error(`Failed to get system status: ${error.message}`);
  }
}

/**
 * Get list of running processes (Windows specific)
 */
export async function getRunningProcesses(): Promise<string> {
  try {
    const command = 'tasklist /fo csv';
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
    const processName = programName.endsWith('.exe') ? programName : `${programName}.exe`;
    const command = `tasklist /FI "IMAGENAME eq ${processName}"`;
    const { stdout } = await execAsync(command);
    
    return stdout.includes(processName);
  } catch (error: any) {
    return false;
  }
}

/**
 * Get network adapter status
 */
export async function getNetworkStatus(): Promise<string> {
  try {
    const command = 'powershell.exe "Get-NetAdapter | Select-Object Name, Status, LinkSpeed | ConvertTo-Json"';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(`Failed to get network status: ${error.message}`);
  }
}