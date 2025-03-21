import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';

describe('Pagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: jest.fn(),
    siblingCount: 1,
    className: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByLabelText('pagination')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to page 1')).toHaveClass('bg-indigo-600');
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Pagination {...defaultProps} className="custom-class" />);
      expect(screen.getByLabelText('pagination')).toHaveClass('custom-class');
    });

    it('renders correct number of page buttons', () => {
      render(<Pagination {...defaultProps} />);
      
      // Should show: 1, 2, 3, ..., 10
      const pageButtons = screen.getAllByRole('button').filter(
        button => !button.getAttribute('aria-label')?.includes('Previous') &&
                 !button.getAttribute('aria-label')?.includes('Next')
      );
      
      expect(pageButtons).toHaveLength(5); // 1, 2, 3, ..., 10
    });
  });

  describe('Navigation Controls', () => {
    it('disables previous button on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      
      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(<Pagination {...defaultProps} currentPage={10} />);
      
      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).toBeDisabled();
    });

    it('enables both buttons when on middle page', () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      
      const prevButton = screen.getByLabelText('Previous page');
      const nextButton = screen.getByLabelText('Next page');
      
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Page Selection', () => {
    it('handles direct page selection', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      const pageButton = screen.getByLabelText('Go to page 2');
      fireEvent.click(pageButton);
      
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('handles next page navigation', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);
      
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('handles previous page navigation', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);
      
      const prevButton = screen.getByLabelText('Previous page');
      fireEvent.click(prevButton);
      
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Ellipsis Behavior', () => {
    it('shows start ellipsis when needed', () => {
      render(<Pagination {...defaultProps} currentPage={8} />);
      
      const ellipses = screen.getAllByText('...');
      expect(ellipses[0]).toBeInTheDocument();
    });

    it('shows end ellipsis when needed', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const ellipses = screen.getAllByText('...');
      expect(ellipses[0]).toBeInTheDocument();
    });

    it('shows both ellipses for middle pages', () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      
      const ellipses = screen.getAllByText('...');
      expect(ellipses).toHaveLength(2);
    });
  });

  describe('Sibling Count Behavior', () => {
    it('respects custom sibling count', () => {
      render(<Pagination {...defaultProps} currentPage={5} siblingCount={2} />);
      
      // Should show more page numbers around current page
      const pageButtons = screen.getAllByRole('button').filter(
        button => !button.getAttribute('aria-label')?.includes('Previous') &&
                 !button.getAttribute('aria-label')?.includes('Next')
      );
      
      expect(pageButtons.length).toBeGreaterThan(5);
    });

    it('handles sibling count of 0', () => {
      render(<Pagination {...defaultProps} currentPage={5} siblingCount={0} />);
      
      // Should show minimal page numbers
      const pageButtons = screen.getAllByRole('button').filter(
        button => !button.getAttribute('aria-label')?.includes('Previous') &&
                 !button.getAttribute('aria-label')?.includes('Next')
      );
      
      expect(pageButtons.length).toBe(3); // First, current, last
    });
  });

  describe('Edge Cases', () => {
    it('handles single page', () => {
      render(<Pagination {...defaultProps} totalPages={1} />);
      
      expect(screen.queryByText('...')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeDisabled();
      expect(screen.getByLabelText('Next page')).toBeDisabled();
    });

    it('handles two pages', () => {
      render(<Pagination {...defaultProps} totalPages={2} />);
      
      expect(screen.queryByText('...')).not.toBeInTheDocument();
      const pageButtons = screen.getAllByRole('button').filter(
        button => !button.getAttribute('aria-label')?.includes('Previous') &&
                 !button.getAttribute('aria-label')?.includes('Next')
      );
      expect(pageButtons).toHaveLength(2);
    });

    it('handles invalid current page', () => {
      render(<Pagination {...defaultProps} currentPage={11} />);
      
      // Should default to last page
      expect(screen.getByLabelText('Go to page 10')).toHaveClass('bg-indigo-600');
    });

    it('handles negative current page', () => {
      render(<Pagination {...defaultProps} currentPage={-1} />);
      
      // Should default to first page
      expect(screen.getByLabelText('Go to page 1')).toHaveClass('bg-indigo-600');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByLabelText('pagination')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<Pagination {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      // Test tab navigation
      fireEvent.keyDown(buttons[0], { key: 'Tab' });
      expect(document.activeElement).toBe(buttons[1]);
    });

    it('handles keyboard selection', () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      const pageButton = screen.getByLabelText('Go to page 2');
      fireEvent.keyDown(pageButton, { key: 'Enter' });
      
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Style Consistency', () => {
    it('maintains consistent button styles', () => {
      render(<Pagination {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('relative');
        expect(button).toHaveClass('inline-flex');
        expect(button).toHaveClass('items-center');
      });
    });

    it('applies active state styles correctly', () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      
      const activeButton = screen.getByLabelText('Go to page 5');
      expect(activeButton).toHaveClass('bg-indigo-600');
      expect(activeButton).toHaveClass('text-white');
    });

    it('applies hover states correctly', () => {
      render(<Pagination {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (!button.hasAttribute('disabled')) {
          expect(button).toHaveClass('hover:bg-gray-50');
        }
      });
    });
  });

  describe('Performance', () => {
    it('handles rapid page changes', () => {
      const onPageChange = jest.fn();
      const { rerender } = render(
        <Pagination {...defaultProps} onPageChange={onPageChange} />
      );

      // Simulate rapid page changes
      for (let i = 1; i <= 5; i++) {
        rerender(
          <Pagination {...defaultProps} currentPage={i} onPageChange={onPageChange} />
        );
      }

      // Component should handle all updates without errors
      expect(screen.getByLabelText('Go to page 5')).toHaveClass('bg-indigo-600');
    });
  });
});
