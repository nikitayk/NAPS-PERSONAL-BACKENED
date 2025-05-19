const fraudService = require('../services/fraudService');
const fraudController = require('../controllers/fraudController');

jest.mock('../services/fraudService');

describe('Fraud Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: { _id: 'user1' } };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };
  });

  it('should score a transaction', async () => {
    fraudService.analyzeTransaction.mockResolvedValue({ riskScore: 0.9, explanation: 'High risk' });
    req.body.transactionId = 'txn1';
    // Mock Transaction.findById in controller if needed
    await fraudController.scoreTransaction(req, res);
    // Expectation may need adjustment based on your controller's implementation
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ riskScore: 0.9 })
    }));
  });

  it('should handle error on scoreTransaction', async () => {
    fraudService.analyzeTransaction.mockRejectedValue(new Error('Analysis failed'));
    await fraudController.scoreTransaction(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
