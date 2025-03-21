declare module '@reownapp/appkit-react' {
  import { ReactNode } from 'react';

  export interface AppKitClientSession {
    userId: string;
    address?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }

  export interface AppKitConfig {
    projectId: string;
    apiKey: string;
    environment?: 'production' | 'development';
    theme?: 'light' | 'dark' | 'auto';
    defaultChain?: string;
    supportedChains?: string[];
    onSuccess?: (session: AppKitClientSession) => void;
    onError?: (error: Error) => void;
  }

  export interface AppKitProviderProps {
    children: ReactNode;
    config: AppKitConfig;
  }

  export class AppKitClient {
    static connect(): Promise<void>;
    static disconnect(): Promise<void>;
    static getSession(): Promise<AppKitClientSession | null>;
    static onAuthStateChanged(callback: (session: AppKitClientSession | null) => void): () => void;
  }

  export function AppKitProvider(props: AppKitProviderProps): JSX.Element;

  export function AppKitButton(props: {
    mode?: 'auto' | 'light' | 'dark';
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    className?: string;
  }): JSX.Element;
}
