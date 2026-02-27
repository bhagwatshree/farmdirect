import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Paper, Chip, CircularProgress,
  Button, Divider, Avatar,
} from '@mui/material';
import {
  Agriculture, LocationOn, CalendarMonth, Straighten, Verified,
  ArrowBack, EmojiNature,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FruitCard from '../components/FruitCard';
import { getCategoryEmoji } from '../utils/constants';

function StatBadge({ icon, label, value }) {
  if (!value) return null;
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1}>{label}</Typography>
        <Typography variant="body2" fontWeight="bold">{value}</Typography>
      </Box>
    </Box>
  );
}

export default function FarmerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/farmers/${id}`)
      .then(res => setData(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;
  if (!data) return null;

  const { farmer, listings } = data;
  const heroImage = farmer.farmImages?.[0];
  const displayName = farmer.farmName || farmer.name;
  const initial = displayName[0]?.toUpperCase();

  return (
    <Box>
      {/* Hero banner */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 200, sm: 300 },
          bgcolor: 'primary.main',
          overflow: 'hidden',
        }}
      >
        {heroImage ? (
          <img
            src={heroImage} alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
          />
        ) : (
          <Box
            sx={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1b5e20 0%, #4caf50 60%, #81c784 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <EmojiNature sx={{ fontSize: { xs: 80, sm: 120 }, color: 'rgba(255,255,255,0.25)' }} />
          </Box>
        )}
        {/* Gradient overlay */}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />

        {/* Back button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ position: 'absolute', top: 12, left: 12, color: 'white', bgcolor: 'rgba(0,0,0,0.3)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }, borderRadius: 2 }}
          size="small"
        >
          Back
        </Button>
      </Box>

      {/* Farmer avatar + name card */}
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'flex-end', gap: 2,
            mt: { xs: -4, sm: -5 }, mb: 3, flexWrap: 'wrap',
          }}
        >
          <Avatar
            sx={{
              width: { xs: 72, sm: 96 }, height: { xs: 72, sm: 96 },
              bgcolor: 'secondary.main', fontSize: { xs: '2rem', sm: '2.5rem' },
              border: '4px solid white', boxShadow: 3, flexShrink: 0,
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ pb: 0.5 }}>
            <Typography variant="h5" fontWeight="bold" color="white" sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)', mt: { xs: 1, sm: 0 } }}>
              {displayName}
            </Typography>
            {farmer.farmTagline && (
              <Typography variant="body2" color="rgba(255,255,255,0.9)" sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                {farmer.farmTagline}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Stats row */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box display="flex" gap={3} flexWrap="wrap">
            <StatBadge icon={<LocationOn fontSize="small" />} label="Location" value={farmer.location} />
            <StatBadge icon={<CalendarMonth fontSize="small" />} label="Farming Since" value={farmer.establishedYear ? `${farmer.establishedYear}` : null} />
            <StatBadge icon={<Straighten fontSize="small" />} label="Farm Size" value={farmer.farmSizeAcres ? `${farmer.farmSizeAcres} acres` : null} />
            <StatBadge icon={<Agriculture fontSize="small" />} label="Products" value={listings.length > 0 ? `${listings.length} listed` : null} />
          </Box>
        </Paper>

        {/* Farming practices */}
        {farmer.farmingPractices?.length > 0 && (
          <Box mb={3}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {farmer.farmingPractices.map(p => (
                <Chip key={p} label={`🌿 ${p}`} color="success" variant="filled" size="small" sx={{ fontWeight: 'bold' }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Certifications */}
        {farmer.certifications?.length > 0 && (
          <Box mb={3}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {farmer.certifications.map(c => (
                <Chip key={c} icon={<Verified fontSize="small" />} label={c} color="primary" variant="outlined" size="small" />
              ))}
            </Box>
          </Box>
        )}

        {/* Our Story */}
        {farmer.farmStory && (
          <Paper elevation={1} sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 3, borderRadius: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>📖 Our Story</Typography>
            <Typography variant="body1" color="text.secondary" lineHeight={1.9} sx={{ whiteSpace: 'pre-line' }}>
              {farmer.farmStory}
            </Typography>
          </Paper>
        )}

        {/* Farm photo gallery */}
        {farmer.farmImages?.length > 1 && (
          <Box mb={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>📸 From Our Farm</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
              {farmer.farmImages.slice(1).map((img, idx) => (
                <Box
                  key={idx}
                  sx={{
                    minWidth: { xs: 160, sm: 200 }, height: { xs: 110, sm: 140 },
                    borderRadius: 2, overflow: 'hidden', flexShrink: 0,
                  }}
                >
                  <img src={img} alt={`Farm ${idx + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Why trust this farmer */}
        <Paper
          elevation={0}
          sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}
        >
          <Typography variant="subtitle1" fontWeight="bold" color="success.dark" gutterBottom>
            🤝 Why buy from {farmer.farmName || farmer.name}?
          </Typography>
          <Grid container spacing={2} mt={0.5}>
            {[
              { emoji: '🌱', text: 'Directly from the farmer — no middlemen' },
              { emoji: '📦', text: 'Fresh, harvested closer to your delivery date' },
              { emoji: '💬', text: 'Know who grew your food and how' },
            ].map(item => (
              <Grid item xs={12} sm={4} key={item.text}>
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <Typography fontSize="1.3rem">{item.emoji}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Product listings */}
        {listings.length > 0 && (
          <Box mb={4}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🛒 Currently Available from {farmer.farmName || farmer.name}
            </Typography>
            <Grid container spacing={2}>
              {listings.map(fruit => (
                <Grid item xs={6} sm={4} md={3} key={fruit._id}>
                  <FruitCard fruit={{ ...fruit, id: fruit._id, farmerName: farmer.name }} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {listings.length === 0 && (
          <Box textAlign="center" py={4} mb={4}>
            <Typography fontSize="2.5rem">{getCategoryEmoji('Other')}</Typography>
            <Typography color="text.secondary" mt={1}>No products listed yet — check back soon!</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
