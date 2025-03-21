/**
 * Authentication Middleware
 * 
 * This file provides middleware functions for authenticating and authorizing API requests.
 * 
 * @file src/api/middleware/auth.ts
 */

import { Request, Response, NextFunction } from 'express';
import { Account, Client, ID } from 'appwrite';
import { UserRepository, UserRole } from '@/models/User';
import { appwriteConfig } from '@/config/appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

const account = new Account(client);

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authenticate JWT token from cookies or Authorization header
 * 
 * @param options - Configuration options
 * @returns Express middleware function
 */
export const authenticateJWT = (options: { required: boolean }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Try to get the current session
      const session = await account.getSession('current');
      
      if (session) {
        // Get the user from the database
        const user = await UserRepository.getById(session.userId);
        
        if (user) {
          // Attach user to request
          req.user = user;
          
          // Update last login time
          await UserRepository.updateLastLogin(user.$id);
          
          return next();
        }
      }
      
      // No valid session found
      if (options.required) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Authentication not required, continue
      return next();
    } catch (error) {
      // Handle Appwrite error (likely no valid session)
      if (options.required) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Authentication not required, continue
      return next();
    }
  };
};

/**
 * Authorize user based on roles
 * 
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 */
export const authorizeRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    // User has permission, continue
    next();
  };
};

/**
 * Verify that a user is active
 * 
 * @returns Express middleware function
 */
export const requireActiveUser = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }
    
    // User is active, continue
    next();
  };
}; 