import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastMessage } from '../contexts/ToastContext';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center w-80 max-w-sm p-4 rounded-xl shadow-lg border animate-slide-in
            ${toast.type === 'success' ? 'bg-white border-green-100' : 
              toast.type === 'error' ? 'bg-white border-red-100' : 
              'bg-white border-blue-100'}
          `}
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${
               toast.type === 'success' ? 'text-green-800' : 
               toast.type === 'error' ? 'text-red-800' : 
               'text-blue-800'
            }`}>
              {toast.message}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => removeToast(toast.id)}
              className="inline-flex text-stone-400 hover:text-stone-600 focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;