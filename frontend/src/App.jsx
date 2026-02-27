import React from 'react';
import './i18n';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import FarmerProfilePage from './pages/FarmerProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FarmerDashboard from './pages/FarmerDashboard';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChatBot from './components/ChatBot';
import CartDrawer from './components/CartDrawer';
import CartBottomBar from './components/CartBottomBar';

const theme = createTheme({
  palette: {
    primary: { main: '#2e7d32' },
    secondary: { main: '#ff8f00' },
  },
  typography: {
    fontFamily: '"Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Kannada", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Navbar />
            <CartDrawer />
            {/* Extra bottom padding on mobile so content isn't hidden by CartBottomBar */}
            <Box sx={{ overflowX: 'hidden', width: '100%', pb: { xs: 9, md: 0 } }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/listings" element={<HomePage />} />
              <Route path="/listings/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/farmer" element={
                <ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute><CartPage /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/order-confirmation/:id" element={
                <ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>
              } />
              <Route path="/farm/:id" element={<FarmerProfilePage />} />
            </Routes>
            </Box>
            <CartBottomBar />
            <ChatBot />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
