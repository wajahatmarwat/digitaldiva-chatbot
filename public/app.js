/* ================================================================
   Digital Diva AI Chatbot — Frontend Application Logic
   ================================================================ */

// ── DOM refs ──────────────────────────────────────────────────────
const chatEl       = document.getElementById('chat');
const formEl       = document.getElementById('chat-form');
const messageEl    = document.getElementById('message');
const leadFormEl   = document.getElementById('lead-form');
const leadStatusEl = document.getElementById('lead-status');
const newChatBtn   = document.getElementById('new-chat-btn');
const followupsEl  = document.getElementById('followups');
const reviewModal  = document.getElementById('lead-review-modal');
const modalBody    = document.getElementById('modal-body');
const reviewConfirm= document.getElementById('review-confirm');
const reviewEdit   = document.getElementById('review-edit');
const modalClose   = document.getElementById('modal-close');

// ── State ─────────────────────────────────────────────────────────
let sessionId = '';
const whatsappNumber = '923058977853';

const quoteState = {
  inProgress: false, step: 0, answers: {}, region: 'pakistan', packageSet: null,
  awaitingContact: false, awaitingEmail: false, awaitingCompany: false,
  awaitingBudget: false, awaitingGoals: false
};
let leadDraftName = '';

// ── Helpers ───────────────────────────────────────────────────────
function buildWhatsAppUrl(message) {
  return `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
}

function detectRegionFromText(text) {
  const intlRe = /\b(usd|dollar|dollars|international|overseas|usa|america|united states|canada|uk|england|europe|singapore|uae|dubai|australia|new zealand|euro|pound|sterling)\b/i;
  const pakRe  = /\b(pakistan|pak|pk|lahore|karachi|islamabad|faisalabad|rawalpindi)\b/i;
  const romUrdu= /\b(kitna|kahan|hai|hoga|kya|mujhe|shayad|bhai|ji|acha|theek)\b/i;
  if (pakRe.test(text)) return 'pakistan';
  if (intlRe.test(text)) return 'international';
  if (!romUrdu.test(text) && /[A-Za-z]/.test(text) && text.length > 20) return 'international';
  return quoteState.region || 'pakistan';
}

function getPackageSet() {
  if (quoteState.answers.scope === 'full') return 'B';
  if (quoteState.answers.scope === 'startup') return quoteState.region === 'international' ? 'B' : 'C';
  if (['not_sure', 'one'].includes(quoteState.answers.scope)) return quoteState.region === 'international' ? 'B' : 'A';
  return quoteState.region === 'international' ? 'B' : 'A';
}

function getPackageSetName() {
  const s = quoteState.packageSet || getPackageSet();
  return s === 'A' ? 'Marketing Plan (PKR)' : s === 'B' ? 'Full Marketing Plan (USD)' : 'Startup Bundle';
}

function showPackageOptions() {
  const s = quoteState.packageSet || getPackageSet();
  
  if (s === 'A') {
    showBotWithButtons(
      "Based on what you've told me, here's where most businesses like yours start:\n\n" +
      "**Standard Package — PKR 50,000/month**\n" +
      "2 social media platforms + website management. Strategy session, marketing plan, branding, graphic design, content creation (35 posts, video, GIFs), paid ads (10 campaigns + creatives), weekly reports, 2 strategy calls/month.\n\n" +
      "**Professional Package — PKR 75,000/month**\n" +
      "3 social media platforms + website management. Same core scope plus 45 posts, 15 ad campaigns + creatives, daily reports, weekly strategy calls.\n\n" +
      "**Premium Package — PKR 100,000/month**\n" +
      "5 social media platforms + website management. 60 posts, unlimited ad campaigns + creatives, daily reports, customised strategy call.\n\n" +
      "Note: ad spend (paid promotion budget) is separate and not included in any tier.\n\nLet me know if one feels right, or if you'd like us to put a custom proposal together.",
      [
        { label: 'Standard sounds right — get a proposal', action: 'LEAD_OPTIONS' },
        { label: 'Professional sounds right',              action: 'LEAD_OPTIONS' },
        { label: 'Premium sounds right',                   action: 'LEAD_OPTIONS' },
        { label: 'I need a custom quote',                  action: 'TALK_TO_TEAM' }
      ]
    );
  } else if (s === 'B') {
    const intlNote = quoteState.answers.scope === 'startup'
      ? "For international clients we run this as part of one plan rather than splitting by channel — here's how that looks:\n\n"
      : "";
    showBotWithButtons(
      intlNote +
      "Based on what you've told me, here's where most businesses like yours start:\n\n" +
      "**Starter Package — USD 200/month**\n" +
      "2 platforms (Facebook, Instagram), 10 posts/month, engagement, hashtag strategy, basic monthly analytics, content calendar.\n\n" +
      "**Growth Package — USD 500/month**\n" +
      "3 platforms (Facebook, Instagram, LinkedIn or TikTok), 20 posts/month, 4 reels + 4 stories, community management, up to 2 ad campaigns, basic on-page SEO, 1 email campaign setup, monthly analytics report. Ad spend excluded.\n\n" +
      "**Premium Package — USD 1,000/month**\n" +
      "5 platforms (Facebook, Instagram, LinkedIn, TikTok, YouTube), 30 posts, 8 reels + 8 stories + 2 long-form videos, full community management, up to 5 ad campaigns, full SEO + blog strategy, 2 email campaigns/month, landing page design, monthly strategy call, detailed KPI tracking. Ad spend excluded.\n\nLet me know if one feels right, or if you'd like us to put a custom proposal together.",
      [
        { label: 'Starter sounds right — get a proposal', action: 'LEAD_OPTIONS' },
        { label: 'Growth sounds right',                    action: 'LEAD_OPTIONS' },
        { label: 'Premium sounds right',                   action: 'LEAD_OPTIONS' },
        { label: 'I need a custom quote',                  action: 'TALK_TO_TEAM' }
      ]
    );
  } else {
    // Set C — Startup Bundle
    showBotWithButtons(
      "Based on what you've told me, here's the right starting point:\n\n" +
      "**Startup Bundle — PKR 150,000/month**\n" +
      "Built for brand-new businesses: a full website build, plus all core marketing services running alongside it — social media management, content & creative, paid ads management, and ongoing strategy — so the brand launches with its site and marketing moving together from day one.\n\n" +
      "If you'd prefer to start with just one part (e.g. social only, no website yet), I can show you smaller options too.",
      [
        { label: 'This sounds right — get a proposal', action: 'LEAD_OPTIONS' },
        { label: 'Show me smaller options instead',    action: 'QUOTE_ONE_FROM_STARTUP' },
        { label: 'I need a custom quote',              action: 'TALK_TO_TEAM' }
      ]
    );
  }
}

// ── UI Rendering ──────────────────────────────────────────────────

/** Simple markdown formatter: **bold** and newlines → HTML */
function formatMessage(text) {
  // Escape any actual HTML first to prevent XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Convert **bold** to <strong>
  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Convert newlines to <br>
  return bolded.replace(/\n/g, '<br>');
}

/** Add a message bubble to the chat */
function appendMessage(text, role) {
  // Remove any existing typing indicator
  const existingTyping = chatEl.querySelector('.msg.typing');
  if (existingTyping) existingTyping.remove();

  const div = document.createElement('div');
  div.className = `msg ${role}`;
  // Use innerHTML with safe formatter (escapes HTML, only converts markdown)
  div.innerHTML = formatMessage(text);
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

/** Show animated typing indicator */
function showTyping() {
  const existing = chatEl.querySelector('.msg.typing');
  if (existing) return;
  const div = document.createElement('div');
  div.className = 'msg typing';
  div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

/** Remove typing indicator */
function hideTyping() {
  const t = chatEl.querySelector('.msg.typing');
  if (t) t.remove();
}

/** Clear quick-reply pills */
function clearFollowups() {
  followupsEl.innerHTML = '';
}

/** Render bot message + quick-reply buttons with typing delay */
function showBotWithButtons(text, buttons = []) {
  clearFollowups();
  showTyping();
  
  const delay = Math.min(1200, Math.max(600, text.length * 15));
  
  setTimeout(() => {
    hideTyping();
    appendMessage(text, 'bot');

    if (buttons.length) {
      const row = document.createElement('div');
      row.className = 'followups-row';
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply';
        btn.textContent = b.label;
        btn.addEventListener('click', () => {
          appendMessage(b.label, 'user');
          handleAction(b.action, b.value);
        });
        row.appendChild(btn);
      });
      followupsEl.appendChild(row);
    }

    renderPersistentButtons();
    chatEl.scrollTop = chatEl.scrollHeight;
  }, delay);
}

/** Always-visible persistent action buttons */
function renderPersistentButtons() {
  if (followupsEl.querySelector('.persistent-actions')) return;
  const wrap = document.createElement('div');
  wrap.className = 'persistent-actions';
  const mainBtn = document.createElement('button');
  mainBtn.textContent = 'Main Menu';
  mainBtn.className = 'quick-reply';
  mainBtn.addEventListener('click', () => {
    appendMessage('Main Menu', 'user');
    handleAction('MAIN_MENU');
  });
  wrap.appendChild(mainBtn);
  followupsEl.appendChild(wrap);
}

// ── Main Menu ─────────────────────────────────────────────────────

function showMainMenu() {
  showBotWithButtons(
    "Hi, I'm Diva 👋 from Digital Diva — we run marketing for brands across Pakistan and internationally. How can I help today?",
    [
      { label: 'Explore Services',   action: 'EXPLORE_SERVICES' },
      { label: 'Get a Quote',        action: 'GET_QUOTE' },
      { label: 'See Our Work',       action: 'SEE_WORK' },
      { label: 'About Digital Diva', action: 'ABOUT' },
      { label: 'Talk to the Team',   action: 'TALK_TO_TEAM' }
    ]
  );
}

// ── Quote Flow Helpers ────────────────────────────────────────────

function showBusinessStage(extraText = '') {
  let prompt = `${extraText}And which best describes your business right now?`;
  showBotWithButtons(prompt, [
    { label: 'Startup / new brand',              action: 'BUSINESS_STAGE', value: 'Startup' },
    { label: 'Growing SME',                      action: 'BUSINESS_STAGE', value: 'Growing SME' },
    { label: 'Established business scaling up',  action: 'BUSINESS_STAGE', value: 'Established' },
    { label: 'E-commerce store',                 action: 'BUSINESS_STAGE', value: 'E-commerce' },
    { label: 'Agency / reseller',                action: 'BUSINESS_STAGE', value: 'Agency' }
  ]);
}

function startQuoteFlow(prefill) {
  quoteState.inProgress = true;
  quoteState.step = 1;
  quoteState.answers = { category: prefill || '' };
  showBotWithButtons(
    'Happy to help ✨ Mind if I ask a couple of quick things first? It\'ll help me point you to the right place — takes a minute.',
    [
      { label: "Sure, let's go",       action: 'QUOTE_B1_SURE' },
      { label: 'Just give me pricing', action: 'QUOTE_B1_PRICING' }
    ]
  );
}

// ── Action Handler ────────────────────────────────────────────────

function handleAction(action, value) {
  switch ((action || '').toString()) {

    case 'MAIN_MENU':
      showMainMenu();
      break;

    case 'TALK_TO_TEAM':
      showBotWithButtons('Of course — here are the best ways to reach us directly:', [
        { label: 'WhatsApp Us',     action: 'WHATSAPP' },
        { label: 'Email / Lead Form', action: 'EMAIL' },
        { label: 'Book a Call',     action: 'BOOK' }
      ]);
      break;

    case 'EXPLORE_SERVICES':
      showBotWithButtons('Sure — here\'s what we work on. Tap a category and I\'ll give you a quick rundown:', [
        { label: 'Growth & Visibility (SEO/Ads)', action: 'EXPLORE_SEO' },
        { label: 'Content & Creative',            action: 'EXPLORE_CONTENT' },
        { label: 'Web & Shopify',                 action: 'EXPLORE_WEB' },
        { label: 'Email & Retention',             action: 'EXPLORE_EMAIL' },
        { label: 'Show me everything',            action: 'EXPLORE_ALL' }
      ]);
      break;

    case 'EXPLORE_SEO':
      showBotWithButtons(
        "Our Growth & Visibility team gets your brand seen by the right people:\n\nSEO — technical audits, on-page optimisation, content that ranks\nPaid Ads — Google, Meta, TikTok targeting & creative testing\nAnalytics — live dashboards and regular performance check-ins",
        [
          { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_SEO' },
          { label: 'See another category', action: 'EXPLORE_SERVICES' },
          { label: 'Talk to the Team',     action: 'TALK_TO_TEAM' }
        ]
      );
      break;

    case 'EXPLORE_CONTENT':
      showBotWithButtons(
        "Our Content & Creative team builds everything your brand needs to stand out:\n\nContent — blogs, social media copy, ad scripts\nGraphic Design — social creatives, brand assets, presentation decks\nVideo — scripts, storyboards, editing, subtitles\nBranding — visual identity, positioning, brand voice",
        [
          { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_CONTENT' },
          { label: 'See another category', action: 'EXPLORE_SERVICES' },
          { label: 'Talk to the Team',     action: 'TALK_TO_TEAM' }
        ]
      );
      break;

    case 'EXPLORE_WEB':
      showBotWithButtons(
        "We design, build and maintain websites and online stores — currently working in WordPress/Elementor and Shopify, with everything set up for clean structure and on-page SEO from day one:\n\nWebsite design & development (WordPress)\nShopify store setup, design & ongoing management\nLanding pages & funnels\nWebsite audits, speed & technical fixes",
        [
          { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_WEB' },
          { label: 'See another category', action: 'EXPLORE_SERVICES' },
          { label: 'Talk to the Team',     action: 'TALK_TO_TEAM' }
        ]
      );
      break;

    case 'EXPLORE_EMAIL':
      showBotWithButtons(
        "Our Email & Retention team turns one-time visitors into loyal customers:\n\nEmail Marketing — welcome flows, newsletters, and automation\nRetention Strategy — lifecycle campaigns to boost repeat purchases\nAccount Management — ongoing support and optimisation",
        [
          { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_EMAIL' },
          { label: 'See another category', action: 'EXPLORE_SERVICES' },
          { label: 'Talk to the Team',     action: 'TALK_TO_TEAM' }
        ]
      );
      break;

    case 'EXPLORE_AI':
      showBotWithButtons(
        "AI tools are built into how we work across every service — from research and strategy to reporting. It lets our teams move faster and stay sharper, while every strategy is still shaped by our specialists.\n\nIf you're looking for a specific AI product like a chatbot or automation workflow, we can build that too.",
        [
          { label: 'Get a quote for this', action: 'GET_QUOTE' },
          { label: 'See another category', action: 'EXPLORE_SERVICES' },
          { label: 'Talk to the Team',     action: 'TALK_TO_TEAM' }
        ]
      );
      break;

    case 'EXPLORE_ALL':
      showBotWithButtons(
        "Here's the full picture of what we do:\n\nSEO · Paid Ads · Social Media · Content Marketing · Email Marketing · Web Development · Shopify · Graphic Design · Video Production · Branding · AI Automation · Analytics & Strategy",
        [
          { label: 'Get a quote', action: 'GET_QUOTE' },
          { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
        ]
      );
      break;

    case 'GET_QUOTE':
      startQuoteFlow();
      break;

    case 'GET_QUOTE_FOR_SEO':
    case 'GET_QUOTE_FOR_CONTENT':
    case 'GET_QUOTE_FOR_WEB':
    case 'GET_QUOTE_FOR_EMAIL':
      startQuoteFlow(value || action.replace('GET_QUOTE_FOR_', ''));
      break;

    case 'QUOTE_B1_SURE':
      quoteState.inProgress = true;
      quoteState.step = 2;
      quoteState.answers = { category: quoteState.answers.category || '' };
      showBotWithButtons('First up — are you looking for help with one specific thing, more general ongoing marketing support across the board, or are you a new business looking to get set up from scratch?', [
        { label: 'One specific service',                action: 'QUOTE_ONE' },
        { label: 'Full marketing support (everything)', action: 'QUOTE_FULL' },
        { label: "I'm a new business / startup",        action: 'QUOTE_STARTUP' },
        { label: 'Not sure yet',                        action: 'QUOTE_NOT_SURE' }
      ]);
      break;

    case 'QUOTE_B1_PRICING':
      quoteState.inProgress = true;
      quoteState.step = 2;
      quoteState.answers = { category: quoteState.answers.category || '' };
      showBotWithButtons('Which service are you looking for pricing on?', [
        { label: 'SEO',                  action: 'QUOTE_SERVICE', value: 'SEO' },
        { label: 'Paid Ads',             action: 'QUOTE_SERVICE', value: 'Paid Ads' },
        { label: 'Content & Social',     action: 'QUOTE_SERVICE', value: 'Content & Social' },
        { label: 'Website (WordPress)',  action: 'QUOTE_SERVICE', value: 'Website' },
        { label: 'Shopify Store',        action: 'QUOTE_SERVICE', value: 'Shopify' },
        { label: 'Email Marketing',      action: 'QUOTE_SERVICE', value: 'Email' },
        { label: 'Something else',       action: 'QUOTE_SERVICE', value: 'Other' }
      ]);
      break;

    case 'QUOTE_ONE':
      quoteState.answers.scope = 'one';
      quoteState.step = 3;
      if (quoteState.answers.category) {
        // Pre-filled from Branch A — skip service picker, go to business stage
        quoteState.answers.service = quoteState.answers.category;
        showBusinessStage();
      } else {
        showBotWithButtons('Got it — which one are you thinking about?', [
          { label: 'SEO',              action: 'QUOTE_SERVICE', value: 'SEO' },
          { label: 'Paid Ads',         action: 'QUOTE_SERVICE', value: 'Paid Ads' },
          { label: 'Content & Social', action: 'QUOTE_SERVICE', value: 'Content & Social' },
          { label: 'Website',          action: 'QUOTE_SERVICE', value: 'Website' },
          { label: 'Shopify Store',    action: 'QUOTE_SERVICE', value: 'Shopify' },
          { label: 'Email Marketing',  action: 'QUOTE_SERVICE', value: 'Email' },
          { label: 'Something else',   action: 'QUOTE_SERVICE', value: 'Other' }
        ]);
      }
      break;

    case 'QUOTE_FULL':
      quoteState.answers.scope = 'full';
      quoteState.step = 4;
      showBusinessStage("That's usually our favourite kind of project — it means we can plan everything together instead of working around gaps. ");
      break;

    case 'QUOTE_STARTUP':
      // New business / startup goes straight to timeline (stage is implied), then Set C
      quoteState.answers.scope = 'startup';
      quoteState.answers.stage = 'Startup';
      quoteState.step = 5;
      showBotWithButtons('Last one — when are you hoping to get started?', [
        { label: 'Right away',             action: 'TIMELINE', value: 'Right away' },
        { label: 'Within a month',         action: 'TIMELINE', value: 'Within a month' },
        { label: 'Just exploring options', action: 'TIMELINE', value: 'Exploring' }
      ]);
      break;

    case 'QUOTE_NOT_SURE':
      quoteState.answers.scope = 'not_sure';
      quoteState.step = 4;
      appendMessage("No worries — that's a normal place to start. Let's narrow it down.", 'bot');
      showBusinessStage();
      break;

    case 'QUOTE_ONE_FROM_STARTUP':
      // Startup visitor wants smaller options — switch to Set A
      quoteState.answers.scope = 'one';
      quoteState.packageSet = quoteState.region === 'international' ? 'B' : 'A';
      showPackageOptions();
      break;

    case 'QUOTE_SERVICE':
      quoteState.answers.service = value;
      if (!quoteState.answers.scope) {
        quoteState.answers.scope = 'one';
        quoteState.step = 3;
        showBotWithButtons('Are you based in Pakistan, or is this an international project?', [
          { label: 'Pakistan / PKR',      action: 'QUOTE_REGION', value: 'pakistan' },
          { label: 'International / USD', action: 'QUOTE_REGION', value: 'international' }
        ]);
        return;
      }
      quoteState.step = 4;
      showBusinessStage();
      break;

    case 'QUOTE_REGION':
      quoteState.region = value;
      quoteState.step = 4;
      showBusinessStage();
      break;

    case 'BUSINESS_STAGE':
      quoteState.answers.stage = value;
      quoteState.step = 5;
      let extra = '';
      if (quoteState.answers.service === 'SEO' && value === 'Startup') {
        extra = "Heads up — for brand-new sites, we usually pair SEO with a quick technical check first, so nothing's holding the site back before we start building rankings.\n\n";
      } else if (quoteState.answers.service === 'Shopify' && value === 'E-commerce') {
        extra = "If you're already selling, it's often worth a quick look at your store setup alongside ads — a few small fixes can make paid traffic convert a lot better.\n\n";
      } else if (quoteState.answers.service === 'Content & Social' && value === 'Startup') {
        extra = "For new brands, we typically start with a short content plan before posting — so everything ties back to one direction instead of one-off posts.\n\n";
      }
      showBotWithButtons(`${extra}Last one — when are you hoping to get started?`, [
        { label: 'Right away',             action: 'TIMELINE', value: 'Right away' },
        { label: 'Within a month',         action: 'TIMELINE', value: 'Within a month' },
        { label: 'Just exploring options', action: 'TIMELINE', value: 'Exploring' }
      ]);
      break;

    case 'TIMELINE':
      quoteState.answers.timeline = value;
      quoteState.step = 6;
      quoteState.packageSet = getPackageSet();
      showPackageOptions();
      break;

    case 'PACKAGE_TELL_MORE':
      showBotWithButtons(
        'Our packages scale with your scope. The team confirms the right starting point after reviewing your goals. Ready to connect?',
        [
          { label: 'Get a proposal',  action: 'LEAD_OPTIONS' },
          { label: 'Talk to Team',    action: 'TALK_TO_TEAM' },
          { label: 'Main Menu',       action: 'MAIN_MENU' }
        ]
      );
      break;

    case 'LEAD_OPTIONS':
      quoteState.awaitingContact = true;
      quoteState.awaitingEmail = false;
      showBotWithButtons('Great — how would you like to continue?', [
        { label: 'Continue on WhatsApp', action: 'LEAD_WHATSAPP' },
        { label: 'Fill lead form',       action: 'LEAD_EMAIL' },
        { label: 'Book a call directly', action: 'LEAD_BOOK' }
      ]);
      break;

    case 'LEAD_WHATSAPP': {
      const pre = `Hi Digital Diva! I came from your website chat — I'm interested in ${quoteState.answers.service || 'your marketing services'} for my ${quoteState.answers.stage || 'business'}.`;
      const url = buildWhatsAppUrl(pre);
      showBotWithButtons('Tap below to open WhatsApp with your message pre-filled.', [
        { label: 'Open WhatsApp Chat', action: 'OPEN_URL', value: url },
        { label: 'Email Us Instead',   action: 'LEAD_EMAIL' },
        { label: 'Book a Call',        action: 'LEAD_BOOK' }
      ]);
      quoteState.awaitingContact = false;
      quoteState.awaitingEmail = false;
      break;
    }

    case 'LEAD_EMAIL':
      leadFormEl.elements['goals'].value = `Interest: ${quoteState.answers.service || ''}\nStage: ${quoteState.answers.stage || ''}\nTimeline: ${quoteState.answers.timeline || ''}`;
      prefillLeadFormFromChat();
      if (!leadFormEl.elements['goals'].value.trim()) {
        const inferred = inferQuoteFromChat();
        if (inferred.service || inferred.stage) {
          leadFormEl.elements['goals'].value = `Interest: ${inferred.service}\nStage: ${inferred.stage}\nTimeline: ${inferred.timeline}`;
        }
      }
      const anyPrefill = leadFormEl.elements['name'].value || leadFormEl.elements['email'].value || leadFormEl.elements['goals'].value.trim();
      
      const isWidgetMode = window.location.search.includes('widget=true');
      
      if (isWidgetMode) {
        quoteState.awaitingContact = true;
        quoteState.awaitingEmail = false;
        appendMessage("Sure! Please type your Name and Email address below so I can send your details to our team.", "bot");
      } else {
        document.querySelector('.lead-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (anyPrefill) {
          leadStatusEl.textContent = '✓ Prefilled from chat — review and submit.';
          showBotWithButtons("I've prefilled the form on the right. Review it and hit Submit when ready.", [
            { label: 'WhatsApp instead', action: 'LEAD_WHATSAPP' },
            { label: 'Book a Call',      action: 'LEAD_BOOK' }
          ]);
        } else {
          leadStatusEl.textContent = '';
          showBotWithButtons('The lead form is on the right — fill in your details and submit when ready.', [
            { label: 'WhatsApp instead', action: 'WHATSAPP' },
            { label: 'Book a Call',      action: 'LEAD_BOOK' }
          ]);
        }
        quoteState.awaitingContact = true;
      }
      quoteState.awaitingEmail = false;
      break;

    case 'LEAD_BOOK':
      showBotWithButtons("I can open our booking calendar — pick a time and we'll join ready.", [
        { label: 'Open Booking Calendar', action: 'OPEN_URL', value: 'https://calendly.com/' },
        { label: 'WhatsApp Us',           action: 'LEAD_WHATSAPP' },
        { label: 'Email / Lead Form',     action: 'LEAD_EMAIL' }
      ]);
      break;

    case 'EMAIL':
      showBotWithButtons('You can fill the lead form or reach the team directly.', [
        { label: 'Open lead form', action: 'LEAD_EMAIL' },
        { label: 'WhatsApp Us',   action: 'WHATSAPP' },
        { label: 'Book a Call',   action: 'BOOK' }
      ]);
      break;

    case 'BOOK':
      showBotWithButtons("Here's our booking calendar. Choose a slot and we'll be ready.", [
        { label: 'Open Booking Calendar', action: 'OPEN_URL', value: 'https://calendly.com/' },
        { label: 'WhatsApp Us',           action: 'WHATSAPP' },
        { label: 'Email Us',              action: 'EMAIL' }
      ]);
      break;

    case 'WHATSAPP':
      handleAction('LEAD_WHATSAPP');
      break;

    case 'SEE_WORK':
      showBotWithButtons(
        "We've completed 200+ projects for 50+ brands across 10+ countries — from FMCG and e-commerce to healthcare and fashion. What would help you most right now?",
        [
          { label: 'Show me case studies / portfolio',      action: 'SEE_WORK_PORTFOLIO' },
          { label: 'What industries do you work with?',     action: 'SEE_WORK_INDUSTRIES' },
          { label: 'I\'d like to speak to the team',        action: 'TALK_TO_TEAM' }
        ]
      );
      break;

    case 'SEE_WORK_PORTFOLIO':
      showBotWithButtons(
        "Our portfolio page has the full picture, with examples across industries and markets.",
        [
          { label: 'Open Portfolio Page', action: 'OPEN_URL', value: 'https://digitaldivapro.com/portfolio' },
          { label: 'Talk to the Team',    action: 'TALK_TO_TEAM' },
          { label: 'Main Menu',           action: 'MAIN_MENU' }
        ]
      );
      break;

    case 'SEE_WORK_INDUSTRIES':
      showBotWithButtons(
        "We've run campaigns across FMCG & beverages, e-commerce & fashion, healthcare, B2B manufacturing, and more — for clients based in Pakistan and internationally. Whatever your industry, we can adapt to it.",
        [
          { label: 'Get a Quote',      action: 'GET_QUOTE' },
          { label: 'Talk to the Team', action: 'TALK_TO_TEAM' },
          { label: 'Main Menu',        action: 'MAIN_MENU' }
        ]
      );
      break;

    case 'ABOUT':
      showBotWithButtons(
        "Digital Diva is a full-service digital marketing agency, founded in 2020 by Zil-e-Huma. We work as a set of specialist teams — one for every part of marketing — and we've delivered 200+ projects for 50+ brands across 10+ countries.",
        [
          { label: 'What makes you different?',                  action: 'ABOUT_DIFF' },
          { label: 'Where are you based / who can you work with?', action: 'ABOUT_BASED' },
          { label: 'Get a Quote',                                action: 'GET_QUOTE' },
          { label: 'Main Menu',                                  action: 'MAIN_MENU' }
        ]
      );
      break;

    case 'ABOUT_DIFF':
      showBotWithButtons(
        "A couple of things: we use AI tools across our process to work faster and stay sharp — from research to reporting — but every strategy and piece of work is shaped by our specialists, not handed off to a machine. And because we're set up as full teams (SEO, ads, content, design, web, analytics and more), you get a group working together for you, not one generalist juggling everything.",
        [
          { label: 'Tell me about your team', action: 'ABOUT_TEAM' },
          { label: 'Get a Quote',             action: 'GET_QUOTE' },
          { label: 'Main Menu',               action: 'MAIN_MENU' }
        ]
      );
      break;

    case 'ABOUT_TEAM':
      showBotWithButtons(
        "We're organised into specialist teams — Strategy, SEO, Ads, Content, Design, Video, Web & Shopify, Branding, Analytics, Email & Lifecycle, Client Success and more — all working together so nothing falls through the cracks.",
        [
          { label: 'Get a Quote',      action: 'GET_QUOTE' },
          { label: 'Talk to the Team', action: 'TALK_TO_TEAM' },
          { label: 'Main Menu',        action: 'MAIN_MENU' }
        ]
      );
      break;

    case 'ABOUT_BASED':
      showBotWithButtons(
        "We're proudly Pakistan-based and work with local brands across the country — and we also work with clients internationally, fully remote. Wherever you're reaching out from, we can work with you.",
        [
          { label: 'Get a Quote',      action: 'GET_QUOTE' },
          { label: 'Talk to the Team', action: 'TALK_TO_TEAM' },
          { label: 'Main Menu',        action: 'MAIN_MENU' }
        ]
      );
      break;

    case 'OPEN_URL':
      if (value) {
        const w = window.open(value, '_blank');
        if (!w) window.location.href = value;
      }
      break;

    default:
      console.log('Unhandled action:', action, value);
  }
}

// ── Keyword Router ────────────────────────────────────────────────
// Only intercept very short/simple messages. Longer questions and anything
// that looks like a real question go straight to the OpenAI API so the
// user gets a proper, informed answer instead of a hardcoded button menu.

const GREETING_RE = /^\s*(hi|hey|hello|salam|salaam|assalam|helo|sup|yo|hiya|good morning|good evening|good afternoon)\s*[!?.,]*\s*$/i;

// Words that indicate the user wants a real conversational answer, not a menu
const QUESTION_WORDS_RE = /\b(what|how|why|when|where|which|who|explain|tell me|describe|can you|do you|is there|are there|difference|compare|help me|i want|i need|i'm looking|looking for|interested in|want to know|give me|show me|want|need)\b/i;

// Simple direct-action keywords only for SHORT messages (≤ 4 words)
const shortKeywordRoutes = [
  { re: /\b(seo|ranking)\b/i,                                    action: 'EXPLORE_SEO' },
  { re: /\b(shopify|e-?commerce|ecommerce)\b/i,                  action: 'EXPLORE_WEB' },
  { re: /\b(website|wordpress)\b/i,                              action: 'EXPLORE_WEB' },
  { re: /\b(content|social media|instagram|reels)\b/i,           action: 'EXPLORE_CONTENT' },
  { re: /\b(ads|ppc|facebook|meta|tiktok|google ads)\b/i,        action: 'EXPLORE_SEO' },
  { re: /\b(price|pricing|cost|quote|rates|kitna|rate|budget)\b/i, action: 'GET_QUOTE' },
  { re: /\b(portfolio|our work|case study|examples|results)\b/i, action: 'SEE_WORK' },
  { re: /\b(about|company|founder|who are you)\b/i,              action: 'ABOUT' },
  { re: /\b(whatsapp|watsapp|human|agent|real person|call)\b/i,  action: 'TALK_TO_TEAM' },
  { re: /\b(ai automation|chatbot|automation)\b/i,               action: 'EXPLORE_AI' },
  { re: /\b(email marketing|newsletter|lifecycle)\b/i,           action: 'EXPLORE_EMAIL' },
  { re: /\b(services|what do you do|how can you help)\b/i,       action: 'EXPLORE_SERVICES' }
];

function routeByKeyword(text) {
  const trimmed = text.trim();

  // Always handle pure greetings locally
  if (GREETING_RE.test(trimmed)) {
    handleAction('MAIN_MENU');
    return true;
  }

  // If the message is a real question or more than 4 words → let OpenAI answer
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 4 || QUESTION_WORDS_RE.test(trimmed)) {
    return false;
  }

  // Short, non-question messages — try keyword routes
  for (const k of shortKeywordRoutes) {
    if (k.re.test(trimmed)) {
      handleAction(k.action);
      return true;
    }
  }

  return false;
}

// ── Lead Form Helpers ─────────────────────────────────────────────

function prefillLeadFormFromChat() {
  const nodes = Array.from(chatEl.querySelectorAll('.msg')).slice(-12);
  const joined = nodes.map(n => n.textContent.trim()).join('\n');
  const emailRe  = /[^@\s]+@[^@\s]+\.[^@\s]+/;
  const urlRe    = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
  const budgetRe = /\b(\d{3,}(k)?\b|rs\b|pkr\b|usd\b|\$\d+[\d,]*)/i;

  const foundEmail = joined.match(emailRe);
  if (foundEmail) leadFormEl.elements['email'].value = foundEmail[0];
  const foundUrl = joined.match(urlRe);
  if (foundUrl) leadFormEl.elements['company'].value = foundUrl[0];
  const foundBudget = joined.match(budgetRe);
  if (foundBudget) leadFormEl.elements['budget'].value = foundBudget[0];

  const userMsgs = Array.from(chatEl.querySelectorAll('.msg.user')).map(n => n.textContent.trim());
  const candidate = userMsgs.slice().reverse().find(m => {
    const w = m.split(/\s+/).length;
    return w >= 1 && w <= 3 && m.length <= 30 && !emailRe.test(m) && !urlRe.test(m) && !/\b(yes|no|thanks|ok|okay|sure|hi|hello)\b/i.test(m);
  });
  if (candidate && !leadFormEl.elements['name'].value) {
    leadFormEl.elements['name'].value = candidate.split('\n')[0];
  }
}

function inferQuoteFromChat() {
  const nodes = Array.from(chatEl.querySelectorAll('.msg')).slice(-20);
  const joined = nodes.map(n => n.textContent.toLowerCase()).join('\n');
  let service = '', stage = '', timeline = '';
  if (/\b(seo|search|ranking)\b/.test(joined)) service = 'SEO';
  else if (/\b(ad|ads|ppc|facebook|meta|tiktok)\b/.test(joined)) service = 'Paid Ads';
  else if (/\b(content|social|instagram|reels)\b/.test(joined)) service = 'Content & Social';
  else if (/\b(shopify|shop|store|e-?commerce)\b/.test(joined)) service = 'Shopify/Website';
  else if (/\b(email|newsletter)\b/.test(joined)) service = 'Email Marketing';
  if (/\b(startup|new business)\b/.test(joined)) stage = 'Startup';
  else if (/\b(established|growth|scale)\b/.test(joined)) stage = 'Established';
  else if (/\b(e-?commerce|selling)\b/.test(joined)) stage = 'E-commerce';
  if (/\b(right away|asap|now)\b/.test(joined)) timeline = 'Right away';
  else if (/\b(within a month|next month)\b/.test(joined)) timeline = 'Within a month';
  return { service, stage, timeline };
}

// ── Lead Capture (typed input flow) ──────────────────────────────

async function handleTypedLeadCapture(text) {
  if (quoteState.awaitingContact) {
    const emailRe = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    const possibleEmail = text.match(emailRe);
    let name = text.replace(emailRe, '').trim();
    if (possibleEmail) {
      const email = possibleEmail[0];
      if (!name) name = email.split('@')[0];
      leadFormEl.elements['name'].value = name;
      leadFormEl.elements['email'].value = email;
      leadDraftName = name;
      quoteState.awaitingContact = false;
      quoteState.awaitingEmail = false;
      
      const isWidgetMode = window.location.search.includes('widget=true');
      if (isWidgetMode) {
        quoteState.awaitingCompany = true;
        appendMessage(`Thanks ${name}! What's your company name or website?`, 'bot');
      } else {
        leadStatusEl.textContent = '✓ Prefilled from chat — review and submit.';
        appendMessage(`Thanks ${name} — I've added your email. Review the form on the right and submit when ready.`, 'bot');
        document.querySelector('.lead-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return true;
    }
    name = text.trim();
    if (name) {
      leadFormEl.elements['name'].value = name;
      leadDraftName = name;
      quoteState.awaitingContact = false;
      quoteState.awaitingEmail = true;
      appendMessage(`Thanks ${name} — what's your email address?`, 'bot');
      return true;
    }
  }

  if (quoteState.awaitingEmail) {
    const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (emailRe.test(text.trim())) {
      leadFormEl.elements['email'].value = text.trim();
      quoteState.awaitingEmail = false;
      quoteState.awaitingCompany = true;
      leadStatusEl.textContent = '✓ Name & email saved.';
      appendMessage('Thanks — what\'s your company name or website?', 'bot');
      return true;
    } else {
      appendMessage("That doesn't look like a valid email. Please enter a correct email address.", 'bot');
      return true;
    }
  }

  if (quoteState.awaitingCompany) {
    if (text.trim()) {
      leadFormEl.elements['company'].value = text.trim();
      quoteState.awaitingCompany = false;
      quoteState.awaitingBudget = true;
      appendMessage('Great — what budget range are you considering?', 'bot');
      return true;
    }
  }

  if (quoteState.awaitingBudget) {
    if (text.trim()) {
      leadFormEl.elements['budget'].value = text.trim();
      quoteState.awaitingBudget = false;
      quoteState.awaitingGoals = true;
      appendMessage('Almost done — share a couple of lines about your goals for this project.', 'bot');
      return true;
    }
  }

  if (quoteState.awaitingGoals) {
    if (text.trim().length >= 3) {
      leadFormEl.elements['goals'].value = text.trim();
      quoteState.awaitingGoals = false;
      
      const isWidgetMode = window.location.search.includes('widget=true');
      if (isWidgetMode) {
        appendMessage("Got it! Please review your details and confirm submission.", 'bot');
        showReviewModal();
      } else {
        leadStatusEl.textContent = '✓ Prefilled from chat — review and submit.';
        appendMessage("I've added that to the form. Review and submit when ready!", 'bot');
        showBotWithButtons('How would you like to continue?', [
          { label: '💬 Continue on WhatsApp', action: 'LEAD_WHATSAPP' },
          { label: '📧 Fill lead form',       action: 'LEAD_EMAIL' },
          { label: '📅 Book a call',          action: 'LEAD_BOOK' }
        ]);
        document.querySelector('.lead-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return true;
    } else {
      appendMessage('Please provide a short description of your goals (at least a sentence).', 'bot');
      return true;
    }
  }

  return false;
}

// ── Send Message ──────────────────────────────────────────────────

async function sendMessage(text) {
  appendMessage(text, 'user');
  quoteState.region = detectRegionFromText(text);

  // typed lead capture mode
  const capturedByLead = await handleTypedLeadCapture(text);
  if (capturedByLead) return;

  // keyword routing — includes greetings
  if (routeByKeyword(text)) return;

  // fallback to AI API
  showTyping();
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: text,
        metadata: { page: window.location.pathname, source: 'website' }
      })
    });
    const data = await response.json();
    hideTyping();
    if (!response.ok) throw new Error(data.error || 'Chat failed');
    sessionId = data.sessionId;
    appendMessage(data.reply, 'bot');
    renderPersistentButtons();
  } catch (error) {
    hideTyping();
    appendMessage("I'm having trouble right now. Please try again in a moment or reach us directly.", 'bot');
    console.error(error);
  }
}

// ── Site Audit ────────────────────────────────────────────────────

async function runAudit(url) {
  appendMessage(url, 'user');
  showTyping();
  try {
    const r = await fetch('/api/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const j = await r.json();
    hideTyping();
    if (r.ok && j.report) {
      const rep = j.report;
      const out = [
        `🌐 Status: ${rep.status}`,
        `📝 Title: ${rep.title || '—'}`,
        `📋 Meta description: ${rep.metaDescription ? 'present ✓' : 'missing ✗'}`,
        `🔤 H1: ${rep.h1 || 'missing ✗'}`,
        `📱 Viewport meta: ${rep.hasViewport ? 'present ✓' : 'missing ✗'}`
      ];
      appendMessage(out.join('\n'), 'bot');
      leadFormEl.elements['company'].value = url;
      leadFormEl.elements['goals'].value = `Site audit:\nTitle: ${rep.title || ''}\nMeta: ${rep.metaDescription || ''}`;
      leadStatusEl.textContent = '✓ Site audit complete — lead form prefilled.';
    } else {
      appendMessage('Site audit failed. Please check the URL and try again.', 'bot');
    }
  } catch (err) {
    hideTyping();
    appendMessage('Site audit failed: ' + String(err), 'bot');
  }
}

// ── Modal ─────────────────────────────────────────────────────────

function showReviewModal() {
  const data = {
    name:    leadFormEl.elements['name'].value || '',
    email:   leadFormEl.elements['email'].value || '',
    company: leadFormEl.elements['company'].value || '',
    budget:  leadFormEl.elements['budget'].value || '',
    goals:   leadFormEl.elements['goals'].value || ''
  };
  modalBody.textContent = `Name:     ${data.name}\nEmail:    ${data.email}\nCompany:  ${data.company}\nBudget:   ${data.budget}\n\nGoals:\n${data.goals}`;
  reviewModal.classList.add('open');
}

function hideReviewModal() {
  reviewModal.classList.remove('open');
}

modalClose && modalClose.addEventListener('click', hideReviewModal);
reviewModal && reviewModal.addEventListener('click', e => { if (e.target === reviewModal) hideReviewModal(); });

reviewEdit && reviewEdit.addEventListener('click', () => {
  hideReviewModal();
  document.querySelector('.lead-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

reviewConfirm && reviewConfirm.addEventListener('click', async () => {
  reviewConfirm.disabled = true;
  reviewConfirm.textContent = 'Submitting…';

  const payload = {
    name:    leadFormEl.elements['name'].value || '',
    email:   leadFormEl.elements['email'].value || '',
    company: leadFormEl.elements['company'].value || '',
    budget:  leadFormEl.elements['budget'].value || '',
    goals:   leadFormEl.elements['goals'].value || '',
    source:  'website-chatbot'
  };

  const errors = [];
  if (!payload.name || payload.name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) errors.push('Please enter a valid email address');
  if (!payload.goals || payload.goals.trim().length < 3) errors.push('Goals must be at least a few words');

  if (errors.length) {
    modalBody.textContent = 'Please fix:\n\n' + errors.join('\n');
    reviewConfirm.disabled = false;
    reviewConfirm.textContent = 'Confirm & Submit';
    return;
  }

  try {
    const resp = await fetch('/api/lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await resp.json();
    if (resp.ok) {
      hideReviewModal();
      leadFormEl.reset();
      leadStatusEl.textContent = '✅ Submitted! We\'ll be in touch within 24 hours.';
      showBotWithButtons('Your proposal request has been submitted! 🎉 Our team will reach out within 24 hours. In the meantime, feel free to explore our work.', [
        { label: '🌐 View Portfolio', action: 'OPEN_URL', value: 'https://digitaldivapro.com/portfolio' },
        { label: '💬 WhatsApp Us',   action: 'LEAD_WHATSAPP' }
      ]);
    } else {
      let msg = 'Submission failed: ' + (j.error || JSON.stringify(j));
      if (j.details && Array.isArray(j.details) && j.details.length) {
        msg += '\n\n' + j.details.map(d => `${(d.path || []).join('.')}: ${d.message}`).join('\n');
      }
      modalBody.textContent = msg;
    }
  } catch (err) {
    modalBody.textContent = 'Submission failed: ' + String(err);
  }
  reviewConfirm.disabled = false;
  reviewConfirm.textContent = 'Confirm & Submit';
});

// ── Event Listeners ───────────────────────────────────────────────

// New chat
newChatBtn && newChatBtn.addEventListener('click', () => {
  chatEl.innerHTML = '';
  clearFollowups();
  Object.assign(quoteState, {
    inProgress: false, step: 0, answers: {}, region: 'pakistan', packageSet: null,
    awaitingContact: false, awaitingEmail: false, awaitingCompany: false,
    awaitingBudget: false, awaitingGoals: false
  });
  leadStatusEl.textContent = '';
  sessionId = '';
  showMainMenu();
});

// Form submit
formEl && formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageEl.value.trim();
  if (!text) return;
  messageEl.value = '';
  messageEl.focus();

  // URL audit
  if (/^https?:\/\//i.test(text)) {
    await runAudit(text);
    return;
  }

  await sendMessage(text);
});

// Lead form submit
leadFormEl && leadFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  showReviewModal();
});

// ── Init ──────────────────────────────────────────────────────────
showMainMenu();
