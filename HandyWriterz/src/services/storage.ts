import { supabase } from '@/lib/supabase';

export async function uploadFile(bucketName: string, filePath: string, file: File) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  return data;
}

export async function getFileUrl(bucketName: string, filePath: string) {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
}
