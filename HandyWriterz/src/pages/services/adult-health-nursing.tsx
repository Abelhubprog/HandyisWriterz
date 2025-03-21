import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar, 
  Clock, 
  ChevronDown,
  ChevronRight,
  ArrowRight,
  X,
  ThumbsUp,
  Send,
  User,
  BookOpen,
  Tag,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { serviceConfigs } from '@/types/posts';
import { Post, Category, Comment } from '@/types/posts';

const AdultHealthNursing: React.FC = () => {
  // States
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [isCommentLoading, setIsCommentLoading] = useState<boolean>(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);

  // Refs
  const infiniteScrollRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Auth
  const { user } = useAuth();
  
  // Service details from config
  const serviceConfig = serviceConfigs['adult-health-nursing'];
  const { serviceName, serviceType, serviceColor, serviceColorClass, serviceBgColor, serviceDescription } = serviceConfig;

  // Fetch posts
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch posts from Appwrite
        const postsResponse = await supabase.from('posts').select('*').eq('serviceType', serviceType).eq('status', 'published').order('createdAt', { ascending: false }).limit(10);
        
        // Fetch featured posts
        const featuredResponse = await supabase.from('posts').select('*').eq('serviceType', serviceType).eq('status', 'published').order('viewsCount', { ascending: false }).limit(3);
        
        // Fetch categories
        const categoriesResponse = await supabase.from('categories').select('*').eq('serviceType', serviceType);
        
        // Format posts for display
        const formattedPosts = await Promise.all(
          postsResponse.data.map(async (post) => {
            // Get author profile
            let author = {
              id: 'unknown',
              name: 'Unknown Author',
              avatar: '/placeholder-avatar.png',
              role: 'user'
            };
            
            try {
              const authorResponse = await supabase.from('profiles').select('*').eq('id', post.authorId).single();
              
              author = {
                id: authorResponse.id,
                name: authorResponse.fullName || 'Anonymous',
                avatar: authorResponse.avatarUrl || '/placeholder-avatar.png',
                role: authorResponse.role || 'user'
              };
            } catch (error) {
              console.error('Error fetching author:', error);
            }
            
            return {
              id: post.id,
              title: post.title,
              slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
              excerpt: post.excerpt || '',
              content: post.content,
              author,
              category: post.category,
              tags: post.tags || [],
              publishedAt: post.publishedAt,
              readTime: Math.ceil(post.content.split(' ').length / 200), // Estimate read time
              featuredImage: post.coverImage || '/placeholder-image.jpg',
              likes: post.likesCount || 0,
              comments: post.commentsCount || 0,
              userHasLiked: false // Will be updated later if user is logged in
            };
          })
        );
        
        // Format featured posts
        const formattedFeatured = await Promise.all(
          featuredResponse.data.map(async (post) => {
            // Get author profile
            let author = {
              id: 'unknown',
              name: 'Unknown Author',
              avatar: '/placeholder-avatar.png',
              role: 'user'
            };
            
            try {
              const authorResponse = await supabase.from('profiles').select('*').eq('id', post.authorId).single();
              
              author = {
                id: authorResponse.id,
                name: authorResponse.fullName || 'Anonymous',
                avatar: authorResponse.avatarUrl || '/placeholder-avatar.png',
                role: authorResponse.role || 'user'
              };
            } catch (error) {
              console.error('Error fetching author:', error);
            }
            
            return {
              id: post.id,
              title: post.title,
              slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
              excerpt: post.excerpt || '',
              content: post.content,
              author,
              category: post.category,
              tags: post.tags || [],
              publishedAt: post.publishedAt,
              readTime: Math.ceil(post.content.split(' ').length / 200),
              featuredImage: post.coverImage || '/placeholder-image.jpg',
              likes: post.likesCount || 0,
              comments: post.commentsCount || 0,
              userHasLiked: false
            };
          })
        );
        
        // Format categories
        const formattedCategories = categoriesResponse.data.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          count: category.postCount || 0
        }));
        
        // Get popular tags from posts
        const allTags: string[] = postsResponse.data.flatMap(post => post.tags || []);
        const tagCounts: Record<string, number> = {};
        
        allTags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
        
        const sortedTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);
        
        // If user is logged in, check if they liked any of the posts
        if (user) {
          const userLikesResponse = await supabase.from('likes').select('*').eq('userId', user.id);
          
          if (userLikesResponse.data.length > 0) {
            const likedPostIds = new Set(userLikesResponse.data.map(like => like.postId));
            
            // Update liked status for posts
            const updatedPosts = formattedPosts.map(post => ({
              ...post,
              userHasLiked: likedPostIds.has(post.id)
            }));
            
            // Update liked status for featured posts
            const updatedFeatured = formattedFeatured.map(post => ({
              ...post,
              userHasLiked: likedPostIds.has(post.id)
            }));
            
            setPosts(updatedPosts);
            setFeaturedPosts(updatedFeatured);
          } else {
            setPosts(formattedPosts);
            setFeaturedPosts(formattedFeatured);
          }
        } else {
          setPosts(formattedPosts);
          setFeaturedPosts(formattedFeatured);
        }
        
        setCategories(formattedCategories);
        setPopularTags(sortedTags);
        setHasMore(postsResponse.data.length === 10);
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Fallback to mock data for development purposes
        const mockPosts: Post[] = Array(10).fill(null).map((_, index) => ({
          id: `post-${index + 1}`,
          title: [
            "Evidence-Based Practice in Adult Nursing: A Comprehensive Guide",
            "Managing Chronic Conditions in Adult Patients: Latest Approaches",
            "Cardiovascular Care Advances: What Every Nurse Should Know",
            "Diabetes Management Protocols for Adult Health Nurses",
            "Pain Management Strategies in Adult Healthcare Settings"
          ][Math.floor(Math.random() * 5)],
          slug: `adult-nursing-post-${index + 1}`,
          excerpt: "This comprehensive guide explores the latest research and best practices in adult health nursing, providing actionable insights for nursing professionals to enhance patient care outcomes.",
          content: `<p>Adult health nursing requires a comprehensive understanding of both theoretical principles and practical applications. This article explores the evidence-based approaches that have been proven most effective in clinical settings.</p>`,
          author: {
            id: "author-1",
            name: "Dr. Sarah Johnson",
            avatar: "/avatars/sarah.jpg",
            role: "Senior Nursing Consultant"
          },
          category: ["Clinical Practice", "Research", "Education", "Management", "Ethics"][Math.floor(Math.random() * 5)],
          tags: ["evidence-based", "nursing", "adult-health", "clinical-skills"],
          publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          readTime: Math.floor(Math.random() * 20) + 5,
          featuredImage: `/images/nursing-${index + 1}.jpg`,
          likes: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 10),
          userHasLiked: false
        }));
        
        setPosts(mockPosts);
        setFeaturedPosts(mockPosts.slice(0, 3));
        setCategories([
          { id: "cat-1", name: "Clinical Practice", slug: "clinical-practice", count: 12 },
          { id: "cat-2", name: "Research", slug: "research", count: 8 },
          { id: "cat-3", name: "Education", slug: "education", count: 10 },
          { id: "cat-4", name: "Management", slug: "management", count: 6 },
          { id: "cat-5", name: "Ethics", slug: "ethics", count: 4 }
        ]);
        setPopularTags(["evidence-based", "nursing", "adult-health", "clinical-skills", "research"]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user, serviceType]);

  // Handle post selection
  const handlePostSelect = async (post: Post) => {
    try {
      setSelectedPost(post);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Record view in database if not the post author
      if (user && user.id !== post.author.id) {
        await supabase.from('views').insert({
            postId: post.id,
            userId: user.id,
            viewedAt: new Date().toISOString()
        });
      } else if (!user) {
        // Anonymous view
        await supabase.from('views').insert({
            postId: post.id,
            viewedAt: new Date().toISOString()
        });
      }
      
      // Fetch comments for the post
      const commentsResponse = await supabase.from('comments').select('*').eq('postId', post.id).order('createdAt');
      
      // Format comments
      const formattedComments = await Promise.all(
        commentsResponse.data.map(async (comment) => {
          // Get author profile
          let author = {
            id: 'unknown',
            name: 'Unknown Author',
            avatar: '/placeholder-avatar.png'
          };
          
          try {
            const authorResponse = await supabase.from('profiles').select('*').eq('id', comment.authorId).single();
            
            author = {
              id: authorResponse.id,
              name: authorResponse.fullName || 'Anonymous',
              avatar: authorResponse.avatarUrl || '/placeholder-avatar.png'
            };
          } catch (error) {
            console.error('Error fetching comment author:', error);
          }
          
          return {
            id: comment.id,
            postId: post.id,
            author,
            content: comment.content,
            createdAt: comment.createdAt,
            likes: comment.likesCount || 0,
            userHasLiked: false
          };
        })
      );
      
      setComments(formattedComments);
      
      // Fetch related posts (same category)
      const relatedResponse = await supabase.from('posts').select('*').eq('serviceType', serviceType).eq('status', 'published').eq('category', post.category).neq('id', post.id).limit(3);
      
      // Format related posts
      const formattedRelated = await Promise.all(
        relatedResponse.data.map(async (relatedPost) => {
          // Get author profile
          let author = {
            id: 'unknown',
            name: 'Unknown Author',
            avatar: '/placeholder-avatar.png',
            role: 'user'
          };
          
          try {
            const authorResponse = await supabase.from('profiles').select('*').eq('id', relatedPost.authorId).single();
            
            author = {
              id: authorResponse.id,
              name: authorResponse.fullName || 'Anonymous',
              avatar: authorResponse.avatarUrl || '/placeholder-avatar.png',
              role: authorResponse.role || 'user'
            };
          } catch (error) {
            console.error('Error fetching related post author:', error);
          }
          
          return {
            id: relatedPost.id,
            title: relatedPost.title,
            slug: relatedPost.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
            excerpt: relatedPost.excerpt || '',
            content: relatedPost.content,
            author,
            category: relatedPost.category,
            tags: relatedPost.tags || [],
            publishedAt: relatedPost.publishedAt,
            readTime: Math.ceil(relatedPost.content.split(' ').length / 200),
            featuredImage: relatedPost.coverImage || '/placeholder-image.jpg',
            likes: relatedPost.likesCount || 0,
            comments: relatedPost.commentsCount || 0,
            userHasLiked: false
          };
        })
      );
      
      // If user is logged in, check if they liked any of the related posts
      if (user && formattedRelated.length > 0) {
        const relatedPostIds = formattedRelated.map(post => post.id);
        
        const userLikesResponse = await supabase.from('likes').select('*').eq('userId', user.id).eq('postId', relatedPostIds);
        
        if (userLikesResponse.data.length > 0) {
          const likedPostIds = new Set(userLikesResponse.data.map(like => like.postId));
          
          const updatedRelated = formattedRelated.map(post => ({
            ...post,
            userHasLiked: likedPostIds.has(post.id)
          }));
          
          setRelatedPosts(updatedRelated);
        } else {
          setRelatedPosts(formattedRelated);
        }
      } else {
        setRelatedPosts(formattedRelated);
      }
    } catch (error) {
      console.error('Error handling post selection:', error);
      
      // Fallback to mock data if there's an error
      setComments([{
        id: 'comment-1',
        postId: post.id,
        author: {
          id: 'user-1',
          name: 'John Smith',
          avatar: '/avatars/john.jpg',
        },
        content: 'This is a really insightful article. Thank you for sharing this knowledge.',
        createdAt: new Date().toISOString(),
        likes: 2,
        userHasLiked: false
      }]);
      
      setRelatedPosts([{
        id: 'related-1',
        title: 'Related Post: Nursing Interventions for Chronic Pain',
        slug: 'related-nursing-interventions',
        excerpt: 'Learn about effective nursing interventions for patients experiencing chronic pain.',
        content: 'Detailed content about nursing interventions...',
        author: {
          id: 'author-2',
          name: 'Dr. Emily Chen',
          avatar: '/avatars/emily.jpg',
          role: 'Pain Management Specialist'
        },
        category: post.category,
        tags: ['pain-management', 'nursing', 'interventions'],
        publishedAt: new Date().toISOString(),
        readTime: 8,
        featuredImage: '/images/related-1.jpg',
        likes: 15,
        comments: 3,
        userHasLiked: false
      }]);
    }
  };

  // Load more posts (infinite scroll)
  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const nextPage = page + 1;
      
      // Apply category filter if not "all"
      let whereClause = {
        serviceType,
        status: 'published'
      };
      
      if (activeCategory !== 'all') {
        whereClause.category = activeCategory;
      }
      
      const postsResponse = await supabase
        .from('posts')
        .select('*')
        .eq('serviceType', serviceType)
        .eq('status', 'published')
        .order('createdAt', { ascending: false })
        .limit(10)
        .range((nextPage - 1) * 10, nextPage * 10 - 1);
      
      // Format posts
      const formattedPosts = await Promise.all(
        postsResponse.data.map(async (post) => {
          // Get author profile
          let author = {
            id: 'unknown',
            name: 'Unknown Author',
            avatar: '/placeholder-avatar.png',
            role: 'user'
          };
          
          try {
            const authorResponse = await supabase.from('profiles').select('*').eq('id', post.authorId).single();
            
            author = {
              id: authorResponse.id,
              name: authorResponse.fullName || 'Anonymous',
              avatar: authorResponse.avatarUrl || '/placeholder-avatar.png',
              role: authorResponse.role || 'user'
            };
          } catch (error) {
            console.error('Error fetching author:', error);
          }
          
          return {
            id: post.id,
            title: post.title,
            slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
            excerpt: post.excerpt || '',
            content: post.content,
            author,
            category: post.category,
            tags: post.tags || [],
            publishedAt: post.publishedAt,
            readTime: Math.ceil(post.content.split(' ').length / 200),
            featuredImage: post.coverImage || '/placeholder-image.jpg',
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
            userHasLiked: false
          };
        })
      );
      
      // If user is logged in, check if they liked any of the posts
      if (user && formattedPosts.length > 0) {
        const postIds = formattedPosts.map(post => post.id);
        
        const userLikesResponse = await supabase.from('likes').select('*').eq('userId', user.id).eq('postId', postIds);
        
        if (userLikesResponse.data.length > 0) {
          const likedPostIds = new Set(userLikesResponse.data.map(like => like.postId));
          
          // Update liked status for posts
          const updatedPosts = formattedPosts.map(post => ({
            ...post,
            userHasLiked: likedPostIds.has(post.id)
          }));
          
          setPosts(prevPosts => [...prevPosts, ...updatedPosts]);
        } else {
          setPosts(prevPosts => [...prevPosts, ...formattedPosts]);
        }
      } else {
        setPosts(prevPosts => [...prevPosts, ...formattedPosts]);
      }
      
      setPage(nextPage);
      setHasMore(postsResponse.data.length === 10);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle like post
  const handleLikePost = async (postId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      // Check if user already liked the post
      const likeResponse = await supabase.from('likes').select('*').eq('postId', postId).eq('userId', user.id);

      if (likeResponse.data.length > 0) {
        // Unlike the post
        await supabase.from('likes').delete().eq('id', likeResponse.data[0].id);

        // Update posts state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes - 1, userHasLiked: false }
              : post
          )
        );

        // Update featured posts if needed
        setFeaturedPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes - 1, userHasLiked: false }
              : post
          )
        );

        // Update selected post if needed
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({
            ...selectedPost,
            likes: selectedPost.likes - 1,
            userHasLiked: false
          });
        }
        
        // Update related posts if needed
        setRelatedPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes - 1, userHasLiked: false }
              : post
          )
        );
      } else {
        // Like the post
        await supabase.from('likes').insert({
            postId,
            userId: user.id,
            createdAt: new Date().toISOString()
        });

        // Update posts state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes + 1, userHasLiked: true }
              : post
          )
        );

        // Update featured posts if needed
        setFeaturedPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes + 1, userHasLiked: true }
              : post
          )
        );

        // Update selected post if needed
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({
            ...selectedPost,
            likes: selectedPost.likes + 1,
            userHasLiked: true
          });
        }
        
        // Update related posts if needed
        setRelatedPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes + 1, userHasLiked: true }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error handling post like:', error);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!selectedPost || !newComment.trim()) return;

    setIsCommentLoading(true);

    try {
      // Insert comment into database
      const commentResponse = await supabase.from('comments').insert({
          postId: selectedPost.id,
          authorId: user.id,
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
          likesCount: 0
      });

      // Format the new comment
      const formattedComment: Comment = {
        id: commentResponse.data[0].id,
        postId: selectedPost.id,
        author: {
          id: user.id,
          name: user.name || 'Anonymous',
          avatar: user.avatarUrl || '/placeholder-avatar.png',
        },
        content: commentResponse.data[0].content,
        createdAt: commentResponse.data[0].createdAt,
        likes: 0,
        userHasLiked: false
      };

      // Add comment to state
      setComments(prevComments => [...prevComments, formattedComment]);

      // Update comment count on the selected post
      setSelectedPost({
        ...selectedPost,
        comments: selectedPost.comments + 1
      });

      // Update comment count in posts list
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === selectedPost.id
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      );
      
      // Update comment count in featured posts if needed
      setFeaturedPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === selectedPost.id
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      );
      
      // Update comment count in related posts if needed
      setRelatedPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === selectedPost.id
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      );

      // Clear the comment input
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsCommentLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset to first page
    setPage(1);
    
    // Reload posts with search filter
    fetchSearchResults();
  };
  
  // Search for posts
  const fetchSearchResults = async () => {
    setIsLoading(true);
    
    try {
      let whereClause = {
        serviceType,
        status: 'published'
      };
      
      if (searchQuery.trim()) {
        // Note: Supabase doesn't have direct text search like Appwrite
        // Using ilike for basic text matching
        const postsResponse = await supabase
          .from('posts')
          .select('*')
          .eq('serviceType', serviceType)
          .eq('status', 'published')
          .ilike('title', `%${searchQuery}%`)
          .order('createdAt', { ascending: false })
          .limit(10);
      } else {
        const postsResponse = await supabase
          .from('posts')
          .select('*')
          .eq('serviceType', serviceType)
          .eq('status', 'published')
          .order('createdAt', { ascending: false })
          .limit(10);
      }
      
      // Format posts
      const formattedPosts = await Promise.all(
        postsResponse.data.map(async (post) => {
          // Get author profile
          let author = {
            id: 'unknown',
            name: 'Unknown Author',
            avatar: '/placeholder-avatar.png',
            role: 'user'
          };
          
          try {
            const authorResponse = await supabase.from('profiles').select('*').eq('id', post.authorId).single();
            
            author = {
              id: authorResponse.id,
              name: authorResponse.fullName || 'Anonymous',
              avatar: authorResponse.avatarUrl || '/placeholder-avatar.png',
              role: authorResponse.role || 'user'
            };
          } catch (error) {
            console.error('Error fetching author:', error);
          }
          
          return {
            id: post.id,
            title: post.title,
            slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
            excerpt: post.excerpt || '',
            content: post.content,
            author,
            category: post.category,
            tags: post.tags || [],
            publishedAt: post.publishedAt,
            readTime: Math.ceil(post.content.split(' ').length / 200),
            featuredImage: post.coverImage || '/placeholder-image.jpg',
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
            userHasLiked: false
          };
        })
      );
      
      if (user && formattedPosts.length > 0) {
        const postIds = formattedPosts.map(post => post.id);
        
        const userLikesResponse = await supabase.from('likes').select('*').eq('userId', user.id).eq('postId', postIds);
        
        if (userLikesResponse.data.length > 0) {
          const likedPostIds = new Set(userLikesResponse.data.map(like => like.postId));
          
          // Update liked status for posts
          const updatedPosts = formattedPosts.map(post => ({
            ...post,
            userHasLiked: likedPostIds.has(post.id)
          }));
          
          setPosts(updatedPosts);
        } else {
          setPosts(formattedPosts);
        }
      } else {
        setPosts(formattedPosts);
      }
      
      setHasMore(postsResponse.data.length === 10);
      setIsSearchOpen(false);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Change active category
  const handleCategoryChange = (category: string) => {
    if (category === activeCategory) return;
    
    setActiveCategory(category);
    setPage(1);
    setSelectedPost(null);
    
    // Fetch posts for the selected category
    const fetchCategoryPosts = async () => {
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('posts')
          .select('*')
          .eq('serviceType', serviceType)
          .eq('status', 'published');
        
        if (category !== 'all') {
          query = query.eq('category', category);
        }
        
        if (searchQuery.trim()) {
          query = query.ilike('title', `%${searchQuery}%`);
        }
        
        const postsResponse = await query
          .order('createdAt', { ascending: false })
          .limit(10);
        
        // Format posts
        const formattedPosts = await Promise.all(
          postsResponse.data.map(async (post) => {
            // Get author profile
            let author = {
              id: 'unknown',
              name: 'Unknown Author',
              avatar: '/placeholder-avatar.png',
              role: 'user'
            };
            
            try {
              const authorResponse = await supabase.from('profiles').select('*').eq('id', post.authorId).single();
              
              author = {
                id: authorResponse.id,
                name: authorResponse.fullName || 'Anonymous',
                avatar: authorResponse.avatarUrl || '/placeholder-avatar.png',
                role: authorResponse.role || 'user'
              };
            } catch (error) {
              console.error('Error fetching author:', error);
            }
            
            return {
              id: post.id,
              title: post.title,
              slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
              excerpt: post.excerpt || '',
              content: post.content,
              author,
              category: post.category,
              tags: post.tags || [],
              publishedAt: post.publishedAt,
              readTime: Math.ceil(post.content.split(' ').length / 200),
              featuredImage: post.coverImage || '/placeholder-image.jpg',
              likes: post.likesCount || 0,
              comments: post.commentsCount || 0,
              userHasLiked: false
            };
          })
        );
        
        if (user && formattedPosts.length > 0) {
          const postIds = formattedPosts.map(post => post.id);
          
          const userLikesResponse = await supabase.from('likes').select('*').eq('userId', user.id).eq('postId', postIds);
          
          if (userLikesResponse.data.length > 0) {
            const likedPostIds = new Set(userLikesResponse.data.map(like => like.postId));
            
            // Update liked status for posts
            const updatedPosts = formattedPosts.map(post => ({
              ...post,
              userHasLiked: likedPostIds.has(post.id)
            }));
            
            setPosts(updatedPosts);
          } else {
            setPosts(formattedPosts);
          }
        } else {
          setPosts(formattedPosts);
        }
        
        setHasMore(postsResponse.data.length === 10);
        setShowCategories(false);
      } catch (error) {
        console.error('Error fetching category posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoryPosts();
  };

  // Handle liking a comment
  const handleLikeComment = (commentId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Update the UI optimistically (in a real app, would save to database)
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              likes: comment.userHasLiked ? comment.likes - 1 : comment.likes + 1,
              userHasLiked: !comment.userHasLiked
            }
          : comment
      )
    );
  };

  // Format date helper function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Publication date not set';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Back to posts list
  const handleBackToPosts = () => {
    setSelectedPost(null);
  };

  // Filter posts by category and search
  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'all' || post.category.toLowerCase().replace(/\s+/g, '-') === activeCategory;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Optimization */}
      <Helmet>
        <title>Adult Health Nursing Resources & Articles | HandyWriterz</title>
        <meta 
          name="description" 
          content="Explore our comprehensive adult health nursing resources, evidence-based articles, and expert insights to enhance your nursing knowledge and practice." 
        />
        <meta name="keywords" content="adult health nursing, nursing resources, evidence-based practice, nursing research, healthcare, patient care, nursing education" />
        <link rel="canonical" href="https://handywriterz.com/services/adult-health-nursing" />
      </Helmet>
      
      {/* Fixed Header for easy navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="mr-6">
                <div className="h-8 w-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold">
                  H
                </div>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">Home</Link>
                <Link to="/services" className="text-gray-600 hover:text-gray-900 font-medium">Services</Link>
                <Link to="/services/adult-health-nursing" className="text-red-600 font-medium">Adult Health Nursing</Link>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {user ? (
                <div className="flex items-center">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <Bell className="h-5 w-5" />
                  </button>
                  <img 
                    src={user.photoURL || `/api/placeholder/32/32`}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full ml-2 border border-gray-200"
                  />
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main>
        {/* Header Banner */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/90 to-red-700/90"></div>
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Adult Health Nursing</h1>
              <p className="text-xl text-white/90 mb-8">{serviceDescription}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => window.scrollTo({ top: document.querySelector('#featured-content')?.getBoundingClientRect().top! + window.scrollY - 100, behavior: 'smooth' })}
                  className="px-5 py-2.5 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Explore Articles
                </button>
                <Link 
                  to="/services/adult-health-nursing/categories" 
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {selectedPost ? (
          // Single Post View
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center text-sm text-gray-500">
                  <button onClick={handleBackToPosts} className="hover:text-red-600 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to all articles
                  </button>
                  <span className="mx-2">|</span>
                  <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Link to="/services" className="hover:text-red-600 transition-colors">Services</Link>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Link to="/services/adult-health-nursing" className="hover:text-red-600 transition-colors">Adult Health Nursing</Link>
                </div>
                
                {/* Post Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full">
                      {selectedPost.category}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(selectedPost.publishedAt)}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedPost.readTime} min read
                    </div>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold mb-6">
                    {selectedPost.title}
                  </h1>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={selectedPost.author.avatar} 
                      alt={selectedPost.author.name} 
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">{selectedPost.author.name}</div>
                      <div className="text-sm text-gray-500">{selectedPost.author.role}</div>
                    </div>
                  </div>
                </div>
                
                {/* Featured Image */}
                <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
                  {selectedPost.mediaType === 'video' ? (
                    <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      <img 
                        src={selectedPost.featuredImage} 
                        alt={selectedPost.title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                      />
                    </div>
                  ) : selectedPost.mediaType === 'audio' ? (
                    <div className="relative aspect-[4/1] bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center px-6">
                      <div className="absolute inset-0 opacity-20 bg-pattern-waveform"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white absolute left-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                      <div className="w-full max-w-xl">
                        <div className="h-16 bg-white/20 rounded-lg backdrop-blur-sm"></div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={selectedPost.featuredImage} 
                      alt={selectedPost.title} 
                      className="w-full h-auto"
                    />
                  )}
                </div>
                
                {/* Post Content */}
                <div className="prose prose-lg max-w-none mb-10" dangerouslySetInnerHTML={{ __html: selectedPost.content }}></div>
                
                {/* Tags */}
                <div className="mb-10">
                  <div className="text-sm font-medium mb-3">Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map(tag => (
                      <Link 
                        to={`/services/adult-health-nursing?tag=${tag}`} 
                        key={tag}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Engagement */}
                <div className="flex justify-between items-center border-t border-b border-gray-200 py-4 mb-10">
                  <div className="flex gap-6">
                    <button 
                      onClick={() => handleLikePost(selectedPost.id)}
                      className={`flex items-center gap-2 ${
                        selectedPost.userHasLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                      } transition-colors`}
                    >
                      <Heart className="h-5 w-5" fill={selectedPost.userHasLiked ? 'currentColor' : 'none'} />
                      <span>{selectedPost.likes}</span>
                    </button>
                    <button 
                      onClick={() => commentInputRef.current?.focus()}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>{comments.length}</span>
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        // Show toast notification in a real app
                      }}
                      className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
                  
                  {/* Comment Form */}
                  <div className="flex gap-4 mb-8">
                    <div className="flex-shrink-0">
                      <img 
                        src={user?.photoURL || `/api/placeholder/40/40`} 
                        alt={user?.displayName || 'User'} 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <textarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "Add a comment..." : "Log in to comment"}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-24"
                        disabled={!user}
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isCommentLoading}
                          className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${
                            !newComment.trim() || isCommentLoading 
                              ? 'bg-gray-300 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {isCommentLoading ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Post
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Login Prompt */}
                  <AnimatePresence>
                    {showLoginPrompt && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-full">
                            <User className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-gray-700">Please log in to comment on articles</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowLoginPrompt(false)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 text-sm hover:bg-gray-50"
                          >
                            Dismiss
                          </button>
                          <Link 
                            to="/login" 
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                          >
                            Log In
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Comments List */}
                  <div className="space-y-6">
                    {comments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-1">No comments yet</h3>
                        <p className="text-gray-500">Be the first to share your thoughts</p>
                      </div>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <img 
                              src={comment.author.avatar} 
                              alt={comment.author.name} 
                              className="h-10 w-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium">{comment.author.name}</div>
                              <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{comment.content}</p>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleLikeComment(comment.id)}
                              className={`text-sm flex items-center gap-1 ${
                                comment.userHasLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                              }`}
                            >
                              <Heart className="h-4 w-4" fill={comment.userHasLiked ? 'currentColor' : 'none'} />
                              <span>{comment.likes}</span>
                            </button>
                            <button className="text-sm text-gray-500 hover:text-gray-700">Reply</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {relatedPosts.map(post => (
                        <div 
                          key={post.id}
                          onClick={() => handlePostSelect(post)}
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                        >
                          <div className="h-48 overflow-hidden">
                            <img 
                              src={post.featuredImage} 
                              alt={post.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500 mb-2">{formatDate(post.publishedAt)}</div>
                            <h3 className="font-semibold mb-2 group-hover:text-red-600 transition-colors line-clamp-2">{post.title}</h3>
                            <div className="flex justify-between items-center mt-3">
                              <div className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {post.readTime} min read
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center text-gray-500 text-sm">
                                  <Heart className="h-4 w-4 mr-1" fill={post.userHasLiked ? 'currentColor' : 'none'} />
                                  {post.likes}
                                </span>
                                <span className="flex items-center text-gray-500 text-sm">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {post.comments}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          // Posts Listing View
          <>
            {/* Featured Articles Section */}
            <section id="featured-content" className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-10 text-center">Featured Articles</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {featuredPosts.length > 0 && (
                    <div className="lg:col-span-7 xl:col-span-8">
                      <div 
                        className="relative rounded-xl overflow-hidden h-96 cursor-pointer group"
                        onClick={() => handlePostSelect(featuredPosts[0])}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-10"></div>
                        <img 
                          src={featuredPosts[0].featuredImage} 
                          alt={featuredPosts[0].title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        
                        <div className="absolute inset-x-0 bottom-0 p-6 z-20">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full">
                              {featuredPosts[0].category}
                            </span>
                            <div className="text-white/80 text-sm flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {featuredPosts[0].readTime} min read
                            </div>
                          </div>
                          
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-red-200 transition-colors">
                            {featuredPosts[0].title}
                          </h3>
                          
                          <p className="text-white/80 mb-4 line-clamp-2">
                            {featuredPosts[0].excerpt}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img 
                                src={featuredPosts[0].author.avatar} 
                                alt={featuredPosts[0].author.name} 
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="text-white/90 text-sm">{featuredPosts[0].author.name}</div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={(e) => handleLikePost(featuredPosts[0].id, e)}
                                className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                              >
                                <Heart className="h-4 w-4" fill={featuredPosts[0].userHasLiked ? 'currentColor' : 'none'} />
                                <span>{featuredPosts[0].likes}</span>
                              </button>
                              
                              <div className="flex items-center gap-1 text-white/80">
                                <MessageSquare className="h-4 w-4" />
                                <span>{featuredPosts[0].comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="lg:col-span-5 xl:col-span-4">
                    <div className="grid grid-cols-1 gap-6 h-full">
                      {featuredPosts.slice(1, 3).map((post, index) => (
                        <div 
                          key={post.id}
                          onClick={() => handlePostSelect(post)}
                          className="relative rounded-xl overflow-hidden h-44 cursor-pointer group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-10"></div>
                          <img 
                            src={post.featuredImage} 
                            alt={post.title} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full">
                                {post.category}
                              </span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white group-hover:text-red-200 transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-white/80 text-xs flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {post.readTime} min read
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={(e) => handleLikePost(post.id, e)}
                                  className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-xs"
                                >
                                  <Heart className="h-3 w-3" fill={post.userHasLiked ? 'currentColor' : 'none'} />
                                  <span>{post.likes}</span>
                                </button>
                                
                                <div className="flex items-center gap-1 text-white/80 text-xs">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{post.comments}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Main Content Section */}
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Main Content */}
                  <div className="lg:w-2/3">
                    {/* Filters and Controls */}
                    <div className="mb-8 flex flex-wrap justify-between gap-4">
                      <div className="relative">
                        <button 
                          onClick={() => setShowCategories(!showCategories)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 transition-colors"
                        >
                          <Filter className="h-4 w-4" />
                          Category: {activeCategory === 'all' ? 'All' : categories.find(c => c.id === activeCategory)?.name || 'All'}
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown for Categories */}
                        {showCategories && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="p-2">
                              <button 
                                onClick={() => {
                                  setActiveCategory('all');
                                  setShowCategories(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md ${activeCategory === 'all' ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50'}`}
                              >
                                All Categories
                              </button>
                              {categories.map(category => (
                                <button 
                                  key={category.id}
                                  onClick={() => {
                                    setActiveCategory(category.id);
                                    setShowCategories(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${activeCategory === category.id ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50'}`}
                                >
                                  <span>{category.name}</span>
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{category.count}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-grow w-60">
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..." 
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                        
                        <div className="flex">
                          <button 
                            onClick={() => setCurrentView('grid')} 
                            className={`p-2 rounded-l-lg border border-gray-200 ${
                              currentView === 'grid' ? 'bg-gray-100 text-red-600' : 'text-gray-500'
                            }`}
                          >
                            <Grid size={20} />
                          </button>
                          <button 
                            onClick={() => setCurrentView('list')} 
                            className={`p-2 rounded-r-lg border-t border-r border-b border-gray-200 ${
                              currentView === 'list' ? 'bg-gray-100 text-red-600' : 'text-gray-500'
                            }`}
                          >
                            <List size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Posts Grid/List */}
                    {isLoading ? (
                      // Loading Skeleton
                      <div className={currentView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
                        {Array(6).fill(null).map((_, index) => (
                          currentView === 'grid' ? (
                            <div key={index} className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
                              <div className="h-48 bg-gray-200"></div>
                              <div className="p-4">
                                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                                <div className="h-10 bg-gray-200 rounded-lg"></div>
                              </div>
                            </div>
                          ) : (
                            <div key={index} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex animate-pulse">
                              <div className="w-1/3 h-48 bg-gray-200"></div>
                              <div className="w-2/3 p-4">
                                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                                <div className="h-16 bg-gray-200 rounded-lg"></div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    ) : filteredPosts.length === 0 ? (
                      // No results
                      <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                        <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                        <button 
                          onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('all');
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reset filters
                        </button>
                      </div>
                    ) : currentView === 'grid' ? (
                      // Grid View
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredPosts.map((post, index) => (
                          <motion.div 
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                            onClick={() => handlePostSelect(post)}
                          >
                            <div className="relative h-48 overflow-hidden">
                              {post.mediaType === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <div className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              {post.mediaType === 'audio' && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <div className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              <img 
                                src={post.featuredImage} 
                                alt={post.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full">
                                  {post.category}
                                </span>
                              </div>
                              <h3 className="font-bold text-xl mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={post.author.avatar} 
                                    alt={post.author.name} 
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                  <span className="text-sm font-medium">{post.author.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={(e) => handleLikePost(post.id, e)}
                                    className={`flex items-center gap-1 text-sm ${
                                      post.userHasLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                                    }`}
                                  >
                                    <Heart className="h-4 w-4" fill={post.userHasLiked ? 'currentColor' : 'none'} />
                                    <span>{post.likes}</span>
                                  </button>
                                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{post.comments}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      // List View
                      <div className="space-y-6">
                        {filteredPosts.map((post, index) => (
                          <motion.div 
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow group cursor-pointer"
                            onClick={() => handlePostSelect(post)}
                          >
                            <div className="md:w-1/3 relative">
                              <div className="relative aspect-video md:aspect-auto md:h-full overflow-hidden">
                                {post.mediaType === 'video' && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                {post.mediaType === 'audio' && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                <img 
                                  src={post.featuredImage} 
                                  alt={post.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            </div>
                            <div className="md:w-2/3 p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full">
                                  {post.category}
                                </span>
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(post.publishedAt)}
                                </div>
                              </div>
                              <h3 className="font-bold text-xl mb-3 group-hover:text-red-600 transition-colors">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 mb-4">{post.excerpt}</p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={post.author.avatar} 
                                    alt={post.author.name} 
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="text-sm font-medium">{post.author.name}</div>
                                    <div className="text-xs text-gray-500">{post.author.role}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={(e) => handleLikePost(post.id, e)}
                                    className={`flex items-center gap-1 ${
                                      post.userHasLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                                    }`}
                                  >
                                    <Heart className="h-4 w-4" fill={post.userHasLiked ? 'currentColor' : 'none'} />
                                    <span>{post.likes}</span>
                                  </button>
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{post.comments}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Infinite Scroll Trigger */}
                    <div ref={infiniteScrollRef} className="h-10 flex justify-center mt-8">
                      {isLoadingMore && (
                        <div className="flex items-center">
                          <svg className="animate-spin h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-gray-600">Loading more articles...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="lg:w-1/3 space-y-8">
                    {/* Categories widget */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-4">Categories</h3>
                      <ul className="space-y-2">
                        <li>
                          <button 
                            onClick={() => setActiveCategory('all')}
                            className={`w-full text-left flex justify-between items-center p-2 rounded-lg ${
                              activeCategory === 'all' 
                                ? `bg-gradient-to-r from-red-500 to-red-600 text-white`
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span>All Categories</span>
                            <span className={`text-xs ${activeCategory === 'all' ? 'bg-white/20' : 'bg-gray-100'} px-2 py-1 rounded-full`}>
                              {posts.length + featuredPosts.length}
                            </span>
                          </button>
                        </li>
                        {categories.map(category => (
                          <li key={category.id}>
                            <button 
                              onClick={() => setActiveCategory(category.id)}
                              className={`w-full text-left flex justify-between items-center p-2 rounded-lg ${
                                activeCategory === category.id 
                                  ? `bg-gradient-to-r from-red-500 to-red-600 text-white`
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <span>{category.name}</span>
                              <span className={`text-xs ${activeCategory === category.id ? 'bg-white/20' : 'bg-gray-100'} px-2 py-1 rounded-full`}>
                                {category.count}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Popular tags widget */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-4">Popular Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map(tag => (
                          <button 
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subscribe widget */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-sm">
                      <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
                      <p className="mb-4">Subscribe to our newsletter to receive the latest articles, resources, and nursing insights.</p>
                      
                      <form className="space-y-3">
                        <input 
                          type="email" 
                          placeholder="Your email address" 
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <button className="w-full py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">
                          Subscribe
                        </button>
                      </form>
                      
                      <div className="text-xs text-white/70 mt-3">
                        We respect your privacy. Unsubscribe at any time.
                      </div>
                    </div>

                    {/* Resources widget */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-4">Resources</h3>
                      <ul className="space-y-3">
                        <li>
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-red-600 transition-colors">Free E-Books</div>
                              <div className="text-sm text-gray-500">Download nursing guides</div>
                            </div>
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-red-600 transition-colors">Video Tutorials</div>
                              <div className="text-sm text-gray-500">Watch nursing demonstrations</div>
                            </div>
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white">
                              <Tag className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-red-600 transition-colors">Clinical Tools</div>
                              <div className="text-sm text-gray-500">Access practice resources</div>
                            </div>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Call to Action Section */}
            <section className="py-16 bg-gray-900 text-white">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl font-bold mb-6">Enhance Your Adult Nursing Practice</h2>
                  <p className="text-xl text-gray-300 mb-8">
                    Join our community of nursing professionals and gain access to premium resources, 
                    personalized learning paths, and expert-led webinars.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      to="/register" 
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                    >
                      Join the Community
                    </Link>
                    <Link 
                      to="/services/adult-health-nursing/resources" 
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors backdrop-blur-sm"
                    >
                      Explore Resources
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold">
                  H
                </div>
                <span className="text-xl font-bold">HandyWriterz</span>
              </div>
              <p className="text-gray-600 mb-6">
                Supporting healthcare professionals with expert resources and specialized content.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465.66.254 1.216.598 1.772 1.153a4.894 4.894 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.89 4.89 0 01-1.153 1.772 4.894 4.894 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.89 4.89 0 01-1.772-1.153 4.894 4.894 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.89 4.89 0 011.153-1.772A4.894 4.894 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link to="/services/adult-health-nursing" className="text-gray-600 hover:text-red-600 transition-colors">Adult Health Nursing</Link></li>
                <li><Link to="/services/mental-health-nursing" className="text-gray-600 hover:text-red-600 transition-colors">Mental Health Nursing</Link></li>
                <li><Link to="/services/child-nursing" className="text-gray-600 hover:text-red-600 transition-colors">Child Nursing</Link></li>
                <li><Link to="/services/special-education" className="text-gray-600 hover:text-red-600 transition-colors">Special Education</Link></li>
                <li><Link to="/services/social-work" className="text-gray-600 hover:text-red-600 transition-colors">Social Work</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-red-600 transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="text-gray-600 hover:text-red-600 transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-red-600 transition-colors">Contact</Link></li>
                <li><Link to="/faq" className="text-gray-600 hover:text-red-600 transition-colors">FAQ</Link></li>
                <li><Link to="/privacy-policy" className="text-gray-600 hover:text-red-600 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <address className="not-italic">
                <p className="text-gray-600 mb-2">123 Academic Street</p>
                <p className="text-gray-600 mb-2">Education City, EC 12345</p>
                <p className="text-gray-600 mb-2">Email: info@handywriterz.com</p>
                <p className="text-gray-600">Phone: +44 (711) 264-993</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-6 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} HandyWriterz. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 relative">
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Search Adult Health Nursing Articles</h2>
            
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type keywords to search..." 
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                  autoFocus
                />
                <Search className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              
              <div className="flex justify-end mt-4">
                <button 
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 6).map(tag => (
                  <button 
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      handleSearch(new Event('submit') as any);
                    }}
                    className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <User className="h-12 w-12 text-red-600 mx-auto" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-6">
                Please log in to like posts, add comments, and interact with content.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <Link
                  to="/login"
                  className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Log In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdultHealthNursing;