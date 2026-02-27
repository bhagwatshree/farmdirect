import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button, TextField, Grid,
  Paper, InputAdornment, Chip,
} from '@mui/material';
import {
  Search, LocalShipping, Schedule, Payments, AssignmentReturn, SupportAgent,
  Agriculture, Close,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import FruitCard from '../components/FruitCard';
import { FRUIT_CATEGORIES, getCategoryEmoji } from '../utils/constants';

const CATEGORIES = FRUIT_CATEGORIES.filter(c => c !== 'Other');

const TRUST_BADGES = [
  { icon: <LocalShipping />, title: 'Free Delivery', subtitle: 'On orders above ₹500' },
  { icon: <Schedule />, title: 'Fresh Daily', subtitle: 'Harvested same morning' },
  { icon: <Payments />, title: 'All Payments', subtitle: 'Cards, UPI, COD & more' },
  { icon: <AssignmentReturn />, title: 'Easy Returns', subtitle: 'Quality not met? We fix it' },
  { icon: <SupportAgent />, title: 'Support', subtitle: 'Mon–Sat, 9am–6pm' },
];

function ProductCarousel({ title, fruits }) {
  const navigate = useNavigate();
  if (!fruits.length) return null;
  return (
    <Box sx={{ mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="h5" fontWeight="bold">{title}</Typography>
        <Button size="small" onClick={() => navigate('/listings')} sx={{ textTransform: 'none' }}>
          View All →
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, scrollbarWidth: 'thin' }}>
        {fruits.map(fruit => (
          <Box key={fruit.id} sx={{ minWidth: { xs: 160, sm: 200 }, maxWidth: { xs: 160, sm: 200 }, flexShrink: 0 }}>
            <FruitCard fruit={fruit} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function HomePage() {
  const [fruits, setFruits] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const viewAll = searchParams.get('view') === 'all';
  const isFiltered = !!(categoryParam || searchParam || viewAll);

  // Initialise search box from URL param
  useEffect(() => {
    if (searchParam) setSearch(searchParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get('/fruits').then(res => setFruits(res.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearchParams({ search: search.trim() });
  };

  const clearFilter = () => {
    setSearch('');
    setSearchParams({});
  };

  // Filtered view (when category, search, or viewAll param present)
  const filteredFruits = isFiltered ? fruits.filter(f => {
    if (viewAll) return true;
    const matchCat = !categoryParam || f.category === categoryParam;
    const matchSearch = !searchParam || f.name.toLowerCase().includes(searchParam.toLowerCase());
    return matchCat && matchSearch;
  }) : [];

  // Full home view groupings
  const featuredFruits = fruits.slice(0, 8);
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const catFruits = fruits.filter(f => f.category === cat);
    if (catFruits.length >= 3) acc.push({ cat, fruits: catFruits });
    return acc;
  }, []).slice(0, 2); // show max 2 category carousels

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 4, md: 10 }, px: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
          {t('home.hero_title')}
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}>
          {t('home.hero_subtitle')}
        </Typography>
        <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 500, mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder={t('home.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <Button type="submit" variant="contained" color="secondary" sx={{ borderRadius: '0 6px 6px 0', mr: -1.75 }}>
                    {t('home.search_btn')}
                  </Button>
                </InputAdornment>
              ),
              sx: { bgcolor: 'white', borderRadius: 2, pr: 0 },
            }}
          />
        </Box>
      </Box>

      {/* Trust badges */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {TRUST_BADGES.map((badge, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  py: 2, px: 3, flexShrink: 0, flex: 1, minWidth: 160,
                  borderRight: i < TRUST_BADGES.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ color: 'primary.main', display: 'flex' }}>{badge.icon}</Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" lineHeight={1.2}>{badge.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{badge.subtitle}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>

        {isFiltered ? (
          /* ── Filtered / search results view ── */
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={3} flexWrap="wrap">
              <Typography variant="h5" fontWeight="bold">
                {viewAll ? `All Products (${fruits.length})` : categoryParam ? `${getCategoryEmoji(categoryParam)} ${categoryParam}` : `Results for "${searchParam}"`}
              </Typography>
              <Chip
                label="Clear filter"
                size="small"
                icon={<Close fontSize="small" />}
                onClick={clearFilter}
                variant="outlined"
              />
            </Box>
            {filteredFruits.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Typography fontSize="3rem">🔍</Typography>
                <Typography variant="h6" mt={1} gutterBottom>No products found</Typography>
                <Typography color="text.secondary" mb={3}>Try a different search or browse by category</Typography>
                <Button variant="contained" onClick={clearFilter}>Browse All</Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredFruits.map(fruit => (
                  <Grid item xs={6} sm={4} md={3} key={fruit._id || fruit.id}>
                    <FruitCard fruit={fruit} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        ) : (
          /* ── Full home page view ── */
          <>
            {/* Category grid */}
            <Typography variant="h5" fontWeight="bold" gutterBottom>{t('home.shop_by_category')}</Typography>
            <Grid container spacing={1.5} sx={{ mb: 4 }}>
              {CATEGORIES.map(cat => (
                <Grid item xs={4} sm={3} md={2} key={cat}>
                  <Paper
                    elevation={0}
                    onClick={() => setSearchParams({ category: cat })}
                    sx={{
                      p: 2, textAlign: 'center', cursor: 'pointer',
                      border: '1px solid', borderColor: 'divider',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50', transform: 'translateY(-2px)', boxShadow: 2 },
                    }}
                  >
                    <Typography fontSize="2rem" lineHeight={1} mb={0.5}>{getCategoryEmoji(cat)}</Typography>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block">{cat}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Featured products */}
            {featuredFruits.length > 0 && (
              <ProductCarousel title={t('home.fresh_listings')} fruits={featuredFruits} />
            )}

            {/* Per-category carousels */}
            {byCategory.map(({ cat, fruits: catFruits }) => (
              <ProductCarousel key={cat} title={`Fresh ${cat}`} fruits={catFruits} />
            ))}

            {fruits.length > 8 && (
              <Box textAlign="center" mb={5}>
                <Button variant="outlined" size="large" onClick={() => setSearchParams({ view: 'all' })}>
                  {t('home.view_all', { count: fruits.length })}
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Why shop from us */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
            Why Shop From FarmDirect?
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {[
              { emoji: '🌱', title: 'Naturally Grown', body: 'All produce is grown naturally by verified farmers across India.' },
              { emoji: '✅', title: 'Clean & Graded', body: 'Each product is hand-picked, cleaned, and graded by experts.' },
              { emoji: '🚜', title: 'Farmer Traced', body: 'Know exactly which farm your food comes from.' },
            ].map(item => (
              <Grid item xs={12} sm={4} key={item.title}>
                <Box textAlign="center" px={2}>
                  <Typography fontSize="2.5rem" mb={1}>{item.emoji}</Typography>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.body}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Farmer CTA */}
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}>
          <Agriculture sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>{t('home.farmer_title')}</Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            {t('home.farmer_body')}
          </Typography>
          <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/register')}>
            {t('home.farmer_btn')}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
