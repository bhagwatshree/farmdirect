import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import ProductDetailPage from '../../pages/ProductDetailPage';
import api from '../../api/axios';
import { mockFruit, mockCustomer, mockFarmer } from '../testUtils';

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
  useParams: () => ({ id: 'fruit-1' }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('ProductDetailPage', () => {
  it('shows a loading spinner before fruit data arrives', () => {
    api.get.mockReturnValueOnce(new Promise(() => {}));
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('navigates back to /listings if the fruit is not found', async () => {
    api.get.mockRejectedValueOnce(new Error('Not found'));
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/listings')
    );
  });

  it('renders the fruit name and category', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText('Organic Apple')).toBeInTheDocument()
    );
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('shows farmer name and location', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText('Green Farm')).toBeInTheDocument()
    );
    expect(screen.getByText('California, USA')).toBeInTheDocument();
  });

  it('shows the product description', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText('Fresh crispy organic apples.')).toBeInTheDocument()
    );
  });

  it('shows Add to Cart button for customer when in stock', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeInTheDocument()
    );
  });

  it('hides Add to Cart button for farmer users', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<ProductDetailPage />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Add to Cart/i })).not.toBeInTheDocument()
    );
  });

  it('shows Out of Stock chip when quantity is 0', async () => {
    api.get.mockResolvedValueOnce({ data: { ...mockFruit, quantity: 0 } });
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    );
  });

  it('clicking Add to Cart shows success snackbar', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<ProductDetailPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
    await waitFor(() =>
      expect(screen.getByText(/Added.*to cart/i)).toBeInTheDocument()
    );
  });

  it('navigates to /login when guest clicks Add to Cart', async () => {
    api.get.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<ProductDetailPage />); // no user
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
