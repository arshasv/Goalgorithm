export function parseApiError(err) {
  if (!err) return 'An unexpected error occurred.';

  if (err.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (Array.isArray(detail)) {
      return detail.map(d => d.msg).join(', ');
    }
    return typeof detail === 'string' ? detail : JSON.stringify(detail);
  }

  if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection.';
  }

  if (err.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return err.message || 'An unexpected error occurred.';
}
