const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, notifications);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findFirst({ where: { id, userId: req.user.id } });
    if (!notification) return error(res, 'Notification not found', 404);

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return success(res, updated, 'Notification marked as read');
  } catch (err) {
    return error(res, err.message);
  }
};
