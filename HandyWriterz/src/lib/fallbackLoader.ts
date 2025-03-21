/**
 * Utility functions for loading fallback data when the database is unavailable
 */

// Import fallback data
import allPosts from '../fallbacks/all_posts.json';
import profiles from '../fallbacks/profiles.json';
import adultHealthNursingPosts from '../fallbacks/posts_adult-health-nursing.json';
import mentalHealthNursingPosts from '../fallbacks/posts_mental-health-nursing.json';
import childNursingPosts from '../fallbacks/posts_child-nursing.json';
import specialEducationPosts from '../fallbacks/posts_special-education.json';
import socialWorkPosts from '../fallbacks/posts_social-work.json';
import aiPosts from '../fallbacks/posts_ai.json';
import cryptoPosts from '../fallbacks/posts_crypto.json';

// Map of service types to their fallback data
const servicePostsMap: Record<string, any[]> = {
  'adult-health-nursing': adultHealthNursingPosts,
  'mental-health-nursing': mentalHealthNursingPosts,
  'child-nursing': childNursingPosts,
  'special-education': specialEducationPosts,
  'social-work': socialWorkPosts,
  'ai': aiPosts,
  'crypto': cryptoPosts
};

/**
 * Get fallback posts for a specific service type
 * @param serviceType The service type to get posts for
 * @returns Array of posts for the service type
 */
export function getFallbackPostsByService(serviceType: string): any[] {
  return servicePostsMap[serviceType] || [];
}

/**
 * Get all fallback posts
 * @returns Array of all posts
 */
export function getAllFallbackPosts(): any[] {
  return allPosts;
}

/**
 * Get fallback profiles
 * @returns Array of profiles
 */
export function getFallbackProfiles(): any[] {
  return profiles;
}

/**
 * Get a fallback post by ID
 * @param postId The ID of the post to get
 * @returns The post or null if not found
 */
export function getFallbackPostById(postId: string): any | null {
  return allPosts.find(post => post.id === postId) || null;
}

/**
 * Get a fallback profile by ID
 * @param profileId The ID of the profile to get
 * @returns The profile or null if not found
 */
export function getFallbackProfileById(profileId: string): any | null {
  return profiles.find(profile => profile.id === profileId) || null;
}

/**
 * Get a fallback profile by user ID
 * @param userId The user ID of the profile to get
 * @returns The profile or null if not found
 */
export function getFallbackProfileByUserId(userId: string): any | null {
  return profiles.find(profile => profile.user_id === userId) || null;
}

/**
 * Check if fallback data is available
 * This can be used to determine if the fallback data has been generated
 * @returns True if fallback data is available
 */
export function isFallbackDataAvailable(): boolean {
  try {
    return allPosts.length > 0 && profiles.length > 0;
  } catch (e) {
    console.warn('Error checking fallback data availability:', e);
    return false;
  }
} 