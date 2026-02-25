import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from '../../context/CartContext';

const apple = { id: 'a1', name: 'Apple', category: 'Apple', price: 2.5, unit: 'kg' };
const mango = { id: 'm1', name: 'Mango', category: 'Mango', price: 5.0, unit: 'kg' };

function TestCart() {
  const { items, addItem, removeItem, updateQty, clearCart, total, count } = useCart();
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="total">{total}</span>
      <span data-testid="items">{items.map(i => `${i.id}:${i.qty}`).join(',')}</span>
      <button onClick={() => addItem(apple, 2)}>add-apple-2</button>
      <button onClick={() => addItem(apple, 1)}>add-apple-1</button>
      <button onClick={() => addItem(mango, 3)}>add-mango-3</button>
      <button onClick={() => removeItem('a1')}>remove-apple</button>
      <button onClick={() => updateQty('a1', 5)}>qty-apple-5</button>
      <button onClick={() => updateQty('a1', 0)}>qty-apple-0</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

describe('CartContext', () => {
  it('starts with an empty cart (count=0, total=0)', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
    expect(screen.getByTestId('items').textContent).toBe('');
  });

  it('addItem inserts a new item with the given qty', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    act(() => screen.getByText('add-apple-2').click());
    expect(screen.getByTestId('items').textContent).toBe('a1:2');
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('total').textContent).toBe('5'); // 2 * 2.5
  });

  it('addItem increments qty when item already exists', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    act(() => screen.getByText('add-apple-2').click());
    act(() => screen.getByText('add-apple-1').click());
    expect(screen.getByTestId('items').textContent).toBe('a1:3');
  });

  it('removeItem removes the item from the cart', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    act(() => screen.getByText('add-apple-2').click());
    act(() => screen.getByText('remove-apple').click());
    expect(screen.getByTestId('items').textContent).toBe('');
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('updateQty updates the item quantity', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    act(() => screen.getByText('add-apple-2').click());
    act(() => screen.getByText('qty-apple-5').click());
    expect(screen.getByTestId('items').textContent).toBe('a1:5');
  });

  it('updateQty with qty <= 0 removes the item', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    act(() => screen.getByText('add-apple-2').click());
    act(() => screen.getByText('qty-apple-0').click());
    expect(screen.getByTestId('items').textContent).toBe('');
  });

  it('clearCart empties all items', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    act(() => screen.getByText('add-apple-2').click());
    act(() => screen.getByText('add-mango-3').click());
    act(() => screen.getByText('clear').click());
    expect(screen.getByTestId('items').textContent).toBe('');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });

  it('calculates total and count correctly across multiple items', () => {
    render(<CartProvider><TestCart /></CartProvider>);
    act(() => screen.getByText('add-apple-2').click()); // 2 * 2.5 = 5
    act(() => screen.getByText('add-mango-3').click()); // 3 * 5.0 = 15
    expect(screen.getByTestId('total').textContent).toBe('20');
    expect(screen.getByTestId('count').textContent).toBe('5');
  });
});
