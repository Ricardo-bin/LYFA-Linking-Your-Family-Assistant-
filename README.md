# 🌸 LYFA – Linking Your Family Assistant

> A wellness companion app for elderly care — medication reminders, emergency SOS with caregiver acknowledgement, and multi-language support.

![LYFA App](https://lyfa-3a112.web.app/logo.png)

🌐 **Live App:** [https://lyfa-3a112.web.app](https://lyfa-3a112.web.app)

---

## ✨ Features

### 💊 Medication Reminders
- Add medications with scheduled times
- Sound alerts when it's time to take medicine
- Snooze reminders (5, 10, 15, 30 minutes)
- Browser notifications even when tab is minimized
- Mark as Taken ✅ or Missed ❌

### 🚨 Emergency SOS
- One-tap SOS button sends instant email to all caregivers
- Supports up to 5 caregivers (daughter, son, etc.)
- Caregiver receives email with **"I'm On My Way"** button
- Elder's dashboard turns 💚 GREEN when caregiver acknowledges

### 📊 Dashboard
- Medication history (taken/missed)
- SOS alert log with real-time acknowledgement status
- Statistics overview

### 🌍 Multi-Language Support
| Language | Code |
|----------|------|
| English  | en   |
| Hindi (हिंदी) | hi |
| Burmese (မြန်မာ) | my |
| Tamil (தமிழ்) | ta |
| Chinese (中文) | zh |

### ⚙️ Settings
- Edit your name
- Add/remove/update caregivers anytime
- Change language
- Sign out

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React + Vite | Frontend framework |
| Firebase Firestore | Real-time database |
| Firebase Auth | Google Sign-In |
| Firebase Hosting | Web deployment |
| EmailJS | SOS email notifications |
| Web Audio API | Medication sound alerts |
| Browser Notifications API | Background reminders |

---

## 📁 Project Structure

```
lyfa-app/
├── public/
│   └── ack.html          # Caregiver acknowledgement page
├── src/
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   ├── i18n.js            # Multi-language translations
│   ├── firebase/
│   │   ├── config.js      # Firebase configuration
│   │   ├── db.js          # Firestore database operations
│   │   └── emailService.js # EmailJS SOS email sender
│   └── pages/
│       ├── Login.jsx      # Google Sign-In page
│       └── Onboarding.jsx # Setup wizard (language + caregivers)
├── index.html
├── vite.config.js
├── firebase.json
└── firestore.rules
```

---

## 🚀 Setup Guide

### 1. Clone the repository
```bash
git clone https://github.com/AungKoMin200/LYFA-Linking-Your-Family-Assistant-.git
cd LYFA-Linking-Your-Family-Assistant-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database**
4. Enable **Authentication** → Google Sign-In
5. Copy your Firebase config into `src/firebase/config.js`

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

### 4. Set up EmailJS
1. Go to [emailjs.com](https://emailjs.com) and sign up
2. Add Gmail service → copy **Service ID**
3. Create email template with these variables:
   - `{{to_name}}` — caregiver name
   - `{{elder_name}}` — elder's name
   - `{{alert_time}}` — time of SOS
   - `{{message}}` — emergency message
   - `{{ack_link}}` — acknowledgement button link
4. Copy **Template ID** and **Public Key**
5. Update `src/firebase/emailService.js` with your IDs

### 5. Set up Firestore Rules
Go to Firebase Console → Firestore → Rules and paste:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /medications/{medId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /sosAlerts/{alertId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        allow read: if true;
        allow update: if true;
      }
    }
  }
}
```

### 6. Run locally
```bash
npm run dev
```

### 7. Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 📧 EmailJS Template Example

Add this green button to your EmailJS template HTML:

```html
<div style="text-align:center; margin:30px 0;">
  <a href="{{ack_link}}"
     style="display:inline-block; padding:16px 32px; background:#34c97b;
            color:#ffffff; font-size:18px; font-weight:900;
            text-decoration:none; border-radius:14px;">
    ✅ I'm On My Way — I've Seen This
  </a>
</div>
```

---

## 🔒 Security Notes

- Never commit `src/firebase/config.js` with real API keys to a public repo
- Use environment variables for production
- The `.gitignore` excludes `node_modules/` and `dist/`

---

## 👨‍💻 Author

**Aung Ko Min** — [@AungKoMin200](https://github.com/AungKoMin200)

---

## 📄 License

MIT License — feel free to use and modify for your own projects.

---

*Built with ❤️ for elderly care*
