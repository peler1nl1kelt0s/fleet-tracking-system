import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!duration) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-emerald-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      case 'warning':
        return <Info size={20} className="text-amber-500" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-amber-50';
      case 'info':
      default:
        return 'bg-blue-50';
    }
  };
  
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-200';
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-amber-200';
      case 'info':
      default:
        return 'border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-emerald-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-md shadow-lg flex items-center space-x-3 z-50 transform transition-transform duration-300 ease-out ${getBackgroundColor()} border ${getBorderColor()}`}
      role="alert"
    >
      {getIcon()}
      <p className={`font-medium ${getTextColor()}`}>{message}</p>
      <button onClick={() => setIsVisible(false)} className={`ml-auto ${getTextColor()}/70 hover:${getTextColor()} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded-full`}>
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
