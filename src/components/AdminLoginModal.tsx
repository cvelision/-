import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { ADMIN_ACCESS_CODE } from '../firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCodeInput('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = codeInput.trim();
    if (trimmed !== ADMIN_ACCESS_CODE) {
      setError('Админ эрхийн код буруу байна.');
      return;
    }
    onSuccess(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-[#0b101b] border border-slate-800 rounded-xl p-5 shadow-2xl z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#c8ba96]" />
            <h3 className="font-cinzel text-base font-bold text-slate-100">
              Админ эрхээр нэвтрэх
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Бараа нэмэх, засахын тулд админ эрхийн кодоо оруулна уу. Оруулсан бараа бүх хэрэглэгчид шууд хадгалагдана.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Админ код:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setError(null);
                }}
                placeholder="Кодоо оруулна уу..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-[#060911] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-[#2d181c] border border-[#5e343c] text-xs text-[#dfb3ba]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 cursor-pointer"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#8f805d] hover:bg-[#a1916c] text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Нэвтрэх</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
