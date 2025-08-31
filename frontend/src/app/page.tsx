'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { 
  useScrollAnimation, 
  useStaggerAnimation, 
  useFadeInUp, 
  useScaleAnimation,
  initSmoothScroll 
} from '@/lib/animations';

export default function Home() {
  // const router = useRouter();
  // const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  // const [message, setMessage] = useState<string>('');
  const [isAuth, setIsAuth] = useState<boolean>(false);

  // Animation refs
  const heroRef = useScrollAnimation();
  const featuresRef = useStaggerAnimation(0.2);
  const ctaRef = useFadeInUp();
  const dashboardRef = useScaleAnimation();

  useEffect(() => {
    // Smooth scroll'u etkinleştir - sadece client-side'da
    initSmoothScroll();

    // Authentication durumunu kontrol et
    const authStatus = isAuthenticated();
    setIsAuth(authStatus);

    // (async () => {
    //   try {
    //     const res = await api<Health>('/health');
    //     setStatus(res.status === 'ok' ? 'ok' : 'error');
    //     setMessage(JSON.stringify(res));
    //   } catch (e: unknown) {
    //     setStatus('error');
    //     setMessage(getErrorMessage(e));
    //   }
    // })();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* === HERO SECTION === */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full blur-3xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl bg-gradient-to-r from-indigo-400/20 to-pink-400/20 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl bg-gradient-to-r from-blue-300/10 to-purple-300/10" />
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  WeTrackX
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Kişisel finanslarınızı akıllıca yönetin. Gelir ve giderlerinizi takip edin, kategorize edin ve analiz edin.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {isAuth ? (
                  // Giriş yapmış kullanıcı için Dashboard butonu
                  <Link 
                    href="/dashboard" 
                    className="btn btn-primary text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Dashboard&apos;a Git
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </Link>
                ) : (
                  // Giriş yapmamış kullanıcı için Login/Register butonları
                  <>
                    <Link 
                      href="/auth/login" 
                      className="btn btn-primary text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      Giriş Yap
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="btn btn-outline text-lg px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      Kayıt Ol
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">1000+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Aktif Kullanıcı</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">50K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">İşlem</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">99.9%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Dashboard Preview */}
            <div ref={dashboardRef} className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Hesap Seçimi</div>
                  </div>
                  <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    Canlı
                  </div>
                </div>

                {/* Account Selection Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Tüm Hesaplar */}
                  <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium">Tüm Hesaplar</span>
                    </div>
                    <div className="text-lg font-bold">₺98.005,00</div>
                  </div>

                  {/* Kripto */}
                  <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-4 text-white relative">
                    <div className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">Cüzdan</div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-sm font-medium">Kripto</span>
                    </div>
                    <div className="text-lg font-bold">₺1.955,50</div>
                  </div>

                  {/* Nakit */}
                  <div className="bg-gradient-to-r from-orange-400 to-yellow-500 rounded-xl p-4 text-white relative">
                    <div className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">Nakit</div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-sm font-medium">Nakit</span>
                    </div>
                    <div className="text-lg font-bold">₺12.050,00</div>
                  </div>

                  {/* Banka Hesabı - Seçili */}
                  <div className="bg-gradient-to-r from-blue-600 to-gray-700 rounded-xl p-4 text-white relative border-2 border-blue-400">
                    <div className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-1 rounded-full">Banka</div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-sm font-medium">Banka Hesabı</span>
                    </div>
                    <div className="text-lg font-bold">₺83.999,50</div>
                  </div>
                </div>

                {/* Selected Account Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Banka Hesabı</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Seçili hesap</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">₺83.999,50</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mevcut bakiye</p>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Son İşlemler</div>
                  
                  {/* Gider İşlemi */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Gezi</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Seyahat • Tura katıldık</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">-₺30.000,50</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">15.08.2025</div>
                    </div>
                  </div>

                  {/* Gelir İşlemi */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Kira Geliri</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Zam Yaptım</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">+₺36.000,00</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">01.08.2025</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Neler Sunuyoruz?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Kullanıcıların kişisel finanslarını yönetebileceği, gelir ve giderlerini takip edebileceği, kategorize edebileceği ve basit analizler yapabileceği kapsamlı bir platform.
            </p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: Finansal Yönetim */}
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100/50 dark:border-blue-800/30">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Finansal Yönetim
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Gelir ve giderlerinizi tek yerden yönetin, bütçenizi kontrol altında tutun.
              </p>
            </div>

            {/* Feature 2: Takip Sistemi */}
            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100/50 dark:border-purple-800/30">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Akıllı Takip
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Harcamalarınızı otomatik olarak takip edin ve finansal alışkanlıklarınızı analiz edin.
              </p>
            </div>

            {/* Feature 3: Kategorizasyon */}
            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100/50 dark:border-green-800/30">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Akıllı Kategorizasyon
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                İşlemlerinizi otomatik olarak kategorilere ayırın ve harcama alışkanlıklarınızı görün.
              </p>
            </div>

            {/* Feature 4: Analiz */}
            <div className="group bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-orange-100/50 dark:border-orange-800/30">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Detaylı Analiz
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Grafikler ve raporlarla finansal durumunuzu analiz edin ve gelecek planlarınızı yapın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section ref={ctaRef} className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Finansal hedeflerinize ulaşmak için WeTrackX ile yolculuğunuza başlayın.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isAuth ? (
              // Giriş yapmış kullanıcı için Dashboard butonu
              <Link 
                href="/dashboard" 
                className="btn btn-primary text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Dashboard&apos;a Git
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>
            ) : (
              // Giriş yapmamış kullanıcı için Register/Login butonları
              <>
                <Link 
                  href="/auth/register" 
                  className="btn btn-primary text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Ücretsiz Hesap Oluştur
                </Link>
                <Link 
                  href="/auth/login" 
                  className="btn btn-outline text-lg px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Giriş Yap
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <Link href="/" className="block">
                <h3 className="text-2xl font-bold mb-4 hover:text-blue-400 transition-colors">WeTrackX</h3>
              </Link>
              <p className="text-gray-400 mb-4">
                Kişisel finanslarınızı akıllıca yönetin.
              </p>
            </div>
            
            {/* Product Section */}
            <div className="md:col-span-1">
              <h4 className="font-semibold mb-4 text-white">Ürün</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">İşlemler</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Raporlar</Link></li>
              </ul>
            </div>
            
            {/* Support Section */}
            <div className="md:col-span-1">
              <h4 className="font-semibold mb-4 text-white">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Yardım</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">İletişim</Link></li>
              </ul>
            </div>
            
            {/* Legal Section */}
            <div className="md:col-span-1">
              <h4 className="font-semibold mb-4 text-white">Yasal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Gizlilik</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Şartlar</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright Section */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WeTrackX. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}