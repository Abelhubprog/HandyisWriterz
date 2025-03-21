import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Brain,
  Tag,
  Bell,
  BookOpen,
  Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { serviceConfigs } from '@/types/posts';

// Types
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  featuredImage: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  likes: number;
  comments: number;
  userHasLiked?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface Comment {
  id: string;
  postId: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  userHasLiked?: boolean;
  replies?: Comment[];
}

const MentalHealthNursing: React.FC = () => {
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
  const pageTopRef = useRef<HTMLDivElement>(null);

  // Smooth scroll function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Auth
  const { user } = useAuth();
  
  // Service details from config
  const serviceConfig = serviceConfigs['mental-health-nursing'];
  const { serviceName, serviceType, serviceColor, serviceColorClass, serviceBgColor, serviceDescription } = serviceConfig;

  // Fetch posts
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch posts from Supabase
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles:author_id(id, full_name, avatar_url, role)')
          .eq('service_type', serviceType)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (postsError) throw postsError;
        
        // Fetch featured posts
        const { data: featuredData, error: featuredError } = await supabase
          .from('posts')
          .select('*, profiles:author_id(id, full_name, avatar_url, role)')
          .eq('service_type', serviceType)
          .eq('status', 'published')
          .order('views_count', { ascending: false })
          .limit(3);
          
        if (featuredError) throw featuredError;
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('service_type', serviceType);
          
        if (categoriesError) throw categoriesError;
        
        // Format posts for display
        const formattedPosts = postsData ? postsData.map(post => ({
          id: post.id.toString(),
          title: post.title,
          slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
          excerpt: post.excerpt || '',
          content: post.content,
          author: {
            id: post.profiles.id,
            name: post.profiles.full_name,
            avatar: post.profiles.avatar_url || '/placeholder-avatar.png',
            role: post.profiles.role,
          },
          category: post.category,
          tags: post.tags || [],
          publishedAt: post.published_at,
          readTime: Math.ceil(post.content.split(' ').length / 200), // Estimate read time
          featuredImage: post.cover_image || '/placeholder-image.jpg',
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          userHasLiked: false // Will be updated later if user is logged in
        })) : [];
        
        // Format featured posts
        const formattedFeatured = featuredData ? featuredData.map(post => ({
          id: post.id.toString(),
          title: post.title,
          slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
          excerpt: post.excerpt || '',
          content: post.content,
          author: {
            id: post.profiles.id,
            name: post.profiles.full_name,
            avatar: post.profiles.avatar_url || '/placeholder-avatar.png',
            role: post.profiles.role,
          },
          category: post.category,
          tags: post.tags || [],
          publishedAt: post.published_at,
          readTime: Math.ceil(post.content.split(' ').length / 200),
          featuredImage: post.cover_image || '/placeholder-image.jpg',
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          userHasLiked: false
        })) : [];
        
        // Format categories
        const formattedCategories = categoriesData ? categoriesData.map(category => ({
          id: category.id.toString(),
          name: category.name,
          slug: category.slug,
          count: category.post_count || 0
        })) : [];
        
        // Get popular tags from posts
        const allTags = postsData ? postsData.flatMap(post => post.tags || []) : [];
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const sortedTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);
        
        // If user is logged in, check if they liked any of the posts
        if (user) {
          const { data: userLikes } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id);
            
          if (userLikes) {
            const likedPostIds = new Set(userLikes.map(like => like.post_id.toString()));
            
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
        setHasMore(postsData ? postsData.length === 10 : false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Fallback to mock data for development purposes
        const mockPosts: Post[] = Array(10).fill(null).map((_, index) => ({
          id: `post-${index + 1}`,
          title: [
            "Therapeutic Approaches in Mental Health Nursing",
            "Understanding Psychiatric Disorders: A Nursing Perspective",
            "Crisis Intervention Strategies for Mental Health Nurses",
            "Patient Assessment in Mental Health Settings",
            "Self-Care for Mental Health Nursing Professionals"
          ][Math.floor(Math.random() * 5)],
          slug: `mental-health-post-${index + 1}`,
          excerpt: "This comprehensive guide explores effective approaches in mental health nursing, providing actionable insights for nursing professionals to enhance patient care outcomes.",
          content: `<p>Mental health nursing requires specialized knowledge and skills. This article explores evidence-based approaches that have been proven most effective in clinical settings.</p>`,
          author: {
            id: "author-1",
            name: "Dr. Emily Chen",
            avatar: "/avatars/emily.jpg",
            role: "Psychiatric Nursing Specialist"
          },
          category: ["Therapeutic Interventions", "Psychiatric Disorders", "Crisis Management", "Patient Assessment", "Self-Care"][Math.floor(Math.random() * 5)],
          tags: ["mental-health", "nursing", "therapeutic", "psychiatric-care"],
          publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          readTime: Math.floor(Math.random() * 20) + 5,
          featuredImage: `/images/mental-health-${index + 1}.jpg`,
          likes: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 10),
          userHasLiked: false
        }));
        
        setPosts(mockPosts);
        setFeaturedPosts(mockPosts.slice(0, 3));
        setCategories([
          { id: "cat-1", name: "Therapeutic Interventions", slug: "therapeutic-interventions", count: 12 },
          { id: "cat-2", name: "Psychiatric Disorders", slug: "psychiatric-disorders", count: 8 },
          { id: "cat-3", name: "Crisis Management", slug: "crisis-management", count: 10 },
          { id: "cat-4", name: "Patient Assessment", slug: "patient-assessment", count: 6 },
          { id: "cat-5", name: "Self-Care", slug: "self-care", count: 4 }
        ]);
        setPopularTags(["mental-health", "nursing", "therapeutic", "psychiatric-care", "assessment"]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user, serviceType]);

  // Load more posts (for infinite scrolling)
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const nextPage = page + 1;
      
      // Create mock additional posts
      const additionalPosts: Post[] = Array(6).fill(null).map((_, index) => {
        const actualIndex = index + posts.length;
        return {
          id: `post-additional-${actualIndex}`,
          title: [
            "Self-Care Strategies for Mental Health Nurses",
            "Working with Personality Disorders: Therapeutic Approaches",
            "Digital Interventions in Modern Psychiatric Care",
            "Supporting Families in Mental Health Recovery",
            "Suicide Risk Assessment and Prevention",
            "Cultural Considerations in Mental Health Nursing"
          ][Math.floor(Math.random() * 6)],
          slug: `mental-health-nursing-post-additional-${actualIndex}`,
          excerpt: "Explore evidence-based approaches that enhance mental health nursing practice and improve therapeutic outcomes across diverse psychiatric care settings.",
          content: "Full content would be here...",
          author: {
            id: `user-additional-${Math.floor(Math.random() * 5) + 1}`,
            name: [`Dr. Johnson`, `Sarah Wilson, RN`, `Robert Park, MSN`, `Jennifer Lee, DNP`, `James Anderson, PhD`][Math.floor(Math.random() * 5)],
            avatar: `/api/placeholder/${32 + actualIndex}/${32 + actualIndex}`,
            role: ['Psychiatric Specialist', 'Mental Health Nurse Educator', 'Psychiatric Nurse Practitioner', 'Mental Health Researcher', 'Professor of Psychiatric Nursing'][Math.floor(Math.random() * 5)]
          },
          category: [`Therapeutic Approaches`, `Clinical Practice`, `Research`, `Professional Development`, `Advocacy`][Math.floor(Math.random() * 5)],
          tags: [
            "Therapeutic Communication", "CBT", "DBT", "Trauma-Informed Care", 
            "Recovery Model", "Psychopharmacology", "Crisis Intervention", "Mental Health",
            "Psychiatric Nursing", "Evidence-Based Practice", "Mindfulness", "Self-Care"
          ].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3)),
          publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
          readTime: 5 + Math.floor(Math.random() * 15),
          featuredImage: `/api/placeholder/${800 + actualIndex}/${450 + actualIndex}`,
          mediaType: 'image',
          likes: 10 + Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 30),
          userHasLiked: Math.random() > 0.5
        };
      });
      
      // Append new posts
      setPosts(prevPosts => [...prevPosts, ...additionalPosts]);
      setPage(nextPage);
      
      // Check if we should stop (for demo, stop after 5 pages)
      if (nextPage >= 5) {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, posts.length]);

  // Handle post selection
  const handlePostSelect = async (post: Post) => {
    try {
      setSelectedPost(post);
      
      // Scroll to top
      scrollToTop();
      
      // Record view in database if not the post author
      if (user && user.id !== post.author.id) {
        await supabase.from('views').insert({
          post_id: parseInt(post.id),
          user_id: user.id
        });
      } else if (!user) {
        // Anonymous view
        await supabase.from('views').insert({
          post_id: parseInt(post.id)
        });
      }
      
      // Fetch comments for the post
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*, profiles:author_id(id, full_name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
        
      if (commentsError) throw commentsError;
      
      // Format comments
      const formattedComments = commentsData ? commentsData.map(comment => ({
        id: comment.id.toString(),
        postId: post.id,
        author: {
          id: comment.profiles.id,
          name: comment.profiles.full_name,
          avatar: comment.profiles.avatar_url || '/placeholder-avatar.png',
        },
        content: comment.content,
        createdAt: comment.created_at,
        likes: 0,
        userHasLiked: false
      })) : [];
      
      setComments(formattedComments);
      
      // Fetch related posts (same category or shared tags)
      const { data: relatedData, error: relatedError } = await supabase
        .from('posts')
        .select('*, profiles:author_id(id, full_name, avatar_url, role)')
        .eq('service_type', serviceType)
        .eq('status', 'published')
        .eq('category', post.category)
        .not('id', 'eq', post.id)
        .limit(3);
        
      if (relatedError) throw relatedError;
      
      // Format related posts
      const formattedRelated = relatedData ? relatedData.map(relatedPost => ({
        id: relatedPost.id.toString(),
        title: relatedPost.title,
        slug: relatedPost.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
        excerpt: relatedPost.excerpt || '',
        content: relatedPost.content,
        author: {
          id: relatedPost.profiles.id,
          name: relatedPost.profiles.full_name,
          avatar: relatedPost.profiles.avatar_url || '/placeholder-avatar.png',
          role: relatedPost.profiles.role,
        },
        category: relatedPost.category,
        tags: relatedPost.tags || [],
        publishedAt: relatedPost.published_at,
        readTime: Math.ceil(relatedPost.content.split(' ').length / 200),
        featuredImage: relatedPost.cover_image || '/placeholder-image.jpg',
        likes: relatedPost.likes_count || 0,
        comments: relatedPost.comments_count || 0,
        userHasLiked: false
      })) : [];
      
      // If user is logged in, check if they liked any of the related posts
      if (user && formattedRelated.length > 0) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', relatedData.map(post => post.id));
          
        if (userLikes) {
          const likedPostIds = new Set(userLikes.map(like => like.post_id.toString()));
          
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
        title: 'Related Post: Therapeutic Approaches for Anxiety Disorders',
        slug: 'related-therapeutic-approaches',
        excerpt: 'Learn about effective therapeutic approaches for patients with anxiety disorders.',
        content: 'Detailed content about therapeutic approaches...',
        author: {
          id: 'author-2',
          name: 'Dr. Sarah Johnson',
          avatar: '/avatars/sarah.jpg',
          role: 'Anxiety Specialist'
        },
        category: post.category,
        tags: ['anxiety', 'therapy', 'mental-health'],
        publishedAt: new Date().toISOString(),
        readTime: 8,
        featuredImage: '/images/related-1.jpg',
        likes: 15,
        comments: 3,
        userHasLiked: false
      }]);
    }
  };
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would filter posts based on search query
    // For demo purposes, just close the search overlay
    setIsSearchOpen(false);
  };
  
  // Handle like post
  const handleLikePost = async (postId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Update selected post if it's the one being liked
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => {
        if (!prev) return null;
        
        const newLikes = prev.userHasLiked ? prev.likes - 1 : prev.likes + 1;
        
        return {
          ...prev,
          likes: newLikes,
          userHasLiked: !prev.userHasLiked
        };
      });
    }
    
    // Update posts list
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: post.userHasLiked ? post.likes - 1 : post.likes + 1,
              userHasLiked: !post.userHasLiked 
            } 
          : post
      )
    );
    
    // Update featured posts if needed
    setFeaturedPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: post.userHasLiked ? post.likes - 1 : post.likes + 1,
              userHasLiked: !post.userHasLiked 
            } 
          : post
      )
    );
    
    // In a real app, this would send the like to the server
    // For demo purposes, we're just updating the local state
  };
  
  // Handle like comment
  const handleLikeComment = (commentId: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              likes: comment.userHasLiked ? comment.likes - 1 : comment.likes + 1,
              userHasLiked: !comment.userHasLiked 
            } 
          : comment
      )
    );
    
    // In a real app, this would send the like to the server
  };
  
  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!selectedPost || !newComment.trim()) return;
    
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    setIsCommentLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create new comment
      const newCommentObj: Comment = {
        id: `comment-new-${Date.now()}`,
        postId: selectedPost.id,
        author: {
          id: user.id,
          name: user.displayName || 'Anonymous User',
          avatar: user.photoURL || `/api/placeholder/40/40`
        },
        content: newComment,
        createdAt: new Date().toISOString(),
        likes: 0,
        userHasLiked: false
      };
      
      // Add to comments
      setComments(prev => [newCommentObj, ...prev]);
      
      // Update comment count on post
      if (selectedPost) {
        setSelectedPost(prev => {
          if (!prev) return null;
          return {
            ...prev,
            comments: prev.comments + 1
          };
        });
        
        // Also update in posts list
        setPosts(prev => 
          prev.map(post => 
            post.id === selectedPost.id 
              ? { ...post, comments: post.comments + 1 } 
              : post
          )
        );
        
        // And in featured posts if needed
        setFeaturedPosts(prev => 
          prev.map(post => 
            post.id === selectedPost.id 
              ? { ...post, comments: post.comments + 1 } 
              : post
          )
        );
      }
      
      // Clear input
      setNewComment('');
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsCommentLoading(false);
    }
  };
  
  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Back to posts list
  const handleBackToPosts = () => {
    setSelectedPost(null);
    
    // In a real app, update the URL
    window.history.pushState({}, '', '/services/mental-health-nursing');
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
    <div className="min-h-screen bg-gray-50" ref={pageTopRef}>
      {/* SEO Optimization */}
      <Helmet>
        <title>Mental Health Nursing Resources & Articles | HandyWriterz</title>
        <meta 
          name="description" 
          content="Explore comprehensive mental health nursing resources, evidence-based articles, and expert insights to enhance your psychiatric nursing knowledge and practice." 
        />
        <meta name="keywords" content="mental health nursing, psychiatric nursing, therapeutic communication, evidence-based practice, crisis intervention, trauma-informed care, recovery model" />
        <link rel="canonical" href="https://handywriterz.com/services/mental-health-nursing" />
      </Helmet>
      
      {/* Fixed Header for easy navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="mr-6">
                <div className="h-8 w-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center text-white font-bold">
                  H
                </div>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">Home</Link>
                <Link to="/services" className="text-gray-600 hover:text-gray-900 font-medium">Services</Link>
                <Link to="/services/mental-health-nursing" className="text-teal-600 font-medium">Mental Health Nursing</Link>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="pb-12">
        {/* Header Banner */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/90 to-teal-700/90"></div>
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Mental Health Nursing</h1>
              <p className="text-xl text-white/90 mb-8">{serviceDescription}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => window.scrollTo({ top: document.querySelector('#featured-content')?.getBoundingClientRect().top! + window.scrollY - 100, behavior: 'smooth' })}
                  className="px-5 py-2.5 bg-white text-teal-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Explore Articles
                </button>
                <Link 
                  to="/services/mental-health-nursing/categories" 
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
                  <button onClick={handleBackToPosts} className="hover:text-teal-600 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to all articles
                  </button>
                  <span className="mx-2">|</span>
                  <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Link to="/services" className="hover:text-teal-600 transition-colors">Services</Link>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Link to="/services/mental-health-nursing" className="hover:text-teal-600 transition-colors">Mental Health Nursing</Link>
                </div>
                
                {/* Post Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full">
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
                    <div className="relative aspect-[4/1] bg-gradient-to-r from-teal-500 to-teal-700 flex items-center justify-center px-6">
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
                        to={`/services/mental-health-nursing?tag=${tag}`} 
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
                        selectedPost.userHasLiked ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none h-24"
                        disabled={!user}
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isCommentLoading}
                          className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${
                            !newComment.trim() || isCommentLoading 
                              ? 'bg-gray-300 cursor-not-allowed' 
                              : 'bg-teal-600 hover:bg-teal-700'
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
                        className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-100 rounded-full">
                            <User className="h-5 w-5 text-teal-600" />
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
                            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
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
                                comment.userHasLiked ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'
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
                            <h3 className="font-semibold mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">{post.title}</h3>
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
                            <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full">
                              {featuredPosts[0].category}
                            </span>
                            <div className="text-white/80 text-sm flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {featuredPosts[0].readTime} min read
                            </div>
                          </div>
                          
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-teal-200 transition-colors">
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
                              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full">
                                {post.category}
                              </span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white group-hover:text-teal-200 transition-colors line-clamp-2">
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
                                className={`w-full text-left px-3 py-2 rounded-md ${activeCategory === 'all' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-50'}`}
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
                                  className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${activeCategory === category.id ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-50'}`}
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
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                        
                        <div className="flex">
                          <button 
                            onClick={() => setCurrentView('grid')} 
                            className={`p-2 rounded-l-lg border border-gray-200 ${
                              currentView === 'grid' ? 'bg-gray-100 text-teal-600' : 'text-gray-500'
                            }`}
                          >
                            <Grid size={20} />
                          </button>
                          <button 
                            onClick={() => setCurrentView('list')} 
                            className={`p-2 rounded-r-lg border-t border-r border-b border-gray-200 ${
                              currentView === 'list' ? 'bg-gray-100 text-teal-600' : 'text-gray-500'
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
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
                                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full">
                                  {post.category}
                                </span>
                              </div>
                              <h3 className="font-bold text-xl mb-3 group-hover:text-teal-600 transition-colors line-clamp-2">
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
                                      post.userHasLiked ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'
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
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
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
                                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full">
                                  {post.category}
                                </span>
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(post.publishedAt)}
                                </div>
                              </div>
                              <h3 className="font-bold text-xl mb-3 group-hover:text-teal-600 transition-colors">
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
                                      post.userHasLiked ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'
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
                          <svg className="animate-spin h-5 w-5 text-teal-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                                ? `bg-gradient-to-r from-teal-500 to-teal-600 text-white`
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
                                  ? `bg-gradient-to-r from-teal-500 to-teal-600 text-white`
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
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-sm">
                      <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
                      <p className="mb-4">Subscribe to our newsletter to receive the latest articles, resources, and mental health nursing insights.</p>
                      
                      <form className="space-y-3">
                        <input 
                          type="email" 
                          placeholder="Your email address" 
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <button className="w-full py-2 bg-white text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors">
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
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-teal-600 transition-colors">Free E-Books</div>
                              <div className="text-sm text-gray-500">Download mental health guides</div>
                            </div>
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white">
                              <Brain className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-teal-600 transition-colors">Therapeutic Tools</div>
                              <div className="text-sm text-gray-500">Access intervention resources</div>
                            </div>
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white">
                              <Coffee className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-teal-600 transition-colors">Self-Care Resources</div>
                              <div className="text-sm text-gray-500">Wellness for healthcare providers</div>
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
                  <h2 className="text-3xl font-bold mb-6">Enhance Your Mental Health Nursing Practice</h2>
                  <p className="text-xl text-gray-300 mb-8">
                    Join our community of psychiatric nursing professionals and gain access to premium resources, 
                    evidence-based interventions, and expert-led webinars.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      to="/register" 
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium transition-colors"
                    >
                      Join the Community
                    </Link>
                    <Link 
                      to="/services/mental-health-nursing/resources" 
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
      
      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition-colors z-40"
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
      
           
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
            
            <h2 className="text-2xl font-bold mb-6">Search Mental Health Nursing Articles</h2>
            
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type keywords to search..." 
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg"
                  autoFocus
                />
                <Search className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              
              <div className="flex justify-end mt-4">
                <button 
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 8).map(tag => (
                  <button 
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      setIsSearchOpen(false);
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentalHealthNursing;