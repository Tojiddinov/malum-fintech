import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { demoRequestsApi } from '../api/client'
import { getApiError } from '../utils/apiError'

export default function Landing() {
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Form state
  const [form, setForm] = useState({ name: '', bank: '', email: '', phone: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(false)
    setSubmitError(null)
    setSubmitting(true)
    try {
      await demoRequestsApi.create({
        name: form.name,
        bank_name: form.bank,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null,
      })
      setSubmitted(true)
      setForm({ name: '', bank: '', email: '', phone: '', message: '' })
    } catch (err) {
      setSubmitError(getApiError(err, "Murojaatni yuborib bo'lmadi. Qayta urinib ko'ring."))
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToSection = (id) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#C9A227] selection:text-[#0F2D21]">

      {/* 1. NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#1B4332] shadow-xl py-3.5'
            : 'bg-[#1B4332] py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#A07818] flex items-center justify-center text-[#0F2D21] font-black text-xl shadow-md">
              M
            </div>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight block leading-tight">MIZAN</span>
              <span className="text-[10px] text-[#C9A227] font-bold tracking-widest uppercase block">
                {t('brand.slogan')}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-emerald-100">
            <button onClick={() => scrollToSection('features')} className="hover:text-[#C9A227] transition-colors cursor-pointer">
              Xususiyatlar
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#C9A227] transition-colors cursor-pointer">
              Qanday ishlaydi
            </button>
            <button onClick={() => scrollToSection('problem-solution')} className="hover:text-[#C9A227] transition-colors cursor-pointer">
              Yechimlar
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-[#C9A227] transition-colors cursor-pointer">
              Bog'lanish
            </button>
          </div>

          {/* Login Button + Language Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher theme="light" />
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#E9C46A] text-[#0F2D21] font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              {t('nav.login')} →
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F2D21] border-b border-[#C9A227]/20 px-6 py-4 space-y-3">
            <button onClick={() => scrollToSection('features')} className="block text-left w-full text-white py-2 text-sm font-medium">
              Xususiyatlar
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="block text-left w-full text-white py-2 text-sm font-medium">
              Qanday ishlaydi
            </button>
            <button onClick={() => scrollToSection('problem-solution')} className="block text-left w-full text-white py-2 text-sm font-medium">
              Yechimlar
            </button>
            <button onClick={() => scrollToSection('contact')} className="block text-left w-full text-white py-2 text-sm font-medium">
              Bog'lanish
            </button>
            <Link
              to="/login"
              className="block text-center w-full py-2.5 rounded-lg bg-[#C9A227] text-[#0F2D21] font-bold text-sm"
            >
              Kirish →
            </Link>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-20 bg-[#F1F5F1] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B4332]/10 border border-[#1B4332]/20 text-[#1B4332] text-xs font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
                O'zbekiston Islom Banklari Uchun Yagona Standart
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1B4332] leading-tight">
                O'zbekiston Islom Banklari Uchun <br className="hidden sm:inline" />
                <span className="text-[#C9A227]">Shariat Komplaensi</span> Platformasi
              </h1>

              <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed">
                Murabaha va Musharaka bitimlarini raqamli boshqaring. Shariat kengashi tasdiqlash jarayonini avtomatlashtiring.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/login"
                  className="px-7 py-3.5 rounded-xl bg-[#1B4332] hover:bg-[#0F2D21] text-white font-bold text-base text-center shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Platformaga kirish
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <button
                  onClick={() => scrollToSection('contact')}
                  className="px-7 py-3.5 rounded-xl bg-[#C9A227] hover:bg-[#E9C46A] text-[#0F2D21] font-extrabold text-base text-center shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Demo so'rash
                </button>
              </div>

              {/* Highlights */}
              <div className="pt-6 border-t border-slate-300/60 flex flex-wrap items-center gap-6 text-xs text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#1B4332]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  AAOIFI Standartlari
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#1B4332]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  256-bit Shifrlash
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#1B4332]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Real-time AML Risk Scoring
                </span>
              </div>
            </div>

            {/* Right Mockup SVG Illustration Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-[#0F2D21] border border-[#C9A227]/40 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-xs text-amber-200">MIZAN Live Dashboard</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-[#C9A227]/20 text-[#C9A227] rounded border border-[#C9A227]/40 font-mono font-bold">
                    ONLINE
                  </span>
                </div>

                <div className="bg-[#142B20] p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">Bitim #0042 (Musharaka)</span>
                    <span className="text-emerald-400 font-bold">850,000,000 UZS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Shariat Kengashi ko'rib chiqmoqda</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                      PAST RISK
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                    <div className="bg-gradient-to-r from-[#C9A227] to-emerald-400 h-1.5 rounded-full w-[75%]" />
                  </div>
                </div>

                <div className="bg-[#142B20] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-100">AML / KYC Sanksiya Cheki</div>
                    <div className="text-[11px] text-slate-400">Kontragent: BuildersCo LLC · Toza</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    TASDIQLANDI ✓
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-black/30 p-3 rounded-lg text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tasdiqlangan hajm</div>
                    <div className="text-base sm:text-lg font-extrabold text-[#C9A227]">2.4 mlrd UZS</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Audit Hisobotlar</div>
                    <div className="text-base sm:text-lg font-extrabold text-emerald-400">100% Tayyor</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. STATISTIKA BAND */}
      <section className="bg-[#1B4332] py-14 text-white border-y border-[#C9A227]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#C9A227] tracking-tight">10+</div>
              <div className="text-xs sm:text-sm text-emerald-100 font-medium">Islom moliyasi tashkiloti</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#C9A227] tracking-tight">$2 mlrd+</div>
              <div className="text-xs sm:text-sm text-emerald-100 font-medium">Kuzatilayotgan hajm</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#C9A227] tracking-tight">99.2%</div>
              <div className="text-xs sm:text-sm text-emerald-100 font-medium">Komplaens ko'rsatkichi</div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#C9A227] tracking-tight">29.06.2026</div>
              <div className="text-xs sm:text-sm text-emerald-100 font-medium">Qonun kuchga kirdi</div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. XUSUSIYATLAR (3 cards) */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-extrabold text-[#C9A227] uppercase tracking-widest">Platforma Imkoniyatlari</h2>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B4332]">
              Islom Moliyasi Bitimlarini Boshqarish Uchun Mukammal Yechim
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 hover:border-[#C9A227]/60 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1B4332]/10 flex items-center justify-center text-2xl">
                📋
              </div>
              <h3 className="text-xl font-bold text-[#1B4332]">Bitim Reestri</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Har bir Murabaha/Musharaka bitimi uchun audit-ready raqamli reestr. Har bir amal tarixi avtomatik log qilinadi.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 hover:border-[#C9A227]/60 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#C9A227]/20 flex items-center justify-center text-2xl">
                ⚖️
              </div>
              <h3 className="text-xl font-bold text-[#1B4332]">Shariat Workflow</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Kengash a'zolari bitimlarda raqamli imzo qo'yadi, izoh qoldiradi, kvorum va SLA muddatlari nazorat qilinadi.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 hover:border-[#C9A227]/60 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl text-emerald-700">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-[#1B4332]">AML / KYC Nazorati</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Real vaqtda risk skoring va sanksiya tekshiruvi — aynan Islom bitimi kontekstida.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. QANDAY ISHLAYDI (4 qadam) */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold text-[#C9A227] uppercase tracking-widest">Ish Jarayoni</h2>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B4332]">
              4 Bosqichli Avtomatlashtirilgan Workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Step 1 */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#1B4332] text-[#C9A227] font-black text-xl flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h4 className="text-base font-bold text-[#1B4332]">Bitim kiritiladi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bank xodimi Murabaha yoki Musharaka bitim shartlarini kiritadi.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#1B4332] text-[#C9A227] font-black text-xl flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h4 className="text-base font-bold text-[#1B4332]">AML/KYC tekshiruv</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tizim avtomatik sanksiya ro'yxatidan o'tkazib, risk darajasini baholaydi.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#1B4332] text-[#C9A227] font-black text-xl flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h4 className="text-base font-bold text-[#1B4332]">Shariat kengashi tasdiqlaydi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kengash a'zolari fatvo va komplaens talablariga ko'ra tasdiqlaydi.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#C9A227] text-[#0F2D21] font-black text-xl flex items-center justify-center mx-auto shadow-md">
                4
              </div>
              <h4 className="text-base font-bold text-[#1B4332]">Audit hisobot tayyor</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Markaziy Bank va audit uchun bir bosingda PDF/Excel hisobot olinadi.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. MUAMMO / YECHIM SECTION (2 columns) */}
      <section id="problem-solution" className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-extrabold text-[#C9A227] uppercase tracking-widest">Taqqoslash</h2>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B4332]">
              Eski Yondashuv vs MIZAN Platformasi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Muammo */}
            <div className="bg-[#FFF5F5] border border-red-200 rounded-2xl p-7 space-y-5">
              <div className="flex items-center gap-3 border-b border-red-200 pb-3">
                <span className="text-xl">⚠️</span>
                <h3 className="text-lg font-bold text-red-900">An'anaviy Muammolar</h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-red-950 font-medium">
                <div className="flex items-start gap-2.5">
                  <span className="text-red-600 font-bold">✕</span>
                  <p>Bitimlar Excel va qog'ozda kuzatiladi, inson omili xatolari yuqori.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-red-600 font-bold">✕</span>
                  <p>Har yilgi audit uchun hujjatlar yig'ish haftalab vaqt oladi va tizimli emas.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-red-600 font-bold">✕</span>
                  <p>AML va Shariat nazorati bir-biridan ajralgan, sanksiya xatarlari kelib chiqadi.</p>
                </div>
              </div>
            </div>

            {/* Yechim */}
            <div className="bg-[#E6F4EA] border border-emerald-200 rounded-2xl p-7 space-y-5">
              <div className="flex items-center gap-3 border-b border-emerald-200 pb-3">
                <span className="text-xl">✅</span>
                <h3 className="text-lg font-bold text-[#1B4332]">MIZAN Yechimi</h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[#0F2D21] font-medium">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <p>Markazlashtirilgan raqamli reestr va real-time holat monitoringi.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <p>Bir bosingda avtomatik tayyor bo'ladigan PDF/Excel audit hisobotlar.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <p>Yagona platformada birlashtirilgan Shariat va AML/KYC workflow.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CONTACT / CTA SECTION */}
      <section id="contact" className="py-20 bg-[#1B4332] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#C9A227]">
              Bank bilan hamkorlik qilish uchun murojaat qiling
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm">
              Mutaxassislarimiz platformani bank tizimingizga integratsiya qilish bo'yicha konsultatsiya berishadi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#0F2D21] p-6 sm:p-8 rounded-2xl border border-[#C9A227]/30 text-left shadow-2xl space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1.5">
                  Ismingiz *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jasur Karimov"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#142B20] border border-[#C9A227]/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1.5">
                  Bank / Tashkilot nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Aloqabank Islom Darchasi"
                  value={form.bank}
                  onChange={(e) => setForm({ ...form, bank: e.target.value })}
                  className="w-full bg-[#142B20] border border-[#C9A227]/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="j.karimov@bank.uz"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#142B20] border border-[#C9A227]/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1.5">
                  Telefon *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#142B20] border border-[#C9A227]/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#C9A227]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1.5">
                Xabar / Qo'shimcha ma'lumot
              </label>
              <textarea
                rows="3"
                placeholder="Platforma bo'yicha savollaringiz..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-[#142B20] border border-[#C9A227]/30 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#C9A227]"
              />
            </div>

            {submitted && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold">
                ✅ Murojaatingiz qabul qilindi! Tez orada siz bilan bog'lanamiz.
              </div>
            )}

            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-center font-bold">
                {typeof submitError === 'string' ? submitError : "Ma'lumotlarni tekshirib qayta urinib ko'ring."}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#C9A227] hover:bg-[#E9C46A] text-[#0F2D21] font-extrabold text-sm shadow-lg transition-all cursor-pointer"
            >
              {submitting ? 'Yuborilmoqda...' : 'Yuborish →'}
            </button>

          </form>

        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#0F2D21] border-t border-[#C9A227]/20 py-6 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">MIZAN</span>{' '}
            &copy; {new Date().getFullYear()} — {t('landing.footerTagline')}
          </div>

          <div className="text-emerald-400 font-semibold">
            29.06.2026 qonuni asosida ishlaydi
          </div>

          <div>
            <Link to="/login" className="text-[#C9A227] hover:underline font-bold">
              {t('nav.login')} →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
