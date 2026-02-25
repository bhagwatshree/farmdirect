import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Chip, Divider, CircularProgress,
} from '@mui/material';
import { Receipt } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { STATUS_COLORS, getCategoryEmoji, formatOrderId, formatINR } from '../utils/constants';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Receipt color="primary" />
        <Typography variant="h5" fontWeight="bold">
          {user?.role === 'farmer' ? t('orders.title_farmer') : t('orders.title_customer')}
        </Typography>
      </Box>

      {orders.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <Typography fontSize="3rem">📦</Typography>
          <Typography variant="h6" gutterBottom>{t('orders.no_orders')}</Typography>
          <Typography color="text.secondary">
            {user?.role === 'farmer' ? t('orders.no_orders_farmer') : t('orders.no_orders_customer')}
          </Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {orders.map(order => (
            <Paper key={order.id} elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {t('orders.order')} {formatOrderId(order.id)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(order.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip label={order.status.toUpperCase()} color={STATUS_COLORS[order.status]} size="small" />
              </Box>

              {user?.role === 'farmer' && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {t('orders.customer')}: {order.customerName}
                </Typography>
              )}

              <Divider sx={{ mb: 1 }} />

              {order.items.map((item, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">
                    {getCategoryEmoji(item.category)} {item.fruitName} × {item.quantity} {item.unit}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">{formatINR(item.subtotal)}</Typography>
                </Box>
              ))}

              <Divider sx={{ mt: 1, mb: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2">{t('orders.total')}</Typography>
                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                  {formatINR(order.total)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
}
