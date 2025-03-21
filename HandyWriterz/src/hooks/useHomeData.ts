// src/hooks/useHomeData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useHomeData() {
  return useQuery(['home'], async () => {
    const [featuredPosts, popularPosts, categories, featuredCourses] = await Promise.all([
      supabase.from('posts').select('*').eq('featured', true).limit(5),
      supabase.from('posts').select('*').order('views', { ascending: false }).limit(5),
      supabase.from('categories').select('*'),
      supabase.from('courses').select('*').eq('featured', true).limit(3)
    ]);
    
    return {
      featuredPosts: featuredPosts.data,
      popularPosts: popularPosts.data,
      categories: categories.data,
      featuredCourses: featuredCourses.data
    };
  });
}