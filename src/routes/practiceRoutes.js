const mongoose = require('mongoose');
const { Schema } = mongoose;

const OptionSchema = new Schema({
  id: { type: String, required: true }, // unique option ID
  text: { type: String, required: true },
  correct: { type: Boolean, default: false }
});

const PracticeScenarioSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  situation: { type: String, required: true }, // scenario body
  options: [OptionSchema],
  reward: { type: Number, default: 5 }, // gems or points
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  tags: [{ type: String }],
  available: { type: Boolean, default: true }
}, { timestamps: true });

/* Example content for seeding:
{
  title: "Suspicious Bank Email",
  description: "You receive an email claiming to be from your bank.",
  situation: "The email asks you to click a link and enter your account details to 'verify your identity'. What should you do?",
  options: [
    { id: "a", text: "Click the link and enter your details", correct: false },
    { id: "b", text: "Ignore the email and report it as phishing", correct: true },
    { id: "c", text: "Forward the email to your friends", correct: false },
    { id: "d", text: "Reply to the sender for more information", correct: false }
  ],
  reward: 10,
  difficulty: "Medium",
  tags: ["Fraud", "Phishing"]
}
*/

module.exports = mongoose.model('PracticeScenario', PracticeScenarioSchema);
