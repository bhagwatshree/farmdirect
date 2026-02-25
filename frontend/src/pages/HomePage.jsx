import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button, TextField, Grid, Chip, Stack,
  Paper, InputAdornment,
} from '@mui/material';
import { Search, Agriculture } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import FruitCard from '../components/FruitCard';
import { FRUIT_CATEGORIES } from '../utils/constants';

const CATEGORIES = FRUIT_CATEGORIES.filter(c => c !== 'Other');

export default function HomePage() {
  const [fruits, setFruits] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/fruits').then(res => setFruits(res.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/listings?search=${encodeURIComponent(search)}`);
  };

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 6, md: 10 }, px: 2, textAlign: 'center' }}>
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Categories */}
        <Typography variant="h5" fontWeight="bold" gutterBottom>{t('home.shop_by_category')}</Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mb: 4 }} flexWrap="nowrap">
          {CATEGORIES.map(cat => (
            <Chip
              key={cat}
              label={cat}
              clickable
              onClick={() => navigate(`/listings?category=${cat}`)}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Stack>

        {/* Featured Listings */}
        <Typography variant="h5" fontWeight="bold" gutterBottom>{t('home.fresh_listings')}</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {fruits.slice(0, 6).map(fruit => (
            <Grid item xs={12} sm={6} md={4} key={fruit.id}>
              <FruitCard fruit={fruit} />
            </Grid>
          ))}
        </Grid>

        {fruits.length > 6 && (
          <Box textAlign="center" mb={4}>
            <Button variant="outlined" size="large" onClick={() => navigate('/listings')}>
              {t('home.view_all', { count: fruits.length })}
            </Button>
          </Box>
        )}

        {/* Farmer CTA */}
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}>
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
