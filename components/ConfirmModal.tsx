"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Hapus",
  cancelText = "Batal",
  isDanger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center text-center animate-scaleUp">
        {/* Warning Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isDanger ? "bg-red-50 dark:bg-red-950/20 text-red-500" : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500"
        }`}>
          {isDanger ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        {/* Title & Message */}
        <h3 className="text-base font-bold text-[#1a1a2e] dark:text-white mb-2">{title}</h3>
        <p className="text-xs text-[#9ca3af] px-2 mb-6">{message}</p>

        {/* Action Buttons */}
        <div className="flex gap-2.5 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-[#e5e7eb] dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
              isDanger 
                ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/10" 
                : "bg-[#6366f1] hover:bg-[#4f46e5] shadow-md shadow-indigo-500/10"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
