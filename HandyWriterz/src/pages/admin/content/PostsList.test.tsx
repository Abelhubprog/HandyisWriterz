import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PostsList from './PostsList';
import DatabaseService from '@/services/databaseService';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/types/admin';

// Mock dependencies
jest.mock('@/services/databaseService');
jest.mock('@/hooks/useAuth');
jest.mock('react-hot-toast');
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn()
    })),
    removeChannel: jest.fn()
  }
}));

// Mock data
const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Test Post 1',
    slug: 'test-post-1',
    content: 'Test content 1',
    status: 'published',
    author: {
      id: 'author1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar1.jpg'
    },
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
    tags: []
  },
  {
    id: '2',
    title: 'Test Post 2',
    slug: 'test-post-2',
    content: 'Test content 2',
    status: 'draft',
    author: {
      id: 'author2',
      name: 'Jane Smith',
      avatar: 'https://example.com/avatar2.jpg'
    },
    createdAt: '2025-03-02T00:00:00Z',
    updatedAt: '2025-03-02T00:00:00Z',
    tags: []
  }
];

describe('PostsList Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock auth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', role: 'admin' },
      isAdmin: true
    });
    
    // Mock database service
    (DatabaseService.fetchPosts as jest.Mock).mockResolvedValue({
      data: mockPosts,
      total: mockPosts.length
    });
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders posts after loading', async () => {
    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText(/search posts/i);
    fireEvent.change(searchInput, { target: { value: 'Test Post 1' } });

    // Verify database service was called with search term
    await waitFor(() => {
      expect(DatabaseService.fetchPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Test Post 1'
        })
      );
    });
  });

  it('handles status filter', async () => {
    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Change status filter
    const statusFilter = screen.getByRole('combobox');
    fireEvent.change(statusFilter, { target: { value: 'published' } });

    // Verify database service was called with status filter
    await waitFor(() => {
      expect(DatabaseService.fetchPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published'
        })
      );
    });
  });

  it('handles post deletion', async () => {
    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, 'confirm');
    mockConfirm.mockImplementation(jest.fn(() => true));

    // Mock successful deletion
    (DatabaseService.deletePost as jest.Mock).mockResolvedValue(true);

    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Click delete button for first post
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    // Verify confirmation was shown
    expect(mockConfirm).toHaveBeenCalled();

    // Verify deletion was called
    await waitFor(() => {
      expect(DatabaseService.deletePost).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Post deleted successfully');
    });

    // Cleanup
    mockConfirm.mockRestore();
  });

  it('handles deletion cancellation', async () => {
    // Mock window.confirm to return false
    const mockConfirm = jest.spyOn(window, 'confirm');
    mockConfirm.mockImplementation(jest.fn(() => false));

    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    // Verify deletion was not called
    expect(DatabaseService.deletePost).not.toHaveBeenCalled();

    // Cleanup
    mockConfirm.mockRestore();
  });

  it('handles deletion error', async () => {
    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, 'confirm');
    mockConfirm.mockImplementation(jest.fn(() => true));

    // Mock failed deletion
    (DatabaseService.deletePost as jest.Mock).mockRejectedValue(new Error('Failed to delete'));

    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    // Verify error toast was shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete post');
    });

    // Cleanup
    mockConfirm.mockRestore();
  });

  it('handles empty state', async () => {
    // Mock empty posts response
    (DatabaseService.fetchPosts as jest.Mock).mockResolvedValue({
      data: [],
      total: 0
    });

    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
      expect(screen.getByText(/get started by creating your first post/i)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    // Mock fetch error
    (DatabaseService.fetchPosts as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load posts. Please try again.');
    });
  });

  it('handles sorting', async () => {
    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Click title header to sort
    const titleHeader = screen.getByText(/title/i);
    fireEvent.click(titleHeader);

    // Verify sort was called
    await waitFor(() => {
      expect(DatabaseService.fetchPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'title',
          sortDirection: 'asc'
        })
      );
    });

    // Click again to reverse sort
    fireEvent.click(titleHeader);

    await waitFor(() => {
      expect(DatabaseService.fetchPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'title',
          sortDirection: 'desc'
        })
      );
    });
  });

  it('handles pagination', async () => {
    // Mock paginated response
    (DatabaseService.fetchPosts as jest.Mock).mockResolvedValue({
      data: mockPosts,
      total: 20 // 2 pages with 10 items per page
    });

    render(
      <BrowserRouter>
        <PostsList />
      </BrowserRouter>
    );

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByLabelText(/next page/i);
    fireEvent.click(nextButton);

    // Verify page change
    await waitFor(() => {
      expect(DatabaseService.fetchPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });
  });
});
