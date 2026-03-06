import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Paper, Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { pushEvent } from '../utils/gtm';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      pushEvent('login', { method: 'email' });
      navigate(res.data.user.role === 'farmer' ? '/farmer' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          🌿 {t('login.welcome')}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          {t('login.subtitle')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label={t('login.email')} name="email" type="email"
            value={form.email} onChange={handleChange} required sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label={t('login.password')} name="password" type="password"
            value={form.password} onChange={handleChange} required sx={{ mb: 1 }}
          />
          <Box textAlign="right" sx={{ mb: 2 }}>
            <Link component="button" type="button" onClick={() => navigate('/forgot-password')} underline="hover" variant="body2">
              {t('auth.forgot_password')}
            </Link>
          </Box>
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? t('login.signing_in') : t('login.sign_in')}
          </Button>
        </Box>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            {t('login.no_account')}{' '}
            <Link component="button" onClick={() => navigate('/register')} underline="hover">
              {t('login.register_link')}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
