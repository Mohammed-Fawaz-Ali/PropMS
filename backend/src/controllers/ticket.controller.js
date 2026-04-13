const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

exports.getTickets = async (req, res) => {
    try {
        let where = {};
        if (req.user.role === 'owner') where.ownerId = req.user.id;
        if (req.user.role === 'tenant') where.tenantId = req.user.id;

        const tickets = await prisma.maintenanceTicket.findMany({
            where,
            include: {
                tenant: { select: { name: true, phone: true } },
                unit: { select: { unitNumber: true, property: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return success(res, tickets);
    } catch(err) {
        return error(res, err.message);
    }
};

exports.createTicket = async (req, res) => {
    try {
        const { title, description, category, priority, photoUrls } = req.body;

        // Find tenant's active tenancy
        const tenancy = await prisma.tenancy.findFirst({
            where: { tenantId: req.user.id },
            include: { unit: true }
        });

        if (!tenancy) return error(res, 'No active property assignment found', 400);

        const ticket = await prisma.maintenanceTicket.create({
            data: {
                unitId: tenancy.unitId,
                tenantId: req.user.id,
                ownerId: tenancy.ownerId,
                title,
                description,
                category: category || 'other',
                priority: priority || 'medium',
                photoUrls: photoUrls || []
            }
        });

        return success(res, ticket, 'Ticket raised successfully', 201);
    } catch(err) {
        return error(res, err.message);
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNote, cost } = req.body;

        const ticket = await prisma.maintenanceTicket.findFirst({
            where: { id, ownerId: req.user.id },
            include: { unit: true }
        });

        if (!ticket) return error(res, 'Ticket not found', 404);

        const updatedData = { status, resolutionNote };
        if (cost !== undefined) updatedData.cost = Number(cost);
        if (status === 'resolved') updatedData.resolvedAt = new Date();

        const updated = await prisma.maintenanceTicket.update({
            where: { id },
            data: updatedData
        });

        // Auto-add to Expenses if cost exists
        if (cost && Number(cost) > 0) {
            // Check if already expensed to prevent duplicate on repeated updates
            const existingExp = await prisma.expense.findFirst({
                where: { description: { contains: `Ticket #${id.substring(0, 8)}` } }
            });

            if (!existingExp) {
                await prisma.expense.create({
                   data: {
                       propertyId: ticket.unit.propertyId,
                       unitId: ticket.unitId,
                       ownerId: ticket.ownerId,
                       category: 'maintenance',
                       amount: Number(cost),
                       date: new Date(),
                       description: `Auto-Expense for Maintenance Ticket #${id.substring(0, 8)}: ${updated.title}`
                   }
                });
            }
        }

        // System notification to tenant
        await prisma.notification.create({
            data: {
                userId: ticket.tenantId,
                type: 'ticket_update',
                title: 'Ticket Status Updated',
                body: `Your ticket "${ticket.title}" is now marked as ${status}.`
            }
        });

        return success(res, updated, 'Ticket updated successfully');
    } catch(err) {
        return error(res, err.message);
    }
};
