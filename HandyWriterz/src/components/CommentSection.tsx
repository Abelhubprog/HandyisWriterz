import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DatabaseService from '@/services/databaseService';
import { Comment } from '@/types/database';
import { toast } from 'react-hot-toast';
import { Edit2, Trash2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentSectionProps {
  pageId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ pageId }) => {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [pageId]);

  const fetchComments = async () => {
    try {
      const fetchedComments = await DatabaseService.fetchComments(pageId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const comment = await DatabaseService.createComment({
        page_id: pageId,
        user_id: user.id,
        content: newComment.trim()
      });
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editedContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const updatedComment = await DatabaseService.updateComment(commentId, editedContent.trim());
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      setEditingCommentId(null);
      setEditedContent('');
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setIsLoading(true);
    try {
      await DatabaseService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  const canModifyComment = (comment: Comment) => {
    return isAdmin || (user && user.id === comment.user_id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex flex-col space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Write a comment..."
              disabled={isLoading}
              title="Write a comment"
              aria-label="Write a comment"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !newComment.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg text-center">
          Please <a href="/auth/login" className="text-blue-600 hover:underline">sign in</a> to comment
        </div>
      )}

      {/* Comments List */}
      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-sm p-4 mb-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {comment.profiles?.avatar_url && (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.full_name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{comment.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {canModifyComment(comment) && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditing(comment)}
                    className="text-gray-600 hover:text-blue-600"
                    title="Edit comment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-600 hover:text-red-600"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  title="Edit comment"
                  placeholder="Edit your comment..."
                  aria-label="Edit comment"
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={isLoading || !editedContent.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {comments.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
};

export default CommentSection;
