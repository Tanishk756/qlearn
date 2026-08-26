/**
 * Q-Learn Nexus - Top Navigation Header
 * Natural Tones aesthetic with quick mode toggles, notifications bell, profile customization, and auth triggers.
 * @license Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Bell,
  User,
  Palette,
  LogOut,
  LogIn,
  ChevronDown,
  UserPlus,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { AuthModal } from '../auth/AuthModal';
import { ProfileModal } from '../profile/ProfileModal';
import { AVATAR_PRESETS } from '../../data/themes';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onQuickSimulate: () => void;
  qubitCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onQuickSimulate,
  qubitCount,
}) => {
  const { currentUser, isAuthenticated, logout, loginDemoUser } = useAuth();
  const { unreadCount } = useNotifications();

  // Menus & Modals state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderNavAvatar = () => {
    if (!currentUser) {
      return (
        <div className="w-7 h-7 rounded-xl bg-[#E8E4DA] text-[#6D7268] flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      );
    }
    if (currentUser.avatarUrl) {
      return (
        <img
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          className="w-7 h-7 rounded-xl object-cover border border-[#8DA47E]"
        />
      );
    }
    const preset = AVATAR_PRESETS.find((p) => p.id === currentUser.avatarPreset);
    if (preset) {
      return (
        <div
          className={`w-7 h-7 rounded-xl ${preset.bgColor} text-white flex items-center justify-center text-xs font-bold`}
        >
          {preset.emoji}
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-xl bg-[#5A634E] text-[#F3F0E9] flex items-center justify-center font-serif text-xs font-bold">
        {currentUser.name.charAt(0)}
      </div>
    );
  };

  return (
    <header className="h-16 bg-[#FDFCF9]/90 backdrop-blur-md border-b border-[#E8E4DA] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigate('dashboard')}
          className="cursor-pointer flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#5A634E] text-[#F3F0E9] flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:bg-[#474F3E] transition-all">
            Ψ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-lg font-bold text-[#2D3326] tracking-tight">
                Q-Learn
              </span>
              <span className="font-serif text-lg italic text-[#8DA47E]">Nexus</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-[#8C857B] block -mt-1 font-mono">
              Quantum Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Center Search / Telemetry Pill */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#F3F0E9] px-3.5 py-1.5 rounded-full border border-[#E8E4DA] text-xs text-[#6D7268]">
          <span className="w-2 h-2 rounded-full bg-[#8DA47E] animate-pulse" />
          <span className="font-mono text-[11px] text-[#5A634E]">
            Engine: <strong>Sim-Vector2ⁿ</strong> ({qubitCount}Q Hilbert Space)
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Simulator Run */}
        <button
          id="nav-quick-run-btn"
          onClick={onQuickSimulate}
          className="px-3.5 py-1.5 bg-[#8DA47E] hover:bg-[#7B926C] text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Run Circuit</span>
        </button>

        {/* AI Tutor Shortcut */}
        <button
          id="nav-ai-tutor-btn"
          onClick={() => onNavigate('tutor')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tutor'
              ? 'bg-[#5A634E] text-white border-[#5A634E] shadow-xs'
              : 'bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] border-[#E8E4DA]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#8DA47E]" />
          <span className="hidden sm:inline">Q-Nova AI</span>
        </button>

        {/* Notifications Dropdown Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            id="nav-notification-btn"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2 rounded-full border transition-all relative cursor-pointer ${
              isNotifOpen
                ? 'bg-[#5A634E] text-white border-[#5A634E]'
                : 'bg-[#F3F0E9] hover:bg-[#EAE7E0] text-[#5A634E] border-[#E8E4DA]'
            }`}
            title="Notifications (Messages, Updates, Mentions)"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C27D38] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#FDFCF9]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Menu Component */}
          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onNavigateTab={onNavigate}
          />
        </div>

        {/* User Account / Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          {isAuthenticated && currentUser ? (
            <button
              id="nav-user-profile-menu-btn"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-[#F3F0E9] hover:bg-[#EAE7E0] border border-[#E8E4DA] rounded-full transition-all cursor-pointer"
            >
              {renderNavAvatar()}
              <span className="text-xs font-semibold text-[#2D3326] hidden lg:inline max-w-[100px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8C857B]" />
            </button>
          ) : (
            <button
              id="nav-signin-btn"
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#5A634E] hover:bg-[#474F3E] text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* User Popover Menu */}
          {isUserMenuOpen && isAuthenticated && currentUser && (
            <div className="absolute right-0 mt-2 w-64 bg-[#FDFCF9] rounded-3xl border border-[#E8E4DA] shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              {/* User Bio preview in menu */}
              <div className="p-3 bg-[#F3F0E9]/70 rounded-2xl border border-[#E8E4DA]/60 space-y-1">
                <span className="text-xs font-bold text-[#2D3326] block truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-[#6D7268] block truncate font-mono">
                  {currentUser.email}
                </span>
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#8DA47E]/20 text-[#5A634E] text-[9px] font-semibold">
                  {currentUser.quantumLevel}
                </span>
              </div>

              {/* Menu items */}
              <button
                id="user-menu-profile-view"
                onClick={() => {
                  onNavigate('profile');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#2D3326] hover:bg-[#F3F0E9] transition-all cursor-pointer font-medium"
              >
                <User className="w-4 h-4 text-[#8DA47E]" />
                <span>Quantum Profile View</span>
              </button>

              <button
                id="user-menu-theme-customize"
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#2D3326] hover:bg-[#F3F0E9] transition-all cursor-pointer font-medium"
              >
                <Palette className="w-4 h-4 text-[#C27D38]" />
                <span>Theme & Avatar Settings</span>
              </button>

              <button
                id="user-menu-notification-view"
                onClick={() => {
                  setIsNotifOpen(true);
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#2D3326] hover:bg-[#F3F0E9] transition-all cursor-pointer font-medium"
              >
                <Bell className="w-4 h-4 text-[#5A634E]" />
                <span>Notification Center</span>
              </button>

              <div className="pt-1 border-t border-[#E8E4DA]">
                <button
                  id="user-menu-logout-btn"
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-all cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Global Profile & Theme Customization Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};

