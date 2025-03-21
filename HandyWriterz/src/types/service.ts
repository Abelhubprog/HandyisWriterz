// Service page and related types

export interface ServicePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  featured_image: string;
  created_at: string;
  updated_at: string;
  published: boolean;
}

export interface ServicePageComment {
  id: string;
  service_page_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface ServicePageLike {
  id: string;
  service_page_id: string;
  user_id: string;
  created_at: string;
}
