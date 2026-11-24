import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Pin,
  PlusCircle,
  BookOpen,
  Landmark,
  Calendar,
  RotateCcw,
  Megaphone,
  MapPin,
} from 'lucide-react';
import { CG_DISTRICTS, BEMETARA_REGIONS } from '../data/chhattisgarhData';
import { t, formatRelativeDate } from '../utils/i18n';

export default function AdminDashboard({
  lang,
  posts,
  sahitya,
  historyItems,
  events,
  requireApproval,
  setRequireApproval,
  onApprovePost,
  onDeletePost,
  onToggleFeatured,
  onAddSahitya,
  onDeleteSahitya,
  onAddHistory,
  onDeleteHistory,
  onAddEvent,
  onDeleteEvent,
  onResetDemo,
}) {
  const [tab, setTab] = useState('posts'); // 'posts' | 'sahitya' | 'history' | 'events'

  // Add Sahitya Form
  const [sCat, setSCat] = useState('bhajan');
  const [sTitleHi, setSTitleHi] = useState('');
  const [sTitleEn, setSTitleEn] = useState('');
  const [sAuthor, setSAuthor] = useState('');
  const [sAudioUrl, setSAudioUrl] = useState('');
  const [sVerses, setSVerses] = useState('');

  // Add History Form
  const [hEra, setHEra] = useState('');
  const [hTitleHi, setHTitleHi] = useState('');
  const [hSummary, setHSummary] = useState('');
  const [hDetails, setHDetails] = useState('');

  // Add Event Form
  const [eTitleHi, setETitleHi] = useState('');
  const [eDate, setEDate] = useState('2026-12-28');
  const [eTime, setETime] = useState('प्रातः 10:00 बजे');
  const [eDistrict, setEDistrict] = useState('Bemetara');
  const [eVenue, setEVenue] = useState('');
  const [eDesc, setEDesc] = useState('');

  const pendingPosts = posts.filter((p) => p.status === 'pending');
  const approvedPosts = posts.filter((p) => p.status === 'approved');

  const handleSahityaSubmit = (e) => {
    e.preventDefault();
    if (!sTitleHi.trim() || !sVerses.trim()) return;
    onAddSahitya({
      category: sCat,
      titleHi: sTitleHi.trim(),
      titleEn: sTitleEn.trim() || sTitleHi.trim(),
      authorHi: sAuthor.trim() || 'संजय कुमार साहू (संकलन)',
      authorEn: sAuthor.trim() || 'Curated by Admin',
      audioUrl: sAudioUrl.trim(),
      melodyKey: sCat === 'aarti' ? 'aarti' : 'bhajan1',
      tempo: 96,
      verses: sVerses
        .split(/\n\s*\n/)
        .map((v) => v.trim())
        .filter(Boolean),
    });
    setSTitleHi('');
    setSTitleEn('');
    setSAuthor('');
    setSAudioUrl('');
    setSVerses('');
  };

  const handleHistorySubmit = (e) => {
    e.preventDefault();
    if (!hTitleHi.trim() || !hDetails.trim()) return;
    onAddHistory({
      eraHi: hEra.trim() || 'ऐतिहासिक प्रसंग',
      eraEn: hEra.trim() || 'Historical Milestone',
      category: 'chhattisgarh',
      titleHi: hTitleHi.trim(),
      titleEn: hTitleHi.trim(),
      subtitleHi: 'साहू समाज छत्तीसगढ़ अभिलेख',
      subtitleEn: 'Sahu Samaj Chhattisgarh Archive',
      summaryHi: hSummary.trim() || hDetails.trim().slice(0, 120),
      summaryEn: hSummary.trim() || hDetails.trim().slice(0, 120),
      detailsHi: hDetails.trim(),
      detailsEn: hDetails.trim(),
    });
    setHEra('');
    setHTitleHi('');
    setHSummary('');
    setHDetails('');
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (!eTitleHi.trim() || !eVenue.trim()) return;
    const dObj = CG_DISTRICTS.find((d) => d.en === eDistrict) || CG_DISTRICTS[0];
    onAddEvent({
      titleHi: eTitleHi.trim(),
      titleEn: eTitleHi.trim(),
      date: eDate,
      time: eTime.trim(),
      district: dObj.en,
      districtHi: dObj.hi,
      venueHi: eVenue.trim(),
      venueEn: eVenue.trim(),
      descriptionHi: eDesc.trim(),
      descriptionEn: eDesc.trim(),
    });
    setETitleHi('');
    setEVenue('');
    setEDesc('');
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Super Admin Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-maroon-900 via-maroon-800 to-maroon-700 text-cream-100 p-5 sm:p-6 border-2 border-gold-500 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl gold-border-gradient p-0.5 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-maroon-900 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-gold-300" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/40">
              {t(lang, 'सुपर एडमिन नियंत्रण कक्ष', 'Super Admin Control Panel')}
            </span>
            <h2 className="font-serifHindi text-2xl font-bold text-gold-100 mt-1">
              {t(lang, 'संजय कुमार साहू (Super Admin • 9630273317)', 'Sanjay Kumar Sahu (Super Admin • 9630273317)')}
            </h2>
            <p className="text-xs text-gold-200/80">
              {t(
                lang,
                'पोस्ट स्वीकृति, प्रमुख घोषणा पिन, भजन-साहित्य, इतिहास एवं कार्यक्रम प्रबंधन',
                'Moderate community posts, feature announcements, and manage bhajans, heritage & events'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/25 border border-gold-400/40 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="accent-saffron-500 w-4 h-4"
            />
            {t(lang, 'पोस्ट पूर्व-स्वीकृति आवश्यक', 'Require Post Approval')}
          </label>
          <button
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-maroon-950/70 border border-gold-400/40 text-xs font-bold text-gold-200 hover:bg-maroon-950"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t(lang, 'डेमो डेटा रीसेट', 'Reset Demo Data')}
          </button>
        </div>
      </div>

      {/* Bemetara District Regions Showcase */}
      <div className="cream-card rounded-2xl p-4 sm:p-5 border-2 border-gold-400/70 bg-gradient-to-r from-cream-100 via-gold-50/60 to-saffron-50/50">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 font-serifHindi font-bold text-maroon-800 text-base sm:text-lg">
            <MapPin className="w-5 h-5 text-saffron-600" />
            <span>
              {t(
                lang,
                'जिला बेमेतरा — प्रमुख सामाजिक क्षेत्र एवं परिक्षेत्र',
                'Bemetara District — Key Community Regions'
              )}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-maroon-100 text-maroon-800 border border-maroon-200">
            {t(lang, '6 प्रमुख क्षेत्र सक्रिय', '6 Active Regions')}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {BEMETARA_REGIONS.map((region) => (
            <div
              key={region.id}
              className="rounded-xl bg-white border border-gold-400/70 px-3 py-2.5 text-center shadow-sm hover:border-saffron-500 hover:bg-saffron-50/40 transition-all"
            >
              <div className="font-bold text-maroon-900 text-sm sm:text-base">{region.hi}</div>
              <div className="text-[11px] text-saffron-700 font-medium">{region.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="cream-card rounded-2xl p-4">
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'लंबित पोस्ट', 'Pending Posts')}</div>
          <div className="text-2xl font-extrabold text-saffron-600 mt-1">{pendingPosts.length}</div>
        </div>
        <div className="cream-card rounded-2xl p-4">
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'प्रकाशित पोस्ट', 'Approved Posts')}</div>
          <div className="text-2xl font-extrabold text-maroon-800 mt-1">{approvedPosts.length}</div>
        </div>
        <div className="cream-card rounded-2xl p-4">
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'भजन व साहित्य', 'Sahitya Items')}</div>
          <div className="text-2xl font-extrabold text-gold-700 mt-1">{sahitya.length}</div>
        </div>
        <div className="cream-card rounded-2xl p-4">
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'इतिहास / कार्यक्रम', 'History / Events')}</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {historyItems.length} / {events.length}
          </div>
        </div>
      </div>

      {/* Admin Sub-Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'posts', icon: Megaphone, hi: `पोस्ट मॉडरेशन (${pendingPosts.length})`, en: `Moderation (${pendingPosts.length})` },
          { id: 'sahitya', icon: BookOpen, hi: 'भजन व साहित्य प्रबंधन', en: 'Manage Bhajans' },
          { id: 'history', icon: Landmark, hi: 'इतिहास प्रबंधन', en: 'Manage History' },
          { id: 'events', icon: Calendar, hi: 'कार्यक्रम प्रबंधन', en: 'Manage Events' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
                tab === item.id
                  ? 'bg-saffron-500 text-white border-saffron-600 shadow'
                  : 'bg-white text-maroon-800 border-gold-300 hover:bg-cream-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(lang, item.hi, item.en)}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Post Moderation */}
      {tab === 'posts' && (
        <div className="space-y-4">
          {pendingPosts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-maroon-800 text-lg">
                {t(lang, 'स्वीकृति हेतु लंबित पोस्ट', 'Pending Posts Awaiting Approval')}
              </h3>
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="cream-card rounded-2xl p-4 border-l-4 border-l-saffron-500 flex flex-col sm:flex-row justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-maroon-900">{post.titleHi}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {post.authorName} ({post.districtHi}) • {formatRelativeDate(post.createdAt, lang)}
                    </div>
                    <p className="text-sm text-stone-700 mt-2">{post.contentHi}</p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onApprovePost(post.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t(lang, 'स्वीकृत करें', 'Approve')}
                    </button>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t(lang, 'हटाएं', 'Delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-maroon-800 text-lg">
              {t(lang, 'सभी प्रकाशित पोस्ट (पिन / हटाएं)', 'Published Posts (Pin Announcement / Delete)')}
            </h3>
            {approvedPosts.map((post) => (
              <div
                key={post.id}
                className="cream-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {post.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-gold-200 text-maroon-900 text-[10px] font-bold">
                        📌 {t(lang, 'प्रमुख सूचना', 'Featured')}
                      </span>
                    )}
                    <span className="font-bold text-maroon-900 truncate">{post.titleHi}</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {post.authorName} ({post.districtHi}) • ❤️ {post.likes.length} • 💬 {post.comments.length}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onToggleFeatured(post.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      post.featured
                        ? 'bg-gold-200 text-maroon-900 border-gold-400'
                        : 'bg-cream-200 text-stone-700 border-gold-300 hover:bg-gold-100'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {post.featured ? t(lang, 'अनपिन', 'Unpin') : t(lang, 'पिन करें', 'Feature')}
                  </button>
                  <button
                    onClick={() => onDeletePost(post.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t(lang, 'हटाएं', 'Delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Manage Bhajans & Sahitya */}
      {tab === 'sahitya' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleSahityaSubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-saffron-500" />
              {t(lang, 'नया भजन / आरती / लेख जोड़ें', 'Add New Bhajan / Aarti / Article')}
            </h3>
            <select
              value={sCat}
              onChange={(e) => setSCat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm font-semibold"
            >
              <option value="aarti">माँ कर्मा आरती (Aarti)</option>
              <option value="bhajan">भजन (Bhajan)</option>
              <option value="poem">कविता (Poem)</option>
              <option value="article">सामाजिक लेख (Article)</option>
            </select>
            <input
              type="text"
              required
              value={sTitleHi}
              onChange={(e) => setSTitleHi(e.target.value)}
              placeholder={t(lang, 'शीर्षक (हिंदी में) *', 'Title in Hindi *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              value={sTitleEn}
              onChange={(e) => setSTitleEn(e.target.value)}
              placeholder={t(lang, 'शीर्षक (English - वैकल्पिक)', 'Title in English (optional)')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              value={sAuthor}
              onChange={(e) => setSAuthor(e.target.value)}
              placeholder={t(lang, 'रचनाकार / गायक का नाम', 'Author / Singer name')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="url"
              value={sAudioUrl}
              onChange={(e) => setSAudioUrl(e.target.value)}
              placeholder={t(lang, 'ऑडियो MP3 लिंक (वैकल्पिक)', 'Audio MP3 URL (optional)')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <textarea
              rows={5}
              required
              value={sVerses}
              onChange={(e) => setSVerses(e.target.value)}
              placeholder={t(
                lang,
                'पंक्तियाँ लिखें (नए छंद के लिए एक खाली लाइन छोड़ें)...',
                'Enter lyrics/paragraphs (leave a blank line between stanzas)...'
              )}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-saffron-500 text-white font-bold hover:bg-saffron-600"
            >
              {t(lang, 'संग्रह में जोड़ें', 'Save to Sahitya')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {sahitya.map((item) => (
              <div key={item.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                    {item.category}
                  </span>
                  <div className="font-bold text-maroon-900 mt-1">{item.titleHi}</div>
                  <div className="text-xs text-stone-500">{item.authorHi}</div>
                </div>
                <button
                  onClick={() => onDeleteSahitya(item.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Manage History */}
      {tab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleHistorySubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-saffron-500" />
              {t(lang, 'नया ऐतिहासिक प्रसंग जोड़ें', 'Add History Entry')}
            </h3>
            <input
              type="text"
              value={hEra}
              onChange={(e) => setHEra(e.target.value)}
              placeholder={t(lang, 'कालखंड / वर्ष (उदा. 1950 ई.)', 'Era / Year')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              value={hTitleHi}
              onChange={(e) => setHTitleHi(e.target.value)}
              placeholder={t(lang, 'शीर्षक *', 'Title *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              value={hSummary}
              onChange={(e) => setHSummary(e.target.value)}
              placeholder={t(lang, 'संक्षिप्त परिचय', 'Short summary')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <textarea
              rows={4}
              required
              value={hDetails}
              onChange={(e) => setHDetails(e.target.value)}
              placeholder={t(lang, 'विस्तृत विवरण *', 'Full historical details *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-maroon-700 text-gold-100 font-bold hover:bg-maroon-800"
            >
              {t(lang, 'इतिहास में जोड़ें', 'Add to Timeline')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {historyItems.map((h) => (
              <div key={h.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-saffron-700">{h.eraHi}</span>
                  <div className="font-bold text-maroon-900">{h.titleHi}</div>
                </div>
                <button
                  onClick={() => onDeleteHistory(h.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Manage Events */}
      {tab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleEventSubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-saffron-500" />
              {t(lang, 'नया सामाजिक कार्यक्रम जोड़ें', 'Add Upcoming Event')}
            </h3>
            <input
              type="text"
              required
              value={eTitleHi}
              onChange={(e) => setETitleHi(e.target.value)}
              placeholder={t(lang, 'कार्यक्रम का नाम *', 'Event Name *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={eDate}
                onChange={(e) => setEDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
              />
              <input
                type="text"
                value={eTime}
                onChange={(e) => setETime(e.target.value)}
                placeholder="प्रातः 10:00 बजे"
                className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
              />
            </div>
            <select
              value={eDistrict}
              onChange={(e) => setEDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            >
              {CG_DISTRICTS.map((d) => (
                <option key={d.id} value={d.en}>
                  {d.hi} ({d.en})
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={eVenue}
              onChange={(e) => setEVenue(e.target.value)}
              placeholder={t(lang, 'स्थान (भवन / मैदान) *', 'Venue *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <textarea
              rows={3}
              value={eDesc}
              onChange={(e) => setEDesc(e.target.value)}
              placeholder={t(lang, 'कार्यक्रम विवरण', 'Event description')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-saffron-500 text-white font-bold hover:bg-saffron-600"
            >
              {t(lang, 'कार्यक्रम प्रकाशित करें', 'Publish Event')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {events.map((ev) => (
              <div key={ev.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-saffron-700">
                    {ev.date} • {ev.districtHi}
                  </span>
                  <div className="font-bold text-maroon-900">{ev.titleHi}</div>
                  <div className="text-xs text-stone-500">{ev.venueHi}</div>
                </div>
                <button
                  onClick={() => onDeleteEvent(ev.id)}
                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
