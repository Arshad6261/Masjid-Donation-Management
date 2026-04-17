import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email('सही ईमेल डालें'),
  password: z.string().min(6, 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए'),
});

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dargah-cream flex flex-col items-center justify-center p-4">
      {/* Hero image */}
      <div className="w-full max-w-md relative mb-0 rounded-t-2xl overflow-hidden shadow-xl">
        <img src="/assets/dargah.jpg" alt="हज़रत सुल्तान शाह पीर दरगाह" className="w-full h-72 object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(15,76,42,0.88))' }}></div>
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <h1 className="font-arabic text-3xl text-white font-bold drop-shadow-lg">حضرت سلطان شاہ پیر</h1>
          <p className="text-dargah-gold-light font-body text-sm font-medium mt-1">हज़रत सुल्तान शाह पीर</p>
        </div>
      </div>
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-b-2xl shadow-xl border-l-4 border-dargah-gold overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-dargah-green-dark mb-1 font-body">वापसी पर स्वागत है</h2>
          <p className="text-slate-500 text-sm mb-6">चंदा और वसूली प्रबंधन के लिए लॉगिन करें</p>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ईमेल</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-dargah-green/30 focus:border-dargah-green outline-none transition-all"
                placeholder="admin@masjid.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">पासवर्ड</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-dargah-green/30 focus:border-dargah-green outline-none transition-all"
                placeholder="••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center shadow-lg hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B6B3A 100%)' }}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'लॉगिन करें'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
