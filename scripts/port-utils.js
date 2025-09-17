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
 * Get ports for frontend and backend
 * @returns {Promise<{frontend: number, backend: number}>}
 */
export async function getAvailablePorts() {
  // Try to find available ports
  const backendPort = await findAvailablePort(3003, 20);
  const frontendPort = await findAvailablePort(5176, 20);

  return {
    backend: backendPort,
    frontend: frontendPort,
  };
}
