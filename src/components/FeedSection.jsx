import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Pin,
  Image as ImageIcon,
  Video,
  Calendar,
  FileText,
  Megaphone,
  Send,
  MapPin,
  Clock,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { t, formatRelativeDate, shareOnWhatsApp } from '../utils/i18n';

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FeedSection({
  lang,
  posts,
  currentUser,
  onOpenAuth,
  onCreatePost,
  onToggleLike,
  onAddComment,
  onToggleFeatured,
  onDeletePost,
  showComposer,
  setShowComposer,
  requireApproval,
}) {
  const [filter, setFilter] = useState('all');
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // Composer state
  const [postType, setPostType] = useState('photo');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isAdmin = currentUser?.role === 'super_admin';

  // Visible posts: approved posts + own pending posts + all for admin
  const visiblePosts = posts.filter((p) => {
    if (p.status === 'approved') return true;
    if (isAdmin) return true;
    if (currentUser && p.authorMobile && p.authorMobile === currentUser.mobile) return true;
    return false;
  });

  const featuredPosts = visiblePosts.filter((p) => p.featured && p.status === 'approved');

  const filteredPosts = visiblePosts.filter((p) => {
    if (filter === 'all') return true;
    return p.type === filter;
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        setMediaType('image');
        setMediaUrl(compressed);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setMediaType('video');
        setMediaUrl(url);
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!content.trim() && !title.trim()) return;

    onCreatePost({
      type: postType,
      titleHi: title.trim() || content.trim().slice(0, 60),
      titleEn: title.trim() || content.trim().slice(0, 60),
      contentHi: content.trim(),
      contentEn: content.trim(),
      mediaType,
      mediaUrl: mediaUrl.trim(),
    });

    setTitle('');
    setContent('');
    setMediaType('none');
    setMediaUrl('');
    setShowComposer(false);
  };

  const handleCommentSubmit = (postId) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    onAddComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleWhatsAppShare = (post) => {
    const heading = lang === 'hi' ? post.titleHi : post.titleEn || post.titleHi;
    const body = lang === 'hi' ? post.contentHi : post.contentEn || post.contentHi;
    const text = `🚩 *साहू समाज छत्तीसगढ़ (सामाजिक चौपाल)*\n\n*${heading}*\n\n${body}\n\n— ${post.authorName} (${post.districtHi})\n🙏 जय भक्त माता कर्मा!`;
    shareOnWhatsApp(text);
  };

  const filterChips = [
    { id: 'all', hi: 'सभी पोस्ट', en: 'All Posts' },
    { id: 'announcement', hi: 'सूचनाएं', en: 'Announcements' },
    { id: 'event', hi: 'कार्यक्रम', en: 'Events' },
    { id: 'photo', hi: 'फ़ोटो / वीडियो', en: 'Photos & Videos' },
    { id: 'article', hi: 'लेख / विचार', en: 'Articles' },
  ];

  const getTypeBadge = (type) => {
    switch (type) {
      case 'announcement':
        return {
          label: t(lang, 'महत्वपूर्ण सूचना', 'Announcement'),
          cls: 'bg-maroon-100 text-maroon-800 border-maroon-200',
        };
      case 'event':
        return {
          label: t(lang, 'कार्यक्रम अपडेट', 'Event Update'),
          cls: 'bg-saffron-100 text-saffron-800 border-saffron-200',
        };
      case 'article':
        return {
          label: t(lang, 'सामाजिक लेख', 'Article'),
          cls: 'bg-gold-100 text-gold-900 border-gold-300',
        };
      default:
        return {
          label: t(lang, 'चौपाल पोस्ट', 'Community Post'),
          cls: 'bg-cream-300 text-stone-700 border-gold-300/60',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serifHindi text-2xl sm:text-3xl font-bold text-maroon-800 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-saffron-500" />
            {t(lang, 'सामाजिक चौपाल', 'Samajik Chaupal (Community Feed)')}
          </h2>
          <p className="text-sm text-stone-600">
            {t(
              lang,
              'छत्तीसगढ़ के सभी जिलों से समाज के समाचार, फ़ोटो, कार्यक्रम एवं विचार साझा करें',
              'Share community updates, photos, short videos, events, and articles across Chhattisgarh'
            )}
          </p>
        </div>

        <button
          onClick={() => (currentUser ? setShowComposer((v) => !v) : onOpenAuth())}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold shadow hover:from-saffron-400 hover:to-saffron-500 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
          {t(lang, 'नई पोस्ट लिखें', 'Create Post')}
        </button>
      </div>

      {/* Pinned / Featured Announcements Banner */}
      {featuredPosts.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-saffron-700 text-cream-100 p-4 sm:p-5 border-2 border-gold-400/80 shadow-lg">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Pin className="w-4 h-4 fill-gold-300" />
            <span>{t(lang, 'प्रमुख सामाजिक घोषणाएं', 'Featured Community Announcements')}</span>
          </div>
          <div className="space-y-2.5">
            {featuredPosts.slice(0, 2).map((fp) => (
              <div
                key={fp.id}
                className="rounded-xl bg-black/20 border border-gold-400/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-gold-100 text-sm sm:text-base">
                    {lang === 'hi' ? fp.titleHi : fp.titleEn || fp.titleHi}
                  </div>
                  <div className="text-xs text-gold-200/85 mt-0.5 line-clamp-1">
                    {lang === 'hi' ? fp.contentHi : fp.contentEn || fp.contentHi}
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gold-500/20 text-gold-200 border border-gold-400/40 self-start sm:self-center shrink-0">
                  {lang === 'hi' ? fp.districtHi : fp.district}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Post Composer */}
      {showComposer && (
        <form
          onSubmit={handlePublish}
          className="cream-card rounded-2xl p-4 sm:p-5 space-y-4 border-2 border-saffron-400/60"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-maroon-800 text-lg">
              {t(lang, 'चौपाल पर नया संदेश साझा करें', 'Share a New Community Post')}
            </h3>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="p-1 rounded-lg text-stone-500 hover:bg-cream-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Post Type Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'photo', icon: ImageIcon, hi: 'फ़ोटो / वीडियो', en: 'Photo / Video' },
              { id: 'event', icon: Calendar, hi: 'कार्यक्रम अपडेट', en: 'Event Update' },
              { id: 'article', hi: 'लेख / विचार', icon: FileText, en: 'Article' },
              ...(isAdmin
                ? [{ id: 'announcement', icon: Megaphone, hi: 'सूचना (एडमिन)', en: 'Announcement' }]
                : []),
            ].map((pt) => {
              const Icon = pt.icon;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPostType(pt.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    postType === pt.id
                      ? 'bg-saffron-500 text-white border-saffron-600 shadow-sm'
                      : 'bg-cream-200 text-maroon-800 border-gold-300 hover:bg-cream-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(lang, pt.hi, pt.en)}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t(lang, 'शीर्षक लिखें (उदा. ग्राम इकाई बैठक, कर्मा जयंती तैयारी...)', 'Enter headline...')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gold-400/60 bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500 text-sm font-medium"
          />

          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder={t(
              lang,
              'अपने विचार, कार्यक्रम का विवरण या सामाजिक समाचार विस्तार से लिखें...',
              'Write your community update, event details, or article...'
            )}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gold-400/60 bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500 text-sm"
          />

          {/* Media Upload / Short Video URL */}
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-300 text-maroon-800 text-xs font-bold hover:bg-gold-200/70 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-saffron-600" />
              {uploading
                ? t(lang, 'तैयार हो रहा है...', 'Processing...')
                : t(lang, 'फ़ोटो / शॉर्ट वीडियो चुनें', 'Attach Photo / Short Video')}
            </button>

            <button
              type="button"
              onClick={() => {
                setMediaType('video-link');
                setMediaUrl('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-300 text-maroon-800 text-xs font-bold hover:bg-gold-200/70 transition-colors"
            >
              <Video className="w-4 h-4 text-maroon-700" />
              {t(lang, 'वीडियो लिंक जोड़ें', 'Add Video URL')}
            </button>
          </div>

          {mediaType === 'video-link' && (
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://... (.mp4 or YouTube link)"
              className="w-full px-3.5 py-2 rounded-xl border border-gold-400/60 bg-white text-xs"
            />
          )}

          {mediaType === 'image' && mediaUrl && (
            <div className="relative rounded-xl overflow-hidden border border-gold-300 bg-maroon-900/95 flex items-center justify-center">
              <img src={mediaUrl} alt="Preview" className="w-full max-h-72 object-contain" />
              <button
                type="button"
                onClick={() => {
                  setMediaType('none');
                  setMediaUrl('');
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {mediaType === 'video' && mediaUrl && (
            <div className="relative rounded-xl overflow-hidden border border-gold-300">
              <video src={mediaUrl} controls className="w-full max-h-64 bg-black" />
              <button
                type="button"
                onClick={() => {
                  setMediaType('none');
                  setMediaUrl('');
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <p className="text-xs text-stone-500">
              {isAdmin || !requireApproval
                ? t(lang, 'यह पोस्ट तुरंत चौपाल पर प्रकाशित होगी।', 'This post will be published immediately.')
                : t(
                    lang,
                    'एडमिन स्वीकृति के बाद पोस्ट सभी सदस्यों को दिखाई देगी।',
                    'Post will appear publicly after Admin approval.'
                  )}
            </p>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-maroon-700 to-maroon-800 text-gold-100 font-bold shadow hover:from-maroon-600 hover:to-maroon-700 transition-all"
            >
              {t(lang, 'प्रकाशित करें', 'Publish Post')}
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap border transition-all ${
              filter === chip.id
                ? 'bg-maroon-700 text-gold-100 border-maroon-800 shadow-sm'
                : 'bg-white text-stone-700 border-gold-300 hover:bg-cream-300'
            }`}
          >
            {t(lang, chip.hi, chip.en)}
          </button>
        ))}
      </div>

      {/* Posts Feed List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const badge = getTypeBadge(post.type);
          const liked = currentUser ? post.likes.includes(currentUser.id) : false;
          const isCommentsOpen = !!openComments[post.id];

          return (
            <article
              key={post.id}
              className={`cream-card rounded-2xl overflow-hidden transition-all ${
                post.featured ? 'ring-2 ring-gold-500/70' : ''
              }`}
            >
              <div className="p-4 sm:p-5 space-y-3">
                {/* Author Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron-500 to-maroon-700 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
                      {post.authorName?.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-maroon-900">
                          {lang === 'hi' ? post.authorName : post.authorNameEn || post.authorName}
                        </span>
                        {post.authorRole === 'super_admin' && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gold-200 text-maroon-900 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            {t(lang, 'सुपर एडमिन', 'Super Admin')}
                          </span>
                        )}
                        {post.status === 'pending' && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            <Clock className="w-3 h-3" />
                            {t(lang, 'स्वीकृति लंबित', 'Pending Approval')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-saffron-500" />
                          {lang === 'hi' ? post.districtHi : post.district}
                          {post.blockVillage ? ` • ${post.blockVillage}` : ''}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeDate(post.createdAt, lang)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => onToggleFeatured(post.id)}
                          title={t(lang, 'पिन / अनपिन करें', 'Pin / Unpin')}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            post.featured
                              ? 'bg-gold-200 text-maroon-900 border-gold-400'
                              : 'bg-cream-200 text-stone-500 border-gold-200 hover:text-maroon-800'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePost(post.id)}
                          title={t(lang, 'हटाएं', 'Delete')}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Title & Body */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-maroon-900 leading-snug">
                    {lang === 'hi' ? post.titleHi : post.titleEn || post.titleHi}
                  </h3>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                    {lang === 'hi' ? post.contentHi : post.contentEn || post.contentHi}
                  </p>
                </div>

                {/* Media */}
                {post.mediaType === 'image' && post.mediaUrl && (
                  <div className="rounded-xl overflow-hidden border border-gold-400/60 bg-gradient-to-b from-maroon-900 via-maroon-950 to-maroon-900 flex items-center justify-center">
                    <img
                      src={post.mediaUrl}
                      alt={post.titleHi}
                      loading="lazy"
                      className="w-full max-h-[480px] object-contain"
                    />
                  </div>
                )}

                {post.mediaType === 'video' && post.mediaUrl && (
                  <div className="rounded-xl overflow-hidden border border-gold-300/70 bg-black">
                    <video src={post.mediaUrl} controls playsInline className="w-full max-h-[360px]" />
                  </div>
                )}

                {post.mediaType === 'video-link' && post.mediaUrl && (
                  <a
                    href={post.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl bg-saffron-50 border border-saffron-200 text-saffron-800 text-sm font-semibold hover:bg-saffron-100"
                  >
                    <Video className="w-4 h-4 shrink-0" />
                    <span className="truncate">{post.mediaUrl}</span>
                  </a>
                )}

                {/* Action Bar: Like, Comment, WhatsApp Share */}
                <div className="pt-3 border-t border-gold-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => (currentUser ? onToggleLike(post.id) : onOpenAuth())}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                        liked
                          ? 'bg-saffron-100 text-saffron-700 border border-saffron-300'
                          : 'bg-cream-200 text-stone-700 hover:bg-cream-300'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-saffron-600 text-saffron-600' : ''}`} />
                      <span>{post.likes.length}</span>
                      <span className="hidden xs:inline">{t(lang, 'पसंद', 'Like')}</span>
                    </button>

                    <button
                      onClick={() =>
                        setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream-200 text-stone-700 hover:bg-cream-300 text-sm font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-maroon-700" />
                      <span>{post.comments.length}</span>
                      <span className="hidden xs:inline">{t(lang, 'टिप्पणी', 'Comment')}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleWhatsAppShare(post)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{t(lang, 'WhatsApp शेयर', 'WhatsApp Share')}</span>
                  </button>
                </div>

                {/* Comments Drawer */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-gold-200/70 space-y-3">
                    {post.comments.length === 0 ? (
                      <p className="text-xs text-stone-500 italic">
                        {t(lang, 'अभी कोई टिप्पणी नहीं है। पहली टिप्पणी लिखें!', 'No comments yet. Be the first!')}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {post.comments.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-xl bg-cream-200 border border-gold-200/70">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-maroon-900">
                                {c.authorName}{' '}
                                {c.districtHi && (
                                  <span className="font-normal text-stone-500">({c.districtHi})</span>
                                )}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {formatRelativeDate(c.createdAt, lang)}
                              </span>
                            </div>
                            <p className="text-sm text-stone-700 mt-1">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCommentSubmit(post.id);
                          }
                        }}
                        placeholder={t(lang, 'अपनी टिप्पणी लिखें...', 'Write a comment...')}
                        className="flex-1 px-3 py-2 rounded-xl border border-gold-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleCommentSubmit(post.id)}
                        className="p-2.5 rounded-xl bg-saffron-500 text-white hover:bg-saffron-600 transition-colors"
                        aria-label="Send comment"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="cream-card rounded-2xl p-8 text-center text-stone-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-gold-500 mb-2" />
            <p>{t(lang, 'इस श्रेणी में अभी कोई पोस्ट उपलब्ध नहीं है।', 'No posts in this category yet.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
