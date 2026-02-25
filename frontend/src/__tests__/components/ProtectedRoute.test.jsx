import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

beforeEach(() => localStorage.clear());

function setup({ user = null, role, children = <div>protected content</div> } = {}) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'test-token');
  }
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={<ProtectedRoute role={role}>{children}</ProtectedRoute>}
          />
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when no user is authenticated', () => {
    setup({ user: null });
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('redirects to / when authenticated user has the wrong role', () => {
    setup({ user: { id: '1', name: 'Customer', role: 'customer' }, role: 'farmer' });
    expect(screen.getByText('home page')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children when user has the correct role', () => {
    setup({ user: { id: '1', name: 'Farmer', role: 'farmer' }, role: 'farmer' });
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('renders children when user is authenticated with no role restriction', () => {
    setup({ user: { id: '1', name: 'Anyone', role: 'customer' } });
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('renders children for farmer when no role restriction', () => {
    setup({ user: { id: '1', name: 'Farmer', role: 'farmer' } });
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
