import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { exec } from 'child_process';

/**
 * System routes: health check, version, updates
 */
export function createSystemRoutes(): Router {
  const router = Router();

  // Health check
  router.get('/health', (_req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Version endpoint
  const versionHandler = (_req: any, res: any) => {
    try {
      const versionFile = path.join(process.cwd(), '.version.json');

      if (fs.existsSync(versionFile)) {
        const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
        res.json(versionData);
      } else {
        const packageJsonPath = path.join(process.cwd(), '../../../package.json');
        const packageJsonData = fs.existsSync(packageJsonPath)
          ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
          : { version: 'unknown' };
        res.json({
          version: packageJsonData.version || 'unknown',
          commit: 'local-dev',
          buildTimestamp: new Date().toISOString(),
          component: 'backend',
          environment: process.env.NODE_ENV || 'development',
        });
      }
    } catch (_error) {
      res.status(500).json({
        error: 'Failed to read version information',
        version: 'unknown',
      });
    }
  };
  router.get('/version', versionHandler);
  router.get('/api/version', versionHandler);

  // Check for updates
  router.get('/api/system/check-updates', async (_req, res) => {
    try {
      const versionFile = path.join(process.cwd(), '.version.json');
      let currentVersion = { version: 'unknown', commit: 'local-dev' };

      if (fs.existsSync(versionFile)) {
        currentVersion = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      }

      const dockerHubUrl =
        'https://hub.docker.com/v2/repositories/alcibiadesc/happy-balance/tags/backend-latest';

      https
        .get(dockerHubUrl, (response: any) => {
          let data = '';
          response.on('data', (chunk: any) => {
            data += chunk;
          });
          response.on('end', () => {
            try {
              const imageInfo = JSON.parse(data);
              const latestCommit = imageInfo.name?.split('-').pop() || 'unknown';

              res.json({
                current: currentVersion,
                latest: {
                  version: imageInfo.tag_last_pushed ? 'latest' : 'unknown',
                  commit: latestCommit,
                  lastPushed: imageInfo.tag_last_pushed,
                },
                updateAvailable:
                  currentVersion.commit !== latestCommit && currentVersion.commit !== 'local-dev',
              });
            } catch (_error) {
              res.json({
                current: currentVersion,
                latest: null,
                updateAvailable: false,
                error: 'Could not parse Docker Hub response',
              });
            }
          });
        })
        .on('error', () => {
          res.json({
            current: currentVersion,
            latest: null,
            updateAvailable: false,
            error: 'Could not reach Docker Hub',
          });
        });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to check for updates',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Trigger update
  router.post('/api/system/update', async (_req, res) => {
    try {
      const scriptPath = path.join(process.cwd(), '../../../scripts/update-docker.sh');

      exec(scriptPath, (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error('Update error:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to execute update script',
            details: error.message,
            stderr: stderr,
            note: 'This operation may require additional Docker permissions. Consider running the update script manually: ./scripts/update-docker.sh',
          });
        }

        return res.json({
          success: true,
          message:
            'Update initiated successfully. The application will restart with the latest version.',
          output: stdout,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to trigger update',
        details: error instanceof Error ? error.message : String(error),
        note: 'This operation may require additional Docker permissions. Consider running the update script manually: ./scripts/update-docker.sh',
      });
    }
  });

  return router;
}
