/**
 * Floating Notification Toast for Live Alerts
 * @license Apache-2.0
 */

import React from 'react';
import { Mail, Sparkles, AtSign, X, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationToastProps {
  onNavigateTab: (tab: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ onNavigateTab }) => {
  const { activeToast, dismissToast, markAsRead } = useNotifications();

  if (!activeToast) return null;

  const handleClick = () => {
    markAsRead(activeToast.id);
    if (activeToast.linkTab) {
      onNavigateTab(activeToast.linkTab);
    }
    dismissToast();
  };

  const getIcon = () => {
    switch (activeToast.type) {
      case 'message':
        return <Mail className="w-4 h-4 text-[#5A634E]" />;
      case 'update':
        return <Sparkles className="w-4 h-4 text-[#C27D38]" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-[#8DA47E]" />;
    }
  };

  return (
    <div
      id="notification-live-toast"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#FDFCF9] rounded-3xl border border-[#8DA47E]/40 shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200"
    >
      <div className="w-9 h-9 rounded-2xl bg-[#F3F0E9] border border-[#E8E4DA] flex items-center justify-center shrink-0">
        {activeToast.sender?.avatar ? (
          <span className="text-base">{activeToast.sender.avatar}</span>
        ) : (
          getIcon()
        )}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-[#2D3326] truncate">
            {activeToast.title}
          </span>
          <span className="text-[9px] font-mono text-[#8C857B]">
            {activeToast.timestamp}
          </span>
        </div>
        <p className="text-[11px] text-[#6D7268] line-clamp-2 mt-0.5">
          {activeToast.description}
        </p>

        {activeToast.actionLabel && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#5A634E] hover:underline">
            <span>{activeToast.actionLabel}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        )}
      </div>

      <button
        onClick={dismissToast}
        className="text-[#8C857B] hover:text-[#2D3326] p-1 rounded-lg hover:bg-[#F3F0E9] transition-all"
        title="Dismiss alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
