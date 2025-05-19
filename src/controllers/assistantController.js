// src/controllers/assistantController.js

const { Configuration, OpenAIApi } = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Add to your .env

// Initialize OpenAI if key is present
let openai = null;
if (OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
}

exports.handleAssistant = async (req, res) => {
  const { message, user } = req.body;

  // Fallback: simple rules-based responses (for demo or if OpenAI is not set)
  if (!openai) {
    let reply = "I'm sorry, I don't have enough information to help with that yet.";
    if (message.toLowerCase().includes("budget")) {
      reply = "Creating a budget is a great first step! Start by tracking your income and expenses, then set realistic spending limits for each category.";
    } else if (message.toLowerCase().includes("fraud")) {
      reply = "To protect yourself from fraud, always verify the source of communications, use strong passwords, and regularly monitor your accounts for suspicious activity.";
    } else if (message.toLowerCase().includes("save") || message.toLowerCase().includes("saving")) {
      reply = "For saving money, try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.";
    }
    // Optionally log user messages for analytics here
    return res.json({ reply });
  }

  // Real AI (OpenAI GPT-3.5/4)
  try {
    const userName = user?.name || "User";
    const prompt = `
You are NAPS, a friendly, helpful financial assistant for young adults and students.
User: ${message}
User info: Name: ${userName}, Gems: ${user?.gems}, Streak: ${user?.streak}
Respond in a concise, practical, and supportive way.
    `.trim();

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // or "gpt-4" if you have access
      messages: [
        { role: "system", content: "You are NAPS, a helpful financial assistant for students." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const reply = completion.data.choices[0].message.content;
    // Optionally log user messages and AI replies for analytics/support
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    res.status(500).json({ reply: "Sorry, I couldn't connect to the assistant right now." });
  }
};
