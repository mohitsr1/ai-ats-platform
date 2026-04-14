import "./config.js";

import express from "express";
import { checkResume, rankCandidates } from "./atsService.js";

const app = express();

app.use(express.json());

// 👇 PUT YOUR CODE HERE
app.get("/", (req, res) => {
  res.json({
    message: "AI ATS Platform running",
    endpoints: {
      checkResume: "POST /check-resume",
      rankCandidates: "POST /rank-candidates"
    }
  });
});

// 👤 Job Seeker API
app.post("/check-resume", async (req, res) => {
  try {
    const { resume, jd } = req.body || {};

    if (!resume || !jd) {
      return res.status(400).json({
        error: "resume and jd are required",
      });
    }

    const result = await checkResume(resume, jd);
    res.json({ success: true, data: result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

// 🏢 Recruiter API
app.post("/rank-candidates", async (req, res) => {
  try {
    const { jd, resumes } = req.body || {};

    if (!jd || !resumes || !Array.isArray(resumes)) {
      return res.status(400).json({
        error: "jd and resumes array are required"
      });
    }

    const result = await rankCandidates(jd, resumes);

    res.json({ success: true, data: result });

  } catch (error) {
    console.error("RECRUITER ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});