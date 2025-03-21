import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Box, Button, Skeleton, Divider, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { getBlogPosts } from '../services/blogService';
import { BlogPost } from '../types/blog';
import PageHeader from '../components/common/PageHeader';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  paddingTop: '56.25%', // 16:9 aspect ratio
  position: 'relative',
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  zIndex: 1,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
}));

const Blog: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        const posts = await getBlogPosts();
        setBlogPosts(posts);
        setError(null);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const renderSkeletons = () => {
    return Array(6)
      .fill(null)
      .map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
          <Card sx={{ height: '100%' }}>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" height={30} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="text" height={100} />
              <Skeleton variant="text" height={40} width="40%" />
            </CardContent>
          </Card>
        </Grid>
      ));
  };

  return (
    <ErrorBoundary>
      <Helmet>
        <title>Blog | HandyWriterz - Academic Writing Insights</title>
        <meta
          name="description"
          content="Explore the latest insights, tips, and trends in academic writing from HandyWriterz experts."
        />
      </Helmet>

      <PageHeader
        title="HandyWriterz Blog"
        subtitle="Insights, Tips, and Trends in Academic Writing"
        imagePath="/images/blog-header.jpg"
      />

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {error ? (
          <Box textAlign="center" py={5}>
            <Typography variant="h5" color="error" gutterBottom>
              {error}
            </Typography>
            <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Box>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={4}>
              {loading
                ? renderSkeletons()
                : blogPosts.map((post) => (
                    <Grid item xs={12} sm={6} md={4} key={post.id} component={motion.div} variants={itemVariants}>
                      <StyledCard>
                        <Box sx={{ position: 'relative' }}>
                          <StyledCardMedia
                            image={post.coverImage || '/images/blog-placeholder.jpg'}
                            title={post.title}
                          />
                          <CategoryChip label={post.category} size="small" />
                        </Box>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="caption" color="text.secondary" component="p">
                            {format(new Date(post.publishedAt), 'MMMM dd, yyyy')}
                          </Typography>
                          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }}>
                            {post.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {post.excerpt}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Button
                              component={Link}
                              to={`/blog/${post.slug}`}
                              variant="outlined"
                              color="primary"
                              size={isMobile ? "small" : "medium"}
                            >
                              Read More
                            </Button>
                          </Box>
                        </CardContent>
                      </StyledCard>
                    </Grid>
                  ))}
            </Grid>

            {!loading && blogPosts.length === 0 && (
              <Box textAlign="center" py={5}>
                <Typography variant="h5" gutterBottom>
                  No blog posts available yet.
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Check back soon for new content!
                </Typography>
              </Box>
            )}
          </motion.div>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default Blog; 