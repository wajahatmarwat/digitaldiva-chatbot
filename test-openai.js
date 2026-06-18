import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    console.log("SUCCESS! Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("OPENAI API ERROR!");
    console.error("Status:", error.status);
    console.error("Code:", error.code);
    console.error("Message:", error.message);
  }
}

test();
