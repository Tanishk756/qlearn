/**
 * Q-Learn Nexus - Sidebar Navigation Component
 * Natural Tones aesthetic navigation drawer with active states and tooltips.
 * @license Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Globe2,
  Code2,
  Sparkles,
  BookOpen,
  Trophy,
  BrainCircuit,
  FolderKanban,
  Activity,
  Sliders,
  User,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AVATAR_PRESETS } from '../../data/themes';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate }) => {
  const { currentUser, theme } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lab', label: 'Quantum Circuit Lab', icon: Layers },
    { id: 'visualizer', label: 'Bloch Sphere & Phasors', icon: Globe2 },
    { id: 'codelab', label: 'Code Synchronizer', icon: Code2 },
    { id: 'algorithms', label: 'Algorithm Suite', icon: Sparkles },
    { id: 'concepts', label: 'Interactive Micro-Labs', icon: Sliders },
    { id: 'courses', label: 'Interactive Curriculum', icon: BookOpen },
    { id: 'challenges', label: 'Circuit Challenges', icon: Trophy },
    { id: 'tutor', label: 'Q-Nova AI Tutor', icon: BrainCircuit },
    { id: 'projects', label: 'Saved Workspaces', icon: FolderKanban },
    { id: 'analytics', label: 'Diagnostics & Suite', icon: Activity },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  const renderAvatarEmoji = () => {
    if (!currentUser) return 'Ψ';
    if (currentUser.avatarPreset) {
      const p = AVATAR_PRESETS.find((preset) => preset.id === currentUser.avatarPreset);
      if (p) return p.emoji;
    }
    return currentUser.name.charAt(0);
  };

  return (
    <aside className="w-64 bg-[#FDFCF9] border-r border-[#E8E4DA] p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      {/* Navigation Links */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] px-3 py-2 block">
          Quantum Platform
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#5A634E] text-[#F3F0E9] shadow-xs font-semibold'
                  : 'text-[#6D7268] hover:text-[#2D3326] hover:bg-[#F3F0E9]'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8DA47E]' : 'text-[#8C857B]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.id === 'profile' && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#C27D38] text-white text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile / Quick Info */}
      <div className="pt-4 border-t border-[#E8E4DA] space-y-2">
        {currentUser && (
          <div
            onClick={() => onNavigate('profile')}
            className="p-2.5 bg-[#F3F0E9] hover:bg-[#EAE7E0] rounded-2xl border border-[#E8E4DA] flex items-center gap-2.5 cursor-pointer transition-all"
            title="Open Profile Settings"
          >
            <div className="w-8 h-8 rounded-xl bg-[#5A634E] text-[#F3F0E9] flex items-center justify-center text-xs font-bold shrink-0">
              {renderAvatarEmoji()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-[#2D3326] block truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#8C857B] block truncate capitalize">
                Theme: {theme}
              </span>
            </div>
          </div>
        )}

        <div className="p-2.5 bg-[#F3F0E9]/60 rounded-2xl border border-[#E8E4DA] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#8DA47E]" />
            <span className="text-[11px] font-medium text-[#5A634E]">Sim Engine Ready</span>
          </div>
          <span className="text-[10px] font-mono text-[#8C857B]">v2.4.1</span>
        </div>
      </div>
    </aside>
  );
};

