export function t(lang, hi, en) {
  return lang === 'hi' ? hi : en;
}

export function formatRelativeDate(isoString, lang = 'hi') {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function shareOnWhatsApp(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
