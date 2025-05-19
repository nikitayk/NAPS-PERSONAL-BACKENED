const analyticsService = require('../services/analyticsService');
const analyticsController = require('../controllers/analyticsController');

jest.mock('../services/analyticsService');

describe('Analytics Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };
  });

  it('should return overview data', async () => {
    analyticsService.getOverview.mockResolvedValue({
      users: 10, transactions: 20, fraudAlerts: 2, rewards: 5
    });

    await analyticsController.getOverview(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        users: 10,
        transactions: 20,
        fraudAlerts: 2,
        rewards: 5
      })
    }));
  });

  it('should handle errors in overview', async () => {
    analyticsService.getOverview.mockRejectedValue(new Error('DB error'));

    await analyticsController.getOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false
    }));
  });
});
