import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  Textarea,
  VStack,
  HStack,
  Divider,
  Avatar,
  Badge,
  Icon,
  Spinner,
  useToast,
  useColorModeValue,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import {
  FiSend,
  FiMessageCircle,
  FiUser,
  FiUsers,
  FiCalendar,
  FiPaperclip,
  FiRefreshCw,
  FiMoreVertical,
  FiTrash2,
  FiCheck,
  FiX,
  FiFilter,
  FiSearch,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { getUserMessages, sendMessage, markMessageAsRead, deleteMessage } from '../../lib/databaseService';

// Message interface
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_from_admin: boolean;
  sender_name?: string;
  sender_avatar?: string;
  priority?: 'low' | 'normal' | 'high';
}

// Message priority badge
const PriorityBadge: React.FC<{ priority: Message['priority'] }> = ({ priority }) => {
  if (!priority || priority === 'normal') return null;
  
  const colorScheme = priority === 'high' ? 'red' : 'blue';
  
  return (
    <Badge 
      colorScheme={colorScheme}
      ml={2}
      fontSize="xs"
      textTransform="uppercase"
    >
      {priority}
    </Badge>
  );
};

// Message Item component
const MessageItem: React.FC<{
  message: Message;
  isSelected: boolean;
  onClick: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}> = ({ message, isSelected, onClick, onMarkAsRead, onDelete }) => {
  const bgColor = useColorModeValue(
    isSelected ? 'blue.50' : message.read_at ? 'white' : 'gray.50',
    isSelected ? 'blue.900' : message.read_at ? 'gray.800' : 'gray.700'
  );
  
  const fontWeight = message.read_at ? 'normal' : 'bold';
  const borderColor = useColorModeValue(
    isSelected ? 'blue.500' : 'gray.200',
    isSelected ? 'blue.500' : 'gray.600'
  );
  
  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="md"
      borderLeftWidth={4}
      borderLeftColor={isSelected ? 'blue.500' : message.read_at ? borderColor : 'blue.400'}
      bg={bgColor}
      cursor="pointer"
      onClick={onClick}
      _hover={{ 
        bg: useColorModeValue(
          isSelected ? 'blue.50' : 'gray.100',
          isSelected ? 'blue.900' : 'gray.700'
        )
      }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="center" mb={1}>
        <HStack>
          <Avatar 
            size="xs" 
            name={message.sender_name || (message.is_from_admin ? 'Admin' : 'User')} 
            src={message.sender_avatar} 
          />
          <Text fontWeight={fontWeight} fontSize="sm">
            {message.is_from_admin ? 'Admin' : message.sender_name || 'You'}
          </Text>
          {!message.read_at && (
            <Badge colorScheme="blue" variant="solid" borderRadius="full" ml={2}>New</Badge>
          )}
          <PriorityBadge priority={message.priority} />
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {new Date(message.created_at).toLocaleDateString()}
        </Text>
      </Flex>
      
      <Text fontWeight={fontWeight} noOfLines={1} mb={1}>
        {message.subject}
      </Text>
      
      <Text fontSize="sm" noOfLines={2} color="gray.600">
        {message.content}
      </Text>
      
      {isSelected && (
        <HStack mt={3} spacing={2} justify="flex-end">
          {!message.read_at && (
            <Tooltip label="Mark as read">
              <IconButton 
                aria-label="Mark as read"
                icon={<FiCheck />}
                size="sm"
                variant="ghost"
                colorScheme="green"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
              />
            </Tooltip>
          )}
          <Tooltip label="Delete message">
            <IconButton 
              aria-label="Delete message"
              icon={<FiTrash2 />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          </Tooltip>
        </HStack>
      )}
    </Box>
  );
};

// Message Detail component
const MessageDetail: React.FC<{
  message: Message;
  onReply: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}> = ({ message, onReply, onMarkAsRead, onDelete }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.800')}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{message.subject}</Heading>
        <HStack>
          {!message.read_at && (
            <Button 
              leftIcon={<FiCheck />} 
              size="sm" 
              onClick={onMarkAsRead}
            >
              Mark as Read
            </Button>
          )}
          <Button 
            leftIcon={<FiTrash2 />} 
            size="sm" 
            colorScheme="red" 
            variant="outline"
            onClick={onDelete}
          >
            Delete
          </Button>
        </HStack>
      </Flex>
      
      <Flex align="center" mb={4}>
        <Avatar 
          size="sm" 
          name={message.sender_name || (message.is_from_admin ? 'Admin' : 'User')} 
          src={message.sender_avatar} 
          mr={2}
        />
        <Box>
          <Text fontWeight="bold">
            {message.is_from_admin ? 'Admin' : message.sender_name || 'You'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {new Date(message.created_at).toLocaleString()}
          </Text>
        </Box>
        <PriorityBadge priority={message.priority} />
      </Flex>
      
      <Divider my={4} borderColor={borderColor} />
      
      <Box my={4} whiteSpace="pre-wrap">
        {message.content}
      </Box>
      
      <Divider my={4} borderColor={borderColor} />
      
      <Flex justify="flex-end">
        <Button 
          leftIcon={<FiSend />} 
          colorScheme="blue" 
          onClick={onReply}
        >
          Reply
        </Button>
      </Flex>
    </Box>
  );
};

// Compose message component
const ComposeMessage: React.FC<{
  onSend: (subject: string, content: string, priority: Message['priority']) => Promise<void>;
  onCancel: () => void;
  replyTo?: Message;
}> = ({ onSend, onCancel, replyTo }) => {
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [content, setContent] = useState(replyTo ? `\n\n----- Original Message -----\n${replyTo.content}` : '');
  const [priority, setPriority] = useState<Message['priority']>('normal');
  const [isSending, setIsSending] = useState(false);
  
  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) return;
    
    setIsSending(true);
    try {
      await onSend(subject, content, priority);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.800')}>
      <Heading size="md" mb={4}>
        {replyTo ? 'Reply to Message' : 'New Message'}
      </Heading>
      
      <VStack spacing={4} align="stretch">
        <FormControl id="subject" isRequired>
          <FormLabel>Subject</FormLabel>
          <Input 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            placeholder="Message subject"
          />
        </FormControl>
        
        <FormControl id="priority">
          <FormLabel>Priority</FormLabel>
          <Menu>
            <MenuButton as={Button} rightIcon={<FiFilter />} size="sm" variant="outline">
              {priority === 'low' ? 'Low' : priority === 'high' ? 'High' : 'Normal'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setPriority('low')}>Low</MenuItem>
              <MenuItem onClick={() => setPriority('normal')}>Normal</MenuItem>
              <MenuItem onClick={() => setPriority('high')}>High</MenuItem>
            </MenuList>
          </Menu>
        </FormControl>
        
        <FormControl id="content" isRequired>
          <FormLabel>Message</FormLabel>
          <Textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Type your message here..."
            minHeight="200px"
          />
        </FormControl>
        
        <HStack spacing={3} justify="flex-end">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button 
            colorScheme="blue" 
            leftIcon={<FiSend />} 
            onClick={handleSend}
            isLoading={isSending}
            loadingText="Sending"
            isDisabled={!subject.trim() || !content.trim() || isSending}
          >
            Send Message
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

// Main MessageCenter component
const MessageCenter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'compose'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'from_admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const toast = useToast();
  
  const selectedMessage = messages.find(m => m.id === selectedMessageId) || null;
  
  // Fetch messages
  const fetchMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedMessages = await getUserMessages(user.id);
      setMessages(fetchedMessages as Message[]);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again later.');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load messages',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, [user]);
  
  // Mark message as read
  const handleMarkAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      await markMessageAsRead(messageId);
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg
      ));
      
      toast({
        title: 'Message marked as read',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error marking message as read:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to mark message as read',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      await deleteMessage(messageId);
      
      // Update local state
      setMessages(messages.filter(msg => msg.id !== messageId));
      
      // If deleting currently selected message, go back to list view
      if (selectedMessageId === messageId) {
        setSelectedMessageId(null);
        setView('list');
      }
      
      toast({
        title: 'Message deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error deleting message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete message',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Send message
  const handleSendMessage = async (subject: string, content: string, priority: Message['priority']) => {
    if (!user) return;
    
    try {
      await sendMessage({
        subject,
        content,
        priority,
        // In a real app, you would have a way to specify admin users or a general admin account
        receiver_id: 'admin',
      });
      
      // Refresh messages to get the new one
      await fetchMessages();
      
      // Go back to list view
      setView('list');
      
      toast({
        title: 'Message sent',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw err; // Re-throw to let the ComposeMessage component know there was an error
    }
  };
  
  // Handle message selection
  const handleSelectMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    setView('detail');
    
    const message = messages.find(m => m.id === messageId);
    if (message && !message.read_at) {
      handleMarkAsRead(messageId);
    }
  };
  
  // Filter messages
  const filteredMessages = messages.filter(message => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    let matchesFilter = true;
    if (filter === 'unread') {
      matchesFilter = message.read_at === null;
    } else if (filter === 'from_admin') {
      matchesFilter = message.is_from_admin;
    }
    
    return matchesSearch && matchesFilter;
  });
  
  // Sort messages by date (newest first)
  const sortedMessages = [...filteredMessages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Count unread messages
  const unreadCount = messages.filter(m => !m.read_at).length;
  
  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <HStack>
          <Heading size="lg">Messages</Heading>
          {unreadCount > 0 && (
            <Badge colorScheme="blue" borderRadius="full" px={2}>
              {unreadCount} unread
            </Badge>
          )}
        </HStack>
        
        {view === 'list' && (
          <Button 
            colorScheme="blue" 
            leftIcon={<FiMessageCircle />} 
            onClick={() => {
              setSelectedMessageId(null);
              setView('compose');
            }}
          >
            New Message
          </Button>
        )}
        
        {view !== 'list' && (
          <Button 
            variant="outline" 
            onClick={() => {
              setView('list');
            }}
          >
            Back to Messages
          </Button>
        )}
      </Flex>
      
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" onClick={() => setError(null)} />
        </Alert>
      )}
      
      {view === 'list' && (
        <>
          {/* Filter and search controls */}
          <Flex 
            mb={6} 
            direction={{ base: "column", md: "row" }} 
            gap={4}
            align={{ base: "stretch", md: "center" }}
          >
            <FormControl maxW={{ base: "100%", md: "300px" }}>
              <Flex>
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRightRadius={0}
                />
                <Button
                  borderLeftRadius={0}
                  colorScheme="gray"
                  leftIcon={<FiSearch />}
                >
                  Search
                </Button>
              </Flex>
            </FormControl>
            
            <Flex gap={2} align="center" ml={{ base: 0, md: "auto" }}>
              <Text>Show:</Text>
              <Menu>
                <MenuButton as={Button} rightIcon={<FiFilter />} variant="outline" size="md">
                  {filter === 'all' ? 'All Messages' : 
                   filter === 'unread' ? 'Unread Messages' : 
                   'From Admin'}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setFilter('all')}>All Messages</MenuItem>
                  <MenuItem onClick={() => setFilter('unread')}>Unread Messages</MenuItem>
                  <MenuItem onClick={() => setFilter('from_admin')}>From Admin</MenuItem>
                </MenuList>
              </Menu>
              
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={fetchMessages}
                isLoading={loading}
                variant="ghost"
              >
                Refresh
              </Button>
            </Flex>
          </Flex>
          
          {/* Loading state */}
          {loading && (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" color="blue.500" />
            </Flex>
          )}
          
          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <Flex 
              direction="column" 
              align="center" 
              justify="center" 
              p={10} 
              borderWidth="1px" 
              borderRadius="md"
              bg={useColorModeValue('white', 'gray.800')}
            >
              <Icon as={FiMessageCircle} w={16} h={16} color="gray.400" mb={4} />
              <Heading size="md" mb={2}>No messages yet</Heading>
              <Text textAlign="center" mb={6}>
                Send your first message to get in touch with our team
              </Text>
              <Button 
                colorScheme="blue" 
                leftIcon={<FiMessageCircle />} 
                onClick={() => {
                  setSelectedMessageId(null);
                  setView('compose');
                }}
              >
                New Message
              </Button>
            </Flex>
          )}
          
          {/* No results from filter/search */}
          {!loading && messages.length > 0 && sortedMessages.length === 0 && (
            <Box p={6} textAlign="center">
              <Heading size="md">No matching messages</Heading>
              <Text mt={2}>Try changing your search or filter criteria</Text>
            </Box>
          )}
          
          {/* Message list */}
          {!loading && sortedMessages.length > 0 && (
            <VStack spacing={3} align="stretch">
              {sortedMessages.map(message => (
                <MessageItem 
                  key={message.id}
                  message={message}
                  isSelected={message.id === selectedMessageId}
                  onClick={() => handleSelectMessage(message.id)}
                  onMarkAsRead={() => handleMarkAsRead(message.id)}
                  onDelete={() => handleDeleteMessage(message.id)}
                />
              ))}
            </VStack>
          )}
        </>
      )}
      
      {/* Message detail view */}
      {view === 'detail' && selectedMessage && (
        <MessageDetail 
          message={selectedMessage}
          onReply={() => setView('compose')}
          onMarkAsRead={() => handleMarkAsRead(selectedMessage.id)}
          onDelete={() => handleDeleteMessage(selectedMessage.id)}
        />
      )}
      
      {/* Compose message view */}
      {view === 'compose' && (
        <ComposeMessage 
          onSend={handleSendMessage}
          onCancel={() => {
            setView(selectedMessageId ? 'detail' : 'list');
          }}
          replyTo={selectedMessageId ? selectedMessage : undefined}
        />
      )}
    </Box>
  );
};

export default MessageCenter; 