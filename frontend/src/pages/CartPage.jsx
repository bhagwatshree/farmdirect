import React, { useState } from 'react';
import {
  Container, Typography, Box, Button, Paper, Divider, IconButton,
  Snackbar, Alert, CircularProgress, TextField, Checkbox, FormControlLabel,
  Chip,
} from '@mui/material';
import { Add, Remove, Delete, ShoppingCartCheckout, LocalOffer } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { getCategoryEmoji, formatINR, getShippingTierLabel, TRANSPORT_TIERS } from '../utils/constants';

const EMPTY_ADDRESS = { street: '', city: '', state: '', postalCode: '', country: '' };

function AddressForm({ title, values, onChange, t }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{title}</Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <TextField fullWidth size="small" label={t('cart.street')} name="street" value={values.street} onChange={onChange} />
        <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField size="small" label={t('cart.city')} name="city" value={values.city} onChange={onChange} sx={{ flex: 1 }} />
          <TextField size="small" label={t('cart.state')} name="state" value={values.state} onChange={onChange} sx={{ flex: 1 }} />
        </Box>
        <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField size="small" label={t('cart.postal')} name="postalCode" value={values.postalCode} onChange={onChange} sx={{ flex: 1 }} />
          <TextField size="small" label={t('cart.country')} name="country" value={values.country} onChange={onChange} sx={{ flex: 1 }} />
        </Box>
      </Box>
    </Box>
  );
}

export default function CartPage() {
  const {
    items, removeItem, updateQty, clearCart,
    total, transportTotal, count,
    totalWeightKg, shippingFee,
    voucher, applyVoucher, removeVoucher,
    discountAmount, discountedTotal,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [billingAddress, setBillingAddress] = useState({ ...EMPTY_ADDRESS });
  const [deliveryAddress, setDeliveryAddress] = useState({ ...EMPTY_ADDRESS });
  const [sameAsBlling, setSameAsBilling] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAddressChange = (setter) => (e) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await api.post('/vouchers/validate', { code: voucherCode.trim(), subtotal: total });
      applyVoucher({ code: res.data.code, type: res.data.type, value: res.data.value, discountAmount: res.data.discountAmount });
      setVoucherCode('');
    } catch (err) {
      setVoucherError(err.response?.data?.message || t('cart.invalid_voucher'));
    } finally {
      setVoucherLoading(false);
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setSnack({ open: true, msg: 'Payment gateway failed to load. Check your connection.', severity: 'error' });
        return;
      }

      const orderItems = items.map(i => ({ fruitId: i.id, quantity: i.qty }));
      const deliveryAddr = sameAsBlling ? billingAddress : deliveryAddress;

      // Step 1: Create order on backend → get Razorpay order details
      const { data } = await api.post('/payment/create-order', {
        items: orderItems,
        billingAddress,
        deliveryAddress: deliveryAddr,
        voucherCode: voucher ? voucher.code : undefined,
      });

      // Step 2: Open Razorpay checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'FarmDirect',
        description: 'Fresh produce from local farmers',
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.customerName,
          email: data.customerEmail,
        },
        theme: { color: '#2e7d32' },
        handler: async (response) => {
          try {
            // Step 3: Verify payment signature on backend
            const verifyRes = await api.post('/payment/verify', {
              orderId: data.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            navigate(`/order-confirmation/${data.orderId}`, { state: { order: verifyRes.data.order } });
          } catch (err) {
            console.error('[Payment] Verify failed:', err.response?.data || err.message);
            setSnack({ open: true, msg: err.response?.data?.message || t('cart.order_failed'), severity: 'error' });
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setSnack({ open: true, msg: 'Payment cancelled. Your order is held for 30 minutes.', severity: 'warning' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || t('cart.order_failed'), severity: 'error' });
      setLoading(false);
    }
    // Don't call setLoading(false) here — it stays true until payment modal closes
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, px: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Typography fontSize="4rem">🛒</Typography>
        <Typography variant="h5" gutterBottom>{t('cart.empty_title')}</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{t('cart.empty_body')}</Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/listings')}>
          {t('cart.browse_btn')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>{t('cart.title')}</Typography>

      <Paper elevation={2} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
        {items.map((item, idx) => (
          <Box key={item.id}>
            <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <Typography fontSize={{ xs: '2rem', sm: '2.5rem' }} lineHeight={1} flexShrink={0}>{getCategoryEmoji(item.category)}</Typography>
              <Box flexGrow={1} minWidth={0}>
                <Typography variant="subtitle2" fontWeight="bold" noWrap>{item.name}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatINR(item.price)}/{item.unit}
                  {item.transportCostPerUnit > 0 && ` · ${t('cart.transport_label', { amount: formatINR(item.transportCostPerUnit) })}`}
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {formatINR(item.price * item.qty)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                <IconButton size="small" onClick={() => updateQty(item.id, item.qty - 1)} sx={{ width: 32, height: 32 }}><Remove fontSize="small" /></IconButton>
                <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</Typography>
                <IconButton size="small" onClick={() => updateQty(item.id, item.qty + 1)} sx={{ width: 32, height: 32 }}><Add fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => removeItem(item.id)} sx={{ width: 32, height: 32 }}><Delete fontSize="small" /></IconButton>
              </Box>
            </Box>
            {idx < items.length - 1 && <Divider />}
          </Box>
        ))}
      </Paper>

      <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LocalOffer fontSize="small" color="secondary" />
          <Typography variant="subtitle1" fontWeight="bold">{t('cart.voucher_title')}</Typography>
        </Box>
        {voucher ? (
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={`${voucher.code} — ${formatINR(voucher.discountAmount)} off`} color="success" onDelete={removeVoucher} />
          </Box>
        ) : (
          <Box display="flex" gap={1}>
            <TextField
              size="small" label={t('cart.voucher_placeholder')} value={voucherCode}
              onChange={e => { setVoucherCode(e.target.value); setVoucherError(''); }}
              error={!!voucherError} helperText={voucherError}
              inputProps={{ 'data-testid': 'voucher-input' }}
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" onClick={handleApplyVoucher} disabled={voucherLoading || !voucherCode.trim()}>
              {voucherLoading ? <CircularProgress size={18} /> : t('cart.apply')}
            </Button>
          </Box>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{t('cart.delivery_info')}</Typography>
        <AddressForm title={t('cart.billing_address')} values={billingAddress} onChange={handleAddressChange(setBillingAddress)} t={t} />
        <FormControlLabel
          sx={{ mt: 1.5 }}
          control={<Checkbox checked={sameAsBlling} onChange={e => setSameAsBilling(e.target.checked)} name="sameAsBlling" />}
          label={t('cart.same_as_billing')}
        />
        {!sameAsBlling && (
          <Box mt={1}>
            <AddressForm title={t('cart.delivery_address')} values={deliveryAddress} onChange={handleAddressChange(setDeliveryAddress)} t={t} />
          </Box>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography color="text.secondary">{t('cart.subtotal', { count })}</Typography>
          <Typography fontWeight="bold">{formatINR(total)}</Typography>
        </Box>

        {/* Tiered shipping fee */}
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Box>
            <Typography color="text.secondary">🚚 Shipping</Typography>
            <Typography variant="caption" color="text.secondary">
              {totalWeightKg.toFixed(1)} kg · {getShippingTierLabel(totalWeightKg)}
            </Typography>
          </Box>
          <Typography fontWeight="bold">{formatINR(shippingFee)}</Typography>
        </Box>

        {/* Shipping tier reference */}
        <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, px: 1.5, py: 1, mb: 1, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
            Shipping rates
          </Typography>
          {TRANSPORT_TIERS.map(tier => (
            <Box key={tier.label} display="flex" justifyContent="space-between">
              <Typography variant="caption" color={totalWeightKg <= tier.maxKg && (tier === TRANSPORT_TIERS[0] || totalWeightKg > TRANSPORT_TIERS[TRANSPORT_TIERS.indexOf(tier) - 1]?.maxKg) ? 'primary.main' : 'text.secondary'}
                fontWeight={getShippingTierLabel(totalWeightKg) === tier.label ? 'bold' : 'normal'}>
                {tier.label}
              </Typography>
              <Typography variant="caption" color={getShippingTierLabel(totalWeightKg) === tier.label ? 'primary.main' : 'text.secondary'}
                fontWeight={getShippingTierLabel(totalWeightKg) === tier.label ? 'bold' : 'normal'}>
                {formatINR(tier.cost)}
              </Typography>
            </Box>
          ))}
        </Box>

        {transportTotal > 0 && (
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="text.secondary">{t('cart.transport_cost')}</Typography>
            <Typography fontWeight="bold">{formatINR(transportTotal)}</Typography>
          </Box>
        )}
        {discountAmount > 0 && (
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="success.main">{t('cart.voucher_discount')}</Typography>
            <Typography color="success.main" fontWeight="bold">-{formatINR(discountAmount)}</Typography>
          </Box>
        )}
        <Divider sx={{ my: 1 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">{t('cart.total')}</Typography>
          <Typography variant="h6" color="primary" fontWeight="bold">{formatINR(discountedTotal)}</Typography>
        </Box>
      </Paper>

      <Button
        variant="contained" fullWidth size="large"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartCheckout />}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? t('cart.placing') : t('cart.place_order', { amount: formatINR(discountedTotal) })}
      </Button>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
