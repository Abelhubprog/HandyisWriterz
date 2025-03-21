import { databases, DATABASE_ID, COLLECTIONS } from './appwriteClient';
import { ID, Query } from 'appwrite';

// Function to sync a Clerk user to Appwrite
export const syncUserToAppwrite = async (clerkUser: any) => {
    if (!clerkUser) return null;

    try {
        // Check if user already exists in Appwrite
        const existingUsers = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.equal('clerkId', clerkUser.id)]
        );

        if (existingUsers.documents.length > 0) {
            // User exists, update user data
            const existingUser = existingUsers.documents[0];
            
            const userData = {
                name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
                email: clerkUser.emailAddresses[0]?.emailAddress || existingUser.email,
                avatar: clerkUser.imageUrl || existingUser.avatar,
                lastLogin: new Date().toISOString(),
            };

            return await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                existingUser.$id,
                userData
            );
        } else {
            // User doesn't exist, create new user
            const userData = {
                clerkId: clerkUser.id,
                name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                role: 'user', // Default role for new users
                avatar: clerkUser.imageUrl || `https://ui-avatars.com/api/?name=${clerkUser.firstName}+${clerkUser.lastName}&background=random`,
                status: 'active',
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            };

            return await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                ID.unique(),
                userData
            );
        }
    } catch (error) {
        console.error('Error syncing user to Appwrite:', error);
        throw error;
    }
};

// Function to get a user's Appwrite record by Clerk ID
export const getUserByClerkId = async (clerkId: string) => {
    try {
        const users = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.equal('clerkId', clerkId)]
        );

        return users.documents.length > 0 ? users.documents[0] : null;
    } catch (error) {
        console.error('Error getting user by Clerk ID:', error);
        return null;
    }
};

// Check if a user has admin privileges
export const isAdmin = async (clerkId: string) => {
    try {
        const user = await getUserByClerkId(clerkId);
        return user && (user.role === 'admin' || user.role === 'editor');
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

// Promote a user to admin (for use in Appwrite Console or admin dashboard)
export const promoteToAdmin = async (userId: string) => {
    try {
        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            userId,
            { role: 'admin' }
        );
    } catch (error) {
        console.error('Error promoting user to admin:', error);
        throw error;
    }
};

// Update a user's status (active/inactive/pending)
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'pending') => {
    try {
        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            userId,
            { status }
        );
    } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
    }
};

export default {
    syncUserToAppwrite,
    getUserByClerkId,
    isAdmin,
    promoteToAdmin,
    updateUserStatus
}; 