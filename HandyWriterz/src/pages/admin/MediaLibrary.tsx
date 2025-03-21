import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Trash2, 
  Download, 
  Copy, 
  MoreHorizontal, 
  RefreshCw,
  Film,
  FileText,
  File,
  Loader,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import IconButton from '@/components/ui/IconButton';
import AccessibleToggleButton from '@/components/ui/AccessibleToggleButton';

interface MediaItem {
  id: string;
  title: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document' | 'other';
  url: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  usageCount: number;
}

const MediaLibrary: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'image' | 'video' | 'document' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState<string | null>(null);
  const [isBulkActionMenuOpen, setIsBulkActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);

  // Fetch media items
  useEffect(() => {
    const fetchMediaItems = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, we would fetch from the API
        // For now, let's use mock data
        const mockMediaItems: MediaItem[] = Array.from({ length: 12 }).map((_, idx) => ({
          id: `media-${idx + 1}`,
          title: `Sample Media ${idx + 1}`,
          fileName: idx % 3 === 0 
            ? `document-${idx + 1}.pdf` 
            : idx % 5 === 0 
              ? `video-${idx + 1}.mp4`
              : `image-${idx + 1}.jpg`,
          fileType: idx % 3 === 0 
            ? 'document' 
            : idx % 5 === 0 
              ? 'video'
              : 'image',
          url: idx % 3 === 0 
            ? `https://example.com/documents/doc-${idx + 1}.pdf` 
            : idx % 5 === 0 
              ? `https://example.com/videos/video-${idx + 1}.mp4`
              : `https://picsum.photos/seed/${idx + 1}/300/200`,
          size: Math.floor(Math.random() * 10000000),
          dimensions: idx % 3 !== 0 && idx % 5 !== 0 ? {
            width: 1200,
            height: 800
          } : undefined,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
          uploadedBy: {
            id: 'user-1',
            name: 'Admin User'
          },
          usageCount: Math.floor(Math.random() * 10)
        }));
        
        setMediaItems(mockMediaItems);
      } catch (error) {
        console.error('Error fetching media items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMediaItems();
  }, []);

  // Filter and sort media items
  useEffect(() => {
    let filtered = [...mediaItems];
    
    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.fileType === fileTypeFilter);
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.title.toLowerCase().includes(search) ||
          item.fileName.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'size':
        filtered.sort((a, b) => b.size - a.size);
        break;
    }
    
    setFilteredItems(filtered);
  }, [mediaItems, fileTypeFilter, searchTerm, sortBy]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle file type filter change
  const handleFileTypeFilter = (type: 'all' | 'image' | 'video' | 'document' | 'other') => {
    setFileTypeFilter(type);
  };

  // Handle sort change
  const handleSortChange = (sort: 'newest' | 'oldest' | 'name' | 'size') => {
    setSortBy(sort);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Handle file selection
  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  // Trigger file upload
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload with progress
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        // Simulate upload process for each file
        await new Promise<void>(resolve => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(Math.min(
              100,
              Math.round((i / totalFiles) * 100 + (progress / 100) * (100 / totalFiles))
            ));
            
            if (progress >= 100) {
              clearInterval(interval);
              resolve();
            }
          }, 200);
        });
      }
      
      // In a real implementation, we would upload to server and add new media items
      // For now, let's simulate adding new items
      const newItems: MediaItem[] = Array.from(files).map((file, idx) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isDocument = file.type.endsWith('pdf') || 
                         file.type.includes('document') || 
                         file.type.includes('spreadsheet');
        
        const fileType: MediaItem['fileType'] = isImage 
          ? 'image' 
          : isVideo 
            ? 'video' 
            : isDocument 
              ? 'document' 
              : 'other';
              
        return {
          id: `new-media-${Date.now()}-${idx}`,
          title: file.name.split('.')[0],
          fileName: file.name,
          fileType,
          url: isImage ? URL.createObjectURL(file) : '#',
          size: file.size,
          dimensions: undefined, // In a real implementation, we would calculate this for images
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: {
            id: 'user-1',
            name: 'Admin User'
          },
          usageCount: 0
        };
      });
      
      setMediaItems(prev => [...newItems, ...prev]);
      
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle action menu for an item
  const toggleActionMenu = (id: string) => {
    setIsActionMenuOpen(isActionMenuOpen === id ? null : id);
  };

  // Toggle bulk action menu
  const toggleBulkActionMenu = () => {
    setIsBulkActionMenuOpen(!isBulkActionMenuOpen);
  };

  // Open delete confirmation modal
  const openDeleteModal = (item: MediaItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
    setIsActionMenuOpen(null);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Delete media item
  const deleteMediaItem = () => {
    if (!itemToDelete) return;
    
    // In a real implementation, we would call API to delete
    setMediaItems(prev => prev.filter(item => item.id !== itemToDelete.id));
    closeDeleteModal();
  };

  // Delete selected items
  const deleteSelectedItems = () => {
    // In a real implementation, we would call API to delete
    setMediaItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    setIsBulkActionMenuOpen(false);
  };

  // Copy URL to clipboard
  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsActionMenuOpen(null);
    // In a real implementation, we would show a toast notification
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get icon for file type
  const getFileTypeIcon = (fileType: MediaItem['fileType'], size: number = 20) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon size={size} />;
      case 'video':
        return <Film size={size} />;
      case 'document':
        return <FileText size={size} />;
      default:
        return <File size={size} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            multiple
            accept="image/*,video/*,application/pdf"
            aria-label="Upload media files"
            id="file-upload-input"
          />
          
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Upload media files"
          >
            {isUploading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
            <span>Upload</span>
          </button>
          
          {selectedItems.length > 0 && (
            <div className="relative">
              <AccessibleToggleButton
                onClick={toggleBulkActionMenu}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                label="Bulk actions"
                isExpanded={isBulkActionMenuOpen}
                hasPopup={true}
              >
                <span>Actions ({selectedItems.length})</span>
                <MoreHorizontal size={18} />
              </AccessibleToggleButton>
              
              {isBulkActionMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                  <button
                    onClick={deleteSelectedItems}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    aria-label="Delete selected items"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isUploading && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-700 font-medium">Uploading files...</span>
            <span className="text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search media..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* File Type Filter */}
          <div className="flex items-center gap-2">
            <div className="text-gray-500 text-sm font-medium min-w-[60px]">Type:</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  fileTypeFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFileTypeFilter('all')}
                aria-label="Show all file types"
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  fileTypeFilter === 'image' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFileTypeFilter('image')}
                aria-label="Show only images"
              >
                Images
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  fileTypeFilter === 'video' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFileTypeFilter('video')}
                aria-label="Show only videos"
              >
                Videos
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  fileTypeFilter === 'document' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFileTypeFilter('document')}
                aria-label="Show only documents"
              >
                Documents
              </button>
            </div>
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <div className="text-gray-500 text-sm font-medium min-w-[40px]">Sort:</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'newest' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleSortChange('newest')}
                aria-label="Sort by newest first"
              >
                Newest
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'name' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleSortChange('name')}
                aria-label="Sort by name"
              >
                Name
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'size' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleSortChange('size')}
                aria-label="Sort by size"
              >
                Size
              </button>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center justify-end gap-2">
            <div className="text-gray-500 text-sm font-medium">View:</div>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <AccessibleToggleButton
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                onClick={() => setViewMode('grid')}
                label="Grid view"
                isPressed={viewMode === 'grid'}
              >
                <Grid size={18} />
              </AccessibleToggleButton>
              <AccessibleToggleButton
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                onClick={() => setViewMode('list')}
                label="List view"
                isPressed={viewMode === 'list'}
              >
                <List size={18} />
              </AccessibleToggleButton>
            </div>
          </div>
        </div>
      </div>
      
      {/* Media Library Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No media found</h3>
            <p className="text-gray-500 max-w-md">
              {searchTerm || fileTypeFilter !== 'all'
                ? "No media matches your filters. Try changing your search or filters."
                : "Upload your first media file to get started."}
            </p>
            {(!searchTerm && fileTypeFilter === 'all') && (
              <button
                onClick={handleUploadClick}
                className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Upload size={18} />
                <span>Upload Media</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className={`group border rounded-lg overflow-hidden ${selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : 'hover:border-blue-300'} transition-all`}
                >
                  <div className="relative">
                    {/* Media Item Thumbnail */}
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {item.fileType === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          {getFileTypeIcon(item.fileType, 32)}
                          <span className="text-xs mt-2">{item.fileType.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Selection Overlay */}
                    <div 
                      className={`absolute top-2 left-2 ${selectedItems.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        aria-label={`Select ${item.title}`}
                      />
                    </div>
                    
                    {/* Action Menu */}
                    <div className="absolute top-2 right-2">
                      <div className="relative">
                        <AccessibleToggleButton
                          onClick={() => toggleActionMenu(item.id)}
                          className={`p-1 rounded-full ${isActionMenuOpen === item.id ? 'bg-gray-200' : 'bg-gray-100 opacity-0 group-hover:opacity-100'} hover:bg-gray-200 transition-opacity`}
                          label="Show actions for this item"
                          isExpanded={isActionMenuOpen === item.id}
                          hasPopup={true}
                        >
                          <MoreHorizontal size={16} />
                        </AccessibleToggleButton>
                        
                        {isActionMenuOpen === item.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                            <button
                              onClick={() => copyUrlToClipboard(item.url)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              aria-label={`Copy URL for ${item.title}`}
                            >
                              <Copy size={16} className="mr-2" />
                              Copy URL
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Media Item Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm truncate" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                      <span>{formatFileSize(item.size)}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      aria-label={selectedItems.length === filteredItems.length ? "Deselect all items" : "Select all items"}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        aria-label={`Select ${item.title}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                          {item.fileType === 'image' ? (
                            <img 
                              src={item.url} 
                              alt={item.title} 
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            getFileTypeIcon(item.fileType)
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{item.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize">{item.fileType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(item.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <IconButton
                          icon={<Copy />}
                          label={`Copy URL for ${item.title}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => copyUrlToClipboard(item.url)}
                        />
                        <IconButton
                          icon={<Trash2 />}
                          label={`Delete ${item.title}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(item)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold mb-4">Delete Media</h3>
            
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete "{itemToDelete.title}"? This action cannot be undone.
              {itemToDelete.usageCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  <AlertTriangle size={16} className="inline-block mr-1" />
                  This file is used in {itemToDelete.usageCount} {itemToDelete.usageCount === 1 ? 'place' : 'places'}.
                </span>
              )}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={closeDeleteModal}
                aria-label="Cancel delete"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                onClick={deleteMediaItem}
                aria-label={`Confirm delete ${itemToDelete.title}`}
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary; 