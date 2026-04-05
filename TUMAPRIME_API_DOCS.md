# TumaPrime SMS API Documentation

## Overview
TumaPrime SMS API allows external companies to integrate SMS functionality into their systems. Send SMS messages, check delivery status, and manage credits programmatically.

## Base URL
```
https://your-backend-url.com/api/v1/
```

## Authentication
All API requests require authentication using API keys. Include your API key in the request header:

```
X-API-Key: your_api_key_here
```

Or use Bearer token:
```
Authorization: Bearer your_api_key_here
```

## API Endpoints

### 1. Send SMS
Send a single SMS message.

**Endpoint:** `POST /api/v1/sms/send`

**Request Body:**
```json
{
  "to": "+254712345678",
  "message": "Hello from TumaPrime!",
  "from": "TUMAPRIME",
  "webhook_url": "https://your-webhook-url.com/delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "message_id": "msg_1234567890",
    "status": "sent",
    "to": "+254712345678",
    "from": "TUMAPRIME",
    "credits_used": 1,
    "remaining_credits": 999
  }
}
```

### 2. Send Bulk SMS
Send SMS to multiple recipients.

**Endpoint:** `POST /api/v1/sms/bulk`

**Request Body:**
```json
{
  "to": ["+254712345678", "+254723456789"],
  "message": "Bulk message from TumaPrime!",
  "from": "TUMAPRIME",
  "webhook_url": "https://your-webhook-url.com/delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk SMS queued successfully",
  "data": {
    "campaign_id": "campaign_1234567890",
    "recipient_count": 2,
    "status": "queued",
    "credits_used": 2,
    "remaining_credits": 998
  }
}
```

### 3. Check Account Balance
Get your current credit balance.

**Endpoint:** `GET /api/v1/account/balance`

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": 1000,
    "sms_rate": 1,
    "currency": "KES"
  }
}
```

### 4. Get Message Status
Check the delivery status of a sent message.

**Endpoint:** `GET /api/v1/sms/{message_id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_1234567890",
    "status": "delivered",
    "phone": "+254712345678",
    "sent_at": "2024-01-01T10:00:00Z",
    "delivered_at": "2024-01-01T10:00:30Z",
    "cost": 1
  }
}
```

### 5. Health Check
Check API availability.

**Endpoint:** `GET /api/v1/health`

**Response:**
```json
{
  "success": true,
  "service": "TumaPrime SMS API",
  "version": "1.0.0",
  "status": "operational",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

## Error Responses
All errors follow this format:
```json
{
  "success": false,
  "error": "error_type",
  "message": "Human readable error message"
}
```

## Rate Limiting
- 100 SMS per hour per API key
- Exceeding limits returns HTTP 429 (Too Many Requests)

## Webhooks
Configure webhooks to receive delivery status updates:
```json
{
  "message_id": "msg_1234567890",
  "status": "delivered",
  "delivered_at": "2024-01-01T10:00:30Z"
}
```

## Getting API Keys
Contact TumaPrime support to get your API keys. Each key includes:
- API Key string
- Initial credit allocation
- Rate limits
- Webhook configuration

## Support
For API support, contact: support@tumaprime.com