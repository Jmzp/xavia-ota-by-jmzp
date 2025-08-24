import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  TableContainer,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
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
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (path: string) => {
    try {
      const response = await fetch('/api/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error('Failed to rollback');
      }

      // Refresh releases after rollback
      fetchReleases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Layout>
        <ProtectedRoute>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Releases
          </Typography>
          <Typography>Loading...</Typography>
        </ProtectedRoute>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ProtectedRoute>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Releases
          </Typography>
          <Typography color="error">Error: {error}</Typography>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedRoute>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Typography variant="h4">Releases</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchReleases} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>

        {releases.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No releases found. Upload your first release to get started.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Runtime Version</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Released</TableCell>
                  <TableCell>Commit</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {releases.map((release, index) => (
                  <TableRow key={release.path} hover>
                    <TableCell>
                      <Chip
                        label={release.runtimeVersion}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {release.path}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(release.size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {moment(release.timestamp).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        {release.commitHash && (
                          <Chip
                            label={release.commitHash.substring(0, 8)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {release.commitMessage && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {release.commitMessage}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={() => handleRollback(release.path)}
                        disabled={index === 0}
                      >
                        Rollback
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </ProtectedRoute>
    </Layout>
  );
}
