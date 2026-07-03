export const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  // Close button functionality
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.onclick = () => {
    toast.style.animation = 'slideOutRight 0.3s forwards';
    setTimeout(() => {
      if (toast.parentNode) container.removeChild(toast);
    }, 300);
  };

  container.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutRight 0.3s forwards';
      setTimeout(() => {
        if (toast.parentNode) container.removeChild(toast);
      }, 300);
    }
  }, 3000);
};
