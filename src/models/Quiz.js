const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuizQuestionSchema = new Schema({
  question: { type: String, required: true },
  options: [{
    id: { type: String, required: true }, // unique option ID
    text: { type: String, required: true }
  }],
  correctOptionId: { type: String, required: true }
});

const QuizSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [QuizQuestionSchema],
  timeLimit: { type: String, default: "5 min" }, // e.g., "5 min"
  reward: { type: Number, default: 20 }, // gems or points
  tags: [{ type: String }],
  available: { type: Boolean, default: true }
}, { timestamps: true });

/* Example content for seeding:
{
  title: "Financial Basics Quiz",
  description: "Test your knowledge of basic financial concepts.",
  questions: [
    {
      question: "What is a budget?",
      options: [
        { id: "a", text: "A plan for spending and saving money" },
        { id: "b", text: "A type of bank account" },
        { id: "c", text: "A loan from a friend" },
        { id: "d", text: "A shopping list" }
      ],
      correctOptionId: "a"
    },
    {
      question: "Which of these is a sign of a phishing scam?",
      options: [
        { id: "a", text: "An email from your bank with your name" },
        { id: "b", text: "A message asking for your password" },
        { id: "c", text: "A call from your workplace" },
        { id: "d", text: "A message from a known contact" }
      ],
      correctOptionId: "b"
    }
  ],
  timeLimit: "5 min",
  reward: 20,
  tags: ["Financial Literacy", "Fraud Awareness"]
}
*/

module.exports = mongoose.model('Quiz', QuizSchema);
