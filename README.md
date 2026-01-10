# Run Club Attendance Tracker

A simple, mobile-friendly web app for tracking weekly attendance at your run club. Pass around a single phone for everyone to mark their attendance.

## Features

- **Quick Check-In**: Members select their name from a list to check in
- **Weekly Dashboard**: Track new vs returning members each week
- **Member Management**: Add/remove members and view their stats
- **Attendance History**: View past attendance records with filters
- **CSV Export**: Download attendance data for analysis

## Tech Stack

- React 18 with Vite
- Firebase Firestore (database)
- React Router (navigation)
- date-fns (date handling)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Firestore Database:
   - Click "Firestore Database" in the left menu
   - Click "Create database"
   - Start in **test mode** for development (you can set up security rules later)
   - Choose a location close to you

4. Get your Firebase configuration:
   - Go to Project Settings (gear icon) > General
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to register a web app
   - Copy the `firebaseConfig` object

5. Update `src/firebase.js`:
   - Replace the placeholder values with your actual Firebase config

### 3. Run the App

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 4. Add Your First Members

1. Navigate to the "Members" page
2. Click "Add Member"
3. Add all your run club members
4. Now you can start checking people in!

## Usage

### Check-In Flow

1. Open the app on a phone
2. Pass the phone around before/after the run
3. Each person taps their name and clicks "Check In"
4. See who's already checked in (grayed out)

### Dashboard

View weekly stats including:
- Total attendance this week
- Number of new members
- Number of returning members
- Average weekly attendance
- Historical trends

### History & Export

- View all past attendance records
- Filter by today, last 30 days, or all time
- Export data to CSV for further analysis

## Database Structure

### Collections

**members**
```javascript
{
  name: "John Doe",
  joinedDate: "2024-01-15",
  createdAt: "2024-01-15T10:30:00Z"
}
```

**attendance**
```javascript
{
  memberId: "abc123",
  date: "2024-01-15",
  weekStart: "2024-01-14",  // Monday of that week
  timestamp: "2024-01-15T18:30:00Z"
}
```

## Deployment

### Option 1: Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 2: Vercel

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Deploy with one click

### Option 3: Netlify

```bash
npm run build
# Drag and drop the 'dist' folder to Netlify
```

## Security Considerations

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all
    match /members/{document=**} {
      allow read: if true;
      allow write: if true; // Add authentication if needed
    }
    match /attendance/{document=**} {
      allow read: if true;
      allow write: if true; // Add authentication if needed
    }
  }
}
```

For stricter security, consider adding Firebase Authentication.

## Troubleshooting

### "Permission denied" errors
- Check that Firestore is in test mode or security rules allow access
- Verify your Firebase config is correct

### Members not loading
- Check browser console for errors
- Verify Firebase project is active
- Check that Firestore database is created

### App won't start
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`
- Check that you're using Node.js version 16 or higher

## Future Enhancements

- Add authentication for admin features
- Send reminder notifications before runs
- Track member streaks and milestones
- Add photos from runs
- Integration with Strava or other running apps

## License

MIT
