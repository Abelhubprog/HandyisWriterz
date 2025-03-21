import { Box, Skeleton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface ContentSkeletonProps {
  variant?: 'email' | 'document' | 'card' | 'table';
  count?: number;
}

const MotionSkeleton = motion(Skeleton);

const skeletonAnimation = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1 },
  transition: {
    repeat: Infinity,
    repeatType: 'reverse' as const,
    duration: 1,
  },
};

export default function ContentSkeleton({
  variant = 'card',
  count = 1,
}: ContentSkeletonProps) {
  const theme = useTheme();

  const renderEmailSkeleton = () => (
    <Box sx={{ display: 'flex', mb: 2 }}>
      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" />
      </Box>
      <Skeleton variant="rectangular" width={100} height={32} />
    </Box>
  );

  const renderDocumentSkeleton = () => (
    <Box sx={{ mb: 2 }}>
      <Skeleton variant="rectangular" height={200} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" />
    </Box>
  );

  const renderCardSkeleton = () => (
    <Box
      sx={{
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mb: 2,
      }}
    >
      <Skeleton variant="text" width="80%" sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={100} />
    </Box>
  );

  const renderTableSkeleton = () => (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', mb: 1 }}>
        {[30, 40, 30].map((width, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${width}%`}
            sx={{ mr: i < 2 ? 2 : 0 }}
          />
        ))}
      </Box>
      {[...Array(3)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', mb: 1 }}>
          {[30, 40, 30].map((width, j) => (
            <Skeleton
              key={j}
              variant="text"
              width={`${width}%`}
              sx={{ mr: j < 2 ? 2 : 0 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'email':
        return renderEmailSkeleton();
      case 'document':
        return renderDocumentSkeleton();
      case 'table':
        return renderTableSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={skeletonAnimation}
    >
      {[...Array(count)].map((_, index) => (
        <Box key={index}>{renderSkeleton()}</Box>
      ))}
    </motion.div>
  );
}
