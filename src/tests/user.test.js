const userService = require('../services/userService');
const userController = require('../controllers/userController');

jest.mock('../services/userService');

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, user: { _id: 'user1' } };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };
    next = jest.fn();
  });

  it('should get user profile', async () => {
    userService.findById.mockResolvedValue({ name: 'Test User', email: 'test@example.com' });
    await userController.getProfile(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ name: 'Test User' })
    }));
  });

  it('should update user profile', async () => {
    userService.updateProfile.mockResolvedValue({ name: 'Updated User' });
    req.body = { name: 'Updated User' };
    await userController.updateProfile(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ name: 'Updated User' })
    }));
  });

  it('should delete user profile', async () => {
    userService.deleteUser.mockResolvedValue();
    await userController.deleteProfile(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'User deleted successfully'
    }));
  });

  it('should list users (admin)', async () => {
    userService.findAll = jest.fn().mockResolvedValue([{ name: 'User1' }, { name: 'User2' }]);
    await userController.listUsers(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Array)
    }));
  });

  it('should handle errors gracefully', async () => {
    userService.findById.mockRejectedValue(new Error('DB error'));
    await userController.getProfile(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
