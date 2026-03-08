# FoodDash

## Current State
- OTP login is fully simulated: `AuthScreen.tsx` hard-codes OTP `123456`, auto-fills digits on mount, and shows the OTP value directly on screen.
- Backend has no OTP-related endpoints.
- HTTP outcalls module (`http-outcalls/outcall.mo`) is already installed and supports POST requests.

## Requested Changes (Diff)

### Add
- Backend: `sendOtp(phone: Text)` -- generates a 6-digit OTP, stores it with a TTL (5 minutes), then sends it via MSG91 SMS API using an HTTP outcall.
- Backend: `verifyOtp(phone: Text, code: Text) -> Bool` -- checks the stored OTP against the submitted code, clears it on success.
- Backend: admin-settable `smsApiKey` (MSG91 auth key) and `smsSenderId` config fields stored in stable state.
- Backend: `setSmsConfig(apiKey: Text, senderId: Text)` -- admin-only function to configure the SMS gateway.
- Backend: `getSmsConfig()` -- admin-only query to check current config.

### Modify
- `AuthScreen.tsx`: Remove the simulated SMS OTP box that shows "Your OTP is 123456". Remove auto-fill of digits on mount. Wire `handleSendOtp` to call `backend.sendOtp(phone)`. Wire `handleVerifyOtp` to call `backend.verifyOtp(phone, otp)` before triggering `login()`. Show proper loading and error states.
- Admin panel: Add SMS Config tab where admin can enter MSG91 API key and Sender ID.

### Remove
- Simulated OTP box display in `AuthScreen.tsx` (the `📱 FoodDash SMS / Your OTP is 123456` block).
- Auto-fill effect `setOtpDigits(["1","2","3","4","5","6"])` in `useEffect`.

## Implementation Plan
1. Update `main.mo`: add OTP store (phone -> {code, expiresAt}), `sendOtp`, `verifyOtp`, `setSmsConfig`, `getSmsConfig` functions using MSG91 HTTP outcall.
2. Regenerate `backend.d.ts` bindings.
3. Update `AuthScreen.tsx`: remove OTP display/auto-fill, call real backend APIs, handle errors.
4. Update `AdminApp.tsx`: add SMS Config tab.
5. Validate and deploy.
