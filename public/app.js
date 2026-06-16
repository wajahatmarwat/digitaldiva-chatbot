let sessionId = "";

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const messageEl = document.getElementById("message");
const quickActionsEl = document.getElementById("quick-actions");
const leadFormEl = document.getElementById("lead-form");
const leadStatusEl = document.getElementById("lead-status");
const followupsEl = document.createElement('div');
followupsEl.id = 'followups';
followupsEl.className = 'followups';
followupsEl.style.marginTop = '10px';
document.querySelector('.card').appendChild(followupsEl);

// --- Diva scripted flow helpers ---
const quoteState = { inProgress: false, step: 0, answers: {}, region: 'pakistan', packageSet: null };
let leadDraftName = '';

function detectRegionFromText(text) {
  const internationalRe = /\b(usd|dollar|dollars|international|overseas|usa|america|united states|canada|uk|england|europe|singapore|uae|dubai|australia|new zealand|euro|pound|sterling)\b/i;
  const pakRe = /\b(pakistan|pak|pk|lahore|karachi|islamabad|faisalabad|rawalpindi)\b/i;
  const romanUrduMarkers = /\b(kitna|kahan|hai|hoga|kya|mujhe|shayad|bhai|ji|acha|theek)\b/i;
  if (pakRe.test(text)) return 'pakistan';
  if (internationalRe.test(text)) return 'international';
  if (!romanUrduMarkers.test(text) && /[A-Za-z]/.test(text) && text.length > 20) return 'international';
  return quoteState.region || 'pakistan';
}

function getPackageSet() {
  if (quoteState.answers.scope === 'full') return 'B';
  if (quoteState.answers.scope === 'startup') {
    return quoteState.region === 'international' ? 'B' : 'C';
  }
  if (quoteState.answers.scope === 'not_sure') {
    return quoteState.region === 'international' ? 'B' : 'A';
  }
  if (quoteState.answers.scope === 'one') {
    return quoteState.region === 'international' ? 'B' : 'A';
  }
  return quoteState.region === 'international' ? 'B' : 'A';
}

function getPackageSetName() {
  const set = quoteState.packageSet || getPackageSet();
  if (set === 'A') return 'Marketing Plan';
  if (set === 'B') return 'Full Marketing Plan';
  return 'Startup Bundle';
}

function getDefaultTier() {
  if (quoteState.packageSet === 'C') return 'Startup Bundle';
  if (quoteState.packageSet === 'B') {
    if (quoteState.answers.scope === 'full') return 'Premium Package';
    if (quoteState.answers.stage === 'Established' || quoteState.answers.stage === 'E-commerce') return 'Growth Package';
    return 'Starter Package';
  }
  if (quoteState.packageSet === 'A') {
    if (quoteState.answers.stage === 'Established' || quoteState.answers.stage === 'E-commerce') return 'Professional Package';
    if (quoteState.answers.stage === 'Startup') return 'Standard Package';
    return 'Standard Package';
  }
  return 'Starter Package';
}

function getTierSummary(tier) {
  const set = quoteState.packageSet;
  const map = {
    A: {
      'Standard Package': 'This is the entry-level plan in PKR — it covers core social channels, website management, marketing strategy, and steady content with weekly reporting.',
      'Professional Package': 'This middle PKR tier adds more content, more ad creatives, and more reporting so your brand can move faster with a stronger campaign rhythm.',
      'Premium Package': 'This full PKR tier is built for larger campaigns, more platforms, unlimited ad creatives, daily reports, and a more custom strategy across your digital presence.'
    },
    B: {
      'Starter Package': 'This USD tier covers two platforms, 10 posts a month, basic engagement and analytics, and a simple content calendar for steady growth.',
      'Growth Package': 'This USD tier covers three platforms, more content, paid ad setup, email marketing setup, and stronger analytics so your brand can scale faster.',
      'Premium Package': 'This USD tier covers five platforms, advanced video content, ad campaign management, full SEO, email marketing, landing-page optimisation, and monthly strategy calls.'
    }
  };
  if (set === 'C') {
    return 'The Startup Bundle is a fixed PKR package for new businesses: website build plus content, social, ads management and strategy together from day one.';
  }
  return map[set]?.[tier] || 'This package tier gives a balanced mix of digital marketing support and strategy for your business.';
}

function showBusinessStage(extraText = '') {
  let prompt = `${extraText}And which best describes your business right now?`;
  if (quoteState.answers.scope === 'one') {
    prompt += ' If it’s useful, I can also point you toward what usually pairs well with this — just let me know.';
  }
  showBotWithButtons(prompt, [
    { label: 'Startup / New business', action: 'BUSINESS_STAGE', value: 'Startup' },
    { label: 'Established / Growth', action: 'BUSINESS_STAGE', value: 'Established' },
    { label: 'E-commerce / Selling online', action: 'BUSINESS_STAGE', value: 'E-commerce' },
    { label: 'Other', action: 'BUSINESS_STAGE', value: 'Other' }
  ]);
}

function renderPersistentButtons() {
  // ensure persistent Main Menu and Talk to the Team are visible
  const existing = followupsEl.querySelector('.persistent-actions');
  if (existing) return;
  const wrap = document.createElement('div');
  wrap.className = 'persistent-actions';
  wrap.style.marginTop = '8px';
  const main = document.createElement('button');
  main.textContent = 'Main Menu';
  main.className = 'quick-reply persistent';
  main.style.marginRight = '8px';
  main.addEventListener('click', () => handleAction('MAIN_MENU'));
  wrap.appendChild(main);
  followupsEl.appendChild(wrap);
}

function showBotWithButtons(text, buttons = []) {
  appendMessage(text, 'bot');
  clearFollowups();
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply';
    btn.style.marginRight = '8px';
    btn.style.marginBottom = '8px';
    btn.textContent = b.label;
    btn.addEventListener('click', () => handleAction(b.action, b.value));
    followupsEl.appendChild(btn);
  });
  renderPersistentButtons();
}

function handleAction(action, value) {
  switch ((action || '').toString()) {
    case 'MAIN_MENU':
      showMainMenu();
      break;
    case 'TALK_TO_TEAM':
      showBotWithButtons('Of course — here are the best ways to reach us directly:', [
        { label: 'WhatsApp Us', action: 'WHATSAPP' },
        { label: 'Email Us', action: 'EMAIL' },
        { label: 'Book a Call', action: 'BOOK' }
      ]);
      break;

    case 'EXPLORE_SERVICES':
      showBotWithButtons('Sure — here’s what we work on. Tap a category and I’ll give you a quick rundown:', [
        { label: 'Growth & Visibility (SEO/Ads)', action: 'EXPLORE_SEO' },
        { label: 'Content & Creative', action: 'EXPLORE_CONTENT' },
        { label: 'Web & Shopify', action: 'EXPLORE_WEB' },
        { label: 'Email & Retention', action: 'EXPLORE_EMAIL' },
        { label: 'Show me everything', action: 'EXPLORE_ALL' }
      ]);
      break;
    case 'EXPLORE_SEO':
      showBotWithButtons('This is everything that gets your brand seen and brings the right people to your site:\nSEO — technical audits, on-page work, content that ranks\nPaid Ads — targeting, creative testing, budget management\nAnalytics & Reporting — live dashboards, regular check-ins on what’s working', [
        { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_SEO' },
        { label: 'See another category', action: 'EXPLORE_SERVICES' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
      break;
    case 'EXPLORE_CONTENT':
      showBotWithButtons('Our Content & Creative team produces everything from social posts to full campaigns: Content, Graphic Design and Video.', [
        { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_CONTENT' },
        { label: 'See another category', action: 'EXPLORE_SERVICES' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
      break;
    case 'EXPLORE_WEB':
      showBotWithButtons('We design, build and maintain websites and online stores — WordPress and Shopify with on-page SEO from day one.', [
        { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_WEB' },
        { label: 'See another category', action: 'EXPLORE_SERVICES' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
      break;
    case 'EXPLORE_EMAIL':
      showBotWithButtons('We help brands stay top-of-mind and turn one-time buyers into repeat customers: Email Marketing and lifecycle campaigns.', [
        { label: 'Get a quote for this', action: 'GET_QUOTE_FOR_EMAIL' },
        { label: 'See another category', action: 'EXPLORE_SERVICES' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
      break;
    case 'EXPLORE_ALL':
      showBotWithButtons('Here’s the full picture of what we do: SEO, Paid Ads, Content Marketing, Social Media, Email, Web & Shopify, Design, Video, Branding, Analytics, Strategy & Consulting', [
        { label: 'Get a quote', action: 'GET_QUOTE' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
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
      // ask scope
      quoteState.inProgress = true;
      quoteState.step = 2;
      quoteState.answers = { category: quoteState.answers.category || '' };
      showBotWithButtons('First up — are you looking for help with one specific thing, or more general, ongoing marketing support across the board?', [
        { label: 'One specific service', action: 'QUOTE_ONE' },
        { label: 'Full marketing support (everything)', action: 'QUOTE_FULL' },
        { label: 'I’m a new business / startup', action: 'QUOTE_STARTUP' },
        { label: 'Not sure yet', action: 'QUOTE_NOT_SURE' }
      ]);
      break;
    case 'QUOTE_B1_PRICING':
      quoteState.inProgress = true;
      quoteState.step = 2;
      quoteState.answers = { category: quoteState.answers.category || '' };
      showBotWithButtons('Okay — to point you to the right pricing set, which service are you looking for?', [
        { label: 'SEO', action: 'QUOTE_SERVICE', value: 'SEO' },
        { label: 'Paid Ads', action: 'QUOTE_SERVICE', value: 'Paid Ads' },
        { label: 'Content & Social', action: 'QUOTE_SERVICE', value: 'Content & Social' },
        { label: 'Website (WordPress)', action: 'QUOTE_SERVICE', value: 'Website' },
        { label: 'Shopify Store', action: 'QUOTE_SERVICE', value: 'Shopify' },
        { label: 'Email Marketing', action: 'QUOTE_SERVICE', value: 'Email' }
      ]);
      break;
    case 'QUOTE_ONE':
      quoteState.answers.scope = 'one';
      quoteState.step = 3;
      showBotWithButtons('Which service?', [
        { label: 'SEO', action: 'QUOTE_SERVICE', value: 'SEO' },
        { label: 'Paid Ads', action: 'QUOTE_SERVICE', value: 'Paid Ads' },
        { label: 'Content & Social', action: 'QUOTE_SERVICE', value: 'Content & Social' },
        { label: 'Website (WordPress)', action: 'QUOTE_SERVICE', value: 'Website' },
        { label: 'Shopify Store', action: 'QUOTE_SERVICE', value: 'Shopify' },
        { label: 'Email Marketing', action: 'QUOTE_SERVICE', value: 'Email' },
        { label: 'Something else', action: 'QUOTE_SERVICE', value: 'Other' }
      ]);
      break;
    case 'QUOTE_FULL':
      quoteState.answers.scope = 'full';
      quoteState.step = 4;
      showBusinessStage('That’s usually our favourite kind of project — it means we can plan everything together instead of working around gaps. ');
      break;
    case 'QUOTE_STARTUP':
      quoteState.answers.scope = 'startup';
      quoteState.step = 4;
      showBusinessStage();
      break;
    case 'QUOTE_NOT_SURE':
      quoteState.answers.scope = 'not_sure';
      quoteState.step = 4;
      showBusinessStage();
      break;
    case 'QUOTE_SERVICE':
      quoteState.answers.service = value;
      if (!quoteState.answers.scope) {
        quoteState.answers.scope = 'one';
        quoteState.step = 3;
        showBotWithButtons('Are you based in Pakistan, or is this an international project?', [
          { label: 'Pakistan / PKR', action: 'QUOTE_REGION', value: 'pakistan' },
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
        extra = 'Heads up — for brand-new sites, we usually pair SEO with a quick technical check first, so nothing’s holding the site back before we start building rankings.';
      } else if (quoteState.answers.service === 'Shopify' && value === 'E-commerce') {
        extra = 'If you’re already selling, it’s often worth a quick look at your store setup alongside ads — a few small fixes can make paid traffic convert a lot better.';
      } else if (quoteState.answers.service === 'Content & Social' && value === 'Startup') {
        extra = 'For new brands, we typically start with a short content plan before posting — so everything ties back to one direction instead of one-off posts.';
      }
      showBotWithButtons(`${extra ? extra + '\n\n' : ''}Last one — when are you hoping to get started?`, [
        { label: 'Right away', action: 'TIMELINE', value: 'Right away' },
        { label: 'Within a month', action: 'TIMELINE', value: 'Within a month' },
        { label: 'Just exploring options', action: 'TIMELINE', value: 'Exploring' }
      ]);
      break;
    case 'TIMELINE':
      quoteState.answers.timeline = value;
      quoteState.step = 6;
      quoteState.packageSet = getPackageSet();
      const setName = getPackageSetName();
      const regionNote = quoteState.region === 'international' && quoteState.packageSet !== 'B' ? 'For international clients we run these as part of one plan rather than splitting by channel — here’s how that looks:' : '';
      const packageText = getPackageSetDescription();
      showBotWithButtons(`${regionNote ? regionNote + '\n\n' : ''}Here’s the package set this usually maps to: ${setName}. ${packageText}`, [
        { label: 'Tell me more', action: 'PACKAGE_TELL_MORE' },
        { label: "I’d like a custom quote", action: 'TALK_TO_TEAM' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
      break;
    case 'PACKAGE_TELL_MORE':
      showBotWithButtons('Our packages start simple and scale with the scope. The team will confirm the right starting point and exact numbers after a quick review of your goals.', [
        { label: 'Continue to contact options', action: 'LEAD_OPTIONS' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' },
        { label: 'Main Menu', action: 'MAIN_MENU' }
      ]);
      break;
    case 'LEAD_OPTIONS':
      showBotWithButtons('Great — pick the contact method that works best for you:', [
        { label: 'Continue on WhatsApp', action: 'LEAD_WHATSAPP' },
        { label: 'Continue by Email', action: 'LEAD_EMAIL' },
        { label: 'Book a call directly', action: 'LEAD_BOOK' }
      ]);
      // allow typed name/email after offering options
      quoteState.awaitingContact = true;
      quoteState.awaitingEmail = false;
      break;
    case 'LEAD_WHATSAPP':
      {
        const pre = `Hi Digital Diva! I came from your website chat — I'm interested in ${quoteState.answers.service || ''} for my ${quoteState.answers.stage || ''} business.`;
        const url = `https://wa.me/923058977853?text=${encodeURIComponent(pre)}`;
        showBotWithButtons('Tap below to open WhatsApp with your message pre-filled.', [
          { label: 'Open WhatsApp Chat', action: 'OPEN_URL', value: url },
          { label: 'Email Us Instead', action: 'LEAD_EMAIL' },
          { label: 'Book a Call', action: 'LEAD_BOOK' }
        ]);
        // once user moves to handoff, stop waiting for typed contact
        quoteState.awaitingContact = false;
        quoteState.awaitingEmail = false;
      }
      break;
    
    case 'LEAD_EMAIL':
      // populate goals from quote answers (or infer from chat if missing)
      leadFormEl.elements['goals'].value = `Interest: ${quoteState.answers.service || ''}\nStage: ${quoteState.answers.stage || ''}\nTimeline: ${quoteState.answers.timeline || ''}`;
      // attempt to extract name/email/company/budget from recent chat
      prefillLeadFormFromChat();
      // if goals are empty, try to infer from recent chat messages
      if (!leadFormEl.elements['goals'].value.trim()) {
        const inferred = inferQuoteFromChat();
        if (inferred.service || inferred.stage || inferred.timeline) {
          leadFormEl.elements['goals'].value = `Interest: ${inferred.service}\nStage: ${inferred.stage}\nTimeline: ${inferred.timeline}`;
        }
      }
      // check if any useful field was filled
      const anyPrefill = (leadFormEl.elements['name'].value || leadFormEl.elements['email'].value || leadFormEl.elements['company'].value || leadFormEl.elements['budget'].value || (leadFormEl.elements['goals'].value && leadFormEl.elements['goals'].value.trim()));
      window.scrollTo({ top: document.querySelector('.lead-card').offsetTop - 20, behavior: 'smooth' });
      if (anyPrefill) {
        leadStatusEl.textContent = 'Prefilled from chat — review and submit.';
        showBotWithButtons("I've prefilled the form below. Review it and hit Submit Lead when ready.", [
          { label: 'Scroll to form', action: 'SCROLL_LEAD_FORM' },
          { label: 'Open WhatsApp Chat', action: 'LEAD_WHATSAPP' },
          { label: 'Book a Call', action: 'LEAD_BOOK' }
        ]);
        // allow typed name/email to fill form too
        quoteState.awaitingContact = true;
        quoteState.awaitingEmail = false;
      } else {
        // nothing to prefill — be honest and open the form for manual entry
        leadStatusEl.textContent = '';
        showBotWithButtons('I opened the lead form — please fill your details and submit when ready.', [
          { label: 'Scroll to form', action: 'SCROLL_LEAD_FORM' },
          { label: 'WhatsApp Us', action: 'WHATSAPP' },
          { label: 'Book a Call', action: 'LEAD_BOOK' }
        ]);
        quoteState.awaitingContact = true;
        quoteState.awaitingEmail = false;
      }
      break;
    case 'LEAD_BOOK':
      showBotWithButtons('I can open our booking calendar — pick a time and we’ll join with context from this chat.', [
        { label: 'Open Booking Calendar', action: 'OPEN_URL', value: 'https://calendly.com/' },
        { label: 'WhatsApp Us', action: 'LEAD_WHATSAPP' },
        { label: 'Email Us', action: 'LEAD_EMAIL' }
      ]);
      break;
    case 'EMAIL':
      // keep contact options minimal — open lead form or handoff channels
      showBotWithButtons('You can open the lead form or reach the team directly.', [
        { label: 'Open lead form', action: 'LEAD_EMAIL' },
        { label: 'WhatsApp Us', action: 'WHATSAPP' },
        { label: 'Book a Call', action: 'BOOK' }
      ]);
      break;
    case 'BOOK':
      showBotWithButtons('Here’s our booking calendar. Choose a slot and the team will be ready with context from this chat.', [
        { label: 'Open Booking Calendar', action: 'OPEN_URL', value: 'https://calendly.com/' },
        { label: 'WhatsApp Us', action: 'WHATSAPP' },
        { label: 'Email Us', action: 'EMAIL' }
      ]);
      break;
    case 'SEE_WORK':
      showBotWithButtons('We’ve helped brands grow with measurable results — websites, paid ads, content campaigns and conversion-focused design. Tap "View Portfolio" to open examples in a new tab.', [
        { label: 'View Portfolio', action: 'OPEN_URL', value: 'https://digitaldivapro.com/portfolio' },
        { label: 'Get a Quote', action: 'GET_QUOTE' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
      break;
    case 'ABOUT':
      showBotWithButtons('Digital Diva is a boutique digital marketing agency focused on growth for brands in Pakistan and international markets. We offer strategy, content, ads, web and analytics — founded to help small teams scale efficiently with data-driven campaigns.', [
        { label: 'See Our Work', action: 'SEE_WORK' },
        { label: 'Get a Quote', action: 'GET_QUOTE' },
        { label: 'Talk to the Team', action: 'TALK_TO_TEAM' }
      ]);
      break;
    case 'OPEN_URL':
      try {
        if (value) window.open(value, '_blank');
      } catch (e) {
        console.log('Failed to open URL', value, e);
      }
      break;
    default:
      // no-op / fallback
      console.log('Unhandled action', action, value);
  }
}

function showMainMenu() {
  showBotWithButtons('Hi, I’m Diva 👋 from Digital Diva — we run marketing for brands across Pakistan and internationally. How can I help today?', [
    { label: 'Explore Services', action: 'EXPLORE_SERVICES' },
    { label: 'Get a Quote', action: 'GET_QUOTE' },
    { label: 'See Our Work', action: 'SEE_WORK' },
    { label: 'About Digital Diva', action: 'ABOUT' }
  ]);
}

function startQuoteFlow(prefill) {
  quoteState.inProgress = true;
  quoteState.step = 1;
  quoteState.answers = { category: prefill || '' };
  showBotWithButtons('Happy to help 🌟 Mind if I ask a couple of quick things first? It’ll help me point you to the right place — takes a minute.', [
    { label: "Sure, let's go", action: 'QUOTE_B1_SURE' },
    { label: 'Just give me pricing info', action: 'QUOTE_B1_PRICING' }
  ]);
}

// keyword routing (English + Roman Urdu snippets)
function getPackageSetDescription() {
  const set = quoteState.packageSet;
  if (set === 'A') {
    return 'Set A is a tiered PKR Marketing Plan for one-specific-service requests in Pakistan or when the region is unknown.';
  }
  if (set === 'B') {
    return 'Set B is a tiered USD Full Marketing Plan for full-support requests and international visitors.';
  }
  if (set === 'C') {
    return 'Set C is a fixed-price PKR Startup Bundle for new businesses and startups in Pakistan.';
  }
  return 'This package set is matched to the scope and region you shared.';
}

// keyword routing (English + Roman Urdu snippets)
const keywordRoutes = [
  { re: /\b(seo|ranking|google)\b/i, action: 'EXPLORE_SEO' },
  { re: /\b(shopify|shop|e-?commerce)\b/i, action: 'EXPLORE_WEB' },
  { re: /\b(website|web|wordpress|landing)\b/i, action: 'EXPLORE_WEB' },
  { re: /\b(content|social|instagram|posts|reels)\b/i, action: 'EXPLORE_CONTENT' },
  { re: /\b(ad|ads|ppc|facebook|meta|tiktok)\b/i, action: 'EXPLORE_SEO' },
  { re: /\b(price|cost|rates|quote|kitna|rate)\b/i, action: 'GET_QUOTE' },
  { re: /\b(portfolio|case study|results|clients|examples|proof)\b/i, action: 'EXPLORE_ALL' },
  { re: /\b(about|who are you|company|founder|kahan)\b/i, action: 'ABOUT' },
  { re: /\b(human|agent|real person|help|baat karni)\b/i, action: 'TALK_TO_TEAM' },
  { re: /\b(whatsapp|watsapp|whats app)\b/i, action: 'TALK_TO_TEAM' }
];

function routeByKeyword(text) {
  for (const k of keywordRoutes) if (k.re.test(text)) { handleAction(k.action); return true; }
  return false;
}

// show main menu on load
showMainMenu();

// Create review modal for lead confirmation
const reviewModal = document.createElement('div');
reviewModal.id = 'lead-review-modal';
Object.assign(reviewModal.style, {
  position: 'fixed',
  left: '0',
  top: '0',
  right: '0',
  bottom: '0',
  background: 'rgba(0,0,0,0.4)',
  display: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999999
});

const reviewCard = document.createElement('div');
Object.assign(reviewCard.style, {
  width: 'min(600px, 96vw)',
  background: '#fff',
  padding: '18px',
  borderRadius: '12px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
});

const reviewTitle = document.createElement('h3');
reviewTitle.innerText = 'Review lead details';
const reviewBody = document.createElement('pre');
reviewBody.style.whiteSpace = 'pre-wrap';
reviewBody.style.fontFamily = 'inherit';
reviewBody.style.fontSize = '14px';
reviewBody.style.color = '#111';
reviewBody.style.background = '#f7f7f7';
reviewBody.style.padding = '14px';
reviewBody.style.borderRadius = '10px';
reviewBody.style.border = '1px solid rgba(0,0,0,0.08)';

const reviewActions = document.createElement('div');
reviewActions.style.marginTop = '12px';

const reviewConfirm = document.createElement('button');
reviewConfirm.innerText = 'Confirm and Submit';
Object.assign(reviewConfirm.style, { background: '#0f766e', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' });

const reviewEdit = document.createElement('button');
reviewEdit.innerText = 'Edit';
Object.assign(reviewEdit.style, { marginLeft: '8px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' });

reviewActions.append(reviewConfirm, reviewEdit);
reviewCard.append(reviewTitle, reviewBody, reviewActions);
reviewModal.appendChild(reviewCard);
document.body.appendChild(reviewModal);

function showReviewModal() {
  const data = {
    name: leadFormEl.elements['name'].value || '',
    email: leadFormEl.elements['email'].value || '',
    company: leadFormEl.elements['company'].value || '',
    budget: leadFormEl.elements['budget'].value || '',
    goals: leadFormEl.elements['goals'].value || ''
  };

  reviewBody.textContent = `Name: ${data.name}\nEmail: ${data.email}\nCompany / URL: ${data.company}\nBudget: ${data.budget}\nGoals:\n${data.goals}`;

  reviewModal.style.display = 'flex';
}

function hideReviewModal() {
  reviewModal.style.display = 'none';
}

reviewEdit.addEventListener('click', () => {
  hideReviewModal();
  window.scrollTo({ top: document.querySelector('.lead-card').offsetTop - 20, behavior: 'smooth' });
});

reviewConfirm.addEventListener('click', async () => {
  reviewConfirm.disabled = true;
  reviewConfirm.innerText = 'Submitting...';

  const payload = {
    name: leadFormEl.elements['name'].value || '',
    email: leadFormEl.elements['email'].value || '',
    company: leadFormEl.elements['company'].value || '',
    budget: leadFormEl.elements['budget'].value || '',
    goals: leadFormEl.elements['goals'].value || '',
    source: 'website-chatbot'
  };

  // client-side validation to avoid round-trips when data is clearly invalid
  const validationErrors = [];
  if (!payload.name || payload.name.trim().length < 2) validationErrors.push('name: must be at least 2 characters');
  const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRe.test(payload.email)) validationErrors.push('email: must be a valid email address');
  if (!payload.goals || payload.goals.trim().length < 3) validationErrors.push('goals: must be at least 3 characters');

  if (validationErrors.length) {
    reviewBody.textContent = 'Please fix the following before submitting:\n' + validationErrors.join('\n');
    reviewConfirm.disabled = false;
    reviewConfirm.innerText = 'Confirm and Submit';
    return;
  }
  try {
    const resp = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await resp.json();
    if (resp.ok) {
      hideReviewModal();
      leadFormEl.reset();
      leadStatusEl.textContent = 'Thanks — your details have been submitted.';
    } else {
      // show validation details when available
      let msg = 'Submission failed: ' + (j.error || JSON.stringify(j));
      if (j.details && Array.isArray(j.details) && j.details.length) {
        const parts = j.details.map(d => {
          const path = (d.path && d.path.length) ? d.path.join('.') : '(field)';
          return `${path}: ${d.message}`;
        });
        msg += '\n\nValidation errors:\n' + parts.join('\n');
      }
      reviewBody.textContent = msg;
    }
  } catch (err) {
    reviewBody.textContent = 'Submission failed: ' + String(err);
  }

  reviewConfirm.disabled = false;
  reviewConfirm.innerText = 'Confirm and Submit';
});

function appendMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function clearFollowups() {
  followupsEl.innerHTML = '';
}

function parseAndShowFollowups(botText) {
  clearFollowups();

  // detect numbered questions lines like '1. What is your website URL?'
  const lines = botText.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const qlines = lines.filter(l => /^\d+\./.test(l));
  if (!qlines.length) return;

  qlines.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply';
    btn.style.marginRight = '8px';
    btn.style.marginBottom = '8px';
    btn.textContent = q.replace(/^\d+\.\s*/, '');
    btn.addEventListener('click', () => {
      // place question into input for user's convenience
      messageEl.value = btn.textContent;
      messageEl.focus();
    });
    followupsEl.appendChild(btn);
  });

  // add a button to auto-fill lead form from follow-ups
  const leadBtn = document.createElement('button');
  leadBtn.textContent = 'Fill lead form';
  leadBtn.style.display = 'inline-block';
  leadBtn.style.marginLeft = '6px';
  leadBtn.addEventListener('click', () => {
    // try to prefill lead form using known messages in chat
    const msgs = Array.from(chatEl.querySelectorAll('.msg.user')).map(n => n.textContent.trim());
    // naive extraction
    const url = msgs.find(m => m.startsWith('http')) || msgs.find(m => m.includes('http')) || '';
    if (url) leadFormEl.elements['company'].value = url;
    leadFormEl.elements['goals'].value = msgs.join('\n');
    leadStatusEl.textContent = 'Lead form prefilled — review and submit.';
  });
  followupsEl.appendChild(leadBtn);
}

function prefillLeadFormFromChat() {
  // scan recent chat messages (user + bot) for useful lead info
  const nodes = Array.from(chatEl.querySelectorAll('.msg')).slice(-12);
  const texts = nodes.map(n => n.textContent.trim());
  const joined = texts.join('\n');
  const emailRe = /[^@\s]+@[^@\s]+\.[^@\s]+/;
  const urlRe = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
  const budgetRe = /\b(\d{3,}(k)?\b|rs\b|pkr\b|usd\b|\$\d+[\d,]*)/i;

  // email
  const foundEmail = joined.match(emailRe);
  if (foundEmail) leadFormEl.elements['email'].value = foundEmail[0];

  // company / url
  const foundUrl = joined.match(urlRe);
  if (foundUrl) leadFormEl.elements['company'].value = foundUrl[0];

  // budget
  const foundBudget = joined.match(budgetRe);
  if (foundBudget) leadFormEl.elements['budget'].value = foundBudget[0];

  // name heuristic: look for a short user message (1-3 words) near the end
  const userMsgs = Array.from(chatEl.querySelectorAll('.msg.user')).map(n => n.textContent.trim());
  const candidate = userMsgs.slice().reverse().find(m => {
    const w = m.split(/\s+/).length;
    return w >= 1 && w <= 3 && m.length <= 30 && !emailRe.test(m) && !urlRe.test(m) && !/\b(yes|no|thanks|thank you|ok|okay|sure|hi|hello)\b/i.test(m);
  });
  if (candidate && !leadFormEl.elements['name'].value) leadFormEl.elements['name'].value = candidate.split('\n')[0];

  // if we found anything, update status
  if (foundEmail || foundUrl || foundBudget || candidate) {
    leadStatusEl.textContent = 'Prefilled from chat — review and submit.';
  }
}

function inferQuoteFromChat() {
  const nodes = Array.from(chatEl.querySelectorAll('.msg')).slice(-20);
  const joined = nodes.map(n => n.textContent.toLowerCase()).join('\n');
  let service = '';
  if (/\b(seo|search|ranking)\b/.test(joined)) service = 'SEO';
  else if (/\b(ad|ads|ppc|facebook|meta|tiktok)\b/.test(joined)) service = 'Paid Ads';
  else if (/\b(content|social|instagram|reels|posts)\b/.test(joined)) service = 'Content & Social';
  else if (/\b(shopify|shop|store|e-?commerce)\b/.test(joined)) service = 'Shopify/Website';
  else if (/\b(email|newsletter|lifecycle)\b/.test(joined)) service = 'Email Marketing';

  let stage = '';
  if (/\b(startup|new business|new company)\b/.test(joined)) stage = 'Startup';
  else if (/\b(established|growth|scale|scaling)\b/.test(joined)) stage = 'Established';
  else if (/\b(e-?commerce|selling|store)\b/.test(joined)) stage = 'E-commerce';

  let timeline = '';
  if (/\b(right away|asap|immediately|now)\b/.test(joined)) timeline = 'Right away';
  else if (/\b(within a month|next month|in a month)\b/.test(joined)) timeline = 'Within a month';
  else if (/\b(just exploring|exploring|not sure|thinking)\b/.test(joined)) timeline = 'Exploring options';

  return { service, stage, timeline };
}

async function sendMessage(text) {
  appendMessage(text, "user");
  quoteState.region = detectRegionFromText(text);
  // If lead capture is active, accept typed contact info
  if (quoteState.awaitingContact) {
    // If user included an email along with name, extract both
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
      leadStatusEl.textContent = 'Prefilled from chat — review and submit.';
      appendMessage(`Thanks ${name} — I added your email too. You can review the form and submit when ready.`, 'bot');
      window.scrollTo({ top: document.querySelector('.lead-card').offsetTop - 20, behavior: 'smooth' });
      return;
    }

    // treat first typed input as name
    name = text.trim();
    if (name) {
      leadFormEl.elements['name'].value = name;
      leadDraftName = name;
      quoteState.awaitingContact = false;
      quoteState.awaitingEmail = true;
      appendMessage(`Thanks ${name} — may I have your email next?`, 'bot');
      return;
    }
  }

  if (quoteState.awaitingEmail) {
    const email = text.trim();
    const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (emailRe.test(email)) {
      leadFormEl.elements['email'].value = email;
      quoteState.awaitingEmail = false;
      // continue to gather company, budget and goals
      leadStatusEl.textContent = 'Prefilled: name and email. One more step — a few quick details.';
      quoteState.awaitingCompany = true;
      appendMessage('Thanks — could you tell me your company name (or website)?', 'bot');
      return;
    } else {
      appendMessage('That doesn\'t look like a valid email. Please enter a correct email address.', 'bot');
      return;
    }
  }

  // capture company after email
  if (quoteState.awaitingCompany) {
    const company = text.trim();
    if (company) {
      leadFormEl.elements['company'].value = company;
      quoteState.awaitingCompany = false;
      quoteState.awaitingBudget = true;
      appendMessage('Great — what budget range are you considering for this project?', 'bot');
      return;
    }
  }

  // capture budget
  if (quoteState.awaitingBudget) {
    const budget = text.trim();
    if (budget) {
      leadFormEl.elements['budget'].value = budget;
      quoteState.awaitingBudget = false;
      quoteState.awaitingGoals = true;
      appendMessage('Thanks — lastly, can you share a couple of lines about your goals for this project?', 'bot');
      return;
    }
  }

  // capture goals (longer free text)
  if (quoteState.awaitingGoals) {
    const goals = text.trim();
    if (goals && goals.length >= 3) {
      leadFormEl.elements['goals'].value = goals;
      quoteState.awaitingGoals = false;
      leadStatusEl.textContent = 'Prefilled from chat — review and submit.';
      appendMessage('Awesome — I added that to the form. You can review and submit when ready, or continue on WhatsApp or Email.', 'bot');
      // show quick handoff options
      showBotWithButtons('How would you like to continue?', [
        { label: 'Continue on WhatsApp', action: 'LEAD_WHATSAPP' },
        { label: 'Continue by Email', action: 'LEAD_EMAIL' },
        { label: 'Book a call', action: 'LEAD_BOOK' }
      ]);
      // scroll to form for convenience
      window.scrollTo({ top: document.querySelector('.lead-card').offsetTop - 20, behavior: 'smooth' });
      return;
    } else {
      appendMessage('Please provide a short description of your goals (a sentence or two).', 'bot');
      return;
    }
  }

  // run keyword router before sending to backend
  if (routeByKeyword(text)) return;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: text,
        metadata: {
          page: window.location.pathname,
          source: "website"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Chat failed");
    }

    sessionId = data.sessionId;
    appendMessage(data.reply, "bot");
    parseAndShowFollowups(data.reply);
  } catch (error) {
    appendMessage("I am having trouble right now. Please try again in a moment.", "bot");
    console.error(error);
  }
}

quickActionsEl.addEventListener("click", async (event) => {
  const buttonAction = event.target.closest("button[data-action]");
  if (buttonAction) {
    handleAction(buttonAction.dataset.action);
    return;
  }

  const button = event.target.closest("button[data-text]");
  if (button) {
    await sendMessage(button.dataset.text);
  }
});

leadFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  showReviewModal();
});

// Detect when user types a URL answer and run lightweight audit
messageEl.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !e.shiftKey) return; // let form submit handle
});

// Simple watcher to run audit when user pastes a URL and presses send
formEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = messageEl.value.trim();
  if (!text) return;

  // If message looks like a url, run audit first
  if (/^https?:\/\//i.test(text)) {
    appendMessage(text, 'user');
    messageEl.value = '';
    appendMessage('Running quick site audit...', 'bot');
    try {
      const r = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: text }) });
      const j = await r.json();
      if (r.ok && j.report) {
        const rep = j.report;
        const out = [];
        out.push(`Status: ${rep.status} (length ${rep.length} chars)`);
        out.push(`Title: ${rep.title || '—'}`);
        out.push(`Meta description: ${rep.metaDescription ? 'present' : 'missing'}`);
        out.push(`H1: ${rep.h1 ? rep.h1 : 'missing'}`);
        out.push(`Has viewport meta: ${rep.hasViewport}`);
        appendMessage(out.join('\n'), 'bot');
        // prefill lead form company with URL and goals
        leadFormEl.elements['company'].value = text;
        leadFormEl.elements['goals'].value = `Site audit summary:\nTitle: ${rep.title || ''}\nMeta: ${rep.metaDescription || ''}`;
        leadStatusEl.textContent = 'Site audit complete — lead form prefilled.';
      } else {
        appendMessage('Site audit failed.', 'bot');
      }
    } catch (err) {
      appendMessage('Site audit failed: ' + String(err), 'bot');
    }

    return;
  }

  // otherwise do the normal send
  messageEl.value = '';
  await sendMessage(text);
});

// Initial menu rendered below
