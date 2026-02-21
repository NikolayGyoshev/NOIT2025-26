# Room Reservations and Images Update

## Changes Made

### 1. **Local Room Images**
- Updated seed data in `server/routes.ts` to use local images from `/public` folder
- Room 1: `/room1.jpg` - Deluxe Suite
- Room 2: `/room2.jpg` - Standard Double  
- Room 3: `/room3.jpg` - Family Suite

### 2. **Room Data Updated**
Each room now includes:
- **Deluxe Suite**: 250 BGN/night, 2 guests
- **Standard Double**: 120 BGN/night, 2 guests
- **Family Suite**: 450 BGN/night, 4 guests

All rooms are displayed on the Rooms page with:
- Room image
- Title and location
- Price per night
- Guest capacity
- Description
- "View Details" button

### 3. **Reservation System**
Users can now:
1. Browse rooms on `/rooms` page
2. Click "View Details" on any room
3. Select check-in and check-out dates
4. Click "Reserve Now" to book
5. Login is required (auto-prompts if not logged in)

### 4. **Login System Fixed**
- **Development Mode**: Mock user login without database
  - Click "Вход" (Login) button in navbar
  - Automatically creates session with mock user
  - User ID: `dev-user-123`
  - Can access user profile and admin panel
- **Production Mode**: Full OIDC authentication via Replit

### 5. **Authentication Improvements**
- Fixed passport session serialization
- Cookie settings now work in development (non-secure)
- Mock user creation with proper session management
- User data endpoint (`/api/auth/user`) now returns mock user in dev mode

### 6. **User Features Available**
- ✅ View all rooms with local images
- ✅ Filter rooms by price and capacity
- ✅ Make reservations after login
- ✅ View reservation details
- ✅ Access user profile from navbar
- ✅ Admin panel access (in development)
- ✅ Logout functionality

## How to Use

### Start the Development Server
```powershell
cd Backend-Builder
$env:NODE_ENV = 'development'
$env:DATABASE_URL = 'postgres://localhost:5432/test'
$env:SESSION_SECRET = 'dev_secret'
npm run dev
```

### Access the Application
1. Open `http://localhost:5000`
2. Browse rooms at `/rooms` page
3. Click "Вход" (Login) to access mock user
4. Click "View Details" on any room
5. Select dates and click "Reserve Now"

## Files Modified

1. **server/routes.ts**
   - Updated seed data with local images
   - All three rooms now use `/room1.jpg`, `/room2.jpg`, `/room3.jpg`
   - Bulgarian descriptions added

2. **server/replit_integrations/auth/replitAuth.ts**
   - Fixed session cookie settings for development
   - Improved mock user creation with proper expiration
   - Removed duplicate passport serialization
   - Better error handling in login

3. **server/replit_integrations/auth/routes.ts**
   - Enhanced `/api/auth/user` to return mock user in development
   - Proper handling of user data in non-authenticated environment

## Database Optional
- Application runs without PostgreSQL
- All API endpoints return data or appropriate errors
- Reservations don't persist without database (expected in development)
- When PostgreSQL is available:
  - Seed data is automatically loaded
  - Reservations are persisted
  - User data is stored

## Notes
- Images should be in `client/public/` folder
- Image files: `room1.jpg`, `room2.jpg`, `room3.jpg`
- The `public` folder is served statically by Express
- Images are referenced as `/room1.jpg` etc in the code

## Production Ready
To deploy to production:
1. Set up PostgreSQL database
2. Configure REPL_ID for Replit OIDC (if using Replit)
3. Set proper SESSION_SECRET
4. Run `npm run build && npm start`
