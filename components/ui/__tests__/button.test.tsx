import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders a button with the given text', () => {
    render(<Button>Click Me</Button>);

    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });
});
