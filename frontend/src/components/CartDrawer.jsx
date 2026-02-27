import React from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, Divider,
} from '@mui/material';
import { Close, Add, Remove, Delete, ShoppingCartCheckout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getCategoryEmoji, formatINR, getShippingTierLabel, MAX_ORDER_KG } from '../utils/constants';

const MIN_ORDER = 5;

export default function CartDrawer() {
  const {
    items, drawerOpen, closeDrawer,
    updateQty,
    total, count, discountedTotal,
    totalWeightKg, shippingFee,
  } = useCart();
  const navigate = useNavigate();

  const savings = items.reduce((sum, i) => {
    if (i.mrp && i.mrp > i.price) return sum + (i.mrp - i.price) * i.qty;
    return sum;
  }, 0);

  const handleCheckout = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={closeDrawer}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 380 }, display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 2, py: 1.5,
        bgcolor: 'primary.main', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <Typography fontWeight="bold" fontSize="0.95rem">
          Cart Items: ({count} {count === 1 ? 'Item' : 'Items'})
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          {items.length > 0 && (
            <Button
              size="small" variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', py: 0.5, px: 1.5 }}
              onClick={() => { closeDrawer(); navigate('/listings'); }}
            >
              + Add More
            </Button>
          )}
          <IconButton size="small" sx={{ color: 'white' }} onClick={closeDrawer}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Min order warning */}
      {items.length > 0 && total < MIN_ORDER && (
        <Box sx={{ bgcolor: '#fff3e0', px: 2, py: 0.8, flexShrink: 0 }}>
          <Typography variant="caption" color="warning.dark">
            ⚠️ Minimum order is {formatINR(MIN_ORDER)} — add {formatINR(MIN_ORDER - total)} more
          </Typography>
        </Box>
      )}

      {/* Items list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <Box textAlign="center" py={8} px={3}>
            <Typography fontSize="3.5rem">🛒</Typography>
            <Typography variant="h6" mt={1} gutterBottom>Your cart is empty</Typography>
            <Typography color="text.secondary" variant="body2" mb={3}>
              Add fresh produce from local farmers
            </Typography>
            <Button variant="contained" onClick={() => { closeDrawer(); navigate('/listings'); }}>
              Browse Products
            </Button>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase" letterSpacing={0.5}>
                Your Cart Details
              </Typography>
            </Box>
            {items.map((item, idx) => (
              <Box key={item.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                  {/* Product image/emoji */}
                  <Box sx={{
                    width: 54, height: 54, borderRadius: 2,
                    bgcolor: 'grey.100',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]} alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Typography fontSize="1.8rem" lineHeight={1}>
                        {getCategoryEmoji(item.category)}
                      </Typography>
                    )}
                  </Box>

                  {/* Name + price */}
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight="bold" noWrap>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.unit}</Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {formatINR(item.price * item.qty)}
                      </Typography>
                      {item.mrp && item.mrp > item.price && (
                        <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          {formatINR(item.mrp * item.qty)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Qty stepper */}
                  <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                    <IconButton
                      size="small"
                      sx={{ bgcolor: item.qty === 1 ? 'error.50' : 'grey.100', width: { xs: 36, sm: 32 }, height: { xs: 36, sm: 32 } }}
                      onClick={() => updateQty(item.id, item.qty - 1)}
                    >
                      {item.qty === 1
                        ? <Delete sx={{ fontSize: 14 }} color="error" />
                        : <Remove sx={{ fontSize: 14 }} />
                      }
                    </IconButton>
                    <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {item.qty}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ bgcolor: 'primary.main', color: 'white', width: { xs: 36, sm: 32 }, height: { xs: 36, sm: 32 }, '&:hover': { bgcolor: 'primary.dark' } }}
                      onClick={() => updateQty(item.id, item.qty + 1)}
                    >
                      <Add sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>
                {idx < items.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Footer */}
      {items.length > 0 && (
        <Box sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
          {/* Weight + shipping tier */}
          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, px: 1.5, py: 1, mb: 1.5 }}>
            <Box display="flex" justifyContent="space-between" mb={0.4}>
              <Typography variant="caption" color="text.secondary">
                🏋️ Total weight
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {totalWeightKg.toFixed(1)} kg
                {totalWeightKg >= MAX_ORDER_KG * 0.9 && (
                  <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 0.5 }}>
                    (near {MAX_ORDER_KG} kg max)
                  </Typography>
                )}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                🚚 Shipping ({getShippingTierLabel(totalWeightKg)})
              </Typography>
              <Typography variant="caption" fontWeight="bold" color="primary.main">
                {formatINR(shippingFee)}
              </Typography>
            </Box>
          </Box>

          {savings > 0 && (
            <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ display: 'block', mb: 1 }}>
              🎉 You're saving {formatINR(savings)} on this order!
            </Typography>
          )}
          <Button
            variant="contained" fullWidth size="large"
            startIcon={<ShoppingCartCheckout />}
            onClick={handleCheckout}
            disabled={total < MIN_ORDER}
            sx={{ borderRadius: 2, py: 1.2, fontWeight: 'bold' }}
          >
            <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
              <span>{count} {count === 1 ? 'Item' : 'Items'} · {formatINR(discountedTotal)}</span>
              <span>Checkout →</span>
            </Box>
          </Button>
          {total < MIN_ORDER && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.75 }}>
              Add {formatINR(MIN_ORDER - total)} more to unlock checkout
            </Typography>
          )}
        </Box>
      )}
    </Drawer>
  );
}
