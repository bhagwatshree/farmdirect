const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
  { subject: { type: String, default: '' }, html: { type: String, default: '' } },
  { _id: false }
);

const DEFAULT_TEMPLATES = {
  orderCreated: {
    customerEmail: {
      subject: 'Your FarmDirect order {{orderId}} has been placed!',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#2e7d32">🌿 Order Confirmed!</h2>
  <p>Hi <strong>{{customerName}}</strong>,</p>
  <p>Your order from <strong>{{farmerName}}</strong> has been placed successfully.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <thead>
      <tr style="background:#f1f8e9">
        <th style="text-align:left;padding:8px;border:1px solid #ddd">Item</th>
        <th style="text-align:right;padding:8px;border:1px solid #ddd">Qty</th>
        <th style="text-align:right;padding:8px;border:1px solid #ddd">Amount</th>
      </tr>
    </thead>
    <tbody>{{items}}</tbody>
  </table>
  <p><strong>Subtotal:</strong> {{subtotal}}</p>
  <p><strong>Transport:</strong> {{transportCost}}</p>
  <p><strong>Discount:</strong> {{discount}}</p>
  <p style="font-size:1.1em"><strong>Total: {{total}}</strong></p>
  <p style="color:#666">Order ID: {{orderId}} &nbsp;|&nbsp; Date: {{orderDate}}</p>
  <hr/>
  <p style="color:#888;font-size:0.9em">Thank you for supporting local farmers! — FarmDirect</p>
</div>`,
    },
    farmerEmail: {
      subject: 'New order {{orderId}} received!',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#2e7d32">🛒 New Order Received!</h2>
  <p>Hi <strong>{{farmerName}}</strong>,</p>
  <p><strong>{{customerName}}</strong> has placed a new order.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <thead>
      <tr style="background:#f1f8e9">
        <th style="text-align:left;padding:8px;border:1px solid #ddd">Item</th>
        <th style="text-align:right;padding:8px;border:1px solid #ddd">Qty</th>
        <th style="text-align:right;padding:8px;border:1px solid #ddd">Amount</th>
      </tr>
    </thead>
    <tbody>{{items}}</tbody>
  </table>
  <p style="font-size:1.1em"><strong>Order Total: {{total}}</strong></p>
  <p style="color:#666">Order ID: {{orderId}} &nbsp;|&nbsp; Date: {{orderDate}}</p>
  <hr/>
  <p style="color:#888;font-size:0.9em">Log in to FarmDirect to manage this order.</p>
</div>`,
    },
  },
  statusChanged: {
    customerEmail: {
      subject: 'Order {{orderId}} updated — status: {{newStatus}}',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#2e7d32">📦 Order Status Update</h2>
  <p>Hi <strong>{{customerName}}</strong>,</p>
  <p>Your order <strong>{{orderId}}</strong> from <strong>{{farmerName}}</strong> has been updated.</p>
  <p style="font-size:1.2em">New status: <strong style="text-transform:capitalize">{{newStatus}}</strong></p>
  <p><strong>Order Total:</strong> {{total}}</p>
  <p style="color:#666">Date: {{orderDate}}</p>
  <hr/>
  <p style="color:#888;font-size:0.9em">Thank you for shopping with FarmDirect!</p>
</div>`,
    },
  },
};

const notificationTemplateSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // farmerId
    orderCreated: {
      customerEmail: {
        type: emailTemplateSchema,
        default: () => ({ ...DEFAULT_TEMPLATES.orderCreated.customerEmail }),
      },
      farmerEmail: {
        type: emailTemplateSchema,
        default: () => ({ ...DEFAULT_TEMPLATES.orderCreated.farmerEmail }),
      },
    },
    statusChanged: {
      customerEmail: {
        type: emailTemplateSchema,
        default: () => ({ ...DEFAULT_TEMPLATES.statusChanged.customerEmail }),
      },
    },
  },
  { _id: false }
);

notificationTemplateSchema.statics.DEFAULT_TEMPLATES = DEFAULT_TEMPLATES;

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
