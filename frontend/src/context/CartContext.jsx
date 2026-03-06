import React, { createContext, useState, useContext } from 'react';
import { getCartWeightKg, getShippingFee, MAX_ORDER_KG } from '../utils/constants';
import { pushEvent } from '../utils/gtm';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [voucher, setVoucher] = useState(null); // { code, type, value, discountAmount }
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addItem = (fruit, qty) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === fruit.id);
      const updated = existing
        ? prev.map(i => i.id === fruit.id ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { ...fruit, qty }];
      // Enforce max 100 kg
      if (getCartWeightKg(updated) > MAX_ORDER_KG) return prev;
      pushEvent('add_to_cart', {
        ecommerce: {
          items: [{ item_id: fruit.id, item_name: fruit.name, item_category: fruit.category, price: fruit.price, quantity: qty }],
        },
      });
      return updated;
    });
  };

  const removeItem = (id) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        pushEvent('remove_from_cart', {
          ecommerce: {
            items: [{ item_id: item.id, item_name: item.name, item_category: item.category, price: item.price, quantity: item.qty }],
          },
        });
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty } : i);
      // Enforce max 100 kg
      if (getCartWeightKg(updated) > MAX_ORDER_KG) return prev;
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setVoucher(null);
  };

  const applyVoucher = (voucherData) => setVoucher(voucherData);
  const removeVoucher = () => setVoucher(null);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const totalWeightKg = getCartWeightKg(items);
  const shippingFee = items.length > 0 ? getShippingFee(totalWeightKg) : 0;
  // Keep transportTotal for per-item farmer costs (backwards compat)
  const transportTotal = items.reduce((sum, i) => sum + (i.transportCostPerUnit || 0) * i.qty, 0);
  const discountAmount = voucher ? voucher.discountAmount : 0;
  const discountedTotal = Math.max(0, total + shippingFee + transportTotal - discountAmount);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      total, transportTotal, count,
      totalWeightKg, shippingFee,
      voucher, applyVoucher, removeVoucher,
      discountAmount, discountedTotal,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
