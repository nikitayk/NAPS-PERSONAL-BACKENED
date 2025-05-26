const { OpenAI } = require('openai');
const config = require('../config/config');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const UserProgress = require('../models/UserProgress');
let websocketService;

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class LearningService {
  static initialize(ws) {
    websocketService = ws;
  }

  static async generatePersonalizedPath(userId) {
    try {
      const user = await User.findById(userId);
      const progress = await UserProgress.findOne({ userId });

      // Get user's learning history and preferences
      const learningHistory = await this.getUserLearningHistory(userId);
      
      // Generate personalized learning path using AI
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are an expert financial education advisor. Create a personalized learning path."
        }, {
          role: "user",
          content: JSON.stringify({
            currentLevel: user.level,
            completedLessons: learningHistory.completedLessons,
            quizScores: learningHistory.quizScores,
            interests: user.interests,
            goals: user.financialGoals
          })
        }],
        temperature: 0.7
      });

      const recommendedPath = JSON.parse(aiResponse.choices[0].message.content);
      return this.structureLearningPath(recommendedPath);
    } catch (error) {
      console.error('Error generating learning path:', error);
      return this.getDefaultLearningPath();
    }
  }

  static async getUserLearningHistory(userId) {
    const progress = await UserProgress.findOne({ userId })
      .populate('completedLessons')
      .populate('quizAttempts');

    return {
      completedLessons: progress?.completedLessons || [],
      quizScores: progress?.quizAttempts.map(q => ({
        quizId: q.quizId,
        score: q.score,
        date: q.completedAt
      })) || [],
      lastActivity: progress?.lastActivityDate
    };
  }

  static async generateQuizQuestions(lessonId, userId) {
    try {
      const lesson = await Lesson.findById(lessonId);
      const userProgress = await UserProgress.findOne({ userId });

      // Use AI to generate contextual quiz questions
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "Generate 5 quiz questions based on the lesson content and user's level."
        }, {
          role: "user",
          content: JSON.stringify({
            lessonContent: lesson.content,
            userLevel: userProgress.currentLevel,
            previousAttempts: userProgress.quizAttempts
          })
        }],
        temperature: 0.8
      });

      const questions = JSON.parse(aiResponse.choices[0].message.content);
      return this.formatQuizQuestions(questions);
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      return this.getDefaultQuizQuestions(lessonId);
    }
  }

  static async analyzeQuizPerformance(userId, quizId, answers) {
    try {
      const quiz = await Quiz.findById(quizId);
      const score = this.calculateQuizScore(quiz.questions, answers);

      // Use AI to generate personalized feedback
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "Analyze quiz performance and provide personalized feedback and recommendations."
        }, {
          role: "user",
          content: JSON.stringify({
            questions: quiz.questions,
            userAnswers: answers,
            score: score
          })
        }],
        temperature: 0.7
      });

      const feedback = JSON.parse(aiResponse.choices[0].message.content);
      
      // Update user progress
      const progress = await UserProgress.findOneAndUpdate(
        { userId },
        {
          $push: {
            quizAttempts: {
              quizId,
              score,
              answers,
              feedback: feedback.summary,
              completedAt: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );

      // Send real-time learning update
      if (websocketService) {
        websocketService.sendLearningUpdate(userId, {
          type: 'QUIZ_COMPLETED',
          quizId,
          score,
          feedback: feedback.summary,
          overallProgress: {
            completedQuizzes: progress.quizAttempts.length,
            averageScore: this.calculateAverageScore(progress.quizAttempts)
          }
        });
      }

      return {
        score,
        feedback: feedback.detailed,
        recommendations: feedback.recommendations
      };
    } catch (error) {
      console.error('Error analyzing quiz performance:', error);
      return {
        score: this.calculateQuizScore(quiz.questions, answers),
        feedback: "Unable to generate detailed feedback at this time.",
        recommendations: []
      };
    }
  }

  static calculateAverageScore(quizAttempts) {
    if (!quizAttempts.length) return 0;
    const sum = quizAttempts.reduce((acc, attempt) => acc + attempt.score, 0);
    return sum / quizAttempts.length;
  }

  static calculateQuizScore(questions, answers) {
    let correctAnswers = 0;
    questions.forEach((q, index) => {
      if (q.correctAnswer === answers[index]) {
        correctAnswers++;
      }
    });
    return (correctAnswers / questions.length) * 100;
  }

  static async getRecommendedResources(userId) {
    const user = await User.findById(userId);
    const progress = await UserProgress.findOne({ userId });

    // Get personalized resource recommendations
    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "Recommend learning resources based on user progress and interests."
        }, {
          role: "user",
          content: JSON.stringify({
            level: user.level,
            interests: user.interests,
            completedLessons: progress.completedLessons,
            strengths: progress.strengths,
            weaknesses: progress.weaknesses
          })
        }],
        temperature: 0.6
      });

      return JSON.parse(aiResponse.choices[0].message.content);
    } catch (error) {
      console.error('Error getting resource recommendations:', error);
      return this.getDefaultResources();
    }
  }

  static structureLearningPath(aiRecommendations) {
    return {
      currentModule: aiRecommendations.currentModule,
      nextSteps: aiRecommendations.nextSteps,
      prerequisites: aiRecommendations.prerequisites,
      estimatedTimeToComplete: aiRecommendations.estimatedTime,
      difficulty: aiRecommendations.difficulty
    };
  }

  static getDefaultLearningPath() {
    return {
      currentModule: "Financial Basics",
      nextSteps: ["Budgeting 101", "Saving Strategies", "Investment Fundamentals"],
      prerequisites: [],
      estimatedTimeToComplete: "2 weeks",
      difficulty: "beginner"
    };
  }

  static getDefaultQuizQuestions(lessonId) {
    return [
      {
        question: "What is the first step in financial planning?",
        options: [
          "Setting goals",
          "Making investments",
          "Taking loans",
          "Spending money"
        ],
        correctAnswer: 0
      }
      // Add more default questions as needed
    ];
  }

  static getDefaultResources() {
    return {
      articles: [
        {
          title: "Introduction to Personal Finance",
          url: "/resources/intro-finance",
          difficulty: "beginner"
        }
      ],
      videos: [
        {
          title: "Understanding the Basics of Investing",
          url: "/resources/investing-basics",
          duration: "10:00"
        }
      ],
      exercises: [
        {
          title: "Create Your First Budget",
          type: "interactive",
          estimatedTime: "30 minutes"
        }
      ]
    };
  }
}

module.exports = LearningService; 