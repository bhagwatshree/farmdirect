import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Paper,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Link,
  Checkbox, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { pushEvent } from '../utils/gtm';

const EMPTY_ADDRESS = { street: '', city: '', state: '', postalCode: '', country: '' };

function AddressFields({ prefix, values, onChange }) {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <TextField
        fullWidth size="small" label="Street Address" name={`${prefix}.street`}
        value={values.street} onChange={onChange}
      />
      <Box display="flex" gap={1}>
        <TextField
          size="small" label="City" name={`${prefix}.city`}
          value={values.city} onChange={onChange} sx={{ flex: 1 }}
        />
        <TextField
          size="small" label="State / Province" name={`${prefix}.state`}
          value={values.state} onChange={onChange} sx={{ flex: 1 }}
        />
      </Box>
      <Box display="flex" gap={1}>
        <TextField
          size="small" label="Postal Code" name={`${prefix}.postalCode`}
          value={values.postalCode} onChange={onChange} sx={{ flex: 1 }}
        />
        <TextField
          size="small" label="Country" name={`${prefix}.country`}
          value={values.country} onChange={onChange} sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'customer', location: '', phone: '',
  });
  const [billingAddress, setBillingAddress] = useState({ ...EMPTY_ADDRESS });
  const [deliveryAddress, setDeliveryAddress] = useState({ ...EMPTY_ADDRESS });
  const [sameAsBlling, setSameAsBilling] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddressChange = (setter) => (e) => {
    const field = e.target.name.split('.')[1];
    setter(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.role === 'customer') {
        payload.billingAddress = billingAddress;
        payload.deliveryAddress = sameAsBlling ? billingAddress : deliveryAddress;
      }
      const res = await api.post('/auth/register', payload);
      login(res.data.user, res.data.token);
      pushEvent('sign_up', { method: 'email' });
      navigate(form.role === 'farmer' ? '/farmer' : '/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
          🌿 Join FarmDirect
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2, width: '100%' }}>
            <FormLabel>I am a</FormLabel>
            <RadioGroup row name="role" value={form.role} onChange={handleChange}>
              <FormControlLabel value="customer" control={<Radio />} label="Customer" />
              <FormControlLabel value="farmer" control={<Radio />} label="Farmer" />
            </RadioGroup>
          </FormControl>

          <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" name="password" type="password" value={form.password} onChange={handleChange} required sx={{ mb: 2 }} />
          <TextField
            fullWidth label="Location" name="location" value={form.location}
            onChange={handleChange} placeholder="City, Country" sx={{ mb: 2 }}
          />
          {form.role === 'farmer' && (
            <TextField fullWidth label="Phone" name="phone" value={form.phone} onChange={handleChange} sx={{ mb: 2 }} />
          )}

          {form.role === 'customer' && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Billing Address
              </Typography>
              <AddressFields
                prefix="billing"
                values={billingAddress}
                onChange={handleAddressChange(setBillingAddress)}
              />

              <FormControlLabel
                sx={{ mt: 2 }}
                control={
                  <Checkbox
                    checked={sameAsBlling}
                    onChange={e => setSameAsBilling(e.target.checked)}
                    name="sameAsBlling"
                  />
                }
                label="Delivery address same as billing"
              />

              {!sameAsBlling && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
                    Delivery Address
                  </Typography>
                  <AddressFields
                    prefix="delivery"
                    values={deliveryAddress}
                    onChange={handleAddressChange(setDeliveryAddress)}
                  />
                </>
              )}
            </>
          )}

          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 3 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </Box>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link component="button" onClick={() => navigate('/login')} underline="hover">
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
