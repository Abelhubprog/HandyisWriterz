import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface DatabaseContextType {
  isConnected: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({ isConnected: false });

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Subscribe to realtime presence
    const channel = supabase.channel('system_health')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          toast.success('Connected to database');
        }
        if (status === 'CLOSED') {
          toast.error('Lost database connection');
        }
        if (status === 'CHANNEL_ERROR') {
          toast.error('Database connection error');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ isConnected: true }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}