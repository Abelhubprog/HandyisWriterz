/**
 * Appwrite Database Demo Page
 * 
 * This page demonstrates how to use Appwrite database with our model repositories.
 * 
 * @file src/pages/admin/database-demo.tsx
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PostRepository, PostStatus, Post } from '@/models/Post';
import { UserRepository, UserRole, User } from '@/models/User';
import { toast, Toaster } from 'react-hot-toast';

// Demo post data
const samplePost = {
  title: 'Sample Post',
  slug: 'sample-post',
  content: 'This is a sample post created with Appwrite database.',
  excerpt: 'A short excerpt for the sample post.',
  status: PostStatus.DRAFT,
  authorId: 'current-user-id', // Will be replaced with actual user ID
};

// Demo user data
const sampleUser = {
  email: 'demo@handywriterz.com',
  name: 'Demo User',
  role: UserRole.EDITOR,
  bio: 'This is a demo user for testing Appwrite database integration.',
  isActive: true,
};

const DatabaseDemo: React.FC = () => {
  // State for posts and users
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState({
    posts: false,
    users: false,
    createPost: false,
    createUser: false,
  });
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load posts and users on component mount
  useEffect(() => {
    loadPosts();
    loadUsers();
  }, []);

  // Load posts from database
  const loadPosts = async () => {
    try {
      setLoading(prev => ({ ...prev, posts: true }));
      const result = await PostRepository.list(1, 10);
      setPosts(result.posts);
      toast.success(`Loaded ${result.posts.length} posts`);
    } catch (error) {
      toast.error(`Failed to load posts: ${(error as Error).message}`);
      console.error('Error loading posts:', error);
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  // Load users from database
  const loadUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const result = await UserRepository.list(1, 10);
      setUsers(result.users);
      toast.success(`Loaded ${result.users.length} users`);
    } catch (error) {
      toast.error(`Failed to load users: ${(error as Error).message}`);
      console.error('Error loading users:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Create a sample post
  const createSamplePost = async () => {
    try {
      setLoading(prev => ({ ...prev, createPost: true }));
      
      // Use the first user's ID as author if available
      const authorId = users.length > 0 ? users[0].$id : 'default-user';
      
      // Generate a unique title with timestamp
      const title = `${samplePost.title} - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
      
      // Generate a slug from the title
      const slug = await PostRepository.generateSlug(title);
      
      const post = await PostRepository.create({
        ...samplePost,
        title,
        slug,
        authorId,
      });
      
      setCurrentPost(post);
      setPosts(prev => [post, ...prev]);
      toast.success('Sample post created successfully');
    } catch (error) {
      toast.error(`Failed to create post: ${(error as Error).message}`);
      console.error('Error creating post:', error);
    } finally {
      setLoading(prev => ({ ...prev, createPost: false }));
    }
  };

  // Create a sample user
  const createSampleUser = async () => {
    try {
      setLoading(prev => ({ ...prev, createUser: true }));
      
      // Generate a unique email with timestamp
      const email = `demo-${Date.now()}@handywriterz.com`;
      
      const user = await UserRepository.create({
        ...sampleUser,
        email,
        name: `Demo User ${Date.now().toString().slice(-4)}`,
      });
      
      setCurrentUser(user);
      setUsers(prev => [user, ...prev]);
      toast.success('Sample user created successfully');
    } catch (error) {
      toast.error(`Failed to create user: ${(error as Error).message}`);
      console.error('Error creating user:', error);
    } finally {
      setLoading(prev => ({ ...prev, createUser: false }));
    }
  };

  // Publish a post
  const publishPost = async (post: Post) => {
    try {
      const updatedPost = await PostRepository.publish(post.$id);
      toast.success('Post published successfully');
      
      // Update posts list
      setPosts(prev => prev.map(p => p.$id === updatedPost.$id ? updatedPost : p));
      if (currentPost?.$id === updatedPost.$id) {
        setCurrentPost(updatedPost);
      }
    } catch (error) {
      toast.error(`Failed to publish post: ${(error as Error).message}`);
      console.error('Error publishing post:', error);
    }
  };

  // Delete a post
  const deletePost = async (post: Post) => {
    try {
      await PostRepository.delete(post.$id);
      toast.success('Post deleted successfully');
      
      // Update posts list
      setPosts(prev => prev.filter(p => p.$id !== post.$id));
      if (currentPost?.$id === post.$id) {
        setCurrentPost(null);
      }
    } catch (error) {
      toast.error(`Failed to delete post: ${(error as Error).message}`);
      console.error('Error deleting post:', error);
    }
  };

  // Deactivate a user
  const deactivateUser = async (user: User) => {
    try {
      const updatedUser = await UserRepository.deactivate(user.$id);
      toast.success('User deactivated successfully');
      
      // Update users list
      setUsers(prev => prev.map(u => u.$id === updatedUser.$id ? updatedUser : u));
      if (currentUser?.$id === updatedUser.$id) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      toast.error(`Failed to deactivate user: ${(error as Error).message}`);
      console.error('Error deactivating user:', error);
    }
  };

  // Delete a user
  const deleteUser = async (user: User) => {
    try {
      await UserRepository.delete(user.$id);
      toast.success('User deleted successfully');
      
      // Update users list
      setUsers(prev => prev.filter(u => u.$id !== user.$id));
      if (currentUser?.$id === user.$id) {
        setCurrentUser(null);
      }
    } catch (error) {
      toast.error(`Failed to delete user: ${(error as Error).message}`);
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Helmet>
        <title>Appwrite Database Demo | HandyWriterz Admin</title>
      </Helmet>
      
      <Toaster position="top-right" />
      
      <h1 className="text-3xl font-bold mb-8 text-center">
        Appwrite Database Demo
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Posts Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Posts</h2>
            <div className="flex space-x-2">
              <button
                onClick={loadPosts}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                disabled={loading.posts}
              >
                {loading.posts ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={createSamplePost}
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                disabled={loading.createPost}
              >
                {loading.createPost ? 'Creating...' : 'Create Sample'}
              </button>
            </div>
          </div>
          
          {posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No posts available. Create a sample post to get started.
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {posts.map(post => (
                <div 
                  key={post.$id} 
                  className="border p-4 rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => setCurrentPost(post)}
                >
                  <h3 className="font-medium">{post.title}</h3>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className={`px-2 py-0.5 rounded ${
                      post.status === PostStatus.PUBLISHED 
                        ? 'bg-green-100 text-green-800' 
                        : post.status === PostStatus.ARCHIVED 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                    <div className="space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          publishPost(post);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={post.status === PostStatus.PUBLISHED}
                      >
                        Publish
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePost(post);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Users Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Users</h2>
            <div className="flex space-x-2">
              <button
                onClick={loadUsers}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                disabled={loading.users}
              >
                {loading.users ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={createSampleUser}
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                disabled={loading.createUser}
              >
                {loading.createUser ? 'Creating...' : 'Create Sample'}
              </button>
            </div>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users available. Create a sample user to get started.
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {users.map(user => (
                <div 
                  key={user.$id} 
                  className="border p-4 rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => setCurrentUser(user)}
                >
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <div className="flex space-x-2">
                      <span className={`px-2 py-0.5 rounded ${
                        user.role === UserRole.ADMIN 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === UserRole.EDITOR 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deactivateUser(user);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                        disabled={!user.isActive}
                      >
                        Deactivate
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteUser(user);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Selected Item Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Selected Post */}
        {currentPost && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Selected Post Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">ID:</span> 
                <span className="ml-2 font-mono text-sm">{currentPost.$id}</span>
              </div>
              <div>
                <span className="font-medium">Title:</span> 
                <span className="ml-2">{currentPost.title}</span>
              </div>
              <div>
                <span className="font-medium">Slug:</span> 
                <span className="ml-2">{currentPost.slug}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded ${
                  currentPost.status === PostStatus.PUBLISHED 
                    ? 'bg-green-100 text-green-800' 
                    : currentPost.status === PostStatus.ARCHIVED 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentPost.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Author ID:</span> 
                <span className="ml-2 font-mono text-sm">{currentPost.authorId}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span> 
                <span className="ml-2">{new Date(currentPost.$createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">Updated:</span> 
                <span className="ml-2">{new Date(currentPost.$updatedAt).toLocaleString()}</span>
              </div>
              {currentPost.publishedAt && (
                <div>
                  <span className="font-medium">Published:</span> 
                  <span className="ml-2">{new Date(currentPost.publishedAt).toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Content:</span> 
                <p className="mt-1 border p-2 rounded bg-gray-50">{currentPost.content}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Selected User */}
        {currentUser && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Selected User Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">ID:</span> 
                <span className="ml-2 font-mono text-sm">{currentUser.$id}</span>
              </div>
              <div>
                <span className="font-medium">Name:</span> 
                <span className="ml-2">{currentUser.name}</span>
              </div>
              <div>
                <span className="font-medium">Email:</span> 
                <span className="ml-2">{currentUser.email}</span>
              </div>
              <div>
                <span className="font-medium">Role:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded ${
                  currentUser.role === UserRole.ADMIN 
                    ? 'bg-purple-100 text-purple-800' 
                    : currentUser.role === UserRole.EDITOR 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded ${
                  currentUser.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="font-medium">Created:</span> 
                <span className="ml-2">{new Date(currentUser.$createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">Updated:</span> 
                <span className="ml-2">{new Date(currentUser.$updatedAt).toLocaleString()}</span>
              </div>
              {currentUser.lastLogin && (
                <div>
                  <span className="font-medium">Last Login:</span> 
                  <span className="ml-2">{new Date(currentUser.lastLogin).toLocaleString()}</span>
                </div>
              )}
              {currentUser.bio && (
                <div>
                  <span className="font-medium">Bio:</span> 
                  <p className="mt-1 border p-2 rounded bg-gray-50">{currentUser.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Documentation */}
      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Appwrite Database Integration</h2>
        <p className="text-gray-700 mb-4">
          This page demonstrates the integration of Appwrite database with repository pattern for Posts and Users.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-medium text-lg mb-2">Post Repository Functions:</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.create(data)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.getById(id)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.getBySlug(slug)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.list(page, limit, ...filters)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.update(id, data)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.delete(id)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.publish(id)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.unpublish(id)</code></li>
              <li><code className="bg-blue-100 px-1.5 py-0.5 rounded">PostRepository.archive(id)</code></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">User Repository Functions:</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.create(data)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.getById(id)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.getByEmail(email)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.list(page, limit, ...filters)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.update(id, data)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.delete(id)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.activate(id)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.deactivate(id)</code></li>
              <li><code className="bg-purple-100 px-1.5 py-0.5 rounded">UserRepository.changeRole(id, role)</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDemo; 