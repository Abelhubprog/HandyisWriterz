import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PostEditor from './PostEditor';
import DatabaseService from '@/services/databaseService';
import { useAuth } from '@/hooks/useAuth';
import { Post, Tag } from '@/types/admin';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn()
}));
jest.mock('@/services/databaseService');
jest.mock('@/hooks/useAuth');
jest.mock('react-hot-toast');

// Mock data
const mockPost: Post = {
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  content: '<p>Test content</p>',
  excerpt: 'Test excerpt',
  status: 'draft',
  author: {
    id: 'author1',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
  },
  tags: [],
  meta_title: 'Test Meta Title',
  meta_description: 'Test meta description',
  featured_image: null,
  createdAt: '2025-03-01T00:00:00Z',
  updatedAt: '2025-03-01T00:00:00Z'
};

const mockTags: Tag[] = [
  { id: '1', name: 'Technology' },
  { id: '2', name: 'Design' }
];

describe('PostEditor Component', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', role: 'admin' },
      isAdmin: true
    });
    
    // Mock router hooks
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    
    // Mock database service
    (DatabaseService.fetchTags as jest.Mock).mockResolvedValue(mockTags);
  });

  describe('New Post Mode', () => {
    beforeEach(() => {
      (useParams as jest.Mock).mockReturnValue({});
    });

    it('renders empty form for new post', () => {
      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText(/post title/i)).toHaveValue('');
      expect(screen.getByRole('combobox')).toHaveValue('draft');
    });

    it('handles title input and auto-generates slug', () => {
      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText(/post title/i);
      fireEvent.change(titleInput, { target: { value: 'My New Post Title' } });

      expect(screen.getByPlaceholderText(/post-slug/i)).toHaveValue('my-new-post-title');
    });

    it('validates required fields on submit', async () => {
      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      const submitButton = screen.getByText(/save post/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });

    it('successfully creates new post', async () => {
      (DatabaseService.createPost as jest.Mock).mockResolvedValue({
        ...mockPost,
        id: 'new-post-id'
      });

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText(/post title/i), {
        target: { value: 'New Post' }
      });
      fireEvent.change(screen.getByPlaceholderText(/post-slug/i), {
        target: { value: 'new-post' }
      });

      // Submit form
      const submitButton = screen.getByText(/save post/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(DatabaseService.createPost).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Post created successfully');
        expect(mockNavigate).toHaveBeenCalledWith('/admin/content/posts/edit/new-post-id');
      });
    });
  });

  describe('Edit Post Mode', () => {
    beforeEach(() => {
      (useParams as jest.Mock).mockReturnValue({ id: '1' });
      (DatabaseService.fetchPost as jest.Mock).mockResolvedValue(mockPost);
    });

    it('loads existing post data', async () => {
      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/post title/i)).toHaveValue('Test Post');
        expect(screen.getByPlaceholderText(/post-slug/i)).toHaveValue('test-post');
      });
    });

    it('handles failed post load', async () => {
      (DatabaseService.fetchPost as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load post');
        expect(mockNavigate).toHaveBeenCalledWith('/admin/content/posts');
      });
    });

    it('successfully updates existing post', async () => {
      (DatabaseService.updatePost as jest.Mock).mockResolvedValue(mockPost);

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/post title/i)).toHaveValue('Test Post');
      });

      // Update title
      fireEvent.change(screen.getByPlaceholderText(/post title/i), {
        target: { value: 'Updated Post Title' }
      });

      // Submit form
      const submitButton = screen.getByText(/save post/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(DatabaseService.updatePost).toHaveBeenCalledWith('1', expect.objectContaining({
          title: 'Updated Post Title'
        }));
        expect(toast.success).toHaveBeenCalledWith('Post updated successfully');
      });
    });

    it('handles update failure', async () => {
      (DatabaseService.updatePost as jest.Mock).mockRejectedValue(new Error('Update failed'));

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/post title/i)).toHaveValue('Test Post');
      });

      const submitButton = screen.getByText(/save post/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save post');
      });
    });
  });

  describe('Image Handling', () => {
    it('handles featured image upload', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockImageUrl = 'https://example.com/test.png';
      
      (DatabaseService.uploadImage as jest.Mock).mockResolvedValue(mockImageUrl);

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      const fileInput = screen.getByLabelText(/upload image/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(DatabaseService.uploadImage).toHaveBeenCalledWith(mockFile);
        expect(toast.success).toHaveBeenCalledWith('Image uploaded successfully');
      });
    });

    it('handles image upload failure', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      (DatabaseService.uploadImage as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      const fileInput = screen.getByLabelText(/upload image/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload image');
      });
    });
  });

  describe('SEO Features', () => {
    it('validates meta description length', async () => {
      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      const metaDescription = screen.getByPlaceholderText(/brief description for search engines/i);
      fireEvent.change(metaDescription, {
        target: { value: 'a'.repeat(161) } // Exceeds 160 character limit
      });

      const submitButton = screen.getByText(/save post/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/meta description should not exceed 160 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-save Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('auto-saves changes after inactivity', async () => {
      (useParams as jest.Mock).mockReturnValue({ id: '1' });
      (DatabaseService.updatePost as jest.Mock).mockResolvedValue(mockPost);

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/post title/i)).toHaveValue('Test Post');
      });

      // Make changes
      fireEvent.change(screen.getByPlaceholderText(/post title/i), {
        target: { value: 'Updated Title' }
      });

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(DatabaseService.updatePost).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Draft saved', { id: 'auto-save' });
      });
    });

    it('handles auto-save failure', async () => {
      (useParams as jest.Mock).mockReturnValue({ id: '1' });
      (DatabaseService.updatePost as jest.Mock).mockRejectedValue(new Error('Auto-save failed'));

      render(
        <BrowserRouter>
          <PostEditor />
        </BrowserRouter>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/post title/i)).toHaveValue('Test Post');
      });

      // Make changes
      fireEvent.change(screen.getByPlaceholderText(/post title/i), {
        target: { value: 'Updated Title' }
      });

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save draft', { id: 'auto-save' });
      });
    });
  });
});
