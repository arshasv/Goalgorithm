import { parseApiError } from '../../utils/apiErrorHandler';

describe('parseApiError', () => {
  it('returns default for null/undefined', () => {
    expect(parseApiError(null)).toBe('An unexpected error occurred.');
    expect(parseApiError(undefined)).toBe('An unexpected error occurred.');
  });

  it('parses response detail string', () => {
    const err = { response: { data: { detail: 'Invalid credentials' } } };
    expect(parseApiError(err)).toBe('Invalid credentials');
  });

  it('parses response detail array', () => {
    const err = {
      response: {
        data: {
          detail: [{ msg: 'Field required' }, { msg: 'Invalid value' }],
        },
      },
    };
    expect(parseApiError(err)).toBe('Field required, Invalid value');
  });

  it('handles network error', () => {
    const err = { message: 'Network Error' };
    expect(parseApiError(err)).toContain('Network error');
  });

  it('handles server error', () => {
    const err = { response: { status: 500 } };
    expect(parseApiError(err)).toContain('Server error');
  });

  it('falls back to error message', () => {
    const err = { message: 'Something broke' };
    expect(parseApiError(err)).toBe('Something broke');
  });
});
