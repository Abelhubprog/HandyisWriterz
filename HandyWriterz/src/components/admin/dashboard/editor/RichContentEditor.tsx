import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import type { ContentBlock } from '@/types/admin';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Plus, 
  X, 
  Upload, 
  Code, 
  Type, 
  Image as ImageIcon, 
  Video, 
  Music, 
  MoveVertical,
  Trash,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface RichContentEditorProps {
  initialBlocks?: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  initialBlocks = [],
  onChange,
}) => {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [copiedSnippets, setCopiedSnippets] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  // Copy code to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippets(prev => ({
      ...prev,
      [id]: true
    }));
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCopiedSnippets(prev => ({
        ...prev,
        [id]: false
      }));
    }, 2000);
  };

  // Add a new content block
  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      order: blocks.length,
      metadata: {
        language: type === 'code' ? 'javascript' : undefined,
      },
    };
    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    onChange(updatedBlocks);
    setActiveBlockId(newBlock.id);
  };

  // Update a content block
  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    );
    setBlocks(updatedBlocks);
    onChange(updatedBlocks);
  };

  // Remove a content block
  const removeBlock = (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    // Update order of remaining blocks
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    setBlocks(reorderedBlocks);
    onChange(reorderedBlocks);
  };

  // Move a block up or down
  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (
      (direction === 'up' && blockIndex === 0) ||
      (direction === 'down' && blockIndex === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    
    // Swap the blocks
    [newBlocks[blockIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[blockIndex]];
    
    // Update order property
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    
    setBlocks(reorderedBlocks);
    onChange(reorderedBlocks);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setIsDragging(true);
    setDraggedBlockId(id);
    e.dataTransfer.setData('blockId', id);
    
    // Make the drag image transparent
    const dragImage = document.createElement('div');
    dragImage.style.width = '0';
    dragImage.style.height = '0';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Remove the element after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id === draggedBlockId) return;
    
    const draggedIndex = blocks.findIndex(block => block.id === draggedBlockId);
    const targetIndex = blocks.findIndex(block => block.id === id);
    
    if (draggedIndex === targetIndex) return;
    
    // Create a copy of the blocks array
    const newBlocks = [...blocks];
    
    // Remove the dragged item
    const [draggedItem] = newBlocks.splice(draggedIndex, 1);
    
    // Insert the dragged item at the target position
    newBlocks.splice(targetIndex, 0, draggedItem);
    
    // Update order property
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    
    setBlocks(reorderedBlocks);
    // We don't call onChange here to prevent too many updates during dragging
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedBlockId(null);
    
    // Now call onChange to update the parent component
    onChange(blocks);
  };

  // Handle file upload to Supabase storage
  const handleFileUpload = async (blockId: string, file: File) => {
    try {
      // Create storage bucket path based on file type
      const fileType = file.type.split('/')[0]; // 'image', 'video', 'audio'
      const bucket = fileType === 'image' ? 'images' : 
                     fileType === 'video' ? 'videos' : 
                     fileType === 'audio' ? 'audio' : 'documents';
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${bucket}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update block with file URL and metadata
      const metadata: ContentBlock['metadata'] = {
        url: publicUrl,
        mimeType: file.type,
        title: file.name,
      };

      // Add additional metadata based on file type
      if (fileType === 'image') {
        // Create an image to get dimensions
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => {
          img.onload = resolve;
        });
        
        metadata.dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight
        };
      } else if (fileType === 'video' || fileType === 'audio') {
        // For video/audio, we'll add duration once it's available
        const media = fileType === 'video' ? document.createElement('video') : document.createElement('audio');
        media.src = URL.createObjectURL(file);
        await new Promise(resolve => {
          media.onloadedmetadata = resolve;
        });
        
        metadata.duration = media.duration;
      }

      updateBlock(blockId, {
        content: publicUrl,
        metadata
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  // Render the block editor based on block type
  const renderBlockEditor = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[200px] p-4 rounded-md border border-gray-300 bg-white resize-y"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Enter text content here... You can use HTML tags for formatting."
            />
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                value={block.metadata?.language || 'javascript'}
                onChange={(e) => updateBlock(block.id, {
                  metadata: { ...block.metadata, language: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="bash">Bash</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
              </select>
              <input
                type="text"
                placeholder="Title (optional)"
                value={block.metadata?.title || ''}
                onChange={(e) => updateBlock(block.id, {
                  metadata: { ...block.metadata, title: e.target.value }
                })}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <Editor
                height="400px"
                language={block.metadata?.language || 'javascript'}
                value={block.content}
                onChange={(value) => updateBlock(block.id, { content: value || '' })}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 2,
                  lineNumbers: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
            
            {/* Code preview */}
            {block.content && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2 text-gray-700">Preview:</div>
                <div className="relative group rounded-lg overflow-hidden bg-gray-900">
                  <div className="absolute right-2 top-2 flex gap-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded bg-black/30 hover:bg-black/50 text-gray-300 transition-colors"
                      onClick={() => copyToClipboard(block.content, block.id)}
                      aria-label="Copy code"
                    >
                      {copiedSnippets[block.id] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <span className="px-2 py-1 rounded bg-black/30 text-xs font-mono text-gray-300">
                      {block.metadata?.language || 'javascript'}
                    </span>
                  </div>
                  <SyntaxHighlighter
                    language={block.metadata?.language || 'javascript'}
                    style={vscDarkPlus}
                    wrapLongLines={true}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      fontSize: '0.95em',
                      borderRadius: '0.5rem',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}
                  >
                    {block.content}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        );

      case 'image':
      case 'video':
      case 'audio':
        return (
          <div className="space-y-4">
            {block.content ? (
              <div className="relative">
                {block.type === 'image' && (
                  <img
                    src={block.content}
                    alt={block.metadata?.title || ''}
                    className="max-w-full h-auto rounded-md"
                  />
                )}
                {block.type === 'video' && (
                  <video
                    src={block.content}
                    controls
                    className="max-w-full rounded-md"
                  />
                )}
                {block.type === 'audio' && (
                  <audio
                    src={block.content}
                    controls
                    className="w-full"
                  />
                )}
                <button
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                  onClick={() => updateBlock(block.id, { content: '' })}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-md hover:bg-gray-50"
              >
                <input
                  type="file"
                  accept={
                    block.type === 'image' ? 'image/*' :
                    block.type === 'video' ? 'video/*' :
                    'audio/*'
                  }
                  className="hidden"
                  id={`file-${block.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(block.id, file);
                  }}
                />
                <label
                  htmlFor={`file-${block.id}`}
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="p-4 rounded-full bg-blue-100 text-blue-600">
                    {block.type === 'image' && <ImageIcon className="h-6 w-6" />}
                    {block.type === 'video' && <Video className="h-6 w-6" />}
                    {block.type === 'audio' && <Music className="h-6 w-6" />}
                  </div>
                  <span className="font-medium">
                    Click to upload {block.type}
                  </span>
                  <span className="text-sm text-gray-500">
                    {block.type === 'image' ? 'SVG, PNG, JPG or GIF' :
                     block.type === 'video' ? 'MP4, WebM or OGG' :
                     'MP3, WAV or OGG'}
                  </span>
                </label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Title (optional)"
                value={block.metadata?.title || ''}
                onChange={(e) => updateBlock(block.id, {
                  metadata: { ...block.metadata, title: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={block.metadata?.description || ''}
                onChange={(e) => updateBlock(block.id, {
                  metadata: { ...block.metadata, description: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rich-content-editor">
      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="max-w-sm mx-auto">
            <h3 className="font-medium text-lg mb-2">Add content blocks</h3>
            <p className="text-gray-500 mb-6">
              Start building your content by adding text, code snippets, images, videos, or audio.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => addBlock('text')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Type className="h-4 w-4" />
                <span>Add Text</span>
              </button>
              <button
                onClick={() => addBlock('code')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                <Code className="h-4 w-4" />
                <span>Add Code</span>
              </button>
              <button
                onClick={() => addBlock('image')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Add Image</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`border bg-white rounded-lg p-6 relative ${
                isDragging && draggedBlockId === block.id ? 'opacity-50' : ''
              } ${activeBlockId === block.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setActiveBlockId(block.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, block.id)}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded cursor-move" onMouseDown={() => setDraggedBlockId(block.id)}>
                    <MoveVertical className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="font-medium capitalize">
                    {block.type} Block
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    onClick={() => moveBlock(block.id, 'up')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    onClick={() => moveBlock(block.id, 'down')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {renderBlockEditor(block)}
            </div>
          ))}
          
          {/* Add block menu */}
          <div className="flex flex-wrap gap-2 py-4">
            <button
              onClick={() => addBlock('text')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <Type className="h-4 w-4" />
              <span>Add Text</span>
            </button>
            <button
              onClick={() => addBlock('code')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <Code className="h-4 w-4" />
              <span>Add Code</span>
            </button>
            <button
              onClick={() => addBlock('image')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Add Image</span>
            </button>
            <button
              onClick={() => addBlock('video')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <Video className="h-4 w-4" />
              <span>Add Video</span>
            </button>
            <button
              onClick={() => addBlock('audio')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <Music className="h-4 w-4" />
              <span>Add Audio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 