require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Transporter for Gmail
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && !process.env.GMAIL_USER.includes('your-email')) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
  console.log('Nodemailer Gmail service initialized.');
} else {
  console.log('Nodemailer: Gmail credentials not configured. OTP emails will be printed to console.');
}

// Twilio Client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_ACCOUNT_SID.includes('your-twilio')) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('Twilio SMS service initialized.');
} else {
  console.log('Twilio: Credentials not configured. OTP text messages will be printed to console.');
}

// Send Email Helper
async function sendOTPEmail(email, otp, username) {
  const mailOptions = {
    from: `"LocalPulse Community" <${process.env.GMAIL_USER || 'no-reply@localpulse.com'}>`,
    to: email,
    subject: 'LocalPulse Security Verification Code',
    text: `Hello ${username},\n\nYour security verification OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nLocalPulse Team`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #6366f1;">LocalPulse Security</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>Thank you for registering at LocalPulse. Your email verification OTP code is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #6366f1; letter-spacing: 2px; padding: 12px; background-color: #e0e7ff; display: inline-block; border-radius: 6px; margin: 10px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email OTP sent successfully to ${email}`);
    } catch (err) {
      console.error(`Failed to send email to ${email}:`, err);
    }
  } else {
    console.log('\n=======================================');
    console.log(`[SIMULATED EMAIL] To: ${email}`);
    console.log(`[SIMULATED EMAIL] Subject: ${mailOptions.subject}`);
    console.log(`[SIMULATED EMAIL] Body: Code is ${otp}`);
    console.log('=======================================\n');
  }
}

// Send SMS Helper
async function sendOTPSMS(phone, otp, username) {
  const body = `LocalPulse Security: Hello ${username}, your verification OTP code is ${otp}.`;
  
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER.replace(/\s+/g, '').trim();
      const toNumber = phone.replace(/\s+/g, '').trim();
      await twilioClient.messages.create({
        body: body,
        to: toNumber,
        from: fromNumber
      });
      console.log(`SMS OTP sent successfully to ${toNumber}`);
    } catch (err) {
      console.error(`Failed to send SMS to ${phone}:`, err);
    }
  } else {
    console.log('\n=======================================');
    console.log(`[SIMULATED SMS] To: ${phone}`);
    console.log(`[SIMULATED SMS] Body: ${body}`);
    console.log('=======================================\n');
  }
}

// Send Reset Email Helper
async function sendResetEmail(email, otp, username) {
  const mailOptions = {
    from: `"LocalPulse Community" <${process.env.GMAIL_USER || 'no-reply@localpulse.com'}>`,
    to: email,
    subject: 'LocalPulse Password Reset Code',
    text: `Hello ${username},\n\nYour security password reset OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nLocalPulse Team`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #ef4444;">LocalPulse Security</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>You requested a password reset for your LocalPulse account. Your reset code is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #ef4444; letter-spacing: 2px; padding: 12px; background-color: #fee2e2; display: inline-block; border-radius: 6px; margin: 10px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. If you did not request this change, you can safely ignore this email.</p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Reset Email sent successfully to ${email}`);
    } catch (err) {
      console.error(`Failed to send reset email to ${email}:`, err);
    }
  } else {
    console.log('\n=======================================');
    console.log(`[SIMULATED RESET EMAIL] To: ${email}`);
    console.log(`[SIMULATED RESET EMAIL] Subject: ${mailOptions.subject}`);
    console.log(`[SIMULATED RESET EMAIL] Body: Reset Code is ${otp}`);
    console.log('=======================================\n');
  }
}

const app = express();
const PORT = 3005;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'sandbox_db.json');

// Pre-seeded Indian colony notice boards
const DEFAULT_NOTICES = [
  {
    id: 'sample_1',
    title: 'Power cut scheduled tomorrow 9AM–2PM',
    description: 'EB maintenance work on the main feeder line. Entire Block C affected. Please charge your devices and store water tonight.',
    category: 'power',
    urgency: 'urgent',
    author: 'Admin_RWA',
    contact: '98765xxxxx',
    pinned: true,
    upvotes: 16,
    upvoted_by: [],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    area: 'Anna Nagar Colony',
    archived: false
  },
  {
    id: 'sample_2',
    title: 'Water supply disruption — 6AM to 10AM',
    description: 'Metro Water board pipeline repair. Store enough water tonight to avoid any inconvenience.',
    category: 'water',
    urgency: 'important',
    author: 'Block_Secretary',
    contact: '',
    pinned: false,
    upvotes: 11,
    upvoted_by: [],
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
    expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
    area: 'Anna Nagar Colony',
    archived: false
  },
  {
    id: 'sample_3',
    title: 'Community Cleanup Drive — Sunday 7AM',
    description: 'Join hands for making Anna Nagar cleaner and greener. Gathering point is Central Park.',
    category: 'event',
    urgency: 'normal',
    author: 'GreenTeam_Colony',
    contact: '',
    pinned: false,
    upvotes: 7,
    upvoted_by: [],
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h ago
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    area: 'Anna Nagar Colony',
    archived: false
  },
  {
    id: 'sample_4',
    title: 'Lost: Black labrador near park — Reward ₹500!',
    description: 'Lost near the children\'s park yesterday. Name is Bruno, wearing a brown collar. Friendly but scared.',
    category: 'lost',
    urgency: 'important',
    author: 'Flat_4A_Sharma',
    contact: '9876500000',
    pinned: false,
    upvotes: 19,
    upvoted_by: [],
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    area: 'Anna Nagar Colony',
    archived: false
  },
  {
    id: 'sample_5',
    title: 'Security guard vacancy — night shift',
    description: 'RWA is looking for an experienced security guard for night shift (8PM to 8AM). Reference required.',
    category: 'jobs',
    urgency: 'normal',
    author: 'RWA_Secretary',
    contact: '',
    pinned: false,
    upvotes: 4,
    upvoted_by: [],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1d ago
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    area: 'Anna Nagar Colony',
    archived: false
  },
  {
    id: 'sample_6',
    title: 'HP Gas cylinder group booking — Friday',
    description: 'Doing a bulk booking for the lane to ensure fast delivery. Reach out with customer details.',
    category: 'general',
    urgency: 'normal',
    author: 'Resident_2B',
    contact: '',
    pinned: false,
    upvotes: 8,
    upvoted_by: [],
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18h ago
    expires_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days
    area: 'Anna Nagar Colony',
    archived: false
  },
  {
    id: 'sample_7',
    title: 'Streetlight out near Gate 2',
    description: 'Streetlight near Gate 2 is flickering and completely off after 10PM. Reported to Corporation, pending resolve.',
    category: 'emergency',
    urgency: 'urgent',
    author: 'Night_Watchman',
    contact: '',
    pinned: false,
    upvotes: 13,
    upvoted_by: [],
    created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14h ago
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    area: 'Anna Nagar Colony',
    archived: false
  }
];

const DEFAULT_PROFILE = {
  nickname: 'Resident_101',
  area: 'Anna Nagar Colony',
  role: 'Resident',
  familySize: 4,
  notificationSound: true,
  dailyDigest: true,
  mutedCategories: [],
  onboardingCompleted: true
};

// Database Initialization Helper
function loadDB() {
  const defaultUsers = [
    {
      id: 'ADM-1111',
      username: 'admin',
      email: 'admin@localpulse.com',
      phone: '9876543210',
      password: '123',
      role: 'Admin',
      verified: true
    },
    {
      id: 'RES-2222',
      username: 'resident',
      email: 'resident@localpulse.com',
      phone: '9876543211',
      password: '1234',
      role: 'Resident',
      verified: true
    }
  ];

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      notices: DEFAULT_NOTICES,
      profile: DEFAULT_PROFILE,
      users: defaultUsers,
      activities: [
        {
          id: 'act_init',
          action: 'Workspace Sandbox initialized. Colony notice board loaded.',
          timestamp: new Date().toISOString(),
          type: 'profile'
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE);
    const parsed = JSON.parse(raw);
    if (!parsed.users) {
      parsed.users = defaultUsers;
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (e) {
    console.error('Error parsing sandbox DB. Rebuilding...', e);
    const initialData = { notices: DEFAULT_NOTICES, profile: DEFAULT_PROFILE, users: defaultUsers, activities: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Auto-archive background check routine
function runAutoArchiveCheck(data) {
  let changed = false;
  const now = new Date();
  data.notices = data.notices.map(notice => {
    if (!notice.archived && new Date(notice.expires_at) < now) {
      changed = true;
      return { ...notice, archived: true };
    }
    return notice;
  });
  if (changed) {
    saveDB(data);
  }
  return data;
}

// --- API ENDPOINTS ---

// ========== AUTHENTICATION ==========

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const data = loadDB();
  const { username, email, phone, password, role } = req.body;

  if (!username || !email || !phone || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if username, email, or phone already exists
  const exists = data.users.some(u => u.username === username || u.email === email || u.phone === phone);
  if (exists) {
    return res.status(400).json({ error: 'Username, Email, or Phone already registered' });
  }

  // Generate unique Auto ID
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const userId = role === 'Admin' ? `ADM-${randomId}` : `RES-${randomId}`;

  // Generate verification codes (mocking OTPs)
  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser = {
    id: userId,
    username: username.trim(),
    email: email.trim(),
    phone: phone.trim(),
    password: password.trim(),
    role: role,
    verified: false,
    emailOtp,
    phoneOtp,
    created_at: new Date().toISOString()
  };

  data.users.push(newUser);
  
  // Log activity
  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: `New user registration initiated for ${userId} (${username})`,
    timestamp: new Date().toISOString(),
    type: 'profile'
  });

  saveDB(data);

  // Send real Email & SMS notifications
  await sendOTPEmail(email.trim(), emailOtp, username.trim());
  await sendOTPSMS(phone.trim(), phoneOtp, username.trim());

  // Send back the details
  res.status(201).json({
    message: 'Registration successful! Verification code generated.',
    userId: userId,
    role: role,
    emailOtp: emailOtp,
    phoneOtp: phoneOtp
  });
});

// Verify OTP
app.post('/api/auth/verify', (req, res) => {
  const data = loadDB();
  const { userId, emailOtp, phoneOtp } = req.body;

  const userIndex = data.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = data.users[userIndex];

  if (user.emailOtp !== emailOtp || user.phoneOtp !== phoneOtp) {
    return res.status(400).json({ error: 'Invalid verification codes' });
  }

  user.verified = true;
  delete user.emailOtp;
  delete user.phoneOtp;

  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: `User ${userId} successfully verified email and phone number`,
    timestamp: new Date().toISOString(),
    type: 'profile'
  });

  saveDB(data);
  res.json({ success: true, user });
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  const data = loadDB();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user by username, email, or phone
  const user = data.users.find(u => 
    (u.username === username.trim() || u.email === username.trim() || u.phone === username.trim()) && 
    u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (!user.verified) {
    // If not verified, generate new OTPs
    user.emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    saveDB(data);

    // Send real Email & SMS notifications again
    await sendOTPEmail(user.email, user.emailOtp, user.username);
    await sendOTPSMS(user.phone, user.phoneOtp, user.username);

    return res.status(403).json({
      error: 'Account not verified',
      userId: user.id,
      emailOtp: user.emailOtp,
      phoneOtp: user.phoneOtp
    });
  }

  res.json({ success: true, user });
});

// Forgot Password (Request OTP)
app.post('/api/auth/forgot-password', async (req, res) => {
  const data = loadDB();
  const { email } = req.body;

  const user = data.users.find(u => u.email === email.trim());
  if (!user) {
    return res.status(404).json({ error: 'No user registered with this email address' });
  }

  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOtp = resetOtp;

  saveDB(data);

  // Send real Password Reset Email
  await sendResetEmail(user.email, resetOtp, user.username);

  res.json({
    message: 'Reset OTP code generated successfully!',
    resetOtp: resetOtp
  });
});

// Reset Password (Verify OTP and change password)
app.post('/api/auth/reset-password', (req, res) => {
  const data = loadDB();
  const { email, resetOtp, newPassword } = req.body;

  const user = data.users.find(u => u.email === email.trim());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.resetOtp !== resetOtp) {
    return res.status(400).json({ error: 'Invalid reset code' });
  }

  user.password = newPassword.trim();
  delete user.resetOtp;

  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: `User ${user.id} reset password successfully`,
    timestamp: new Date().toISOString(),
    type: 'profile'
  });

  saveDB(data);
  res.json({ success: true, message: 'Password reset successful!' });
});

// Fetch notices (applies auto-archive filtering first!)
app.get('/api/notices', (req, res) => {
  let data = loadDB();
  data = runAutoArchiveCheck(data);
  res.json(data.notices);
});

// Create notice
app.post('/api/notices', (req, res) => {
  const data = loadDB();
  const newNotice = {
    id: 'notice_' + Date.now(),
    title: req.body.title || 'Untitled Notice',
    description: req.body.description || 'No description provided',
    category: req.body.category || 'general',
    urgency: req.body.urgency || 'normal',
    author: req.body.author || 'Resident',
    contact: req.body.contact || '',
    pinned: false,
    upvotes: 0,
    upvoted_by: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + (req.body.expiryDays || 3) * 24 * 60 * 60 * 1000).toISOString(),
    area: req.body.area || data.profile.area,
    archived: false
  };

  data.notices.unshift(newNotice);
  
  // Log activity
  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: `Posted new ${newNotice.urgency} notice in ${newNotice.category}: "${newNotice.title}"`,
    timestamp: new Date().toISOString(),
    type: 'post'
  });

  saveDB(data);
  res.status(201).json(newNotice);
});

// Upvote Notice
app.post('/api/notices/upvote', (req, res) => {
  const data = loadDB();
  const noticeId = req.body.id;
  const nickname = req.body.nickname || data.profile.nickname;

  const index = data.notices.findIndex(n => n.id === noticeId);
  if (index === -1) {
    return res.status(404).json({ error: 'Notice not found' });
  }

  const notice = data.notices[index];
  if (!notice.upvoted_by) notice.upvoted_by = [];

  const userIndex = notice.upvoted_by.indexOf(nickname);
  if (userIndex !== -1) {
    // Un-upvote
    notice.upvoted_by.splice(userIndex, 1);
    notice.upvotes = Math.max(0, notice.upvotes - 1);
    data.activities.unshift({
      id: 'act_' + Date.now(),
      action: `Removed upvote on "${notice.title}"`,
      timestamp: new Date().toISOString(),
      type: 'upvote'
    });
  } else {
    // Upvote
    notice.upvoted_by.push(nickname);
    notice.upvotes += 1;
    data.activities.unshift({
      id: 'act_' + Date.now(),
      action: `Upvoted notice: "${notice.title}"`,
      timestamp: new Date().toISOString(),
      type: 'upvote'
    });
  }

  saveDB(data);
  res.json(notice);
});

// Pin/Unpin Notice (Admin only)
app.post('/api/notices/pin', (req, res) => {
  const data = loadDB();
  const noticeId = req.body.id;

  const index = data.notices.findIndex(n => n.id === noticeId);
  if (index === -1) {
    return res.status(404).json({ error: 'Notice not found' });
  }

  const notice = data.notices[index];
  notice.pinned = !notice.pinned;

  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: notice.pinned ? `Pinned notice: "${notice.title}"` : `Unpinned notice: "${notice.title}"`,
    timestamp: new Date().toISOString(),
    type: 'admin'
  });

  saveDB(data);
  res.json(notice);
});

// Delete Notice (Admin only)
app.delete('/api/notices/:id', (req, res) => {
  const data = loadDB();
  const noticeId = req.params.id;

  const index = data.notices.findIndex(n => n.id === noticeId);
  if (index === -1) {
    return res.status(404).json({ error: 'Notice not found' });
  }

  const deletedTitle = data.notices[index].title;
  data.notices.splice(index, 1);

  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: `Deleted notice: "${deletedTitle}"`,
    timestamp: new Date().toISOString(),
    type: 'admin'
  });

  saveDB(data);
  res.json({ success: true });
});

// Profile endpoints
app.get('/api/profile', (req, res) => {
  const data = loadDB();
  res.json(data.profile);
});

app.post('/api/profile', (req, res) => {
  const data = loadDB();
  data.profile = { ...data.profile, ...req.body };
  
  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: `Modified resident profile name to "${data.profile.nickname}" in "${data.profile.area}"`,
    timestamp: new Date().toISOString(),
    type: 'profile'
  });

  saveDB(data);
  res.json(data.profile);
});

// Activity logs
app.get('/api/activities', (req, res) => {
  const data = loadDB();
  res.json(data.activities);
});

// Trigger Auto-Archive explicitly
app.post('/api/archive/check', (req, res) => {
  let data = loadDB();
  const initialArchiveCount = data.notices.filter(n => n.archived).length;
  data = runAutoArchiveCheck(data);
  const finalArchiveCount = data.notices.filter(n => n.archived).length;
  
  res.json({
    checked: true,
    expiredCount: finalArchiveCount - initialArchiveCount,
    totalArchived: finalArchiveCount
  });
});

// Mock notification/announcement alerts
app.post('/api/mock/alert', (req, res) => {
  const data = loadDB();
  const type = req.body.type || 'power';
  let title = 'Maintenance scheduled';
  let desc = 'Scheduled community maintenance alerts.';
  
  if (type === 'power') {
    title = '🚨 URGENT: Feeder breakdown / Power Outage';
    desc = 'Sudden line failure on main feeder substation. Entire Anna Nagar Colony grid down for next 3 hours.';
  } else if (type === 'water') {
    title = '💦 Municipal Water pipeline leakage';
    desc = 'Pipeline leakage reported near main entrance gate. Water supply delayed by 4 hours tomorrow morning.';
  }

  const mockNotice = {
    id: 'mock_' + Date.now(),
    title: title,
    description: desc,
    category: type,
    urgency: 'urgent',
    author: 'Admin_RWA',
    contact: '044-2490XX',
    pinned: true,
    upvotes: 2,
    upvoted_by: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    area: data.profile.area,
    archived: false
  };

  data.notices.unshift(mockNotice);
  data.activities.unshift({
    id: 'act_' + Date.now(),
    action: `Mock alert triggered: "${mockNotice.title}"`,
    timestamp: new Date().toISOString(),
    type: 'admin'
  });

  saveDB(data);
  res.status(201).json(mockNotice);
});

// Reset database
app.post('/api/reset', (req, res) => {
  const initialData = {
    notices: DEFAULT_NOTICES,
    profile: DEFAULT_PROFILE,
    activities: [
      {
        id: 'act_reset',
        action: 'Database factory wiped. SEED notice templates re-loaded.',
        timestamp: new Date().toISOString(),
        type: 'profile'
      }
    ]
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  res.json({ reset: true, notices: initialData.notices, profile: initialData.profile });
});

app.listen(PORT, () => {
  console.log(`LocalPulse Workspace Simulator running at http://localhost:${PORT}`);
});
