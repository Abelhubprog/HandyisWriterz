import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiSave, 
  FiArrowLeft, 
  FiImage,
  FiSettings
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast/use-toast';

type ServiceType = 'adult-health-nursing' | 'mental-health-nursing' | 'child-nursing' | 'crypto' | 'ai';

interface ServiceSettings {
  title: string;
  description: string;
  bannerImage: string;
  icon: string;
  featuredContent: string[];
  displayOptions: {
    showBanner: boolean;
    showFeaturedPosts: boolean;
    showCategories: boolean;
    showTags: boolean;
    codeBlockStyle: 'default' | 'github' | 'vscode' | 'atom';
    postsPerPage: number;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    structuredData: string;
  };
}

const defaultSettings: ServiceSettings = {
  title: '',
  description: '',
  bannerImage: '',
  icon: '',
  featuredContent: [],
  displayOptions: {
    showBanner: true,
    showFeaturedPosts: true,
    showCategories: true,
    showTags: true,
    codeBlockStyle: 'default',
    postsPerPage: 10
  },
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    structuredData: ''
  }
};

const ServiceEditor: React.FC = () => {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<ServiceSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!service) {
      toast({
        title: 'Error',
        description: 'No service specified',
        variant: 'destructive'
      });
      navigate('/admin');
      return;
    }

    loadServiceSettings();
  }, [service]);

  const loadServiceSettings = async () => {
    setLoading(true);
    
    try {
      // Check if we have settings for this service in the database
      const { data, error } = await supabase
        .from('service_settings')
        .select('*')
        .eq('service_type', service)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "row not found" error
        throw error;
      }

      if (data) {
        // Parse the settings from the database
        setSettings({
          title: data.title || defaultSettings.title,
          description: data.description || defaultSettings.description,
          bannerImage: data.banner_image || defaultSettings.bannerImage,
          icon: data.icon || defaultSettings.icon,
          featuredContent: data.featured_content || defaultSettings.featuredContent,
          displayOptions: data.display_options || defaultSettings.displayOptions,
          seo: data.seo || defaultSettings.seo
        });
      } else {
        // Initialize with default settings and the service name
        setSettings({
          ...defaultSettings,
          title: formatServiceName(service),
          seo: {
            ...defaultSettings.seo,
            metaTitle: formatServiceName(service),
            metaDescription: `HandyWriterz ${formatServiceName(service)} resources and content`
          }
        });
      }
    } catch (error) {
      console.error('Error loading service settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatServiceName = (serviceName: string): string => {
    return serviceName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof ServiceSettings],
          [field]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof ServiceSettings],
          [field]: checked
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean);
    setSettings(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords
      }
    }));
  };

  const handleFeaturedContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ids = e.target.value.split('\n').map(id => id.trim()).filter(Boolean);
    setSettings(prev => ({
      ...prev,
      featuredContent: ids
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Save settings to the database
      const { error } = await supabase
        .from('service_settings')
        .upsert({
          service_type: service,
          title: settings.title,
          description: settings.description,
          banner_image: settings.bannerImage,
          icon: settings.icon,
          featured_content: settings.featuredContent,
          display_options: settings.displayOptions,
          seo: settings.seo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'service_type'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Service settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving service settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/admin/content')}
            className="mr-4 text-gray-500 hover:text-gray-700"
            title="Back to Content"
          >
            <FiArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {settings.title || formatServiceName(service as string)} Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure how the {formatServiceName(service as string)} service page appears and behaves
            </p>
          </div>
        </div>
        <div>
          <button
            type="submit"
            form="service-form"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={saving}
          >
            <FiSave className="-ml-1 mr-2 h-5 w-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-6 py-3">
            <nav className="-mb-px flex space-x-6">
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'display'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('display')}
              >
                Display Options
              </button>
              <button
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'seo'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('seo')}
              >
                SEO
              </button>
            </nav>
          </div>
        </div>

        <form id="service-form" onSubmit={handleSubmit}>
          {activeTab === 'general' && (
            <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Service Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={settings.title}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder={formatServiceName(service as string)}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This is the title displayed at the top of the service page.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Service Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={settings.description}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Describe what this service page is about..."
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Brief description displayed below the title on the service page.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="bannerImage" className="block text-sm font-medium text-gray-700">
                  Banner Image URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    <FiImage className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="bannerImage"
                    id="bannerImage"
                    value={settings.bannerImage}
                    onChange={handleChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  URL for the banner image displayed at the top of the service page.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700">
                  Service Icon
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    <FiSettings className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="icon"
                    id="icon"
                    value={settings.icon}
                    onChange={handleChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
                    placeholder="https://example.com/icon.svg"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  URL for the icon representing this service.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="featuredContent" className="block text-sm font-medium text-gray-700">
                  Featured Content IDs
                </label>
                <div className="mt-1">
                  <textarea
                    id="featuredContent"
                    name="featuredContent"
                    rows={3}
                    value={settings.featuredContent.join('\n')}
                    onChange={handleFeaturedContentChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter one content ID per line"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  IDs of content to feature at the top of the service page. One ID per line.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Display Options</h3>
                <p className="mt-1 text-sm text-gray-500 mb-6">
                  Configure how content is displayed on the service page.
                </p>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center">
                  <input
                    id="showBanner"
                    name="displayOptions.showBanner"
                    type="checkbox"
                    checked={settings.displayOptions.showBanner}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showBanner" className="ml-2 block text-sm text-gray-700">
                    Show Banner Image
                  </label>
                </div>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center">
                  <input
                    id="showFeaturedPosts"
                    name="displayOptions.showFeaturedPosts"
                    type="checkbox"
                    checked={settings.displayOptions.showFeaturedPosts}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showFeaturedPosts" className="ml-2 block text-sm text-gray-700">
                    Show Featured Posts
                  </label>
                </div>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center">
                  <input
                    id="showCategories"
                    name="displayOptions.showCategories"
                    type="checkbox"
                    checked={settings.displayOptions.showCategories}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showCategories" className="ml-2 block text-sm text-gray-700">
                    Show Categories List
                  </label>
                </div>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center">
                  <input
                    id="showTags"
                    name="displayOptions.showTags"
                    type="checkbox"
                    checked={settings.displayOptions.showTags}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showTags" className="ml-2 block text-sm text-gray-700">
                    Show Tags Cloud
                  </label>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="codeBlockStyle" className="block text-sm font-medium text-gray-700">
                  Code Block Style
                </label>
                <div className="mt-1">
                  <select
                    id="codeBlockStyle"
                    name="displayOptions.codeBlockStyle"
                    value={settings.displayOptions.codeBlockStyle}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="default">Default</option>
                    <option value="github">GitHub</option>
                    <option value="vscode">VS Code</option>
                    <option value="atom">Atom</option>
                  </select>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Style for code block syntax highlighting.
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="postsPerPage" className="block text-sm font-medium text-gray-700">
                  Posts Per Page
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="displayOptions.postsPerPage"
                    id="postsPerPage"
                    value={settings.displayOptions.postsPerPage}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Number of posts to display per page.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">SEO Settings</h3>
                <p className="mt-1 text-sm text-gray-500 mb-6">
                  Configure search engine optimization settings for this service page.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
                  Meta Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="seo.metaTitle"
                    id="metaTitle"
                    value={settings.seo.metaTitle}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder={`HandyWriterz - ${formatServiceName(service as string)}`}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  The title that appears in search engine results and browser tabs.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                  Meta Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="metaDescription"
                    name="seo.metaDescription"
                    rows={3}
                    value={settings.seo.metaDescription}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder={`HandyWriterz ${formatServiceName(service as string)} resources and content`}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  A brief description of the page that appears in search engine results.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                  Keywords
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="keywords"
                    value={settings.seo.keywords.join(', ')}
                    onChange={handleKeywordsChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="handywriterz, nursing, healthcare, education"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Comma-separated keywords for search engine optimization.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="structuredData" className="block text-sm font-medium text-gray-700">
                  Structured Data JSON
                </label>
                <div className="mt-1">
                  <textarea
                    id="structuredData"
                    name="seo.structuredData"
                    rows={6}
                    value={settings.seo.structuredData}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
                    placeholder='{"@context": "https://schema.org", "@type": "WebPage", ...}'
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Optional JSON-LD structured data for rich search results.
                </p>
              </div>
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={saving}
            >
              <FiSave className="-ml-1 mr-2 h-5 w-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceEditor; 