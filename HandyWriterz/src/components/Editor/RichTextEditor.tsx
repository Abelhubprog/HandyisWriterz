import React, { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEditor } from '@tiptap/react';
import {
  Bold, Italic, Link as LinkIcon, Image as ImageIcon,
  List, ListOrdered, Quote, Undo, Redo, Code
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  error?: string;
}

/**
 * RichTextEditor Component
 * 
 * A rich text editor component built with TipTap that supports:
 * - Basic text formatting (bold, italic, etc.)
 * - Lists (ordered and unordered)
 * - Images
 * - Links
 * - Code blocks
 * - Undo/Redo
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  error
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none',
        'data-placeholder': placeholder,
      },
    },
  });

  // Handle image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    try {
      // TODO: Implement actual image upload logic
      const imageUrl = await uploadImage(file);
      editor?.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
      // Show error toast or handle error appropriately
    }
  };

  // Placeholder implementation - replace with actual upload logic
  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const MenuButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
  }> = ({ onClick, icon, label, isActive }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 ${
        isActive ? 'bg-gray-100 text-indigo-600' : 'text-gray-600'
      }`}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg ${error ? 'border-red-500' : 'border-gray-200'}`}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={<Bold className="h-5 w-5" />}
            label="Bold"
            isActive={editor.isActive('bold')}
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={<Italic className="h-5 w-5" />}
            label="Italic"
            isActive={editor.isActive('italic')}
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={<List className="h-5 w-5" />}
            label="Bullet List"
            isActive={editor.isActive('bulletList')}
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={<ListOrdered className="h-5 w-5" />}
            label="Ordered List"
            isActive={editor.isActive('orderedList')}
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            icon={<Quote className="h-5 w-5" />}
            label="Quote"
            isActive={editor.isActive('blockquote')}
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            icon={<Code className="h-5 w-5" />}
            label="Code Block"
            isActive={editor.isActive('codeBlock')}
          />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <MenuButton
            onClick={() => {
              const url = window.prompt('Enter the URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            icon={<LinkIcon className="h-5 w-5" />}
            label="Add Link"
            isActive={editor.isActive('link')}
          />
          <MenuButton
            onClick={() => fileInputRef.current?.click()}
            icon={<ImageIcon className="h-5 w-5" />}
            label="Add Image"
          />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            icon={<Undo className="h-5 w-5" />}
            label="Undo"
          />
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            icon={<Redo className="h-5 w-5" />}
            label="Redo"
          />
        </div>
      )}
      
      <div 
        className={`p-4 min-h-[200px] prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none ${
          error ? 'bg-red-50' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageUpload(file);
            }
          }}
        />
        {editor.view.dom}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1 px-4 pb-2">{error}</p>
      )}
    </div>
  );
};

export default RichTextEditor;
