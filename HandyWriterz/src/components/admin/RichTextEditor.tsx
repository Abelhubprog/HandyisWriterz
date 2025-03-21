import React, { useState, useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { storage, ID, MEDIA_BUCKET_ID } from '@/lib/appwriteClient';
import { Bold, Italic, Code, List, ListOrdered, Link2, Image, Video } from 'lucide-react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  showMarkdownToggle?: boolean;
  error?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Write something amazing...',
  className = '',
  height = '400px',
  showMarkdownToggle = true,
  error
}) => {
  const [editorHtml, setEditorHtml] = useState(initialValue);
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setEditorHtml(initialValue);
  }, [initialValue]);

  const handleChange = (html: string) => {
    setEditorHtml(html);
    onChange(html);
  };

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size cannot exceed 5MB.');
          return;
        }

        setIsUploading(true);
        
        try {
          // Upload file to storage
          const response = await storage.createFile(
            MEDIA_BUCKET_ID,
            ID.unique(),
            file
          );
          
          // Get file URL
          const fileUrl = storage.getFileView(MEDIA_BUCKET_ID, response.$id);
          
          // Insert image into editor
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', fileUrl);
          quill.setSelection(range.index + 1);
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
    };
  }, []);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['clean']
      ],
      handlers: {
        'image': handleImageUpload
      }
    },
    clipboard: {
      matchVisual: false
    },
    syntax: true
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align',
    'clean'
  ];

  // Switch between Markdown and Rich Text modes
  const toggleEditorMode = () => {
    setIsMarkdown(!isMarkdown);
    
    // Convert HTML to markdown or vice versa
    // In a real app, you'd use a library like turndown for HTML to Markdown conversion
    // And marked for Markdown to HTML conversion
  };

  // Markdown Mode Editor
  const renderMarkdownEditor = () => (
    <textarea
      value={editorHtml}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full p-4 border rounded-md font-mono text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
      style={{ minHeight: height }}
    />
  );

  // Rich Text Mode Editor
  const renderRichTextEditor = () => (
    <div className={`${error ? 'border border-red-500 rounded-md' : ''}`}>
      <ReactQuill
        theme="snow"
        value={editorHtml}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={`quill-editor ${className}`}
        style={{ height }}
      />
    </div>
  );

  // Display toolbar for mobile (ReactQuill toolbar may not be user-friendly on mobile)
  const renderMobileToolbar = () => (
    <div className="flex overflow-x-auto py-2 space-x-2 lg:hidden">
      <button
        type="button"
        onClick={() => {
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          quill.format('bold', !quill.getFormat().bold);
        }}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Bold"
        aria-label="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          quill.format('italic', !quill.getFormat().italic);
        }}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Italic"
        aria-label="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          quill.format('code-block', !quill.getFormat()['code-block']);
        }}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Code Block"
        aria-label="Code Block"
      >
        <Code size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          quill.format('list', 'bullet');
        }}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Bullet List"
        aria-label="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          quill.format('list', 'ordered');
        }}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Numbered List"
        aria-label="Numbered List"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          const range = quill.getSelection();
          const value = prompt('Enter link URL:');
          if (value) {
            quill.format('link', value);
          }
        }}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Insert Link"
        aria-label="Insert Link"
      >
        <Link2 size={16} />
      </button>
      <button
        type="button"
        onClick={handleImageUpload}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Insert Image"
        aria-label="Insert Image"
      >
        <Image size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          const quill = (document.querySelector('.quill-editor') as any)?.getEditor();
          const range = quill.getSelection();
          const value = prompt('Enter video URL (YouTube, Vimeo):');
          if (value) {
            quill.insertEmbed(range.index, 'video', value);
          }
        }}
        className="p-2 border border-gray-300 rounded hover:bg-gray-100"
        title="Insert Video"
        aria-label="Insert Video"
      >
        <Video size={16} />
      </button>
    </div>
  );

  return (
    <div className="rich-text-editor">
      {showMarkdownToggle && (
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            onClick={toggleEditorMode}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title={isMarkdown ? 'Switch to Rich Text' : 'Switch to Markdown'}
            aria-label={isMarkdown ? 'Switch to Rich Text' : 'Switch to Markdown'}
          >
            {isMarkdown ? 'Switch to Rich Text' : 'Switch to Markdown'}
          </button>
        </div>
      )}
      
      {renderMobileToolbar()}
      
      {isMarkdown ? renderMarkdownEditor() : renderRichTextEditor()}
      
      {isUploading && (
        <div className="mt-2 text-sm text-blue-600">
          Uploading image...
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Code Block Syntax Highlighting Info */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Tip: Use <code className="bg-gray-100 px-1 py-0.5 rounded">```language</code> for code blocks with syntax highlighting (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded">```javascript</code>)</p>
      </div>
    </div>
  );
};

export default RichTextEditor; 