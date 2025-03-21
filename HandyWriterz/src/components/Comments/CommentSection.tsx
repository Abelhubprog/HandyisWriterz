// src/components/Comments/CommentSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Textarea,
  Avatar,
  Flex,
  Divider,
  useToast,
  useColorModeValue,
  Badge,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import {
  FiMessageSquare,
  FiSend,
  FiThumbsUp,
  FiMoreVertical,
  FiTrash2,
  FiEdit,
  FiFlag,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiClock,
  FiUser
} from 'react-icons/fi';
import { getComments, addComment, updateComment, deleteComment, likeComment, unlikeComment } from '../../lib/databaseService';

// Comment interface
interface Comment {
  id: string;
  user_id: string;
  page_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
  user_avatar?: string;
  liked_by: string[];
  likes_count: number;
  replies?: Comment[];
  parent_id?: string;
}

// User reaction state to a comment (if they've liked it)
interface UserReactions {
  [commentId: string]: boolean;
}

// Time formatter for "time ago" display
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
};

// Status Badge component
const StatusBadge: React.FC<{ status: Comment['status'] }> = ({ status }) => {
  const statusProps = {
    pending: { colorScheme: 'yellow', icon: FiClock, text: 'Pending Review' },
    approved: { colorScheme: 'green', icon: FiCheck, text: 'Approved' },
    rejected: { colorScheme: 'red', icon: FiX, text: 'Rejected' }
  }[status];
  
  return (
    <Badge 
      colorScheme={statusProps.colorScheme} 
      display="flex" 
      alignItems="center" 
      px={2}
      py={1}
      borderRadius="full"
      fontSize="xs"
    >
      <Box as={statusProps.icon} mr={1} />
      {statusProps.text}
    </Badge>
  );
};

// Single Comment Component
const CommentItem: React.FC<{
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  userReactions: UserReactions;
  isReply?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
}> = ({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  onLike, 
  userReactions, 
  isReply = false,
  currentUserId,
  isAdmin = false
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const replyBgColor = useColorModeValue('gray.50', 'gray.700');
  
  const isAuthor = currentUserId === comment.user_id;
  const hasLiked = userReactions[comment.id] || false;
  
  // Button to like/unlike comment with dynamic styling
  const LikeButton = () => (
    <Button
      size="sm"
      leftIcon={<FiThumbsUp />}
      variant={hasLiked ? "solid" : "ghost"}
      colorScheme={hasLiked ? "blue" : "gray"}
      onClick={() => onLike(comment.id)}
    >
      {comment.likes_count || 0}
    </Button>
  );
  
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      mb={3}
      bg={isReply ? replyBgColor : bgColor}
      ml={isReply ? 12 : 0}
      position="relative"
    >
      {comment.status !== 'approved' && (
        <Box position="absolute" top={2} right={2}>
          <StatusBadge status={comment.status} />
        </Box>
      )}
      
      <Flex>
        <Avatar 
          size="sm" 
          name={comment.user_name} 
          src={comment.user_avatar} 
          mr={3} 
        />
        <Box flex="1">
          <Flex align="center" mb={1}>
            <Text fontWeight="bold">{comment.user_name}</Text>
            <Text fontSize="sm" color="gray.500" ml={2}>
              {formatTimeAgo(comment.created_at)}
            </Text>
            {comment.updated_at && (
              <Text fontSize="xs" color="gray.500" ml={2}>(edited)</Text>
            )}
          </Flex>
          
          <Text mb={3}>{comment.content}</Text>
          
          <HStack>
            <LikeButton />
            
            {!isReply && (
              <Button
                size="sm"
                leftIcon={<FiMessageSquare />}
                variant="ghost"
                onClick={() => onReply(comment.id)}
              >
                Reply
              </Button>
            )}
            
            {isAuthor && (
              <Button
                size="sm"
                leftIcon={<FiEdit />}
                variant="ghost"
                onClick={() => onEdit(comment)}
              >
                Edit
              </Button>
            )}
            
            {(isAuthor || isAdmin) && (
              <Button
                size="sm"
                leftIcon={<FiTrash2 />}
                variant="ghost"
                colorScheme="red"
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </Button>
            )}
            
            {!isAuthor && !isAdmin && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="More options"
                  icon={<FiMoreVertical />}
                  variant="ghost"
                  size="sm"
                />
                <MenuList>
                  <MenuItem icon={<FiFlag />} color="red.500">
                    Report Comment
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </HStack>
        </Box>
      </Flex>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <VStack spacing={2} mt={4} align="stretch">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              userReactions={userReactions}
              isReply={true}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

// Comment form component (for new comments and replies)
const CommentForm: React.FC<{
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  initialValue?: string;
  parentId?: string;
  isReply?: boolean;
  isEdit?: boolean;
  onCancel?: () => void;
}> = ({ 
  onSubmit, 
  initialValue = '', 
  parentId, 
  isReply = false, 
  isEdit = false,
  onCancel 
}) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    // Focus the textarea when the component mounts, especially for replies and edits
    if ((isReply || isEdit) && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isReply, isEdit]);
  
  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content, parentId);
      // Clear the form after submission if not in edit mode
      if (!isEdit) {
        setContent('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Login Required</AlertTitle>
          <AlertDescription>
            Please log in to leave a comment.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }
  
  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="md" 
      mb={4}
      ml={isReply ? 12 : 0}
      bg={useColorModeValue(isReply ? 'gray.50' : 'white', isReply ? 'gray.700' : 'gray.800')}
    >
      <Flex mb={3}>
        <Avatar 
          size="sm" 
          name={user.email} 
          src={user.avatar_url} 
          mr={3} 
        />
        <Box flex="1">
          <Text fontWeight="medium">{user.email.split('@')[0]}</Text>
        </Box>
      </Flex>
      
      <Textarea
        placeholder={isReply ? "Write a reply..." : "Write a comment..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        mb={3}
        ref={textareaRef}
      />
      
      <HStack justify="flex-end">
        {(isReply || isEdit) && onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        
        <Button
          colorScheme="blue"
          leftIcon={<FiSend />}
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Submitting"
          isDisabled={!content.trim() || isSubmitting}
        >
          {isEdit ? "Update" : isReply ? "Reply" : "Comment"}
        </Button>
      </HStack>
    </Box>
  );
};

// Confirmation modal for deleting comments
const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete Comment</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          Are you sure you want to delete this comment? This action cannot be undone.
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button 
            colorScheme="red" 
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Deleting"
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Main CommentSection component
interface CommentSectionProps {
  pageId: string;
  title?: string;
  allowReplies?: boolean;
  maxDisplayComments?: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  pageId, 
  title = "Comments",
  allowReplies = true,
  maxDisplayComments = 5
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<UserReactions>({});
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user, userRole } = useAuth();
  const toast = useToast();
  const isAdmin = userRole === 'admin';
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Organize comments into parent comments and replies
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap: Record<string, Comment> = {};
    const topLevelComments: Comment[] = [];
    
    // First pass: create map of all comments
    flatComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });
    
    // Second pass: organize into hierarchy
    flatComments.forEach(comment => {
      if (comment.parent_id && commentMap[comment.parent_id]) {
        // This is a reply, add it to its parent's replies
        commentMap[comment.parent_id].replies?.push(commentMap[comment.id]);
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap[comment.id]);
      }
    });
    
    return topLevelComments;
  };
  
  // Load comments for the page
  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedComments = await getComments(pageId);
      const organizedComments = organizeComments(fetchedComments as Comment[]);
      setComments(organizedComments);
      
      // Initialize user reactions (if user is logged in)
      if (user) {
        const reactionsMap: UserReactions = {};
        fetchedComments.forEach((comment: Comment) => {
          reactionsMap[comment.id] = comment.liked_by.includes(user.id);
        });
        setUserReactions(reactionsMap);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments. Please try again later.');
      toast({
        title: 'Error loading comments',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load comments on component mount and when pageId changes
  useEffect(() => {
    fetchComments();
  }, [pageId, user]);
  
  // Add a new comment or reply
  const handleAddComment = async (content: string, parentId?: string) => {
    if (!user) return;
    
    try {
      await addComment({
        page_id: pageId,
        content,
        parent_id: parentId
      });
      
      // Refresh comments
      await fetchComments();
      
      // Reset reply state if this was a reply
      if (parentId) {
        setReplyToId(null);
      }
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been submitted and is pending review.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Error adding comment',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Update an existing comment
  const handleUpdateComment = async (content: string) => {
    if (!user || !editingComment) return;
    
    try {
      await updateComment(editingComment.id, {
        content
      });
      
      // Refresh comments
      await fetchComments();
      
      // Reset editing state
      setEditingComment(null);
      
      toast({
        title: 'Comment updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error updating comment:', err);
      toast({
        title: 'Error updating comment',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Delete a comment
  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    onOpen();
  };
  
  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await deleteComment(commentToDelete);
      
      // Refresh comments
      await fetchComments();
      
      toast({
        title: 'Comment deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast({
        title: 'Error deleting comment',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
    }
  };
  
  // Handle like/unlike comment
  const handleLikeComment = async (commentId: string) => {
    if (!user) return;
    
    const isCurrentlyLiked = userReactions[commentId];
    
    // Optimistically update UI
    setUserReactions(prev => ({
      ...prev,
      [commentId]: !isCurrentlyLiked
    }));
    
    try {
      if (isCurrentlyLiked) {
        await unlikeComment(commentId, user.id);
      } else {
        await likeComment(commentId, user.id);
      }
      
      // Refresh comments to get updated likes count
      await fetchComments();
    } catch (err) {
      console.error('Error updating like status:', err);
      
      // Revert the optimistic update on error
      setUserReactions(prev => ({
        ...prev,
        [commentId]: isCurrentlyLiked
      }));
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update like status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handle reply button click
  const handleReplyClick = (parentId: string) => {
    setReplyToId(replyToId === parentId ? null : parentId);
    setEditingComment(null);
  };
  
  // Handle edit button click
  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment);
    setReplyToId(null);
  };
  
  // Get comments to display based on showAllComments flag
  const displayComments = showAllComments 
    ? comments 
    : comments.slice(0, maxDisplayComments);
  
  return (
    <Box my={8}>
      <Heading as="h2" size="lg" mb={6}>
        {title} {comments.length > 0 && `(${comments.length})`}
      </Heading>
      
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" onClick={() => setError(null)} />
        </Alert>
      )}
      
      {/* Add comment form */}
      {!editingComment && (
        <CommentForm 
          onSubmit={handleAddComment}
        />
      )}
      
      {/* Loading state */}
      {loading && (
        <Flex justify="center" align="center" h="100px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      )}
      
      {/* No comments state */}
      {!loading && comments.length === 0 && (
        <Box 
          p={6} 
          textAlign="center" 
          borderWidth="1px" 
          borderRadius="md"
          borderStyle="dashed"
        >
          <Heading size="md" mb={2}>No comments yet</Heading>
          <Text>Be the first to share your thoughts!</Text>
        </Box>
      )}
      
      {/* Comments list */}
      {!loading && comments.length > 0 && (
        <VStack spacing={4} align="stretch" mt={6}>
          {displayComments.map(comment => (
            <Box key={comment.id}>
              {/* Don't show the comment form if we're editing this comment */}
              {editingComment?.id === comment.id ? (
                <CommentForm
                  onSubmit={handleUpdateComment}
                  initialValue={editingComment.content}
                  isEdit={true}
                  onCancel={() => setEditingComment(null)}
                />
              ) : (
                <CommentItem
                  comment={comment}
                  onReply={handleReplyClick}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  userReactions={userReactions}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                />
              )}
              
              {/* Reply form for this comment */}
              {replyToId === comment.id && allowReplies && (
                <CommentForm
                  onSubmit={handleAddComment}
                  parentId={comment.id}
                  isReply={true}
                  onCancel={() => setReplyToId(null)}
                />
              )}
            </Box>
          ))}
          
          {/* Show more/less comments button */}
          {comments.length > maxDisplayComments && (
            <Button 
              variant="ghost" 
              onClick={() => setShowAllComments(!showAllComments)}
              alignSelf="center"
              mt={2}
            >
              {showAllComments 
                ? `Show less comments` 
                : `Show all comments (${comments.length})`}
            </Button>
          )}
        </VStack>
      )}
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal 
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={confirmDeleteComment}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default CommentSection; 