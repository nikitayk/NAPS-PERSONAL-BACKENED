const forumService = require('../services/forumService');
const forumController = require('../controllers/forumController');

jest.mock('../services/forumService');

describe('Forum Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: { _id: 'user1' } };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };
  });

  it('should list threads', async () => {
    forumService.listThreads.mockResolvedValue([{ title: 'Thread 1' }]);
    await forumController.listThreads(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [{ title: 'Thread 1' }]
    }));
  });

  it('should get a thread with replies', async () => {
    forumService.getThreadWithReplies.mockResolvedValue({
      thread: { title: 'Thread 1' },
      replies: [{ content: 'Reply 1' }]
    });
    req.params.id = 'thread1';
    await forumController.getThread(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        thread: expect.objectContaining({ title: 'Thread 1' }),
        replies: expect.any(Array)
      })
    }));
  });

  it('should handle error on createThread', async () => {
    forumService.createThread.mockRejectedValue(new Error('DB error'));
    await forumController.createThread(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
