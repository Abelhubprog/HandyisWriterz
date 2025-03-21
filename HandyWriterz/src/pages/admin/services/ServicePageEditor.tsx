import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { ServicePage } from '@/types/admin';
import { useAuth } from '@/hooks/useAuth';
import DatabaseService from '@/services/databaseService';
import RichTextEditor from '@/components/Editor/RichTextEditor';
import ErrorBoundary from '@/components/Common/ErrorBoundary';
import { useDebounce } from '@/hooks/useDebounce';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';

const ServicePageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNewPage = !id;

  // Page state
  const [page, setPage] = useState<Partial<ServicePage>>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    published: false,
    meta_title: '',
    meta_description: '',
    featured_image: null,
    order: 0
  });

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Warn user about unsaved changes
  useBeforeUnload(hasUnsavedChanges);

  // Memoized load page function with debounce
  const debouncedLoadPage = useDebounce(async () => {
    if (!isNewPage) {
      try {
        setError(null);
        const pageData = await DatabaseService.fetchServicePage(id);
        setPage(pageData);
        setRetryCount(0);
      } catch (error) {
        console.error('Failed to load service page:', error);
        setError('Failed to load service page');
        
        // Implement exponential backoff for retries
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            debouncedLoadPage();
          }, Math.pow(2, retryCount) * 1000);
        }
      }
    }
  }, 500);

  // Load existing page data
  useEffect(() => {
    debouncedLoadPage();
  }, [id, isNewPage, debouncedLoadPage]);

  // Auto-save functionality
  const debouncedAutoSave = useDebounce(async () => {
    if (!isNewPage && page.id && hasUnsavedChanges) {
      try {
        setIsSaving(true);
        await DatabaseService.updateServicePage(page.id, page);
        setHasUnsavedChanges(false);
        toast.success('Draft saved', { id: 'auto-save' });
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Failed to save draft', { id: 'auto-save' });
      } finally {
        setIsSaving(false);
      }
    }
  }, 30000); // Auto-save after 30 seconds of inactivity

  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedAutoSave();
    }
  }, [hasUnsavedChanges, debouncedAutoSave]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!page.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!page.content?.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!page.slug?.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) {
      newErrors.slug = 'Invalid slug format';
    }

    if (page.meta_description && page.meta_description.length > 160) {
      newErrors.meta_description = 'Meta description should not exceed 160 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [page]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isNewPage) {
        const newPage = await DatabaseService.createServicePage({
          ...page,
          author_id: user!.id,
        });
        toast.success('Service page created successfully');
        navigate(`/admin/services/edit/${newPage.id}`);
      } else {
        await DatabaseService.updateServicePage(id, page);
        toast.success('Service page updated successfully');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to save service page:', error);
      toast.error('Failed to save service page');
    } finally {
      setIsSubmitting(false);
    }
  }, [page, isNewPage, id, user, navigate, validateForm]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const imageUrl = await DatabaseService.uploadImage(file);
      setPage(prev => ({
        ...prev,
        featured_image: imageUrl
      }));
      setHasUnsavedChanges(true);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    }
  }, []);

  // Generate slug from title
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setPage(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  }, []);

  if (error) {
    return (
      <div role="alert" className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Page</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              {retryCount < 3 && (
                <button
                  onClick={debouncedLoadPage}
                  className="mt-2 text-red-800 underline hover:text-red-900"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
      <form 
        onSubmit={handleSubmit} 
        className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200"
        role="form"
        aria-label="Service page editor"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    navigate('/admin/services');
                  }
                } else {
                  navigate('/admin/services');
                }
              }}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Back to services"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Services
            </button>
            <div className="flex items-center gap-3">
              {isSaving && (
                <span className="text-sm text-gray-500" role="status">
                  Saving draft...
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
                aria-label={isSubmitting ? 'Saving...' : 'Save page'}
              >
                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                {isSubmitting ? 'Saving...' : 'Save Page'}
              </button>
            </div>
          </div>

          {/* Title input */}
          <div className="mb-4">
            <label htmlFor="title" className="sr-only">Page title</label>
            <input
              id="title"
              type="text"
              value={page.title}
              onChange={(e) => {
                const newTitle = e.target.value;
                handleFieldChange('title', newTitle);
                if (isNewPage) {
                  handleFieldChange('slug', generateSlug(newTitle));
                }
              }}
              placeholder="Page title"
              className={`
                w-full text-2xl font-bold border-0 focus:ring-0 p-0 placeholder-gray-400
                ${errors.title ? 'text-red-600' : 'text-gray-900'}
              `}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Slug input */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>/services/</span>
            <label htmlFor="slug" className="sr-only">Page slug</label>
            <input
              id="slug"
              type="text"
              value={page.slug}
              onChange={(e) => handleFieldChange('slug', e.target.value)}
              placeholder="page-slug"
              className={`
                flex-1 border-0 focus:ring-0 p-0 text-gray-500
                ${errors.slug ? 'text-red-600' : ''}
              `}
              aria-invalid={!!errors.slug}
              aria-describedby={errors.slug ? 'slug-error' : undefined}
            />
            {errors.slug && (
              <p id="slug-error" className="text-sm text-red-600" role="alert">
                {errors.slug}
              </p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="p-4 sm:p-6 grid gap-6">
          {/* Featured image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            <div className="flex items-start gap-4">
              {page.featured_image ? (
                <div className="relative group">
                  <img
                    src={page.featured_image}
                    alt="Featured"
                    className="h-40 w-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('featured_image', null)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    aria-label="Remove featured image"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 w-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    aria-label="Upload featured image"
                  />
                  <ImageIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  <span className="mt-2 text-sm text-gray-500">Upload image</span>
                </label>
              )}
            </div>
          </div>

          {/* Content editor */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <RichTextEditor
              id="content"
              content={page.content || ''}
              onChange={(content) => handleFieldChange('content', content)}
              error={errors.content}
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? 'content-error' : undefined}
            />
            {errors.content && (
              <p id="content-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.content}
              </p>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={page.excerpt}
              onChange={(e) => handleFieldChange('excerpt', e.target.value)}
              rows={3}
              placeholder="Brief summary of the page"
              className="w-full rounded-lg border-gray-200 resize-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* SEO section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  id="meta_title"
                  type="text"
                  value={page.meta_title || ''}
                  onChange={(e) => handleFieldChange('meta_title', e.target.value)}
                  placeholder="SEO title (defaults to page title if empty)"
                  className="w-full rounded-lg border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  id="meta_description"
                  value={page.meta_description || ''}
                  onChange={(e) => handleFieldChange('meta_description', e.target.value)}
                  rows={2}
                  placeholder="Brief description for search engines"
                  className={`
                    w-full rounded-lg border-gray-200 resize-none focus:ring-indigo-500 focus:border-indigo-500
                    ${errors.meta_description ? 'border-red-500' : ''}
                  `}
                  aria-invalid={!!errors.meta_description}
                  aria-describedby={errors.meta_description ? 'meta-description-error meta-description-count' : 'meta-description-count'}
                />
                {errors.meta_description && (
                  <p id="meta-description-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.meta_description}
                  </p>
                )}
                <p id="meta-description-count" className="mt-1 text-sm text-gray-500">
                  {page.meta_description?.length || 0}/160 characters
                </p>
              </div>
            </div>
          </div>

          {/* Publishing options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Publishing</h3>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={page.published}
                  onChange={(e) => handleFieldChange('published', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  aria-label="Published"
                />
                <span className="ml-2 text-sm text-gray-900">Published</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </ErrorBoundary>
  );
};

export default React.memo(ServicePageEditor);
