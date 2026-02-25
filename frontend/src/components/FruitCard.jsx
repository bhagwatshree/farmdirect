import React, { useState } from 'react';
import { Card, CardContent, CardActions, Box, Typography, Chip, Button } from '@mui/material';
import { ShoppingCart, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getCategoryColor, getCategoryEmoji, formatINR } from '../utils/constants';

export default function FruitCard({ fruit }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [imgError, setImgError] = useState(false);
  const { t } = useTranslation();

  const color = getCategoryColor(fruit.category);
  const emoji = getCategoryEmoji(fruit.category);
  const firstImage = fruit.images?.[0];
  const showImage = firstImage && !imgError;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    addItem(fruit, 1);
  };

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        cursor: 'pointer', transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
      }}
      onClick={() => navigate(`/listings/${fruit.id}`)}
    >
      <Box sx={{ height: 160, bgcolor: color, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
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
          <Typography variant="h6" color="primary" fontWeight="bold">
            {formatINR(fruit.price)}/{fruit.unit}
          </Typography>
          <Chip
            label={`${fruit.quantity} ${fruit.unit}`}
            size="small"
            color={fruit.quantity < 20 ? 'warning' : 'success'}
          />
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 1 }}>
        {user?.role !== 'farmer' && (
          <Button
            variant="contained" fullWidth size="small"
            startIcon={<ShoppingCart />}
            onClick={handleAddToCart}
          >
            {t('fruit_card.add_to_cart')}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
