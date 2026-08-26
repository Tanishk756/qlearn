/**
 * Dedicated Profile & Quantum Identity View
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Palette,
  Bell,
  Award,
  Sparkles,
  BookOpen,
  Trophy,
  Activity,
  Layers,
  Check,
  Upload,
  Calendar,
  Building,
  Mail,
  ShieldCheck,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { THEME_OPTIONS, AVATAR_PRESETS } from '../../data/themes';
import { ProfileModal } from './ProfileModal';

interface ProfileViewProps {
  onNavigateTab: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateTab }) => {
  const { currentUser, theme, setTheme } = useAuth();
  const { triggerSimulatedAlert } = useNotifications();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E4DA] space-y-4">
        <User className="w-12 h-12 text-[#8DA47E] mx-auto" />
        <h3 className="font-serif text-xl font-bold text-[#2D3326]">
          No Quantum Profile Loaded
        </h3>
        <p className="text-xs text-[#6D7268]">
          Sign in or create a quantum developer profile to track learning milestones and customize themes.
        </p>
      </div>
    );
  }

  const renderAvatar = () => {
    if (currentUser.avatarUrl) {
      return (
        <img
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-md"
        />
      );
    }
    const preset = AVATAR_PRESETS.find((p) => p.id === currentUser.avatarPreset);
    if (preset) {
      return (
        <div
          className={`w-24 h-24 rounded-3xl ${preset.bgColor} text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md`}
        >
          {preset.emoji}
        </div>
      );
    }
    return (
      <div className="w-24 h-24 rounded-3xl bg-[#5A634E] text-white flex items-center justify-center font-serif text-4xl font-bold border-4 border-white shadow-md">
        {currentUser.name.charAt(0)}
      </div>
    );
  };

  return (
    <div id="profile-view-container" className="space-y-8 max-w-5xl mx-auto">
      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden bg-linear-to-b from-[#F3F0E9] to-white rounded-3xl border border-[#E8E4DA] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="shrink-0 relative group">
            {renderAvatar()}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-[#5A634E] text-white hover:bg-[#474F3E] transition-all shadow-xs"
              title="Edit Profile Picture"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D3326]">
                    {currentUser.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#8DA47E]/20 text-[#5A634E] text-[11px] font-semibold">
                    {currentUser.quantumLevel}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#8C857B]">
                  @{currentUser.username} • {currentUser.email}
                </span>
              </div>

              <button
                id="profile-hero-edit-btn"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-[#5A634E] hover:bg-[#474F3E] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Customize Profile & Theme</span>
              </button>
            </div>

            {/* Bio */}
            <p className="text-xs text-[#5A634E] max-w-2xl leading-relaxed">
              {currentUser.bio}
            </p>

            {/* Badges and Affiliation info pill row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-[#6D7268]">
              {currentUser.affiliation && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[#8DA47E]" />
                  <span>{currentUser.affiliation}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#8DA47E]" />
                <span>Joined {currentUser.joinedDate}</span>
              </span>
              <span className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-[#8DA47E]" />
                <span className="capitalize">Theme: {theme}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-[#E8E4DA] shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block">
            Qubit Mastery Points
          </span>
          <span className="font-serif text-3xl font-bold text-[#2D3326]">
            {currentUser.stats.qubitMasteryPoints}
          </span>
          <span className="text-[10px] text-[#8DA47E] font-medium block">
            Rank: Top 8%
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E8E4DA] shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block">
            Lessons Completed
          </span>
          <span className="font-serif text-3xl font-bold text-[#5A634E]">
            {currentUser.stats.completedLessons}
          </span>
          <span className="text-[10px] text-[#8C857B] block">
            Core Curriculum
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E8E4DA] shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block">
            Challenges Solved
          </span>
          <span className="font-serif text-3xl font-bold text-[#8DA47E]">
            {currentUser.stats.completedChallenges}
          </span>
          <span className="text-[10px] text-[#8C857B] block">
            State Synthesis
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-[#E8E4DA] shadow-2xs text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block">
            Simulations Executed
          </span>
          <span className="font-serif text-3xl font-bold text-[#2D3326]">
            {currentUser.stats.circuitsRun}
          </span>
          <span className="text-[10px] text-[#8C857B] block">
            2ⁿ Statevectors
          </span>
        </div>
      </div>

      {/* Two Column Section: Quick Theme Switcher & Quantum Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Themes Switcher (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E8E4DA] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D3326] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#8DA47E]" />
                <span>Workspace Themes</span>
              </h3>
              <p className="text-xs text-[#6D7268]">
                Select from custom-tuned color schemes that adapt across all quantum visualizers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEME_OPTIONS.map((t) => {
              const isSelected = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#5A634E] bg-[#5A634E]/5 ring-1 ring-[#5A634E]'
                      : 'border-[#E8E4DA] bg-white hover:bg-[#F3F0E9]/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#2D3326]">{t.name}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#5A634E]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#6D7268] line-clamp-2">
                      {t.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#E8E4DA]">
                    <span
                      className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.previewBg }}
                    />
                    <span
                      className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.previewPrimary }}
                    />
                    <span
                      className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.previewAccent }}
                    />
                    <span
                      className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.previewText }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Live Notification Alerts */}
          <div className="mt-6 pt-5 border-t border-[#E8E4DA] space-y-2">
            <span className="text-xs font-bold text-[#5A634E] uppercase tracking-wider block">
              Simulate Live Notification Alerts
            </span>
            <p className="text-[11px] text-[#6D7268]">
              Test incoming real-time alerts for study group messages, platform updates, and community mentions:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => triggerSimulatedAlert('message')}
                className="px-3 py-1.5 bg-[#F3F0E9] hover:bg-[#EAE7E0] border border-[#E8E4DA] rounded-xl text-xs font-medium text-[#5A634E] flex items-center gap-1.5 transition-all"
              >
                <Mail className="w-3 h-3 text-[#8DA47E]" />
                <span>Simulate New Message</span>
              </button>

              <button
                onClick={() => triggerSimulatedAlert('update')}
                className="px-3 py-1.5 bg-[#F3F0E9] hover:bg-[#EAE7E0] border border-[#E8E4DA] rounded-xl text-xs font-medium text-[#5A634E] flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3 h-3 text-[#C27D38]" />
                <span>Simulate Important Update</span>
              </button>

              <button
                onClick={() => triggerSimulatedAlert('mention')}
                className="px-3 py-1.5 bg-[#F3F0E9] hover:bg-[#EAE7E0] border border-[#E8E4DA] rounded-xl text-xs font-medium text-[#5A634E] flex items-center gap-1.5 transition-all"
              >
                <Bell className="w-3 h-3 text-[#8DA47E]" />
                <span>Simulate @Mention</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Badges & Achievements (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E8E4DA] space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2D3326] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#8DA47E]" />
            <span>Quantum Achievements</span>
          </h3>

          <div className="space-y-3">
            {currentUser.badges.map((badge) => (
              <div
                key={badge.id}
                className="p-3 bg-[#F3F0E9]/60 rounded-2xl border border-[#E8E4DA] flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-white text-xl flex items-center justify-center shrink-0 border border-[#E8E4DA] shadow-2xs">
                  {badge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D3326] truncate">
                      {badge.name}
                    </span>
                    <span className="text-[10px] text-[#8C857B]">
                      {badge.unlockedAt}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6D7268] mt-0.5">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E8E4DA] flex justify-between items-center text-xs text-[#6D7268]">
            <span>Next Milestone: <strong>Grover Oracle Solver</strong></span>
            <button
              onClick={() => onNavigateTab('challenges')}
              className="text-[#5A634E] font-semibold hover:underline"
            >
              View Challenges →
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Triggered from here */}
      <ProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
