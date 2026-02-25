import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import RegisterPage from '../../pages/RegisterPage';
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

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('RegisterPage', () => {
  it('renders all required fields', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows Customer and Farmer radio options', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText('Customer')).toBeInTheDocument();
    expect(screen.getByLabelText('Farmer')).toBeInTheDocument();
  });

  it('defaults to Customer role', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText('Customer')).toBeChecked();
  });

  it('shows Phone field when Farmer role is selected', () => {
    renderWithProviders(<RegisterPage />);
    fireEvent.click(screen.getByLabelText('Farmer'));
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it('hides Phone field when Customer role is selected', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });

  it('shows API error message on failure', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Email already registered' } },
    });
    renderWithProviders(<RegisterPage />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    );
  });

  it('navigates to /listings after customer registration', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'tok',
        user: { id: '1', name: 'Alice', role: 'customer', email: 'a@t.com' },
      },
    });
    renderWithProviders(<RegisterPage />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/listings')
    );
  });

  it('navigates to /farmer after farmer registration', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'tok',
        user: { id: '2', name: 'Farm', role: 'farmer', email: 'f@t.com' },
      },
    });
    renderWithProviders(<RegisterPage />);
    fireEvent.click(screen.getByLabelText('Farmer'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/farmer')
    );
  });

  it('disables button while request is in flight', async () => {
    let resolve;
    api.post.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    renderWithProviders(<RegisterPage />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    resolve({ data: { token: 't', user: { id: '1', name: 'A', role: 'customer', email: 'a@t.com' } } });
  });

  it('shows billing address fields for customer role', () => {
    renderWithProviders(<RegisterPage />);
    // Default role is customer, so billing address section should be visible
    expect(screen.getByText('Billing Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Street Address')).toBeInTheDocument();
  });

  it('shows "delivery address same as billing" checkbox for customer', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/delivery address same as billing/i)).toBeInTheDocument();
  });

  it('does NOT show billing address fields for farmer role', () => {
    renderWithProviders(<RegisterPage />);
    fireEvent.click(screen.getByLabelText('Farmer'));
    expect(screen.queryByText('Billing Address')).not.toBeInTheDocument();
  });

  it('shows separate delivery address form when "same as billing" is unchecked', () => {
    renderWithProviders(<RegisterPage />);
    const checkbox = screen.getByLabelText(/delivery address same as billing/i);
    fireEvent.click(checkbox); // uncheck
    expect(screen.getByText('Delivery Address')).toBeInTheDocument();
    // Now two Street Address fields (billing + delivery)
    expect(screen.getAllByLabelText('Street Address')).toHaveLength(2);
  });

  it('does not show delivery address form when "same as billing" is checked (default)', () => {
    renderWithProviders(<RegisterPage />);
    // Default is checked, so only one Street Address field (billing)
    expect(screen.getAllByLabelText('Street Address')).toHaveLength(1);
    expect(screen.queryByText('Delivery Address')).not.toBeInTheDocument();
  });

  it('includes billingAddress in registration payload for customer', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'tok',
        user: { id: '1', name: 'Alice', role: 'customer', email: 'a@t.com' },
      },
    });
    renderWithProviders(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Street Address'), { target: { value: '10 Farm Rd' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
        billingAddress: expect.objectContaining({ street: '10 Farm Rd' }),
      }))
    );
  });
});
