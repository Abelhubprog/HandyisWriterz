import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const uploadImage = async (file: File, bucket: string = 'post-images') => {
  try {
    if (!file) throw new Error('No file provided');

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (path: string, bucket: string = 'post-images') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const getImageUrl = (path: string, bucket: string = 'post-images') => {
  return supabase.storage
    .from(bucket)
    .getPublicUrl(path)
    .data.publicUrl;
}; 