/**
 * Admin Profile API
 * 
 * Simple API endpoint to lookup admin profiles by email
 * This is used for the master code authentication flow
 * 
 * @file src/api/admin/profile.js
 */

import { databases } from '../../lib/appwrite';
import { COLLECTIONS } from '../../lib/appwrite';
import { Query } from 'appwrite';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  
  try {
    // Get database ID from env or use default
    const databaseId = process.env.APPWRITE_DATABASE_ID || '09202502';
    
    // Query admin profiles by email
    const profiles = await databases.listDocuments(
      databaseId,
      COLLECTIONS.ADMIN_PROFILES,
      [Query.equal('email', email)]
    );
    
    if (profiles.documents.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No admin profile found for this email' 
      });
    }
    
    // Return the admin profile
    return res.status(200).json({ 
      success: true, 
      profile: profiles.documents[0] 
    });
  } catch (error) {
    console.error('Error looking up admin profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error looking up admin profile' 
    });
  }
} 