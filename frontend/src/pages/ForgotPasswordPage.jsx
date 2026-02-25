import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Paper, Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          🔑 {t('auth.forgot_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          {t('auth.forgot_subtitle')}
        </Typography>

        {sent ? (
          <Alert severity="success" sx={{ mb: 2 }}>{t('auth.reset_sent')}</Alert>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('login.email')}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? t('auth.sending') : t('auth.send_reset_link')}
              </Button>
            </Box>
          </>
        )}

        <Box textAlign="center" mt={2}>
          <Link component="button" onClick={() => navigate('/login')} underline="hover" variant="body2">
            ← {t('login.sign_in')}
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}
