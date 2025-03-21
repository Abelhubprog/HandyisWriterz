import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Replay as RetryIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';

interface TelegramRequest {
  id: string;
  userId: string;
  orderId: string;
  status: string;
  telegramStatus: string;
  telegramError?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DetailDialogProps {
  request: TelegramRequest | null;
  open: boolean;
  onClose: () => void;
}

const DetailDialog: React.FC<DetailDialogProps> = ({ request, open, onClose }) => {
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Request Details</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2">Request ID</Typography>
          <Typography paragraph>{request.id}</Typography>

          <Typography variant="subtitle2">User ID</Typography>
          <Typography paragraph>{request.userId}</Typography>

          <Typography variant="subtitle2">Order ID</Typography>
          <Typography paragraph>{request.orderId}</Typography>

          <Typography variant="subtitle2">Status</Typography>
          <Typography paragraph>
            <Chip
              label={request.status}
              color={
                request.status === 'COMPLETED'
                  ? 'success'
                  : request.status === 'FAILED'
                  ? 'error'
                  : 'warning'
              }
              size="small"
            />
          </Typography>

          {request.telegramError && (
            <>
              <Typography variant="subtitle2" color="error">
                Error Message
              </Typography>
              <Typography paragraph color="error">
                {request.telegramError}
              </Typography>
            </>
          )}

          <Typography variant="subtitle2">Retry Count</Typography>
          <Typography paragraph>{request.retryCount}</Typography>

          <Typography variant="subtitle2">Created At</Typography>
          <Typography paragraph>
            {format(new Date(request.createdAt), 'PPpp')}
          </Typography>

          <Typography variant="subtitle2">Last Updated</Typography>
          <Typography paragraph>
            {format(new Date(request.updatedAt), 'PPpp')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default function TelegramDashboard() {
  useAdminGuard();
  const { data: session } = useSession();
  const router = useRouter();

  const [requests, setRequests] = useState<TelegramRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<TelegramRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/telegram-requests');
      if (!response.ok) throw new Error('Failed to fetch requests');

      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/telegram-requests/${requestId}/retry`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to retry request');

      await fetchRequests();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const response = await fetch(`/api/admin/telegram-requests/${requestId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete request');

      await fetchRequests();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchRequests();
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
              Telegram Integration Dashboard
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchRequests}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Request ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Telegram Status</TableCell>
                        <TableCell>Retry Count</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Updated</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requests
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.id}</TableCell>
                            <TableCell>
                              <Chip
                                label={request.status}
                                color={
                                  request.status === 'COMPLETED'
                                    ? 'success'
                                    : request.status === 'FAILED'
                                    ? 'error'
                                    : 'warning'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={request.telegramStatus}
                                color={
                                  request.telegramStatus === 'COMPLETED'
                                    ? 'success'
                                    : request.telegramStatus === 'FAILED'
                                    ? 'error'
                                    : 'warning'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{request.retryCount}</TableCell>
                            <TableCell>
                              {format(new Date(request.createdAt), 'PP')}
                            </TableCell>
                            <TableCell>
                              {format(new Date(request.updatedAt), 'PP')}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDetailDialogOpen(true);
                                }}
                                title="View Details"
                              >
                                <InfoIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleRetry(request.id)}
                                disabled={request.status === 'COMPLETED'}
                                title="Retry Request"
                              >
                                <RetryIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(request.id)}
                                title="Delete Request"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={requests.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                />
              </>
            )}
          </Paper>
        </Box>

        <DetailDialog
          request={selectedRequest}
          open={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedRequest(null);
          }}
        />
      </Container>
    </AdminLayout>
  );
}
