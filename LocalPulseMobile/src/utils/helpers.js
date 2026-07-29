// Utility helpers for date formatting and category styling

export function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getExpiresLabel(dateStr) {
  const now = new Date();
  const expiry = new Date(dateStr);
  const diffMs = expiry - now;

  if (diffMs <= 0) return 'Expired';
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return 'Expiring soon';
  if (diffHours < 24) return `${diffHours}h left`;
  return `${diffDays}d left`;
}

export function getCategoryEmoji(category) {
  const map = {
    power: '⚡',
    water: '💧',
    event: '🎉',
    lost: '🔍',
    jobs: '💼',
    general: '📋',
    emergency: '🚨',
    security: '🛡️',
  };
  return map[category] || '📋';
}

export function getUrgencyColor(urgency) {
  const map = {
    urgent: '#ef4444',
    important: '#f59e0b',
    normal: '#10b981',
  };
  return map[urgency] || '#64748b';
}

// Hardcoded users (same as web app)
export const USERS = [
  {
    username: 'resident',
    password: '1234',
    name: 'Rahul Kumar',
    block: 'Block A',
    colony: 'Anna Nagar Colony',
    room: 'A-203',
    role: 'Resident',
  },
  {
    username: 'admin',
    password: '123',
    name: 'Admin',
    block: 'Office',
    colony: 'Anna Nagar Colony',
    room: 'Admin',
    role: 'Admin',
  },
];
