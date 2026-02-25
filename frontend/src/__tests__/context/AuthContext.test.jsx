import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';

function TestConsumer() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user-name">{user ? user.name : 'no-user'}</span>
      <span data-testid="user-role">{user ? user.role : 'none'}</span>
      <button
        onClick={() =>
          login({ id: '1', name: 'Alice', role: 'customer', email: 'a@t.com' }, 'tok-abc')
        }
      >
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

beforeEach(() => localStorage.clear());

describe('AuthContext', () => {
  it('starts with null user when localStorage is empty', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('user-name').textContent).toBe('no-user');
  });

  it('reads persisted user from localStorage on initial render', () => {
    localStorage.setItem('user', JSON.stringify({ id: '2', name: 'Bob', role: 'farmer' }));
    localStorage.setItem('token', 'existing-token');
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('user-name').textContent).toBe('Bob');
    expect(screen.getByTestId('user-role').textContent).toBe('farmer');
  });

  it('login() sets user state and persists to localStorage', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    act(() => { screen.getByText('login').click(); });
    expect(screen.getByTestId('user-name').textContent).toBe('Alice');
    expect(localStorage.getItem('token')).toBe('tok-abc');
    expect(JSON.parse(localStorage.getItem('user')).name).toBe('Alice');
  });

  it('logout() clears state and removes localStorage entries', () => {
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Alice', role: 'customer' }));
    localStorage.setItem('token', 'tok-abc');
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    act(() => { screen.getByText('logout').click(); });
    expect(screen.getByTestId('user-name').textContent).toBe('no-user');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('handles malformed localStorage JSON without throwing', () => {
    localStorage.setItem('user', 'not-valid-json{{{');
    expect(() => render(<AuthProvider><TestConsumer /></AuthProvider>)).not.toThrow();
    expect(screen.getByTestId('user-name').textContent).toBe('no-user');
  });
});
