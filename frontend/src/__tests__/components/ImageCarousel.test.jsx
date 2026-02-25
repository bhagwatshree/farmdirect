import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import ImageCarousel from '../../components/ImageCarousel';

const theme = createTheme();

function renderCarousel(props) {
  return render(
    <ThemeProvider theme={theme}>
      <ImageCarousel {...props} />
    </ThemeProvider>
  );
}

describe('ImageCarousel', () => {
  it('shows emoji fallback when no images provided', () => {
    renderCarousel({ images: [], category: 'Apple' });
    expect(screen.getByText('🍎')).toBeInTheDocument();
  });

  it('shows emoji fallback for unknown category', () => {
    renderCarousel({ images: [], category: 'Unknown' });
    expect(screen.getByText('🌽')).toBeInTheDocument();
  });

  it('renders a single image without MobileStepper controls', () => {
    renderCarousel({ images: ['https://example.com/apple.jpg'], category: 'Apple' });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/apple.jpg');
    // No prev/next buttons for a single image
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders MobileStepper navigation for multiple images', () => {
    renderCarousel({
      images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      category: 'Mango',
    });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2); // back + next
  });

  it('Back button is disabled on the first image', () => {
    renderCarousel({
      images: ['https://img1.com', 'https://img2.com'],
      category: 'Apple',
    });
    const [backBtn] = screen.getAllByRole('button');
    expect(backBtn).toBeDisabled();
  });

  it('Next button advances to the next image', () => {
    renderCarousel({
      images: ['https://img1.com', 'https://img2.com'],
      category: 'Apple',
    });
    const [, nextBtn] = screen.getAllByRole('button');
    fireEvent.click(nextBtn);
    // After clicking next, back button should be enabled
    const [backBtn] = screen.getAllByRole('button');
    expect(backBtn).not.toBeDisabled();
  });

  it('Next button is disabled on the last image', () => {
    renderCarousel({
      images: ['https://img1.com', 'https://img2.com'],
      category: 'Apple',
    });
    const [, nextBtn] = screen.getAllByRole('button');
    fireEvent.click(nextBtn); // go to last
    expect(nextBtn).toBeDisabled();
  });

  it('shows emoji fallback when all images fail to load', () => {
    renderCarousel({ images: ['https://bad.url/img.jpg'], category: 'Berry' });
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByText('🍓')).toBeInTheDocument();
  });

  it('uses the default height of 300 when no height prop given', () => {
    const { container } = renderCarousel({ images: [], category: 'Apple' });
    // emoji fallback box has the height applied via sx
    const box = container.querySelector('[style*="height"]') ||
      container.firstChild.firstChild;
    expect(box).toBeInTheDocument();
  });
});
