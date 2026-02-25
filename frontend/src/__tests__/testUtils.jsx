import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

const theme = createTheme({
  palette: {
    primary: { main: '#2e7d32' },
    secondary: { main: '#ff8f00' },
  },
});

/**
 * Renders a component wrapped in all app providers (Theme, Auth, Cart, Router).
 * Pass `user` to pre-seed localStorage so AuthProvider picks it up.
 */
export function renderWithProviders(ui, { route = '/', user = null } = {}) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'test-token');
  } else {
    localStorage.clear();
  }

  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[route]}>
            {ui}
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Shared fixture objects
export const mockFarmer = {
  id: 'farmer-1',
  name: 'Test Farmer',
  email: 'farmer@test.com',
  role: 'farmer',
  location: 'Oregon',
};

export const mockCustomer = {
  id: 'customer-1',
  name: 'Test Customer',
  email: 'customer@test.com',
  role: 'customer',
  location: 'New York',
};

export const mockFruit = {
  id: 'fruit-1',
  name: 'Organic Apple',
  category: 'Apple',
  price: 2.50,
  unit: 'kg',
  quantity: 100,
  location: 'California, USA',
  farmerName: 'Green Farm',
  farmerId: 'farmer-1',
  description: 'Fresh crispy organic apples.',
  images: ['https://example.com/apple.jpg'],
  createdAt: new Date().toISOString(),
};

export const mockOrder = {
  id: 'order-abc123def456',
  customerId: 'customer-1',
  customerName: 'Test Customer',
  items: [{
    fruitId: 'fruit-1',
    fruitName: 'Organic Apple',
    farmerId: 'farmer-1',
    farmerName: 'Green Farm',
    category: 'Apple',
    quantity: 2,
    unit: 'kg',
    pricePerUnit: 2.50,
    subtotal: 5.00,
  }],
  total: 5.00,
  status: 'pending',
  createdAt: new Date().toISOString(),
};

// Required so Jest does not complain that this file has no tests.
test('testUtils exports are defined', () => {
  expect(renderWithProviders).toBeDefined();
  expect(mockFarmer).toBeDefined();
  expect(mockCustomer).toBeDefined();
  expect(mockFruit).toBeDefined();
  expect(mockOrder).toBeDefined();
});
