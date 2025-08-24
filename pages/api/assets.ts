import mime from 'mime';
import { NextApiRequest, NextApiResponse } from 'next';
import nullthrows from 'nullthrows';

import { UpdateHelper } from '../../apiUtils/helpers/UpdateHelper';
import { ZipHelper } from '../../apiUtils/helpers/ZipHelper';
import { getLogger } from '../../apiUtils/logger';

export default async function assetsEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const logger = getLogger('api/assets');
  const { asset: assetPath, runtimeVersion, platform } = req.query;

  if (!assetPath || typeof assetPath !== 'string') {
    res.statusCode = 400;
    res.json({ error: 'No asset path provided.' });
    return;
  }

  if (platform !== 'ios' && platform !== 'android') {
    res.statusCode = 400;
    res.json({ error: 'No platform provided. Expected "ios" or "android".' });
    return;
  }

  if (!runtimeVersion || typeof runtimeVersion !== 'string') {
    res.statusCode = 400;
    res.json({ error: 'No runtimeVersion provided.' });
    return;
  }

  try {
    const updateBundlePath = await UpdateHelper.getLatestUpdateBundlePathForRuntimeVersionAsync(
      runtimeVersion as string
    );
    const zip = await ZipHelper.getZipFromStorage(updateBundlePath);

    const { metadataJson } = await UpdateHelper.getMetadataAsync({
      updateBundlePath,
      runtimeVersion: runtimeVersion as string,
    });

    const assetMetadata = metadataJson.fileMetadata[platform].assets.find(
      (asset: any) => asset.path === assetPath
    );
    const isLaunchAsset = metadataJson.fileMetadata[platform].bundle === assetPath;

    const asset = await ZipHelper.getFileFromZip(zip, assetPath as string);

    // Log warning for large assets (>4MB)
    const assetSizeMB = asset.length / (1024 * 1024);
    if (assetSizeMB > 4) {
      logger.warn('Large asset served via API route', {
        assetPath,
        platform,
        runtimeVersion,
        sizeMB: Math.round(assetSizeMB * 100) / 100,
        recommendation: 'Consider using CDN or direct storage URLs for large assets',
      });
    }

    // Set appropriate headers for streaming large files
    res.statusCode = 200;
    res.setHeader(
      'content-type',
      isLaunchAsset ? 'application/javascript' : nullthrows(mime.getType(assetMetadata.ext))
    );
    res.setHeader('content-length', asset.length);
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');

    // Stream the response for better performance with large files
    res.end(asset);
  } catch (error) {
    logger.error('Asset serving failed', {
      assetPath,
      platform,
      runtimeVersion,
      error: error instanceof Error ? error.message : String(error),
    });
    res.statusCode = 500;
    res.json({ error: 'Failed to serve asset' });
  }
}
