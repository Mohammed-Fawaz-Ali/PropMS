const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

exports.getUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await prisma.unit.findFirst({
      where: { id },
      include: {
        property: true,
        tenancies: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { tenant: { select: { id: true, name: true, email: true, phone: true } } }
        }
      }
    });

    if (!unit) return error(res, 'Unit not found', 404);
    if (unit.property.ownerId !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'Unauthorized', 403);
    }

    return success(res, unit);
  } catch (err) {
    return error(res, err.message);
  }
};
