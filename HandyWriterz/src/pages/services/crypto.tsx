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
  Bell,
  BarChart2,
  Layers,
  Zap,
  DollarSign,
  Cpu,
  Globe,
  Shield,
  Award,
  Tag,
  Hash,
  Database,
  Activity,
  TrendingUp
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

const CryptocurrencyAnalysis: React.FC = () => {
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

  // Smooth scroll function with improved behavior
  const scrollToTop = () => {
    const scrollOptions = {
      top: 0,
      behavior: 'smooth' as ScrollBehavior
    };
    
    // Animated scroll with smooth easing
    const scrollToTopWithEasing = () => {
      const c = document.documentElement.scrollTop || document.body.scrollTop;
      if (c > 0) {
        window.requestAnimationFrame(scrollToTopWithEasing);
        window.scrollTo(0, c - c / 8);
      }
    };
    
    scrollToTopWithEasing();
  };

  // Smooth scroll to element function
  const smoothScrollToElement = (elementId: string, offset: number = 100) => {
    const element = document.querySelector(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Auth
  const { user } = useAuth();
  
  // Service details from config
  const serviceConfig = serviceConfigs['crypto'];
  const { serviceName, serviceType, serviceColor, serviceColorClass, serviceBgColor, serviceDescription } = serviceConfig;

  // Fetch posts
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from Supabase
        // Simulate API call delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Create mock data
        const mockPosts: Post[] = Array(30).fill(null).map((_, index) => ({
          id: `post-${index + 1}`,
          title: [
            "Cryptocurrency Trading: Technical Analysis Fundamentals",
            "Understanding Blockchain Technology: A Beginner's Guide",
            "DeFi Platforms: Risks and Opportunities",
            "NFT Markets: Current Trends and Future Potential",
            "Crypto Security: Best Practices for Investors",
            "Regulatory Developments in Cryptocurrency Markets",
            "Bitcoin vs. Altcoins: Investment Strategies",
            "Crypto Market Cycles: Historical Patterns",
            "Web3 Development: Building on the Blockchain",
            "Sustainable Cryptocurrency: The Environmental Impact"
          ][Math.floor(Math.random() * 10)],
          slug: `crypto-analysis-post-${index + 1}`,
          excerpt: "This comprehensive resource explores cryptocurrency market trends and blockchain technology, providing practical insights for investors to enhance their trading strategies and portfolio management.",
          content: `<p>Cryptocurrency trading requires specialized knowledge of technical analysis and market patterns. This article explores approaches that have been proven most effective in digital asset markets.</p>
          
          <h2>The Foundations of Technical Analysis in Crypto</h2>
          
          <p>Technical analysis forms the cornerstone of effective cryptocurrency trading. Research demonstrates that understanding chart patterns and indicators significantly influences trading outcomes across all digital assets.</p>
          
          <p>Key elements of effective technical analysis include:</p>
          
          <ul>
            <li>Support and resistance levels</li>
            <li>Moving averages and trend identification</li>
            <li>Volume analysis for confirmation</li>
            <li>Relative Strength Index (RSI) and other oscillators</li>
            <li>Fibonacci retracement levels for price targets</li>
          </ul>
          
          <h2>Fundamental Analysis in Cryptocurrency Markets</h2>
          
          <p>Implementing fundamental analysis in crypto markets requires both specialized knowledge and analytical skills. Successful evaluation involves:</p>
          
          <ol>
            <li>Project team assessment and development activity</li>
            <li>Tokenomics and supply distribution</li>
            <li>Network activity and adoption metrics</li>
            <li>Use case viability and market fit</li>
            <li>Regulatory considerations and compliance</li>
          </ol>
          
          <h2>Case Study: DeFi Platform Analysis</h2>
          
          <p>A compelling example of analysis in cryptocurrency markets involves the evaluation of decentralized finance (DeFi) protocols. Research has demonstrated that approaches focusing on protocol security, TVL (Total Value Locked), governance mechanisms, and yield sustainability lead to improved investment outcomes.</p>
          
          <p>One DeFi platform implemented a governance overhaul and observed increased user activity from 24% to 36% within one quarter, alongside significant improvements in token price stability and long-term value accrual.</p>
          
          <h2>Challenges and Solutions</h2>
          
          <p>Despite the clear benefits, implementing effective cryptocurrency analysis can face obstacles including:</p>
          
          <ul>
            <li>High market volatility and emotional trading</li>
            <li>Information asymmetry and market manipulation</li>
            <li>Rapidly evolving technology landscape</li>
            <li>Regulatory uncertainty across jurisdictions</li>
          </ul>
          
          <p>Successful crypto investors address these challenges through risk management, portfolio diversification, continuous education, and avoiding FOMO (Fear Of Missing Out) in their decision-making process.</p>
          
          <h2>Looking Ahead: The Future of Cryptocurrency Markets</h2>
          
          <p>The field of cryptocurrency continues to evolve with advances in blockchain technology, institutional adoption, and regulatory frameworks. Investors who commit to evidence-based analysis while maintaining a long-term perspective will be best positioned to navigate the volatility and capitalize on opportunities.</p>
          
          <p>By balancing technical and fundamental analysis of crypto assets, market participants can make informed decisions that manage risk while positioning for growth across various market cycles.</p>`,
          author: {
            id: `user-${Math.floor(Math.random() * 5) + 1}`,
            name: [`Alex Turner`, `Sarah Johnson, CFA`, `Michael Chen, MSc`, `Emma Robertson, MBA`, `David Thompson, PhD`][Math.floor(Math.random() * 5)],
            avatar: `/api/placeholder/${32 + index}/${32 + index}`,
            role: ['Crypto Market Analyst', 'Blockchain Investment Strategist', 'DeFi Researcher', 'Cryptocurrency Consultant', 'Professor of Digital Economics'][Math.floor(Math.random() * 5)]
          },
          category: [`Market Analysis`, `Trading Strategies`, `Blockchain Technology`, `Investment`, `Regulation & Policy`][Math.floor(Math.random() * 5)],
          tags: [
            "Bitcoin", "Ethereum", "DeFi", "NFTs", "Technical Analysis", 
            "Blockchain", "Web3", "Smart Contracts", "Altcoins", "Tokenomics",
            "Mining", "Market Analysis", "Regulation"
          ].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3)),
          publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
          readTime: 5 + Math.floor(Math.random() * 15),
          featuredImage: `/api/placeholder/${800 + index}/${450 + index}`,
          mediaType: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'video' : 'audio') : 'image',
          mediaUrl: Math.random() > 0.8 ? `/api/placeholder/${800 + index}/${450 + index}` : undefined,
          likes: 10 + Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 30),
          userHasLiked: Math.random() > 0.5
        }));
        
        // Sort by date (newest first)
        mockPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        // Set featured posts (newest 3)
        setFeaturedPosts(mockPosts.slice(0, 3));
        
        // Set regular posts (excluding featured)
        setPosts(mockPosts.slice(3, 13));
        
        // Extract categories
        const categoryMap = mockPosts.reduce((acc, post) => {
          acc[post.category] = (acc[post.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const extractedCategories = Object.entries(categoryMap).map(([name, count]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          count
        }));
        
        setCategories(extractedCategories);
        
        // Extract popular tags
        const tagsCount = mockPosts.flatMap(post => post.tags).reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const sortedTags = Object.entries(tagsCount)
          .sort((a, b) => b[1] - a[1])
          .map(([tag]) => tag)
          .slice(0, 10);
        
        setPopularTags(sortedTags);

        // Set more flag
        setHasMore(true);
        setPage(1);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Set up intersection observer for infinite scrolling with improved threshold
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.25, rootMargin: '100px' }
    );
    
    if (infiniteScrollRef.current) {
      observer.observe(infiniteScrollRef.current);
    }
    
    return () => {
      if (infiniteScrollRef.current) {
        observer.unobserve(infiniteScrollRef.current);
      }
    };
  }, []);

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
            "Layer 2 Solutions: Scaling the Ethereum Network",
            "Tokenomics: Designing Sustainable Crypto Economies",
            "Metaverse Projects and Digital Asset Opportunities",
            "Crypto Tax Compliance: What Investors Need to Know",
            "Yield Farming Strategies with Managed Risk",
            "Central Bank Digital Currencies vs. Decentralized Crypto"
          ][Math.floor(Math.random() * 6)],
          slug: `crypto-analysis-post-additional-${actualIndex}`,
          excerpt: "Explore advanced cryptocurrency market dynamics and blockchain technology developments that impact digital asset valuations and investment strategies.",
          content: "Full content would be here...",
          author: {
            id: `user-additional-${Math.floor(Math.random() * 5) + 1}`,
            name: [`Jason Miller`, `Rebecca Wang, CFA`, `Kevin Park, MSc`, `Laura Thompson, MBA`, `Mark Anderson, PhD`][Math.floor(Math.random() * 5)],
            avatar: `/api/placeholder/${32 + actualIndex}/${32 + actualIndex}`,
            role: ['Crypto Market Analyst', 'Blockchain Investment Strategist', 'DeFi Researcher', 'Cryptocurrency Consultant', 'Professor of Digital Economics'][Math.floor(Math.random() * 5)]
          },
          category: [`Market Analysis`, `Trading Strategies`, `Blockchain Technology`, `Investment`, `Regulation & Policy`][Math.floor(Math.random() * 5)],
          tags: [
            "Bitcoin", "Ethereum", "DeFi", "NFTs", "Technical Analysis", 
            "Blockchain", "Web3", "Smart Contracts", "Altcoins", "Tokenomics",
            "Mining", "Market Analysis", "Regulation"
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
    setSelectedPost(post);
    scrollToTop();
    
    // In a real app, update the URL
    window.history.pushState({}, '', `/services/cryptocurrency-analysis/${post.slug}`);
    
    // Fetch comments
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock comments
      const mockComments: Comment[] = Array(Math.floor(Math.random() * 8) + 2).fill(null).map((_, index) => ({
        id: `comment-${post.id}-${index}`,
        postId: post.id,
        author: {
          id: `commenter-${index}`,
          name: [`Amanda Davis`, `John Chen`, `Emma Wilson`, `Mohammed Al-Farsi`, `Sofia Garcia`, `Carlos Mendez`][Math.floor(Math.random() * 6)],
          avatar: `/api/placeholder/${40 + index}/${40 + index}`
        },
        content: [
          "This article provided valuable insights that I can immediately apply to my crypto portfolio. Great technical analysis breakdown!",
          "The section on DeFi risks really opened my eyes to some vulnerabilities I hadn't considered. Thanks for the well-researched content.",
          "The market cycle analysis really resonated with me. I've been through several cycles and this perspective is spot on.",
          "This aligns with what I've been seeing in the markets lately. The altcoin analysis section was particularly useful.",
          "I've been looking for clear guidelines on NFT evaluation. This article perfectly summarizes the current best practices.",
          "As someone new to cryptocurrency investing, I found this extremely helpful for understanding blockchain fundamentals."
        ][Math.floor(Math.random() * 6)],
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
        likes: Math.floor(Math.random() * 15),
        userHasLiked: Math.random() > 0.7
      }));
      
      // Sort comments by date (newest first)
      mockComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setComments(mockComments);
      
      // Generate related posts (excluding current post)
      const related = posts
        .filter(p => p.id !== post.id && (p.category === post.category || p.tags.some(tag => post.tags.includes(tag))))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      setRelatedPosts(related);
      
    } catch (error) {
      console.error('Error fetching comments:', error);
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
    
    if (!user) {
      setShowLoginPrompt(true);
      return;
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
    
    // Provide visual feedback with subtle animation
    if (event) {
      const target = event.currentTarget as HTMLElement;
      target.classList.add('scale-125');
      setTimeout(() => {
        target.classList.remove('scale-125');
      }, 200);
    }
    
    // In a real app, this would send the like to the server
    // For demo purposes, we're just updating the local state
  };
  
  // Handle like comment
  const handleLikeComment = (commentId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
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
    window.history.pushState({}, '', '/services/cryptocurrency-analysis');
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
        <title>Cryptocurrency Analysis & Market Insights | HandyWriterz</title>
        <meta 
          name="description" 
          content="Explore comprehensive cryptocurrency analysis, blockchain insights, and market trends to enhance your crypto trading strategies and investment decisions." 
        />
        <meta name="keywords" content="cryptocurrency analysis, blockchain technology, bitcoin, ethereum, defi, crypto trading strategies, market analysis, nft markets, crypto investment" />
        <link rel="canonical" href="https://handywriterz.com/services/cryptocurrency-analysis" />
      </Helmet>
      
      {/* Fixed Header for easy navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-md bg-white/90">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="mr-6">
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold">
                  H
                </div>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">Home</Link>
                <Link to="/services" className="text-gray-600 hover:text-gray-900 font-medium">Services</Link>
                <Link to="/services/cryptocurrency-analysis" className="text-indigo-600 font-medium">Crypto Analysis</Link>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {user ? (
                <div className="flex items-center">
                  <button 
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                  <img 
                    src={user.photoURL || `/api/placeholder/32/32`}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full ml-2 border border-gray-200 object-cover"
                  />
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-sm"
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
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-purple-700/90"></div>
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{serviceName}</h1>
              <p className="text-xl text-white/90 mb-8">{serviceDescription}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => smoothScrollToElement('#featured-content', 100)}
                  className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Explore Articles
                </button>
                <Link 
                  to="/services/cryptocurrency-analysis/categories" 
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          </div>
          
          {/* Animated crypto-themed decorative elements */}
          <div className="absolute top-1/4 left-10 w-16 h-16 opacity-20">
            <div className="animate-float">
              <Hash className="w-full h-full text-white" />
            </div>
          </div>
          <div className="absolute bottom-1/4 right-10 w-12 h-12 opacity-20">
            <div className="animate-float-delay">
              <Database className="w-full h-full text-white" />
            </div>
          </div>
          <div className="absolute top-2/3 left-1/4 w-10 h-10 opacity-20">
            <div className="animate-float-slow">
              <Activity className="w-full h-full text-white" />
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
                  <button onClick={handleBackToPosts} className="hover:text-indigo-600 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to all articles
                  </button>
                  <span className="mx-2">|</span>
                  <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Link to="/services" className="hover:text-indigo-600 transition-colors">Services</Link>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Link to="/services/cryptocurrency-analysis" className="hover:text-indigo-600 transition-colors">Cryptocurrency Analysis</Link>
                </div>
                
                {/* Post Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">
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
                      className="h-12 w-12 rounded-full object-cover border border-gray-200 shadow-sm"
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
                    <div className="relative aspect-[4/1] bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center px-6">
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
                        to={`/services/cryptocurrency-analysis?tag=${tag}`} 
                        key={tag}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
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
                      className={`flex items-center gap-2 transition-all duration-200 ${
                        selectedPost.userHasLiked ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                      }`}
                    >
                      <Heart className="h-5 w-5" fill={selectedPost.userHasLiked ? 'currentColor' : 'none'} />
                      <span>{selectedPost.likes}</span>
                    </button>
                    <button 
                      onClick={() => commentInputRef.current?.focus()}
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
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
                      aria-label="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button 
                      className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                      aria-label="Bookmark"
                    >
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
                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                      />
                    </div>
                    <div className="flex-grow">
                      <textarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "Add a comment..." : "Log in to comment"}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24 transition-all"
                        disabled={!user}
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isCommentLoading}
                          className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all ${
                            !newComment.trim() || isCommentLoading 
                              ? 'bg-gray-300 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm'
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
                        transition={{ duration: 0.3 }}
                        className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-full">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-gray-700">Please log in to interact with articles</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowLoginPrompt(false)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                          >
                            Dismiss
                          </button>
                          <Link 
                            to="/login" 
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-sm"
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
                              className="h-10 w-10 rounded-full object-cover border border-gray-100"
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
                              className={`text-sm flex items-center gap-1 transition-colors ${
                                comment.userHasLiked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                              }`}
                            >
                              <Heart className="h-4 w-4" fill={comment.userHasLiked ? 'currentColor' : 'none'} />
                              <span>{comment.likes}</span>
                            </button>
                            <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Reply</button>
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
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                        >
                          <div className="h-48 overflow-hidden">
                            <img 
                              src={post.featuredImage} 
                              alt={post.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500 mb-2">{formatDate(post.publishedAt)}</div>
                            <h3 className="font-semibold mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{post.title}</h3>
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
                        className="relative rounded-xl overflow-hidden h-96 cursor-pointer group shadow-lg"
                        onClick={() => handlePostSelect(featuredPosts[0])}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-10"></div>
                        <img 
                          src={featuredPosts[0].featuredImage} 
                          alt={featuredPosts[0].title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        <div className="absolute inset-x-0 bottom-0 p-6 z-20">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">
                              {featuredPosts[0].category}
                            </span>
                            <div className="text-white/80 text-sm flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {featuredPosts[0].readTime} min read
                            </div>
                          </div>
                          
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300">
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
                                className="h-8 w-8 rounded-full object-cover border border-white/20"
                              />
                              <div className="text-white/90 text-sm">{featuredPosts[0].author.name}</div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={(e) => handleLikePost(featuredPosts[0].id, e)}
                                className="flex items-center gap-1 text-white/80 hover:text-white transition-all duration-200"
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
                          className="relative rounded-xl overflow-hidden h-44 cursor-pointer group shadow-md"
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-10"></div>
                          <img 
                            src={post.featuredImage} 
                            alt={post.title} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          
                          <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">
                                {post.category}
                              </span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors duration-300 line-clamp-2">
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
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
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
                                className={`w-full text-left px-3 py-2 rounded-md ${activeCategory === 'all' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'} transition-colors`}
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
                                  className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${activeCategory === category.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'} transition-colors`}
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
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
                          />
                          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                        
                        <div className="flex">
                          <button 
                            onClick={() => setCurrentView('grid')} 
                            className={`p-2 rounded-l-lg border border-gray-200 ${
                              currentView === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'
                            } transition-colors`}
                            aria-label="Grid view"
                          >
                            <Grid size={20} />
                          </button>
                          <button 
                            onClick={() => setCurrentView('list')} 
                            className={`p-2 rounded-r-lg border-t border-r border-b border-gray-200 ${
                              currentView === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'
                            } transition-colors`}
                            aria-label="List view"
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
                      <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
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
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-sm"
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
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer"
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
                                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              <img 
                                src={post.featuredImage} 
                                alt={post.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            </div>
                            <div className="p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">
                                  {post.category}
                                </span>
                              </div>
                              <h3 className="font-bold text-xl mb-3 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={post.author.avatar} 
                                    alt={post.author.name} 
                                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                                  />
                                  <span className="text-sm font-medium">{post.author.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={(e) => handleLikePost(post.id, e)}
                                    className={`flex items-center gap-1 text-sm transition-all duration-200 ${
                                      post.userHasLiked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
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
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-all duration-300 group cursor-pointer"
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
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                <img 
                                  src={post.featuredImage} 
                                  alt={post.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                              </div>
                            </div>
                            <div className="md:w-2/3 p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">
                                  {post.category}
                                </span>
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(post.publishedAt)}
                                </div>
                              </div>
                              <h3 className="font-bold text-xl mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 mb-4">{post.excerpt}</p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={post.author.avatar} 
                                    alt={post.author.name} 
                                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                                  />
                                  <div>
                                    <div className="text-sm font-medium">{post.author.name}</div>
                                    <div className="text-xs text-gray-500">{post.author.role}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={(e) => handleLikePost(post.id, e)}
                                    className={`flex items-center gap-1 transition-all duration-200 ${
                                      post.userHasLiked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
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
                          <svg className="animate-spin h-5 w-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    {/* Market Stats widget - Crypto specific */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                        Market Highlights
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-3 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">BTC</div>
                              <div className="text-xs text-gray-500">Bitcoin</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">$38,245.16</div>
                            <div className="text-xs text-green-600">+2.5%</div>
                          </div>
                        </li>
                        <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                                <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">ETH</div>
                              <div className="text-xs text-gray-500">Ethereum</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">$2,648.75</div>
                            <div className="text-xs text-red-600">-1.2%</div>
                          </div>
                        </li>
                        <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center">
                            <div className="h-8 w-8 mr-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">SOL</div>
                              <div className="text-xs text-gray-500">Solana</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">$95.33</div>
                            <div className="text-xs text-green-600">+4.7%</div>
                          </div>
                        </li>
                      </ul>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center">
                          View full market data
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    
                    {/* Categories widget */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-4">Categories</h3>
                      <ul className="space-y-2">
                        <li>
                          <button 
                            onClick={() => setActiveCategory('all')}
                            className={`w-full text-left flex justify-between items-center p-2 rounded-lg transition-colors ${
                              activeCategory === 'all' 
                                ? `bg-gradient-to-r from-indigo-500 to-purple-600 text-white`
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
                              className={`w-full text-left flex justify-between items-center p-2 rounded-lg transition-colors ${
                                activeCategory === category.id 
                                  ? `bg-gradient-to-r from-indigo-500 to-purple-600 text-white`
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
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subscribe widget */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-sm">
                      <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
                      <p className="mb-4">Subscribe to our newsletter to receive the latest cryptocurrency insights, market updates, and investment strategies.</p>
                      
                      <form className="space-y-3">
                        <input 
                          type="email" 
                          placeholder="Your email address" 
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        />
                        <button className="w-full py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
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
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                              <BarChart2 className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-indigo-600 transition-colors">Trading Guides</div>
                              <div className="text-sm text-gray-500">Technical analysis strategies</div>
                            </div>
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                              <Cpu className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-indigo-600 transition-colors">Blockchain Fundamentals</div>
                              <div className="text-sm text-gray-500">Understanding the technology</div>
                            </div>
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                              <Shield className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium group-hover:text-indigo-600 transition-colors">Security Best Practices</div>
                              <div className="text-sm text-gray-500">Protect your crypto assets</div>
                            </div>
                          </Link>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Crypto News widget */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                        Latest Crypto News
                      </h3>
                      <ul className="divide-y divide-gray-100">
                        <li className="py-3">
                          <a href="#" className="block hover:bg-gray-50 rounded p-2 -mx-2 transition-colors">
                            <div className="text-sm font-medium hover:text-indigo-600 transition-colors">SEC Approves Bitcoin ETF After Years of Deliberation</div>
                            <div className="text-xs text-gray-500 mt-1">2 hours ago</div>
                          </a>
                        </li>
                        <li className="py-3">
                          <a href="#" className="block hover:bg-gray-50 rounded p-2 -mx-2 transition-colors">
                            <div className="text-sm font-medium hover:text-indigo-600 transition-colors">Ethereum Completes Major Network Upgrade</div>
                            <div className="text-xs text-gray-500 mt-1">Yesterday</div>
                          </a>
                        </li>
                        <li className="py-3">
                          <a href="#" className="block hover:bg-gray-50 rounded p-2 -mx-2 transition-colors">
                            <div className="text-sm font-medium hover:text-indigo-600 transition-colors">Central Banks Evaluate Digital Currency Implementation</div>
                            <div className="text-xs text-gray-500 mt-1">2 days ago</div>
                          </a>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center">
                          Read all news
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Call to Action Section */}
            <section className="py-16 bg-gray-900 text-white">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl font-bold mb-6">Enhance Your Cryptocurrency Trading Strategy</h2>
                  <p className="text-xl text-gray-300 mb-8">
                    Join our community of crypto enthusiasts and gain access to premium analysis tools, 
                    market insights, and expert-led webinars on blockchain technology and digital assets.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      to="/register" 
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg font-medium transition-colors shadow-md"
                    >
                      Join the Community
                    </Link>
                    <Link 
                      to="/services/cryptocurrency-analysis/resources" 
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors backdrop-blur-sm"
                    >
                      Explore Resources
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Price Trends Section - Crypto specific */}
            <section className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Current Market Trends</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Stay informed with the latest price movements and market trends in the cryptocurrency ecosystem.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Bitcoin Card */}
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl overflow-hidden text-white shadow-lg p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Bitcoin</h3>
                        <div className="text-white/80 text-sm">BTC</div>
                      </div>
                      <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                          <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zm-141.651-35.33c4.937-32.999-20.191-50.739-54.55-62.573l11.146-44.702-27.213-6.781-10.851 43.524c-7.154-1.783-14.502-3.464-21.803-5.13l10.929-43.81-27.198-6.781-11.153 44.686c-5.922-1.349-11.735-2.682-17.377-4.084l.031-.14-37.53-9.37-7.239 29.062s20.191 4.627 19.765 4.913c11.022 2.751 13.014 10.044 12.68 15.825l-12.696 50.925c.76.194 1.744.473 2.829.907-.907-.225-1.876-.473-2.876-.713l-17.796 71.338c-1.349 3.348-4.767 8.37-12.471 6.464.271.395-19.78-4.937-19.78-4.937l-13.51 31.147 35.414 8.827c6.588 1.651 13.045 3.379 19.4 5.006l-11.262 45.213 27.182 6.781 11.153-44.733a1038.209 1038.209 0 0 0 21.687 5.627l-11.115 44.523 27.213 6.781 11.262-45.128c46.404 8.781 81.299 5.239 95.986-36.727 11.836-33.79-.589-53.281-25.004-65.991 17.78-4.098 31.174-15.792 34.747-39.949zm-62.177 87.179c-8.41 33.79-65.308 15.523-83.755 10.943l14.944-59.899c18.446 4.603 77.6 13.717 68.811 48.956zm8.417-87.667c-7.673 30.736-55.031 15.12-70.393 11.292l13.548-54.327c15.363 3.828 64.836 10.973 56.845 43.035z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-3xl font-bold mb-2">$38,245.16</div>
                      <div className="flex items-center text-white/90">
                        <div className="flex items-center text-green-300 mr-3">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>2.5%</span>
                        </div>
                        <span className="text-sm">Last 24h</span>
                      </div>
                    </div>
                    <div className="h-16 bg-white/10 rounded-lg backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 flex items-end">
                        <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                          <path
                            d="M0 60 L20 50 L40 55 L60 40 L80 45 L100 30 L120 35 L140 15 L160 25 L180 10 L200 20 L200 60 L0 60"
                            fill="rgba(255,255,255,0.2)"
                          />
                          <path
                            d="M0 60 L20 50 L40 55 L60 40 L80 45 L100 30 L120 35 L140 15 L160 25 L180 10 L200 20"
                            fill="none"
                            stroke="rgba(255,255,255,0.7)"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ethereum Card */}
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl overflow-hidden text-white shadow-lg p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Ethereum</h3>
                        <div className="text-white/80 text-sm">ETH</div>
                      </div>
                      <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor">
                          <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-3xl font-bold mb-2">$2,648.75</div>
                      <div className="flex items-center text-white/90">
                        <div className="flex items-center text-red-300 mr-3">
                          <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                          <span>1.2%</span>
                        </div>
                        <span className="text-sm">Last 24h</span>
                      </div>
                    </div>
                    <div className="h-16 bg-white/10 rounded-lg backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 flex items-end">
                        <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                          <path
                            d="M0 30 L20 40 L40 35 L60 45 L80 30 L100 40 L120 35 L140 45 L160 30 L180 40 L200 20 L200 60 L0 60"
                            fill="rgba(255,255,255,0.2)"
                          />
                          <path
                            d="M0 30 L20 40 L40 35 L60 45 L80 30 L100 40 L120 35 L140 45 L160 30 L180 40 L200 20"
                            fill="none"
                            stroke="rgba(255,255,255,0.7)"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Solana Card */}
                  <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl overflow-hidden text-white shadow-lg p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Solana</h3>
                        <div className="text-white/80 text-sm">SOL</div>
                      </div>
                      <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor">
                          <path d="M256 48C256 21.49 277.5 0 304 0H528C554.5 0 576 21.49 576 48V96C576 122.5 554.5 144 528 144H304C277.5 144 256 122.5 256 96V48zM571.4 231.8C574.4 240.6 576 249.8 576 259.1C576 267.1 574.9 276 572.1 283.9C569.4 292.6 565.1 300.6 559.6 307.7C553.5 315.1 545.7 321.6 536.6 326.3C527.8 331.3 517.3 333.6 506.3 334.1C494.5 334.5 482.3 333.1 470.3 329.9L452.2 495.9C450.5 511.2 437.4 523.8 421.9 523.8H154.1C138.6 523.8 125.5 511.2 123.8 495.9L105.7 329.9C93.73 333.1 81.53 334.5 69.73 334.1C58.7 333.6 48.21 331.3 39.41 326.3C30.2 321.6 22.46 315.1 16.39 307.7C10.04 300.6 5.811 292.6 3.075 283.9C.243 276 -7.325e-08 267.1 0 259.1C7.342e-08 249.8 1.65 240.6 4.603 231.8C7.731 222.6 12.29 214.4 18.39 206.9C24.2 200.1 31.31 193.8 39.41 188.6C48.21 183.6 58.7 180.5 69.73 180C79.67 179.6 89.4 181 98.97 184L415 1.464C428.7-4.847 444.4 3.892 450.7 17.55C456.1 31.21 448.2 46.95 434.5 53.26L94.77 240H481.2L445.2 264.2C431.5 270.5 423.6 286.3 429.9 299.9C436.3 313.6 452 321.5 465.7 315.2L481.2 307.8L487.8 329.9C475.8 333.1 463.6 334.5 451.8 334.1C440.8 333.6 430.2 331.3 421.4 326.3C412.2 321.6 404.5 315.1 398.4 307.7C392.1 300.6 387.8 292.6 385.1 283.9C382.2 276 382 267.1 382 259.1C382 249.8 383.7 240.6 386.6 231.8C389.7 222.6 394.3 214.4 400.4 206.9C406.2 200.1 413.3 193.8 421.4 188.6C430.2 183.6 440.8 180.5 451.8 180C462.2 179.6 472.3 181 482.2 184.4L567.4 53.26C581.1 46.95 573.2 31.21 579.6 17.55C585.9 3.892 601.6-4.847 615.3 1.464L571.4 231.8z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-3xl font-bold mb-2">$95.33</div>
                      <div className="flex items-center text-white/90">
                        <div className="flex items-center text-green-300 mr-3">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>4.7%</span>
                        </div>
                        <span className="text-sm">Last 24h</span>
                      </div>
                    </div>
                    <div className="h-16 bg-white/10 rounded-lg backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 flex items-end">
                        <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                          <path
                            d="M0 45 L20 40 L40 42 L60 35 L80 30 L100 25 L120 20 L140 15 L160 10 L180 5 L200 15 L200 60 L0 60"
                            fill="rgba(255,255,255,0.2)"
                          />
                          <path
                            d="M0 45 L20 40 L40 42 L60 35 L80 30 L100 25 L120 20 L140 15 L160 10 L180 5 L200 15"
                            fill="none"
                            stroke="rgba(255,255,255,0.7)"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cardano Card */}
                  <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl overflow-hidden text-white shadow-lg p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Cardano</h3>
                        <div className="text-white/80 text-sm">ADA</div>
                      </div>
                      <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                          <path d="M282.6 78.1c8-27.3 33-46 61.4-47h1c4.6 0 8.4 3.5 8.9 8 .5 4.8-3.1 9.1-7.9 9.1h-.8c-19.7 .7-36.6 13.2-41.8 31.9-5.2-18.8-22.1-31.2-41.8-31.9h-.8c-4.8 0-8.4-4.3-7.9-9.1 .5-4.5 4.3-8 8.9-8h1c28.4 1 53.4 19.7 61.4 47zM503.2 241.6c-1-1.9-2.2-3.8-3.3-5.7C485.8 208.9 448.8 168 335.5 168c-96.3 0-101.7 43.6-101.7 75.9c0 67.4 33.5 104.5 135.1 149.2c3.6 1.6 7.2 3.2 10.7 4.8c4.1 2 6.9 6.1 6.9 10.7c0 6.6-5.3 11.9-11.9 11.9c-1.4 0-2.9-.3-4.3-.8C263.7 384 221.4 348.9 221.4 243.9c0-48.8 18.6-112.8 114.1-112.8c98.6 0 127.1 35.7 137.6 61C478.8 203.6 512 245.9 512 302.3c0 76.1-62.1 132.1-118.8 131.7c-4.8 0-8.7-3.9-8.7-8.7s3.9-8.7 8.7-8.7c47 .4 101.2-49.4 101.2-114.2c0-46.6-26.6-80.5-30.2-84.8zM215.8 241.8c0-23-3.2-52.1-40.1-52.1c-35.6 0-40.1 31.7-40.1 52.1c0 50.5 16.2 71.3 37.1 83.7c2.9 1.4 4.5 4.3 4.5 7.4c0 4.7-3.8 8.5-8.5 8.5c-1 0-1.9-.2-2.9-.5C133.2 324.7 117 291.3 117 241.8c0-31.7 8.4-70.8 58.7-70.8c54.8 0 58.7 42.9 58.7 70.8c0 49.5-16.2 82.9-48.8 99.1c-1 .3-1.9 .5-2.9 .5c-4.7 0-8.5-3.8-8.5-8.5c0-3.1 1.6-6 4.5-7.4C199.5 313.1 215.8 292.3 215.8 241.8zM122.4 91.7c10.3-27.9 36.6-45.5 65.5-46.3h1c5 0 9.1 3.7 9.4 8.6 .4 5.2-3.7 9.7-8.9 9.7h-.5c-21.3 .6-39.3 14.3-45.3 34.5-6.1-20.2-24.1-33.9-45.3-34.5h-.5c-5.2 0-9.2-4.5-8.9-9.7 .4-4.9 4.4-8.6 9.4-8.6h1c28.9 .8 55.2 18.3 65.5 46.3l8.9 23.9 8.9-23.9zm207.4 162.8c2.5-3.3 7.2-4 10.5-1.5s4 7.2 1.5 10.5c-1.5 2-3 4-4.5 6.1-21.6 29-57.9 77.5-132.3 77.5c-77.9 0-113.7-51.7-132.6-77.8c-1.3-1.8-2.7-3.7-4.2-5.8C66 259.9 66.7 255 70 252.4s7.9-.7 10.5 2.9c1.4 1.9 2.8 3.8 4.1 5.7c16.9 23.3 47.7 65.8 120.6 65.8C273.1 326.8 304.3 281.3 329.7 254.5z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-3xl font-bold mb-2">$0.57</div>
                      <div className="flex items-center text-white/90">
                        <div className="flex items-center text-green-300 mr-3">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>1.3%</span>
                        </div>
                        <span className="text-sm">Last 24h</span>
                      </div>
                    </div>
                    <div className="h-16 bg-white/10 rounded-lg backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 flex items-end">
                        <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                          <path
                            d="M0 40 L20 38 L40 42 L60 35 L80 38 L100 30 L120 32 L140 28 L160 25 L180 20 L200 25 L200 60 L0 60"
                            fill="rgba(255,255,255,0.2)"
                          />
                          <path
                            d="M0 40 L20 38 L40 42 L60 35 L80 38 L100 30 L120 32 L140 28 L160 25 L180 20 L200 25"
                            fill="none"
                            stroke="rgba(255,255,255,0.7)"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <Link
                    to="/services/cryptocurrency-analysis/price-tracker"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View full price tracker
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      
      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-colors z-40 group"
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
      
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 relative"
          >
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Search Cryptocurrency Articles</h2>
            
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type keywords to search..." 
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  autoFocus
                />
                <Search className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
              
              <div className="flex justify-end mt-4">
                <button 
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-sm"
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
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                  H
                </div>
                <div className="text-xl font-bold">HandyWriterz</div>
              </div>
              <p className="text-gray-400 mb-4">
                Comprehensive cryptocurrency analysis and insights for investors, traders, and blockchain enthusiasts.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Crypto Glossary</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Market Analysis</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Trading Strategies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security Tips</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blockchain 101</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Subscribe</h3>
              <p className="text-gray-400 mb-4">Stay updated with the latest cryptocurrency news and analysis.</p>
              <form className="space-y-2">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button 
                  type="submit" 
                  className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg text-white font-medium transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} HandyWriterz. All rights reserved.
            </div>
            <div className="flex space-x-4 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CryptocurrencyAnalysis;