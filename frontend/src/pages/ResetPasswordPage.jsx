import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Paper,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.passwords_no_match'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.invalid_token'));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Alert severity="error">{t('auth.invalid_token')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          🔒 {t('auth.reset_title')}
        </Typography>

        {success ? (
          <Alert severity="success">{t('auth.reset_success')}</Alert>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('auth.new_password')}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('auth.confirm_password')}
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                sx={{ mb: 3 }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? t('auth.resetting') : t('auth.reset_password_btn')}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}
