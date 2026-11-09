/**
 * Casekaaran — Navigation & Motion Interactions (Redesign)
 * Editorial-Commerce Luxury Motion Design
 */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Offcanvas Drawer
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileCloseBtn = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    if (mobileNavDrawer && mobileNavBackdrop) {
      mobileNavDrawer.classList.add('open');
      mobileNavBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileNav() {
    if (mobileNavDrawer && mobileNavBackdrop) {
      mobileNavDrawer.classList.remove('open');
      mobileNavBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileNav);
  if (mobileNavBackdrop) mobileNavBackdrop.addEventListener('click', closeMobileNav);

  // Close drawer on link click
  document.querySelectorAll('.mobile-nav-item a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // Global Search Shortcuts (Cmd/Ctrl + K)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const firstSearch = document.querySelector('.global-search-input');
      if (firstSearch) {
        firstSearch.focus();
        firstSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

  // Search Bar Submissions
  const searchInputs = document.querySelectorAll('.global-search-input');
  searchInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  });

  // Sticky navbar shadow on scroll
  const navbar = document.querySelector('.navbar-custom');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Scroll Reveal Observer (IntersectionObserver)
  initScrollAnimations();

  // Setup Flash Sale Countdown Timer
  initCountdownTimer();
});

/**
 * High-performance Scroll Animations using IntersectionObserver
 */
function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return; // Respect reduced motion preference
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-on-scroll, .section-header, .product-card, .brand-card, .trust-card').forEach(el => {
    el.classList.add('reveal-item');
    observer.observe(el);
  });
}

/**
 * Flash Sale Countdown Timer
 */
function initCountdownTimer() {
  const daysEl = document.getElementById('timer-days');
  const hoursEl = document.getElementById('timer-hours');
  const minsEl = document.getElementById('timer-mins');
  const secsEl = document.getElementById('timer-secs');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  targetDate.setHours(23, 59, 59, 999);

  function update() {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    if (distance < 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}
