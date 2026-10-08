'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type DialogType = 'confirm' | 'success' | 'error' | 'warning' | 'info';

type DialogState = {
  open: boolean;
  type: DialogType;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  resolve?: (value: boolean) => void;
};

type DialogContextValue = {
  confirm: (options: { title: string; message: string; confirmText?: string; cancelText?: string; type?: DialogType }) => Promise<boolean>;
  alert: (options: { title: string; message: string; type?: Exclude<DialogType, 'confirm'>; buttonText?: string }) => Promise<void>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const value = useContext(DialogContext);
  if (!value) throw new Error('useDialog harus digunakan di dalam DialogProvider.');
  return value;
}

const initialState: DialogState = {
  open: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: 'Mengerti',
  cancelText: 'Batal',
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(initialState);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialog(initialState);
    resolver?.(result);
  }, []);

  const confirm = useCallback((options: { title: string; message: string; confirmText?: string; cancelText?: string; type?: DialogType }) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        open: true,
        type: options.type || 'warning',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Ya, lanjutkan',
        cancelText: options.cancelText || 'Batal',
      });
    });
  }, []);

  const alert = useCallback((options: { title: string; message: string; type?: Exclude<DialogType, 'confirm'>; buttonText?: string }) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
      setDialog({
        open: true,
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        confirmText: options.buttonText || 'Mengerti',
        cancelText: 'Batal',
      });
    });
  }, []);

  useEffect(() => {
    if (!dialog.open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog.open, close]);

  const icons = {
    success: <CheckCircle2 className="sk-dialog-icon sk-dialog-icon-success" />,
    error: <XCircle className="sk-dialog-icon sk-dialog-icon-error" />,
    warning: <AlertTriangle className="sk-dialog-icon sk-dialog-icon-warning" />,
    info: <Info className="sk-dialog-icon sk-dialog-icon-info" />,
    confirm: <AlertTriangle className="sk-dialog-icon sk-dialog-icon-warning" />,
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog.open && (
        <div className="sk-dialog-backdrop" role="presentation" onMouseDown={() => dialog.type !== 'confirm' && close(false)}>
          <div
            className="sk-dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sk-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="sk-dialog-close" type="button" aria-label="Tutup" onClick={() => close(false)}>
              <X className="h-4 w-4" />
            </button>

            <div className="sk-dialog-icon-wrap">{icons[dialog.type]}</div>
            <h2 id="sk-dialog-title" className="sk-dialog-title">{dialog.title}</h2>
            <p className="sk-dialog-message">{dialog.message}</p>

            <div className="sk-dialog-actions">
              {dialog.type === 'confirm' && (
                <button type="button" className="sk-dialog-btn sk-dialog-btn-secondary" onClick={() => close(false)}>
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                autoFocus
                className={`sk-dialog-btn ${dialog.type === 'confirm' ? 'sk-dialog-btn-danger' : 'sk-dialog-btn-primary'}`}
                onClick={() => close(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
