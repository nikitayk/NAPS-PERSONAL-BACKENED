const fs = require('fs');
const path = require('path');

// Define the project structure
const structure = {
  src: {
    config: ['config.js', 'db.js', 'logger.js'],
    controllers: [
      'authController.js',
      'userController.js',
      'transactionController.js',
      'fraudController.js',
      'gamificationController.js',
      'forumController.js',
      'analyticsController.js',
    ],
    models: [
      'User.js',
      'Transaction.js',
      'FraudAlert.js',
      'Reward.js',
      'ForumPost.js',
      'ForumReply.js',
    ],
    routes: [
      'authRoutes.js',
      'userRoutes.js',
      'transactionRoutes.js',
      'fraudRoutes.js',
      'gamificationRoutes.js',
      'forumRoutes.js',
      'analyticsRoutes.js',
      'index.js',
    ],
    services: [
      'authService.js',
      'userService.js',
      'transactionService.js',
      'fraudService.js',
      'gamificationService.js',
      'forumService.js',
      'analyticsService.js',
    ],
    middlewares: [
      'authMiddleware.js',
      'errorHandler.js',
      'validateRequest.js',
      'rateLimiter.js',
      'loggerMiddleware.js',
      'notFound.js',
    ],
    utils: [
      'validators.js',
      'mailer.js',
      'token.js',
      'constants.js',
      'helpers.js',
    ],
    public: [], // Static files
    tests: [
      'auth.test.js',
      'user.test.js',
      'transaction.test.js',
      'fraud.test.js',
      'gamification.test.js',
      'forum.test.js',
      'analytics.test.js',
    ],
    '.': ['app.js'], // Root-level files under `src`
  },
  '.': ['.env', '.gitignore', 'package.json', 'README.md', 'server.js'], // Files outside `src`
};

// Helper function to create folders and files
function createStructure(basePath, obj) {
  for (const key in obj) {
    const currentPath = path.join(basePath, key);
    if (Array.isArray(obj[key])) {
      // Create files
      obj[key].forEach((file) => {
        const filePath = path.join(currentPath, file);
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '');
        }
      });
    } else {
      // Create folders
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
      }
      createStructure(currentPath, obj[key]);
    }
  }
}

// Run the script
createStructure(__dirname, structure);

console.log('Project structure fixed successfully!');
