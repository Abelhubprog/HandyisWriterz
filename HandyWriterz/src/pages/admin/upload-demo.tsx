/**
 * Upload Components Demo Page
 * 
 * This page demonstrates the use of all upload components with Appwrite storage.
 * 
 * @file src/pages/admin/upload-demo.tsx
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ImageUpload } from '@/components/ui/image-upload';
import { DocumentUpload } from '@/components/ui/document-upload';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { toast, Toaster } from 'react-hot-toast';

const UploadDemo: React.FC = () => {
  // Image upload state
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileId, setImageFileId] = useState('');
  
  // Document upload state
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentFileId, setDocumentFileId] = useState('');
  const [documentFileName, setDocumentFileName] = useState('');
  
  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFileId, setAvatarFileId] = useState('');
  
  const handleError = (error: Error) => {
    toast.error(error.message);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Upload Demo | HandyWriterz Admin</title>
      </Helmet>
      
      <Toaster position="top-right" />
      
      <h1 className="text-3xl font-bold mb-8 text-center">
        Appwrite Upload Components Demo
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Avatar</h2>
          <div className="flex flex-col items-center">
            <AvatarUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              fileId={avatarFileId}
              onFileIdChange={setAvatarFileId}
              onError={handleError}
              size="lg"
              className="mb-4"
            />
            
            {avatarUrl && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md w-full">
                <p className="text-sm font-medium text-gray-700">Avatar URL:</p>
                <p className="text-xs text-gray-500 break-all">{avatarUrl}</p>
                <p className="text-sm font-medium text-gray-700 mt-2">File ID:</p>
                <p className="text-xs text-gray-500">{avatarFileId}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Image Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Media Image</h2>
          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            fileId={imageFileId}
            onFileIdChange={setImageFileId}
            onError={handleError}
            className="mb-4"
          />
          
          {imageUrl && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md w-full">
              <p className="text-sm font-medium text-gray-700">Image URL:</p>
              <p className="text-xs text-gray-500 break-all">{imageUrl}</p>
              <p className="text-sm font-medium text-gray-700 mt-2">File ID:</p>
              <p className="text-xs text-gray-500">{imageFileId}</p>
            </div>
          )}
        </div>
        
        {/* Document Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Document</h2>
          <DocumentUpload
            value={documentUrl}
            onChange={setDocumentUrl}
            fileId={documentFileId}
            onFileIdChange={setDocumentFileId}
            fileName={documentFileName}
            onFileNameChange={setDocumentFileName}
            onError={handleError}
            className="mb-4"
          />
          
          {documentUrl && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md w-full">
              <p className="text-sm font-medium text-gray-700">File Name:</p>
              <p className="text-xs text-gray-500">{documentFileName}</p>
              <p className="text-sm font-medium text-gray-700 mt-2">Document URL:</p>
              <p className="text-xs text-gray-500 break-all">{documentUrl}</p>
              <p className="text-sm font-medium text-gray-700 mt-2">File ID:</p>
              <p className="text-xs text-gray-500">{documentFileId}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Appwrite Storage Integration</h2>
        <p className="text-gray-700 mb-4">
          This page demonstrates the integration of Appwrite storage with various upload components:
        </p>
        
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Avatar Uploads:</strong> Using the <code>avatars</code> bucket (5MB limit)
          </li>
          <li>
            <strong>Image Uploads:</strong> Using the <code>092025004</code> media bucket (45MB limit)
          </li>
          <li>
            <strong>Document Uploads:</strong> Using the <code>document</code> bucket (49.9MB limit)
          </li>
        </ul>
        
        <p className="text-gray-700">
          Files are uploaded directly to Appwrite storage and can be managed through the Appwrite console or programmatically through the API.
        </p>
      </div>
    </div>
  );
};

export default UploadDemo; 