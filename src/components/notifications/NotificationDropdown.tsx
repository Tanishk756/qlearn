/**
 * Notification Center Dropdown
 * Alerts users to new messages, important updates, and mentions with category filtering.
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Sparkles,
  AtSign,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  X,
  Plus,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification, NotificationFilter, NotificationType } from '../../types/notifications';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    triggerSimulatedAlert,
  } = useNotifications();

  const [filter, setFilter] = useState<NotificationFilter>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.linkTab) {
      onNavigateTab(item.linkTab);
      onClose();
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <Mail className="w-3.5 h-3.5 text-[#5A634E]" />;
      case 'update':
        return <Sparkles className="w-3.5 h-3.5 text-[#C27D38]" />;
      case 'mention':
        return <AtSign className="w-3.5 h-3.5 text-[#8DA47E]" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return (
          <span className="px-1.5 py-0.5 rounded-md bg-[#5A634E]/10 text-[#5A634E] text-[10px] font-medium">
            Message
          </span>
        );
      case 'update':
        return (
          <span className="px-1.5 py-0.5 rounded-md bg-[#C27D38]/15 text-[#C27D38] text-[10px] font-medium">
            Update
          </span>
        );
      case 'mention':
        return (
          <span className="px-1.5 py-0.5 rounded-md bg-[#8DA47E]/20 text-[#5A634E] text-[10px] font-medium">
            Mention
          </span>
        );
    }
  };

  return (
    <div
      id="notification-dropdown-panel"
      className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[#FDFCF9] rounded-3xl border border-[#E8E4DA] shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#E8E4DA] bg-[#F3F0E9]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#5A634E] text-white flex items-center justify-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#2D3326]">
              Notifications
            </h4>
            <span className="text-[10px] text-[#6D7268]">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts caught up'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 rounded-xl text-[#5A634E] hover:bg-[#E8E4DA] text-xs transition-all flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1.5 rounded-xl text-[#8C857B] hover:text-red-600 hover:bg-[#E8E4DA] transition-all"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8C857B] hover:text-[#2D3326] hover:bg-[#E8E4DA] transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-2 border-b border-[#E8E4DA] bg-[#F3F0E9]/30 flex items-center gap-1 overflow-x-auto">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'message', label: 'Messages' },
            { id: 'update', label: 'Updates' },
            { id: 'mention', label: 'Mentions' },
          ] as const
        ).map((tab) => {
          const count =
            tab.id === 'all'
              ? notifications.length
              : notifications.filter((n) => n.type === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                filter === tab.id
                  ? 'bg-[#5A634E] text-[#F3F0E9] shadow-2xs font-semibold'
                  : 'text-[#6D7268] hover:bg-[#E8E4DA] hover:text-[#2D3326]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1 rounded-full ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-[#E8E4DA] text-[#6D7268]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E4DA]/60">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell className="w-8 h-8 text-[#8DA47E]/40 mx-auto" />
            <p className="text-xs font-medium text-[#6D7268]">
              No {filter !== 'all' ? filter : ''} notifications right now.
            </p>
            <div className="pt-2 flex justify-center gap-1.5">
              <button
                onClick={() => triggerSimulatedAlert(filter === 'all' ? 'message' : filter)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F3F0E9] hover:bg-[#E8E4DA] text-[#5A634E] font-medium transition-all"
              >
                Simulate Test Alert
              </button>
            </div>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3.5 transition-all cursor-pointer group flex items-start gap-3 hover:bg-[#F3F0E9]/70 ${
                !item.read ? 'bg-[#F3F0E9]/40 font-medium' : 'bg-transparent opacity-90'
              }`}
            >
              {/* Icon / Sender Avatar */}
              <div className="relative shrink-0 mt-0.5">
                {item.sender?.avatar ? (
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E4DA] flex items-center justify-center text-sm shadow-2xs">
                    {item.sender.avatar}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E4DA] flex items-center justify-center shadow-2xs">
                    {getIconForType(item.type)}
                  </div>
                )}
                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-[#8DA47E] ring-2 ring-white absolute -top-0.5 -right-0.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {getTypeBadge(item.type)}
                    <span className="text-xs font-semibold text-[#2D3326] truncate">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8C857B] shrink-0 font-mono">
                    {item.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-[#6D7268] leading-tight line-clamp-2">
                  {item.description}
                </p>

                {item.actionLabel && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11px] text-[#5A634E] font-semibold flex items-center gap-1 group-hover:underline">
                      <span>{item.actionLabel}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions (Delete / Read) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#8C857B] hover:text-red-600 transition-all rounded-md"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer: Quick Simulated Alert Generator */}
      <div className="p-3 bg-[#F3F0E9] border-t border-[#E8E4DA] flex items-center justify-between text-xs text-[#6D7268]">
        <span className="text-[10px] font-mono">Real-time alerts active</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => triggerSimulatedAlert('mention')}
            className="text-[10px] text-[#5A634E] hover:underline font-medium"
          >
            + Test Mention
          </button>
          <span>•</span>
          <button
            onClick={() => triggerSimulatedAlert('update')}
            className="text-[10px] text-[#5A634E] hover:underline font-medium"
          >
            + Test Update
          </button>
        </div>
      </div>
    </div>
  );
};
