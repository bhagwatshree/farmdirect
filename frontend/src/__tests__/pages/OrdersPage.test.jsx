import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import OrdersPage from '../../pages/OrdersPage';
import api from '../../api/axios';
import { mockCustomer, mockFarmer, mockOrder } from '../testUtils';

jest.mock('../../api/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.setTimeout(15000);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('OrdersPage', () => {
  it('shows a loading spinner before data arrives', () => {
    api.get.mockReturnValueOnce(new Promise(() => {}));
    renderWithProviders(<OrdersPage />, { user: mockCustomer });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state message for customer with no orders', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    renderWithProviders(<OrdersPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText(/No orders yet/i)).toBeInTheDocument()
    );
  });

  it('shows "My Orders" heading for customer role', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    renderWithProviders(<OrdersPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText('My Orders')).toBeInTheDocument()
    );
  });

  it('shows "Incoming Orders" heading for farmer role', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    renderWithProviders(<OrdersPage />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText('Incoming Orders')).toBeInTheDocument()
    );
  });

  it('renders order card with formatted order ID', async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });
    renderWithProviders(<OrdersPage />, { user: mockCustomer });
    // formatOrderId: 'order-abc123def456'.slice(0,8).toUpperCase() = 'ORDER-AB'
    await waitFor(() =>
      expect(screen.getByText(/Order #ORDER-AB/i)).toBeInTheDocument()
    );
  });

  it('renders item name and quantity from the order', async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });
    renderWithProviders(<OrdersPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText(/Organic Apple × 2 kg/i)).toBeInTheDocument()
    );
  });

  it('shows status chip with correct label', async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });
    renderWithProviders(<OrdersPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    );
  });

  it('shows customer name for farmer view', async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });
    renderWithProviders(<OrdersPage />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText(/Test Customer/i)).toBeInTheDocument()
    );
  });

  it('renders item emoji from category', async () => {
    api.get.mockResolvedValueOnce({ data: [mockOrder] });
    renderWithProviders(<OrdersPage />, { user: mockCustomer });
    await waitFor(() =>
      expect(screen.getByText(/🍎/)).toBeInTheDocument()
    );
  });
});
