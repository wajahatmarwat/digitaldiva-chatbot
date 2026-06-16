import fs from "fs";
import path from "path";

const knowledgePath = path.resolve(process.cwd(), "src/data/knowledge.json");
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, "utf-8"));

function scoreItem(item, query) {
  const q = query.toLowerCase();
  let score = 0;

  if (item.service.toLowerCase().includes(q)) {
    score += 4;
  }

  for (const term of item.whenToRecommend) {
    if (q.includes(term.toLowerCase())) {
      score += 2;
    }
  }

  const qTerms = q.split(/\W+/).filter(Boolean);
  for (const token of qTerms) {
    if (item.summary.toLowerCase().includes(token)) {
      score += 1;
    }
  }

  return score;
}

export function retrieveKnowledge(userMessage, limit = 3) {
  const ranked = knowledge
    .map((item) => ({ item, score: scoreItem(item, userMessage) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  if (!ranked.length) {
    return knowledge.slice(0, limit);
  }

  return ranked;
}

export function formatKnowledgeContext(items) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.service}: ${item.summary} | Typical range: ${item.startingRange}`
    )
    .join("\n");
}
