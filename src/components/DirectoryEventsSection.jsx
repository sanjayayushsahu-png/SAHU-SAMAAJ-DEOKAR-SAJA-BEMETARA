import React, { useState } from 'react';
import {
  Users,
  Building2,
  Calendar,
  Phone,
  MessageCircle,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { CG_DISTRICTS } from '../data/chhattisgarhData';
import { t, formatRelativeDate, shareOnWhatsApp } from '../utils/i18n';

export default function DirectoryEventsSection({
  lang,
  directory,
  dharmashalas,
  events,
  onToggleRsvp,
}) {
  const [subTab, setSubTab] = useState('directory'); // 'directory' | 'dharmashala' | 'events'
  const [districtFilter, setDistrictFilter] = useState('all');
  const [query, setQuery] = useState('');

  const matchSearch = (fields) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return fields.some((f) => String(f || '').toLowerCase().includes(q));
  };

  const filteredDirectory = directory.filter(
    (d) =>
      (districtFilter === 'all' || d.district === districtFilter) &&
      matchSearch([d.nameHi, d.nameEn, d.designationHi, d.designationEn, d.districtHi, d.blockHi])
  );

  const filteredDharmashalas = dharmashalas.filter(
    (dh) =>
      (districtFilter === 'all' || dh.district === districtFilter) &&
      matchSearch([dh.nameHi, dh.nameEn, dh.addressHi, dh.addressEn, dh.districtHi])
  );

  const filteredEvents = events.filter(
    (ev) =>
      (districtFilter === 'all' || ev.district === districtFilter) &&
      matchSearch([ev.titleHi, ev.titleEn, ev.venueHi, ev.venueEn, ev.districtHi])
  );

  const handleShareEvent = (ev) => {
    const text = `📅 *साहू समाज छत्तीसगढ़ — आगामी कार्यक्रम*\n\n*${ev.titleHi}*\n🗓 दिनांक: ${formatRelativeDate(
      ev.date,
      'hi'
    )}\n⏰ समय: ${ev.time}\n📍 स्थान: ${ev.venueHi} (${ev.districtHi})\n\n${ev.descriptionHi}\n\n🙏 जय भक्त माता कर्मा!`;
    shareOnWhatsApp(text);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="font-serifHindi text-2xl sm:text-3xl font-bold text-maroon-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-saffron-500" />
            {t(lang, 'पदाधिकारी, धर्मशाला एवं कार्यक्रम', 'Directory, Dharmashalas & Events')}
          </h2>
          <p className="text-sm text-stone-600">
            {t(
              lang,
              'बेमेतरा, दुर्ग, रायपुर, बिलासपुर सहित प्रदेश के सभी जिलों के पदाधिकारी, समाज भवन व आगामी आयोजन',
              'District-wise office bearers (Bemetara, Durg, Raipur, Bilaspur, etc.), Dharmashalas, and upcoming social events'
            )}
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="inline-flex bg-cream-300 p-1 rounded-2xl border border-gold-300 self-start">
          {[
            { id: 'directory', icon: Users, hi: 'पदाधिकारी', en: 'Directory' },
            { id: 'dharmashala', icon: Building2, hi: 'धर्मशाला', en: 'Dharmashala' },
            { id: 'events', icon: Calendar, hi: 'कार्यक्रम', en: 'Events' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  subTab === tab.id
                    ? 'bg-maroon-700 text-gold-100 shadow'
                    : 'text-maroon-800 hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(lang, tab.hi, tab.en)}
              </button>
            );
          })}
        </div>
      </div>

      {/* District Filter & Search Bar */}
      <div className="cream-card rounded-2xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-saffron-600 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              lang,
              'नाम, पद, जिला या धर्मशाला खोजें...',
              'Search by name, designation, district, or venue...'
            )}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gold-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500"
          />
        </div>
        <div className="sm:col-span-5 relative">
          <MapPin className="w-4 h-4 text-saffron-600 absolute left-3.5 top-3" />
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gold-300 bg-white text-sm font-semibold text-maroon-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
          >
            <option value="all">{t(lang, 'सभी जिले (छत्तीसगढ़)', 'All Districts (Chhattisgarh)')}</option>
            {CG_DISTRICTS.map((d) => (
              <option key={d.id} value={d.en}>
                {d.hi} ({d.en})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-Tab 1: District-wise Directory */}
      {subTab === 'directory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.map((member) => (
            <div
              key={member.id}
              className="cream-card rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-saffron-400 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron-500 to-maroon-700 text-white font-bold flex items-center justify-center shadow shrink-0">
                  {member.nameHi.replace(/श्री|श्रीमती|डॉ\./g, '').trim().slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-maroon-900 text-base leading-snug">
                    {lang === 'hi' ? member.nameHi : member.nameEn}
                  </h3>
                  <p className="text-xs font-semibold text-saffron-700 mt-0.5">
                    {lang === 'hi' ? member.designationHi : member.designationEn}
                  </p>
                  <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    <span>
                      {lang === 'hi' ? member.districtHi : member.district}
                      {member.blockHi ? ` • ${member.blockHi}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gold-200/80">
                <a
                  href={`tel:+91${member.phone}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-maroon-700 text-gold-100 text-xs font-bold hover:bg-maroon-800 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {t(lang, 'कॉल करें', 'Call')}
                </a>
                <a
                  href={`https://wa.me/91${member.phone}?text=${encodeURIComponent(
                    'जय कर्मा माता! साहू समाज छत्तीसगढ़ ऐप के माध्यम से संपर्क।'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          ))}

          {filteredDirectory.length === 0 && (
            <div className="col-span-full cream-card rounded-2xl p-8 text-center text-stone-500">
              {t(lang, 'इस जिले के लिए कोई पदाधिकारी नहीं मिला।', 'No directory entries found for this filter.')}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Dharmashala & Samaj Bhawan */}
      {subTab === 'dharmashala' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDharmashalas.map((dh) => (
            <div
              key={dh.id}
              className="cream-card rounded-2xl p-5 flex flex-col justify-between gap-4 border-l-4 border-l-saffron-500"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serifHindi text-xl font-bold text-maroon-900">
                    {lang === 'hi' ? dh.nameHi : dh.nameEn}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-100 text-maroon-900 border border-gold-300 text-xs font-bold shrink-0">
                    {lang === 'hi' ? dh.districtHi : dh.district}
                  </span>
                </div>
                <p className="text-sm text-stone-600 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
                  <span>{lang === 'hi' ? dh.addressHi : dh.addressEn}</span>
                </p>
                <p className="text-xs font-semibold text-maroon-800 bg-cream-300 inline-block px-3 py-1 rounded-lg">
                  {lang === 'hi' ? dh.capacity : dh.capacityEn}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dh.facilitiesHi.map((fac, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-saffron-50 text-saffron-800 border border-saffron-200 text-xs font-medium"
                    >
                      ✓ {fac}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gold-200/80 flex items-center justify-between gap-2">
                <span className="text-xs text-stone-500">
                  {t(lang, 'बुकिंग एवं जानकारी हेतु:', 'For booking & inquiries:')}
                </span>
                <a
                  href={`tel:+91${dh.phone}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-700 text-gold-100 text-xs font-bold hover:bg-maroon-800"
                >
                  <Phone className="w-3.5 h-3.5" />
                  +91 {dh.phone}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Tab 3: Upcoming Social Events Calendar */}
      {subTab === 'events' && (
        <div className="space-y-4">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="cream-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
            >
              <div className="flex items-start gap-4">
                {/* Calendar Date Badge */}
                <div className="w-16 rounded-2xl overflow-hidden border border-gold-400 text-center shrink-0 shadow-sm">
                  <div className="bg-maroon-700 text-gold-200 text-[10px] font-bold uppercase py-1">
                    {new Date(ev.date).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div className="bg-white py-2 text-2xl font-extrabold text-maroon-900">
                    {new Date(ev.date).getDate()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800 text-xs font-bold">
                      {lang === 'hi' ? ev.districtHi : ev.district}
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-saffron-500" />
                      {ev.time}
                    </span>
                  </div>
                  <h3 className="font-serifHindi text-lg sm:text-xl font-bold text-maroon-900">
                    {lang === 'hi' ? ev.titleHi : ev.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-maroon-600 shrink-0" />
                    {lang === 'hi' ? ev.venueHi : ev.venueEn}
                  </p>
                  <p className="text-sm text-stone-700 pt-0.5">
                    {lang === 'hi' ? ev.descriptionHi : ev.descriptionEn}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-row md:flex-col items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  onClick={() => onToggleRsvp(ev.id)}
                  className={`flex-1 md:w-44 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    ev.rsvpedByMe
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow hover:from-saffron-400 hover:to-saffron-500'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {ev.rsvpedByMe
                      ? t(lang, `उपस्थिति दर्ज (${ev.rsvpCount})`, `Going (${ev.rsvpCount})`)
                      : t(lang, `शामिल होंगे (${ev.rsvpCount})`, `I'll Attend (${ev.rsvpCount})`)}
                  </span>
                </button>
                <button
                  onClick={() => handleShareEvent(ev)}
                  className="md:w-44 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t(lang, 'WhatsApp निमंत्रण', 'Share Invite')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
