const authService = require('../services/authService');
const authController = require('../controllers/authController');

jest.mock('../services/authService');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };
  });

  it('should register a new user', async () => {
    req.body = { name: 'Test', email: 'test@example.com', password: 'password123' };
    authService.register.mockResolvedValue({ id: '1', name: 'Test', email: 'test@example.com' });

    await authController.register(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ name: 'Test', email: 'test@example.com' })
    }));
  });

  it('should handle registration errors', async () => {
    req.body = { name: 'Test', email: 'test@example.com', password: 'password123' };
    authService.register.mockRejectedValue(new Error('User already exists'));

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.any(String)
    }));
  });

  it('should login a user', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };
    authService.login.mockResolvedValue({ user: { id: '1', email: 'test@example.com' }, token: 'jwt-token' });

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' }),
        token: 'jwt-token'
      })
    }));
  });

  it('should handle login errors', async () => {
    req.body = { email: 'test@example.com', password: 'wrongpassword' };
    authService.login.mockRejectedValue(new Error('Invalid credentials'));

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.any(String)
    }));
  });
});
