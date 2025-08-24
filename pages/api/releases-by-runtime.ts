import { NextApiRequest, NextApiResponse } from 'next';

import { DatabaseFactory } from '../../apiUtils/database/DatabaseFactory';
import { StorageFactory } from '../../apiUtils/storage/StorageFactory';

interface RuntimeSummary {
  runtimeVersion: string;
  activeRelease: {
    path: string;
    timestamp: string;
    commitHash: string | null;
    commitMessage: string | null;
  } | null;
  totalReleases: number;
}

export default async function releasesByRuntimeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const storage = StorageFactory.getStorage();
    const directories = await storage.listDirectories('updates/');

    const releasesWithCommitHash = await DatabaseFactory.getDatabase().listReleases();

    const runtimeSummaries: RuntimeSummary[] = [];

    for (const directory of directories) {
      const folderPath = `updates/${directory}`;
      const files = await storage.listFiles(folderPath);
      const runtimeVersion = directory;

      // Get releases for this runtime version
      const runtimeReleases = [];
      for (const file of files) {
        const release = releasesWithCommitHash.find((r) => r.path === `${folderPath}/${file.name}`);
        runtimeReleases.push({
          path: release?.path || `${folderPath}/${file.name}`,
          runtimeVersion,
          timestamp: file.created_at,
          size: file.metadata.size,
          commitHash: release?.commitHash || null,
          commitMessage: release?.commitMessage || null,
        });
      }

      // Sort by timestamp to get the most recent (active) release
      runtimeReleases.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const activeRelease = runtimeReleases[0] || null;

      runtimeSummaries.push({
        runtimeVersion,
        activeRelease: activeRelease
          ? {
              path: activeRelease.path,
              timestamp: activeRelease.timestamp,
              commitHash: activeRelease.commitHash,
              commitMessage: activeRelease.commitMessage,
            }
          : null,
        totalReleases: runtimeReleases.length,
      });
    }

    res.status(200).json({ runtimeSummaries });
  } catch (error) {
    console.error('Failed to fetch releases by runtime:', error);
    res.status(500).json({ error: 'Failed to fetch releases by runtime' });
  }
}
