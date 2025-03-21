/**
 * API Routes Index
 * 
 * This file combines all API routes and exports a single router.
 * 
 * @file src/api/routes/index.ts
 */

import express from 'express';
import postRoutes from './postRoutes';
// Import other routes as they are created

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'HandyWriterz API is running'
  });
});

// Mount routes
router.use('/posts', postRoutes);
// Mount other routes as they are created

export default router; 