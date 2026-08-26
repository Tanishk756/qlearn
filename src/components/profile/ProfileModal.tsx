/**
 * Profile Customization Modal & Settings
 * Allows users to upload profile pictures, choose avatar presets, edit bio, and switch themes.
 * @license Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  User,
  Sparkles,
  Palette,
  Check,
  Building,
  GraduationCap,
  Save,
  Bell,
  Trash2,
  Trophy,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { THEME_OPTIONS, AVATAR_PRESETS } from '../../data/themes';
import { ThemeId } from '../../types/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    updateProfile,
    uploadAvatar,
    selectAvatarPreset,
    setTheme,
    theme,
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-tab in profile modal
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'notifications' | 'badges'>('profile');

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [affiliation, setAffiliation] = useState(currentUser?.affiliation || '');
  const [quantumLevel, setQuantumLevel] = useState(currentUser?.quantumLevel || 'Student');

  // Notification toggles
  const [notifSettings, setNotifSettings] = useState(
    currentUser?.notificationSettings || {
      newMessages: true,
      importantUpdates: true,
      mentions: true,
      soundAlerts: true,
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Handle image file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const res = await uploadAvatar(file);
    if (!res.success) {
      setUploadError(res.error || 'Failed to process avatar upload.');
    }
  };

  // Save all profile details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    await updateProfile({
      name,
      username,
      bio,
      affiliation,
      quantumLevel: quantumLevel as any,
      notificationSettings: notifSettings,
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Selected avatar helper
  const renderCurrentAvatar = () => {
    if (currentUser.avatarUrl) {
      return (
        <img
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          className="w-20 h-20 rounded-3xl object-cover border-2 border-[#8DA47E] shadow-sm"
        />
      );
    }

    const preset = AVATAR_PRESETS.find((p) => p.id === currentUser.avatarPreset);
    if (preset) {
      return (
        <div
          className={`w-20 h-20 rounded-3xl ${preset.bgColor} text-white flex items-center justify-center text-3xl font-bold shadow-sm`}
        >
          {preset.emoji}
        </div>
      );
    }

    return (
      <div className="w-20 h-20 rounded-3xl bg-[#5A634E] text-[#F3F0E9] flex items-center justify-center font-serif text-3xl font-bold shadow-sm">
        {currentUser.name.charAt(0)}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        id="profile-modal-card"
        className="bg-[#FDFCF9] w-full max-w-2xl rounded-3xl border border-[#E8E4DA] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E4DA] bg-[#F3F0E9]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5A634E] text-white flex items-center justify-center text-sm font-semibold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D3326]">
                Profile & Theme Customization
              </h3>
              <p className="text-[11px] text-[#6D7268]">
                Manage your quantum identity, bio, avatar, and workspace aesthetic
              </p>
            </div>
          </div>

          <button
            id="profile-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857B] hover:text-[#2D3326] hover:bg-[#E8E4DA] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#E8E4DA] flex gap-2 bg-[#F3F0E9]/30">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#5A634E] text-[#5A634E]'
                : 'border-transparent text-[#8C857B] hover:text-[#2D3326]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Bio</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'theme'
                ? 'border-[#5A634E] text-[#5A634E]'
                : 'border-transparent text-[#8C857B] hover:text-[#2D3326]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme Options</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'border-[#5A634E] text-[#5A634E]'
                : 'border-transparent text-[#8C857B] hover:text-[#2D3326]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notification Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'border-[#5A634E] text-[#5A634E]'
                : 'border-transparent text-[#8C857B] hover:text-[#2D3326]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Badges & Stats</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: PROFILE & BIO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar Section */}
              <div className="bg-[#F3F0E9]/50 p-4 rounded-3xl border border-[#E8E4DA] flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group shrink-0">
                  {renderCurrentAvatar()}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-medium cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Change
                  </button>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A634E]">
                      Profile Picture
                    </span>
                    {currentUser.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => selectAvatarPreset('bloch-sphere')}
                        className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Custom Image
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6D7268]">
                    Upload a custom photo or choose from our quantum computing themed avatars.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-[#E8E4DA] rounded-xl text-xs font-medium text-[#2D3326] hover:bg-[#F3F0E9] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#8DA47E]" />
                      <span>Upload Picture</span>
                    </button>
                  </div>

                  {uploadError && (
                    <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Avatar Presets Grid */}
              <div>
                <label className="block text-xs font-semibold text-[#5A634E] mb-2">
                  Or Select Quantum Avatar Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected =
                      !currentUser.avatarUrl && currentUser.avatarPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectAvatarPreset(preset.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#5A634E] bg-[#5A634E]/10 ring-1 ring-[#5A634E]'
                            : 'border-[#E8E4DA] bg-white hover:bg-[#F3F0E9]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl ${preset.bgColor} text-white flex items-center justify-center text-lg font-bold shrink-0`}
                        >
                          {preset.emoji}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[#2D3326] block truncate">
                            {preset.name}
                          </span>
                          <span className="text-[10px] text-[#8C857B] block truncate">
                            {preset.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Username / Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Affiliation / Lab / University
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quantum Information Group"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A634E] mb-1">
                    Quantum Proficiency Level
                  </label>
                  <select
                    value={quantumLevel}
                    onChange={(e: any) => setQuantumLevel(e.target.value)}
                    className="w-full bg-white px-3.5 py-2 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326]"
                  >
                    <option value="Beginner">Beginner (Curious Learner)</option>
                    <option value="Student">Student (Physics / CS Undergrad)</option>
                    <option value="Researcher">Researcher (Postgrad / Academic)</option>
                    <option value="Quantum Engineer">Quantum Engineer (Hardware & QPU)</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#5A634E]">
                    Short Quantum Bio
                  </label>
                  <span className="text-[10px] text-[#8C857B]">
                    {bio.length}/280 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={280}
                  placeholder="Share your quantum computing interests, research focus, or background..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white px-3.5 py-2.5 rounded-2xl border border-[#E8E4DA] text-xs focus:outline-hidden focus:border-[#8DA47E] text-[#2D3326] resize-none"
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {saveSuccess && (
                  <span className="text-xs text-[#8DA47E] font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Profile updated successfully
                  </span>
                )}
                <button
                  id="profile-save-btn"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#5A634E] hover:bg-[#474F3E] text-white font-medium text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: THEME OPTIONS */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#5A634E] uppercase tracking-wider mb-1">
                  Select Visual Theme
                </h4>
                <p className="text-xs text-[#6D7268]">
                  Choose from carefully calibrated palettes designed for mathematical clarity, low eye strain, and high contrast.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {THEME_OPTIONS.map((themeOption) => {
                  const isSelected = theme === themeOption.id;
                  return (
                    <div
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#5A634E] bg-white ring-2 ring-[#5A634E] shadow-sm'
                          : 'border-[#E8E4DA] bg-white hover:border-[#8DA47E] hover:bg-[#F3F0E9]/40'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#2D3326]">
                            {themeOption.name}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-[#5A634E] text-white text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6D7268] line-clamp-2">
                          {themeOption.description}
                        </p>
                      </div>

                      {/* Theme Palette Swatch Preview */}
                      <div className="mt-4 pt-3 border-t border-[#E8E4DA] flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: themeOption.previewBg }}
                          title="Background Canvas"
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: themeOption.previewPrimary }}
                          title="Primary Structural Tone"
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: themeOption.previewAccent }}
                          title="Accent & Gate Tone"
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                          style={{ backgroundColor: themeOption.previewText }}
                          title="High-Contrast Text"
                        />
                        <span className="text-[10px] font-mono text-[#8C857B] ml-auto">
                          {themeOption.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATION ALERTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#5A634E] uppercase tracking-wider mb-1">
                  Notification Delivery Preferences
                </h4>
                <p className="text-xs text-[#6D7268]">
                  Control alerts for new messages, important platform updates, and study group mentions.
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-3xl border border-[#E8E4DA]">
                {/* Toggle 1: New Messages */}
                <div className="flex items-center justify-between py-2 border-b border-[#E8E4DA]">
                  <div>
                    <span className="text-xs font-semibold text-[#2D3326] block">
                      New Messages
                    </span>
                    <span className="text-[11px] text-[#6D7268] block">
                      Alerts when Q-Nova AI Tutor or peers reply to discussions
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.newMessages}
                    onChange={(e) =>
                      setNotifSettings({ ...notifSettings, newMessages: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5A634E] cursor-pointer"
                  />
                </div>

                {/* Toggle 2: Important Updates */}
                <div className="flex items-center justify-between py-2 border-b border-[#E8E4DA]">
                  <div>
                    <span className="text-xs font-semibold text-[#2D3326] block">
                      Important Engine Updates
                    </span>
                    <span className="text-[11px] text-[#6D7268] block">
                      Major algorithm releases, compiler updates, and new challenges
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.importantUpdates}
                    onChange={(e) =>
                      setNotifSettings({ ...notifSettings, importantUpdates: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5A634E] cursor-pointer"
                  />
                </div>

                {/* Toggle 3: Mentions */}
                <div className="flex items-center justify-between py-2 border-b border-[#E8E4DA]">
                  <div>
                    <span className="text-xs font-semibold text-[#2D3326] block">
                      Community Mentions
                    </span>
                    <span className="text-[11px] text-[#6D7268] block">
                      Alerts when someone mentions your @handle on leaderboard or circuits
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.mentions}
                    onChange={(e) =>
                      setNotifSettings({ ...notifSettings, mentions: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5A634E] cursor-pointer"
                  />
                </div>

                {/* Toggle 4: Sound alerts */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-xs font-semibold text-[#2D3326] block">
                      Simulation Sound Feedback
                    </span>
                    <span className="text-[11px] text-[#6D7268] block">
                      Subtle harmonic chime when quantum circuit measurement completes
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.soundAlerts}
                    onChange={(e) =>
                      setNotifSettings({ ...notifSettings, soundAlerts: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5A634E] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-[#5A634E] hover:bg-[#474F3E] text-white text-xs font-medium rounded-2xl transition-all cursor-pointer"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: BADGES & STATS */}
          {activeTab === 'badges' && (
            <div className="space-y-5">
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-2xl border border-[#E8E4DA] text-center">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] block">
                    Qubit Points
                  </span>
                  <span className="font-serif text-xl font-bold text-[#2D3326]">
                    {currentUser.stats.qubitMasteryPoints}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#E8E4DA] text-center">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] block">
                    Lessons Done
                  </span>
                  <span className="font-serif text-xl font-bold text-[#5A634E]">
                    {currentUser.stats.completedLessons}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#E8E4DA] text-center">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] block">
                    Challenges
                  </span>
                  <span className="font-serif text-xl font-bold text-[#8DA47E]">
                    {currentUser.stats.completedChallenges}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-[#E8E4DA] text-center">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] block">
                    Simulations
                  </span>
                  <span className="font-serif text-xl font-bold text-[#2D3326]">
                    {currentUser.stats.circuitsRun}
                  </span>
                </div>
              </div>

              {/* Badges Earned */}
              <div>
                <h4 className="text-xs font-bold text-[#5A634E] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Earned Quantum Badges</span>
                </h4>
                <div className="space-y-2.5">
                  {currentUser.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="p-3 bg-white rounded-2xl border border-[#E8E4DA] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-[#F3F0E9] flex items-center justify-center text-xl shrink-0">
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2D3326]">
                            {badge.name}
                          </span>
                          <span className="text-[10px] text-[#8C857B]">
                            {badge.unlockedAt}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6D7268] truncate">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
