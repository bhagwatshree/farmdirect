import React, { useState } from 'react';
import { Card, CardContent, CardActions, Box, Typography, Chip, IconButton } from '@mui/material';
import { Add, Remove, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getCategoryColor, getCategoryEmoji, formatINR } from '../utils/constants';

export default function FruitCard({ fruit }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, updateQty, removeItem, items, openDrawer } = useCart();
  const [imgError, setImgError] = useState(false);
  const { t } = useTranslation();

  const color = getCategoryColor(fruit.category);
  const emoji = getCategoryEmoji(fruit.category);
  const firstImage = fruit.images?.[0];
  const showImage = firstImage && !imgError;

  const cartItem = items.find(i => i.id === fruit.id);
  const qtyInCart = cartItem?.qty || 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    addItem(fruit, 1);
    openDrawer();
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQty(fruit.id, qtyInCart + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (qtyInCart === 1) removeItem(fruit.id);
    else updateQty(fruit.id, qtyInCart - 1);
  };

  const discountPct = fruit.mrp && fruit.mrp > fruit.price
    ? Math.round(((fruit.mrp - fruit.price) / fruit.mrp) * 100)
    : null;

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        cursor: 'pointer', transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
        position: 'relative',
      }}
      onClick={() => navigate(`/listings/${fruit.id}`)}
    >
      {/* Discount badge */}
      {discountPct && (
        <Box sx={{
          position: 'absolute', top: 8, left: 8, zIndex: 1,
          bgcolor: 'error.main', color: 'white',
          borderRadius: 1, px: 0.8, py: 0.2,
        }}>
          <Typography variant="caption" fontWeight="bold">{discountPct}% OFF</Typography>
        </Box>
      )}

      <Box sx={{
        height: { xs: 130, sm: 160 }, bgcolor: color,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {showImage ? (
          <img
            src={firstImage}
            alt={fruit.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Typography fontSize="4rem" lineHeight={1}>{emoji}</Typography>
        )}
        {fruit.images?.length > 1 && (
          <Box sx={{ position: 'absolute', bottom: 6, right: 8, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1, px: 0.8, py: 0.2 }}>
            <Typography variant="caption" color="white">1/{fruit.images.length} 📷</Typography>
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        <Typography variant="h6" fontWeight="bold" noWrap>{fruit.name}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{fruit.farmerName}</Typography>
        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
          <LocationOn sx={{ fontSize: 14 }} color="action" />
          <Typography variant="caption" color="text.secondary" noWrap>{fruit.location}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Box>
            <Typography variant="h6" color="primary" fontWeight="bold" lineHeight={1.2}>
              {formatINR(fruit.price)}/{fruit.unit}
            </Typography>
            {fruit.mrp && fruit.mrp > fruit.price && (
              <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                {formatINR(fruit.mrp)}
              </Typography>
            )}
          </Box>
          <Chip
            label={`${fruit.quantity} ${fruit.unit}`}
            size="small"
            color={fruit.quantity < 20 ? 'warning' : 'success'}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 1 }}>
        {user?.role !== 'farmer' && fruit.quantity > 0 && (
          qtyInCart > 0 ? (
            /* Qty stepper when item is already in cart */
            <Box
              display="flex" alignItems="center" justifyContent="space-between"
              width="100%"
              sx={{ bgcolor: 'primary.main', borderRadius: 2, overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              <IconButton size="small" sx={{ color: 'white', borderRadius: 0, px: 1.5, py: 1 }} onClick={handleDecrement}>
                <Remove fontSize="small" />
              </IconButton>
              <Typography color="white" fontWeight="bold" fontSize="0.95rem">
                {qtyInCart}
              </Typography>
              <IconButton size="small" sx={{ color: 'white', borderRadius: 0, px: 1.5, py: 1 }} onClick={handleIncrement}>
                <Add fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            /* Add button when not in cart */
            <Box
              component="button"
              onClick={handleAdd}
              sx={{
                width: '100%', cursor: 'pointer',
                bgcolor: 'primary.main', color: 'white',
                border: 'none', borderRadius: 2, py: 1.2,
                fontSize: '0.875rem', fontWeight: 'bold',
                '&:hover': { bgcolor: 'primary.dark' },
                transition: 'background-color 0.2s',
              }}
            >
              {t('fruit_card.add_to_cart')}
            </Box>
          )
        )}
      </CardActions>
    </Card>
  );
}
