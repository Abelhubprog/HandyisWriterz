import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { format } from 'date-fns';

interface SystemMetrics {
  telegramStats: {
    totalRequests: number;
    completedRequests: number;
    failedRequests: number;
    averageProcessingTime: number;
    successRate: number;
  };
  storageStats: {
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
  };
  lastCleanup: {
    timestamp: string;
    processedCount: number;
    successCount: number;
    errorCount: number;
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: string;
    issues: string[];
  };
}

interface ConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  currentConfig: any;
}

const ConfigDialog: React.FC<ConfigDialogProps> = ({
  open,
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState(currentConfig);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>System Configuration</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="Max Retries"
            type="number"
            value={config.maxRetries}
            onChange={(e) =>
              setConfig({ ...config, maxRetries: parseInt(e.target.value) })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Cleanup Retention Days (Completed)"
            type="number"
            value={config.completedRetentionDays}
            onChange={(e) =>
              setConfig({
                ...config,
                completedRetentionDays: parseInt(e.target.value)
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Cleanup Retention Days (Failed)"
            type="number"
            value={config.failedRetentionDays}
            onChange={(e) =>
              setConfig({
                ...config,
                failedRetentionDays: parseInt(e.target.value)
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Max File Size (MB)"
            type="number"
            value={config.maxFileSize}
            onChange={(e) =>
              setConfig({ ...config, maxFileSize: parseInt(e.target.value) })
            }
            sx={{ mb: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function SystemMetrics() {
  useAdminGuard();
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/system-metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/system-config');
      if (!response.ok) throw new Error('Failed to fetch config');

      const data = await response.json();
      setCurrentConfig(data.config);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleConfigSave = async (newConfig: any) => {
    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: newConfig })
      });

      if (!response.ok) throw new Error('Failed to update config');

      setCurrentConfig(newConfig);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchMetrics();
      fetchConfig();
    }
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" component="h1">
              System Metrics
            </Typography>
            <Box>
              <Button
                variant="outlined"
                onClick={() => setConfigOpen(true)}
                sx={{ mr: 2 }}
              >
                Configure System
              </Button>
              <Button
                variant="contained"
                onClick={fetchMetrics}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            metrics && (
              <Grid container spacing={3}>
                {/* Telegram Stats */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Telegram Integration
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography>
                          Total Requests: {metrics.telegramStats.totalRequests}
                        </Typography>
                        <Typography>
                          Success Rate:{' '}
                          {(metrics.telegramStats.successRate * 100).toFixed(1)}%
                        </Typography>
                        <Typography>
                          Average Processing Time:{' '}
                          {metrics.telegramStats.averageProcessingTime.toFixed(2)}s
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Storage Stats */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Storage Usage
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography>
                          Total Files: {metrics.storageStats.totalFiles}
                        </Typography>
                        <Typography>
                          Total Size:{' '}
                          {(metrics.storageStats.totalSize / 1024 / 1024).toFixed(
                            2
                          )}{' '}
                          MB
                        </Typography>
                        <Typography>
                          Average File Size:{' '}
                          {(
                            metrics.storageStats.averageFileSize /
                            1024 /
                            1024
                          ).toFixed(2)}{' '}
                          MB
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* System Health */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        System Health
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          color={
                            metrics.systemHealth.status === 'healthy'
                              ? 'success.main'
                              : metrics.systemHealth.status === 'degraded'
                              ? 'warning.main'
                              : 'error.main'
                          }
                          gutterBottom
                        >
                          Status: {metrics.systemHealth.status}
                        </Typography>
                        {metrics.systemHealth.issues.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2">Issues:</Typography>
                            <ul>
                              {metrics.systemHealth.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Cleanup History */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Last Cleanup
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Timeline>
                          <TimelineItem>
                            <TimelineSeparator>
                              <TimelineDot color="primary" />
                              <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>
                              <Typography variant="subtitle2">
                                {format(
                                  new Date(metrics.lastCleanup.timestamp),
                                  'PPpp'
                                )}
                              </Typography>
                              <Typography>
                                Processed: {metrics.lastCleanup.processedCount}
                              </Typography>
                              <Typography>
                                Success: {metrics.lastCleanup.successCount}
                              </Typography>
                              <Typography>
                                Errors: {metrics.lastCleanup.errorCount}
                              </Typography>
                            </TimelineContent>
                          </TimelineItem>
                        </Timeline>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )
          )}
        </Box>

        {currentConfig && (
          <ConfigDialog
            open={configOpen}
            onClose={() => setConfigOpen(false)}
            onSave={handleConfigSave}
            currentConfig={currentConfig}
          />
        )}
      </Container>
    </AdminLayout>
  );
}
