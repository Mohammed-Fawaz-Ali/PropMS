const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

exports.getDashboardData = async (req, res) => {
    try {
        const ownerId = req.user.id;

        // 1. Total units and occupied count
        const properties = await prisma.property.findMany({
            where: { ownerId },
            include: { units: true }
        });

        let totalUnits = 0;
        let occupiedCount = 0;
        properties.forEach(p => {
            totalUnits += p.units.length;
            occupiedCount += p.units.filter(u => u.status === 'occupied').length;
        });
        const vacancyRate = totalUnits === 0 ? 0 : Math.round(((totalUnits - occupiedCount) / totalUnits) * 100);

        // 2. Revenue (Completed rent this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const currentMonthPayments = await prisma.payment.findMany({
            where: {
                tenancy: { ownerId },
                status: 'paid',
                paidDate: { gte: startOfMonth }
            }
        });
        const monthlyRevenue = currentMonthPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // 3. Overdue Payments
        const today = new Date();
        
        // Auto mark overdue before query (basic logic, better in cron)
        await prisma.payment.updateMany({
            where: { tenancy: { ownerId }, status: 'pending', dueDate: { lt: today } },
            data: { status: 'overdue' }
        });

        const overdueCount = await prisma.payment.count({
            where: { tenancy: { ownerId }, status: 'overdue' }
        });

        const overduePayments = await prisma.payment.findMany({
            where: { tenancy: { ownerId }, status: 'overdue' },
            include: { tenancy: { include: { unit: true, tenant: { select: { name: true, email: true } } } } },
            take: 5
        });

        // 4. Chart Data (Last 6 months revenue)
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const label = d.toLocaleString('default', { month: 'short' });
            
            const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            const mPayments = await prisma.payment.findMany({
                where: { tenancy: { ownerId }, status: 'paid', paidDate: { gte: mStart, lte: mEnd } }
            });
            const rev = mPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
            chartData.push({ month: label, revenue: rev });
        }

        // 5. Recent Tickets
        const recentTickets = await prisma.maintenanceTicket.findMany({
            where: { ownerId },
            include: { tenant: { select: { name: true } }, unit: { select: { unitNumber: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // 6. Expenses overview (this month)
        const startOfThisMonth = new Date();
        startOfThisMonth.setDate(1);
        startOfThisMonth.setHours(0, 0, 0, 0);

        const expensesThisMonth = await prisma.expense.findMany({
            where: { ownerId, date: { gte: startOfThisMonth } }
        });

        const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const amenitiesExpensesThisMonth = expensesThisMonth
            .filter(e => e.category === 'amenities')
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const repairsExpensesThisMonth = expensesThisMonth
            .filter(e => e.category === 'repairs' || e.category === 'maintenance' || e.category === 'renovation')
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        // Ticket costs (repairs proxy) this month (if cost filled)
        const ticketsThisMonth = await prisma.maintenanceTicket.findMany({
            where: { ownerId, createdAt: { gte: startOfThisMonth } },
            select: { cost: true }
        });
        const ticketCostThisMonth = ticketsThisMonth.reduce((sum, t) => sum + Number(t.cost || 0), 0);

        return success(res, {
            totalUnits,
            occupiedCount,
            vacancyRate,
            monthlyRevenue,
            overdueCount,
            chartData,
            recentTickets,
            overduePayments,
            totalExpensesThisMonth,
            amenitiesExpensesThisMonth,
            repairsExpensesThisMonth,
            ticketCostThisMonth
        });
    } catch (err) {
        return error(res, err.message);
    }
};
