import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { TrackingMetrics } from '../apiUtils/database/DatabaseInterface';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { AllTrackingResponse } from './api/tracking/all';
import moment from 'moment';

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

export default function Dashboard() {
  const [totalDownloaded, setTotalDownloaded] = useState(0);
  const [iosDownloads, setIosDownloads] = useState(0);
  const [androidDownloads, setAndroidDownloads] = useState(0);
  const [totalReleases, setTotalReleases] = useState(0);
  const [runtimeSummaries, setRuntimeSummaries] = useState<RuntimeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch global tracking data
      const trackingResponse = await fetch('/api/tracking/all');
      const trackingData = (await trackingResponse.json()) as AllTrackingResponse;

      setTotalDownloaded(
        trackingData.trackings.reduce((acc, curr) => acc + curr.count, 0),
      );

      const iosData = trackingData.trackings.filter(
        (metric: TrackingMetrics) => metric.platform === 'ios',
      );
      const androidData = trackingData.trackings.filter(
        (metric: TrackingMetrics) => metric.platform === 'android',
      );

      setIosDownloads(iosData.reduce((acc, curr) => acc + curr.count, 0));
      setAndroidDownloads(androidData.reduce((acc, curr) => acc + curr.count, 0));
      setTotalReleases(trackingData.totalReleases);

      // Fetch runtime-specific data
      const runtimeResponse = await fetch('/api/releases-by-runtime');
      const runtimeData = await runtimeResponse.json();
      setRuntimeSummaries(runtimeData.runtimeSummaries || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedRoute>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Dashboard
        </Typography>

        {/* Global Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader
                title={<Typography variant="h6">Total Downloads</Typography>}
              />
              <CardContent>
                <Typography variant="h4">{totalDownloaded}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader
                title={<Typography variant="h6">iOS Downloads</Typography>}
              />
              <CardContent>
                <Typography variant="h4">{iosDownloads}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader
                title={<Typography variant="h6">Android Downloads</Typography>}
              />
              <CardContent>
                <Typography variant="h4">{androidDownloads}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader
                title={<Typography variant="h6">Total Releases</Typography>}
              />
              <CardContent>
                <Typography variant="h4">{totalReleases}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Runtime Summaries */}
        <Typography variant="h5" sx={{ mb: 3 }}>
          Runtime Versions
        </Typography>
        <Grid container spacing={3}>
          {runtimeSummaries.map((runtime) => (
            <Grid item xs={12} md={6} lg={4} key={runtime.runtimeVersion}>
              <Card
                sx={{ borderWidth: 1, borderColor: 'divider', borderStyle: 'solid' }}
              >
                <CardHeader
                  title={
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6">
                        Runtime {runtime.runtimeVersion}
                      </Typography>
                      <Chip
                        label={`${runtime.totalReleases} releases`}
                        color="primary"
                        size="small"
                      />
                    </Stack>
                  }
                />
                <CardContent>
                  <Stack spacing={2}>
                    {runtime.activeRelease ? (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Active Release:</strong>{' '}
                          {runtime.activeRelease.path}
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Released:</strong>{' '}
                            {moment(runtime.activeRelease.timestamp).format(
                              'MMM DD, YYYY HH:mm',
                            )}
                          </Typography>
                          {runtime.activeRelease.commitHash && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Commit:</strong>{' '}
                              {runtime.activeRelease.commitHash.substring(0, 8)}
                            </Typography>
                          )}
                          {runtime.activeRelease.commitMessage && (
                            <Stack spacing={1}>
                              <Divider />
                              <Typography variant="body2" color="text.secondary">
                                {runtime.activeRelease.commitMessage}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No active release
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {runtimeSummaries.length === 0 && (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No runtime versions found. Upload your first release to get started.
              </Typography>
            </CardContent>
          </Card>
        )}
      </ProtectedRoute>
    </Layout>
  );
}
