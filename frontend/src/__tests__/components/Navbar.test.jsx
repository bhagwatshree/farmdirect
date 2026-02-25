import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import Navbar from '../../components/Navbar';

// Mock useMediaQuery to simulate mobile (isMobile=true).
// This ensures nav items are only rendered inside the Drawer, not duplicated
// in the AppBar, and avoids the window.matchMedia JSDOM limitation.
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => true,
}));

const theme = createTheme({
  palette: { primary: { main: '#2e7d32' }, secondary: { main: '#ff8f00' } },
});
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  localStorage.clear();
});

function renderNavbar(user = null) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'test-token');
  }
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/** Open the side drawer by clicking the hamburger (MenuIcon) button. */
function openDrawer() {
  // MUI renders the MenuIcon with data-testid="MenuIcon"; its parent is the button.
  fireEvent.click(screen.getByTestId('MenuIcon').closest('button'));
}

describe('Navbar', () => {
  it('renders the FarmDirect brand name', () => {
    renderNavbar();
    expect(screen.getAllByText(/FarmDirect/i).length).toBeGreaterThan(0);
  });

  it('shows Login and Register in the drawer for a guest', () => {
    renderNavbar();
    openDrawer();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('shows Logout in the drawer for an authenticated user', () => {
    renderNavbar({ id: 'c1', name: 'Alice', role: 'customer' });
    openDrawer();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('shows "My Farm" navigation for farmer role', () => {
    renderNavbar({ id: 'f1', name: 'Farmer', role: 'farmer' });
    openDrawer();
    expect(screen.getByText('My Farm')).toBeInTheDocument();
  });

  it('shows "Cart" in drawer for customer role', () => {
    renderNavbar({ id: 'c1', name: 'Customer', role: 'customer' });
    openDrawer();
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  it('does NOT show "Cart" in drawer for farmer role', () => {
    renderNavbar({ id: 'f1', name: 'Farmer', role: 'farmer' });
    openDrawer();
    expect(screen.queryByText('Cart')).not.toBeInTheDocument();
  });

  it('shows "Browse" link in the drawer', () => {
    renderNavbar();
    openDrawer();
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  it('clicking Home in drawer navigates to /', () => {
    renderNavbar();
    openDrawer();
    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows the user name in the drawer header when logged in', () => {
    renderNavbar({ id: 'c1', name: 'Alice', role: 'customer' });
    openDrawer();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });
});
