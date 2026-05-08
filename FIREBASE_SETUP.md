# Firebase Push Notification Setup Guide

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Cloud Messaging API:
   - Go to Project Settings → Cloud Messaging
   - Enable Cloud Messaging API

## 2. Get Firebase Configuration

### For Web:
1. In Firebase Console, go to Project Settings → General
2. Add Web App to your project
3. Copy the Firebase config object

### For Server:
1. Go to Project Settings → Service Accounts
2. Generate a new private key
3. Download the JSON file

## 3. Environment Variables

Add these to your `.env` file:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Important**: The private key should include the `\n` characters for line breaks.

## Quick Setup Steps (Server-Side Only)

### Step 1: Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### Step 2: Extract Values from JSON
From the downloaded JSON file, you need:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

### Step 3: Update Your .env File
Create or update your `.env` file with the extracted values:

```bash
# Example from downloaded JSON
FIREBASE_PROJECT_ID=your-project-name-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@your-project-name-12345.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Step 4: Test Configuration
```bash
# Restart your server
npm run start:dev

# Test Firebase status
curl -X GET http://localhost:3000/firebase/test/status
```

If configured correctly, you should see:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Firebase status checked",
  "data": {
    "configured": true,
    "status": "Firebase is properly configured"
  }
}
```

## 4. Frontend Configuration

Update the `firebaseConfig` object in `public/firebase-test.html`:

```javascript
const firebaseConfig = {
    apiKey: "your-web-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-web-app-id"
};
```

## 5. Testing Steps

### Step 1: Start Backend Server
```bash
npm run start:dev
```

### Step 2: Open Test Page
Open `http://localhost:3000/firebase-test.html` in your browser

### Step 3: Get JWT Token
1. Login to your application
2. Get the JWT token from browser storage or API response
3. Paste it in the test page

### Step 4: Test Notifications
1. Click "Request Notification Permission"
2. Click "Register Device Token"
3. Send test notifications using the buttons

## 6. API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/firebase/device-token` | POST | Register device token |
| `/firebase/device-tokens` | GET | Get user's device tokens |
| `/firebase/test-notification` | POST | Send custom test notification |
| `/firebase/test-booking-notification` | POST | Test booking confirmation |
| `/firebase/test-payment-notification` | POST | Test payment notification |
| `/firebase/test-status` | GET | Check Firebase configuration |

## 7. Troubleshooting

### Common Issues:

1. **"Firebase not configured"**
   - Check environment variables
   - Verify private key format

2. **"No registration token available"**
   - Request notification permission first
   - Check browser support
   - Verify Firebase config

3. **"Permission denied"**
   - Grant notification permission in browser
   - Check HTTPS requirement (localhost works)

4. **"Device token not found"**
   - Register device token first
   - Check JWT token validity

### Browser Requirements:
- HTTPS (except localhost)
- Modern browser with push notification support
- Service Worker for background notifications

## 8. Production Considerations

1. **Security**: Never expose Firebase private key in frontend
2. **Token Management**: Implement token refresh logic
3. **Error Handling**: Handle failed notifications gracefully
4. **Rate Limiting**: Respect Firebase rate limits
5. **User Preferences**: Allow users to disable notifications

## 9. Integration with App

To integrate with your main application:

1. Include Firebase SDK in your frontend
2. Request permission on user login/registration
3. Register device token automatically
4. Handle incoming notifications
5. Update token on refresh

Example integration code:
```javascript
// In your main app initialization
messaging.onMessage((payload) => {
    // Handle foreground messages
    showNotification(payload.notification);
});

// Register token on user login
async function loginUser(credentials) {
    const response = await fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
    
    const { token } = await response.json();
    localStorage.setItem('jwtToken', token);
    
    // Register device token
    const deviceToken = await messaging.getToken();
    await registerDeviceToken(deviceToken, token);
}
```
