import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Button, Tabs, Tab, Grid, Card, CardContent,
  CardActions, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Snackbar, Alert,
  CircularProgress, Paper, Divider, Accordion, AccordionSummary, AccordionDetails, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Agriculture, AddPhotoAlternate, RemoveCircleOutline, ExpandMore, Email } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { getTemplates, updateTemplates, resetTemplates } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { FRUIT_CATEGORIES, UNITS, STATUS_COLORS, getCategoryEmoji, formatOrderId, formatINR } from '../utils/constants';

const PLACEHOLDER_GROUPS = {
  orderCreated: ['{{orderId}}', '{{orderDate}}', '{{customerName}}', '{{farmerName}}', '{{items}}', '{{subtotal}}', '{{transportCost}}', '{{discount}}', '{{total}}'],
  statusChanged: ['{{orderId}}', '{{orderDate}}', '{{customerName}}', '{{farmerName}}', '{{newStatus}}', '{{total}}'],
};

function TemplateEditor({ label, placeholders, subject, html, onSubjectChange, onHtmlChange, t }) {
  const copyPlaceholder = (p) => { navigator.clipboard.writeText(p).catch(() => {}); };
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{label}</Typography>
      <TextField fullWidth size="small" label={t('farmer.notif_subject')} value={subject}
        onChange={e => onSubjectChange(e.target.value)} sx={{ mb: 1 }} />
      <TextField fullWidth multiline rows={6} size="small" label={t('farmer.notif_body')} value={html}
        onChange={e => onHtmlChange(e.target.value)} sx={{ mb: 1 }}
        inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.78rem' } }} />
      <Typography variant="caption" color="text.secondary">{t('farmer.notif_placeholders')} — {t('farmer.notif_hint')}</Typography>
      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
        {placeholders.map(p => (
          <Tooltip key={p} title={t('farmer.notif_hint')}>
            <Chip label={p} size="small" onClick={() => copyPlaceholder(p)} sx={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }} />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}

function NotificationsTab({ setSnack }) {
  const { t } = useTranslation();
  const [tpl, setTpl] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await getTemplates();
      setTpl(res.data);
    } catch {
      setSnack({ open: true, msg: t('farmer.notif_save_error'), severity: 'error' });
    }
  }, [t, setSnack]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const setPath = (path, value) => {
    setTpl(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTemplates(tpl);
      setSnack({ open: true, msg: t('farmer.notif_saved'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: t('farmer.notif_save_error'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(t('farmer.notif_reset_confirm'))) return;
    try {
      const res = await resetTemplates();
      setTpl(res.data);
      setSnack({ open: true, msg: t('farmer.notif_saved'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: t('farmer.notif_save_error'), severity: 'error' });
    }
  };

  if (!tpl) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight="bold">{t('farmer.notif_order_created')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TemplateEditor
            label={t('farmer.notif_customer_email')} placeholders={PLACEHOLDER_GROUPS.orderCreated} t={t}
            subject={tpl.orderCreated.customerEmail.subject} html={tpl.orderCreated.customerEmail.html}
            onSubjectChange={v => setPath('orderCreated.customerEmail.subject', v)}
            onHtmlChange={v => setPath('orderCreated.customerEmail.html', v)}
          />
          <Divider sx={{ my: 2 }} />
          <TemplateEditor
            label={t('farmer.notif_farmer_email')} placeholders={PLACEHOLDER_GROUPS.orderCreated} t={t}
            subject={tpl.orderCreated.farmerEmail.subject} html={tpl.orderCreated.farmerEmail.html}
            onSubjectChange={v => setPath('orderCreated.farmerEmail.subject', v)}
            onHtmlChange={v => setPath('orderCreated.farmerEmail.html', v)}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight="bold">{t('farmer.notif_status_changed')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TemplateEditor
            label={t('farmer.notif_customer_email')} placeholders={PLACEHOLDER_GROUPS.statusChanged} t={t}
            subject={tpl.statusChanged.customerEmail.subject} html={tpl.statusChanged.customerEmail.html}
            onSubjectChange={v => setPath('statusChanged.customerEmail.subject', v)}
            onHtmlChange={v => setPath('statusChanged.customerEmail.html', v)}
          />
        </AccordionDetails>
      </Accordion>

      <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
        <Button variant="outlined" color="warning" onClick={handleReset}>{t('farmer.notif_reset')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? '...' : t('farmer.notif_save')}
        </Button>
      </Box>
    </Box>
  );
}

const EMPTY_FORM = { name: '', category: 'Apple', description: '', price: '', unit: 'kg', quantity: '', location: '', images: [], transportCostPerUnit: '' };

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deliveryDates, setDeliveryDates] = useState({}); // { [orderId]: 'YYYY-MM-DD' }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fruitsRes, ordersRes] = await Promise.all([
        api.get('/fruits', { params: { farmerId: user.id } }),
        api.get('/orders'),
      ]);
      setListings(fruitsRes.data);
      setOrders(ordersRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setDialogOpen(true); };
  const openEdit = (fruit) => {
    setForm({
      name: fruit.name, category: fruit.category, description: fruit.description,
      price: fruit.price, unit: fruit.unit, quantity: fruit.quantity, location: fruit.location,
      images: fruit.images || [],
      transportCostPerUnit: fruit.transportCostPerUnit !== undefined ? fruit.transportCostPerUnit : '',
    });
    setEditingId(fruit._id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/fruits/${editingId}`, form);
        setSnack({ open: true, msg: t('farmer.listing_updated'), severity: 'success' });
      } else {
        await api.post('/fruits', form);
        setSnack({ open: true, msg: t('farmer.listing_created'), severity: 'success' });
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || t('farmer.error_saving'), severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('farmer.delete_confirm'))) return;
    try {
      await api.delete(`/fruits/${id}`);
      setSnack({ open: true, msg: t('farmer.listing_deleted'), severity: 'success' });
      fetchData();
    } catch {
      setSnack({ open: true, msg: t('farmer.error_deleting'), severity: 'error' });
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const body = { status };
      if (deliveryDates[orderId]) body.estimatedDelivery = deliveryDates[orderId];
      await api.put(`/orders/${orderId}/status`, body);
      fetchData();
    } catch {}
  };

  const FARMER_STATUSES = ['confirmed', 'accepted', 'rejected', 'shipped', 'delivered'];

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Agriculture color="primary" />
        <Typography variant="h5" fontWeight="bold">{t('farmer.dashboard_title')}</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={t('farmer.tab_listings', { count: listings.length })} />
        <Tab label={t('farmer.tab_orders', { count: orders.length })} />
        <Tab icon={<Email fontSize="small" />} iconPosition="start" label={t('farmer.tab_notifications')} />
      </Tabs>

      {tab === 0 && (
        <>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={openAdd}>{t('farmer.add_listing')}</Button>
          </Box>

          {listings.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
              <Typography fontSize="3rem">🌱</Typography>
              <Typography variant="h6" gutterBottom>{t('farmer.no_listings')}</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>{t('farmer.no_listings_body')}</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openAdd}>{t('farmer.add_first')}</Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {listings.map(fruit => (
                <Grid item xs={12} sm={6} md={4} key={fruit.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6">
                          {getCategoryEmoji(fruit.category)} {fruit.name}
                        </Typography>
                        <Chip
                          label={fruit.quantity > 0 ? t('farmer.active') : t('farmer.out_of_stock')}
                          color={fruit.quantity > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h6" color="primary">{formatINR(fruit.price)}/{fruit.unit}</Typography>
                      <Typography variant="body2" color="text.secondary">{t('farmer.stock', { qty: fruit.quantity, unit: fruit.unit })}</Typography>
                      <Typography variant="body2" color="text.secondary">{fruit.location}</Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton color="primary" onClick={() => openEdit(fruit)} title="Edit"><Edit /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(fruit.id)} title="Delete"><Delete /></IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tab === 1 && (
        orders.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
            <Typography fontSize="3rem">📦</Typography>
            <Typography variant="h6">{t('farmer.no_orders')}</Typography>
            <Typography color="text.secondary">{t('farmer.no_orders_body')}</Typography>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {orders.map(order => (
              <Paper key={order._id} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {t('orders.order')} {formatOrderId(order._id)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.customerName} · {new Date(order.createdAt).toLocaleDateString()}
                    </Typography>
                    {order.estimatedDelivery && (
                      <Typography variant="caption" color="success.main">
                        📅 Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                    {/* Only show status dropdown for non-terminal statuses */}
                    {!['cancelled', 'delivered', 'rejected'].includes(order.status) && (
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select value={FARMER_STATUSES.includes(order.status) ? order.status : ''} onChange={e => handleStatusChange(order._id, e.target.value)}>
                          {FARMER_STATUSES.map(s => (
                            <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {/* Delivery date — shown when setting accepted/confirmed */}
                    {['payment_complete', 'pending', 'confirmed', 'accepted'].includes(order.status) && (
                      <TextField
                        type="date" size="small" label="Est. Delivery Date"
                        InputLabelProps={{ shrink: true }}
                        value={deliveryDates[order._id] || (order.estimatedDelivery ? order.estimatedDelivery.slice(0, 10) : '')}
                        onChange={e => setDeliveryDates(d => ({ ...d, [order._id]: e.target.value }))}
                        inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                        sx={{ width: 175 }}
                      />
                    )}
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                {order.items.filter(i => i.farmerId === user.id).map((item, idx) => (
                  <Box key={idx} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography variant="body2">
                      {getCategoryEmoji(item.category)} {item.fruitName} × {item.quantity} {item.unit}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">{formatINR(item.subtotal)}</Typography>
                  </Box>
                ))}
                <Divider sx={{ mt: 1 }} />
                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <Chip label={order.status.replace(/_/g, ' ').toUpperCase()} color={STATUS_COLORS[order.status]} size="small" />
                </Box>
              </Paper>
            ))}
          </Box>
        )
      )}

      {tab === 2 && <NotificationsTab setSnack={setSnack} />}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? t('farmer.dialog_edit') : t('farmer.dialog_add')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label={t('farmer.fruit_name')} value={form.name} required fullWidth onChange={e => setField('name', e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>{t('farmer.category')}</InputLabel>
              <Select value={form.category} label={t('farmer.category')} onChange={e => setField('category', e.target.value)}>
                {FRUIT_CATEGORIES.map(c => <MenuItem key={c} value={c}>{getCategoryEmoji(c)} {c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label={t('farmer.description')} value={form.description} multiline rows={3} fullWidth onChange={e => setField('description', e.target.value)} />
            <Box display="flex" gap={2}>
              <TextField
                label={t('farmer.price')} type="number" value={form.price} required
                onChange={e => setField('price', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }} sx={{ flex: 1 }}
              />
              <FormControl sx={{ width: 120 }}>
                <InputLabel>{t('farmer.unit')}</InputLabel>
                <Select value={form.unit} label={t('farmer.unit')} onChange={e => setField('unit', e.target.value)}>
                  {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField label={t('farmer.quantity')} type="number" value={form.quantity} required fullWidth onChange={e => setField('quantity', e.target.value)} inputProps={{ min: 0 }} />
            <TextField label={t('farmer.location')} value={form.location} fullWidth onChange={e => setField('location', e.target.value)} placeholder={t('farmer.location_placeholder')} />
            <TextField
              label={t('farmer.transport_cost')} type="number" value={form.transportCostPerUnit} fullWidth
              onChange={e => setField('transportCostPerUnit', e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              helperText={t('farmer.transport_hint')}
            />
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight="bold">{t('farmer.images_label', { count: form.images.length })}</Typography>
                {form.images.length < 5 && (
                  <Button size="small" startIcon={<AddPhotoAlternate />} onClick={() => setField('images', [...form.images, ''])}>
                    {t('farmer.add_image')}
                  </Button>
                )}
              </Box>
              {form.images.length === 0 && (
                <Typography variant="caption" color="text.secondary">{t('farmer.no_images')}</Typography>
              )}
              {form.images.map((url, idx) => (
                <Box key={idx} display="flex" gap={1} alignItems="center" mb={1}>
                  <TextField
                    fullWidth size="small"
                    label={t('farmer.image_url', { num: idx + 1 })}
                    value={url}
                    placeholder="https://example.com/image.jpg"
                    onChange={e => {
                      const updated = [...form.images];
                      updated[idx] = e.target.value;
                      setField('images', updated);
                    }}
                  />
                  <IconButton size="small" color="error" onClick={() => setField('images', form.images.filter((_, i) => i !== idx))}>
                    <RemoveCircleOutline fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('farmer.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingId ? t('farmer.update_listing') : t('farmer.create_listing')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
