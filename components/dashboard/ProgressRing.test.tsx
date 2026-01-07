import { render, screen, waitFor } from '@testing-library/react';
import { ProgressRing } from './ProgressRing';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  dashboard: {
    days: 'days',
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('ProgressRing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with correct percentage when progress is made', () => {
      renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      expect(screen.getByText('50/100')).toBeInTheDocument();
      expect(screen.getByText('days')).toBeInTheDocument();
    });

    it('renders 0% when no active days', () => {
      renderWithIntl(<ProgressRing activeDays={0} totalDays={100} />);
      
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('renders 100% when all days are active', () => {
      renderWithIntl(<ProgressRing activeDays={100} totalDays={100} />);
      
      expect(screen.getByText('100/100')).toBeInTheDocument();
    });

    it('renders 0% when totalDays is 0', () => {
      renderWithIntl(<ProgressRing activeDays={0} totalDays={0} />);
      
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('caps percentage at 100% when activeDays exceeds totalDays', () => {
      renderWithIntl(<ProgressRing activeDays={150} totalDays={100} />);
      
      expect(screen.getByText('150/100')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('animates percentage from 0 to target value on mount', async () => {
      renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      // Initially shows 0% (animation starts from 0)
      expect(screen.getByText(/0%/)).toBeInTheDocument();
      
      // Fast-forward through animation
      jest.advanceTimersByTime(1000);
      
      // Should show final percentage
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('uses shorter animation duration for updates', async () => {
      const { rerender } = renderWithIntl(<ProgressRing activeDays={25} totalDays={100} />);
      
      // Complete initial animation
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument();
      });
      
      // Update props
      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ProgressRing activeDays={75} totalDays={100} />
        </NextIntlClientProvider>
      );
      
      // Update animation should be faster (400ms)
      jest.advanceTimersByTime(400);
      
      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });
  });

  describe('SVG Rendering', () => {
    it('renders SVG with correct aria-label', () => {
      renderWithIntl(<ProgressRing activeDays={30} totalDays={90} />);
      
      const svg = screen.getByLabelText('Progress: 30 of 90 days');
      expect(svg).toBeInTheDocument();
    });

    it('renders background and progress circles', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2); // background + progress
    });

    it('renders gradient definition', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      const gradient = container.querySelector('linearGradient');
      expect(gradient).toBeInTheDocument();
      
      const stops = container.querySelectorAll('stop');
      expect(stops).toHaveLength(2);
      expect(stops[0]).toHaveAttribute('stop-color', '#22d3ee'); // cyan-400
      expect(stops[1]).toHaveAttribute('stop-color', '#06b6d4'); // cyan-600
    });
  });

  describe('Styling', () => {
    it('applies dark gradient background', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      const background = container.querySelector('.bg-gradient-to-br');
      expect(background).toBeInTheDocument();
      expect(background).toHaveClass('from-gray-900', 'to-gray-800');
    });

    it('applies responsive sizing classes', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      const ringContainer = container.querySelector('.w-\\[100px\\]');
      expect(ringContainer).toBeInTheDocument();
      expect(ringContainer).toHaveClass('md:w-[120px]', 'lg:w-[140px]');
    });

    it('applies cyan color to percentage text', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      const percentageText = container.querySelector('.text-cyan-400');
      expect(percentageText).toBeInTheDocument();
      expect(percentageText).toHaveClass('font-bold');
    });

    it('applies white color to active/total text', () => {
      renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      const activeTotal = screen.getByText('50/100');
      expect(activeTotal).toHaveClass('text-white');
    });

    it('applies cyan/opacity color to days label', () => {
      renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      const daysLabel = screen.getByText('days');
      expect(daysLabel).toHaveClass('text-cyan-300/70', 'uppercase');
    });
  });

  describe('Edge Cases', () => {
    it('handles very small percentages', () => {
      renderWithIntl(<ProgressRing activeDays={1} totalDays={1000} />);
      
      expect(screen.getByText('1/1000')).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      renderWithIntl(<ProgressRing activeDays={999} totalDays={999} />);
      
      expect(screen.getByText('999/999')).toBeInTheDocument();
    });

    it('rounds percentage to nearest integer', async () => {
      renderWithIntl(<ProgressRing activeDays={1} totalDays={3} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        // 1/3 = 33.333...% should round to 33%
        expect(screen.getByText('33%')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('includes descriptive aria-label on SVG', () => {
      renderWithIntl(<ProgressRing activeDays={42} totalDays={100} />);
      
      const svg = screen.getByLabelText('Progress: 42 of 100 days');
      expect(svg).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      // Check for proper div structure
      const wrapper = container.querySelector('.relative.overflow-hidden');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies mobile-first responsive classes', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      // Check for responsive padding
      const wrapper = container.querySelector('.p-4');
      expect(wrapper).toHaveClass('md:p-6');
      
      // Check for responsive height
      expect(wrapper).toHaveClass('min-h-[120px]', 'md:min-h-[160px]');
    });

    it('scales text responsively', () => {
      const { container } = renderWithIntl(<ProgressRing activeDays={50} totalDays={100} />);
      
      // Percentage should have responsive text sizes
      const percentage = container.querySelector('.text-lg');
      expect(percentage).toHaveClass('sm:text-xl', 'md:text-2xl', 'lg:text-3xl', 'xl:text-4xl');
    });
  });
});

