/**
 * Push an event to the GTM data layer.
 * All GA4 e-commerce and custom events go through here.
 */
export function pushEvent(event, data = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}
