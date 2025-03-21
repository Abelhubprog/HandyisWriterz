import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  TextField, 
  Button, 
  Divider, 
  CircularProgress, 
  Alert,
  Badge,
  IconButton,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MarkEmailRead as MarkEmailReadIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attachments?: string[];
}

interface Conversation {
  id: string;
  user_id: string;
  admin_id: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  subject: string;
  status: 'active' | 'closed' | 'archived';
  order_id?: string;
  order_number?: string;
}

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  role?: string;
}

const MessageList = styled(List)(({ theme }) => ({
  height: '60vh',
  overflowY: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

const ConversationItem = styled(ListItem)<{ selected?: boolean }>(({ theme, selected }) => ({
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: selected ? theme.palette.action.selected : theme.palette.action.hover,
  },
}));

const MessageItem = styled(Box)<{ isSent: boolean }>(({ theme, isSent }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: isSent ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(2),
}));

const MessageBubble = styled(Box)<{ isSent: boolean }>(({ theme, isSent }) => ({
  backgroundColor: isSent ? theme.palette.primary.main : theme.palette.grey[100],
  color: isSent ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: '18px',
  padding: theme.spacing(1.5, 2),
  maxWidth: '70%',
  wordBreak: 'break-word',
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const MessageAttachment = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  marginTop: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const Messages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [user, filterStatus]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_time', { ascending: false });

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      setConversations(data || []);
      
      // Select the first conversation if none is selected
      if (data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message);
      setError('Failed to load conversations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      if (!user) return;

      // Mark all messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // Update conversation unread count
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      // Update local state
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error: any) {
      console.error('Error marking conversation as read:', error.message);
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!user || !selectedConversation || !newMessage.trim()) return;

      setSendingMessage(true);
      setError(null);

      // Upload attachments if any
      const uploadedAttachments: string[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `message-attachments/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

          uploadedAttachments.push(publicUrl);
        }
      }

      // Create new message
      const newMessageData = {
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        receiver_id: selectedConversation.admin_id,
        content: newMessage,
        is_read: false,
        created_at: new Date().toISOString(),
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
      };

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([newMessageData])
        .select();

      if (messageError) throw messageError;

      // Update conversation last message and time
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage,
          last_message_time: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', selectedConversation.id);

      // Update local state
      setMessages(prevMessages => [...prevMessages, messageData[0]]);
      setNewMessage('');
      setAttachments([]);

      // Update conversations list
      fetchConversations();
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleFilterChange = (status: string | null) => {
    setFilterStatus(status);
    handleMenuClose();
  };

  const handleArchiveConversation = async () => {
    try {
      if (!selectedConversation) return;

      await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', selectedConversation.id);

      fetchConversations();
      setSelectedConversation(null);
      handleMenuClose();
    } catch (error: any) {
      console.error('Error archiving conversation:', error.message);
      setError('Failed to archive conversation. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conversation => {
    return conversation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (conversation.order_number && conversation.order_number.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (loading && conversations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={4}>
        <Alert severity="warning">
          You need to be logged in to view your messages.
        </Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Helmet>
        <title>My Messages | HandyWriterz</title>
        <meta name="description" content="View and manage your HandyWriterz messages and support conversations" />
      </Helmet>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h4" component="h1" gutterBottom>
          My Messages
        </Typography>

        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2}>
            {/* Conversations List */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search conversations..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small" 
                          onClick={handleMenuOpen}
                          aria-label="filter conversations"
                        >
                          <FilterIcon />
                        </IconButton>
                        <Menu
                          anchorEl={menuAnchorEl}
                          open={Boolean(menuAnchorEl)}
                          onClose={handleMenuClose}
                        >
                          <MenuItem onClick={() => handleFilterChange(null)}>
                            All Conversations
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterChange('active')}>
                            Active
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterChange('closed')}>
                            Closed
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterChange('archived')}>
                            Archived
                          </MenuItem>
                        </Menu>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  {filterStatus ? `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Conversations` : 'All Conversations'}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    // Create new conversation
                    navigate('/support');
                  }}
                >
                  New Message
                </Button>
              </Box>

              <Box sx={{ borderRadius: 1, border: 1, borderColor: 'divider' }}>
                {filteredConversations.length > 0 ? (
                  <List disablePadding>
                    {filteredConversations.map((conversation) => (
                      <React.Fragment key={conversation.id}>
                        <ConversationItem
                          button
                          selected={selectedConversation?.id === conversation.id}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <ListItemAvatar>
                            <Badge
                              color="error"
                              badgeContent={conversation.unread_count}
                              invisible={conversation.unread_count === 0}
                            >
                              <Avatar alt="Support" src="/images/support-avatar.png" />
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between">
                                <Typography 
                                  variant="subtitle2" 
                                  noWrap 
                                  sx={{ 
                                    maxWidth: '180px',
                                    fontWeight: conversation.unread_count > 0 ? 'bold' : 'normal'
                                  }}
                                >
                                  {conversation.subject}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {conversation.last_message_time && 
                                    format(new Date(conversation.last_message_time), 'MMM dd')}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  noWrap
                                  sx={{ 
                                    maxWidth: '180px',
                                    fontWeight: conversation.unread_count > 0 ? 'bold' : 'normal'
                                  }}
                                >
                                  {conversation.last_message || 'No messages yet'}
                                </Typography>
                                {conversation.order_number && (
                                  <Chip 
                                    label={`#${conversation.order_number}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ConversationItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box p={3} textAlign="center">
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm || filterStatus
                        ? 'No conversations match your search criteria'
                        : 'No conversations yet'}
                    </Typography>
                    {!searchTerm && !filterStatus && (
                      <Button 
                        variant="contained" 
                        color="primary"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/support')}
                      >
                        Start a Conversation
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Messages */}
            <Grid item xs={12} md={8}>
              {selectedConversation ? (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{selectedConversation.subject}</Typography>
                      {selectedConversation.order_number && (
                        <Typography variant="body2" color="text.secondary">
                          Order #{selectedConversation.order_number}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Chip 
                        label={selectedConversation.status.toUpperCase()} 
                        color={selectedConversation.status === 'active' ? 'success' : selectedConversation.status === 'closed' ? 'default' : 'secondary'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <IconButton 
                        size="small"
                        onClick={handleMenuOpen}
                        aria-label="conversation options"
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl)}
                        onClose={handleMenuClose}
                      >
                        <MenuItem onClick={handleArchiveConversation}>
                          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
                          Archive Conversation
                        </MenuItem>
                        <MenuItem onClick={handleMenuClose}>
                          <MarkEmailReadIcon fontSize="small" sx={{ mr: 1 }} />
                          Mark as Read
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Box>

                  <MessageList>
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <MessageItem key={message.id} isSent={message.sender_id === user?.id}>
                          <MessageBubble isSent={message.sender_id === user?.id}>
                            <Typography variant="body1">{message.content}</Typography>
                          </MessageBubble>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {message.attachments.map((attachment, index) => (
                                <MessageAttachment key={index}>
                                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                                  <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                    {attachment.split('/').pop()}
                                  </Typography>
                                  <Button 
                                    size="small" 
                                    href={attachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    sx={{ ml: 1 }}
                                  >
                                    View
                                  </Button>
                                </MessageAttachment>
                              ))}
                            </Box>
                          )}
                          
                          <MessageTime>
                            {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                          </MessageTime>
                        </MessageItem>
                      ))
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body1" color="text.secondary">
                          No messages yet. Start the conversation!
                        </Typography>
                      </Box>
                    )}
                    <div ref={messagesEndRef} />
                  </MessageList>

                  <Box sx={{ mt: 2, p: 2, borderTop: 1, borderColor: 'divider' }}>
                    {attachments.length > 0 && (
                      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {attachments.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            onDelete={() => handleRemoveAttachment(index)}
                            size="small"
                            icon={<AttachFileIcon />}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Type your message here..."
                        variant="outlined"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sendingMessage || selectedConversation.status !== 'active'}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title="Add attachment">
                                <IconButton 
                                  onClick={handleAttachmentClick} 
                                  disabled={sendingMessage || selectedConversation.status !== 'active'}
                                >
                                  <AttachFileIcon />
                                </IconButton>
                              </Tooltip>
                              <VisuallyHiddenInput
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        endIcon={sendingMessage ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage || selectedConversation.status !== 'active'}
                        sx={{ ml: 1, height: '56px' }}
                      >
                        Send
                      </Button>
                    </Box>
                    
                    {selectedConversation.status !== 'active' && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        This conversation is {selectedConversation.status}. You cannot send new messages.
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    p: 4,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Select a conversation
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center">
                    Choose a conversation from the list or start a new one to get help from our support team.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/support')}
                  >
                    Start New Conversation
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </ErrorBoundary>
  );
};

export default Messages; 