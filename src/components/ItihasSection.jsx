import React, { useState } from 'react';
import { Landmark, Award, ChevronDown, ChevronUp, MapPin, Sparkles, X } from 'lucide-react';
import { t } from '../utils/i18n';

export default function ItihasSection({ lang, historyItems, samajRatna }) {
  const [expandedId, setExpandedId] = useState(historyItems[0]?.id || null);
  const [ratnaFilter, setRatnaFilter] = useState('all');
  const [selectedRatna, setSelectedRatna] = useState(null);

  const ratnaCategories = [
    { id: 'all', hi: 'सभी गौरव', en: 'All' },
    { id: 'admin', hi: 'प्रशासन (IAS/PSC)', en: 'Civil Services' },
    { id: 'education', hi: 'शिक्षा व चिकित्सा', en: 'Education & Medicine' },
    { id: 'literature', hi: 'साहित्य व संस्कृति', en: 'Literature' },
    { id: 'social', hi: 'समाजसेवा', en: 'Social Service' },
    { id: 'business', hi: 'कृषि व उद्योग', en: 'Agri & Business' },
    { id: 'sports', hi: 'खेलकूद', en: 'Sports' },
  ];

  const filteredRatna = samajRatna.filter(
    (r) => ratnaFilter === 'all' || r.category === ratnaFilter
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-10">
      {/* Part 1: Structured Historical Timeline */}
      <section className="space-y-5">
        <div>
          <h2 className="font-serifHindi text-2xl sm:text-3xl font-bold text-maroon-800 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-saffron-500" />
            {t(lang, 'इतिहास एवं गौरवशाली परंपरा', 'History & Glorious Heritage')}
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            {t(
              lang,
              'भक्त माता कर्मा का जीवन चरित, दानवीर भामाशाह का त्याग तथा छत्तीसगढ़ में साहू समाज का इतिहास',
              'Biography of Bhakt Maa Karma, legacy of Daanveer Bhamashah, and history of Sahu Samaj in Chhattisgarh'
            )}
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative pl-6 sm:pl-8 border-l-4 border-gold-500/70 space-y-5">
          {historyItems.map((item) => {
            const isOpen = expandedId === item.id;
            return (
              <div key={item.id} className="relative">
                {/* Timeline Gold Node */}
                <span className="absolute -left-[34px] sm:-left-[42px] top-5 w-5 h-5 rounded-full bg-saffron-500 border-4 border-cream-200 ring-2 ring-gold-500 shadow" />

                <div className="cream-card rounded-2xl overflow-hidden transition-all hover:border-saffron-400">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    className="w-full text-left p-4 sm:p-6 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block px-3 py-0.5 rounded-full bg-maroon-100 text-maroon-800 border border-maroon-200 text-xs font-bold">
                        {lang === 'hi' ? item.eraHi : item.eraEn}
                      </span>
                      <h3 className="font-serifHindi text-xl sm:text-2xl font-bold text-maroon-900">
                        {lang === 'hi' ? item.titleHi : item.titleEn}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-saffron-700">
                        {lang === 'hi' ? item.subtitleHi : item.subtitleEn}
                      </p>
                      <p className="text-sm text-stone-700 leading-relaxed pt-1">
                        {lang === 'hi' ? item.summaryHi : item.summaryEn}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-cream-300 text-maroon-800 shrink-0 mt-1">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-gold-200/80 bg-cream-200/60">
                      <p className="text-stone-800 leading-loose text-base">
                        {lang === 'hi' ? item.detailsHi : item.detailsEn}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Part 2: Samaj Ratna Gallery */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h2 className="font-serifHindi text-2xl sm:text-3xl font-bold text-maroon-800 flex items-center gap-2">
              <Award className="w-6 h-6 text-gold-600" />
              {t(lang, 'समाज रत्न दीर्घा (गौरव)', 'Samaj Ratna Gallery (Achievers)')}
            </h2>
            <p className="text-sm text-stone-600 mt-0.5">
              {t(
                lang,
                'छत्तीसगढ़ एवं देश में समाज का मान बढ़ाने वाले प्रेरणादायी व्यक्तित्व',
                'Notable achievers bringing pride to Sahu Samaj across Chhattisgarh and India'
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {ratnaCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setRatnaFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                  ratnaFilter === cat.id
                    ? 'bg-maroon-700 text-gold-100 border-maroon-800 shadow-sm'
                    : 'bg-white text-stone-700 border-gold-300 hover:bg-cream-300'
                }`}
              >
                {t(lang, cat.hi, cat.en)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRatna.map((person) => (
            <div
              key={person.id}
              onClick={() => setSelectedRatna(person)}
              className="cream-card rounded-2xl p-5 cursor-pointer hover:border-saffron-500 hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-2xl gold-border-gradient p-0.5 shrink-0 shadow">
                  <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-maroon-800 to-maroon-900 text-gold-200 font-bold text-lg flex items-center justify-center">
                    {person.initials || person.nameHi.slice(0, 2)}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-maroon-900 text-base leading-snug">
                    {lang === 'hi' ? person.nameHi : person.nameEn}
                  </h3>
                  <div className="inline-flex items-center gap-1 text-xs text-saffron-700 font-semibold mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {lang === 'hi' ? person.districtHi : person.districtEn}
                  </div>
                </div>
              </div>

              <p className="text-sm text-stone-700 leading-relaxed">
                {lang === 'hi' ? person.achievementHi : person.achievementEn}
              </p>

              <div className="pt-2 border-t border-gold-200/70 flex items-center justify-between text-xs font-bold text-maroon-700">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                  {t(lang, 'समाज रत्न', 'Samaj Ratna')}
                </span>
                <span className="text-saffron-600">{t(lang, 'विस्तार से पढ़ें →', 'Read more →')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Samaj Ratna Detail Modal */}
      {selectedRatna && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          onClick={() => setSelectedRatna(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-cream-100 border-2 border-gold-500 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-maroon-800 to-saffron-700 text-cream-100 p-5 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-gold-300 uppercase tracking-wider">
                  {t(lang, 'समाज रत्न सम्मान', 'Samaj Ratna Honoree')}
                </div>
                <h3 className="font-serifHindi text-xl font-bold text-gold-100 mt-1">
                  {lang === 'hi' ? selectedRatna.nameHi : selectedRatna.nameEn}
                </h3>
                <div className="text-xs text-gold-200 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {lang === 'hi' ? selectedRatna.districtHi : selectedRatna.districtEn}
                </div>
              </div>
              <button
                onClick={() => setSelectedRatna(null)}
                className="p-1.5 rounded-lg bg-black/20 text-gold-100 hover:bg-black/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 rounded-xl bg-saffron-50 border border-saffron-200 text-sm font-semibold text-maroon-900">
                {lang === 'hi' ? selectedRatna.achievementHi : selectedRatna.achievementEn}
              </div>
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                {lang === 'hi' ? selectedRatna.bioHi : selectedRatna.bioEn}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
