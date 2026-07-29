# 📍 LocalPulse Mobile

React Native (Expo) mobile frontend for the **LocalPulse** community notice board.  
Connects to the **same Express backend** (`server.js`) used by the web app.

---

## 🚀 Getting Started

### 1. Start the backend server (from the web app folder)
```bash
cd ../   # go to local_pulse_workspace
node server.js
# Runs at http://localhost:3005
```

### 2. Start the mobile app
```bash
cd LocalPulseMobile
npm start

# Then press:
#   w  → open in browser (web preview)
#   a  → open in Android emulator
#   i  → open in iOS simulator (macOS only)
```

### 3. Physical Device Testing
- Install **Expo Go** from the Play Store / App Store
- Scan the QR code shown in the terminal
- Update `src/config/api.js` to use your computer's **local IP** instead of `localhost`

---

## 📁 Project Structure

```
LocalPulseMobile/
├── App.js                    # Root component + navigation setup
├── src/
│   ├── config/
│   │   ├── api.js            # API base URL (points to same backend)
│   │   └── theme.js          # Design tokens (colors, spacing, fonts)
│   ├── screens/
│   │   ├── LoginScreen.js    # Login with same credentials as web app
│   │   ├── FeedScreen.js     # Notice feed with tabs + upvoting
│   │   ├── NoticeDetailScreen.js  # Full notice view + admin actions
│   │   ├── PostScreen.js     # Multi-step notice creation wizard
│   │   ├── SearchScreen.js   # Search + filter by category/urgency
│   │   ├── ProfileScreen.js  # Profile, stats, activity log
│   │   └── AdminScreen.js    # Admin dashboard (admin users only)
│   ├── services/
│   │   └── api.js            # All REST API calls to backend
│   └── utils/
│       └── helpers.js        # timeAgo, expiry labels, user list
```

---

## 🔗 Shared Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notices` | Fetch all notices |
| POST | `/api/notices` | Create a new notice |
| POST | `/api/notices/upvote` | Toggle upvote |
| POST | `/api/notices/pin` | Toggle pin (Admin) |
| DELETE | `/api/notices/:id` | Delete notice (Admin) |
| GET | `/api/profile` | Get profile |
| POST | `/api/profile` | Update profile |
| GET | `/api/activities` | Activity log |
| POST | `/api/archive/check` | Archive expired notices |
| POST | `/api/mock/alert` | Trigger mock alert |
| POST | `/api/reset` | Reset DB to seed data |

---

## 🔐 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `123` |
| Resident | `resident` | `1234` |

---

## 📱 Screens

- **Login** — Animated, dark-themed login with demo credentials hint  
- **Feed** — Notice board with All/Pinned/Urgent tabs, pull-to-refresh, upvote  
- **Search** — Full-text search with category & urgency filters, archive toggle  
- **Post** — 4-step wizard: Category → Details → Urgency/Expiry → Preview → Publish  
- **Profile** — User stats, editable nickname/area, recent activity log, logout  
- **Admin** — Stats dashboard, quick actions (mock alerts, archive, DB reset), notice management  

---

## ⚙️ Configuration

To use your computer's IP on a physical device, edit `src/config/api.js`:

```js
const getBaseUrl = () => {
  // Replace with your actual local IP:
  return 'http://192.168.1.XX:3005/api';
};
```
