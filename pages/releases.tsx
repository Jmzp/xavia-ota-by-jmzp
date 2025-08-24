import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Heading,
  Text,
  Tag,
  HStack,
  Flex,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { SlRefresh } from 'react-icons/sl';
import { useEffect, useState } from 'react';
import moment from 'moment';

import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

interface Release {
  path: string;
  runtimeVersion: string;
  timestamp: string;
  size: number;
  commitHash: string | null;
  commitMessage: string | null;
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const response = await fetch('/api/releases');
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      const data = await response.json();
      setReleases(data.releases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Box mx={4}>
          <Flex className="flex-col">
            <HStack>
              <Heading size="lg">Releases</Heading>
              <IconButton
                aria-label="Refresh"
                onClick={fetchReleases}
                variant="solid"
                // colorScheme="blue"
                size="md"
                icon={<SlRefresh />}
              />
            </HStack>

            {loading && <Text>Loading...</Text>}
            {error && <Text color="red.500">{error}</Text>}

            {!loading && !error && (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Runtime Version</Th>
                    <Th>Commit Hash</Th>
                    <Th>Commit Message</Th>
                    <Th>Timestamp (UTC)</Th>
                    <Th>File Size</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {releases
                    .sort(
                      (a: Release, b: Release) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .map((release: Release, index: number) => {
                      // Determinar si es el release activo para su runtime version
                      const releasesForRuntime = releases
                        .filter((r: Release) => r.runtimeVersion === release.runtimeVersion)
                        .sort(
                          (a: Release, b: Release) =>
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        );
                      const isActiveForRuntime = releasesForRuntime[0]?.path === release.path;

                      return (
                        <Tr key={index}>
                          <Td>{release.path}</Td>
                          <Td>
                            <Tag size="md" colorScheme="blue">
                              {release.runtimeVersion}
                            </Tag>
                          </Td>
                          <Td>
                            <Tooltip label={release.commitHash}>
                              <Text isTruncated w="10rem">
                                {release.commitHash}
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td>
                            <Tooltip label={release.commitMessage}>
                              <Text isTruncated w="10rem">
                                {release.commitMessage}
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td className="min-w-[14rem]">
                            {moment(release.timestamp).utc().format('MMM, Do  HH:mm')}
                          </Td>
                          <Td>{formatFileSize(release.size)}</Td>
                          <Td justifyItems="center">
                            {isActiveForRuntime ? (
                              <Tag size="lg" colorScheme="green">
                                Active for {release.runtimeVersion}
                              </Tag>
                            ) : (
                              <Button
                                variant="solid"
                                colorScheme="orange"
                                size="sm"
                                onClick={async () => {
                                  // TODO: Implement rollback functionality
                                  console.log('Rollback to:', release.path);
                                }}>
                                Rollback to this release
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                </Tbody>
              </Table>
            )}
          </Flex>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
