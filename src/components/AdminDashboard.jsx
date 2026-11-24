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
  Users,
  Building2,
  Award,
  Pencil,
  X,
} from 'lucide-react';
import { CG_DISTRICTS, BEMETARA_REGIONS } from '../data/chhattisgarhData';
import { t, formatRelativeDate } from '../utils/i18n';

export default function AdminDashboard({
  lang,
  posts,
  sahitya,
  historyItems,
  events,
  directory,
  dharmashalas,
  samajRatna,
  requireApproval,
  setRequireApproval,
  onApprovePost,
  onDeletePost,
  onToggleFeatured,
  onAddSahitya,
  onUpdateSahitya,
  onDeleteSahitya,
  onAddHistory,
  onUpdateHistory,
  onDeleteHistory,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddDirectory,
  onUpdateDirectory,
  onDeleteDirectory,
  onAddDharmashala,
  onUpdateDharmashala,
  onDeleteDharmashala,
  onAddRatna,
  onUpdateRatna,
  onDeleteRatna,
  onResetDemo,
}) {
  const [tab, setTab] = useState('posts'); // 'posts' | 'directory' | 'dharmashala' | 'events' | 'sahitya' | 'history' | 'ratna'

  // --- Directory (पदाधिकारी) Form State ---
  const [editDirId, setEditDirId] = useState(null);
  const [dNameHi, setDNameHi] = useState('');
  const [dNameEn, setDNameEn] = useState('');
  const [dDesigHi, setDDesigHi] = useState('');
  const [dDistrict, setDDistrict] = useState('Bemetara');
  const [dBlockHi, setDBlockHi] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dWing, setDWing] = useState('main');

  // --- Dharmashala (धर्मशाला) Form State ---
  const [editDharId, setEditDharId] = useState(null);
  const [dhNameHi, setDhNameHi] = useState('');
  const [dhDistrict, setDhDistrict] = useState('Bemetara');
  const [dhAddressHi, setDhAddressHi] = useState('');
  const [dhCapacity, setDhCapacity] = useState('');
  const [dhFacilities, setDhFacilities] = useState('');
  const [dhPhone, setDhPhone] = useState('');

  // --- Event (कार्यक्रम) Form State ---
  const [editEvtId, setEditEvtId] = useState(null);
  const [eTitleHi, setETitleHi] = useState('');
  const [eDate, setEDate] = useState('2026-12-28');
  const [eTime, setETime] = useState('प्रातः 10:00 बजे');
  const [eDistrict, setEDistrict] = useState('Bemetara');
  const [eVenue, setEVenue] = useState('');
  const [eDesc, setEDesc] = useState('');

  // --- Sahitya (भजन व साहित्य) Form State ---
  const [editSahityaId, setEditSahityaId] = useState(null);
  const [sCat, setSCat] = useState('bhajan');
  const [sTitleHi, setSTitleHi] = useState('');
  const [sTitleEn, setSTitleEn] = useState('');
  const [sAuthor, setSAuthor] = useState('');
  const [sAudioUrl, setSAudioUrl] = useState('');
  const [sVerses, setSVerses] = useState('');

  // --- History (इतिहास) Form State ---
  const [editHistId, setEditHistId] = useState(null);
  const [hEra, setHEra] = useState('');
  const [hTitleHi, setHTitleHi] = useState('');
  const [hSummary, setHSummary] = useState('');
  const [hDetails, setHDetails] = useState('');

  // --- Samaj Ratna (समाज रत्न) Form State ---
  const [editRatnaId, setEditRatnaId] = useState(null);
  const [rNameHi, setRNameHi] = useState('');
  const [rCategory, setRCategory] = useState('social');
  const [rDistrict, setRDistrict] = useState('Bemetara');
  const [rAchievementHi, setRAchievementHi] = useState('');
  const [rBioHi, setRBioHi] = useState('');

  const pendingPosts = posts.filter((p) => p.status === 'pending');
  const approvedPosts = posts.filter((p) => p.status === 'approved');

  // Directory Submit / Edit
  const resetDirForm = () => {
    setEditDirId(null);
    setDNameHi('');
    setDNameEn('');
    setDDesigHi('');
    setDDistrict('Bemetara');
    setDBlockHi('');
    setDPhone('');
    setDWing('main');
  };

  const handleDirSubmit = (e) => {
    e.preventDefault();
    if (!dNameHi.trim() || !dDesigHi.trim()) return;
    const dObj = CG_DISTRICTS.find((d) => d.en === dDistrict) || CG_DISTRICTS[0];
    const payload = {
      nameHi: dNameHi.trim(),
      nameEn: dNameEn.trim() || dNameHi.trim(),
      designationHi: dDesigHi.trim(),
      designationEn: dDesigHi.trim(),
      district: dObj.en,
      districtHi: dObj.hi,
      blockHi: dBlockHi.trim(),
      phone: dPhone.replace(/\D/g, ''),
      wing: dWing,
    };
    if (editDirId) {
      onUpdateDirectory(editDirId, payload);
    } else {
      onAddDirectory(payload);
    }
    resetDirForm();
  };

  const startEditDir = (m) => {
    setEditDirId(m.id);
    setDNameHi(m.nameHi || '');
    setDNameEn(m.nameEn || '');
    setDDesigHi(m.designationHi || '');
    setDDistrict(m.district || 'Bemetara');
    setDBlockHi(m.blockHi || '');
    setDPhone(m.phone || '');
    setDWing(m.wing || 'main');
  };

  // Dharmashala Submit / Edit
  const resetDharForm = () => {
    setEditDharId(null);
    setDhNameHi('');
    setDhDistrict('Bemetara');
    setDhAddressHi('');
    setDhCapacity('');
    setDhFacilities('');
    setDhPhone('');
  };

  const handleDharSubmit = (e) => {
    e.preventDefault();
    if (!dhNameHi.trim() || !dhAddressHi.trim()) return;
    const dObj = CG_DISTRICTS.find((d) => d.en === dhDistrict) || CG_DISTRICTS[0];
    const facilitiesArr = dhFacilities
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      nameHi: dhNameHi.trim(),
      nameEn: dhNameHi.trim(),
      district: dObj.en,
      districtHi: dObj.hi,
      addressHi: dhAddressHi.trim(),
      addressEn: dhAddressHi.trim(),
      capacity: dhCapacity.trim() || 'सामाजिक भवन',
      capacityEn: dhCapacity.trim() || 'Community Hall',
      facilitiesHi: facilitiesArr.length > 0 ? facilitiesArr : ['सभागार', 'पेयजल', 'पार्किंग'],
      phone: dhPhone.replace(/\D/g, ''),
    };
    if (editDharId) {
      onUpdateDharmashala(editDharId, payload);
    } else {
      onAddDharmashala(payload);
    }
    resetDharForm();
  };

  const startEditDhar = (dh) => {
    setEditDharId(dh.id);
    setDhNameHi(dh.nameHi || '');
    setDhDistrict(dh.district || 'Bemetara');
    setDhAddressHi(dh.addressHi || '');
    setDhCapacity(dh.capacity || '');
    setDhFacilities((dh.facilitiesHi || []).join(', '));
    setDhPhone(dh.phone || '');
  };

  // Event Submit / Edit
  const resetEvtForm = () => {
    setEditEvtId(null);
    setETitleHi('');
    setEDate('2026-12-28');
    setETime('प्रातः 10:00 बजे');
    setEDistrict('Bemetara');
    setEVenue('');
    setEDesc('');
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (!eTitleHi.trim() || !eVenue.trim()) return;
    const dObj = CG_DISTRICTS.find((d) => d.en === eDistrict) || CG_DISTRICTS[0];
    const payload = {
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
    };
    if (editEvtId) {
      onUpdateEvent(editEvtId, payload);
    } else {
      onAddEvent(payload);
    }
    resetEvtForm();
  };

  const startEditEvt = (ev) => {
    setEditEvtId(ev.id);
    setETitleHi(ev.titleHi || '');
    setEDate(ev.date || '2026-12-28');
    setETime(ev.time || '');
    setEDistrict(ev.district || 'Bemetara');
    setEVenue(ev.venueHi || '');
    setEDesc(ev.descriptionHi || '');
  };

  // Sahitya Submit / Edit
  const resetSahityaForm = () => {
    setEditSahityaId(null);
    setSCat('bhajan');
    setSTitleHi('');
    setSTitleEn('');
    setSAuthor('');
    setSAudioUrl('');
    setSVerses('');
  };

  const handleSahityaSubmit = (e) => {
    e.preventDefault();
    if (!sTitleHi.trim() || !sVerses.trim()) return;
    const payload = {
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
    };
    if (editSahityaId) {
      onUpdateSahitya(editSahityaId, payload);
    } else {
      onAddSahitya(payload);
    }
    resetSahityaForm();
  };

  const startEditSahitya = (item) => {
    setEditSahityaId(item.id);
    setSCat(item.category || 'bhajan');
    setSTitleHi(item.titleHi || '');
    setSTitleEn(item.titleEn || '');
    setSAuthor(item.authorHi || '');
    setSAudioUrl(item.audioUrl || '');
    setSVerses((item.verses || []).join('\n\n'));
  };

  // History Submit / Edit
  const resetHistForm = () => {
    setEditHistId(null);
    setHEra('');
    setHTitleHi('');
    setHSummary('');
    setHDetails('');
  };

  const handleHistorySubmit = (e) => {
    e.preventDefault();
    if (!hTitleHi.trim() || !hDetails.trim()) return;
    const payload = {
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
    };
    if (editHistId) {
      onUpdateHistory(editHistId, payload);
    } else {
      onAddHistory(payload);
    }
    resetHistForm();
  };

  const startEditHist = (h) => {
    setEditHistId(h.id);
    setHEra(h.eraHi || '');
    setHTitleHi(h.titleHi || '');
    setHSummary(h.summaryHi || '');
    setHDetails(h.detailsHi || '');
  };

  // Samaj Ratna Submit / Edit
  const resetRatnaForm = () => {
    setEditRatnaId(null);
    setRNameHi('');
    setRCategory('social');
    setRDistrict('Bemetara');
    setRAchievementHi('');
    setRBioHi('');
  };

  const handleRatnaSubmit = (e) => {
    e.preventDefault();
    if (!rNameHi.trim() || !rAchievementHi.trim()) return;
    const dObj = CG_DISTRICTS.find((d) => d.en === rDistrict) || CG_DISTRICTS[0];
    const cleanName = rNameHi.trim();
    const payload = {
      nameHi: cleanName,
      nameEn: cleanName,
      category: rCategory,
      districtHi: dObj.hi,
      districtEn: dObj.en,
      achievementHi: rAchievementHi.trim(),
      achievementEn: rAchievementHi.trim(),
      bioHi: rBioHi.trim() || rAchievementHi.trim(),
      bioEn: rBioHi.trim() || rAchievementHi.trim(),
      initials: cleanName.replace(/डॉ\.|श्री|श्रीमती|प्रो\./g, '').trim().slice(0, 2),
    };
    if (editRatnaId) {
      onUpdateRatna(editRatnaId, payload);
    } else {
      onAddRatna(payload);
    }
    resetRatnaForm();
  };

  const startEditRatna = (r) => {
    setEditRatnaId(r.id);
    setRNameHi(r.nameHi || '');
    setRCategory(r.category || 'social');
    setRDistrict(r.districtEn || 'Bemetara');
    setRAchievementHi(r.achievementHi || '');
    setRBioHi(r.bioHi || '');
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
                'सभी अनुभागों (पोस्ट, पदाधिकारी, धर्मशाला, कार्यक्रम, भजन, इतिहास व समाज रत्न) का Add / Edit / Delete नियंत्रण',
                'Full Add / Edit / Delete management for Posts, Directory, Dharmashalas, Events, Sahitya, History & Samaj Ratna'
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
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'लंबित / प्रकाशित पोस्ट', 'Pending / Live Posts')}</div>
          <div className="text-2xl font-extrabold text-saffron-600 mt-1">
            {pendingPosts.length} / {approvedPosts.length}
          </div>
        </div>
        <div className="cream-card rounded-2xl p-4">
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'पदाधिकारी / धर्मशाला', 'Directory / Halls')}</div>
          <div className="text-2xl font-extrabold text-maroon-800 mt-1">
            {directory.length} / {dharmashalas.length}
          </div>
        </div>
        <div className="cream-card rounded-2xl p-4">
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'कार्यक्रम / भजन', 'Events / Sahitya')}</div>
          <div className="text-2xl font-extrabold text-gold-700 mt-1">
            {events.length} / {sahitya.length}
          </div>
        </div>
        <div className="cream-card rounded-2xl p-4">
          <div className="text-xs text-stone-500 font-semibold">{t(lang, 'इतिहास / समाज रत्न', 'History / Ratna')}</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {historyItems.length} / {samajRatna.length}
          </div>
        </div>
      </div>

      {/* Admin Sub-Navigation (All 7 Manageable Sections) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'posts', icon: Megaphone, hi: `पोस्ट (${pendingPosts.length})`, en: `Posts (${pendingPosts.length})` },
          { id: 'directory', icon: Users, hi: `पदाधिकारी (${directory.length})`, en: `Directory (${directory.length})` },
          { id: 'dharmashala', icon: Building2, hi: `धर्मशाला (${dharmashalas.length})`, en: `Dharmashala (${dharmashalas.length})` },
          { id: 'events', icon: Calendar, hi: `कार्यक्रम (${events.length})`, en: `Events (${events.length})` },
          { id: 'sahitya', icon: BookOpen, hi: `भजन-साहित्य (${sahitya.length})`, en: `Sahitya (${sahitya.length})` },
          { id: 'history', icon: Landmark, hi: `इतिहास (${historyItems.length})`, en: `History (${historyItems.length})` },
          { id: 'ratna', icon: Award, hi: `समाज रत्न (${samajRatna.length})`, en: `Samaj Ratna (${samajRatna.length})` },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
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

      {/* TAB 2: Manage Directory (पदाधिकारी - Add / Edit / Delete) */}
      {tab === 'directory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleDirSubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-saffron-500" />
                {editDirId
                  ? t(lang, 'पदाधिकारी संपादित करें', 'Edit Office Bearer')
                  : t(lang, 'नए पदाधिकारी जोड़ें', 'Add Office Bearer')}
              </h3>
              {editDirId && (
                <button type="button" onClick={resetDirForm} className="text-xs font-bold text-stone-500 hover:text-maroon-800 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> {t(lang, 'रद्द करें', 'Cancel')}
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={dNameHi}
              onChange={(e) => setDNameHi(e.target.value)}
              placeholder={t(lang, 'पदाधिकारी का नाम (हिंदी में) *', 'Full Name (Hindi) *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              value={dNameEn}
              onChange={(e) => setDNameEn(e.target.value)}
              placeholder={t(lang, 'नाम (English - वैकल्पिक)', 'Name (English - optional)')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              value={dDesigHi}
              onChange={(e) => setDDesigHi(e.target.value)}
              placeholder={t(lang, 'पद / दायित्व (उदा. तहसील अध्यक्ष साजा) *', 'Designation *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={dDistrict}
                onChange={(e) => setDDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
              >
                {CG_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.en}>
                    {d.hi} ({d.en})
                  </option>
                ))}
              </select>
              <select
                value={dWing}
                onChange={(e) => setDWing(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
              >
                <option value="main">मुख्य इकाई (Main)</option>
                <option value="youth">युवा प्रकोष्ठ (Youth)</option>
                <option value="women">महिला प्रकोष्ठ (Women)</option>
              </select>
            </div>
            <input
              type="text"
              value={dBlockHi}
              onChange={(e) => setDBlockHi(e.target.value)}
              placeholder={t(lang, 'क्षेत्र / विकासखंड (उदा. देवकर / साजा / परपोड़ी)', 'Region / Block')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            {dDistrict === 'Bemetara' && (
              <div className="flex flex-wrap gap-1">
                {BEMETARA_REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setDBlockHi(r.hi)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      dBlockHi === r.hi
                        ? 'bg-saffron-500 text-white border-saffron-600'
                        : 'bg-cream-200 text-maroon-800 border-gold-300'
                    }`}
                  >
                    {r.hi}
                  </button>
                ))}
              </div>
            )}
            <input
              type="tel"
              maxLength={10}
              required
              value={dPhone}
              onChange={(e) => setDPhone(e.target.value.replace(/\D/g, ''))}
              placeholder={t(lang, 'मोबाइल नंबर (10 अंक) *', '10-digit Mobile Number *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-saffron-500 text-white font-bold hover:bg-saffron-600"
            >
              {editDirId ? t(lang, 'बदलाव सेव करें', 'Save Changes') : t(lang, 'पदाधिकारी जोड़ें', 'Add Member')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {directory.map((m) => (
              <div key={m.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-maroon-900">{m.nameHi}</div>
                  <div className="text-xs font-semibold text-saffron-700">{m.designationHi}</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {m.districtHi} {m.blockHi ? `• ${m.blockHi}` : ''} • 📞 {m.phone}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditDir(m)}
                    className="p-2 rounded-xl bg-gold-100 text-maroon-800 hover:bg-gold-200"
                    title={t(lang, 'संपादित करें', 'Edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDirectory(m.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                    title={t(lang, 'हटाएं', 'Delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Manage Dharmashalas (धर्मशाला - Add / Edit / Delete) */}
      {tab === 'dharmashala' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleDharSubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-saffron-500" />
                {editDharId
                  ? t(lang, 'धर्मशाला संपादित करें', 'Edit Dharmashala')
                  : t(lang, 'नई धर्मशाला / समाज भवन जोड़ें', 'Add Dharmashala')}
              </h3>
              {editDharId && (
                <button type="button" onClick={resetDharForm} className="text-xs font-bold text-stone-500 hover:text-maroon-800 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> {t(lang, 'रद्द करें', 'Cancel')}
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={dhNameHi}
              onChange={(e) => setDhNameHi(e.target.value)}
              placeholder={t(lang, 'धर्मशाला / भवन का नाम *', 'Dharmashala / Hall Name *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <select
              value={dhDistrict}
              onChange={(e) => setDhDistrict(e.target.value)}
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
              value={dhAddressHi}
              onChange={(e) => setDhAddressHi(e.target.value)}
              placeholder={t(lang, 'पूरा पता *', 'Full Address *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              value={dhCapacity}
              onChange={(e) => setDhCapacity(e.target.value)}
              placeholder={t(lang, 'क्षमता (उदा. 500 व्यक्ति • 15 कमरे)', 'Capacity (e.g. 500 guests • 15 rooms)')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="text"
              value={dhFacilities}
              onChange={(e) => setDhFacilities(e.target.value)}
              placeholder={t(lang, 'सुविधाएं (कॉमा से अलग: विवाह मंडप, पार्किंग, भोजनशाला)', 'Facilities (comma-separated)')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <input
              type="tel"
              maxLength={10}
              value={dhPhone}
              onChange={(e) => setDhPhone(e.target.value.replace(/\D/g, ''))}
              placeholder={t(lang, 'बुकिंग संपर्क नंबर (10 अंक)', 'Booking Contact Number')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-saffron-500 text-white font-bold hover:bg-saffron-600"
            >
              {editDharId ? t(lang, 'बदलाव सेव करें', 'Save Changes') : t(lang, 'धर्मशाला जोड़ें', 'Add Dharmashala')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {dharmashalas.map((dh) => (
              <div key={dh.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-saffron-700">{dh.districtHi}</span>
                  <div className="font-bold text-maroon-900">{dh.nameHi}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{dh.addressHi}</div>
                  <div className="text-xs text-stone-500">📞 {dh.phone}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditDhar(dh)}
                    className="p-2 rounded-xl bg-gold-100 text-maroon-800 hover:bg-gold-200"
                    title={t(lang, 'संपादित करें', 'Edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteDharmashala(dh.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                    title={t(lang, 'हटाएं', 'Delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Manage Events (कार्यक्रम - Add / Edit / Delete) */}
      {tab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleEventSubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-saffron-500" />
                {editEvtId
                  ? t(lang, 'कार्यक्रम संपादित करें', 'Edit Event')
                  : t(lang, 'नया सामाजिक कार्यक्रम जोड़ें', 'Add Upcoming Event')}
              </h3>
              {editEvtId && (
                <button type="button" onClick={resetEvtForm} className="text-xs font-bold text-stone-500 hover:text-maroon-800 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> {t(lang, 'रद्द करें', 'Cancel')}
                </button>
              )}
            </div>
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
              {editEvtId ? t(lang, 'बदलाव सेव करें', 'Save Changes') : t(lang, 'कार्यक्रम प्रकाशित करें', 'Publish Event')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {events.map((ev) => (
              <div key={ev.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-saffron-700">
                    {ev.date} • {ev.districtHi}
                  </span>
                  <div className="font-bold text-maroon-900">{ev.titleHi}</div>
                  <div className="text-xs text-stone-500">{ev.venueHi}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditEvt(ev)}
                    className="p-2 rounded-xl bg-gold-100 text-maroon-800 hover:bg-gold-200"
                    title={t(lang, 'संपादित करें', 'Edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteEvent(ev.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                    title={t(lang, 'हटाएं', 'Delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Manage Sahitya & Bhajans (Add / Edit / Delete) */}
      {tab === 'sahitya' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleSahityaSubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-saffron-500" />
                {editSahityaId
                  ? t(lang, 'भजन / साहित्य संपादित करें', 'Edit Sahitya')
                  : t(lang, 'नया भजन / आरती / लेख जोड़ें', 'Add New Sahitya')}
              </h3>
              {editSahityaId && (
                <button type="button" onClick={resetSahityaForm} className="text-xs font-bold text-stone-500 hover:text-maroon-800 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> {t(lang, 'रद्द करें', 'Cancel')}
                </button>
              )}
            </div>
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
              {editSahityaId ? t(lang, 'बदलाव सेव करें', 'Save Changes') : t(lang, 'संग्रह में जोड़ें', 'Save to Sahitya')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {sahitya.map((item) => (
              <div key={item.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800">
                    {item.category}
                  </span>
                  <div className="font-bold text-maroon-900 mt-1">{item.titleHi}</div>
                  <div className="text-xs text-stone-500">{item.authorHi}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditSahitya(item)}
                    className="p-2 rounded-xl bg-gold-100 text-maroon-800 hover:bg-gold-200"
                    title={t(lang, 'संपादित करें', 'Edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteSahitya(item.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                    title={t(lang, 'हटाएं', 'Delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Manage History (Add / Edit / Delete) */}
      {tab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleHistorySubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-saffron-500" />
                {editHistId
                  ? t(lang, 'इतिहास प्रसंग संपादित करें', 'Edit History Entry')
                  : t(lang, 'नया ऐतिहासिक प्रसंग जोड़ें', 'Add History Entry')}
              </h3>
              {editHistId && (
                <button type="button" onClick={resetHistForm} className="text-xs font-bold text-stone-500 hover:text-maroon-800 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> {t(lang, 'रद्द करें', 'Cancel')}
                </button>
              )}
            </div>
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
              {editHistId ? t(lang, 'बदलाव सेव करें', 'Save Changes') : t(lang, 'इतिहास में जोड़ें', 'Add to Timeline')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {historyItems.map((h) => (
              <div key={h.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-saffron-700">{h.eraHi}</span>
                  <div className="font-bold text-maroon-900">{h.titleHi}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditHist(h)}
                    className="p-2 rounded-xl bg-gold-100 text-maroon-800 hover:bg-gold-200"
                    title={t(lang, 'संपादित करें', 'Edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteHistory(h.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                    title={t(lang, 'हटाएं', 'Delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: Manage Samaj Ratna (समाज रत्न - Add / Edit / Delete) */}
      {tab === 'ratna' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={handleRatnaSubmit} className="lg:col-span-5 cream-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-maroon-800 text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-saffron-500" />
                {editRatnaId
                  ? t(lang, 'समाज रत्न संपादित करें', 'Edit Samaj Ratna')
                  : t(lang, 'नया समाज रत्न जोड़ें', 'Add Samaj Ratna')}
              </h3>
              {editRatnaId && (
                <button type="button" onClick={resetRatnaForm} className="text-xs font-bold text-stone-500 hover:text-maroon-800 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> {t(lang, 'रद्द करें', 'Cancel')}
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={rNameHi}
              onChange={(e) => setRNameHi(e.target.value)}
              placeholder={t(lang, 'व्यक्तित्व का नाम *', 'Achiever Name *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={rCategory}
                onChange={(e) => setRCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
              >
                <option value="admin">प्रशासन (IAS/PSC)</option>
                <option value="education">शिक्षा व चिकित्सा</option>
                <option value="literature">साहित्य व संस्कृति</option>
                <option value="social">समाजसेवा</option>
                <option value="business">कृषि व उद्योग</option>
                <option value="sports">खेलकूद</option>
              </select>
              <select
                value={rDistrict}
                onChange={(e) => setRDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
              >
                {CG_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.en}>
                    {d.hi} ({d.en})
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              value={rAchievementHi}
              onChange={(e) => setRAchievementHi(e.target.value)}
              placeholder={t(lang, 'प्रमुख उपलब्धि *', 'Key Achievement *')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <textarea
              rows={3}
              value={rBioHi}
              onChange={(e) => setRBioHi(e.target.value)}
              placeholder={t(lang, 'संक्षिप्त जीवन परिचय', 'Short biography')}
              className="w-full px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-maroon-700 text-gold-100 font-bold hover:bg-maroon-800"
            >
              {editRatnaId ? t(lang, 'बदलाव सेव करें', 'Save Changes') : t(lang, 'समाज रत्न जोड़ें', 'Add Samaj Ratna')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {samajRatna.map((r) => (
              <div key={r.id} className="cream-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-saffron-700">{r.districtHi}</span>
                  <div className="font-bold text-maroon-900">{r.nameHi}</div>
                  <div className="text-xs text-stone-500 line-clamp-1">{r.achievementHi}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditRatna(r)}
                    className="p-2 rounded-xl bg-gold-100 text-maroon-800 hover:bg-gold-200"
                    title={t(lang, 'संपादित करें', 'Edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteRatna(r.id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                    title={t(lang, 'हटाएं', 'Delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
