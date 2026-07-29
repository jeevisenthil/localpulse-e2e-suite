// API Service — Calls the SAME Express backend (server.js) used by the web app

import { API_BASE } from '../config/api';

class ApiService {
  // ========== AUTHENTICATION ==========

  async register({ username, email, phone, password, role }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      return { success: true, data };
    } catch (err) {
      console.error('api.register error:', err);
      return { success: false, error: err.message };
    }
  }

  async verifyOtp({ userId, emailOtp, phoneOtp }) {
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emailOtp, phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      return { success: true, data: data.user };
    } catch (err) {
      console.error('api.verifyOtp error:', err);
      return { success: false, error: err.message };
    }
  }

  async login({ username, password }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.status === 403) {
        // Not verified yet, return verification details
        return {
          success: false,
          notVerified: true,
          userId: data.userId,
          emailOtp: data.emailOtp,
          phoneOtp: data.phoneOtp,
        };
      }
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');
      return { success: true, data: data.user };
    } catch (err) {
      console.error('api.login error:', err);
      return { success: false, error: err.message };
    }
  }

  async forgotPassword(email) {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate reset code');
      return { success: true, data };
    } catch (err) {
      console.error('api.forgotPassword error:', err);
      return { success: false, error: err.message };
    }
  }

  async resetPassword({ email, resetOtp, newPassword }) {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetOtp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      return { success: true, data };
    } catch (err) {
      console.error('api.resetPassword error:', err);
      return { success: false, error: err.message };
    }
  }

  // ========== NOTICES ==========

  async getNotices() {
    try {
      const res = await fetch(`${API_BASE}/notices`);
      if (!res.ok) throw new Error('Failed to fetch notices');
      return await res.json();
    } catch (err) {
      console.error('getNotices error:', err);
      return [];
    }
  }

  async createNotice({ title, description, contact, category, urgency, author, expiryDays, area }) {
    try {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, contact, category, urgency, author, expiryDays, area }),
      });
      if (!res.ok) throw new Error('Failed to create notice');
      return await res.json();
    } catch (err) {
      console.error('createNotice error:', err);
      return null;
    }
  }

  async upvoteNotice(id, nickname) {
    try {
      const res = await fetch(`${API_BASE}/notices/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nickname }),
      });
      if (!res.ok) throw new Error('Failed to upvote');
      return await res.json();
    } catch (err) {
      console.error('upvoteNotice error:', err);
      return null;
    }
  }

  async pinNotice(id) {
    try {
      const res = await fetch(`${API_BASE}/notices/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to pin/unpin');
      return await res.json();
    } catch (err) {
      console.error('pinNotice error:', err);
      return null;
    }
  }

  async deleteNotice(id) {
    try {
      const res = await fetch(`${API_BASE}/notices/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return await res.json();
    } catch (err) {
      console.error('deleteNotice error:', err);
      return null;
    }
  }

  // ========== PROFILE ==========

  async getProfile() {
    try {
      const res = await fetch(`${API_BASE}/profile`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return await res.json();
    } catch (err) {
      console.error('getProfile error:', err);
      return null;
    }
  }

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return await res.json();
    } catch (err) {
      console.error('updateProfile error:', err);
      return null;
    }
  }

  // ========== ACTIVITIES ==========

  async getActivities() {
    try {
      const res = await fetch(`${API_BASE}/activities`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return await res.json();
    } catch (err) {
      console.error('getActivities error:', err);
      return [];
    }
  }

  // ========== UTILITIES ==========

  async triggerArchiveCheck() {
    try {
      const res = await fetch(`${API_BASE}/archive/check`, { method: 'POST' });
      if (!res.ok) throw new Error('Archive check failed');
      return await res.json();
    } catch (err) {
      console.error('archiveCheck error:', err);
      return null;
    }
  }

  async triggerMockAlert(type = 'power') {
    try {
      const res = await fetch(`${API_BASE}/mock/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Mock alert failed');
      return await res.json();
    } catch (err) {
      console.error('mockAlert error:', err);
      return null;
    }
  }

  async resetDatabase() {
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      return await res.json();
    } catch (err) {
      console.error('resetDB error:', err);
      return null;
    }
  }
}

export default new ApiService();
