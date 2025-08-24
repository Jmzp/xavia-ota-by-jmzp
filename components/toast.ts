import { toast } from 'react-hot-toast';

export function showToast(message: string, type: 'success' | 'error') {
  if (type === 'success') {
    toast.success(message, {
      duration: 5000,
      position: 'bottom-center',
    });
  } else {
    toast.error(message, {
      duration: 5000,
      position: 'bottom-center',
    });
  }
}
