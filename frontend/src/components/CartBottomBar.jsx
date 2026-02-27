import React from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import { ShoppingCartCheckout } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/constants';

// Pages where the bar should NOT appear
const HIDDEN_PATHS = ['/cart', '/login', '/register', '/forgot-password', '/reset-password'];

export default function CartBottomBar() {
  const { count, discountedTotal, openDrawer } = useCart();
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Hide if: no items, farmer, on cart/auth pages
  if (
    count === 0 ||
    !user ||
    user.role === 'farmer' ||
    HIDDEN_PATHS.includes(pathname)
  ) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        pb: 'env(safe-area-inset-bottom)',
        // Only show on mobile (hidden on md and above where navbar cart is prominent)
        display: { xs: 'block', md: 'none' },
      }}
    >
      <ButtonBase
        onClick={openDrawer}
        sx={{ width: '100%', display: 'block' }}
      >
        <Box
          sx={{
            mx: 2,
            mb: 1.5,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 3,
            px: 2.5,
            py: 1.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 6,
          }}
        >
          {/* Left: count badge + label */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                bgcolor: 'secondary.main',
                color: 'white',
                borderRadius: 1.5,
                px: 1,
                py: 0.2,
                minWidth: 28,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" fontWeight="bold" lineHeight={1.6}>
                {count}
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {count === 1 ? '1 item' : `${count} items`} in basket
            </Typography>
          </Box>

          {/* Right: total + icon */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight="bold">
              {formatINR(discountedTotal)}
            </Typography>
            <ShoppingCartCheckout fontSize="small" />
          </Box>
        </Box>
      </ButtonBase>
    </Box>
  );
}
