import React, { useState } from 'react';
import type { ContentBlock } from '@/types/admin';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface ContentRendererProps {
  blocks: ContentBlock[];
  darkMode?: boolean;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ 
  blocks, 
  darkMode = true 
}) => {
  const [copiedSnippets, setCopiedSnippets] = useState<Record<string, boolean>>({});

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

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-6" 
            dangerouslySetInnerHTML={{ __html: block.content }} 
          />
        );

      case 'code':
        return (
          <div className="mb-6">
            {block.metadata?.title && (
              <div className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                {block.metadata.title}
              </div>
            )}
            <div className="relative group rounded-lg overflow-hidden bg-gray-900">
              <div className="absolute right-2 top-2 flex gap-2 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded bg-black/30 hover:bg-black/50 text-gray-300 transition-colors"
                  onClick={() => copyToClipboard(block.content, block.id)}
                  aria-label="Copy code"
                  title="Copy code"
                >
                  {copiedSnippets[block.id] ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                {block.metadata?.language && (
                  <span className="px-2 py-1 rounded bg-black/30 text-xs font-mono text-gray-300">
                    {block.metadata.language}
                  </span>
                )}
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
                  maxHeight: '600px',
                  overflow: 'auto'
                }}
              >
                {block.content}
              </SyntaxHighlighter>
            </div>
          </div>
        );

      case 'image':
        return (
          <figure className="mb-6">
            <img 
              src={block.content} 
              alt={block.metadata?.title || ''} 
              className="w-full h-auto rounded-lg"
            />
            {(block.metadata?.title || block.metadata?.description) && (
              <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {block.metadata?.title && <div className="font-medium">{block.metadata.title}</div>}
                {block.metadata?.description && <div>{block.metadata.description}</div>}
              </figcaption>
            )}
          </figure>
        );

      case 'video':
        return (
          <figure className="mb-6">
            <video
              src={block.content}
              controls
              className="w-full rounded-lg"
              title={block.metadata?.title || ''}
            />
            {(block.metadata?.title || block.metadata?.description) && (
              <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {block.metadata?.title && <div className="font-medium">{block.metadata.title}</div>}
                {block.metadata?.description && <div>{block.metadata.description}</div>}
              </figcaption>
            )}
          </figure>
        );

      case 'audio':
        return (
          <figure className="mb-6">
            <audio
              src={block.content}
              controls
              className="w-full"
              title={block.metadata?.title || ''}
            />
            {(block.metadata?.title || block.metadata?.description) && (
              <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {block.metadata?.title && <div className="font-medium">{block.metadata.title}</div>}
                {block.metadata?.description && <div>{block.metadata.description}</div>}
              </figcaption>
            )}
          </figure>
        );

      default:
        return null;
    }
  };

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className={`content-renderer ${darkMode ? 'dark' : ''}`}>
      {sortedBlocks.map((block) => (
        <div key={block.id}>
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
}; 