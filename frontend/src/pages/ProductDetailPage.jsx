import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Button, Chip, Divider, CircularProgress,
  Snackbar, Alert, Paper, IconButton, Grid,
} from '@mui/material';
import { LocationOn, Person, Add, Remove, ArrowBack, NavigateNext, PlayCircle } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ImageCarousel from '../components/ImageCarousel';
import FruitCard from '../components/FruitCard';
import { formatINR } from '../utils/constants';

// ── Video helpers ─────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoPlayer({ url, title }) {
  const [playing, setPlaying] = useState(false);
  const ytId = getYouTubeId(url);

  if (ytId) {
    const thumb = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <Box sx={{ position: 'relative', paddingTop: '56.25%', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
        {playing ? (
          <iframe
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
            title={title || 'Product video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Box
            onClick={() => setPlaying(true)}
            sx={{
              position: 'absolute', inset: 0, cursor: 'pointer',
              backgroundImage: `url(${thumb})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              '&:hover .play-icon': { transform: 'scale(1.12)' },
              '&::after': { content: '""', position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.22)' },
            }}
          >
            <PlayCircle
              className="play-icon"
              sx={{
                fontSize: { xs: 56, sm: 72 }, color: 'rgba(255,255,255,0.93)',
                transition: 'transform 0.2s', zIndex: 1,
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.6))',
              }}
            />
          </Box>
        )}
      </Box>
    );
  }

  // Direct video file (mp4, webm, etc.)
  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
      <video controls style={{ width: '100%', display: 'block', maxHeight: 320 }} src={url}>
        <track kind="captions" />
      </video>
    </Box>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, items, updateQty, removeItem, openDrawer } = useCart();
  const [fruit, setFruit] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [snack, setSnack] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    api.get(`/fruits/${id}`)
      .then(res => {
        setFruit(res.data);
        // Fetch similar products from same category
        api.get('/fruits', { params: { category: res.data.category } })
          .then(r => setSimilar(r.data.filter(f => f.id !== res.data.id).slice(0, 6)))
          .catch(() => {});
      })
      .catch(() => navigate('/listings'));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!fruit) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const cartItem = items.find(i => i.id === fruit.id);
  const qtyInCart = cartItem?.qty || 0;

  const discountPct = fruit.mrp && fruit.mrp > fruit.price
    ? Math.round(((fruit.mrp - fruit.price) / fruit.mrp) * 100)
    : null;

  const handleAddToCart = () => {
    if (!user) return navigate('/login');
    addItem(fruit, 1);
    setSnack(t('product.added_to_cart', { qty: 1, unit: fruit.unit, name: fruit.name }));
    openDrawer();
  };

  const handleIncrement = () => updateQty(fruit.id, qtyInCart + 1);
  const handleDecrement = () => {
    if (qtyInCart === 1) removeItem(fruit.id);
    else updateQty(fruit.id, qtyInCart - 1);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 1.5, sm: 2 } }}>
      {/* Breadcrumb */}
      <Box display="flex" alignItems="center" gap={0.5} mb={2} flexWrap="wrap">
        <Typography
          variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
          onClick={() => navigate('/')}
        >
          Home
        </Typography>
        <NavigateNext sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography
          variant="body2" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
          onClick={() => navigate(`/listings?category=${fruit.category}`)}
        >
          {fruit.category}
        </Typography>
        <NavigateNext sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.primary" fontWeight="bold">{fruit.name}</Typography>
      </Box>

      <Paper elevation={2} sx={{ overflow: 'hidden', borderRadius: 2, mb: 3 }}>
        <Grid container>
          {/* Left: image */}
          <Grid item xs={12} sm={5}>
            <ImageCarousel images={fruit.images || []} category={fruit.category} height={{ xs: 220, sm: 320 }} />
          </Grid>

          {/* Right: details */}
          <Grid item xs={12} sm={7}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Chip label={fruit.category} size="small" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom>{fruit.name}</Typography>

              {/* Price */}
              <Box display="flex" alignItems="baseline" gap={1.5} mb={0.5} flexWrap="wrap">
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatINR(fruit.price)}
                </Typography>
                <Typography variant="body1" color="text.secondary">/{fruit.unit}</Typography>
                {fruit.mrp && fruit.mrp > fruit.price && (
                  <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    {formatINR(fruit.mrp)}
                  </Typography>
                )}
                {discountPct && (
                  <Chip label={`${discountPct}% OFF`} color="error" size="small" />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Farmer & location */}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Person fontSize="small" color="action" />
                <Typography
                  variant="body2" color="primary"
                  sx={{ cursor: 'pointer', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => navigate(`/farm/${fruit.farmerId}`)}
                >
                  {fruit.farmerName}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">{fruit.location}</Typography>
              </Box>

              {/* Stock */}
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="body2" color="text.secondary">{t('product.available')}:</Typography>
                <Chip
                  label={`${fruit.quantity} ${fruit.unit}`}
                  color={fruit.quantity < 20 ? 'warning' : 'success'}
                  size="small"
                />
              </Box>

              {/* Add to cart / qty stepper */}
              {user?.role !== 'farmer' && fruit.quantity > 0 && (
                qtyInCart > 0 ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      display="flex" alignItems="center"
                      sx={{ border: '2px solid', borderColor: 'primary.main', borderRadius: 2, overflow: 'hidden' }}
                    >
                      <IconButton onClick={handleDecrement} sx={{ borderRadius: 0, px: 1.5 }}>
                        <Remove />
                      </IconButton>
                      <Typography sx={{ px: 2, fontWeight: 'bold', fontSize: '1.1rem', minWidth: 36, textAlign: 'center' }}>
                        {qtyInCart}
                      </Typography>
                      <IconButton onClick={handleIncrement} sx={{ borderRadius: 0, px: 1.5 }}>
                        <Add />
                      </IconButton>
                    </Box>
                    <Button variant="contained" size="large" onClick={openDrawer} sx={{ flex: 1 }}>
                      View Cart · {formatINR(fruit.price * qtyInCart)}
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained" size="large" fullWidth
                    onClick={handleAddToCart}
                    sx={{ py: 1.5, fontSize: '1rem' }}
                  >
                    {t('product.add_to_cart', { amount: formatINR(fruit.price) })}
                  </Button>
                )
              )}

              {fruit.quantity === 0 && (
                <Chip label={t('product.out_of_stock')} color="error" />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Description */}
      {fruit.description && (
        <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Know Your Product</Typography>
          <Typography variant="body1" color="text.secondary" lineHeight={1.8} sx={{ whiteSpace: 'pre-line' }}>
            {fruit.description}
          </Typography>
        </Paper>
      )}

      {/* Videos */}
      {fruit.videos?.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>🎬 See It in Action</Typography>
          <Grid container spacing={2}>
            {fruit.videos.map((url, idx) => (
              <Grid item xs={12} sm={fruit.videos.length === 1 ? 12 : 6} key={idx}>
                <VideoPlayer url={url} title={`${fruit.name} — video ${idx + 1}`} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Similar Products */}
      {similar.length > 0 && (
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight="bold">Similar Products</Typography>
            <Button size="small" onClick={() => navigate(`/listings?category=${fruit.category}`)}>
              View All →
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, scrollbarWidth: 'thin' }}>
            {similar.map(f => (
              <Box key={f.id} sx={{ minWidth: { xs: 160, sm: 200 }, maxWidth: { xs: 160, sm: 200 }, flexShrink: 0 }}>
                <FruitCard fruit={f} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
        {t('product.back')}
      </Button>

      <Snackbar
        open={!!snack} autoHideDuration={2500} onClose={() => setSnack('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnack('')}>{snack}</Alert>
      </Snackbar>
    </Container>
  );
}
