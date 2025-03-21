import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PostRendererProps {
  content: string;
  isMarkdown?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'system';
}

const PostRenderer: React.FC<PostRendererProps> = ({
  content,
  isMarkdown = false,
  className = '',
  theme = 'light'
}) => {
  const [renderedContent, setRenderedContent] = useState('');
  const [copiedSnippets, setCopiedSnippets] = useState<Record<string, boolean>>({});
  
  // Determine if we're in dark mode
  const isDarkTheme = theme === 'dark' || (
    theme === 'system' && 
    window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  useEffect(() => {
    // If it's not markdown, we need to sanitize the HTML
    if (!isMarkdown) {
      setRenderedContent(DOMPurify.sanitize(content));
    }
  }, [content, isMarkdown]);
  
  // Reset copied status after 2 seconds
  useEffect(() => {
    const timeouts: number[] = [];
    
    Object.keys(copiedSnippets).forEach(id => {
      if (copiedSnippets[id]) {
        const timeout = window.setTimeout(() => {
          setCopiedSnippets(prev => ({
            ...prev,
            [id]: false
          }));
        }, 2000);
        
        timeouts.push(timeout);
      }
    });
    
    return () => {
      timeouts.forEach(id => clearTimeout(id));
    };
  }, [copiedSnippets]);
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippets(prev => ({
      ...prev,
      [id]: true
    }));
    toast.success('Code copied to clipboard');
  };
  
  if (isMarkdown) {
    return (
      <div className={`prose prose-lg dark:prose-invert max-w-none ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const id = `code-${Math.random().toString(36).substr(2, 9)}`;
              
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              }
              
              const language = match ? match[1] : '';
              const code = String(children).replace(/\n$/, '');
              
              return match ? (
                <div className="relative group">
                  <div className="absolute right-2 top-2 flex gap-2">
                    <button
                      className="p-1.5 rounded bg-gray-800/20 dark:bg-black/30 hover:bg-gray-800/40 dark:hover:bg-black/50 text-gray-700 dark:text-gray-300 transition-colors"
                      onClick={() => copyToClipboard(code, id)}
                      aria-label="Copy code"
                      title="Copy code"
                    >
                      {copiedSnippets[id] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {language && (
                      <span className="px-2 py-1 rounded bg-gray-800/20 dark:bg-black/30 text-xs font-mono text-gray-700 dark:text-gray-300">
                        {language}
                      </span>
                    )}
                  </div>
                  <SyntaxHighlighter
                    language={language}
                    style={isDarkTheme ? vscDarkPlus : prism}
                    wrapLongLines={true}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.375rem',
                      fontSize: '0.95em',
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="p-1 bg-gray-100 dark:bg-gray-800 rounded text-sm block" {...props}>
                  {children}
                </code>
              );
            },
            pre({ node, children }) {
              // Remove the additional <pre> that ReactMarkdown adds
              return <>{children}</>;
            },
            a({ node, children, href, ...props }) {
              const isExternal = href?.startsWith('http');
              
              return (
                <a 
                  href={href} 
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                  {...props}
                >
                  {children}
                  {isExternal && <ExternalLink className="ml-1 h-3 w-3" />}
                </a>
              );
            },
            blockquote({ node, children, ...props }) {
              return (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 italic bg-blue-50 dark:bg-blue-950/30 rounded-r-md" {...props}>
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mr-2 text-blue-500 mt-1 flex-shrink-0" />
                    <div>{children}</div>
                  </div>
                </blockquote>
              );
            },
            table({ node, children, ...props }) {
              return (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg" {...props}>
                    {children}
                  </table>
                </div>
              );
            },
            th({ node, children, ...props }) {
              return (
                <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-left text-sm font-semibold text-gray-900 dark:text-gray-200" {...props}>
                  {children}
                </th>
              );
            },
            td({ node, children, ...props }) {
              return (
                <td className="px-4 py-3 whitespace-nowrap text-sm border-t border-gray-200 dark:border-gray-700" {...props}>
                  {children}
                </td>
              );
            },
            img({ node, src, alt, ...props }) {
              return (
                <div className="my-6">
                  <img
                    src={src}
                    alt={alt}
                    className="rounded-lg max-w-full h-auto mx-auto shadow-md"
                    loading="lazy"
                    {...props}
                  />
                  {alt && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {alt}
                    </p>
                  )}
                </div>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
  
  // For HTML content
  return (
    <div
      className={`prose prose-lg dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default PostRenderer; 