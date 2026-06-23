import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  fmt1,
  capitalize,
  scoreColor,
  scoreColorStyle,
  formatTeamDisplay,
  formatDate,
  formatTime,
} from '../../utils/helpers';

describe('fmt1', () => {
  it('formats numbers to one decimal', () => {
    expect(fmt1(5)).toBe('5.0');
    expect(fmt1(5.55)).toBe('5.5');
    expect(fmt1(0)).toBe('0.0');
  });

  it('handles null and undefined', () => {
    expect(fmt1(null)).toBe('0.0');
    expect(fmt1(undefined)).toBe('0.0');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('handles empty and falsy', () => {
    expect(capitalize('')).toBe('—');
    expect(capitalize(null)).toBe('—');
    expect(capitalize(undefined)).toBe('—');
  });
});

describe('scoreColor', () => {
  it('returns error color for zero', () => {
    expect(scoreColor(0, 10)).toContain('color-status-error');
  });

  it('returns success color for max', () => {
    expect(scoreColor(10, 10)).toContain('color-status-success');
  });

  it('returns empty for in-between', () => {
    expect(scoreColor(5, 10)).toBe('');
  });
});

describe('scoreColorStyle', () => {
  it('returns error style for zero', () => {
    const style = scoreColorStyle(0, 10);
    expect(style.color).toContain('error');
  });

  it('returns success style for max', () => {
    const style = scoreColorStyle(10, 10);
    expect(style.color).toContain('success');
  });

  it('returns empty for in-between', () => {
    expect(scoreColorStyle(5, 10)).toEqual({});
  });
});

describe('formatTeamDisplay', () => {
  it('formats team with code and name', () => {
    expect(formatTeamDisplay({ team_code: 'A', name: 'Alpha' })).toBe('A – Alpha');
  });

  it('formats team with team_id and team_name', () => {
    expect(formatTeamDisplay({ team_id: 'B', team_name: 'Beta' })).toBe('B – Beta');
  });

  it('returns name only if no code', () => {
    expect(formatTeamDisplay({ name: 'Charlie' })).toBe('Charlie');
  });

  it('returns em dash for null', () => {
    expect(formatTeamDisplay(null)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats valid date string', () => {
    const result = formatDate('2026-06-17T18:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns question mark for null', () => {
    expect(formatDate(null)).toBe('?');
  });
});

describe('formatTime', () => {
  it('formats valid date string', () => {
    const result = formatTime('2026-06-17T18:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns empty for null', () => {
    expect(formatTime(null)).toBe('');
  });
});
