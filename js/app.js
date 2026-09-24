document.addEventListener('DOMContentLoaded', () => {
  const memoryInput = document.getElementById('memoryText');
  const memoryPreview = document.getElementById('memoryPreviewText');
  const memoryDate = document.getElementById('memoryPreviewDate');
  const memoryCount = document.getElementById('memoryCharacterCount');

  if (memoryInput && memoryPreview && memoryDate && memoryCount) {
    const today = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    memoryDate.textContent = today;

    memoryInput.addEventListener('input', () => {
      const value = memoryInput.value.trim();
      memoryPreview.textContent = value || 'اكتب جملة صغيرة، وستظهر هنا كذكرى.';
      memoryCount.textContent = `${memoryInput.value.length} / ${memoryInput.maxLength}`;
      memoryPreview.classList.toggle('has-content', Boolean(value));
    });
  }

  const categoryPreview = document.getElementById('categoryPreview');
  const categoryTabs = document.querySelectorAll('.category-tab');
  const categoryContent = {
    memories: {
      className: 'preview-memory',
      description: 'صور + تاريخ + كلمات',
      cards: ['صورة من الأمس', '23 سبتمبر', 'لحظة لا تُنسى', 'ملاحظة صغيرة']
    },
    letters: {
      className: 'preview-letter',
      description: 'رسالة إلى شخص تحبه',
      cards: ['إلى صديقي', 'بخط يدي', 'مع كل الامتنان', 'افتحها بهدوء']
    },
    quotes: {
      className: 'preview-quote',
      description: 'كلمات وأفكار تستحق البقاء',
      cards: ['«تبقى الأشياء الجميلة»', 'فكرة اليوم', 'بين السطور', 'كلمة أحبها']
    },
    poetry: {
      className: 'preview-poetry',
      description: 'أبيات وقصائدك المفضلة',
      cards: ['قصيدة أحبها', 'بيت من الذاكرة', 'على هامش الورق', 'صوت القصيدة']
    },
    journals: {
      className: 'preview-journal',
      description: 'لحظة من يومك',
      cards: ['صباح هادئ', 'ما حدث اليوم', 'مزاجي الآن', 'غدًا أجمل']
    },
    verses: {
      className: 'preview-verse',
      description: 'بتصميم هادئ ومحترم',
      cards: ['آية أتأملها', 'طمأنينة', 'ورد اليوم', 'بخط هادئ']
    }
  };

  function renderCategory(key) {
    if (!categoryPreview || !categoryContent[key]) return;
    const category = categoryContent[key];
    categoryPreview.className = `category-preview ${category.className}`;
    categoryPreview.innerHTML = `
      <div class="category-preview-heading">
        <span class="category-preview-kicker">${category.description}</span>
        <span class="category-preview-mark">✦</span>
      </div>
      <div class="category-preview-grid">
        ${category.cards.map((card, index) => `<div class="category-preview-card preview-card-${index + 1}"><span>${card}</span><i aria-hidden="true">${index % 2 === 0 ? '✦' : '⌁'}</i></div>`).join('')}
      </div>`;
  }

  if (categoryPreview && categoryTabs.length) {
    renderCategory('memories');
    categoryTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach((item) => {
          const active = item === tab;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', String(active));
        });
        renderCategory(tab.dataset.category);
      });
    });
  }

  const LAUNCH_DATE = '2026-12-24T00:00:00Z';

  function initLaunchCountdown() {
    const dateNode = document.getElementById('launchDate');
    const countdownLabel = document.getElementById('countdownLabel');
    const countdownGrid = document.getElementById('countdownGrid');
    const daysNode = document.getElementById('countdownDays');
    const hoursNode = document.getElementById('countdownHours');
    const minutesNode = document.getElementById('countdownMinutes');
    const secondsNode = document.getElementById('countdownSeconds');

    if (!dateNode || !countdownLabel || !countdownGrid || !daysNode || !hoursNode || !minutesNode || !secondsNode) return;

    dateNode.dateTime = LAUNCH_DATE;

    const updateCountdown = () => {
      const remaining = Math.max(0, new Date(LAUNCH_DATE).getTime() - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const isLaunched = remaining === 0;
      const lang = document.documentElement.lang || 'ar';

      daysNode.textContent = days;
      hoursNode.textContent = hours;
      minutesNode.textContent = minutes;
      secondsNode.textContent = seconds;

      if (isLaunched) {
        countdownLabel.textContent = translations[lang]?.['launch.launched'] || translations.ar['launch.launched'];
        countdownGrid.hidden = true;
        dateNode.textContent = translations[lang]?.['launch.live'] || translations.ar['launch.live'];
        return;
      }

      countdownLabel.textContent = translations[lang]?.['launch.remaining'] || translations.ar['launch.remaining'];
      countdownGrid.hidden = false;
    };

    updateCountdown();
    window.setInterval(updateCountdown, 1000);
    document.addEventListener('waraq-language-changed', updateCountdown);
  }

  initLaunchCountdown();

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const yearNode = document.getElementById('year');
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach((faq) => faq.classList.remove('active'));
      if (!isOpen) item.classList.add('active');
    });
  });

  const waitlistForm = document.getElementById('waitlistForm');
  const waitlistInput = document.getElementById('waitlistInput');
  const formMessage = document.getElementById('formMessage');

  if (waitlistForm && waitlistInput) {
    waitlistForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = waitlistInput.value.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^\+?[0-9\s\-()]{8,}$/.test(value);

      if (!isEmail && !isPhone) {
        formMessage.textContent = document.documentElement.lang === 'en'
          ? 'Please enter a valid email or phone number.'
          : document.documentElement.lang === 'fa'
            ? 'لطفاً یک ایمیل یا شماره تلفن معتبر وارد کنید.'
            : 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح.';
        formMessage.style.color = '#b85f52';
        return;
      }

      const payload = {
        emailOrPhone: value,
        preferredLanguage: document.getElementById('preferredLang')?.value || document.documentElement.lang,
        timestamp: new Date().toISOString()
      };

      try {
        localStorage.setItem('waraq-waitlist', JSON.stringify(payload));
      } catch (error) {
        // Ignore storage restrictions in some browsers.
      }

      formMessage.textContent = document.documentElement.lang === 'en'
        ? 'You have been added to the waitlist.'
        : document.documentElement.lang === 'fa'
          ? 'شما به لیست انتظار اضافه شدید.'
          : 'تمت إضافتك إلى قائمة الانتظار.';
      formMessage.style.color = '#8B684A';
      waitlistForm.reset();
    });
  }

  const roadmap = document.getElementById('roadmapList');
  if (roadmap) {
    const roadmapSteps = [
      { phase: 'Concept & Design', ar: 'هوية المشروع وتصميم الفكرة', fa: 'هویت برند و طراحی ایده', en: 'Concept & design' },
      { phase: 'Core App Development', ar: 'تطوير التطبيق الأساسي', fa: 'توسعه اپلیکیشن اصلی', en: 'Core app development' },
      { phase: 'Template & Asset Library', ar: 'مكتبة القوالب والعناصر', fa: 'کتابخانه قالب‌ها و عناصر', en: 'Template and asset library' },
      { phase: 'Beta', ar: 'الإصدار التجريبي', fa: 'نسخه بتا', en: 'Beta test' },
      { phase: 'Version 1.0', ar: 'الإصدار 1.0', fa: 'نسخه 1.0', en: 'Version 1.0' },
      { phase: 'Future Expansion', ar: 'التوسع المستقبلي', fa: 'گسترش آینده', en: 'Future expansion' }
    ];

    const currentLang = document.documentElement.lang || 'ar';
    roadmap.innerHTML = roadmapSteps.map((item) => {
      const label = item[currentLang] || item.ar;
      return `
        <div class="roadmap-item">
          <div class="roadmap-phase">${item.phase}</div>
          <div class="roadmap-info">${label}</div>
        </div>
      `;
    }).join('');
  }
});
