import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Button, Paper, Divider, IconButton,
  Snackbar, Alert, CircularProgress, TextField, Checkbox, FormControlLabel,
  Chip, FormControl, InputLabel, Select, MenuItem, Radio, RadioGroup,
} from '@mui/material';
import { Add, Remove, Delete, ShoppingCartCheckout, LocalOffer } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { getCategoryEmoji, formatINR, getShippingTierLabel, TRANSPORT_TIERS } from '../utils/constants';
import { pushEvent } from '../utils/gtm';

const EMPTY_ADDRESS = { street: '', city: '', state: '', postalCode: '', country: '' };

function isAddressValid(addr) {
  return addr && addr.street?.trim() && addr.city?.trim() && addr.state?.trim() && addr.postalCode?.trim();
}

function addressesMatch(a, b) {
  if (!a || !b) return false;
  return a.street === b.street && a.city === b.city && a.state === b.state
    && a.postalCode === b.postalCode && a.country === b.country;
}

function formatAddressLabel(addr, fallbackLabel) {
  if (!addr) return fallbackLabel;
  const parts = [addr.street, addr.city, addr.state, addr.postalCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : fallbackLabel;
}

function AddressForm({ title, values, onChange, t }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{title}</Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <TextField fullWidth size="small" label={t('cart.street')} name="street" value={values.street} onChange={onChange} required />
        <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField size="small" label={t('cart.city')} name="city" value={values.city} onChange={onChange} sx={{ flex: 1 }} required />
          <TextField size="small" label={t('cart.state')} name="state" value={values.state} onChange={onChange} sx={{ flex: 1 }} required />
        </Box>
        <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField size="small" label={t('cart.postal')} name="postalCode" value={values.postalCode} onChange={onChange} sx={{ flex: 1 }} required />
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
    farmerGroups, isMultiFarmer,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [billingAddress, setBillingAddress] = useState({ ...EMPTY_ADDRESS });
  const [deliveryAddress, setDeliveryAddress] = useState({ ...EMPTY_ADDRESS });
  const [sameAsBlling, setSameAsBilling] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState('profile');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [shippingPayment, setShippingPayment] = useState('online');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch profile and pre-populate addresses on mount
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/profile');
      const billing = data.billingAddress || {};
      const delivery = data.deliveryAddress || {};
      const saved = data.savedAddresses || [];

      // Pre-populate billing address from profile
      if (isAddressValid(billing)) {
        setBillingAddress({ ...EMPTY_ADDRESS, ...billing });
      }
      if (isAddressValid(delivery) && !addressesMatch(billing, delivery)) {
        setDeliveryAddress({ ...EMPTY_ADDRESS, ...delivery });
        setSameAsBilling(false);
      }
      setSavedAddresses(saved);
      setProfileLoaded(true);
    } catch {
      // If profile fetch fails (e.g. not logged in), continue with empty fields
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleAddressChange = (setter) => (e) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle saved address selection
  const handleAddressSelect = (e) => {
    const value = e.target.value;
    setSelectedAddressIdx(value);

    if (value === 'new') {
      setBillingAddress({ ...EMPTY_ADDRESS });
    } else if (value === 'profile') {
      // Reset will be handled by profile data (already loaded)
      fetchProfile();
    } else {
      const idx = parseInt(value, 10);
      const addr = savedAddresses[idx];
      if (addr) {
        setBillingAddress({
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || '',
        });
      }
    }
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

  // Save address if it's new (not matching any existing saved address or profile address)
  const saveNewAddressIfNeeded = async (addr) => {
    try {
      const isAlreadySaved = savedAddresses.some(sa => addressesMatch(sa, addr));
      if (!isAlreadySaved) {
        await api.put('/auth/profile/address', {
          label: `Address ${savedAddresses.length + 1}`,
          ...addr,
        });
      }
    } catch {
      // Non-critical — don't block checkout if save fails
    }
  };

  const handleCheckout = async () => {
    const deliveryAddr = sameAsBlling ? billingAddress : deliveryAddress;

    // Validate address before proceeding
    if (!isAddressValid(billingAddress)) {
      setSnack({ open: true, msg: 'Please fill in all required billing address fields.', severity: 'error' });
      return;
    }
    if (!sameAsBlling && !isAddressValid(deliveryAddr)) {
      setSnack({ open: true, msg: 'Please fill in all required delivery address fields.', severity: 'error' });
      return;
    }

    pushEvent('begin_checkout', {
      ecommerce: {
        value: discountedTotal,
        currency: 'INR',
        items: items.map(i => ({ item_id: i.id, item_name: i.name, item_category: i.category, price: i.price, quantity: i.qty })),
      },
    });

    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setSnack({ open: true, msg: 'Payment gateway failed to load. Check your connection.', severity: 'error' });
        return;
      }

      // Save new address in background if it differs from saved ones
      saveNewAddressIfNeeded(billingAddress);
      if (!sameAsBlling) {
        saveNewAddressIfNeeded(deliveryAddr);
      }

      const orderItems = items.map(i => ({ fruitId: i.id, quantity: i.qty }));

      // Step 1: Create order on backend -> get Razorpay order details
      const { data } = await api.post('/payment/create-order', {
        items: orderItems,
        billingAddress,
        deliveryAddress: deliveryAddr,
        voucherCode: voucher ? voucher.code : undefined,
        shippingPayment,
        shippingFee,
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

  const billingValid = isAddressValid(billingAddress);
  const deliveryValid = sameAsBlling || isAddressValid(deliveryAddress);
  const canCheckout = billingValid && deliveryValid && !loading;

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

      {isMultiFarmer && (
        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="body2" color="info.main" fontWeight="bold">
            📦 Items from {farmerGroups.length} farmers — each will be shipped separately
          </Typography>
        </Box>
      )}

      {isMultiFarmer ? farmerGroups.map((group, gIdx) => (
        <Paper key={group.farmerId} elevation={2} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              🌾 Shipment {gIdx + 1} — {group.farmerName}
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight="bold">
              Est. delivery: 3–5 business days
            </Typography>
          </Box>
          {group.items.map((item, idx) => (
            <Box key={item.id}>
              <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                <Typography fontSize={{ xs: '2rem', sm: '2.5rem' }} lineHeight={1} flexShrink={0}>{getCategoryEmoji(item.category)}</Typography>
                <Box flexGrow={1} minWidth={0}>
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatINR(item.price)}/{item.unit}
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
              {idx < group.items.length - 1 && <Divider />}
            </Box>
          ))}
          <Divider />
          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Subtotal: <strong>{formatINR(group.subtotal)}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Shipping share: <strong>{formatINR(group.shippingShare)}</strong>
            </Typography>
            {group.transportCost > 0 && (
              <Typography variant="caption" color="text.secondary">
                Transport: <strong>{formatINR(group.transportCost)}</strong>
              </Typography>
            )}
          </Box>
        </Paper>
      )) : (
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
      )}

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

        {/* Address selector — only show if there are saved addresses */}
        {profileLoaded && savedAddresses.length > 0 && (
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Address</InputLabel>
            <Select value={selectedAddressIdx} onChange={handleAddressSelect} label="Select Address">
              <MenuItem value="profile">Profile Address</MenuItem>
              {savedAddresses.map((addr, idx) => (
                <MenuItem key={idx} value={String(idx)}>
                  {addr.label || formatAddressLabel(addr, `Address ${idx + 1}`)}
                </MenuItem>
              ))}
              <MenuItem value="new">Enter New Address</MenuItem>
            </Select>
          </FormControl>
        )}

        <AddressForm title={t('cart.billing_address')} values={billingAddress} onChange={handleAddressChange(setBillingAddress)} t={t} />
        {!billingValid && profileLoaded && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
            Please fill in street, city, state and postal code
          </Typography>
        )}
        <FormControlLabel
          sx={{ mt: 1.5 }}
          control={<Checkbox checked={sameAsBlling} onChange={e => setSameAsBilling(e.target.checked)} name="sameAsBlling" />}
          label={t('cart.same_as_billing')}
        />
        {!sameAsBlling && (
          <Box mt={1}>
            <AddressForm title={t('cart.delivery_address')} values={deliveryAddress} onChange={handleAddressChange(setDeliveryAddress)} t={t} />
            {!deliveryValid && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                Please fill in street, city, state and postal code
              </Typography>
            )}
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
        {isMultiFarmer && (
          <Box sx={{ bgcolor: 'info.50', borderRadius: 1, px: 1.5, py: 1, mb: 1 }}>
            <Typography variant="caption" color="info.main" fontWeight="bold" display="block" mb={0.5}>
              Shipping split across {farmerGroups.length} separate shipments
            </Typography>
            {farmerGroups.map((g, i) => (
              <Box key={g.farmerId} display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Shipment {i + 1} — {g.farmerName}</Typography>
                <Typography variant="caption" color="text.secondary">{formatINR(g.shippingShare)}</Typography>
              </Box>
            ))}
          </Box>
        )}

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

        {/* Shipping payment option */}
        {(shippingFee > 0 || transportTotal > 0) && (
          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, px: 1.5, py: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" mb={0.5}>
              Shipping & transport payment
            </Typography>
            <RadioGroup row value={shippingPayment} onChange={e => setShippingPayment(e.target.value)}>
              <FormControlLabel value="online" control={<Radio size="small" />} label={<Typography variant="body2">Pay now</Typography>} />
              <FormControlLabel value="cod" control={<Radio size="small" />} label={<Typography variant="body2">Cash on Delivery</Typography>} />
            </RadioGroup>
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
        {shippingPayment === 'cod' && (shippingFee > 0 || transportTotal > 0) && (
          <>
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="body2" color="text.secondary">Pay online now</Typography>
              <Typography variant="body2" fontWeight="bold">{formatINR(discountedTotal - shippingFee - transportTotal)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="body2" color="warning.main">Cash on Delivery</Typography>
              <Typography variant="body2" fontWeight="bold" color="warning.main">{formatINR(shippingFee + transportTotal)}</Typography>
            </Box>
          </>
        )}
        {shippingPayment === 'online' && (shippingFee > 0 || transportTotal > 0) && (
          <Typography variant="caption" color="success.main" display="block" mt={0.5} textAlign="center">
            Shipping & transport ({formatINR(shippingFee + transportTotal)}) included in payment
          </Typography>
        )}
      </Paper>

      <Button
        variant="contained" fullWidth size="large"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartCheckout />}
        onClick={handleCheckout}
        disabled={!canCheckout}
      >
        {loading ? t('cart.placing') : t('cart.place_order', {
          amount: formatINR(shippingPayment === 'cod' ? Math.max(0, discountedTotal - shippingFee - transportTotal) : discountedTotal),
        })}
      </Button>
      {shippingPayment === 'cod' && (shippingFee > 0 || transportTotal > 0) && (
        <Typography variant="caption" color="warning.main" textAlign="center" display="block" mt={0.5}>
          + {formatINR(shippingFee + transportTotal)} to be collected on delivery
        </Typography>
      )}

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
