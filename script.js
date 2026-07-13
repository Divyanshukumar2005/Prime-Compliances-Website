'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // Utility: Debounce
  // ============================================================
  function debounce(fn, delay = 16) {
    let timer;
    return (...args) => {
      cancelAnimationFrame(timer);
      timer = requestAnimationFrame(() => fn(...args));
    };
  }

  // ============================================================
  // 1. Preloader
  // ============================================================
  const preloader = document.getElementById('preloader');

  function hidePreloader() {
    if (!preloader || preloader.dataset.hidden) return;
    preloader.dataset.hidden = 'true';
    preloader.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
    preloader.style.opacity = '0';
    preloader.style.visibility = 'hidden';

    preloader.addEventListener('transitionend', () => {
      preloader.style.display = 'none';
    }, { once: true });
  }

  if (preloader) {
    window.addEventListener('load', hidePreloader);
    // Fallback: hide after 4 seconds even if load hasn't fired
    setTimeout(hidePreloader, 4000);
  }

  // ============================================================
  // 2. Navbar Scroll Effect
  // ============================================================
  const navbar = document.querySelector('.navbar');
  const announcementBar = document.querySelector('.announcement-bar');
  const SCROLL_THRESHOLD = 80;

  function handleNavbarScroll() {
    if (!navbar) return;
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    navbar.classList.toggle('scrolled', scrolled);
    if (announcementBar) {
      announcementBar.classList.toggle('hide', scrolled);
    }
  }

  window.addEventListener('scroll', debounce(handleNavbarScroll), { passive: true });
  handleNavbarScroll(); // Initial check

  // ============================================================
  // 3. Mobile Menu Toggle
  // ============================================================
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      // Prevent body scroll when menu is open
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a nav link
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('active') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ============================================================
  // 4. Smooth Scrolling — custom eased animation
  // ============================================================
  const NAVBAR_OFFSET = 120;

  // Ease in-out quart — feels buttery, not floaty
  function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  function smoothScrollTo(targetY, duration = 800) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 2) return;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + diff * easeInOutQuart(progress));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
      smoothScrollTo(targetPosition, 800);
    });
  });

  // ============================================================
  // 5. Active Nav Link Highlighting (IntersectionObserver)
  // ============================================================
  const sections = document.querySelectorAll('section[id]');

  if (sections.length > 0 && navLinks.length > 0) {
    const activeLinkObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');

            navLinks.forEach((link) => {
              link.classList.toggle(
                'active',
                link.getAttribute('href') === `#${id}`
              );
            });
          }
        });
      },
      {
        rootMargin: `-${NAVBAR_OFFSET}px 0px -40% 0px`,
        threshold: 0.1,
      }
    );

    sections.forEach((section) => activeLinkObserver.observe(section));
  }

  // ============================================================
  // 6. Scroll Reveal Animations — staggered, smooth
  // ============================================================
  const animatedElements = document.querySelectorAll('[data-animate]');

  if (animatedElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const baseDelay = Number(entry.target.dataset.delay || 0);
            entry.target.style.transitionDelay = `${baseDelay}ms`;
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    animatedElements.forEach((el) => revealObserver.observe(el));

    // Auto-stagger direct siblings inside grid/flex containers
    document.querySelectorAll(
      '.services-grid, .stats-grid, .process-steps, .team-grid, .footer-grid, .contact-grid'
    ).forEach((container) => {
      const children = [...container.children];
      children.forEach((child, i) => {
        if (!child.dataset.animate) {
          child.dataset.animate = 'fadeInUp';
          child.style.transitionDelay = `${i * 80}ms`;
          revealObserver.observe(child);
        }
      });
    });
  }

  // ============================================================
  // 7. Counter Animation
  // ============================================================
  const counters = document.querySelectorAll('.counter');
  const COUNTER_DURATION = 2000; // ms

  /**
   * Easing function: easeOutQuart for a smooth deceleration.
   */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Formats a counter's final display value.
   * Reads data-suffix (default '+') and data-format attributes.
   *   - data-suffix="%"  →  "98%"
   *   - data-suffix="+"  →  "1,000+"
   *   - data-format="false" to disable comma formatting
   */
  function formatCounterValue(value, el) {
    const suffix = el.dataset.suffix ?? '+';
    const shouldFormat = el.dataset.format !== 'false';

    let display = shouldFormat ? value.toLocaleString('en-IN') : String(value);
    return `${display}${suffix}`;
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;

    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNTER_DURATION, 1);
      const easedProgress = easeOutQuart(progress);
      const current = Math.floor(easedProgress * target);

      el.textContent = formatCounterValue(current, el);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure final value is exact
        el.textContent = formatCounterValue(target, el);
      }
    }

    requestAnimationFrame(step);
  }

  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((counter) => {
      counter.textContent = '0';
      counterObserver.observe(counter);
    });
  }

  // ============================================================
  // 8. FAQ Accordion
  // ============================================================
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const parentItem = question.closest('.faq-item');
      if (!parentItem) return;

      const answer = parentItem.querySelector('.faq-answer');
      const isActive = parentItem.classList.contains('active');

      // Close all other open FAQs
      document.querySelectorAll('.faq-item.active').forEach((openItem) => {
        if (openItem !== parentItem) {
          openItem.classList.remove('active');
          const openAnswer = openItem.querySelector('.faq-answer');
          if (openAnswer) {
            openAnswer.style.maxHeight = null;
          }
        }
      });

      // Toggle current
      parentItem.classList.toggle('active', !isActive);

      if (answer) {
        if (!isActive) {
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        } else {
          answer.style.maxHeight = null;
        }
      }
    });
  });

  // ============================================================
  // 9. Services Tabs
  // ============================================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Close ALL open accordions across all tabs first
      document.querySelectorAll('.accordion-card.open').forEach((c) => c.classList.remove('open'));

      // Deactivate all tabs
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      // Activate clicked tab and corresponding content
      btn.classList.add('active');

      const targetContent = document.getElementById(`content-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // ============================================================
  // 10. Contact Form Handling (WhatsApp Integration)
  // ============================================================
  const contactForm = document.querySelector('#contact-form');
  const WHATSAPP_NUMBER = '917428277598';

  /**
   * Show inline validation error below a field.
   */
  function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('error');

    const errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    errorEl.style.cssText =
      'color:#e74c3c;font-size:0.8rem;display:block;margin-top:4px;';

    field.parentElement.appendChild(errorEl);
  }

  function clearFieldError(field) {
    field.classList.remove('error');
    const existing = field.parentElement.querySelector('.field-error');
    if (existing) existing.remove();
  }

  /**
   * Validate a single field. Returns true if valid.
   */
  function validateField(field) {
    const value = field.value.trim();
    const name = field.getAttribute('name') || field.getAttribute('placeholder') || 'Field';

    // Required check
    if (field.hasAttribute('required') && !value) {
      showFieldError(field, `${name} is required.`);
      return false;
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showFieldError(field, 'Please enter a valid email address.');
        return false;
      }
    }

    // Phone validation (Indian – 10 digits)
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(value.replace(/[\s\-+()]/g, '').slice(-10))) {
        showFieldError(field, 'Please enter a valid 10-digit phone number.');
        return false;
      }
    }

    clearFieldError(field);
    return true;
  }

  if (contactForm) {
    // Live validation on blur
    const formFields = contactForm.querySelectorAll('input:not([tabindex="-1"]), textarea, select');
    formFields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(field);
      });
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate all fields
      let isValid = true;
      formFields.forEach((field) => {
        if (!validateField(field)) isValid = false;
      });

      if (!isValid) {
        // Focus first error field
        const firstError = contactForm.querySelector('.error');
        if (firstError) firstError.focus();
        return;
      }

      // Collect form data
      const formData = new FormData(contactForm);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      // Build WhatsApp message
      const messageParts = [
        '📋 *New Enquiry from Website*',
        '━━━━━━━━━━━━━━━━━━━━',
      ];

      if (data.fullName) messageParts.push(`👤 *Name:* ${data.fullName}`);
      if (data.email) messageParts.push(`📧 *Email:* ${data.email}`);
      if (data.mobile) messageParts.push(`📱 *Phone:* ${data.mobile}`);
      if (data.company) messageParts.push(`🏢 *Company:* ${data.company}`);
      if (data.service) messageParts.push(`📌 *Service:* ${data.service}`);
      if (data.message) messageParts.push(`💬 *Message:* ${data.message}`);

      messageParts.push('━━━━━━━━━━━━━━━━━━━━');

      const encodedMessage = encodeURIComponent(messageParts.join('\n'));
      const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      // Open WhatsApp
      window.open(whatsappURL, '_blank', 'noopener,noreferrer');

      // Show success message
      showFormSuccess(contactForm);

      // Reset form
      contactForm.reset();
      formFields.forEach(clearFieldError);
    });
  }

  /**
   * Show a temporary success message after form submission.
   */
  function showFormSuccess(form) {
    // Remove any existing success message
    const existing = form.parentElement.querySelector('.form-success');
    if (existing) existing.remove();

    const successEl = document.createElement('div');
    successEl.className = 'form-success';
    successEl.innerHTML =
      '✅ Thank you! Your message has been sent via WhatsApp. We\'ll get back to you shortly.';
    successEl.style.cssText =
      'background:#d4edda;color:#155724;padding:16px 20px;border-radius:8px;margin-top:16px;font-weight:500;text-align:center;transition:opacity 0.5s ease;';

    form.parentElement.appendChild(successEl);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      successEl.style.opacity = '0';
      successEl.addEventListener('transitionend', () => successEl.remove(), {
        once: true,
      });
    }, 6000);
  }

  // ============================================================
  // 11. Back to Top Button
  // ============================================================
  const backToTopBtn = document.querySelector('#back-to-top');
  const BACK_TO_TOP_THRESHOLD = 500;

  function handleBackToTopVisibility() {
    if (!backToTopBtn) return;
    const visible = window.scrollY > BACK_TO_TOP_THRESHOLD;
    backToTopBtn.classList.toggle('visible', visible);
  }

  window.addEventListener('scroll', debounce(handleBackToTopVisibility), {
    passive: true,
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      smoothScrollTo(0, 700);
    });
  }

  handleBackToTopVisibility(); // Initial check

  // ============================================================
  // 12. Typewriter Effect
  // ============================================================
  const typewriterEl = document.getElementById('typed-text');

  if (typewriterEl) {
    const words = [
      'Business Registration',
      'GST & Taxation',
      'Trademark Protection',
      'Annual Compliance',
      'ISO Certification',
    ];

    const TYPE_SPEED = 80;   // ms per character typing
    const DELETE_SPEED = 40; // ms per character deleting
    const PAUSE_AFTER_TYPE = 1800; // ms pause after full word typed
    const PAUSE_AFTER_DELETE = 400; // ms pause after word deleted

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typewrite() {
      const currentWord = words[wordIndex];

      if (isDeleting) {
        charIndex--;
        typewriterEl.textContent = currentWord.substring(0, charIndex);
      } else {
        charIndex++;
        typewriterEl.textContent = currentWord.substring(0, charIndex);
      }

      let nextDelay = isDeleting ? DELETE_SPEED : TYPE_SPEED;

      // Finished typing the word
      if (!isDeleting && charIndex === currentWord.length) {
        nextDelay = PAUSE_AFTER_TYPE;
        isDeleting = true;
      }

      // Finished deleting the word
      if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        nextDelay = PAUSE_AFTER_DELETE;
      }

      setTimeout(typewrite, nextDelay);
    }

    // Start after a brief initial delay
    setTimeout(typewrite, 500);
  }

  // ============================================================
  // 13. Parallax Effect on Hero Background
  // ============================================================
  const heroSection = document.querySelector('.hero');

  if (heroSection) {
    const parallaxBg =
      heroSection.querySelector('.hero-bg') || heroSection;

    function handleParallax() {
      const scrollY = window.scrollY;
      const heroHeight = heroSection.offsetHeight;

      // Only apply parallax when hero is in view
      if (scrollY <= heroHeight) {
        const translateY = scrollY * 0.4; // Slower rate for subtle effect
        parallaxBg.style.transform = `translateY(${translateY}px)`;
      }
    }

    window.addEventListener('scroll', debounce(handleParallax), {
      passive: true,
    });
  }

  // ============================================================
  // Keyboard Accessibility: FAQ & Tabs
  // ============================================================
  faqQuestions.forEach((question) => {
    // Allow Enter/Space to toggle FAQ
    question.setAttribute('tabindex', '0');
    question.setAttribute('role', 'button');

    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });

  tabButtons.forEach((btn) => {
    btn.setAttribute('role', 'tab');
  });

  // ============================================================
  // Accordion Cards – Service Details Dropdown
  // ============================================================
  document.addEventListener('click', function (e) {
    const card = e.target.closest('.accordion-card');
    if (!card) return;

    const isOpen = card.classList.contains('open');

    // Close ALL accordion cards on the entire page
    document.querySelectorAll('.accordion-card').forEach((c) => c.classList.remove('open'));

    // If it was closed before click, open it now
    if (!isOpen) {
      card.classList.add('open');
    }
  });

  document.querySelectorAll('.accordion-card').forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // ============================================================
  // Performance: Combine scroll handlers via single rAF loop
  // ============================================================
  // All scroll-based functions are already debounced via rAF above.
  // This ensures no layout thrashing and smooth 60fps performance.
});
