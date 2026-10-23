import Swal from 'sweetalert2'

// Custom themed sweetalert helpers
export const notify = {
  success: (title, text = '') => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl font-sans',
        confirmButton: 'px-5 py-2 rounded-xl font-bold text-sm shadow-xs',
      },
    })
  },

  error: (title, text = '') => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Mengerti',
      customClass: {
        popup: 'rounded-2xl font-sans',
        confirmButton: 'px-5 py-2 rounded-xl font-bold text-sm shadow-xs',
      },
    })
  },

  warning: (title, text = '') => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Baik',
      customClass: {
        popup: 'rounded-2xl font-sans',
        confirmButton: 'px-5 py-2 rounded-xl font-bold text-sm shadow-xs',
      },
    })
  },

  confirm: async ({ title, text = '', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', icon = 'warning', confirmColor = '#4f46e5' }) => {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#64748b',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl font-sans',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs',
        cancelButton: 'px-4 py-2.5 rounded-xl font-bold text-sm',
      },
    })
    return result.isConfirmed
  },

  toast: (title, icon = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer
        toast.onmouseleave = Swal.resumeTimer
      },
    })
    Toast.fire({
      icon,
      title,
    })
  },
}

export default Swal
