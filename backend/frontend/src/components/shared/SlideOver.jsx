import React from 'react';
import { X } from 'lucide-react';

const SlideOver = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 animate-in slide-in-from-right duration-300">
        <div className="w-screen max-w-md transform transition-all ease-in-out">
          <div className="flex h-full flex-col bg-white shadow-2xl">
            <div className="px-5 py-5 sm:px-6 bg-slate-50 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex-1 p-6 overflow-y-auto bg-white">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideOver;
