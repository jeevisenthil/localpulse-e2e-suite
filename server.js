require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

// ==================== SUPABASE CONNECTION ====================
const SUPABASE_URL = 'https://rlwxxxcerycukwyuezpv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3h4eGNlcnljdWt3eXVlenB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTAwNDQsImV4cCI6MjA5NTM4NjA0NH0.bsnmtjXgGGoIkFp6RVl84rh8HO3ang_OqXcLDwly0w4';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('Supabase client initialized:', SUPABASE_URL);

// ==================== EMAIL & SMS ====================
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && !process.env.GMAIL_USER.includes('your-email')) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });
  console.log('Nodemailer Gmail service initialized.');
} else {
  console.log('Nodemailer: Gmail credentials not configured. OTP emails will be printed to console.');
}

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_ACCOUNT_SID.includes('your-twilio')) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('Twilio SMS service initialized.');
} else {
  console.log('Twilio: Credentials not configured. OTP text messages will be printed to console.');
}

async function sendOTPEmail(email, otp, username) {
  const mailOptions = {
    from: `"LocalPulse Community" <${process.env.GMAIL_USER || 'no-reply@localpulse.com'}>`,
    to: email,
    subject: 'LocalPulse Security Verification Code',
    text: `Hello ${username},\n\nYour security verification OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nLocalPulse Team`,
    html: `<div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
      <h2 style="color: #6366f1;">LocalPulse Security</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Your email verification OTP code is:</p>
      <div style="font-size: 24px; font-weight: bold; color: #6366f1; letter-spacing: 2px; padding: 12px; background-color: #e0e7ff; display: inline-block; border-radius: 6px; margin: 10px 0;">${otp}</div>
      <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes.</p>
    </div>`
  };
  if (transporter) {
    try { await transporter.sendMail(mailOptions); console.log(`Email OTP sent to ${email}`); }
    catch (err) { console.log(`Email send failed: ${err.message}. OTP for ${email}: ${otp}`); }
  } else {
    console.log(`[SIMULATED EMAIL] To: ${email} | OTP: ${otp}`);
  }
}

async function sendOTPSMS(phone, otp, username) {
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({ body: `LocalPulse OTP: ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: `+91${phone}` });
      console.log(`SMS OTP sent to ${phone}`);
    } catch (err) { console.log(`SMS send failed: ${err.message}. OTP for ${phone}: ${otp}`); }
  } else {
    console.log(`[SIMULATED SMS] To: ${phone} | OTP: ${otp}`);
  }
}

async function sendResetEmail(email, otp, username) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"LocalPulse Community" <${process.env.GMAIL_USER || 'no-reply@localpulse.com'}>`,
        to: email,
        subject: 'LocalPulse Password Reset Code',
        text: `Hello ${username},\n\nYour password reset code is: ${otp}\n\nBest regards,\nLocalPulse Team`
      });
      console.log(`Reset email sent to ${email}`);
    } catch (err) { console.log(`Reset email failed: ${err.message}. Reset OTP for ${email}: ${otp}`); }
  } else {
    console.log(`[SIMULATED RESET EMAIL] To: ${email} | Reset OTP: ${otp}`);
  }
}

// ==================== EXPRESS APP ====================
const app = express();
const PORT = 3005;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ==================== HELPER: Add Activity Log ====================
async function addActivity(action, type) {
  try {
    await supabase.from('activities').insert([{
      id: 'act_' + Date.now(),
      action,
      timestamp: new Date().toISOString(),
      type
    }]);
  } catch (e) { console.log('Activity log error:', e.message); }
}

// ==================== AUTH ENDPOINTS ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, phone, password, role } = req.body;
  if (!username || !email || !phone || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check existing user
  const { data: existing } = await supabase.from('users')
    .select('id').or(`username.eq.${username.trim()},email.eq.${email.trim()},phone.eq.${phone.trim()}`).limit(1);
  if (existing && existing.length > 0) {
    return res.status(400).json({ error: 'Username, Email, or Phone already registered' });
  }

  const randomId = Math.floor(1000 + Math.random() * 9000);
  const userId = role === 'Admin' ? `ADM-${randomId}` : `RES-${randomId}`;
  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();

  const { error } = await supabase.from('users').insert([{
    id: userId, username: username.trim(), email: email.trim(), phone: phone.trim(),
    password: password.trim(), role, verified: false, email_otp: emailOtp, phone_otp: phoneOtp,
    created_at: new Date().toISOString()
  }]);
  if (error) return res.status(500).json({ error: error.message });

  await addActivity(`New user registration initiated for ${userId} (${username})`, 'profile');
  await sendOTPEmail(email.trim(), emailOtp, username.trim());
  await sendOTPSMS(phone.trim(), phoneOtp, username.trim());

  res.status(201).json({ message: 'Registration successful!', userId, role, emailOtp, phoneOtp });
});

// Verify OTP
app.post('/api/auth/verify', async (req, res) => {
  const { userId, emailOtp, phoneOtp } = req.body;
  const { data: users } = await supabase.from('users').select('*').eq('id', userId).limit(1);
  if (!users || users.length === 0) return res.status(404).json({ error: 'User not found' });

  const user = users[0];
  if (user.email_otp !== emailOtp || user.phone_otp !== phoneOtp) {
    return res.status(400).json({ error: 'Invalid verification codes' });
  }

  await supabase.from('users').update({ verified: true, email_otp: null, phone_otp: null }).eq('id', userId);
  await addActivity(`User ${userId} successfully verified email and phone number`, 'profile');

  user.verified = true;
  delete user.email_otp; delete user.phone_otp;
  res.json({ success: true, user });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  const { data: users } = await supabase.from('users').select('*')
    .or(`username.eq.${username.trim()},email.eq.${username.trim()},phone.eq.${username.trim()}`);

  const user = users ? users.find(u => u.password === password.trim()) : null;
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  if (!user.verified) {
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('users').update({ email_otp: emailOtp, phone_otp: phoneOtp }).eq('id', user.id);
    await sendOTPEmail(user.email, emailOtp, user.username);
    await sendOTPSMS(user.phone, phoneOtp, user.username);
    return res.status(403).json({ error: 'Account not verified', userId: user.id, emailOtp, phoneOtp });
  }

  res.json({ success: true, user });
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { data: users } = await supabase.from('users').select('*').eq('email', email.trim()).limit(1);
  if (!users || users.length === 0) return res.status(404).json({ error: 'No user registered with this email address' });

  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  await supabase.from('users').update({ reset_otp: resetOtp }).eq('id', users[0].id);
  await sendResetEmail(email.trim(), resetOtp, users[0].username);
  res.json({ message: 'Reset OTP code generated successfully!', resetOtp });
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, resetOtp, newPassword } = req.body;
  const { data: users } = await supabase.from('users').select('*').eq('email', email.trim()).limit(1);
  if (!users || users.length === 0) return res.status(404).json({ error: 'User not found' });

  if (users[0].reset_otp !== resetOtp) return res.status(400).json({ error: 'Invalid reset code' });

  await supabase.from('users').update({ password: newPassword.trim(), reset_otp: null }).eq('id', users[0].id);
  await addActivity(`User ${users[0].id} reset password successfully`, 'profile');
  res.json({ success: true, message: 'Password reset successful!' });
});

// ==================== NOTICES ENDPOINTS ====================

// Get all notices
app.get('/api/notices', async (req, res) => {
  // Auto-archive expired notices
  const now = new Date().toISOString();
  await supabase.from('notices').update({ archived: true }).lt('expires_at', now).eq('archived', false);

  const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Create notice
app.post('/api/notices', async (req, res) => {
  const newNotice = {
    id: 'notice_' + Date.now(),
    title: req.body.title || 'Untitled Notice',
    description: req.body.description || 'No description provided',
    category: req.body.category || 'general',
    urgency: req.body.urgency || 'normal',
    author: req.body.author || 'Resident',
    contact: req.body.contact || '',
    pinned: false, upvotes: 0, upvoted_by: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + (req.body.expiryDays || 3) * 24 * 60 * 60 * 1000).toISOString(),
    area: req.body.area || 'Anna Nagar Colony',
    archived: false
  };

  const { data, error } = await supabase.from('notices').insert([newNotice]).select();
  if (error) return res.status(500).json({ error: error.message });
  await addActivity(`Posted new ${newNotice.urgency} notice in ${newNotice.category}: "${newNotice.title}"`, 'post');
  res.status(201).json(data ? data[0] : newNotice);
});

// Upvote Notice
app.post('/api/notices/upvote', async (req, res) => {
  const noticeId = req.body.id;
  const nickname = req.body.nickname || 'Resident_101';

  const { data: notices } = await supabase.from('notices').select('*').eq('id', noticeId).limit(1);
  if (!notices || notices.length === 0) return res.status(404).json({ error: 'Notice not found' });

  const notice = notices[0];
  const upvotedBy = notice.upvoted_by || [];
  const idx = upvotedBy.indexOf(nickname);

  if (idx !== -1) {
    upvotedBy.splice(idx, 1);
    notice.upvotes = Math.max(0, notice.upvotes - 1);
    await addActivity(`Removed upvote on "${notice.title}"`, 'upvote');
  } else {
    upvotedBy.push(nickname);
    notice.upvotes += 1;
    await addActivity(`Upvoted notice: "${notice.title}"`, 'upvote');
  }

  await supabase.from('notices').update({ upvotes: notice.upvotes, upvoted_by: upvotedBy }).eq('id', noticeId);
  notice.upvoted_by = upvotedBy;
  res.json(notice);
});

// Pin/Unpin Notice
app.post('/api/notices/pin', async (req, res) => {
  const noticeId = req.body.id;
  const { data: notices } = await supabase.from('notices').select('*').eq('id', noticeId).limit(1);
  if (!notices || notices.length === 0) return res.status(404).json({ error: 'Notice not found' });

  const newPinned = !notices[0].pinned;
  await supabase.from('notices').update({ pinned: newPinned }).eq('id', noticeId);
  await addActivity(newPinned ? `Pinned notice: "${notices[0].title}"` : `Unpinned notice: "${notices[0].title}"`, 'admin');
  res.json({ ...notices[0], pinned: newPinned });
});

// Delete Notice
app.delete('/api/notices/:id', async (req, res) => {
  const noticeId = req.params.id;
  const { data: notices } = await supabase.from('notices').select('title').eq('id', noticeId).limit(1);
  if (!notices || notices.length === 0) return res.status(404).json({ error: 'Notice not found' });

  await supabase.from('notices').delete().eq('id', noticeId);
  await addActivity(`Deleted notice: "${notices[0].title}"`, 'admin');
  res.json({ success: true });
});

// ==================== PROFILE ENDPOINTS ====================

app.get('/api/profile', async (req, res) => {
  const { data } = await supabase.from('profile').select('*').limit(1);
  if (data && data.length > 0) {
    const p = data[0];
    res.json({
      nickname: p.nickname, area: p.area, role: p.role, familySize: p.family_size,
      notificationSound: p.notification_sound, dailyDigest: p.daily_digest,
      mutedCategories: p.muted_categories || [], onboardingCompleted: p.onboarding_completed
    });
  } else {
    res.json({ nickname: 'Resident_101', area: 'Anna Nagar Colony', role: 'Resident', familySize: 4 });
  }
});

app.post('/api/profile', async (req, res) => {
  const updates = {};
  if (req.body.nickname) updates.nickname = req.body.nickname;
  if (req.body.area) updates.area = req.body.area;
  if (req.body.role) updates.role = req.body.role;
  if (req.body.familySize !== undefined) updates.family_size = req.body.familySize;
  if (req.body.notificationSound !== undefined) updates.notification_sound = req.body.notificationSound;
  if (req.body.dailyDigest !== undefined) updates.daily_digest = req.body.dailyDigest;

  await supabase.from('profile').update(updates).eq('id', 1);
  await addActivity(`Modified resident profile name to "${req.body.nickname || 'Resident'}"`, 'profile');

  const { data } = await supabase.from('profile').select('*').eq('id', 1).limit(1);
  const p = data[0];
  res.json({
    nickname: p.nickname, area: p.area, role: p.role, familySize: p.family_size,
    notificationSound: p.notification_sound, dailyDigest: p.daily_digest,
    mutedCategories: p.muted_categories || [], onboardingCompleted: p.onboarding_completed
  });
});

// ==================== ACTIVITIES ====================

app.get('/api/activities', async (req, res) => {
  const { data } = await supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(50);
  res.json(data || []);
});

// ==================== ARCHIVE CHECK ====================

app.post('/api/archive/check', async (req, res) => {
  const now = new Date().toISOString();
  const { data: expired } = await supabase.from('notices').select('id').lt('expires_at', now).eq('archived', false);
  const count = expired ? expired.length : 0;
  if (count > 0) {
    await supabase.from('notices').update({ archived: true }).lt('expires_at', now).eq('archived', false);
  }
  const { data: allArchived } = await supabase.from('notices').select('id').eq('archived', true);
  res.json({ checked: true, expiredCount: count, totalArchived: allArchived ? allArchived.length : 0 });
});

// ==================== MOCK ALERT ====================

app.post('/api/mock/alert', async (req, res) => {
  const type = req.body.type || 'power';
  let title = 'Maintenance scheduled', desc = 'Scheduled community maintenance alerts.';
  if (type === 'power') {
    title = '🚨 URGENT: Feeder breakdown / Power Outage';
    desc = 'Sudden line failure on main feeder substation. Entire Anna Nagar Colony grid down for next 3 hours.';
  } else if (type === 'water') {
    title = '💦 Municipal Water pipeline leakage';
    desc = 'Pipeline leakage reported near main entrance gate. Water supply delayed by 4 hours tomorrow morning.';
  }

  const mockNotice = {
    id: 'mock_' + Date.now(), title, description: desc, category: type, urgency: 'urgent',
    author: 'Admin_RWA', contact: '044-2490XX', pinned: true, upvotes: 2, upvoted_by: [],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    area: 'Anna Nagar Colony', archived: false
  };

  await supabase.from('notices').insert([mockNotice]);
  await addActivity(`Mock alert triggered: "${mockNotice.title}"`, 'admin');
  res.status(201).json(mockNotice);
});

// ==================== RESET ====================

app.post('/api/reset', async (req, res) => {
  // Clear all notices and re-seed
  await supabase.from('notices').delete().neq('id', '');
  await supabase.from('activities').delete().neq('id', '');

  const seeds = [
    { id: 'sample_1', title: 'Power cut scheduled tomorrow 9AM to 2PM', description: 'EB maintenance work on the main feeder line. Entire Block C affected.', category: 'power', urgency: 'urgent', author: 'Admin_RWA', contact: '98765xxxxx', pinned: true, upvotes: 16, upvoted_by: [], created_at: new Date(Date.now() - 2*3600000).toISOString(), expires_at: new Date(Date.now() + 2*86400000).toISOString(), area: 'Anna Nagar Colony', archived: false },
    { id: 'sample_2', title: 'Water supply disruption 6AM to 10AM', description: 'Metro Water board pipeline repair.', category: 'water', urgency: 'important', author: 'Block_Secretary', contact: '', pinned: false, upvotes: 11, upvoted_by: [], created_at: new Date(Date.now() - 5*3600000).toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString(), area: 'Anna Nagar Colony', archived: false },
    { id: 'sample_3', title: 'Community Cleanup Drive Sunday 7AM', description: 'Join hands for making Anna Nagar cleaner and greener.', category: 'event', urgency: 'normal', author: 'GreenTeam_Colony', contact: '', pinned: false, upvotes: 7, upvoted_by: [], created_at: new Date(Date.now() - 12*3600000).toISOString(), expires_at: new Date(Date.now() + 5*86400000).toISOString(), area: 'Anna Nagar Colony', archived: false }
  ];

  await supabase.from('notices').insert(seeds);
  await addActivity('Database reset. Seed templates re-loaded from Supabase.', 'profile');

  const { data: notices } = await supabase.from('notices').select('*');
  res.json({ reset: true, notices: notices || seeds });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`LocalPulse Server running at http://localhost:${PORT}`);
  console.log(`Backend: Supabase Cloud (${SUPABASE_URL})`);
});
