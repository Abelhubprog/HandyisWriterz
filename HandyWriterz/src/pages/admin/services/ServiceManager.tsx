import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Upload, 
  X, 
  Plus,
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * Interface for service data structure
 */
interface ServiceData {
  id?: string;
  slug: string;
  title: string;
  description: string;
  hero_image?: string;
  features: string[];
  benefits: string[];
  is_active: boolean;
  created_at?: string;
  updated_at: string;
  seo_keywords?: string[];
}

/**
 * ServiceManager - Component for creating and editing services
 * 
 * This component provides a form for administrators to create new services
 * or edit existing ones. It handles form validation, image uploads, and
 * submission to Supabase.
 */
const ServiceManager: React.FC = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const isEditMode = !!serviceId;
  
  // Form state
  const [service, setService] = useState<ServiceData>({
    slug: '',
    title: '',
    description: '',
    hero_image: '',
    features: [],
    benefits: [],
    is_active: true,
    updated_at: new Date().toISOString(),
    seo_keywords: []
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState<string>('');
  const [benefitInput, setBenefitInput] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Fetch service data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchServiceData();
    }
  }, [serviceId]);
  
  /**
   * Fetches service data from Supabase when in edit mode
   */
  const fetchServiceData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setService(data);
        if (data.hero_image) {
          setImagePreview(data.hero_image);
        }
      }
    } catch (err: any) {
      console.error('Error fetching service:', err);
      setError('Failed to load service data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Generates a URL-friendly slug from the title
   */
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  
  /**
   * Handles title changes and auto-generates slug if not in edit mode
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setService(prev => ({
      ...prev,
      title: newTitle,
      slug: isEditMode ? prev.slug : generateSlug(newTitle)
    }));
  };
  
  /**
   * Adds a new feature to the service
   */
  const addFeature = () => {
    if (featureInput.trim() && !service.features.includes(featureInput.trim())) {
      setService(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };
  
  /**
   * Removes a feature from the service
   */
  const removeFeature = (feature: string) => {
    setService(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };
  
  /**
   * Adds a new benefit to the service
   */
  const addBenefit = () => {
    if (benefitInput.trim() && !service.benefits.includes(benefitInput.trim())) {
      setService(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };
  
  /**
   * Removes a benefit from the service
   */
  const removeBenefit = (benefit: string) => {
    setService(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }));
  };
  
  /**
   * Adds a new SEO keyword to the service
   */
  const addKeyword = () => {
    if (keywordInput.trim() && service.seo_keywords && !service.seo_keywords.includes(keywordInput.trim())) {
      setService(prev => ({
        ...prev,
        seo_keywords: [...(prev.seo_keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };
  
  /**
   * Removes an SEO keyword from the service
   */
  const removeKeyword = (keyword: string) => {
    setService(prev => ({
      ...prev,
      seo_keywords: prev.seo_keywords?.filter(k => k !== keyword) || []
    }));
  };
  
  /**
   * Handles image file selection and preview
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  /**
   * Uploads the selected image to Supabase storage
   */
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return service.hero_image || null;
    
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${service.slug}.${fileExt}`;
    const filePath = `services/${fileName}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image');
    }
  };
  
  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (!service.title || !service.description || !service.slug) {
        throw new Error('Please fill in all required fields');
      }
      
      // Upload image if selected
      let imageUrl = service.hero_image;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      
      const updatedService = {
        ...service,
        hero_image: imageUrl,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (isEditMode) {
        // Update existing service
        result = await supabase
          .from('services')
          .update(updatedService)
          .eq('id', serviceId);
      } else {
        // Create new service
        result = await supabase
          .from('services')
          .insert([{ ...updatedService, created_at: new Date().toISOString() }]);
      }
      
      if (result.error) throw result.error;
      
      setSuccess(isEditMode ? 'Service updated successfully!' : 'Service created successfully!');
      
      // Navigate back to services list after a short delay
      setTimeout(() => {
        navigate('/admin/services');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error saving service:', err);
      setError(err.message || 'Failed to save service. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link 
            to="/admin/services" 
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Service' : 'Create New Service'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/services')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            aria-label="Cancel"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save service"
          >
            {isSaving ? <LoadingSpinner size="sm" color="white" /> : <Save size={18} />}
            Save Service
          </button>
        </div>
      </div>
      
      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          {success}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Service Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={service.title}
                    onChange={handleTitleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Adult Health Nursing"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={service.slug}
                    onChange={(e) => setService(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., adult-health-nursing"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This will be used in the URL: /services/{service.slug}
                  </p>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={service.description}
                    onChange={(e) => setService(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe this service..."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This will be used for SEO and displayed on the service page.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Service Features</h2>
              
              <div className="flex mb-4">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a feature..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  aria-label="Add feature"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="space-y-2">
                {service.features.length === 0 && (
                  <p className="text-gray-500 italic">No features added yet.</p>
                )}
                
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{feature}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Remove feature: ${feature}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Service Benefits</h2>
              
              <div className="flex mb-4">
                <input
                  type="text"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a benefit..."
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  aria-label="Add benefit"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="space-y-2">
                {service.benefits.length === 0 && (
                  <p className="text-gray-500 italic">No benefits added yet.</p>
                )}
                
                {service.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{benefit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBenefit(benefit)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Remove benefit: ${benefit}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Status</h2>
              
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.is_active}
                    onChange={(e) => setService(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900">
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {service.is_active 
                  ? 'This service is visible to the public.' 
                  : 'This service is hidden from the public.'}
              </p>
            </div>
          </div>
          
          {/* Featured Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Featured Image</h2>
              
              {imagePreview ? (
                <div className="relative mb-4">
                  <img 
                    src={imagePreview} 
                    alt="Service preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                      setService(prev => ({ ...prev, hero_image: '' }));
                    }}
                    className="absolute top-2 right-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Click to upload an image or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
              
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                aria-label="Upload image"
              >
                <Upload size={16} />
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </button>
            </div>
          </div>
          
          {/* SEO Keywords */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">SEO Keywords</h2>
              
              <div className="flex mb-4">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a keyword..."
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  aria-label="Add keyword"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {service.seo_keywords?.length === 0 && (
                  <p className="text-gray-500 italic">No keywords added yet.</p>
                )}
                
                {service.seo_keywords?.map((keyword, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm">{keyword}</span>
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={`Remove keyword: ${keyword}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <p className="mt-4 text-sm text-gray-500">
                Keywords help improve search engine visibility.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServiceManager; 