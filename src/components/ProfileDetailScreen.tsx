import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Edit2, Shield, Settings, Key, User, Mail, MapPin, Phone, Calendar, Camera, Loader } from 'lucide-react';

interface ProfileDetailScreenProps {
  onBack: () => void;
  user: {
    id?: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    is_locked?: number;
  };
  onUserUpdate?: (updatedUser: any) => void;
}

export default function ProfileDetailScreen({ onBack, user, onUserUpdate }: ProfileDetailScreenProps) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File too large (max 5MB)');
      return;
    }
    setAvatarError('');
    setAvatarUploading(true);
    try {
      // Upload to Vercel Blob via PUT fetch
      const filename = `avatars/${user.id || 'user'}-${Date.now()}.${file.name.split('.').pop()}`;
      const uploadRes = await fetch(`/api/blob-upload?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();
      // Update avatar_url in DB
      if (user.id) {
        await fetch(`/api/avatar/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: url }),
        });
      }
      setAvatarUrl(url);
      if (onUserUpdate) onUserUpdate({ ...user, avatar_url: url });
    } catch (err: any) {
      setAvatarError(err.message || 'Upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-50 bg-[#f8f9fa] flex flex-col font-sans overflow-hidden"
    >
      {/* Header */}
      <div className="bg-[#005c7a] pt-12 pb-24 px-4 relative shrink-0">
        <div className="w-full flex items-center mb-6 relative z-10">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="flex-1 text-center font-bold text-white mr-8 tracking-tight text-[19px]">Profile Details</h1>
        </div>
        <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00bcd4] rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-16 pb-8 overflow-y-auto z-10">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 mb-5 flex flex-col items-center relative">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 font-bold text-3xl">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-[#005c7a] rounded-full flex items-center justify-center shadow-md hover:bg-[#004a62] transition-colors"
            >
              {avatarUploading ? (
                <Loader className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          {avatarError && <p className="text-red-500 text-xs mb-2">{avatarError}</p>}
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <p className="text-[#005c7a] font-medium text-sm">
            {user.role === 'admin' ? 'Administrator' : 'Verified Customer'}
          </p>
          {user.id && (
            <p className="text-slate-400 text-xs mt-1">Customer ID: {user.id.substring(0, 12).toUpperCase()}</p>
          )}
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 mb-5">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#005c7a]" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={user.name.toUpperCase()} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone Number" value={user.phone ? `+${user.phone}` : '—'} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email Address" value={user.email || '—'} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value="Phnom Penh, Cambodia" />
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 mb-5">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#005c7a]" />
            Account Security
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Account Status</span>
              <span className={`font-medium text-sm px-2 py-1 rounded-full ${
                user.is_locked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {user.is_locked ? 'Locked' : 'Active'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Biometric Auth</span>
              <span className="text-green-600 font-medium text-sm">Enabled</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">Role</span>
              <span className="text-slate-800 font-medium text-sm capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-400">{icon}</div>
      <div className="flex-1">
        <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-slate-800 text-sm">{value}</p>
      </div>
    </div>
  );
}
