import React from 'react';

export const fmt1 = (val) => (val != null ? Number(val).toFixed(1) : '0.0');

export const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

export const rankBadge = (rank) => {
  const r = Number(rank);
  if (r === 1) return React.createElement('span', { className: 'rank-badge rank-badge-1', key: 'rank1' }, '🏆');
  if (r === 2) return React.createElement('span', { className: 'rank-badge rank-badge-2', key: 'rank2' }, '🥈');
  if (r === 3) return React.createElement('span', { className: 'rank-badge rank-badge-3', key: 'rank3' }, '🥉');
  return React.createElement('span', { className: 'rank-badge rank-badge-n', key: 'rankn' }, `#${rank}`);
};

export const scoreColor = (val, max) => {
  if (val === 0) return 'color:var(--color-status-error)';
  if (val >= max) return 'color:var(--color-status-success)';
  return '';
};

export const scoreColorStyle = (val, max) => {
  if (val === 0) return { color: 'var(--color-status-error)' };
  if (val >= max) return { color: 'var(--color-status-success)' };
  return {};
};

export const matchStatusBadge = (status) => {
  const s = (status || 'scheduled').toLowerCase();
  switch (s) {
    case 'completed':
    case 'scored':
    case 'result_entered':
      return React.createElement('span', { className: 'badge badge-success', key: 'status' }, 'COMPLETED');
    case 'frozen':
      return React.createElement('span', { className: 'badge badge-error', key: 'status' }, 'FROZEN');
    case 'scheduled':
      return React.createElement('span', { className: 'badge badge-warning', key: 'status' }, 'SCHEDULED');
    case 'awaiting_result':
    case 'awaiting result':
      return React.createElement('span', { className: 'badge badge-info', key: 'status' }, 'AWAITING RESULT');
    default:
      return React.createElement('span', { className: 'badge badge-info', key: 'status' }, s.replace('_', ' ').toUpperCase());
  }
};

export const predStatusBadge = (status) => {
  const map = {
    'PENDING_VALIDATION': 'badge-warning',
    'VALIDATED': 'badge-success',
    'INVALID': 'badge-error',
    'LATE': 'badge-info',
  };
  const label = status ? status.replace('_', ' ') : 'unknown';
  return React.createElement('span', { className: `badge ${map[status] || 'badge-info'}`, key: 'pstatus' }, label);
};

export const teamBadge = (name, size) => {
  const initial = (name || '?').charAt(0).toUpperCase();
  return React.createElement('div', {
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--radius-round)',
      background: 'var(--color-surface-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.45),
      fontWeight: 700,
      color: 'var(--color-text-primary)',
    }
  }, initial);
};

export function formatTeamDisplay(team) {
  if (!team) return '—';
  const code = team.team_code || team.team_id || team.code || '';
  const name = team.team_name || team.name || '';
  if (code) return `${code} – ${name}`;
  return name || '—';
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '?';
  try { return new Date(dateStr).toLocaleDateString(); } catch { return '?'; }
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
};
