import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseFactory } from '../../../apiUtils/database/DatabaseFactory';
import { getLogger } from '../../../apiUtils/logger';
import { TrackingMetrics } from '../../../apiUtils/database/DatabaseInterface';

const logger = getLogger('allTrackingHandler');

export interface AllTrackingResponse {
  trackings: TrackingMetrics[];
  totalReleases: number;
}

export default async function allTrackingHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  logger.info('Fetching all tracking data for all releases');

  try {
    const database = DatabaseFactory.getDatabase();

    logger.info('Fetching tracking metrics...');
    const trackings = await database.getReleaseTrackingMetricsForAllReleases();
    logger.info(`Retrieved ${trackings.length} tracking metrics:`, trackings);

    logger.info('Fetching releases...');
    const releases = await database.listReleases();
    logger.info(`Retrieved ${releases.length} releases`);

    const response = { trackings, totalReleases: releases.length };
    logger.info('Sending response:', response);

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error in allTrackingHandler:', error);
    console.error('Error in allTrackingHandler:', error);
    res.status(500).json({
      error: 'Failed to fetch tracking data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
