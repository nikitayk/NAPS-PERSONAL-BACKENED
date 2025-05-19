const gamificationService = require('../services/gamificationService');
const gamificationController = require('../controllers/gamificationController');

jest.mock('../services/gamificationService');

describe('Gamification Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { _id: 'user1' } };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };
  });

  it('should get user progress', async () => {
    gamificationService.getUserProgress = jest.fn().mockResolvedValue({
      points: 100, level: 2, badges: ['starter']
    });
    await gamificationController.getUserProgress(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ points: 100, level: 2 })
    }));
  });

  it('should claim a reward', async () => {
    gamificationService.claimReward = jest.fn().mockResolvedValue({ name: 'Free Coffee' });
    req.body.rewardId = 'reward1';
    await gamificationController.claimReward(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ name: 'Free Coffee' })
    }));
  });

  it('should handle error on claimReward', async () => {
    gamificationService.claimReward = jest.fn().mockRejectedValue(new Error('Not enough points'));
    await gamificationController.claimReward(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
