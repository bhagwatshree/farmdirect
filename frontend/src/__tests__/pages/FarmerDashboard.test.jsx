import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../testUtils';
import FarmerDashboard from '../../pages/FarmerDashboard';
import api from '../../api/axios';

jest.mock('../../api/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockFarmer = {
  id: 'farmer-1',
  name: 'Test Farmer',
  email: 'farmer@test.com',
  role: 'farmer',
};

const mockFruit = {
  id: 'fruit-1',
  name: 'Organic Apple',
  category: 'Apple',
  price: 2.5,
  unit: 'kg',
  quantity: 100,
  location: 'California',
  farmerId: 'farmer-1',
  images: [],
  description: 'Fresh apples',
};

const mockOrder = {
  id: 'order-abc123',
  customerName: 'John Doe',
  status: 'pending',
  createdAt: new Date().toISOString(),
  items: [
    {
      farmerId: 'farmer-1',
      category: 'Apple',
      fruitName: 'Organic Apple',
      quantity: 2,
      unit: 'kg',
      subtotal: 5.0,
    },
  ],
};

// Default mock: no listings, no orders
function setupEmptyMock() {
  api.get.mockImplementation((url) => {
    if (url === '/fruits') return Promise.resolve({ data: [] });
    if (url === '/orders') return Promise.resolve({ data: [] });
    return Promise.resolve({ data: [] });
  });
}

// Mock with one listing
function setupFruitMock() {
  api.get.mockImplementation((url) => {
    if (url === '/fruits') return Promise.resolve({ data: [mockFruit] });
    if (url === '/orders') return Promise.resolve({ data: [] });
    return Promise.resolve({ data: [] });
  });
}

// Mock with one order
function setupOrderMock() {
  api.get.mockImplementation((url) => {
    if (url === '/fruits') return Promise.resolve({ data: [] });
    if (url === '/orders') return Promise.resolve({ data: [mockOrder] });
    return Promise.resolve({ data: [] });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  setupEmptyMock();
});

// ── Loading state ────────────────────────────────────────────────────────────
describe('FarmerDashboard — loading', () => {
  it('shows a loading spinner before data arrives', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

// ── Empty state ──────────────────────────────────────────────────────────────
describe('FarmerDashboard — empty state', () => {
  it('renders the dashboard heading', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText('My Farm Dashboard')).toBeInTheDocument()
    );
  });

  it('shows My Listings tab', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText(/My Listings/)).toBeInTheDocument()
    );
  });

  it('shows Orders tab', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText(/^Orders/)).toBeInTheDocument()
    );
  });

  it('shows "No listings yet" when no listings exist', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText('No listings yet')).toBeInTheDocument()
    );
  });

  it('shows Add Listing button', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Add/i }).length).toBeGreaterThan(0)
    );
  });
});

// ── With listings ────────────────────────────────────────────────────────────
describe('FarmerDashboard — with listings', () => {
  beforeEach(() => { setupFruitMock(); });

  it('renders the fruit name', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    // The card renders "🍎 Organic Apple", so we match with a regex
    await waitFor(() =>
      expect(screen.getByText(/Organic Apple/)).toBeInTheDocument()
    );
  });

  it('shows Active chip for in-stock listing', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText('Active')).toBeInTheDocument()
    );
  });

  it('shows price and unit', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText(/\$2\.5\/kg/)).toBeInTheDocument()
    );
  });

  it('shows Out of Stock chip for zero-quantity listing', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/fruits') return Promise.resolve({ data: [{ ...mockFruit, quantity: 0 }] });
      if (url === '/orders') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() =>
      expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    );
  });
});

// ── Add Listing dialog ───────────────────────────────────────────────────────
describe('FarmerDashboard — Add Listing dialog', () => {
  it('opens the Add Listing dialog when button is clicked', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText('No listings yet'));
    fireEvent.click(screen.getAllByRole('button', { name: /Add.*Listing/i })[0]);
    expect(screen.getByText('Add New Listing')).toBeInTheDocument();
  });

  it('can cancel the dialog', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText('No listings yet'));
    fireEvent.click(screen.getAllByRole('button', { name: /Add.*Listing/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    // MUI Dialog may use transitions; waitFor until the title disappears
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('calls api.post when creating a listing', async () => {
    api.post.mockResolvedValueOnce({ data: { id: 'new-fruit' } });
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText('No listings yet'));
    fireEvent.click(screen.getAllByRole('button', { name: /Add.*Listing/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Create Listing/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/fruits', expect.any(Object))
    );
  });
});

// ── Edit Listing ─────────────────────────────────────────────────────────────
describe('FarmerDashboard — Edit Listing', () => {
  beforeEach(() => { setupFruitMock(); });

  it('opens Edit Listing dialog with existing data', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/Organic Apple/));
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Edit Listing')).toBeInTheDocument();
  });

  it('calls api.put when updating a listing', async () => {
    api.put.mockResolvedValueOnce({ data: mockFruit });
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/Organic Apple/));
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByRole('button', { name: /Update Listing/i }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(`/fruits/${mockFruit.id}`, expect.any(Object))
    );
  });
});

// ── Delete Listing ───────────────────────────────────────────────────────────
describe('FarmerDashboard — Delete Listing', () => {
  beforeEach(() => {
    setupFruitMock();
    window.confirm = jest.fn(() => true);
  });

  it('calls api.delete when confirmed', async () => {
    api.delete.mockResolvedValueOnce({});
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/Organic Apple/));
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(`/fruits/${mockFruit.id}`)
    );
  });

  it('does NOT call api.delete when cancelled', async () => {
    window.confirm = jest.fn(() => false);
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/Organic Apple/));
    fireEvent.click(screen.getByTitle('Delete'));
    expect(api.delete).not.toHaveBeenCalled();
  });
});

// ── Transport cost field ─────────────────────────────────────────────────────
describe('FarmerDashboard — Transport Cost field', () => {
  it('shows transport cost field in Add Listing dialog', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText('No listings yet'));
    fireEvent.click(screen.getAllByRole('button', { name: /Add.*Listing/i })[0]);
    expect(screen.getByLabelText(/transport cost/i)).toBeInTheDocument();
  });

  it('shows transport cost field in Edit Listing dialog', async () => {
    setupFruitMock();
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/Organic Apple/));
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByLabelText(/transport cost/i)).toBeInTheDocument();
  });

  it('calls api.post with transportCostPerUnit when creating listing', async () => {
    api.post.mockResolvedValueOnce({ data: { id: 'new-fruit' } });
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText('No listings yet'));
    fireEvent.click(screen.getAllByRole('button', { name: /Add.*Listing/i })[0]);
    fireEvent.change(screen.getByLabelText(/transport cost/i), { target: { value: '1.50' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Listing/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/fruits', expect.objectContaining({
        transportCostPerUnit: '1.50',
      }))
    );
  });
});

// ── Orders tab ───────────────────────────────────────────────────────────────
describe('FarmerDashboard — Orders tab', () => {
  beforeEach(() => { setupOrderMock(); });

  it('shows "No orders yet" when orders tab is empty', async () => {
    setupEmptyMock();
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/^Orders/));
    fireEvent.click(screen.getByText(/Orders \(/));
    await waitFor(() =>
      expect(screen.getByText('No orders yet')).toBeInTheDocument()
    );
  });

  it('switches to the Orders tab and shows customer name', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/^Orders/));
    fireEvent.click(screen.getByText(/Orders \(/));
    await waitFor(() =>
      expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    );
  });

  it('shows the order items for the farmer', async () => {
    renderWithProviders(<FarmerDashboard />, { user: mockFarmer });
    await waitFor(() => screen.getByText(/^Orders/));
    fireEvent.click(screen.getByText(/Orders \(/));
    await waitFor(() =>
      expect(screen.getByText(/Organic Apple × 2 kg/)).toBeInTheDocument()
    );
  });
});
