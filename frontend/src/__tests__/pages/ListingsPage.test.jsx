import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ListingsPage from '../../pages/ListingsPage';
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
  useSearchParams: () => {
    const params = new URLSearchParams();
    return [params, jest.fn()];
  },
}));

const mockFruits = [
  { id: 'f1', name: 'Organic Apple', category: 'Apple', price: 2.5, unit: 'kg', quantity: 100, location: 'CA', farmerName: 'Green Farm', farmerId: 'farm-1', description: '', images: [] },
  { id: 'f2', name: 'Fresh Mango', category: 'Mango', price: 5, unit: 'kg', quantity: 50, location: 'IN', farmerName: 'Sunshine', farmerId: 'farm-2', description: '', images: [] },
];

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('ListingsPage', () => {
  it('shows a loading spinner while fetching', () => {
    api.get.mockReturnValueOnce(new Promise(() => {})); // never resolves
    renderWithProviders(<ListingsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders fruit cards after loading', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruits });
    renderWithProviders(<ListingsPage />);
    await waitFor(() =>
      expect(screen.getByText('Organic Apple')).toBeInTheDocument()
    );
    expect(screen.getByText('Fresh Mango')).toBeInTheDocument();
  });

  it('shows empty state when no listings are found', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    renderWithProviders(<ListingsPage />);
    await waitFor(() =>
      expect(screen.getByText(/No listings found/i)).toBeInTheDocument()
    );
  });

  it('shows result count when listings are returned', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruits });
    renderWithProviders(<ListingsPage />);
    await waitFor(() =>
      expect(screen.getByText(/2 listings found/i)).toBeInTheDocument()
    );
  });

  it('renders BROWSE_CATEGORIES chips including All and Other', () => {
    api.get.mockResolvedValueOnce({ data: [] });
    renderWithProviders(<ListingsPage />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Other' })).toBeInTheDocument();
  });

  it('renders a search text field', () => {
    api.get.mockResolvedValueOnce({ data: [] });
    renderWithProviders(<ListingsPage />);
    expect(screen.getByPlaceholderText(/search fruits/i)).toBeInTheDocument();
  });
});
