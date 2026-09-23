import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Minimal component for testing infrastructure verification
 */
function ExampleComponent() {
  return (
    <div>
      <h1>Phase 0 Foundation</h1>
      <p>Testing infrastructure is operational</p>
      <button>Click me</button>
    </div>
  );
}

describe('ExampleComponent', () => {
  it('renders the component with correct heading', () => {
    render(<ExampleComponent />);
    
    // Use semantic query to find heading
    const heading = screen.getByRole('heading', { level: 1 });
    
    // Verify element is in document and has correct text
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Phase 0 Foundation');
  });
  
  it('renders paragraph with operational message', () => {
    render(<ExampleComponent />);
    
    // Use text content query
    const paragraph = screen.getByText(/testing infrastructure is operational/i);
    
    // Verify using jest-dom matcher
    expect(paragraph).toBeInTheDocument();
  });
  
  it('renders button with correct text', () => {
    render(<ExampleComponent />);
    
    // Use semantic role-based query
    const button = screen.getByRole('button');
    
    // Verify button properties with jest-dom matchers
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });
});
