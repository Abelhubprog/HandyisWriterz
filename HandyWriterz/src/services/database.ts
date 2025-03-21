import { supabase } from '@/lib/supabase';

export async function getItems(tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    console.error('Error fetching items:', error);
    return null;
  }

  return data;
}
