const transactionService = require('../services/transactionService');
const transactionController = require('../controllers/transactionController');

jest.mock('../services/transactionService');

describe('Transaction Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: 'user1' } };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };
  });

  it('should create a transaction', async () => {
    transactionService.createTransaction.mockResolvedValue({ amount: 100, status: 'approved' });
    req.body = { amount: 100, description: 'Test', category: 'food' };
    await transactionController.createTransaction(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ amount: 100, status: 'approved' })
    }));
  });

  it('should get user transactions', async () => {
    transactionService.getTransactions.mockResolvedValue([{ amount: 50 }, { amount: 75 }]);
    await transactionController.getTransactions(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Array)
    }));
  });

  it('should get transaction details', async () => {
    transactionService.getTransactionById.mockResolvedValue({ amount: 200, description: 'Details' });
    req.params.id = 'txn123';
    await transactionController.getTransactionDetails(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ amount: 200 })
    }));
  });

  it('should handle errors gracefully', async () => {
    transactionService.createTransaction.mockRejectedValue(new Error('DB error'));
    await transactionController.createTransaction(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
