import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, Phone, MapPin, Home, User, Lock } from 'lucide-react';
import { CG_DISTRICTS, BEMETARA_REGIONS, SUPER_ADMIN_USER } from '../data/chhattisgarhData';
import { t } from '../utils/i18n';
import { api, setAuthToken } from '../utils/api';

export default function AuthModal({ isOpen, onClose, lang, onLogin, serverConnected }) {
  const [mode, setMode] = useState('member'); // 'member' | 'admin'
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [district, setDistrict] = useState('Bemetara');
  const [blockVillage, setBlockVillage] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
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
    if (cleanMobile === SUPER_ADMIN_USER.mobile) {
      setError(
        t(
          lang,
          'यह सुपर एडमिन नंबर है। कृपया ऊपर "सुपर एडमिन" टैब से पासवर्ड डालकर लॉगिन करें।',
          'This is the Super Admin number. Please use the Super Admin tab with your password.'
        )
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
    } catch (err) {
      setError(err?.message || t(lang, 'लॉगिन में त्रुटि हुई।', 'Login failed.'));
      setSubmitting(false);
      return;
    } finally {
      setSubmitting(false);
    }

    onLogin({
      id: `member-${cleanMobile}`,
      name: name.trim(),
      nameHi: name.trim(),
      mobile: cleanMobile,
      district: distObj.en,
      districtHi: distObj.hi,
      blockVillage: blockVillage.trim(),
      role: 'member',
    });
    onClose();
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanAdminMobile = adminMobile.replace(/\D/g, '');
    if (cleanAdminMobile.length !== 10) {
      setError(
        t(lang, 'कृपया 10 अंकों का अधिकृत सुपर एडमिन मोबाइल नंबर दर्ज करें।', 'Please enter the authorized 10-digit Super Admin mobile number.')
      );
      return;
    }
    if (!adminPin.trim()) {
      setError(t(lang, 'कृपया गुप्त एडमिन पासवर्ड दर्ज करें।', 'Please enter the secret Admin password.'));
      return;
    }
    if (!serverConnected) {
      setError(
        t(
          lang,
          'सुरक्षा कारणों से सुपर एडमिन लॉगिन केवल लाइव सर्वर (MySQL) से जुड़े होने पर ही संभव है।',
          'For security, Super Admin login requires a live server connection.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.loginAdmin(cleanAdminMobile, adminPin.trim());
      setAuthToken(res.token);
      onLogin(res.user);
      setAdminPin('');
      onClose();
    } catch (err) {
      setError(
        err?.message ||
          t(lang, 'गलत मोबाइल नंबर या एडमिन पासवर्ड।', 'Invalid Super Admin mobile number or password.')
      );
    } finally {
      setSubmitting(false);
    }
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
                    placeholder="98XXXXXXXX"
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
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold shadow-md hover:from-saffron-400 hover:to-saffron-500 disabled:opacity-60 transition-all"
              >
                {submitting
                  ? t(lang, 'प्रवेश हो रहा है...', 'Signing in...')
                  : t(lang, 'पंजीयन कर प्रवेश करें', 'Register & Continue')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gold-50 border border-gold-400/60 text-sm">
                <div className="font-bold text-maroon-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-saffron-600" />
                  <span>{t(lang, 'सुपर एडमिन: केवल अधिकृत प्रवेश', 'Super Admin: Restricted Access')}</span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  {t(
                    lang,
                    'केवल अधिकृत सुपर एडमिन (संजय कुमार साहू) अपने पंजीकृत मोबाइल नंबर और गुप्त पासवर्ड से प्रवेश कर सकते हैं। 5 गलत प्रयास पर 15 मिनट का लॉक लग जाएगा।',
                    'Only the authorized Super Admin (Sanjay Kumar Sahu) can sign in using the registered mobile number and secret password. 5 failed attempts trigger a 15-minute lockout.'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-900 mb-1">
                  {t(lang, 'पंजीकृत एडमिन मोबाइल नंबर *', 'Registered Admin Mobile Number *')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-maroon-700 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={10}
                    autoComplete="username"
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder={t(lang, '10 अंकों का एडमिन नंबर', '10-digit Admin mobile')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gold-400/70 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-900 mb-1">
                  {t(lang, 'गुप्त एडमिन पासवर्ड *', 'Secret Admin Password *')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-maroon-700 absolute left-3 top-3" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gold-400/70 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 text-sm font-semibold tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-maroon-700 to-maroon-800 text-gold-100 font-bold shadow-md hover:from-maroon-600 hover:to-maroon-700 disabled:opacity-60 transition-all"
              >
                {submitting
                  ? t(lang, 'सत्यापन हो रहा है...', 'Verifying...')
                  : t(lang, 'सुपर एडमिन सुरक्षित लॉगिन', 'Secure Super Admin Sign In')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
