import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, Phone, MapPin, Home, User } from 'lucide-react';
import { CG_DISTRICTS, BEMETARA_REGIONS, SUPER_ADMIN_USER } from '../data/chhattisgarhData';
import { t } from '../utils/i18n';
import { api, setAuthToken } from '../utils/api';

export default function AuthModal({ isOpen, onClose, lang, onLogin, serverConnected }) {
  const [mode, setMode] = useState('member'); // 'member' | 'admin'
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [district, setDistrict] = useState('Bemetara');
  const [blockVillage, setBlockVillage] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!name.trim()) {
      setError(t(lang, 'कृपया अपना पूरा नाम दर्ज करें।', 'Please enter your full name.'));
      return;
    }
    if (cleanMobile.length !== 10) {
      setError(
        t(lang, 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।', 'Please enter a valid 10-digit mobile number.')
      );
      return;
    }
    if (!blockVillage.trim()) {
      setError(
        t(lang, 'कृपया अपना विकासखंड या ग्राम दर्ज करें।', 'Please enter your Block or Village.')
      );
      return;
    }

    const distObj = CG_DISTRICTS.find((d) => d.en === district) || CG_DISTRICTS[0];
    setSubmitting(true);
    try {
      if (serverConnected) {
        const res = await api.loginMember({
          name: name.trim(),
          mobile: cleanMobile,
          district: distObj.en,
          districtHi: distObj.hi,
          blockVillage: blockVillage.trim(),
        });
        setAuthToken(res.token);
        onLogin(res.user);
        onClose();
        return;
      }
    } catch {
      // Fallback to local session if server unavailable
    } finally {
      setSubmitting(false);
    }

    const isSuperAdminMobile = cleanMobile === SUPER_ADMIN_USER.mobile;
    onLogin(
      isSuperAdminMobile
        ? SUPER_ADMIN_USER
        : {
            id: `member-${cleanMobile}`,
            name: name.trim(),
            nameHi: name.trim(),
            mobile: cleanMobile,
            district: distObj.en,
            districtHi: distObj.hi,
            blockVillage: blockVillage.trim(),
            role: 'member',
          }
    );
    onClose();
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (serverConnected) {
        const res = await api.loginAdmin(adminPin.trim());
        setAuthToken(res.token);
        onLogin(res.user);
        onClose();
        return;
      }
    } catch {
      setError(
        t(lang, 'अमान्य एडमिन पिन। डेमो पिन: 1234', 'Invalid Admin PIN. Demo PIN: 1234')
      );
      setSubmitting(false);
      return;
    } finally {
      setSubmitting(false);
    }

    if (adminPin.trim() !== '1234') {
      setError(
        t(
          lang,
          'अमान्य एडमिन पिन। डेमो पिन: 1234',
          'Invalid Admin PIN. Demo PIN: 1234'
        )
      );
      return;
    }
    onLogin(SUPER_ADMIN_USER);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-cream-100 border-2 border-gold-500/70 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-maroon-800 via-maroon-700 to-maroon-800 text-cream-100 px-5 py-4 flex items-center justify-between border-b border-gold-500/50">
          <div>
            <h3 className="font-bold text-lg text-gold-100">
              {t(lang, 'साहू समाज सदस्य पंजीयन / लॉगिन', 'Member Registration / Login')}
            </h3>
            <p className="text-xs text-gold-300">
              {t(lang, 'सामाजिक चौपाल से जुड़ें', 'Join the Sahu Samaj Chhattisgarh Chaupal')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-maroon-900 text-gold-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-2 bg-cream-300 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('member');
              setError('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'member'
                ? 'bg-saffron-500 text-white shadow'
                : 'text-maroon-800 hover:bg-white/70'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            {t(lang, 'सदस्य लॉगिन', 'Member Login')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setError('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'admin'
                ? 'bg-maroon-700 text-gold-100 shadow'
                : 'text-maroon-800 hover:bg-white/70'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t(lang, 'सुपर एडमिन', 'Super Admin')}
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {mode === 'member' ? (
            <form onSubmit={handleMemberSubmit} className="space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-maroon-900 mb-1">
                  {t(lang, 'पूरा नाम (Name) *', 'Full Name *')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-saffron-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t(lang, 'उदा. राजेश कुमार साहू', 'e.g. Rajesh Kumar Sahu')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gold-400/70 bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-900 mb-1">
                  {t(lang, 'मोबाइल नंबर (Mobile Number) *', 'Mobile Number (10 digits) *')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-saffron-600 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9826XXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gold-400/70 bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-900 mb-1">
                  {t(lang, 'जिला (District) *', 'District (Chhattisgarh) *')}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-saffron-600 absolute left-3 top-3" />
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gold-400/70 bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500 text-sm"
                  >
                    {CG_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.en}>
                        {d.hi} ({d.en})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-900 mb-1">
                  {t(lang, 'विकासखंड / ग्राम (Block / Village) *', 'Block / Village *')}
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-saffron-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={blockVillage}
                    onChange={(e) => setBlockVillage(e.target.value)}
                    placeholder={t(lang, 'उदा. देवकर / साजा / परपोड़ी', 'e.g. Deokar / Saja / Parpodi')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gold-400/70 bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500 text-sm"
                  />
                </div>
                {district === 'Bemetara' && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {BEMETARA_REGIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setBlockVillage(r.hi)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          blockVillage === r.hi
                            ? 'bg-saffron-500 text-white border-saffron-600'
                            : 'bg-cream-200 text-maroon-800 border-gold-300 hover:bg-saffron-50'
                        }`}
                      >
                        {r.hi}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold shadow-md hover:from-saffron-400 hover:to-saffron-500 transition-all"
              >
                {t(lang, 'पंजीयन कर प्रवेश करें', 'Register & Continue')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gold-50 border border-gold-400/60 text-sm">
                <div className="font-bold text-maroon-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-saffron-600" />
                  <span>{t(lang, 'सुपर एडमिन: संजय कुमार साहू (9630273317)', 'Super Admin: Sanjay Kumar Sahu (9630273317)')}</span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  {t(
                    lang,
                    'पोस्ट स्वीकृत/हटाने, महत्वपूर्ण सूचना पिन करने तथा भजन व इतिहास सामग्री प्रबंधन हेतु।',
                    'Manage post approvals, pin announcements, and curate bhajans, heritage, directory & events.'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-900 mb-1">
                  {t(lang, 'एडमिन सुरक्षा पिन (Demo PIN: 1234)', 'Admin Security PIN (Demo PIN: 1234)')}
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-4 py-2.5 rounded-xl border border-gold-400/70 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 text-center text-lg tracking-widest font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-maroon-700 to-maroon-800 text-gold-100 font-bold shadow-md hover:from-maroon-600 hover:to-maroon-700 transition-all"
              >
                {t(lang, 'सुपर एडमिन डैशबोर्ड खोलें', 'Sign In as Super Admin')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
