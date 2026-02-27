import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Paper, Divider, Button, Chip, CircularProgress,
} from '@mui/material';
import { CheckCircle, Receipt, Home, ShoppingBag } from '@mui/icons-material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getCategoryEmoji, formatINR, formatOrderId, STATUS_LABELS, STATUS_COLORS } from '../utils/constants';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);

  useEffect(() => {
    if (!state?.order) {
      api.get(`/orders/${id}`)
        .then(res => setOrder(res.data))
        .catch(() => navigate('/orders'))
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;
  if (!order) return null;

  const deliveryAddr = order.deliveryAddress;
  const hasAddress = deliveryAddr && (deliveryAddr.street || deliveryAddr.city);

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: { xs: 1.5, sm: 2 } }}>

      {/* Success banner */}
      <Box textAlign="center" mb={4}>
        <CheckCircle sx={{ fontSize: { xs: 56, sm: 72 }, color: 'success.main', mb: 1 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Order Placed!
        </Typography>
        <Typography color="text.secondary" variant="body1" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Thank you for your order 🎉
        </Typography>
      </Box>

      {/* Order summary card */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>

        {/* Header */}
        <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Receipt />
            <Typography fontWeight="bold">Order {formatOrderId(order._id)}</Typography>
          </Box>
          <Chip
            label={STATUS_LABELS[order.status] || order.status}
            color={STATUS_COLORS[order.status] || 'default'}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </Typography>
        </Box>

        <Divider />

        {/* Items */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Items Ordered</Typography>
          {order.items.map((item, idx) => (
            <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize="1.4rem">{getCategoryEmoji(item.category)}</Typography>
                <Box>
                  <Typography variant="body2" fontWeight="bold">{item.fruitName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.quantity} {item.unit} × {formatINR(item.pricePerUnit)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" fontWeight="bold">{formatINR(item.subtotal)}</Typography>
            </Box>
          ))}
        </Box>

        <Divider />

        {/* Price breakdown */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">Subtotal</Typography>
            <Typography variant="body2">{formatINR(order.subtotal)}</Typography>
          </Box>
          {order.transportCost > 0 && (
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2">{formatINR(order.transportCost)}</Typography>
            </Box>
          )}
          {order.discountAmount > 0 && (
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="success.main">
                Voucher {order.voucherCode ? `(${order.voucherCode})` : 'Discount'}
              </Typography>
              <Typography variant="body2" color="success.main">-{formatINR(order.discountAmount)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight="bold">Total Paid</Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              {formatINR(order.total)}
            </Typography>
          </Box>
        </Box>

        {/* Payment info */}
        {order.paidAt && (
          <>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'success.50' }}>
              <Typography variant="caption" color="success.main" fontWeight="bold">
                ✅ Payment confirmed on {new Date(order.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </Typography>
            </Box>
          </>
        )}

        {/* Delivery address */}
        {hasAddress && (
          <>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>📦 Deliver To</Typography>
              <Typography variant="body2" color="text.secondary">
                {[deliveryAddr.street, deliveryAddr.city, deliveryAddr.state, deliveryAddr.postalCode, deliveryAddr.country]
                  .filter(Boolean).join(', ')}
              </Typography>
            </Box>
          </>
        )}

        {/* Estimated delivery */}
        {order.estimatedDelivery && (
          <>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">📅 Estimated Delivery</Typography>
              <Typography variant="body2" fontWeight="bold">
                {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Action buttons */}
      <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
        <Button
          variant="contained" fullWidth size="large"
          startIcon={<ShoppingBag />}
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>
        <Button
          variant="outlined" fullWidth size="large"
          startIcon={<Receipt />}
          onClick={() => navigate('/orders')}
        >
          All Orders
        </Button>
      </Box>
    </Container>
  );
}
