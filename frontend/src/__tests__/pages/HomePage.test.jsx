import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import HomePage from '../../pages/HomePage';
import api from '../../api/axios';

jest.mock('../../api/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockFruits = [
  { id: 'f1', name: 'Organic Apple', category: 'Apple', price: 2.5, unit: 'kg', quantity: 100, location: 'CA', farmerName: 'Green Farm', farmerId: 'farm-1', description: '', images: [] },
  { id: 'f2', name: 'Fresh Mango', category: 'Mango', price: 5, unit: 'kg', quantity: 50, location: 'IN', farmerName: 'Sunshine', farmerId: 'farm-2', description: '', images: [] },
];

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  api.get.mockResolvedValue({ data: mockFruits });
});

describe('HomePage', () => {
  it('renders the hero section with search box', async () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/Farm-Fresh Fruits/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search for fruits/i)).toBeInTheDocument();
  });

  it('fetches and renders fruit listings', async () => {
    renderWithProviders(<HomePage />);
    await waitFor(() =>
      expect(screen.getByText('Organic Apple')).toBeInTheDocument()
    );
    expect(screen.getByText('Fresh Mango')).toBeInTheDocument();
  });

  it('renders category chips for browsing', async () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Mango')).toBeInTheDocument();
    // 'Other' should NOT appear in homepage categories
    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });

  it('clicking a category chip navigates to listings with that category', async () => {
    renderWithProviders(<HomePage />);
    fireEvent.click(screen.getByText('Apple'));
    expect(mockNavigate).toHaveBeenCalledWith('/listings?category=Apple');
  });

  it('submitting the search form navigates to /listings with search param', async () => {
    renderWithProviders(<HomePage />);
    const input = screen.getByPlaceholderText(/search for fruits/i);
    fireEvent.change(input, { target: { value: 'mango' } });
    fireEvent.submit(input.closest('form'));
    expect(mockNavigate).toHaveBeenCalledWith('/listings?search=mango');
  });

  it('shows "View All" button when more than 6 fruits are returned', async () => {
    const manyFruits = Array.from({ length: 8 }, (_, i) => ({
      ...mockFruits[0], id: `f${i}`, name: `Fruit ${i}`,
    }));
    api.get.mockResolvedValueOnce({ data: manyFruits });
    renderWithProviders(<HomePage />);
    await waitFor(() =>
      expect(screen.getByText(/View All/i)).toBeInTheDocument()
    );
  });

  it('shows farmer CTA section', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/Are you a farmer/i)).toBeInTheDocument();
  });
});
