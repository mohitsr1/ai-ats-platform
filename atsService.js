import "./config.js"; // 👈 MUST BE FIRST

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set. Check your .env file and config.js");
}

// Build client options conditionally. Some keys (eg. OpenRouter keys) require a different baseURL.
const clientOptions = { apiKey };
if (apiKey.startsWith("sk-or-") || apiKey.includes("openrouter")) {
  clientOptions.baseURL = "https://openrouter.ai/api/v1";
  clientOptions.defaultHeaders = {
    // use standard header name
    Referer: "http://localhost:3000",
    "X-Title": "AI ATS Platform",
  };
}

const client = new OpenAI(clientOptions);

// Allow overriding model via environment for flexibility in different providers
const DEFAULT_MODEL = process.env.AI_MODEL || "gpt-3.5-turbo";

// 👤 Job Seeker Mode
export async function checkResume(resume, jd) {
  const prompt = `
You are an ATS system.

Return STRICT JSON only:
{
  "score": number,
  "missing_keywords": [],
  "strengths": [],
  "suggestions": []
}

Resume:
${resume}

Job Description:
${jd}
`;

  try {
    const model = DEFAULT_MODEL;
    console.debug(`OpenAI request - model=${model} baseURL=${clientOptions.baseURL || "api.openai.com"}`);

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an ATS expert." },
        { role: "user", content: prompt },
      ],
    });

    if (!response || !response.choices || !response.choices[0]) {
      throw new Error("Invalid response from OpenAI API");
    }

    return response.choices[0].message.content;
  } catch (err) {
    console.error("checkResume error:", err);
    throw new Error(`OpenAI request failed: ${err.message}`);
  }
}

// 🏢 Recruiter Mode
export async function rankCandidates(jd, resumes) {
  const results = [];

  if (!Array.isArray(resumes)) {
    throw new Error("resumes must be an array");
  }

  for (let i = 0; i < resumes.length; i++) {
    try {
      const result = await checkResume(resumes[i], jd);

      results.push({
        candidate: i + 1,
        analysis: result,
      });
    } catch (err) {
      // include error for the candidate but continue ranking others
      results.push({
        candidate: i + 1,
        error: err.message,
      });
    }
  }

  return results;
}