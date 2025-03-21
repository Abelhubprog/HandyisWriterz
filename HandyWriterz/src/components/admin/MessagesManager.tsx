import React, { useState, useEffect, useRef } from 'react';
import { appwriteService, COLLECTIONS, DATABASE_ID } from '@/lib/appwriteClient';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  Mail,
  Send,
  Paperclip,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  File,
  Image as ImageIcon,
  X,
  Clock,
  Star,
  Archive,
  MessageSquare,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface Message {
  $id: string;
  userId: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
  files?: string[];
  order?: string;
  replies?: MessageReply[];
}

interface MessageReply {
  $id: string;
  messageId: string;
  fromAdmin: boolean;
  fromName: string;
  content: string;
  createdAt: string;
  files?: string[];
}

type FilterStatus = 'all' | 'unread' | 'read' | 'replied' | 'starred' | 'archived';

const MessagesManager: React.FC = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [messagesPerPage] = useState(20);
  const [starredMessages, setStarredMessages] = useState<string[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch messages
  useEffect(() => {
    fetchMessages();
    
    // Load starred and archived messages from localStorage
    const storedStarred = localStorage.getItem('starred-messages');
    if (storedStarred) {
      setStarredMessages(JSON.parse(storedStarred));
    }
    
    const storedArchived = localStorage.getItem('archived-messages');
    if (storedArchived) {
      setArchivedMessages(JSON.parse(storedArchived));
    }
  }, []);
  
  // Filter messages whenever filters change
  useEffect(() => {
    filterMessages();
  }, [messages, searchQuery, filterStatus, starredMessages, archivedMessages]);
  
  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we'd limit this and implement pagination from the backend
      const response = await appwriteService.database.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [appwriteService.createQuery.orderDesc('createdAt')]
      );
      
      // Get replies for each message
      const messagesWithReplies = await Promise.all(
        response.documents.map(async (message: any) => {
          try {
            const repliesResponse = await appwriteService.database.listDocuments(
              DATABASE_ID,
              'message_replies',
              [
                appwriteService.createQuery.equal('messageId', message.$id),
                appwriteService.createQuery.orderAsc('createdAt')
              ]
            );
            
            return {
              ...message,
              replies: repliesResponse.documents || []
            };
          } catch (error) {
            console.error(`Error fetching replies for message ${message.$id}:`, error);
            return {
              ...message,
              replies: []
            };
          }
        })
      );
      
      setMessages(messagesWithReplies);
      setTotalPages(Math.ceil(messagesWithReplies.length / messagesPerPage));
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const refreshMessages = () => {
    setRefreshing(true);
    fetchMessages();
  };
  
  const filterMessages = () => {
    let filtered = [...messages];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        message => 
          message.subject.toLowerCase().includes(query) ||
          message.fromName.toLowerCase().includes(query) ||
          message.fromEmail.toLowerCase().includes(query) ||
          message.content.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterStatus === 'unread') {
      filtered = filtered.filter(message => message.status === 'unread');
    } else if (filterStatus === 'read') {
      filtered = filtered.filter(message => message.status === 'read');
    } else if (filterStatus === 'replied') {
      filtered = filtered.filter(message => message.status === 'replied');
    } else if (filterStatus === 'starred') {
      filtered = filtered.filter(message => starredMessages.includes(message.$id));
    } else if (filterStatus === 'archived') {
      filtered = filtered.filter(message => archivedMessages.includes(message.$id));
    }
    
    // For archived messages, we hide them from other views
    if (filterStatus !== 'archived') {
      filtered = filtered.filter(message => !archivedMessages.includes(message.$id));
    }
    
    // Pagination
    const start = (currentPage - 1) * messagesPerPage;
    const end = start + messagesPerPage;
    
    setFilteredMessages(filtered.slice(start, end));
  };
  
  const handleSelectMessage = async (message: Message) => {
    // If message is unread, mark it as read
    if (message.status === 'unread') {
      try {
        await appwriteService.database.updateDocument(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          message.$id,
          { status: 'read' }
        );
        
        // Update local state
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.$id === message.$id 
              ? { ...msg, status: 'read' }
              : msg
          )
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
    
    setSelectedMessage(message);
  };
  
  const handleSubmitReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;
    
    try {
      // Create reply
      const replyData = {
        messageId: selectedMessage.$id,
        fromAdmin: true,
        fromName: user?.fullName || 'Admin',
        content: replyContent,
        createdAt: new Date().toISOString(),
        files: [] // We would handle file uploads here
      };
      
      // Handle file uploads if any
      if (selectedFiles.length > 0) {
        const fileIds = await Promise.all(
          selectedFiles.map(async file => {
            const { fileId } = await appwriteService.media.uploadFile(file, 'documents');
            return fileId;
          })
        );
        
        replyData.files = fileIds;
      }
      
      // Save reply to database
      await appwriteService.database.createDocument(
        DATABASE_ID,
        'message_replies',
        appwriteService.createUniqueId(),
        replyData
      );
      
      // Update message status to replied
      await appwriteService.database.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        selectedMessage.$id,
        { status: 'replied' }
      );
      
      // Update local state
      const updatedMessage = {
        ...selectedMessage,
        status: 'replied',
        replies: [
          ...(selectedMessage.replies || []),
          { ...replyData, $id: '' } // Temporary ID until we refresh
        ]
      };
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.$id === selectedMessage.$id ? updatedMessage : msg
        )
      );
      
      setSelectedMessage(updatedMessage);
      setReplyContent('');
      setSelectedFiles([]);
      
      toast.success('Reply sent successfully');
      
      // In a real app, we would also send an email notification to the user
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply. Please try again.');
    }
  };
  
  const handleStarMessage = (messageId: string) => {
    let newStarred;
    
    if (starredMessages.includes(messageId)) {
      newStarred = starredMessages.filter(id => id !== messageId);
    } else {
      newStarred = [...starredMessages, messageId];
    }
    
    setStarredMessages(newStarred);
    localStorage.setItem('starred-messages', JSON.stringify(newStarred));
  };
  
  const handleArchiveMessage = (messageId: string) => {
    const newArchived = [...archivedMessages, messageId];
    setArchivedMessages(newArchived);
    localStorage.setItem('archived-messages', JSON.stringify(newArchived));
    
    if (selectedMessage?.$id === messageId) {
      setSelectedMessage(null);
    }
    
    toast.success('Message archived');
  };
  
  const handleUnarchiveMessage = (messageId: string) => {
    const newArchived = archivedMessages.filter(id => id !== messageId);
    setArchivedMessages(newArchived);
    localStorage.setItem('archived-messages', JSON.stringify(newArchived));
    
    toast.success('Message restored from archive');
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete message from database
      await appwriteService.database.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId
      );
      
      // Remove from local state
      setMessages(prevMessages => prevMessages.filter(msg => msg.$id !== messageId));
      
      if (selectedMessage?.$id === messageId) {
        setSelectedMessage(null);
      }
      
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message. Please try again.');
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-gray-100 text-gray-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread':
        return <Mail className="h-4 w-4" />;
      case 'read':
        return <Eye className="h-4 w-4" />;
      case 'replied':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    }
    
    return <File className="h-4 w-4 text-gray-500" />;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden h-[calc(100vh-8rem)] flex">
      {/* Messages List */}
      <div className="w-1/3 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Messages</h2>
            <button
              onClick={refreshMessages}
              className={`p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full ${
                refreshing ? 'animate-spin' : ''
              }`}
              disabled={refreshing}
              aria-label="Refresh messages"
              title="Refresh messages"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              aria-label="Search messages"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pb-1 overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('unread')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                filterStatus === 'unread'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterStatus('replied')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                filterStatus === 'replied'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Replied
            </button>
            <button
              onClick={() => setFilterStatus('starred')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                filterStatus === 'starred'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Starred
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                filterStatus === 'archived'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Archived
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4 text-red-500">
            <p>{error}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
            <p>No messages found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              {filteredMessages.map(message => (
                <div
                  key={message.$id}
                  className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    selectedMessage?.$id === message.$id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${message.status === 'unread' ? 'font-semibold' : ''}`}
                  onClick={() => handleSelectMessage(message)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {message.fromName}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarMessage(message.$id);
                        }}
                        className={`p-1 rounded-full ${
                          starredMessages.includes(message.$id)
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-gray-500'
                        }`}
                        aria-label={starredMessages.includes(message.$id) ? 'Unstar message' : 'Star message'}
                        title={starredMessages.includes(message.$id) ? 'Unstar message' : 'Star message'}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 truncate">
                    {message.subject}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {message.content.replace(/<[^>]*>/g, '').substring(0, 50)}
                      {message.content.length > 50 ? '...' : ''}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(message.status)}`}>
                      {getStatusIcon(message.status)}
                      <span className="capitalize">{message.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t dark:border-gray-700 flex justify-between items-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                  className="p-1 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                  className="p-1 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  aria-label="Next page"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Message Details */}
      <div className="w-2/3 flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-4 border-b dark:border-gray-700 flex justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">{selectedMessage.subject}</h2>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">From: {selectedMessage.fromName} &lt;{selectedMessage.fromEmail}&gt;</span>
                  <span>•</span>
                  <span className="ml-2">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {archivedMessages.includes(selectedMessage.$id) ? (
                  <button
                    onClick={() => handleUnarchiveMessage(selectedMessage.$id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full"
                    aria-label="Unarchive message"
                    title="Unarchive message"
                  >
                    <Archive className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchiveMessage(selectedMessage.$id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full"
                    aria-label="Archive message"
                    title="Archive message"
                  >
                    <Archive className="h-5 w-5" />
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.$id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full"
                  aria-label="Delete message"
                  title="Delete message"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedMessage.content }} />
                
                {/* If there are files attached */}
                {selectedMessage.files && selectedMessage.files.length > 0 && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {selectedMessage.files.map((fileId, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded"
                        >
                          <div className="flex items-center">
                            <File className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="text-sm text-gray-800 dark:text-gray-200">
                              Attachment {index + 1}
                            </span>
                          </div>
                          <a
                            href={appwriteService.media.getFileView(fileId, 'documents')}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Replies */}
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="mb-6 space-y-4">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">Conversation History</h3>
                  
                  {selectedMessage.replies.map((reply, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        reply.fromAdmin
                          ? 'bg-blue-50 dark:bg-blue-900/20 ml-4'
                          : 'bg-gray-50 dark:bg-gray-700 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {reply.fromAdmin ? 'You' : reply.fromName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: reply.content }} />
                      
                      {/* If there are files attached */}
                      {reply.files && reply.files.length > 0 && (
                        <div className="mt-3 pt-3 border-t dark:border-gray-600">
                          <div className="space-y-2">
                            {reply.files.map((fileId, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded"
                              >
                                <div className="flex items-center">
                                  <File className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                  <span className="text-xs text-gray-800 dark:text-gray-200">
                                    Attachment {i + 1}
                                  </span>
                                </div>
                                <a
                                  href={appwriteService.media.getFileView(fileId, 'documents')}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Reply Form */}
            <div className="p-4 border-t dark:border-gray-700">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Reply</h3>
              <RichTextEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Type your reply here..."
                height="150px"
                showMarkdownToggle={false}
              />
              
              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    aria-label="Attach files"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    aria-label="Attach files"
                    title="Attach files"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>Attach</span>
                  </button>
                  
                  {selectedFiles.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedFiles.length} file(s) selected
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Reply</span>
                </button>
              </div>
              
              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded"
                    >
                      <div className="flex items-center overflow-hidden">
                        {getFileIcon(file.name)}
                        <span className="ml-2 text-sm text-gray-800 dark:text-gray-200 truncate">
                          {file.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        aria-label="Remove file"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No message selected</h3>
            <p className="text-center max-w-md">
              Select a message from the list to view its details and reply to it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesManager; 