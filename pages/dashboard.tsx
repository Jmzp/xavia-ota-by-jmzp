import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  SimpleGrid,
  Box,
  Text,
  Tag,
  VStack,
  HStack,
  Divider,
} from '@chakra-ui/react';
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

      setTotalDownloaded(trackingData.trackings.reduce((acc, curr) => acc + curr.count, 0));

      const iosData = trackingData.trackings.filter(
        (metric: TrackingMetrics) => metric.platform === 'ios'
      );
      const androidData = trackingData.trackings.filter(
        (metric: TrackingMetrics) => metric.platform === 'android'
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
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <ProtectedRoute>
        <Heading mb={4}>Dashboard</Heading>

        {/* Global Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card>
            <CardHeader>
              <Heading size="md">Total Downloads</Heading>
            </CardHeader>
            <CardBody>
              <Heading size="lg">{totalDownloaded}</Heading>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Heading size="md">iOS Downloads</Heading>
            </CardHeader>
            <CardBody>
              <Heading size="lg">{iosDownloads}</Heading>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Heading size="md">Android Downloads</Heading>
            </CardHeader>
            <CardBody>
              <Heading size="lg">{androidDownloads}</Heading>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Heading size="md">Total Releases</Heading>
            </CardHeader>
            <CardBody>
              <Heading size="lg">{totalReleases}</Heading>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Runtime Versions Section */}
        <Box mb={6}>
          <Heading size="lg" mb={4}>
            Runtime Versions
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {runtimeSummaries.map((runtime) => (
              <Card key={runtime.runtimeVersion} borderWidth={2} borderColor="blue.200">
                <CardHeader pb={2}>
                  <HStack justify="space-between" align="center">
                    <Heading size="md">Runtime {runtime.runtimeVersion}</Heading>
                    <Tag colorScheme="blue" size="sm">
                      v{runtime.runtimeVersion}
                    </Tag>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Active Release:
                      </Text>
                      {runtime.activeRelease ? (
                        <VStack align="stretch" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {runtime.activeRelease.path.split('/').pop()}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {moment(runtime.activeRelease.timestamp).format('MMM DD, YYYY HH:mm')}
                          </Text>
                          {runtime.activeRelease.commitHash && (
                            <Text fontSize="xs" color="blue.600">
                              {runtime.activeRelease.commitHash.substring(0, 8)}
                            </Text>
                          )}
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          No releases
                        </Text>
                      )}
                    </Box>

                    <Divider />

                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Total Releases:
                      </Text>
                      <Tag size="sm" colorScheme="gray">
                        {runtime.totalReleases}
                      </Tag>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {runtimeSummaries.length === 0 && (
            <Card>
              <CardBody>
                <Text color="gray.500" textAlign="center">
                  No runtime versions found. Upload your first release to get started.
                </Text>
              </CardBody>
            </Card>
          )}
        </Box>
      </ProtectedRoute>
    </Layout>
  );
}
