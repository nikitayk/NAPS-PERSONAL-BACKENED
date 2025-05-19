const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  points: { 
    type: Number, 
    default: 0 
  },
  level: { 
    type: Number, 
    default: 1 
  },
  badges: [{ 
    type: String 
  }],
  rewards: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Reward' 
  }],
  // Learning progress
  completedLessons: [{ 
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    default: []
  }],
  // Practice progress
  completedChallenges: [{
    type: String,  // Stores challenge IDs (e.g., transaction IDs)
    default: []
  }],
  completedScenarios: [{ 
    type: Schema.Types.ObjectId,
    ref: 'PracticeScenario',
    default: []
  }],
  completedQuizzes: [{ 
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    default: []
  }],
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);


