/**
 * Casekaaran — Dynamic Internationalization (i18n) Engine
 * Supports English (en) & Hindi (hi) with persistent localStorage selection
 */
const I18n = (function () {
  let currentLang = localStorage.getItem(CONFIG.STORAGE_KEYS.LANG) || CONFIG.DEFAULT_LANG;

  const dictionaries = {
    en: typeof TRANSLATIONS_EN !== 'undefined' ? TRANSLATIONS_EN : {},
    hi: typeof TRANSLATIONS_HI !== 'undefined' ? TRANSLATIONS_HI : {}
  };

  /**
   * Resolve nested key like 'nav.home' from the active dictionary
   */
  function t(key, params = {}) {
    const dict = dictionaries[currentLang] || dictionaries.en;
    const parts = key.split('.');
    let value = dict;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        // Fallback to English dictionary
        let fallbackVal = dictionaries.en;
        for (const fbPart of parts) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbPart in fallbackVal) {
            fallbackVal = fallbackVal[fbPart];
          } else {
            fallbackVal = key;
            break;
          }
        }
        value = fallbackVal;
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace interpolations e.g. {count}, {model}
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  /**
   * Apply translations to all DOM elements bearing data-i18n or data-i18n-placeholder
   */
  function applyTranslations() {
    // Update HTML attribute and body class
    document.documentElement.lang = currentLang;
    if (currentLang === 'hi') {
      document.body.classList.add('lang-hi');
      document.body.classList.remove('lang-en');
    } else {
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-hi');
    }

    // Update text elements
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key);
      }
    });

    // Update placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', t(key));
      }
    });

    // Update active state on language switcher buttons
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Dispatch custom event for dynamic views (like cart/product list)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }

  /**
   * Switch active language
   */
  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'hi') return;
    currentLang = lang;
    localStorage.setItem(CONFIG.STORAGE_KEYS.LANG, lang);
    applyTranslations();
  }

  function getLanguage() {
    return currentLang;
  }

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();

    // Attach click listeners to language switchers
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn');
      if (btn) {
        const selectedLang = btn.getAttribute('data-lang');
        if (selectedLang) {
          setLanguage(selectedLang);
        }
      }
    });
  });

  return {
    t,
    setLanguage,
    getLanguage,
    applyTranslations
  };
})();

// Export globally
window.t = I18n.t;
window.I18n = I18n;
