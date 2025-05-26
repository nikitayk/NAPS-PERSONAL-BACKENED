// src/services/gamificationService.js
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Badge = require('../models/Badge');
const Quest = require('../models/Quest');
const config = require('../config/config');
let websocketService;

class GamificationService {
  static initialize(ws) {
    websocketService = ws;
  }

  static async processUserAction(userId, action, metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Calculate points based on action
      const points = await this.calculatePoints(action, metadata);
      user.points += points;

      // Check for level up
      const previousLevel = user.level;
      user.level = this.calculateLevel(user.points);
      const didLevelUp = user.level > previousLevel;

      // Process achievements
      const newAchievements = await this.processAchievements(userId, action, metadata);

      // Process quests
      const updatedQuests = await this.updateQuests(userId, action, metadata);

      // Save user changes
      await user.save();

      // Send real-time notifications
      if (websocketService) {
        // Level up notification
        if (didLevelUp) {
          websocketService.sendAchievementNotification(userId, {
            type: 'LEVEL_UP',
            oldLevel: previousLevel,
            newLevel: user.level,
            points: user.points
          });
        }

        // New achievements notification
        if (newAchievements.length > 0) {
          websocketService.sendAchievementNotification(userId, {
            type: 'NEW_ACHIEVEMENTS',
            achievements: newAchievements
          });
        }

        // Quest updates notification
        if (updatedQuests.length > 0) {
          websocketService.sendQuestUpdate(userId, {
            type: 'QUEST_PROGRESS',
            quests: updatedQuests
          });
        }
      }

      return {
        pointsEarned: points,
        currentPoints: user.points,
        currentLevel: user.level,
        didLevelUp,
        newAchievements,
        updatedQuests
      };
    } catch (error) {
      console.error('Gamification error:', error);
      throw error;
    }
  }

  static async calculatePoints(action, metadata) {
    const pointsMap = {
      COMPLETE_LESSON: 50,
      PASS_QUIZ: 100,
      DAILY_LOGIN: 10,
      FORUM_POST: 20,
      FORUM_REPLY: 10,
      REPORT_FRAUD: 30,
      VERIFY_TRANSACTION: 5,
      COMPLETE_PROFILE: 50,
      INVITE_USER: 100,
      STREAK_BONUS: (days) => Math.min(days * 10, 100)
    };

    let points = pointsMap[action] || 0;
    if (typeof points === 'function') {
      points = points(metadata.value);
    }

    // Apply multipliers based on user status or special events
    if (metadata.isSpecialEvent) points *= 2;
    if (metadata.streakMultiplier) points *= metadata.streakMultiplier;

    return points;
  }

  static calculateLevel(points) {
    const levels = config.gamification.levels;
    let level = 1;

    for (let i = 0; i < levels.length; i++) {
      if (points >= levels[i]) {
        level = i + 2;
      } else {
        break;
      }
    }

    return level;
  }

  static async processAchievements(userId, action, metadata) {
    const newAchievements = [];
    const achievements = await Achievement.find({ trigger: action });

    for (const achievement of achievements) {
      const alreadyEarned = await Badge.findOne({
        userId,
        achievementId: achievement._id
      });

      if (!alreadyEarned && this.checkAchievementCriteria(achievement, metadata)) {
        const badge = new Badge({
          userId,
          achievementId: achievement._id,
          earnedAt: new Date()
        });
        await badge.save();
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  static async updateQuests(userId, action, metadata) {
    const activeQuests = await Quest.find({
      userId,
      status: 'IN_PROGRESS',
      'objectives.action': action
    });

    const updatedQuests = [];
    for (const quest of activeQuests) {
      const objective = quest.objectives.find(o => o.action === action);
      if (objective) {
        objective.progress += 1;
        if (objective.progress >= objective.target) {
          objective.completed = true;
        }

        // Check if all objectives are completed
        if (quest.objectives.every(o => o.completed)) {
          quest.status = 'COMPLETED';
          quest.completedAt = new Date();
        }

        await quest.save();
        updatedQuests.push(quest);
      }
    }

    return updatedQuests;
  }

  static checkAchievementCriteria(achievement, metadata) {
    switch (achievement.type) {
      case 'STREAK':
        return metadata.streakDays >= achievement.requirement;
      case 'POINTS':
        return metadata.totalPoints >= achievement.requirement;
      case 'ACTIVITY':
        return metadata.activityCount >= achievement.requirement;
      default:
        return false;
    }
  }

  static async getLeaderboard(category = 'points', limit = 10) {
    const aggregation = [
      { $sort: { [category]: -1 } },
      { $limit: limit },
      {
        $project: {
          username: 1,
          points: 1,
          level: 1,
          achievements: 1
        }
      }
    ];

    return await User.aggregate(aggregation);
  }

  static async getUserProgress(userId) {
    const user = await User.findById(userId)
      .populate('badges')
      .populate('activeQuests');

    const nextLevel = config.gamification.levels[user.level - 1] || Infinity;
    const currentLevelPoints = config.gamification.levels[user.level - 2] || 0;
    const pointsToNextLevel = nextLevel - currentLevelPoints;
    const progressToNextLevel = ((user.points - currentLevelPoints) / pointsToNextLevel) * 100;

    return {
      points: user.points,
      level: user.level,
      badges: user.badges,
      activeQuests: user.activeQuests,
      progressToNextLevel: Math.min(progressToNextLevel, 100),
      pointsToNextLevel: nextLevel - user.points
    };
  }
}

module.exports = GamificationService;
