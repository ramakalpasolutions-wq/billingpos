# Online Order Integration Guide

## How to Integrate with Swiggy, Zomato, and Other Platforms

### Webhook URL
Your webhook endpoint: `https://yourdomain.com/api/webhooks/online-orders`

### Required Data Format

```json
{
  "platform": "SWIGGY", // or "ZOMATO", "UBER_EATS"
  "platformOrderId": "SWIGGY-12345",
  "branchId": "your-branch-id-from-database",
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Main St, City",
  "platformApiKey": "your-secure-api-key",
  "items": [
    {
      "menuItemId": "menu-item-id-from-your-db",
      "quantity": 2,
      "size": "MEDIUM", // or null for regular items
      "price": 250.00
    }
  ]
}
