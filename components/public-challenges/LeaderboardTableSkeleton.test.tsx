import { render } from '@testing-library/react';
import { LeaderboardTableSkeleton } from './LeaderboardTableSkeleton';

describe('LeaderboardTableSkeleton', () => {
  it('should render skeleton with current streak column for MONTH timeframe', () => {
    const { container } = render(<LeaderboardTableSkeleton timeframe="MONTH" />);
    
    // Should have table structure
    expect(container.querySelector('table')).toBeInTheDocument();
    
    // Should have 5 column headers (rank, participant, best streak, current streak, achievements)
    const headerCells = container.querySelectorAll('thead th');
    expect(headerCells).toHaveLength(5);
    
    // Should have 5 skeleton rows
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(5);
  });

  it('should render skeleton with current streak column for YEAR timeframe', () => {
    const { container } = render(<LeaderboardTableSkeleton timeframe="YEAR" />);
    
    // Should have 5 column headers
    const headerCells = container.querySelectorAll('thead th');
    expect(headerCells).toHaveLength(5);
  });

  it('should render skeleton without extra current streak column for LIFETIME timeframe', () => {
    const { container } = render(<LeaderboardTableSkeleton timeframe="LIFETIME" />);
    
    // Should have 4 column headers (rank, participant, current streak, achievements)
    // No extra current streak column since score IS current streak for lifetime
    const headerCells = container.querySelectorAll('thead th');
    expect(headerCells).toHaveLength(4);
    
    // Should still have 5 skeleton rows
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(5);
  });

  it('should have pulsing animation classes', () => {
    const { container } = render(<LeaderboardTableSkeleton timeframe="MONTH" />);
    
    // Check that skeleton elements have animate-pulse class
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });
});
