
import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastConfig = {
  success: {
    bg: 'bg-green-600',
    icon: 'fas fa-check-circle',
  },
  error: {
    bg: 'bg-red-600',
    icon: 'fas fa-times-circle',
  },
  warning: {
    bg: 'bg-yellow-500',
    icon: 'fas fa-exclamation-triangle',
  },
  info: {
    bg: 'bg-blue-600',
    icon: 'fas fa-info-circle',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const { bg, icon } = toastConfig[type];

  return (
    <div
      className={`flex items-center p-4 rounded-lg shadow-lg text-white transition-all duration-300 ease-in-out transform ${bg} ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <i className={`${icon} mr-3 text-xl`}></i>
      <span className="flex-grow text-sm font-medium">{message}</span>
      <button onClick={handleClose} className="ml-4 p-1 rounded-full hover:bg-black/20 focus:outline-none">
        <i className="fas fa-times text-sm"></i>
      </button>
    </div>
  );
};

export default Toast;
