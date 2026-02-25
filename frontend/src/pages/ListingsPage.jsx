import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Box, TextField, Chip, Stack,
  InputAdornment, CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import FruitCard from '../components/FruitCard';
import { BROWSE_CATEGORIES } from '../utils/constants';

export default function ListingsPage() {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'All') params.category = category;
    api.get('/fruits', { params })
      .then(res => setFruits(res.data))
      .finally(() => setLoading(false));
  }, [search, category]);

  const setParam = (key, value) => {
    setSearchParams(prev => { prev.set(key, value); return prev; });
  };

  const allLabel = t('listings.all');

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>{t('listings.title')}</Typography>

      <TextField
        fullWidth
        placeholder={t('listings.search_placeholder')}
        value={search}
        onChange={e => setParam('search', e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        sx={{ mb: 2 }}
      />

      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mb: 3 }} flexWrap="nowrap">
        {BROWSE_CATEGORIES.map((cat) => {
          const label = cat === 'All' ? allLabel : cat;
          const isSelected = cat === 'All' ? category === 'All' : category === cat;
          return (
            <Chip
              key={cat}
              label={label}
              clickable
              color={isSelected ? 'primary' : 'default'}
              onClick={() => setParam('category', cat)}
              sx={{ flexShrink: 0 }}
            />
          );
        })}
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : fruits.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography fontSize="3rem">🔍</Typography>
          <Typography variant="h6" color="text.secondary">{t('listings.not_found')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('listings.try_different')}</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('listings.found', { count: fruits.length })}
          </Typography>
          <Grid container spacing={2}>
            {fruits.map(fruit => (
              <Grid item xs={12} sm={6} md={4} key={fruit.id}>
                <FruitCard fruit={fruit} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}
