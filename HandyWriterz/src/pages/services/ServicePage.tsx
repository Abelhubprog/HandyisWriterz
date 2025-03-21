import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Heart, Share2, MessageSquare, Edit, Trash, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/hooks/useAuth';
import DatabaseService from '@/services/databaseService';
import CommentSection from '@/components/CommentSection';
import { formatDate } from '@/utils/formatDate';
import { ServicePage as ServicePageType } from '@/types/databaseTypes';

interface ServicePageProps {
  initialData?: ServicePageType;
}

const ServicePage: React.FC<ServicePageProps> = ({ initialData }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [page, setPage] = useState<ServicePageType | null>(initialData || null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialData?.likes_count || 0);
  const [loading, setLoading] = useState(!initialData);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      // If we have initial data, no need to fetch
      if (initialData) {
        setLoading(false);
        return;
      }

      if (!slug) {
        navigate('/services');
        return;
      }

      try {
        setLoading(true);
        const pageData = await DatabaseService.fetchServicePageBySlug(slug);
        if (!pageData) {
          navigate('/services');
          return;
        }

        setPage(pageData);
        setLikesCount(pageData.likes_count || 0);

        // Check if user has liked the page
        if (user?.id) {
          const hasLiked = await DatabaseService.hasUserLikedServicePage(pageData.id, user.id);
          setIsLiked(hasLiked);
        }
      } catch (error) {
        console.error('Error loading service page:', error);
        toast.error('Failed to load service page');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug, user?.id, navigate, initialData]);

  const handleLike = async () => {
    if (!page) return;

    try {
      // Always allow likes, even for anonymous users
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

      // If user is authenticated, persist the like
      if (user?.id) {
        if (isLiked) {
          await DatabaseService.unlikeServicePage(page.id, user.id);
        } else {
          await DatabaseService.likeServicePage(page.id, user.id);
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert UI state on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      toast.error('Failed to update like');
    }
  };

  const handleShare = async () => {
    if (!page) return;

    try {
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: page.title,
          text: page.meta_description,
          url: window.location.href,
        });
      } else {
        // Fallback to copying URL
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }

      // Track share
      await DatabaseService.trackServicePageShare(page.id);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing page:', error);
        toast.error('Failed to share page');
      }
    }
  };

  const handleDelete = async () => {
    if (!page || !isAdmin) return;

    const confirmed = window.confirm('Are you sure you want to delete this page? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await DatabaseService.deleteServicePage(page.id);
      toast.success('Page deleted successfully');
      navigate('/services');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const handleEdit = () => {
    if (!page || !isAdmin) return;
    navigate(`/admin/services/edit/${page.id}`);
  };

  const handlePreview = () => {
    if (!page || !isAdmin) return;
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <article className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex justify-end space-x-4 mb-4">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            {isEditing && (
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
            )}
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        )}

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <time dateTime={page.updated_at}>
            Last updated {formatDate(page.updated_at)}
          </time>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? 'fill-current text-red-500' : ''}`}
              />
              <span>{likesCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      {page.featured_image && (
        <div className="mb-8">
          <img
            src={page.featured_image}
            alt={page.title}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{page.content}</ReactMarkdown>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        {user ? (
          <CommentSection
            servicePageId={page.id}
            isStatic={false}
          />
        ) : (
          <p className="text-gray-500 text-sm">
            You must be logged in to comment.
          </p>
        )}
      </div>
    </article>
  );
};

export default ServicePage;