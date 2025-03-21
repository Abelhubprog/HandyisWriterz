import { supabase } from '@/lib/supabase';

export async function callFunction(functionName: string, params?: any) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: params,
  });

  if (error) {
    console.error('Error calling function:', error);
    return null;
  }

  return data;
}
