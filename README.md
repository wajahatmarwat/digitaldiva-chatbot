# Digital Diva Website Chatbot

A deployable AI chatbot web app that can run as a standalone page or embeddable widget on any website.

## What it does

- Answers questions about Digital Diva services
- Recommends services based on user goals
- Captures lead information (name, email, company, budget, goals)
- Qualifies leads and can forward them to a CRM webhook
- Supports fallback responses even without API keys
- Provides an embeddable floating widget for your website

## Tech stack

- Node.js + Express backend
- OpenAI-compatible chat API integration
- Knowledge retrieval over local service data
- Vanilla JS embeddable frontend widget

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Add your API key and model in `.env`.

4. Run:

```bash
npm run dev
```

5. Open:

- App: http://localhost:8080
- Health: http://localhost:8080/api/health

## Embed in your website

Add this snippet to your website before `</body>`:

```html
<script src="https://YOUR-DOMAIN/widget/chatbot.js"></script>
<script>
  window.DigitalDivaChatbot.init({
    apiBase: "https://YOUR-DOMAIN",
    brandName: "Digital Diva",
    welcomeMessage: "Hi. I can help you with SEO, social media, web development, automation, and e-commerce.",
    primaryColor: "#ec4899"
  });
</script>
```

## API endpoints

- `POST /api/chat`
- `POST /api/lead`
- `GET /api/health`

## Deployment

### Option A: Render/Railway/Fly

- Set start command: `npm start`
- Set environment variables from `.env.example`
- Deploy as a Node web service

### Option B: Docker

```bash
docker build -t digital-diva-chatbot .
docker run -p 8080:8080 --env-file .env digital-diva-chatbot
```

## Lead flow

Leads are saved locally in `.leads/leads.jsonl` and optionally posted to `LEAD_WEBHOOK_URL`.

## Notes

- If `OPENAI_API_KEY` is missing, chatbot still works in a deterministic fallback mode using your knowledge base.
- Update service content in `src/data/knowledge.json`.
