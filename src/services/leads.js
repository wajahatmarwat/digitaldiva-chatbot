import fs from "fs";
import path from "path";
import { config } from "../config.js";

const leadsDir = path.resolve(process.cwd(), ".leads");
const leadsFile = path.join(leadsDir, "leads.jsonl");

function ensureStore() {
  if (!fs.existsSync(leadsDir)) {
    fs.mkdirSync(leadsDir, { recursive: true });
  }
}

export async function saveLead(lead) {
  ensureStore();

  const enriched = {
    ...lead,
    createdAt: new Date().toISOString()
  };

  fs.appendFileSync(leadsFile, `${JSON.stringify(enriched)}\n`, "utf-8");

  if (config.leadWebhookUrl) {
    try {
      await fetch(config.leadWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(enriched)
      });
    } catch (error) {
      console.error("Lead webhook delivery failed:", error.message);
    }
  }

  return enriched;
}
