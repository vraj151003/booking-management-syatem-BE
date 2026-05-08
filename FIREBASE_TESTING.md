# Firebase Service Testing Guide

This guide provides curl commands to test your Firebase service without a frontend.

## Prerequisites

1. Make sure your NestJS application is running (usually on port 3000)
2. Have Firebase credentials configured in your environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## Base URL
```
http://localhost:3000/firebase
```

## Testing Endpoints

### 1. Check Firebase Configuration Status
```bash
curl -X GET http://localhost:3000/firebase/test/status
```

### 2. Register a Test Device Token
```bash
curl -X POST http://localhost:3000/firebase/test/register-token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "token": "test-fcm-token-abc123def456",
    "deviceType": "android"
  }'
```

### 3. Send Test Notification to Specific Tokens
```bash
curl -X POST http://localhost:3000/firebase/test/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": ["test-fcm-token-abc123def456"],
    "title": "Test Notification",
    "body": "This is a test notification from your Firebase service",
    "data": {
      "type": "test",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }'
```

### 4. Send Test Notification to User
```bash
curl -X POST http://localhost:3000/firebase/test/send-notification-to-user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "title": "Hello User!",
    "body": "This is a test notification sent to your user ID",
    "data": {
      "type": "user_test",
      "userId": "test-user-123"
    }
  }'
```

### 5. Send Test Booking Confirmation
```bash
curl -X POST http://localhost:3000/firebase/test/booking-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "bookingData": {
      "bookingId": "booking-123",
      "movieName": "Test Movie",
      "showDate": "2024-01-15",
      "showTime": "18:30",
      "screenName": "Screen 1",
      "seats": ["A1", "A2"],
      "totalAmount": 300
    }
  }'
```

### 6. Send Test Payment Notification
```bash
# Successful payment
curl -X POST http://localhost:3000/firebase/test/payment-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "paymentData": {
      "paymentId": "payment-123",
      "amount": 300,
      "status": "success",
      "movieName": "Test Movie",
      "bookingId": "booking-123"
    }
  }'

# Failed payment
curl -X POST http://localhost:3000/firebase/test/payment-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "paymentData": {
      "paymentId": "payment-456",
      "amount": 300,
      "status": "failed",
      "movieName": "Test Movie",
      "bookingId": "booking-456"
    }
  }'
```

## Testing with Real FCM Tokens

To test with real device tokens, you need to:

1. **Get a real FCM token from a mobile app** or use a testing tool
2. **Replace the test token** in the commands above with your real token

### Getting Real FCM Tokens

#### Option 1: Use Firebase Console
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Create a test notification in the console
3. Send it to get device tokens from real devices

#### Option 2: Use a Mobile App
Create a simple mobile app (React Native, Flutter, etc.) that:
- Registers with Firebase
- Gets the FCM token
- Displays the token for you to copy

#### Option 3: Use Online Tools
There are online FCM token generators for testing purposes.

## Common Issues & Solutions

### 1. "Firebase not initialized" Error
- Check your environment variables are set correctly
- Verify your Firebase service account credentials
- Run the status check endpoint first

### 2. "Invalid registration token" Error
- The FCM token is invalid or expired
- Get a fresh token from a real device
- Tokens expire after ~2 months

### 3. "Permission denied" Error
- Check your Firebase project settings
- Ensure Cloud Messaging API is enabled
- Verify your service account has proper permissions

### 4. "No active device tokens found" Warning
- Register a device token first using the register-token endpoint
- Check the token is marked as `isActive: true`

## Testing Workflow

1. **Check Configuration**: Run the status endpoint
2. **Register Token**: Register a test or real FCM token
3. **Send Basic Notification**: Test with the send-notification endpoint
4. **Test Business Logic**: Try booking confirmation and payment notifications
5. **Verify Delivery**: Check your mobile device for notifications

## Monitoring Logs

Check your NestJS application logs for:
- Firebase initialization status
- Notification sending results
- Error messages and stack traces

## Production Considerations

- Remove test endpoints before deploying to production
- Use proper authentication for real endpoints
- Implement rate limiting for notification sending
- Monitor Firebase quota usage
- Handle token invalidation gracefully
