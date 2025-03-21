/**
 * Post API Routes
 * 
 * This file defines the API routes for post management.
 * 
 * @file src/api/routes/postRoutes.ts
 */

import express from 'express';
import { PostController } from '../controllers/PostController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@/models/User';

const router = express.Router();

/**
 * @route   GET /api/posts
 * @desc    Get all posts with pagination and filtering
 * @access  Public (with content filtering based on user role)
 */
router.get('/', authenticateJWT({ required: false }), PostController.list);

/**
 * @route   GET /api/posts/search
 * @desc    Search posts by title or content
 * @access  Public (with content filtering based on user role)
 */
router.get('/search', authenticateJWT({ required: false }), PostController.search);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a post by ID
 * @access  Public (with content filtering based on user role)
 */
router.get('/:id', authenticateJWT({ required: false }), PostController.getById);

/**
 * @route   GET /api/posts/slug/:slug
 * @desc    Get a post by slug
 * @access  Public (with content filtering based on user role)
 */
router.get('/slug/:slug', authenticateJWT({ required: false }), PostController.getBySlug);

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private (Editors and Admins only)
 */
router.post(
  '/', 
  authenticateJWT({ required: true }),
  authorizeRoles([UserRole.ADMIN, UserRole.EDITOR]),
  PostController.create
);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (Post author, Editors, and Admins only)
 */
router.put(
  '/:id', 
  authenticateJWT({ required: true }),
  PostController.update
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (Post author, Editors, and Admins only)
 */
router.delete(
  '/:id', 
  authenticateJWT({ required: true }),
  PostController.delete
);

/**
 * @route   POST /api/posts/:id/publish
 * @desc    Publish a post
 * @access  Private (Editors and Admins only)
 */
router.post(
  '/:id/publish', 
  authenticateJWT({ required: true }),
  authorizeRoles([UserRole.ADMIN, UserRole.EDITOR]),
  PostController.publish
);

/**
 * @route   POST /api/posts/:id/unpublish
 * @desc    Unpublish a post
 * @access  Private (Post author, Editors, and Admins only)
 */
router.post(
  '/:id/unpublish', 
  authenticateJWT({ required: true }),
  PostController.unpublish
);

export default router; 