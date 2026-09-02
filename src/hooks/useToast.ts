import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * トーストメッセージの型定義
 */
export interface ToastMessage {
  /** 表示メッセージ本文 */
  message: string;
  /** メッセージ種別（成功・エラー・情報） */
  type: 'success' | 'error' | 'info';
}

/**
 * トースト通知管理カスタムフック
 *
 * トーストの表示およびタイマーによる自動消去・クリーンアップを管理します。
 */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * トースト通知を表示（3.5秒後に自動消去）
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast({ message, type });
    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
      timerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    toast,
    setToast,
    showToast,
  };
}

export default useToast;
