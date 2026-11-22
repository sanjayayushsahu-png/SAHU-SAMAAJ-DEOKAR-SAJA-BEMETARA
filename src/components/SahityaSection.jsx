import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  Feather,
  FileText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { t, shareOnWhatsApp } from '../utils/i18n';
import { devotionalAudio } from '../utils/devotionalAudio';

export default function SahityaSection({ lang, items }) {
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(items[0]?.id || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVerseIdx, setActiveVerseIdx] = useState(-1);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readerScale, setReaderScale] = useState(1.15); // Larger default Devanagari reading typography
  const externalAudioRef = useRef(null);

  const filteredItems = items.filter((item) => category === 'all' || item.category === category);
  const activeItem =
    items.find((i) => i.id === selectedId) || filteredItems[0] || items[0] || null;

  useEffect(() => {
    return () => {
      devotionalAudio.stop();
    };
  }, []);

  // Stop audio when switching item
  useEffect(() => {
    stopAudio();
  }, [activeItem?.id]);

  const stopAudio = () => {
    devotionalAudio.stop();
    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
      externalAudioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setActiveVerseIdx(-1);
  };

  const togglePlay = () => {
    if (!activeItem) return;
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (activeItem.audioUrl) {
      if (externalAudioRef.current) {
        externalAudioRef.current.muted = muted;
        externalAudioRef.current.play().catch(() => {});
        setIsPlaying(true);
        setActiveVerseIdx(0);
      }
      return;
    }

    // Built-in offline devotional harmonium/bell player
    devotionalAudio.setVolume(muted ? 0 : 0.55);
    setIsPlaying(true);
    setActiveVerseIdx(0);
    const verseCount = activeItem.verses?.length || 1;
    devotionalAudio.start(activeItem.melodyKey || 'aarti', activeItem.tempo || 94, (step) => {
      const idx = Math.floor(step / 6) % verseCount;
      setActiveVerseIdx(idx);
    });
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    devotionalAudio.setVolume(nextMuted ? 0 : 0.55);
    if (externalAudioRef.current) {
      externalAudioRef.current.muted = nextMuted;
    }
  };

  const handleCopy = () => {
    if (!activeItem) return;
    const text = `${activeItem.titleHi}\n\n${activeItem.verses.join('\n\n')}\n\n— साहू समाज छत्तीसगढ़`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!activeItem) return;
    const text = `🪔 *${activeItem.titleHi}*\n(${activeItem.titleEn})\n\n${activeItem.verses.join(
      '\n\n'
    )}\n\n🙏 *साहू समाज छत्तीसगढ़* — जय भक्त माता कर्मा!`;
    shareOnWhatsApp(text);
  };

  const tabs = [
    { id: 'all', icon: Sparkles, hi: 'सभी', en: 'All' },
    { id: 'aarti', icon: Music, hi: 'माँ कर्मा आरती', en: 'Aarti' },
    { id: 'bhajan', icon: Music, hi: 'भजन', en: 'Bhajans' },
    { id: 'poem', icon: Feather, hi: 'कविताएँ', en: 'Poems' },
    { id: 'article', icon: FileText, hi: 'सामाजिक लेख', en: 'Articles' },
  ];

  const isSingable = activeItem && (activeItem.category === 'aarti' || activeItem.category === 'bhajan');

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="font-serifHindi text-2xl sm:text-3xl font-bold text-maroon-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-saffron-500" />
            {t(lang, 'साहित्य, भजन एवं आरती', 'Sahitya, Bhajan & Aarti')}
          </h2>
          <p className="text-sm text-stone-600">
            {t(
              lang,
              'भक्त माता कर्मा की आरती, भक्ति भजन (ऑडियो प्लेयर सहित), कविताएँ एवं सामाजिक लेख',
              'Sing-along Bhakt Maa Karma Aarti & Bhajans with audio player, Hindi poems, and social articles'
            )}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCategory(tab.id);
                  const first = items.find((i) => tab.id === 'all' || i.category === tab.id);
                  if (first) setSelectedId(first.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
                  category === tab.id
                    ? 'bg-saffron-500 text-white border-saffron-600 shadow-sm'
                    : 'bg-white text-maroon-800 border-gold-300 hover:bg-cream-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(lang, tab.hi, tab.en)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredItems.map((item) => {
            const selected = activeItem?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected
                    ? 'bg-gradient-to-r from-maroon-800 to-maroon-700 text-cream-100 border-gold-500 shadow-lg'
                    : 'cream-card text-maroon-900 hover:border-saffron-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selected
                        ? 'bg-gold-500/25 text-gold-200 border border-gold-400/40'
                        : 'bg-saffron-100 text-saffron-800'
                    }`}
                  >
                    {item.category === 'aarti'
                      ? t(lang, 'आरती', 'Aarti')
                      : item.category === 'bhajan'
                      ? t(lang, 'भजन', 'Bhajan')
                      : item.category === 'poem'
                      ? t(lang, 'कविता', 'Poem')
                      : t(lang, 'सामाजिक लेख', 'Article')}
                  </span>
                  {(item.category === 'aarti' || item.category === 'bhajan') && (
                    <Music className={`w-4 h-4 ${selected ? 'text-gold-300' : 'text-saffron-500'}`} />
                  )}
                </div>
                <div className="font-bold text-base leading-snug">
                  {lang === 'hi' ? item.titleHi : item.titleEn || item.titleHi}
                </div>
                <div className={`text-xs mt-1 ${selected ? 'text-gold-200/80' : 'text-stone-500'}`}>
                  {lang === 'hi' ? item.authorHi : item.authorEn || item.authorHi}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Reader & Sing-Along Audio Player */}
        {activeItem && (
          <div className="lg:col-span-8 cream-card rounded-2xl overflow-hidden border-2 border-gold-400/70">
            {/* Ornate Top Header */}
            <div className="bg-gradient-to-r from-maroon-800 via-maroon-700 to-saffron-700 text-cream-100 p-5 sm:p-6 border-b-2 border-gold-400">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serifHindi text-2xl sm:text-3xl font-bold text-gold-100">
                    {activeItem.titleHi}
                  </h3>
                  <p className="text-sm text-gold-200/90 mt-0.5">{activeItem.titleEn}</p>
                  <p className="text-xs text-gold-300/85 mt-1">
                    {lang === 'hi' ? activeItem.authorHi : activeItem.authorEn}
                  </p>
                </div>

                {/* Reader Font Zoom & Share */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setReaderScale((s) => Math.max(0.95, Number((s - 0.12).toFixed(2))))}
                    className="p-2 rounded-xl bg-maroon-900/70 border border-gold-400/40 text-gold-100 hover:bg-maroon-900"
                    title={t(lang, 'अक्षर छोटे करें', 'Smaller text')}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setReaderScale((s) => Math.min(1.65, Number((s + 0.12).toFixed(2))))}
                    className="p-2 rounded-xl bg-maroon-900/70 border border-gold-400/40 text-gold-100 hover:bg-maroon-900"
                    title={t(lang, 'अक्षर बड़े करें', 'Larger text')}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-maroon-900/70 border border-gold-400/40 text-gold-100 hover:bg-maroon-900"
                    title={t(lang, 'कॉपी करें', 'Copy text')}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Embedded Sing-Along Audio Player for Aarti & Bhajans */}
              {isSingable && (
                <div className="mt-4 p-3.5 rounded-xl bg-maroon-900/75 border border-gold-400/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-gold-100">
                        {isPlaying
                          ? t(lang, 'भक्ति धुन चल रही है • साथ गाएं', 'Devotional Melody Playing • Sing Along')
                          : t(lang, 'आरती / भजन धुन सुनें (ऑफ़लाइन समर्थित)', 'Play Devotional Tune (Offline Ready)')}
                      </div>
                      <div className="text-xs text-gold-300/80">
                        {activeItem.audioUrl
                          ? t(lang, 'ऑडियो ट्रैक उपलब्ध', 'Audio track loaded')
                          : t(lang, 'हारमोनियम, तानपुरा एवं मंदिर घंटी धुन', 'Harmonium, Tanpura & Temple Bell synth')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <div className="flex items-end gap-0.5 h-5 px-2" aria-hidden="true">
                        <span className="w-1 bg-gold-400 rounded-full animate-pulse h-3" />
                        <span className="w-1 bg-saffron-400 rounded-full animate-bounce h-5" />
                        <span className="w-1 bg-gold-300 rounded-full animate-pulse h-4" />
                        <span className="w-1 bg-saffron-400 rounded-full animate-bounce h-2.5" />
                      </div>
                    )}
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-lg bg-maroon-800 text-gold-200 hover:bg-maroon-950"
                      aria-label="Toggle mute"
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {activeItem.audioUrl && (
                    <audio
                      ref={externalAudioRef}
                      src={activeItem.audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Large Readable Devanagari Verses */}
            <div className="p-5 sm:p-8 bg-cream-100 space-y-5">
              {activeItem.summaryEn && lang === 'en' && (
                <div className="p-3.5 rounded-xl bg-gold-50 border border-gold-300 text-sm text-maroon-900">
                  <strong>English Summary:</strong> {activeItem.summaryEn}
                </div>
              )}

              <div
                className={`space-y-5 ${
                  activeItem.category === 'article' ? 'text-left' : 'text-center'
                }`}
                style={{ fontSize: `${readerScale}rem` }}
              >
                {activeItem.verses.map((verse, idx) => {
                  const highlighted = isPlaying && activeVerseIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-300 whitespace-pre-line leading-loose font-serifHindi ${
                        highlighted
                          ? 'bg-saffron-100/90 text-maroon-900 ring-2 ring-saffron-500 shadow-md scale-[1.01] font-semibold'
                          : 'text-stone-800 hover:bg-cream-200/80'
                      }`}
                    >
                      {verse}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
