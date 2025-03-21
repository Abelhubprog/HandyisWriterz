export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin' | 'writer';
  status?: 'active' | 'inactive' | 'suspended';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error?: Error | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}
