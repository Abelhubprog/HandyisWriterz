import { supabase } from '@/utils/supabase';

export interface UploadOptions {
  bucket?: string;
  path?: string;
  contentType?: string;
  cacheControl?: string;
}

export const storageService = {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<{ path: string; url: string } | null> {
    try {
      const {
        bucket = 'media',
        path = '',
        contentType = file.type,
        cacheControl = '3600'
      } = options;

      // Generate unique file path
      const timestamp = new Date().getTime();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const filePath = `${path}${timestamp}-${cleanFileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType,
          cacheControl,
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
      console.error('Upload error:', error);
      return null;
    }
  },

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(path: string, bucket: string = 'media'): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  },

  /**
   * Get a temporary URL for a private file
   */
  async getSignedUrl(
    path: string,
    bucket: string = 'media',
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  },

  /**
   * List files in a bucket/folder
   */
  async listFiles(
    bucket: string = 'media',
    path: string = '',
    options: { limit?: number; offset?: number; sortBy?: { column: string; order: 'asc' | 'desc' } } = {}
  ) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('List files error:', error);
      return null;
    }
  },

  /**
   * Create a new bucket
   */
  async createBucket(
    bucketId: string,
    options: { public?: boolean; fileSizeLimit?: number } = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase.storage.createBucket(bucketId, {
        public: options.public,
        fileSizeLimit: options.fileSizeLimit,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Create bucket error:', error);
      return false;
    }
  },

  /**
   * Get bucket details
   */
  async getBucket(bucketId: string) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get bucket error:', error);
      return null;
    }
  },

  /**
   * Initialize required storage buckets
   */
  async initializeBuckets(): Promise<boolean> {
    try {
      // Create required buckets if they don't exist
      const requiredBuckets = [
        { id: 'media', public: true },
        { id: 'documents', public: false },
        { id: 'avatars', public: true }
      ];

      for (const bucket of requiredBuckets) {
        const exists = await this.getBucket(bucket.id);
        if (!exists) {
          await this.createBucket(bucket.id, {
            public: bucket.public,
            fileSizeLimit: 10 * 1024 * 1024 // 10MB
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Initialize buckets error:', error);
      return false;
    }
  }
};
