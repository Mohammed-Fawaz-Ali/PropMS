const prisma = require('../prisma');

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addMonths = (date, months) => {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
};

const clampDueDate = (date, day) => {
  const dueDate = new Date(date);
  dueDate.setDate(day);
  if (dueDate.getDate() !== day) {
    dueDate.setDate(0);
  }
  return dueDate;
};

const getDayRange = (date) => {
  const start = startOfDay(date);
  const end = addMonths(start, 1);
  return { start, end };
};

const generateRentBillsForTenancy = async (tenancy) => {
  const today = startOfDay(new Date());
  const leaseStart = startOfDay(new Date(tenancy.leaseStart));
  const dueDay = tenancy.rentDueDay ?? leaseStart.getDate();
  const generateUntilBase = tenancy.leaseEnd ? startOfDay(new Date(tenancy.leaseEnd)) : addMonths(today, 1);
  const generateUntil = tenancy.leaseEnd ? (generateUntilBase < addMonths(today, 1) ? generateUntilBase : addMonths(today, 1)) : addMonths(today, 1);

  let monthsToBill = 0;
  let createdCount = 0;

  while (true) {
    const periodStart = addMonths(leaseStart, monthsToBill);
    if (periodStart > generateUntil) break;

    const { start: periodStartDay, end: nextPeriodStart } = getDayRange(periodStart);
    const dueDate = clampDueDate(addMonths(periodStartDay, 1), dueDay);

    const existingBill = await prisma.payment.findFirst({
      where: {
        tenancyId: tenancy.id,
        paymentType: 'rent',
        forMonth: {
          gte: periodStartDay,
          lt: nextPeriodStart
        }
      }
    });

    if (!existingBill) {
      await prisma.payment.create({
        data: {
          tenancyId: tenancy.id,
          tenantId: tenancy.tenantId,
          amount: tenancy.monthlyRent,
          dueDate,
          forMonth: periodStartDay,
          paymentType: 'rent',
          status: 'pending',
          notes: `Rent bill for period starting ${periodStartDay.toDateString()}`
        }
      });
      createdCount++;
    }

    monthsToBill++;
  }

  return createdCount;
};

module.exports = {
  generateRentBillsForTenancy
};
