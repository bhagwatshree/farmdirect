import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Button, Chip, Divider, CircularProgress,
  TextField, Snackbar, Alert, Paper,
} from '@mui/material';
import { LocationOn, Person, ShoppingCart, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ImageCarousel from '../components/ImageCarousel';
import { formatINR } from '../utils/constants';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [fruit, setFruit] = useState(null);
  const [qty, setQty] = useState(1);
  const [snack, setSnack] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    api.get(`/fruits/${id}`)
      .then(res => setFruit(res.data))
      .catch(() => navigate('/listings'));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!fruit) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const handleAddToCart = () => {
    if (!user) return navigate('/login');
    addItem(fruit, qty);
    setSnack(t('product.added_to_cart', { qty, unit: fruit.unit, name: fruit.name }));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 1 }}>{t('product.back')}</Button>

      <Paper elevation={2} sx={{ overflow: 'hidden', borderRadius: 2 }}>
        <ImageCarousel images={fruit.images || []} category={fruit.category} height={300} />

        <Box sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h5" fontWeight="bold">{fruit.name}</Typography>
              <Chip label={fruit.category} size="small" sx={{ mt: 0.5 }} />
            </Box>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {formatINR(fruit.price)}/{fruit.unit}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Person fontSize="small" color="action" />
            <Typography>{fruit.farmerName}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">{fruit.location}</Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {fruit.description}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Typography variant="body2">{t('product.available')}:</Typography>
            <Chip
              label={`${fruit.quantity} ${fruit.unit}`}
              color={fruit.quantity < 20 ? 'warning' : 'success'}
              size="small"
            />
          </Box>

          {user?.role !== 'farmer' && fruit.quantity > 0 && (
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                type="number"
                label={t('product.qty_label', { unit: fruit.unit })}
                value={qty}
                onChange={e => setQty(Math.max(1, Math.min(fruit.quantity, parseInt(e.target.value) || 1)))}
                inputProps={{ min: 1, max: fruit.quantity }}
                sx={{ width: 120 }}
                size="small"
              />
              <Button
                variant="contained" size="large"
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                fullWidth
              >
                {t('product.add_to_cart', { amount: formatINR(fruit.price * qty) })}
              </Button>
            </Box>
          )}

          {fruit.quantity === 0 && (
            <Chip label={t('product.out_of_stock')} color="error" />
          )}
        </Box>
      </Paper>

      <Snackbar
        open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnack('')}>{snack}</Alert>
      </Snackbar>
    </Container>
  );
}
