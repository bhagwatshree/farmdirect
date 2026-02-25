import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import LoginPage from '../../pages/LoginPage';
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

describe('LoginPage', () => {
  it('renders the sign-in form with email and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  it('shows error alert when API returns an error', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'bad@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    );
  });

  it('shows generic error message when API response has no message', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));
    renderWithProviders(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText('Login failed')).toBeInTheDocument()
    );
  });

  it('navigates to /listings after a successful customer login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'tok-123',
        user: { id: '1', name: 'Alice', role: 'customer', email: 'a@t.com' },
      },
    });
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'alice@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/listings')
    );
  });

  it('navigates to /farmer after a successful farmer login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'tok-456',
        user: { id: '2', name: 'Farm', role: 'farmer', email: 'f@t.com' },
      },
    });
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: 'email', value: 'farm@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/farmer')
    );
  });

  it('disables the submit button while request is in flight', async () => {
    let resolve;
    api.post.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    renderWithProviders(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    resolve({ data: { token: 't', user: { id: '1', name: 'A', role: 'customer', email: 'a@t.com' } } });
  });
});
