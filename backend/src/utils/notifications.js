const nodemailer = require('nodemailer');
const User = require('../models/User');
const NotificationTemplate = require('../models/NotificationTemplate');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST) {
    // Production: use configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    // Development: use Ethereal fake SMTP
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[Email] Ethereal test account: ${testAccount.user}`);
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  return transporter;
}

function renderTemplate(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{{${key}}}`));
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);
}

function formatItemsHtml(items) {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd">${i.fruitName}</td>
          <td style="text-align:right;padding:8px;border:1px solid #ddd">${i.quantity} ${i.unit}</td>
          <td style="text-align:right;padding:8px;border:1px solid #ddd">${formatINR(i.subtotal)}</td>
        </tr>`
    )
    .join('');
}

async function sendEmail(to, subject, html) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || 'FarmDirect <noreply@farmdirect.com>',
    to,
    subject,
    html,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Preview: ${previewUrl}`);
  }
  return info;
}

async function getOrCreateTemplate(farmerId) {
  let tpl = await NotificationTemplate.findById(farmerId);
  if (!tpl) {
    tpl = await NotificationTemplate.create({ _id: farmerId });
  }
  return tpl;
}

async function notifyOrderCreated(order) {
  // Group items by farmer
  const farmerMap = {};
  for (const item of order.items) {
    if (!farmerMap[item.farmerId]) farmerMap[item.farmerId] = { farmerName: item.farmerName, items: [] };
    farmerMap[item.farmerId].items.push(item);
  }

  // Look up customer email
  const customerUser = await User.findById(order.customerId).lean();
  const customerEmail = customerUser?.email;

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN');
  const shortOrderId = `#${order._id.slice(0, 8).toUpperCase()}`;

  for (const [farmerId, { farmerName, items: farmerItems }] of Object.entries(farmerMap)) {
    const tpl = await getOrCreateTemplate(farmerId);
    const farmerUser = await User.findById(farmerId).lean();
    const farmerEmail = farmerUser?.email;

    const baseVars = {
      orderId: shortOrderId,
      orderDate,
      customerName: order.customerName,
      farmerName,
      subtotal: formatINR(order.subtotal),
      transportCost: formatINR(order.transportCost),
      discount: formatINR(order.discountAmount),
      total: formatINR(order.total),
      items: formatItemsHtml(farmerItems),
    };

    // Email to customer (per-farmer portion)
    if (customerEmail) {
      const subject = renderTemplate(tpl.orderCreated.customerEmail.subject, baseVars);
      const html = renderTemplate(tpl.orderCreated.customerEmail.html, baseVars);
      await sendEmail(customerEmail, subject, html);
    }

    // Email to farmer
    if (farmerEmail) {
      const subject = renderTemplate(tpl.orderCreated.farmerEmail.subject, baseVars);
      const html = renderTemplate(tpl.orderCreated.farmerEmail.html, baseVars);
      await sendEmail(farmerEmail, subject, html);
    }
  }
}

async function notifyStatusChanged(order, farmerUser) {
  const tpl = await getOrCreateTemplate(farmerUser.id);
  const customerUser = await User.findById(order.customerId).lean();
  const customerEmail = customerUser?.email;
  if (!customerEmail) return;

  // Find this farmer's items in the order
  const farmerItems = order.items.filter((i) => i.farmerId === farmerUser.id);
  const farmerName = farmerItems.length > 0 ? farmerItems[0].farmerName : farmerUser.name;

  const vars = {
    orderId: `#${order._id.slice(0, 8).toUpperCase()}`,
    orderDate: new Date(order.createdAt).toLocaleString('en-IN'),
    customerName: order.customerName,
    farmerName,
    newStatus: order.status,
    subtotal: formatINR(order.subtotal),
    transportCost: formatINR(order.transportCost),
    discount: formatINR(order.discountAmount),
    total: formatINR(order.total),
    items: formatItemsHtml(farmerItems.length > 0 ? farmerItems : order.items),
  };

  const subject = renderTemplate(tpl.statusChanged.customerEmail.subject, vars);
  const html = renderTemplate(tpl.statusChanged.customerEmail.html, vars);
  await sendEmail(customerEmail, subject, html);
}

module.exports = { sendEmail, notifyOrderCreated, notifyStatusChanged };
