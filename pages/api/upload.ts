import formidable from 'formidable';
import fs from 'fs';
import moment from 'moment';
import { NextApiRequest, NextApiResponse } from 'next';

import { DatabaseFactory } from '../../apiUtils/database/DatabaseFactory';
import { StorageFactory } from '../../apiUtils/storage/StorageFactory';
import { getLogger } from '../../apiUtils/logger';

import AdmZip from 'adm-zip';
import { ZipHelper } from '../../apiUtils/helpers/ZipHelper';
import { HashHelper } from '../../apiUtils/helpers/HashHelper';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function uploadHandler(req: NextApiRequest, res: NextApiResponse) {
  const logger = getLogger('api/upload');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    const runtimeVersion = fields.runtimeVersion?.[0];
    const commitHash = fields.commitHash?.[0];
    const commitMessage = fields.commitMessage?.[0] || 'No message provided';

    if (!file || !runtimeVersion || !commitHash) {
      logger.warn('Upload attempt with missing required fields', {
        hasFile: !!file,
        hasRuntimeVersion: !!runtimeVersion,
        hasCommitHash: !!commitHash,
      });
      res.status(400).json({ error: 'Missing file, runtime version, or commit hash' });
      return;
    }

    logger.info('Starting file upload', {
      fileName: file.originalFilename,
      fileSize: file.size,
      runtimeVersion,
      commitHash: commitHash.substring(0, 8),
    });

    const storage = StorageFactory.getStorage();
    const timestamp = moment().utc().format('YYYYMMDDHHmmss');
    const updatePath = `updates/${runtimeVersion}`;

    // Store the zipped file as is
    const zipContent = fs.readFileSync(file.filepath);
    const zipFolder = new AdmZip(file.filepath);
    const metadataJsonFile = await ZipHelper.getFileFromZip(zipFolder, 'metadata.json');

    const updateHash = HashHelper.createHash(metadataJsonFile, 'sha256', 'hex');
    const updateId = HashHelper.convertSHA256HashToUUID(updateHash);

    const path = await storage.uploadFile(`${updatePath}/${timestamp}.zip`, zipContent);

    await DatabaseFactory.getDatabase().createRelease({
      path,
      runtimeVersion,
      timestamp: moment().utc().toString(),
      commitHash,
      commitMessage,
      updateId,
    });

    logger.info('File upload completed successfully', {
      path,
      runtimeVersion,
      updateId,
      commitHash: commitHash.substring(0, 8),
    });

    res.status(200).json({ success: true, path });
  } catch (error) {
    logger.error('File upload failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Upload failed' });
  }
}
