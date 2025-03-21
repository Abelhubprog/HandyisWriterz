import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { Save, Image, Tag as TagIcon, X, Plus, ArrowLeft } from 'lucide-react';
import { adminContentService, ContentItem } from '@/services/adminContentService';

// Dynamic import of the rich text editor to avoid SSR issues
const Editor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-100" />,
});

interface ContentEditorProps {
  contentId?: string;
}

export default function ContentEditor({ contentId }: ContentEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<Partial<ContentItem>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    service: '',
    tags: [],
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
    isPaywalled: false,
  });
  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (contentId) {
      fetchContent();
    }
  }, [contentId]);

  const fetchContent = async () => {
    if (!contentId) return;

    setLoading(true);
    try {
      const response = await adminContentService.getContentItems(
        { searchQuery: contentId },
        { field: 'updatedAt', direction: 'desc' },
        1,
        1
      );
      if (response.items.length > 0) {
        setContent(response.items[0]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content');
    }
    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSeoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContent((prev) => ({
      ...prev,
      seo: {
        ...prev.seo!,
        [name]: value,
      },
    }));
  };

  const handleEditorChange = (value: string) => {
    setContent((prev) => ({
      ...prev,
      content: value,
    }));
  };

  const handleFeaturedImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeaturedImageFile(file);
    try {
      const imageUrl = await adminContentService.uploadFeaturedImage(file);
      if (imageUrl) {
        setContent((prev) => ({
          ...prev,
          featuredImage: imageUrl,
        }));
        toast.success('Featured image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading featured image:', error);
      toast.error('Failed to upload featured image');
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setContent((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()],
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setContent((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    setContent((prev) => ({
      ...prev,
      seo: {
        ...prev.seo!,
        keywords: [...(prev.seo?.keywords || []), newKeyword.trim()],
      },
    }));
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    setContent((prev) => ({
      ...prev,
      seo: {
        ...prev.seo!,
        keywords: prev.seo?.keywords?.filter((k) => k !== keyword) || [],
      },
    }));
  };

  const handleSubmit = async (status?: 'draft' | 'published') => {
    setSaving(true);
    try {
      const contentData = {
        ...content,
        status: status || content.status,
      };

      if (contentId) {
        await adminContentService.updateContent(contentId, contentData);
        toast.success('Content updated successfully');
      } else {
        await adminContentService.createContent(contentData as any);
        toast.success('Content created successfully');
      }

      router.push('/admin/content');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/content')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Button>
          <h1 className="text-2xl font-bold">
            {contentId ? 'Edit Content' : 'New Content'}
          </h1>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={saving}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit('published')}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={content.title}
              onChange={handleInputChange}
              placeholder="Enter content title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={content.slug}
              onChange={handleInputChange}
              placeholder="enter-content-slug"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Editor
              value={content.content}
              onChange={handleEditorChange}
              placeholder="Write your content here..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              value={content.excerpt}
              onChange={handleInputChange}
              placeholder="Enter a brief excerpt"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 font-semibold">Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select
                  value={content.service}
                  onValueChange={(value) =>
                    setContent((prev) => ({ ...prev, service: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult-health-nursing">
                      Adult Health Nursing
                    </SelectItem>
                    <SelectItem value="mental-health-nursing">
                      Mental Health Nursing
                    </SelectItem>
                    <SelectItem value="child-nursing">
                      Child Nursing
                    </SelectItem>
                    <SelectItem value="crypto">
                      Cryptocurrency
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById('featured-image')?.click()
                    }
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {content.featuredImage
                      ? 'Change Image'
                      : 'Upload Image'}
                  </Button>
                  <input
                    id="featured-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFeaturedImageChange}
                  />
                </div>
                {content.featuredImage && (
                  <img
                    src={content.featuredImage}
                    alt="Featured"
                    className="mt-2 rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {content.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full p-1 hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="paywall"
                  checked={content.isPaywalled}
                  onCheckedChange={(checked) =>
                    setContent((prev) => ({
                      ...prev,
                      isPaywalled: checked,
                    }))
                  }
                />
                <Label htmlFor="paywall">Paywall Content</Label>
              </div>

              {content.isPaywalled && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={content.price || ''}
                    onChange={handleInputChange}
                    placeholder="Enter price"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-4 font-semibold">SEO Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  name="title"
                  value={content.seo?.title}
                  onChange={handleSeoChange}
                  placeholder="Enter SEO title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">
                  Meta Description
                </Label>
                <Textarea
                  id="seoDescription"
                  name="description"
                  value={content.seo?.description}
                  onChange={handleSeoChange}
                  placeholder="Enter meta description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {content.seo?.keywords?.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{keyword}</span>
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-1 rounded-full p-1 hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add a keyword"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddKeyword}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 