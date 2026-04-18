import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, Mail, Phone, User as UserIcon, Shield, MapPin, Building2, Wallet, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    return strength; // 0-3
  };

  const passStrength = getPasswordStrength(passwordForm.newPassword);

  // Admin Dashboard Query for Stats
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const { data } = await api.get('/reports/dashboard'); return data; },
    enabled: isAdmin
  });

  // Mutations
  const profileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser({ name: data.name, phone: data.phone });
      toast.success('प्रोफ़ाइल अपडेट हो गई');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'अपडेट विफल');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('पासवर्ड सफलतापूर्वक बदल गया');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'पासवर्ड बदलने में त्रुटि');
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!profileForm.name) {
      return toast.error('नाम अनिवार्य है');
    }
    // Basic pk phone validation if provided
    if (profileForm.phone && !/^03[0-9]{9}$/.test(profileForm.phone)) {
      return toast.error('वैध 11-अंकीय मोबाइल नंबर दर्ज करें (उदा. 03001234567)');
    }
    profileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    passwordMutation.mutate(passwordForm);
  };

  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'उपलब्ध नहीं';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      {/* SECTION 1: Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-dargah-green text-white flex items-center justify-center font-bold text-3xl md:text-4xl shadow-inner flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="text-center md:text-left flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-800 break-words">{user?.name}</h2>
          <div className="inline-flex items-center mt-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-slate-500 text-sm">
            <Mail className="w-4 h-4 mr-2" />
            <span className="truncate">{user?.email}</span>
            <Lock className="w-3 h-3 ml-2 text-slate-400" />
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {isAdmin ? 'प्रशासक (Admin)' : 'सदस्य (Member)'}
            </span>
            {!isAdmin && user?.assignedAreas?.map(area => (
              <span key={area} className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 2: Edit Profile Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-dargah-green" />
                व्यक्तिगत विवरण (Personal Details)
              </h3>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">नाम (Name)*</label>
                <input 
                  type="text" 
                  value={profileForm.name} 
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-dargah-green focus:border-dargah-green outline-none"
                  placeholder="अपना नाम दर्ज करें"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">फ़ोन (Phone)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={profileForm.phone} 
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value.replace(/\\D/g, '').slice(0, 11)})}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-dargah-green focus:border-dargah-green outline-none"
                    placeholder="0300XXXXXXX"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">11-अंकीय मोबाइल नंबर (उदा. 03001234567)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ईमेल (Email) <Lock className="w-3 h-3 inline text-slate-400" title="ईमेल बदला नहीं जा सकता" /></label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-xl px-4 py-2.5 cursor-not-allowed"
                />
              </div>
              <button 
                type="submit" 
                disabled={profileMutation.isPending}
                className="w-full bg-dargah-green hover:bg-dargah-green-dark text-white rounded-xl py-3 font-semibold shadow-sm transition-colors disabled:opacity-70"
              >
                {profileMutation.isPending ? 'सहेज रहे हैं...' : 'बदलाव सहेजें (Save Changes)'}
              </button>
            </form>
          </div>

          {/* SECTION 3: Change Password Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-600" />
                सुरक्षा (Security)
              </h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">वर्तमान पासवर्ड (Current Password)</label>
                <input 
                  type="password" 
                  value={passwordForm.currentPassword} 
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">नया पासवर्ड (New Password)</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-400 outline-none"
                  required
                />
                {/* Password Strength Bar */}
                <div className="mt-2 flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${passStrength >= 1 ? 'bg-red-400' : 'bg-transparent'} flex-1 transition-all`}></div>
                  <div className={`h-full ${passStrength >= 2 ? 'bg-amber-400' : 'bg-transparent'} flex-1 transition-all`}></div>
                  <div className={`h-full ${passStrength >= 3 ? 'bg-green-500' : 'bg-transparent'} flex-1 transition-all`}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">कम से कम 8 अक्षर, 1 बड़ा अक्षर (uppercase), और 1 अंक (number) होना चाहिए।</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">पासवर्ड की पुष्टि करें (Confirm Password)</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-400 outline-none"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={passwordMutation.isPending || passwordForm.newPassword !== passwordForm.confirmPassword || passStrength < 3}
                className="w-full border-2 border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white rounded-xl py-2.5 font-semibold transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-800"
              >
                {passwordMutation.isPending ? 'अपडेट कर रहे हैं...' : 'पासवर्ड अपडेट करें (Update Password)'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Info & Stats */}
        <div className="space-y-6">
          
          {/* SECTION 4: Account Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">खाता विवरण</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">भूमिका (Role)</p>
                <p className="font-bold text-slate-800">{isAdmin ? 'प्रशासक' : 'समिति सदस्य'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">जुड़ने की तिथि</p>
                <p className="font-bold text-slate-800">{joinDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">नियुक्त क्षेत्र</p>
                <p className="font-bold text-slate-800">{isAdmin ? 'सभी क्षेत्र (All)' : `${user?.assignedAreas?.length || 0} क्षेत्र`}</p>
              </div>
            </div>
          </div>

          {/* ADMIN EXTRA: Organization Stats */}
          {isAdmin && dashboard && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 text-white">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">संस्था के आंकड़े (Org Stats)</h3>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Wallet className="w-5 h-5" />
                    <span>इस माह कुल चंदा</span>
                  </div>
                  <span className="font-bold text-lg text-dargah-gold">
                    ₹{(dashboard.thisMonthCollected || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Users className="w-5 h-5" />
                    <span>कुल सदस्य (मासिक)</span>
                  </div>
                  <span className="font-bold text-lg text-white">
                    {/* The API doesn't expose active members explicitly in dashboard, using fallback to just show something if unavailable */}
                    -
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
