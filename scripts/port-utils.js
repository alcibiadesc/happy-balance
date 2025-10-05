/**
 * Port utilities for finding available ports
 */

import net from "net";

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>}
 */
export function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Find an available port starting from a base port
 * @param {number} basePort - Starting port number
 * @param {number} maxAttempts - Maximum attempts to find a port
 * @returns {Promise<number>}
 */
export async function findAvailablePort(basePort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(
    `No available port found in range ${basePort}-${basePort + maxAttempts}`,
  );
}

/**
 * Get ports for frontend and backend based on environment type
 * @param {boolean} isWorktree - Whether we're in a worktree
 * @returns {Promise<{frontend: number, backend: number}>}
 */
export async function getAvailablePorts(isWorktree = false) {
  if (isWorktree) {
    // Worktree: Use dynamic port selection
    const backendPort = await findAvailablePort(3003, 20);
    const frontendPort = await findAvailablePort(5176, 20);

    return {
      backend: backendPort,
      frontend: frontendPort,
    };
  } else {
    // Regular branch: Use fixed stable ports
    const backendPort = 14040;
    const frontendPort = 5173;

    // Check if fixed ports are available, fallback if needed
    const finalBackendPort = (await isPortAvailable(backendPort))
      ? backendPort
      : await findAvailablePort(backendPort + 1, 10);

    const finalFrontendPort = (await isPortAvailable(frontendPort))
      ? frontendPort
      : await findAvailablePort(frontendPort + 1, 10);

    return {
      backend: finalBackendPort,
      frontend: finalFrontendPort,
    };
  }
}
