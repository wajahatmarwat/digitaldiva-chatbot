import OpenAI from "openai";
import { config, hasAiProvider } from "../config.js";
import { buildSystemPrompt } from "../prompts/systemPrompt.js";

const client = hasAiProvider
  ? new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl || undefined
    })
  : null;

function isProviderFailure(error) {
  const code = error?.code || error?.error?.code;
  const status = error?.status || error?.response?.status;

  return code === "insufficient_quota" || code === "rate_limit_exceeded" || status === 429 || status === 401 || status === 403;
}

function isAnsweringFollowup(message) {
  const lower = message.toLowerCase();
  const answerIndicators = [
    /^https?:\/\//,
    /^www\./,
    /\.(com|co|io|org|net|dev)$/i,
    /^(yes|no|maybe|not sure|depends|yep|nope|yeah)/i,
    /^(shopify|wordpress|custom|wix|squarespace)/i,
    /^(leads|sales|awareness|engagement|conversion|bookings)/i,
    /^\$[\d,]+|^[\d,]+\s*(k|k\/month|\/month|\/year|k\/year)$/i,
    /^(redesign|new site|new website|existing|current)/i
  ];

  return message.length < 300 && answerIndicators.some(re => re.test(lower));
}

function fallbackResponse(message, contextItems) {
  const lower = message.toLowerCase();

  if (
    lower.includes("price") ||
    lower.includes("pricing") ||
    lower.includes("cost") ||
    lower.includes("budget") ||
    lower.includes("quote") ||
    lower.includes("range")
  ) {
    const lines = contextItems
      .map((item) => `${item.service}: ${item.startingRange}`)
      .join("\n");

    return `Here are approximate starting ranges:\n${lines}\n\nIf you share your goals and timeline, I can suggest the best-fit plan and arrange a consultation.`;
  }

  // If the top recommended service is one of our key services, provide a richer follow-up
  if (contextItems.length > 0) {
    const topService = contextItems[0].service.toLowerCase();
    
    // If user is answering a follow-up question (short, URL, yes/no, budget), move to lead form
    if (isAnsweringFollowup(message)) {
      return `Great! Thanks for that. Now I have a better idea of what you need.\n\nTo move forward, could you please submit your details (name, email, and a brief summary of your goals)? This will help us prepare a tailored proposal for you.\n\nYou can fill out the form below, and our team will reach out within 24 hours.`;
    }

    return generateServiceFollowup(topService, message, contextItems);
  }

  const suggested = contextItems.map((item) => item.service).join(", ");

  return `Based on your query, I recommend exploring: ${suggested}. Tell me your business type, monthly marketing budget, and main goal so I can suggest the best next step.`;
}

function generateServiceFollowup(service, message, contextItems) {
  const common = {
    seo: {
      title: "SEO (Search Engine Optimization)",
      desc:
        "SEO improves search visibility and organic traffic through technical fixes, content optimization, and link-building. A typical first step is a site audit to identify quick wins.",
      questions: [
        "What is your website URL?",
        "Who is your target audience / key locations?",
        "What are your conversion goals (sales, leads, sign-ups)?",
        "Do you have an existing content strategy or blog?",
        "What is your monthly SEO budget range?"
      ]
    },
    "social media marketing": {
      title: "Social Media Marketing",
      desc:
        "Social Media Marketing grows engagement and awareness using content, paid ads, and community management. We tailor platforms and creative to your audience.",
      questions: [
        "Which platforms are most important (Instagram, Facebook, LinkedIn)?",
        "Do you run paid ads already? If so, what budget?",
        "What are your campaign goals (awareness, sales, leads)?",
        "Do you have existing creatives or assets?",
        "Who manages socials today?"
      ]
    },
    "web development": {
      title: "Web Development",
      desc:
        "Web Development covers design, performance, and conversion optimization — we build landing pages, e-commerce stores, and complete websites optimized for results.",
      questions: [
        "Do you have an existing website URL?",
        "Is this a new site or a redesign?",
        "What platform do you prefer (Shopify, WordPress, custom)?",
        "What are your primary conversion actions?",
        "Do you have launch timeline or budget constraints?"
      ]
    },
    "ai automation": {
      title: "AI Automation",
      desc:
        "AI Automation uses chatbots, workflows, and integrations to automate lead routing, follow-ups, and repetitive tasks — improving efficiency and response times.",
      questions: [
        "Which tasks do you want to automate (chat, emails, routing)?",
        "Do you use a CRM today? If yes, which one?",
        "How many leads or messages per month do you receive?",
        "Do you need multi-channel automation (web, WhatsApp, email)?",
        "What is your expected automation budget?"
      ]
    },
    "e-commerce solutions": {
      title: "E-Commerce Solutions",
      desc:
        "E-Commerce solutions include store setup, product UX, checkout optimization, and marketing to increase sales and average order value.",
      questions: [
        "Which platform do you use or plan to use (Shopify, WooCommerce)?",
        "How many SKUs do you have?",
        "What are your monthly sales targets?",
        "Do you need migration or optimization services?",
        "What is your expected project budget?"
      ]
    }
  };

  const key = Object.keys(common).find((k) => k === service || k === service.toLowerCase());

  const pick = key ? common[key] : null;
  if (!pick) {
    return `I can help with ${service}. Tell me a bit about your business, budget, and goals so I can recommend a clear next step.`;
  }

  const qlist = pick.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

  return `${pick.title}: ${pick.desc}\n\nTo recommend the best plan, please answer a few quick questions:\n${qlist}\n\nIf you prefer, share your website URL and I can run a quick audit overview and propose next steps. You can also submit your details now and we'll follow up with a proposal.`;
}

export async function generateChatReply({ userMessage, contextItems, contextSnippet, history = [] }) {
  if (!client) {
    return fallbackResponse(userMessage, contextItems);
  }

  try {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      temperature: 0.5,
      messages: [
        { role: "system", content: buildSystemPrompt(contextSnippet) },
        ...history.slice(-8),
        { role: "user", content: userMessage }
      ]
    });

    return response.choices?.[0]?.message?.content?.trim() || "I can help with services, pricing ranges, and consultation booking. What is your main business goal?";
  } catch (error) {
    if (isProviderFailure(error)) {
      console.warn("OpenAI provider unavailable, using fallback response.", {
        code: error?.code || error?.error?.code,
        status: error?.status || error?.response?.status
      });

      return fallbackResponse(userMessage, contextItems);
    }

    throw error;
  }
}
