import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Chip, Divider, CircularProgress,
  Button, Collapse, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Snackbar, Alert,
} from '@mui/material';
import { Receipt, ExpandMore, ExpandLess, CreditCard, AssignmentReturn } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { STATUS_COLORS, STATUS_LABELS, getCategoryEmoji, formatOrderId, formatINR } from '../utils/constants';

const UNIT_WEIGHT_KG = { kg: 1, piece: 0.3, dozen: 1.2, box: 5, bunch: 0.5 };
function orderItemWeightKg(item) {
  return item.quantity * (UNIT_WEIGHT_KG[item.unit] || 1);
}

const CANCELLABLE = ['payment_pending', 'payment_complete', 'pending', 'confirmed', 'accepted'];
const PAYMENT_STATUSES = ['payment_pending', 'payment_authorized', 'payment_captured', 'payment_complete', 'payment_failed'];

function TransactionRow({ tx }) {
  const icon = tx.type === 'refund' ? '↩' : '↗';
  const color = tx.type === 'refund' ? 'success.main' : 'text.primary';
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
      <Box>
        <Typography variant="caption" color={color} fontWeight="bold">
          {icon} {tx.type === 'refund' ? 'Refund' : 'Payment'} — {tx.status}
        </Typography>
        {tx.razorpayId && (
          <Typography variant="caption" color="text.disabled" display="block">
            {tx.razorpayId}
          </Typography>
        )}
        {tx.note && (
          <Typography variant="caption" color="text.secondary" display="block">{tx.note}</Typography>
        )}
      </Box>
      <Box textAlign="right">
        <Typography variant="caption" fontWeight="bold">{formatINR(tx.amount)}</Typography>
        <Typography variant="caption" color="text.disabled" display="block">
          {new Date(tx.createdAt).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}

function OrderCard({ order, userRole, onCancelled }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isCancellable = userRole === 'customer' && CANCELLABLE.includes(order.status);
  const willRefund = ['payment_complete', 'pending', 'confirmed', 'accepted'].includes(order.status) && order.razorpayPaymentId;
  const hasTransactions = order.transactions && order.transactions.length > 0;

  // Group items by farmer for multi-farmer display
  const itemsByFarmer = {};
  for (const item of order.items) {
    if (!itemsByFarmer[item.farmerId]) {
      itemsByFarmer[item.farmerId] = { farmerName: item.farmerName, items: [], weightKg: 0, transportCost: 0 };
    }
    itemsByFarmer[item.farmerId].items.push(item);
    itemsByFarmer[item.farmerId].weightKg += orderItemWeightKg(item);
    itemsByFarmer[item.farmerId].transportCost += (item.transportCostPerUnit || 0) * item.quantity;
  }
  const totalOrderWeightKg = order.items.reduce((s, i) => s + orderItemWeightKg(i), 0);
  const hasMultipleFarmers = Object.keys(itemsByFarmer).length > 1;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.put(`/orders/${order._id}/cancel`);
      setConfirmOpen(false);
      onCancelled(res.data.order);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Order {formatOrderId(order._id)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(order.createdAt).toLocaleString()}
          </Typography>
        </Box>
        {/* Show overall status chip only for single-farmer orders or farmer view */}
        {(!hasMultipleFarmers || userRole === 'farmer') && (
          <Chip
            label={STATUS_LABELS[order.status] || order.status.toUpperCase()}
            color={STATUS_COLORS[order.status] || 'default'}
            size="small"
          />
        )}
      </Box>

      {userRole === 'farmer' && (
        <Typography variant="body2" color="text.secondary" mb={1}>
          Customer: {order.customerName}
        </Typography>
      )}

      <Divider sx={{ mb: 1 }} />

      {/* Items grouped by farmer for multi-farmer orders (customer view) */}
      {hasMultipleFarmers && userRole === 'customer' ? (
        Object.entries(itemsByFarmer).map(([farmerId, { farmerName, items: farmerItems, weightKg, transportCost }], groupIdx) => {
          const farmerStatus = order.itemStatuses?.find(s => s.farmerId === farmerId);
          const shippingShare = totalOrderWeightKg > 0
            ? Math.round((order.shippingFee || 0) * weightKg / totalOrderWeightKg)
            : 0;
          return (
            <Box key={farmerId}>
              {groupIdx > 0 && <Divider sx={{ my: 1 }} />}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                  🌾 Shipment {groupIdx + 1} — {farmerName}
                </Typography>
                {farmerStatus && (
                  <Chip
                    label={STATUS_LABELS[farmerStatus.status] || farmerStatus.status.replace(/_/g, ' ').toUpperCase()}
                    color={STATUS_COLORS[farmerStatus.status] || 'default'}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              {farmerStatus?.estimatedDelivery && (
                <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                  📅 Est. delivery: {new Date(farmerStatus.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>
              )}
              {farmerItems.map((item, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">
                    {getCategoryEmoji(item.category)} {item.fruitName} × {item.quantity} {item.unit}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">{formatINR(item.subtotal)}</Typography>
                </Box>
              ))}
              <Box display="flex" gap={2} mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Shipping: <strong>{formatINR(shippingShare)}</strong>
                </Typography>
                {transportCost > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Transport: <strong>{formatINR(transportCost)}</strong>
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })
      ) : (
        order.items.map((item, idx) => (
          <Box key={idx} display="flex" justifyContent="space-between" py={0.5}>
            <Typography variant="body2">
              {getCategoryEmoji(item.category)} {item.fruitName} × {item.quantity} {item.unit}
            </Typography>
            <Typography variant="body2" fontWeight="bold">{formatINR(item.subtotal)}</Typography>
          </Box>
        ))
      )}

      <Divider sx={{ mt: 1, mb: 1 }} />

      {/* Total */}
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="subtitle2">Total</Typography>
        <Typography variant="subtitle2" color="primary" fontWeight="bold">
          {formatINR(order.total)}
        </Typography>
      </Box>

      {/* COD amount indicator */}
      {order.shippingPayment === 'cod' && order.codAmount > 0 && (
        <>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">Paid online</Typography>
            <Typography variant="caption" fontWeight="bold">{formatINR(order.total - order.codAmount)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="warning.main">Cash on Delivery</Typography>
            <Typography variant="caption" fontWeight="bold" color="warning.main">{formatINR(order.codAmount)}</Typography>
          </Box>
        </>
      )}

      {/* Payment status row (only for payment-related statuses or if paidAt set) */}
      {(PAYMENT_STATUSES.includes(order.status) || order.paidAt) && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <CreditCard fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">Payment</Typography>
          </Box>
          <Box textAlign="right">
            {order.paidAt ? (
              <Typography variant="caption" color="success.main">
                Paid on {new Date(order.paidAt).toLocaleDateString()}
              </Typography>
            ) : (
              <Typography variant="caption" color="warning.main">
                {STATUS_LABELS[order.status] || 'Pending'}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Estimated delivery — only for single-farmer orders; multi-farmer shows per-farmer above */}
      {order.estimatedDelivery && !hasMultipleFarmers && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
          <Typography variant="caption" color="text.secondary">📅 Est. Delivery</Typography>
          <Typography variant="caption" fontWeight="bold">
            {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>
      )}

      {/* Cancellation date */}
      {order.cancelledAt && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
          <Typography variant="caption" color="error.main">Cancelled on</Typography>
          <Typography variant="caption" color="error.main">
            {new Date(order.cancelledAt).toLocaleDateString()}
          </Typography>
        </Box>
      )}

      {/* Transactions toggle */}
      {hasTransactions && (
        <>
          <Divider sx={{ mt: 1, mb: 0.5 }} />
          <Box
            display="flex" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', py: 0.5 }}
            onClick={() => setExpanded(v => !v)}
          >
            <AssignmentReturn fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Payment Transactions ({order.transactions.length})
            </Typography>
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </Box>
          <Collapse in={expanded}>
            <Box sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider', ml: 0.5 }}>
              {order.transactions.map((tx, i) => (
                <TransactionRow key={i} tx={tx} />
              ))}
            </Box>
          </Collapse>
        </>
      )}

      {/* Cancel button */}
      {isCancellable && (
        <>
          <Divider sx={{ mt: 1.5, mb: 1 }} />
          <Box display="flex" justifyContent="flex-end">
            <Button
              size="small" color="error" variant="outlined"
              onClick={() => setConfirmOpen(true)}
            >
              Cancel Order
            </Button>
          </Box>
        </>
      )}

      {/* Confirm cancel dialog */}
      <Dialog open={confirmOpen} onClose={() => !cancelling && setConfirmOpen(false)}>
        <DialogTitle>Cancel this order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {willRefund
              ? `A full refund of ${formatINR(order.total)} will be initiated to your original payment method. This may take 5–7 business days.`
              : 'This order has not been paid yet. It will simply be cancelled.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={cancelling}>Keep Order</Button>
          <Button onClick={handleCancel} color="error" disabled={cancelling}>
            {cancelling ? <CircularProgress size={18} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const { user } = useAuth();
  const { t } = useTranslation();

  const fetchOrders = useCallback(() => {
    api.get('/orders').then(res => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancelled = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    setSnack({ open: true, msg: 'Order cancelled successfully.', severity: 'success' });
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: { xs: 1.5, sm: 2 } }}>
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
            <OrderCard
              key={order._id}
              order={order}
              userRole={user?.role}
              onCancelled={handleCancelled}
            />
          ))}
        </Box>
      )}

      <Snackbar
        open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
