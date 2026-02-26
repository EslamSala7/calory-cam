import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, Weight, Activity, ChevronRight, Loader2, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeFoodImage, FoodAnalysis } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserProfile {
  age: string;
  gender: 'male' | 'female' | '';
  weight: string;
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [step, setStep] = useState<'onboarding' | 'main' | 'analyzing' | 'result'>('onboarding');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('doctor_food_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setIsFirstTime(false);
      setStep('main');
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProfile: UserProfile = {
      age: formData.get('age') as string,
      gender: formData.get('gender') as 'male' | 'female',
      weight: formData.get('weight') as string,
    };
    setProfile(newProfile);
    localStorage.setItem('doctor_food_profile', JSON.stringify(newProfile));
    setIsFirstTime(false);
    setStep('main');
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (image: string) => {
    setLoading(true);
    setStep('analyzing');
    try {
      const result = await analyzeFoodImage(image);
      setAnalysis(result);
      setStep('result');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('عذراً، حدث خطأ أثناء تحليل الصورة. حاول مرة أخرى.');
      setStep('main');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setStep('main');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans dir-rtl" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen"
          >
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
              <Activity className="text-white w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 text-primary">Calory cam</h1>
            <p className="text-slate-500 text-center mb-8">مرحباً بك! لنبدأ بتجهيز ملفك الصحي للوصول للرشاقة المثالية.</p>
            
            <form onSubmit={handleSaveProfile} className="w-full space-y-6 glass-card p-8 rounded-3xl">
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <User size={18} className="text-primary" /> العمر
                </label>
                <input
                  required
                  name="age"
                  type="number"
                  placeholder="مثال: 25"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Activity size={18} className="text-primary" /> النوع
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input type="radio" name="gender" value="male" className="peer sr-only" required />
                    <div className="p-3 text-center rounded-xl border border-slate-200 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary cursor-pointer transition-all">
                      ذكر
                    </div>
                  </label>
                  <label className="relative">
                    <input type="radio" name="gender" value="female" className="peer sr-only" />
                    <div className="p-3 text-center rounded-xl border border-slate-200 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary cursor-pointer transition-all">
                      أنثى
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <Weight size={18} className="text-primary" /> الوزن (كجم)
                </label>
                <input
                  required
                  name="weight"
                  type="number"
                  placeholder="مثال: 70"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
              >
                ابدأ الآن <ChevronRight size={20} />
              </button>
            </form>
          </motion.div>
        )}

        {step === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto min-h-screen flex flex-col"
          >
            <header className="p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-primary">Doctor Food</h2>
                <p className="text-slate-500 text-sm">مرحباً، كيف حال صحتك اليوم؟</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary">
                <User size={24} />
              </div>
            </header>

            <main className="flex-1 p-6 flex flex-col items-center justify-center gap-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-48 h-48 bg-white rounded-full shadow-2xl flex flex-col items-center justify-center gap-4 border-8 border-primary/10 hover:scale-105 transition-transform"
                >
                  <Camera size={64} className="text-primary" />
                  <span className="font-bold text-slate-600">صور وجبتك</span>
                </button>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2">
                  <Weight className="text-primary" />
                  <span className="text-xs text-slate-500">وزنك الحالي</span>
                  <span className="font-bold text-lg">{profile?.weight} كجم</span>
                </div>
                <div className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2">
                  <Activity className="text-primary" />
                  <span className="text-xs text-slate-500">العمر</span>
                  <span className="font-bold text-lg">{profile?.age} سنة</span>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleCapture}
              />
            </main>

            <footer className="p-8 text-center text-slate-400 text-xs">
              صمم خصيصاً لنمط حياة صحي ورشيق
            </footer>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-8">
              <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="text-primary animate-pulse" size={40} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">جاري تحليل الوجبة...</h2>
            <p className="text-slate-500">يقوم الذكاء الاصطناعي الآن بحساب السعرات والقيمة الغذائية بدقة.</p>
          </motion.div>
        )}

        {step === 'result' && analysis && (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-md mx-auto min-h-screen bg-white pb-12"
          >
            <div className="relative h-64 w-full">
              <img src={capturedImage!} alt="Food" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button
                onClick={reset}
                className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="absolute bottom-6 right-6 left-6">
                <h2 className="text-3xl font-bold text-white mb-1">{analysis.name}</h2>
                <div className="flex items-center gap-2 text-white/80">
                  <Weight size={16} />
                  <span>الوزن التقريبي: {analysis.weight}</span>
                </div>
              </div>
            </div>

            <div className="px-6 -mt-8 relative z-10">
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-black text-primary">{analysis.calories}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">سعرة حرارية</div>
                  </div>
                  <div className="h-12 w-[1px] bg-slate-100"></div>
                  <div className="text-center">
                    <div className={cn(
                      "text-xl font-bold flex items-center gap-1",
                      analysis.isHealthy ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {analysis.isHealthy ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                      {analysis.isHealthy ? "صحي" : "غير صحي"}
                    </div>
                    <div className="text-xs text-slate-400">تقييم الصحة: {analysis.healthRating}/10</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="bg-blue-50 p-3 rounded-2xl text-center">
                    <div className="text-blue-600 font-bold">{analysis.nutrients.protein}</div>
                    <div className="text-[10px] text-blue-400">بروتين</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-2xl text-center">
                    <div className="text-orange-600 font-bold">{analysis.nutrients.carbs}</div>
                    <div className="text-[10px] text-orange-400">كربوهيدرات</div>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-2xl text-center">
                    <div className="text-rose-600 font-bold">{analysis.nutrients.fats}</div>
                    <div className="text-[10px] text-rose-400">دهون</div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Activity size={18} className="text-primary" /> نبذة عن الوجبة
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {analysis.alternatives.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <RefreshCw size={18} className="text-primary" /> بدائل صحية مقترحة
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.alternatives.map((alt, i) => (
                        <span key={i} className="bg-primary/10 text-primary-dark px-3 py-1 rounded-full text-xs font-medium">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={reset}
                  className="w-full mt-8 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                >
                  تحليل وجبة أخرى
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
