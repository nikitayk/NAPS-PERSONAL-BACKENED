const PracticeScenario = require('../models/PracticeScenario');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /practice/scenarios
exports.getScenarios = async (req, res) => {
  try {
    const scenarios = await PracticeScenario.find({ available: true }).sort({ createdAt: 1 });
    // Optionally, mark completed scenarios for the user
    const completed = req.user?.completedScenarios || [];
    const data = scenarios.map(s => ({
      id: s._id,
      title: s.title,
      description: s.description,
      situation: s.situation,
      options: s.options,
      reward: s.reward,
      difficulty: s.difficulty,
      tags: s.tags,
      available: s.available,
      completed: completed.map(id => id.toString()).includes(s._id.toString())
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch scenarios' });
  }
};

// GET /practice/quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ available: true }).sort({ createdAt: 1 });
    // Optionally, mark completed quizzes for the user
    const completed = req.user?.completedQuizzes || [];
    const data = quizzes.map(q => ({
      id: q._id,
      title: q.title,
      description: q.description,
      questions: q.questions.map(qn => ({
        question: qn.question,
        options: qn.options.map(opt => ({ id: opt.id, text: opt.text }))
      })),
      timeLimit: q.timeLimit,
      reward: q.reward,
      tags: q.tags,
      available: q.available,
      completed: completed.map(id => id.toString()).includes(q._id.toString())
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
  }
};

// POST /practice/complete-challenge
exports.completeChallenge = async (req, res) => {
  try {
    const { transactionId, isFraud } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: 'Transaction ID required' });
    // Optionally, validate transactionId and isFraud with your business logic

    // Mark as completed for user
    const user = await User.findById(req.user._id);
    if (!user.completedChallenges) user.completedChallenges = [];
    if (!user.completedChallenges.includes(transactionId)) {
      user.completedChallenges.push(transactionId);
      user.points += 20; // Reward points, adjust as needed
      await user.save();
    }
    res.json({ success: true, message: 'Challenge completed', reward: 20 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete challenge' });
  }
};

// POST /practice/submit-scenario
exports.submitScenario = async (req, res) => {
  try {
    const { scenarioId, optionId } = req.body;
    if (!scenarioId || !optionId) return res.status(400).json({ success: false, message: 'Scenario ID and option ID required' });

    const scenario = await PracticeScenario.findById(scenarioId);
    if (!scenario) return res.status(404).json({ success: false, message: 'Scenario not found' });

    const selectedOption = scenario.options.find(opt => opt.id === optionId);
    if (!selectedOption) return res.status(400).json({ success: false, message: 'Invalid option' });

    // Mark as completed for user
    const user = await User.findById(req.user._id);
    if (!user.completedScenarios) user.completedScenarios = [];
    let reward = 0;
    if (!user.completedScenarios.includes(scenarioId)) {
      user.completedScenarios.push(scenarioId);
      if (selectedOption.correct) {
        reward = scenario.reward;
        user.points += reward;
      }
      await user.save();
    }
    res.json({ success: true, correct: selectedOption.correct, reward });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit scenario answer' });
  }
};

// POST /practice/complete-quiz
exports.completeQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    if (!quizId || !answers) return res.status(400).json({ success: false, message: 'Quiz ID and answers required' });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] && answers[idx] === q.correctOptionId) score++;
    });

    // Mark as completed for user
    const user = await User.findById(req.user._id);
    if (!user.completedQuizzes) user.completedQuizzes = [];
    let reward = 0;
    if (!user.completedQuizzes.includes(quizId)) {
      user.completedQuizzes.push(quizId);
      reward = quiz.reward;
      user.points += reward;
      await user.save();
    }
    res.json({ success: true, score, total: quiz.questions.length, reward });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete quiz' });
  }
};
