import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  avatar?: string;
  avatarUrl?: string; // Some components use avatarUrl, others use avatar
}

export const useAuth = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  // Transform Clerk user to our User interface
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
    role: (clerkUser.publicMetadata?.role as "admin" | "editor" | "viewer") || "viewer",
    avatar: clerkUser.imageUrl,
    avatarUrl: clerkUser.imageUrl
  } : null;

  const login = async () => {
    // Clerk handles login through its own UI components
    // This is just a placeholder to maintain the interface
    return null;
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return {
    user,
    loading: !isLoaded,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin"
  };
};
