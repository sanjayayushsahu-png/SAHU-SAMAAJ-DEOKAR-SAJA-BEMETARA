import React, { useState, useRef } from 'react';
import { Sparkles, Music, MessageSquarePlus, Download, MapPin, HeartHandshake } from 'lucide-react';
import { t } from '../utils/i18n';

export default function HeroBanner3D({
  lang,
  onNavigate,
  onOpenComposer,
  canInstallPwa,
  onInstallPwa,
  stats,
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const handlePointerMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 20; // -10 to +10 deg
    const rx = (0.5 - y) * 18; // -9 to +9 deg
    setTilt({ rx, ry, gx: x * 100, gy: y * 100, active: true });
  };

  const resetTilt = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  return (
    <section className="relative overflow-hidden temple-pattern-bg text-cream-100 border-b-4 border-gold-500">
      {/* Traditional Chhattisgarhi Temple Arch & Kalash Background SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="templeMotif" width="120" height="120" patternUnits="userSpaceOnUse">
            <path
              d="M60 10 C80 35 100 50 100 80 L20 80 C20 50 40 35 60 10 Z"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1.2"
            />
            <circle cx="60" cy="56" r="10" fill="none" stroke="#FF8224" strokeWidth="1" />
            <path d="M10 110 Q60 90 110 110" fill="none" stroke="#D4AF37" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1200" height="500" fill="url(#templeMotif)" />
      </svg>

      {/* Top Ornamental Toran Border */}
      <div className="relative z-10 w-full h-2.5 bg-gradient-to-r from-maroon-900 via-gold-500 to-maroon-900 opacity-90" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-4 sm:space-y-5 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-maroon-900/75 border border-gold-400/60 text-gold-200 text-xs sm:text-sm font-semibold shadow-sm">
              <Sparkles className="w-4 h-4 text-saffron-400" />
              <span>
                {t(
                  lang,
                  'श्री भक्त माता कर्मा की पावन कृपा • छत्तीसगढ़ प्रदेश',
                  'Blessed by Bhakt Maa Karma • Chhattisgarh State'
                )}
              </span>
            </div>

            <h1 className="font-serifHindi text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-gold-100 via-gold-300 to-saffron-300 drop-shadow">
              {t(lang, 'साहू समाज छत्तीसगढ़', 'Sahu Samaj Chhattisgarh')}
            </h1>

            <p className="text-gold-100/95 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t(
                lang,
                'छत्तीसगढ़ के समस्त साहू समाज बंधुओं का एकीकृत डिजिटल चौपाल — भक्त माता कर्मा आरती एवं भजन, गौरवशाली इतिहास, जिला पदाधिकारी निर्देशिका, धर्मशाला एवं सामाजिक कार्यक्रम।',
                'The unified digital community hub for Sahu Samaj Chhattisgarh — Bhakt Maa Karma Aarti & Bhajans, glorious heritage, district directory, Dharmashalas, and social events.'
              )}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <button
                onClick={onOpenComposer}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold shadow-lg shadow-black/25 hover:from-saffron-400 hover:to-saffron-500 active:scale-95 transition-all"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>{t(lang, 'चौपाल पर पोस्ट करें', 'Post on Chaupal')}</span>
              </button>

              <button
                onClick={() => onNavigate('sahitya')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-900/80 border border-gold-400/70 text-gold-100 font-bold hover:bg-maroon-800 active:scale-95 transition-all"
              >
                <Music className="w-4 h-4 text-gold-300" />
                <span>{t(lang, 'माँ कर्मा आरती सुनें', 'Listen Maa Karma Aarti')}</span>
              </button>

              {canInstallPwa && (
                <button
                  onClick={onInstallPwa}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 text-maroon-900 font-bold shadow hover:bg-gold-400 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{t(lang, 'ऐप इंस्टॉल करें', 'Install App')}</span>
                </button>
              )}
            </div>

            {/* Community Highlights Strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-3 max-w-xl mx-auto lg:mx-0">
              <div className="rounded-xl bg-maroon-900/65 border border-gold-500/35 px-3 py-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-gold-300">33</div>
                <div className="text-[11px] sm:text-xs text-gold-100/80 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-saffron-400" />
                  {t(lang, 'जिले जुड़े', 'Districts')}
                </div>
              </div>
              <div className="rounded-xl bg-maroon-900/65 border border-gold-500/35 px-3 py-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-gold-300">{stats.posts}+</div>
                <div className="text-[11px] sm:text-xs text-gold-100/80">
                  {t(lang, 'चौपाल पोस्ट', 'Feed Posts')}
                </div>
              </div>
              <div className="rounded-xl bg-maroon-900/65 border border-gold-500/35 px-3 py-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-gold-300">{stats.events}</div>
                <div className="text-[11px] sm:text-xs text-gold-100/80 flex items-center justify-center gap-1">
                  <HeartHandshake className="w-3 h-3 text-saffron-400" />
                  {t(lang, 'आगामी कार्यक्रम', 'Events')}
                </div>
              </div>
            </div>
          </div>

          {/* Right 3D Interactive Bhakt Maa Karma Centerpiece Frame */}
          <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="relative perspective-1000 w-full max-w-[300px] sm:max-w-[330px]">
              {/* Subtle Golden Aura & Rotating Sacred Mandala Behind */}
              <div
                className="absolute -inset-6 rounded-full bg-gradient-to-tr from-saffron-500/40 via-gold-400/45 to-saffron-400/30 blur-2xl animate-aura-pulse pointer-events-none"
                aria-hidden="true"
              />
              <svg
                className="absolute -inset-8 w-[calc(100%+4rem)] h-[calc(100%+4rem)] opacity-35 animate-slow-spin pointer-events-none"
                viewBox="0 0 400 400"
                aria-hidden="true"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="182"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.5"
                  strokeDasharray="8 6"
                />
                <circle cx="200" cy="200" r="165" fill="none" stroke="#FF8224" strokeWidth="1" />
                {Array.from({ length: 16 }).map((_, i) => (
                  <line
                    key={i}
                    x1="200"
                    y1="20"
                    x2="200"
                    y2="42"
                    stroke="#FAF3D1"
                    strokeWidth="2"
                    transform={`rotate(${i * 22.5} 200 200)`}
                  />
                ))}
              </svg>

              {/* 3D Tiltable Ornate Temple Frame */}
              <div
                ref={cardRef}
                onMouseMove={handlePointerMove}
                onMouseLeave={resetTilt}
                onTouchMove={handlePointerMove}
                onTouchEnd={resetTilt}
                style={{
                  transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${
                    tilt.active ? 1.03 : 1
                  })`,
                  transition: tilt.active
                    ? 'transform 0.08s ease-out'
                    : 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="relative preserve-3d cursor-pointer rounded-[28px] p-2 gold-border-gradient shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
              >
                {/* Inner Ornate Maroon Temple Arch Frame */}
                <div className="relative rounded-[22px] overflow-hidden bg-maroon-900 border-2 border-gold-200/60">
                  {/* Top Temple Arch SVG Crown */}
                  <div className="absolute top-0 inset-x-0 z-20 pointer-events-none flex justify-center">
                    <svg viewBox="0 0 300 44" className="w-full h-10 drop-shadow">
                      <path
                        d="M0 0 H300 V16 Q225 4 150 28 Q75 4 0 16 Z"
                        fill="rgba(104,0,0,0.82)"
                        stroke="#D4AF37"
                        strokeWidth="1.5"
                      />
                      <circle cx="150" cy="14" r="5" fill="#FF6B00" stroke="#FAF3D1" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {/* Devotional Portrait of Bhakt Maa Karma */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <img
                      src="/images/bhakt-maa-karma.jpg"
                      alt="भक्त माता कर्मा - Bhakt Maa Karma"
                      className="w-full h-full object-cover object-top"
                      loading="eager"
                    />
                    {/* Dynamic 3D Specular Gold Sheen */}
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                      style={{
                        opacity: tilt.active ? 0.38 : 0.12,
                        background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 243, 196, 0.85), transparent 58%)`,
                      }}
                    />
                    {/* Bottom Vignette */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-maroon-900 via-maroon-900/75 to-transparent" />
                  </div>

                  {/* Caption Plaque at Bottom of Frame */}
                  <div
                    className="absolute bottom-0 inset-x-0 z-20 px-4 pb-3.5 pt-2 text-center"
                    style={{ transform: 'translateZ(24px)' }}
                  >
                    <div className="inline-block px-3 py-0.5 rounded-full bg-saffron-500/90 text-[10px] font-bold tracking-wider uppercase text-white mb-1 shadow">
                      {t(lang, 'आराध्य देवी', 'Patron Saint')}
                    </div>
                    <h2 className="font-serifHindi text-xl sm:text-2xl font-bold text-gold-100 drop-shadow">
                      {t(lang, 'भक्त माता कर्मा', 'Bhakt Maa Karma')}
                    </h2>
                    <p className="text-[11px] text-gold-300/95">
                      {t(lang, 'भक्ति, त्याग एवं सेवा की अमर ज्योति', 'Eternal Light of Devotion & Service')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtle 3D Hint */}
              <div className="text-center mt-2.5 text-[11px] text-gold-300/80">
                {t(lang, '✨ 3D दर्शन हेतु चित्र पर स्पर्श करें / माउस घुमाएं', '✨ Move cursor or touch frame for 3D parallax')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
