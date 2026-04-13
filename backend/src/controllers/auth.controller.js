const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { deletePropertyData } = require('./property.controller');
const { success, error } = require('../utils/apiResponse');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return error(res, 'Missing required fields', 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, 'Email already exists', 400);

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'owner' } // default to owner for registration testing
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    const { password: _, ...userWithoutPassword } = user;
    return success(res, { user: userWithoutPassword, token }, 'Registered successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Missing credentials', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return error(res, 'Invalid credentials', 401);
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    const { password: _, ...userWithoutPassword } = user;
    return success(res, { user: userWithoutPassword, token }, 'Logged in successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, email, phone, personalEmail } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return error(res, 'User not found', 404);

    if (email && email !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return error(res, 'Email already in use', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ?? user.name,
        email: email ?? user.email,
        phone: phone ?? user.phone,
        personalEmail: personalEmail ?? user.personalEmail
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return success(res, userWithoutPassword, 'Profile updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return error(res, 'User not found', 404);

    if (user.role === 'owner') {
      const properties = await prisma.property.findMany({ where: { ownerId: user.id } });
      for (const property of properties) {
        await deletePropertyData(property.id);
      }
      await prisma.expense.deleteMany({ where: { ownerId: user.id } });
      await prisma.maintenanceInsight.deleteMany({ where: { ownerId: user.id } });
      await prisma.maintenanceTicket.deleteMany({ where: { ownerId: user.id } });
    }

    await prisma.inspection.deleteMany({ where: { conductedById: user.id } });
    await prisma.message.deleteMany({ where: { senderId: user.id } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });

    await prisma.user.delete({ where: { id: user.id } });

    return success(res, null, 'User account deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return error(res, 'User not found', 404);
    const { password: _, ...userWithoutPassword } = user;
    return success(res, userWithoutPassword);
  } catch (err) {
    return error(res, err.message);
  }
};
