  // --- Admin Confirmation Modal Helper ---
  window.showAdminConfirm = function(message, onConfirm) {
    var modal = new bootstrap.Modal(document.getElementById('adminConfirmModal'));
    document.getElementById('adminConfirmModalMessage').textContent = message || 'Are you sure you want to proceed?';
    var okBtn = document.getElementById('adminConfirmModalOk');
    var handler = function() {
      if (typeof onConfirm === 'function') onConfirm();
      modal.hide();
      okBtn.removeEventListener('click', handler);
    };
    okBtn.addEventListener('click', handler);
    modal.show();
  };

  // --- Banner dismiss helper ---
  function dismissBanner(banner) {
    if (!banner || !banner.parentNode) return;
    banner.classList.add('banner-closing');
    banner.addEventListener('animationend', function() {
      if (banner.parentNode) banner.remove();
    }, { once: true });
    // fallback in case animationend never fires
    setTimeout(function() { if (banner.parentNode) banner.remove(); }, 400);
  }

  // --- Auto-dismiss server-rendered banners after 6s ---
  document.querySelectorAll('.notification-banner').forEach(function(banner) {
    setTimeout(function() { dismissBanner(banner); }, 6000);
  });

  // --- Banner close button (event delegation) ---
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.notification-banner .banner-close');
    if (btn) dismissBanner(btn.closest('.notification-banner'));
  });

  // --- Global Confirmation Banner Helper ---
  window.showConfirmationBanner = function(message) {
    if (!message) return;
    var existing = document.querySelector('.notification-banner.dynamic-confirmation');
    if (existing) existing.remove();
    var banner = document.createElement('div');
    banner.className = 'notification-banner confirmation-banner success dynamic-confirmation';
    banner.innerHTML =
      '<div class="banner-shell">' +
        '<span class="banner-icon"><i class="fas fa-check-circle"></i></span>' +
        '<div class="banner-body">' +
          '<div class="banner-label">Success</div>' +
          '<div class="banner-text">' + message + '</div>' +
        '</div>' +
        '<button type="button" class="btn-close banner-close" aria-label="Close"></button>' +
      '</div>' +
      '<div class="banner-progress"><div class="banner-progress-inner"></div></div>';
    document.body.insertBefore(banner, document.body.firstChild);
    setTimeout(function() { dismissBanner(banner); }, 6000);
  };
// PIO WEB — Main JavaScript v3.0 (Animation-Rich)
document.addEventListener('DOMContentLoaded', function () {

  // --- Page Loader ---
  const loader = document.querySelector('.page-loader');
  if (loader) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        loader.classList.add('loaded');
        // trigger all initial animations after loader
        document.body.classList.add('page-loaded');
      }, 400);
    });
    // fallback if load already fired
    if (document.readyState === 'complete') {
      setTimeout(function () {
        loader.classList.add('loaded');
        document.body.classList.add('page-loaded');
      }, 400);
    }
  }

  // --- Auto-dismiss flash alerts after 5 seconds ---
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(function (alert) {
    setTimeout(function () {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 5000);
  });

  // --- Navbar scroll effect (shrink + shadow) ---
  const navbar = document.querySelector('.navbar-main');
  if (navbar) {
    const handleScroll = function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // --- Scroll Reveal Observer (fade-up, fade-in, slide-left, slide-right, scale-up, zoom-rotate) ---
  var revealSelectors = '.fade-up, .fade-in, .slide-left, .slide-right, .scale-up, .zoom-rotate';
  var isMobile = window.innerWidth < 768;
  var revealObserverOptions = {
    root: null,
    rootMargin: isMobile ? '0px 0px -40px 0px' : '0px 0px -80px 0px',
    threshold: isMobile ? 0.05 : 0.12
  };

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, revealObserverOptions);

  document.querySelectorAll(revealSelectors).forEach(function (el) {
    revealObserver.observe(el);
  });

  // --- Staggered children animation ---
  // Add .stagger-children to a parent and children with .stagger-item get sequential delays
  document.querySelectorAll('.stagger-children').forEach(function (parent) {
    var items = parent.querySelectorAll('.stagger-item');
    items.forEach(function (item, i) {
      item.style.transitionDelay = (i * 0.1) + 's';
    });
  });

  // --- Counter animation with glow ---
  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var counter = entry.target;
        var target = parseInt(counter.getAttribute('data-target'), 10);
        var duration = 1800;
        var startTime = performance.now();
        var statItem = counter.closest('.stat-item');

        function updateCounter(currentTime) {
          var elapsed = currentTime - startTime;
          var progress = Math.min(elapsed / duration, 1);
          // Cubic ease-out
          var eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = Math.floor(eased * target).toLocaleString();
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString();
            if (statItem) statItem.classList.add('counted');
          }
        }
        requestAnimationFrame(updateCounter);
        counterObserver.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach(function (el) {
    counterObserver.observe(el);
  });

  // --- Parallax effect on hero ---
  var heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    var parallaxElements = heroSection.querySelectorAll('.parallax-bg');
    var heroImg = heroSection.querySelector('.hero-float-img');

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;
      var heroHeight = heroSection.offsetHeight;
      if (scrollY < heroHeight) {
        var rate = scrollY * 0.3;
        parallaxElements.forEach(function (el) {
          el.style.transform = 'translateY(' + rate + 'px)';
        });
        if (heroImg) {
          heroImg.style.transform = 'translateY(' + (scrollY * 0.15) + 'px)';
        }
      }
    }, { passive: true });
  }

  // --- Mouse-follow tilt on cards with .card-tilt (desktop only) ---
  var isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) {
    document.querySelectorAll('.card-tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -5;
        var rotateY = ((x - centerX) / centerX) * 5;
        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-5px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  // --- Magnetic button effect ---
  document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'translate(0, 0)';
    });
  });

  // --- Back to Top button ---
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Smooth page header reveal ---
  var pageHeader = document.querySelector('.page-header');
  if (pageHeader) {
    pageHeader.style.opacity = '0';
    pageHeader.style.transform = 'translateY(-15px)';
    pageHeader.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    requestAnimationFrame(function () {
      pageHeader.style.opacity = '1';
      pageHeader.style.transform = 'translateY(0)';
    });
  }

  // --- Animated text reveal for hero h1 ---
  var heroTitle = document.querySelector('.hero-section h1');
  if (heroTitle) {
    heroTitle.style.opacity = '0';
    heroTitle.style.transform = 'translateY(30px)';
    heroTitle.style.transition = 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s';
    requestAnimationFrame(function () {
      heroTitle.style.opacity = '1';
      heroTitle.style.transform = 'translateY(0)';
    });
  }

  // --- Hero buttons stagger in ---
  document.querySelectorAll('.hero-section .btn').forEach(function (btn, i) {
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(20px)';
    btn.style.transition = 'opacity 0.6s ease ' + (0.5 + i * 0.15) + 's, transform 0.6s ease ' + (0.5 + i * 0.15) + 's';
    requestAnimationFrame(function () {
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    });
  });

  // --- Scroll progress indicator ---
  var scrollProgress = document.querySelector('.scroll-progress');
  if (scrollProgress) {
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrollPercent = (scrollTop / docHeight) * 100;
      scrollProgress.style.width = scrollPercent + '%';
    }, { passive: true });
  }

  // --- Hover sound-like visual feedback for quick-cards ---
  document.querySelectorAll('.quick-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      var icon = card.querySelector('.icon-wrapper');
      if (icon) {
        icon.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        icon.style.transform = 'scale(1.15) rotate(-5deg)';
      }
    });
    card.addEventListener('mouseleave', function () {
      var icon = card.querySelector('.icon-wrapper');
      if (icon) {
        icon.style.transform = 'scale(1) rotate(0deg)';
      }
    });
  });

  // --- Footer links slide-in on view ---
  var footerObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var links = entry.target.querySelectorAll('.footer-link-item');
        links.forEach(function (link, i) {
          link.style.opacity = '0';
          link.style.transform = 'translateX(-15px)';
          link.style.transition = 'opacity 0.4s ease ' + (i * 0.07) + 's, transform 0.4s ease ' + (i * 0.07) + 's';
          requestAnimationFrame(function () {
            setTimeout(function () {
              link.style.opacity = '1';
              link.style.transform = 'translateX(0)';
            }, 50);
          });
        });
        footerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  var footer = document.querySelector('footer');
  if (footer) footerObserver.observe(footer);

  // --- Social icon pop-in ---
  var socialObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var icons = entry.target.querySelectorAll('.social-icon');
        icons.forEach(function (icon, i) {
          icon.style.opacity = '0';
          icon.style.transform = 'scale(0)';
          icon.style.transition = 'opacity 0.3s ease ' + (0.1 + i * 0.1) + 's, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ' + (0.1 + i * 0.1) + 's';
          requestAnimationFrame(function () {
            setTimeout(function () {
              icon.style.opacity = '1';
              icon.style.transform = 'scale(1)';
            }, 50);
          });
        });
        socialObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.social-icon').forEach(function (icon) {
    var parent = icon.parentElement;
    if (parent) socialObserver.observe(parent);
  });

  // --- Accordion items smooth entrance ---
  document.querySelectorAll('.accordion-item').forEach(function (item, i) {
    revealObserver.observe(item);
    if (!item.classList.contains('fade-up') && !item.classList.contains('scale-up')) {
      item.classList.add('fade-up');
      item.style.transitionDelay = (i * 0.08) + 's';
    }
  });

  // --- Admin sidebar toggle (mobile) ---
  var sidebarToggle = document.getElementById('sidebarToggle');
  var sidebar = document.querySelector('.admin-sidebar');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('show');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('show');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (sidebar.classList.contains('show')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    // Close sidebar when clicking backdrop
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', function () {
        closeSidebar();
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (e) {
      if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
        if (!sidebar.contains(e.target) && e.target !== sidebarToggle && !sidebarToggle.contains(e.target)) {
          closeSidebar();
        }
      }
    });

    // Close sidebar on window resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 992 && sidebar.classList.contains('show')) {
        closeSidebar();
      }
    });

    // Close sidebar when a nav link is clicked on mobile
    sidebar.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 992) {
          closeSidebar();
        }
      });
    });
  }

  // --- Confirm delete actions ---
  var deleteForms = document.querySelectorAll('form[onsubmit*="confirm"]');
  deleteForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!confirm('Are you sure?')) {
        e.preventDefault();
      }
    });
  });

  // --- Tooltip initialization ---
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (el) {
    return new bootstrap.Tooltip(el);
  });

  // --- Mobile navbar auto-close on link click ---
  var mainNavCollapse = document.getElementById('mainNav');
  if (mainNavCollapse && window.innerWidth < 992) {
    mainNavCollapse.querySelectorAll('.nav-link:not(.dropdown-toggle)').forEach(function (link) {
      link.addEventListener('click', function () {
        var bsCollapse = bootstrap.Collapse.getInstance(mainNavCollapse);
        if (bsCollapse) bsCollapse.hide();
      });
    });
  }

  // --- Active nav link highlight ---
  var currentPath = window.location.pathname;
  document.querySelectorAll('.navbar-nav .nav-link, .admin-sidebar .nav-link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && currentPath.startsWith(href) && href !== '/') {
      link.classList.add('active');
    } else if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    }
  });

  // --- Image lazy load animation ---
  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.6s ease';
    img.addEventListener('load', function () {
      img.style.opacity = '1';
    });
    if (img.complete) img.style.opacity = '1';
  });

  // --- Password visibility toggle ---
  document.querySelectorAll('.password-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.password-toggle-wrap');
      var input = wrap ? wrap.querySelector('input') : null;
      if (!input) return;
      var isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.innerHTML = isText
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
    });
  });

  // --- Textarea auto-resize ---
  document.querySelectorAll('textarea.auto-resize').forEach(function (ta) {
    function resize() {
      ta.style.height = 'auto';
      ta.style.height = (ta.scrollHeight + 2) + 'px';
    }
    ta.addEventListener('input', resize);
    resize();
  });

  // --- Character counter for inputs/textareas with data-maxlength ---- */
  document.querySelectorAll('[data-maxlength]').forEach(function (el) {
    var max = parseInt(el.getAttribute('data-maxlength'), 10);
    var counter = document.createElement('small');
    counter.className = 'char-counter text-muted d-block text-end mt-1';
    el.parentElement.appendChild(counter);
    function update() {
      var len = el.value.length;
      counter.textContent = len + ' / ' + max;
      counter.style.color = len >= max ? '#dc3545' : '';
    }
    el.setAttribute('maxlength', max);
    el.addEventListener('input', update);
    update();
  });

  // --- Highlight search term in table rows (data-search-highlight) ---
  var searchInputs = document.querySelectorAll('[data-search-highlight]');
  searchInputs.forEach(function (input) {
    var targetSelector = input.getAttribute('data-search-highlight');
    input.addEventListener('input', function () {
      var term = input.value.trim().toLowerCase();
      document.querySelectorAll(targetSelector).forEach(function (row) {
        var text = row.textContent.toLowerCase();
        row.style.display = (!term || text.includes(term)) ? '' : 'none';
      });
    });
  });

  // --- Ripple effect on .btn-ripple clicks ---
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-ripple');
    if (!btn) return;
    var circle = document.createElement('span');
    var diameter = Math.max(btn.clientWidth, btn.clientHeight);
    var rect = btn.getBoundingClientRect();
    circle.style.cssText = [
      'position:absolute',
      'border-radius:50%',
      'background:rgba(255,255,255,0.3)',
      'width:' + diameter + 'px',
      'height:' + diameter + 'px',
      'left:' + (e.clientX - rect.left - diameter / 2) + 'px',
      'top:' + (e.clientY - rect.top - diameter / 2) + 'px',
      'pointer-events:none',
      'animation:rippleEffect 0.55s linear',
      'transform:scale(0)'
    ].join(';');
    if (!document.getElementById('ripple-style')) {
      var s = document.createElement('style');
      s.id = 'ripple-style';
      s.textContent = '@keyframes rippleEffect{to{transform:scale(2.5);opacity:0}}';
      document.head.appendChild(s);
    }
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(circle);
    setTimeout(function () { circle.remove(); }, 600);
  });

  // --- CSP-safe: confirm dialogs via data-confirm attribute ---
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-confirm]');
    if (form && !confirm(form.getAttribute('data-confirm'))) {
      e.preventDefault();
    }
  });

  // --- CSP-safe: image error fallbacks via data- attributes ---
  document.querySelectorAll('img[data-hide-on-error]').forEach(function (img) {
    img.addEventListener('error', function () {
      var action = img.getAttribute('data-hide-on-error');
      if (action === 'parent') {
        img.parentElement.style.display = 'none';
      } else if (action === 'invisible') {
        img.style.visibility = 'hidden';
      } else if (action === 'sibling') {
        img.style.display = 'none';
        if (img.nextElementSibling) img.nextElementSibling.style.display = 'flex';
      } else {
        img.style.display = 'none';
      }
    });
  });
  document.querySelectorAll('img[data-fallback-src]').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.src !== img.getAttribute('data-fallback-src')) {
        img.src = img.getAttribute('data-fallback-src');
      }
    });
  });

  // --- CSP-safe: dynamic select navigation via data-nav-pattern ---
  document.querySelectorAll('select[data-nav-pattern]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      window.location.href = sel.getAttribute('data-nav-pattern').replace('{value}', encodeURIComponent(sel.value));
    });
  });

  // --- CSP-safe: hover lift effect via data-hover-lift ---
  document.querySelectorAll('[data-hover-lift]').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      el.style.transform = 'translateY(-4px)';
      el.style.boxShadow = 'var(--shadow-lg)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
      el.style.boxShadow = '';
    });
  });

  // --- CSP-safe: map card zoom hover via data-hover-zoom ---
  document.querySelectorAll('[data-hover-zoom]').forEach(function (el) {
    var targetSel = el.getAttribute('data-hover-zoom');
    el.addEventListener('mouseenter', function () {
      el.style.transform = 'scale(1.018)';
      el.style.boxShadow = '0 32px 80px rgba(0,0,0,0.7)';
      var inner = el.querySelector(targetSel);
      if (inner) inner.style.transform = 'scale(1.06)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 24px 64px rgba(0,0,0,0.55)';
      var inner = el.querySelector(targetSel);
      if (inner) inner.style.transform = 'scale(1)';
    });
  });

  // --- CSP-safe: directional link hover ---
  document.querySelectorAll('[data-hover-bg]').forEach(function (el) {
    var parts = el.getAttribute('data-hover-bg').split('|');
    var hoverBg = parts[0], hoverBorder = parts[1];
    var origBg = el.style.background;
    var origBorder = el.style.borderColor;
    el.addEventListener('mouseenter', function () {
      el.style.background = hoverBg;
      if (hoverBorder) el.style.borderColor = hoverBorder;
    });
    el.addEventListener('mouseleave', function () {
      el.style.background = origBg;
      el.style.borderColor = origBorder;
    });
  });

  // --- Client-side form validation ---
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      // Skip forms that explicitly opt out
      if (form.hasAttribute('data-no-validate')) return;
      var firstInvalid = null;
      // Check all required and patterned inputs
      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        // Remove previous custom state
        field.classList.remove('is-invalid');
        var existingMsg = field.parentElement.querySelector('.client-validation-msg');
        if (existingMsg) existingMsg.remove();

        var msg = '';
        if (field.hasAttribute('required') && !field.value.trim()) {
          msg = 'This field is required.';
        } else if (field.type === 'email' && field.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
          msg = 'Please enter a valid email address.';
        } else if (field.hasAttribute('minlength') && field.value.length > 0 && field.value.length < parseInt(field.getAttribute('minlength'), 10)) {
          msg = 'Must be at least ' + field.getAttribute('minlength') + ' characters.';
        }

        if (msg) {
          e.preventDefault();
          field.classList.add('is-invalid');
          var errDiv = document.createElement('div');
          errDiv.className = 'invalid-feedback client-validation-msg';
          errDiv.style.display = 'block';
          errDiv.textContent = msg;
          field.parentElement.appendChild(errDiv);
          if (!firstInvalid) firstInvalid = field;
        }
      });

      // Password match check
      var pw = form.querySelector('input[name="password"]');
      var pw2 = form.querySelector('input[name="password2"]');
      if (pw && pw2 && pw.value && pw2.value && pw.value !== pw2.value) {
        e.preventDefault();
        pw2.classList.add('is-invalid');
        var oldMsg = pw2.parentElement.querySelector('.client-validation-msg');
        if (oldMsg) oldMsg.remove();
        var matchDiv = document.createElement('div');
        matchDiv.className = 'invalid-feedback client-validation-msg';
        matchDiv.style.display = 'block';
        matchDiv.textContent = 'Passwords do not match.';
        pw2.parentElement.appendChild(matchDiv);
        if (!firstInvalid) firstInvalid = pw2;
      }

      if (firstInvalid) firstInvalid.focus();
    });

    // Clear validation on input
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        field.classList.remove('is-invalid');
        var msg = field.parentElement.querySelector('.client-validation-msg');
        if (msg) msg.remove();
      });
    });
  });

});
