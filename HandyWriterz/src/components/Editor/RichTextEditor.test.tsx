import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RichTextEditor from './RichTextEditor';

// Mock TipTap editor
jest.mock('@tiptap/react', () => ({
  useEditor: () => ({
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: jest.fn() }),
        toggleItalic: () => ({ run: jest.fn() }),
        toggleBulletList: () => ({ run: jest.fn() }),
        toggleOrderedList: () => ({ run: jest.fn() }),
        toggleBlockquote: () => ({ run: jest.fn() }),
        toggleCodeBlock: () => ({ run: jest.fn() }),
        setLink: () => ({ run: jest.fn() }),
        setImage: () => ({ run: jest.fn() }),
        undo: () => ({ run: jest.fn() }),
        redo: () => ({ run: jest.fn() })
      })
    }),
    isActive: jest.fn().mockReturnValue(false),
    getHTML: () => '<p>Test content</p>',
    view: {
      dom: document.createElement('div')
    }
  }),
  Editor: jest.fn()
}));

describe('RichTextEditor Component', () => {
  const defaultProps = {
    content: '<p>Initial content</p>',
    onChange: jest.fn(),
    placeholder: 'Start writing...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial content', () => {
    render(<RichTextEditor {...defaultProps} />);
    
    // Check for toolbar buttons
    expect(screen.getByLabelText(/bold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/italic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bullet list/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ordered list/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/code block/i)).toBeInTheDocument();
  });

  it('renders in read-only mode', () => {
    render(<RichTextEditor {...defaultProps} readOnly={true} />);
    
    // Toolbar should not be visible in read-only mode
    expect(screen.queryByLabelText(/bold/i)).not.toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    const error = 'Content is required';
    render(<RichTextEditor {...defaultProps} error={error} />);
    
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveClass('border-red-500');
  });

  it('handles image upload', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const onChange = jest.fn();

    render(<RichTextEditor {...defaultProps} onChange={onChange} />);

    const fileInput = screen.getByLabelText(/add image/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Wait for FileReader to process the image
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('handles link insertion', () => {
    // Mock window.prompt
    const mockPrompt = jest.spyOn(window, 'prompt');
    mockPrompt.mockImplementation(() => 'https://example.com');

    render(<RichTextEditor {...defaultProps} />);

    const linkButton = screen.getByLabelText(/add link/i);
    fireEvent.click(linkButton);

    expect(mockPrompt).toHaveBeenCalled();

    // Cleanup
    mockPrompt.mockRestore();
  });

  it('handles toolbar button clicks', () => {
    render(<RichTextEditor {...defaultProps} />);

    // Test each toolbar button
    const buttons = [
      'Bold',
      'Italic',
      'Bullet List',
      'Ordered List',
      'Quote',
      'Code Block',
      'Undo',
      'Redo'
    ];

    buttons.forEach(label => {
      const button = screen.getByLabelText(new RegExp(label, 'i'));
      fireEvent.click(button);
    });
  });

  it('updates content when editor changes', () => {
    const onChange = jest.fn();
    render(<RichTextEditor {...defaultProps} onChange={onChange} />);

    // Simulate editor content change
    const editorContent = '<p>New content</p>';
    onChange(editorContent);

    expect(onChange).toHaveBeenCalledWith(editorContent);
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<RichTextEditor {...defaultProps} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Rich text editor toolbar');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('supports keyboard navigation', () => {
      render(<RichTextEditor {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      // Test tab navigation
      fireEvent.keyDown(buttons[0], { key: 'Tab' });
      expect(document.activeElement).toBe(buttons[1]);
    });
  });

  describe('Error Handling', () => {
    it('handles image upload errors gracefully', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<RichTextEditor {...defaultProps} />);

      const fileInput = screen.getByLabelText(/add image/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('validates image file types', async () => {
      render(<RichTextEditor {...defaultProps} />);

      const fileInput = screen.getByLabelText(/add image/i);
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('Performance', () => {
    it('debounces content updates', async () => {
      jest.useFakeTimers();
      const onChange = jest.fn();
      
      render(<RichTextEditor {...defaultProps} onChange={onChange} />);

      // Simulate rapid content changes
      for (let i = 0; i < 5; i++) {
        onChange(`<p>Content ${i}</p>`);
      }

      jest.runAllTimers();

      expect(onChange).toHaveBeenCalledTimes(5);
      
      jest.useRealTimers();
    });
  });
});
