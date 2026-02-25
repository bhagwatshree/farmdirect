import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, Fab, CircularProgress,
  Avatar, Chip,
} from '@mui/material';
import { Chat, Close, Send, SmartToy, Person, VerifiedUser, LockOpen } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // OTP / identity verification state
  const [authState, setAuthState] = useState('idle'); // 'idle' | 'awaiting_email' | 'awaiting_otp' | 'verified'
  const [authEmail, setAuthEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sessionToken, setSessionToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const messagesEndRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (open && !initialized) {
      setMessages([{ role: 'assistant', content: t('chat.welcome') }]);
      setInitialized(true);
    }
  }, [open, initialized, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, authState]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/chat', { message: text, history, sessionToken });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (res.data.requiresAuth && authState === 'idle') {
        setAuthState('awaiting_email');
        setAuthError('');
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('chat.error') }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendOtp = async () => {
    if (!authEmail.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      await api.post('/chat/send-otp', { email: authEmail });
      setAuthState('awaiting_otp');
    } catch (err) {
      setAuthError(err.response?.data?.message || t('chat.otp_send_error'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.post('/chat/verify-otp', { email: authEmail, otp: otpInput });
      setSessionToken(res.data.sessionToken);
      setAuthState('verified');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t('chat.verified_msg') },
      ]);
    } catch (err) {
      setAuthError(err.response?.data?.message || t('chat.otp_error'));
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            width: 340,
            height: 480,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1300,
          }}
        >
          {/* Header */}
          <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy fontSize="small" />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
              {t('chat.title')}
            </Typography>
            {authState === 'verified' && (
              <Chip
                icon={<VerifiedUser sx={{ fontSize: 12, color: 'white !important' }} />}
                label={t('chat.verified')}
                size="small"
                sx={{ bgcolor: 'success.main', color: 'white', height: 22, fontSize: 10 }}
              />
            )}
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 0.75,
                  alignItems: 'flex-end',
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', mb: 0.25 }}>
                    <SmartToy sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
                <Box
                  sx={{
                    maxWidth: '78%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    px: 1.5,
                    py: 1,
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </Box>
                {msg.role === 'user' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', mb: 0.25 }}>
                    <Person sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
              </Box>
            ))}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light' }}>
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
                <Box sx={{ bgcolor: 'grey.100', px: 1.5, py: 1, borderRadius: '12px 12px 12px 2px' }}>
                  <CircularProgress size={16} />
                </Box>
              </Box>
            )}

            {/* Email input form */}
            {authState === 'awaiting_email' && (
              <Box sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'primary.light', borderRadius: 2, p: 1.5, mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <LockOpen fontSize="small" color="primary" />
                  <Typography fontSize={12} fontWeight={600} color="primary.main">
                    {t('chat.verify_identity')}
                  </Typography>
                </Box>
                <Typography fontSize={11} color="text.secondary" sx={{ mb: 1 }}>
                  {t('chat.otp_email_prompt')}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  placeholder={t('chat.email_placeholder')}
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  disabled={authLoading}
                  error={!!authError}
                  helperText={authError}
                  sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: 13 } }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box
                    component="button"
                    onClick={handleSendOtp}
                    disabled={authLoading || !authEmail.trim()}
                    sx={{
                      flex: 1, py: 0.75, bgcolor: 'primary.main', color: 'white',
                      border: 'none', borderRadius: 1, cursor: 'pointer', fontSize: 12,
                      '&:disabled': { opacity: 0.6, cursor: 'default' },
                    }}
                  >
                    {authLoading ? t('chat.sending_otp') : t('chat.send_otp')}
                  </Box>
                  <Box
                    component="button"
                    onClick={() => { setAuthState('idle'); setAuthError(''); }}
                    sx={{ px: 1.5, py: 0.75, bgcolor: 'grey.200', border: 'none', borderRadius: 1, cursor: 'pointer', fontSize: 12 }}
                  >
                    ✕
                  </Box>
                </Box>
              </Box>
            )}

            {/* OTP verification form */}
            {authState === 'awaiting_otp' && (
              <Box sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'primary.light', borderRadius: 2, p: 1.5, mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <LockOpen fontSize="small" color="primary" />
                  <Typography fontSize={12} fontWeight={600} color="primary.main">
                    {t('chat.enter_code')}
                  </Typography>
                </Box>
                <Typography fontSize={11} color="text.secondary" sx={{ mb: 1 }}>
                  {t('chat.otp_sent_to')} <strong>{authEmail}</strong>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="123456"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  disabled={authLoading}
                  error={!!authError}
                  helperText={authError}
                  inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                  sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: 18, letterSpacing: 6, textAlign: 'center' } }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box
                    component="button"
                    onClick={handleVerifyOtp}
                    disabled={authLoading || otpInput.length !== 6}
                    sx={{
                      flex: 1, py: 0.75, bgcolor: 'success.main', color: 'white',
                      border: 'none', borderRadius: 1, cursor: 'pointer', fontSize: 12,
                      '&:disabled': { opacity: 0.6, cursor: 'default' },
                    }}
                  >
                    {authLoading ? t('chat.verifying') : t('chat.verify_btn')}
                  </Box>
                  <Box
                    component="button"
                    onClick={() => { setAuthState('awaiting_email'); setOtpInput(''); setAuthError(''); }}
                    sx={{ px: 1.5, py: 0.75, bgcolor: 'grey.200', border: 'none', borderRadius: 1, cursor: 'pointer', fontSize: 12 }}
                  >
                    ←
                  </Box>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 0.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('chat.placeholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              multiline
              maxRows={3}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{ alignSelf: 'flex-end' }}
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        onClick={() => setOpen(o => !o)}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
      >
        {open ? <Close /> : <Chat />}
      </Fab>
    </>
  );
}
