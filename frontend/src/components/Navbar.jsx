import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Box, Button,
  Drawer, List, ListItemText, ListItemButton, Avatar, Divider,
  useMediaQuery, useTheme, Select, MenuItem, FormControl,
} from '@mui/material';
import { Menu as MenuIcon, ShoppingCart, Logout, Agriculture, Store, Receipt } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();

  const close = () => setDrawerOpen(false);
  const handleLogout = () => { logout(); navigate('/'); close(); };
  const go = (path) => { navigate(path); close(); };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const navItems = [
    { label: t('nav.browse'), path: '/listings', icon: <Store fontSize="small" /> },
    ...(user?.role === 'farmer' ? [{ label: t('nav.my_farm'), path: '/farmer', icon: <Agriculture fontSize="small" /> }] : []),
    ...(user ? [{ label: t('nav.orders'), path: '/orders', icon: <Receipt fontSize="small" /> }] : []),
  ];

  const langSelect = (
    <FormControl size="small" variant="standard" sx={{ minWidth: 90 }}>
      <Select
        value={i18n.language || 'en'}
        onChange={handleLanguageChange}
        disableUnderline
        sx={{
          color: 'white',
          fontSize: '0.8rem',
          '& .MuiSvgIcon-root': { color: 'white' },
          '& .MuiSelect-select': { py: 0.5, px: 1 },
        }}
      >
        {LANGUAGES.map(l => (
          <MenuItem key={l.code} value={l.code} sx={{ fontSize: '0.85rem' }}>{l.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6" fontWeight="bold" sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            🌿 FarmDirect
          </Typography>

          {!isMobile && navItems.map(item => (
            <Button
              key={item.path} color="inherit"
              onClick={() => navigate(item.path)}
              sx={{ fontWeight: location.pathname === item.path ? 'bold' : 'normal', mx: 0.5 }}
            >
              {item.label}
            </Button>
          ))}

          {user?.role !== 'farmer' && (
            <IconButton color="inherit" onClick={() => navigate('/cart')} sx={{ ml: 1 }}>
              <Badge badgeContent={count} color="secondary">
                <ShoppingCart />
              </Badge>
            </IconButton>
          )}

          {!isMobile && !user && (
            <>
              <Button color="inherit" onClick={() => navigate('/login')} sx={{ ml: 1 }}>{t('nav.login')}</Button>
              <Button
                color="inherit" variant="outlined"
                sx={{ ml: 1, borderColor: 'rgba(255,255,255,0.6)' }}
                onClick={() => navigate('/register')}
              >
                {t('nav.register')}
              </Button>
            </>
          )}

          {!isMobile && user && (
            <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }} title={t('nav.logout') + ' ' + user.name}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                {user.name[0].toUpperCase()}
              </Avatar>
            </IconButton>
          )}

          <Box sx={{ ml: 1 }}>{langSelect}</Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={close}>
        <Box sx={{ width: 260 }} role="presentation">
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" fontWeight="bold">🌿 FarmDirect</Typography>
            {user && (
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {user.name} · {user.role}
              </Typography>
            )}
          </Box>

          <List>
            <ListItemButton onClick={() => go('/')}>
              <ListItemText primary={t('nav.home')} />
            </ListItemButton>
            {navItems.map(item => (
              <ListItemButton
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => go(item.path)}
              >
                <Box mr={1.5}>{item.icon}</Box>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {user?.role !== 'farmer' && (
              <ListItemButton onClick={() => go('/cart')}>
                <Box mr={1.5}>
                  <Badge badgeContent={count} color="secondary"><ShoppingCart fontSize="small" /></Badge>
                </Box>
                <ListItemText primary={t('nav.cart')} />
              </ListItemButton>
            )}
          </List>

          <Divider />

          <List>
            {user ? (
              <ListItemButton onClick={handleLogout}>
                <Box mr={1.5}><Logout fontSize="small" /></Box>
                <ListItemText primary={t('nav.logout')} />
              </ListItemButton>
            ) : (
              <>
                <ListItemButton onClick={() => go('/login')}>
                  <ListItemText primary={t('nav.login')} />
                </ListItemButton>
                <ListItemButton onClick={() => go('/register')}>
                  <ListItemText primary={t('nav.register')} />
                </ListItemButton>
              </>
            )}
          </List>

          <Divider />

          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">{t('common.language')}</Typography>
            <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
              <Select value={i18n.language || 'en'} onChange={handleLanguageChange}>
                {LANGUAGES.map(l => (
                  <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
