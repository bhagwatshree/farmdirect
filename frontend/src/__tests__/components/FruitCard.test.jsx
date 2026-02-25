import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import FruitCard from '../../components/FruitCard';

const theme = createTheme();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  localStorage.clear();
});

const baseFruit = {
  id: 'f1',
  name: 'Organic Apple',
  category: 'Apple',
  price: 2.5,
  unit: 'kg',
  quantity: 100,
  location: 'California',
  farmerName: 'Green Farm',
  farmerId: 'farm-1',
  images: [],
};

function renderCard(fruit, user = null) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'test-token');
  }
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <FruitCard fruit={fruit} />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('FruitCard', () => {
  it('renders the fruit name, farmer and price', () => {
    renderCard(baseFruit);
    expect(screen.getByText('Organic Apple')).toBeInTheDocument();
    expect(screen.getByText('Green Farm')).toBeInTheDocument();
    expect(screen.getByText('$2.50/kg')).toBeInTheDocument();
  });

  it('shows the location', () => {
    renderCard(baseFruit);
    expect(screen.getByText('California')).toBeInTheDocument();
  });

  it('shows emoji fallback when no images are provided', () => {
    renderCard(baseFruit);
    expect(screen.getByText('🍎')).toBeInTheDocument();
  });

  it('renders the first image when provided', () => {
    const fruit = { ...baseFruit, images: ['https://example.com/apple.jpg'] };
    renderCard(fruit);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/apple.jpg');
  });

  it('shows multi-image badge when more than one image exists', () => {
    const fruit = { ...baseFruit, images: ['https://img1.com', 'https://img2.com', 'https://img3.com'] };
    renderCard(fruit);
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });

  it('falls back to emoji when image fails to load', () => {
    const fruit = { ...baseFruit, images: ['https://bad-url.example.com/img.jpg'] };
    renderCard(fruit);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByText('🍎')).toBeInTheDocument();
  });

  it('shows Add to Cart button for a customer user', () => {
    renderCard(baseFruit, { id: 'c1', name: 'Customer', role: 'customer' });
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('hides Add to Cart button for a farmer user', () => {
    renderCard(baseFruit, { id: 'f1', name: 'Farmer', role: 'farmer' });
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it('shows Add to Cart for a guest (no user)', () => {
    renderCard(baseFruit);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('navigates to /login when guest clicks Add to Cart', () => {
    renderCard(baseFruit);
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to product detail page on card click', () => {
    renderCard(baseFruit);
    fireEvent.click(screen.getByText('Organic Apple'));
    expect(mockNavigate).toHaveBeenCalledWith('/listings/f1');
  });
});
