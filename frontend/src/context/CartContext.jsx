import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [voucher, setVoucher] = useState(null); // { code, type, value, discountAmount }

  const addItem = (fruit, qty) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === fruit.id);
      if (existing) {
        return prev.map(i => i.id === fruit.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...fruit, qty }];
    });
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const clearCart = () => {
    setItems([]);
    setVoucher(null);
  };

  const applyVoucher = (voucherData) => setVoucher(voucherData);
  const removeVoucher = () => setVoucher(null);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const transportTotal = items.reduce((sum, i) => sum + (i.transportCostPerUnit || 0) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const discountAmount = voucher ? voucher.discountAmount : 0;
  const discountedTotal = Math.max(0, total + transportTotal - discountAmount);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      total, transportTotal, count,
      voucher, applyVoucher, removeVoucher,
      discountAmount, discountedTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
