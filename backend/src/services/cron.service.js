const cron = require('node-cron');
const prisma = require('../prisma');
const { generateRentBillsForTenancy } = require('./rentBilling.service');

const startCronJobs = () => {
    // Run exactly at midnight server-time every day
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Running daily lease expiration check...');
        try {
            const today = new Date();
            
            // Find all active tenancies where the lease has expired
            const expiredTenancies = await prisma.tenancy.findMany({
                where: {
                    status: 'active',
                    leaseEnd: {
                        lt: today
                    }
                }
            });

            if (expiredTenancies.length > 0) {
                console.log(`[Cron] Found ${expiredTenancies.length} expired leases. Auto-unassigning...`);
                
                for (const t of expiredTenancies) {
                    // Update Tenancy Status
                    await prisma.tenancy.update({
                        where: { id: t.id },
                        data: { status: 'ended' }
                    });

                    // Update Unit Status back to vacant
                    await prisma.unit.update({
                        where: { id: t.unitId },
                        data: { status: 'vacant' }
                    });
                    
                    console.log(`[Cron] Lease ${t.id} ended. Unit ${t.unitId} is now vacant.`);
                }
            } else {
                console.log('[Cron] No expired leases found today.');
            }

            // ============================================
            // 2. AUTO-GENERATE MONTHLY RENT BILLS
            // ============================================
            console.log('[Cron] Running daily rent bill generation check...');
            
            const activeTenancies = await prisma.tenancy.findMany({
                where: { status: 'active' }
            });

            let generatedCount = 0;

            for (const tenancy of activeTenancies) {
                const count = await generateRentBillsForTenancy(tenancy);
                generatedCount += count;
            }

            console.log(`[Cron] Auto-generated ${generatedCount} rent bills.`);

            // ============================================
            // 3. LEASE EXPIRATION NOTICES
            // ============================================
            console.log('[Cron] Checking for lease expiration notices...');
            const tenanciesForNotice = await prisma.tenancy.findMany({
                where: {
                    status: 'active',
                    leaseEnd: { not: null },
                    leaseNoticeSent: false
                },
                include: { tenant: true, owner: true }
            });

            for (const t of tenanciesForNotice) {
                const noticeThreshold = new Date(t.leaseEnd);
                noticeThreshold.setDate(noticeThreshold.getDate() - (t.noticePeriodDays || 30));

                if (today >= noticeThreshold) {
                    console.log(`[Cron] Lease Notice due for ${t.tenant.name}. Dispatching...`);
                    
                    try {
                        const emailService = require('./email.service');
                        await emailService.sendLeaseNoticeEmail(
                            t.tenant.personalEmail || t.tenant.email,
                            t.tenant.name,
                            new Date(t.leaseEnd).toLocaleDateString(),
                            t.owner.name
                        );

                        await prisma.notification.create({
                            data: {
                                userId: t.tenantId,
                                type: 'lease_expired',
                                title: 'Upcoming Lease Expiration',
                                body: `Heads up! Your lease for ${t.unit?.unitNumber || 'your unit'} expires on ${new Date(t.leaseEnd).toLocaleDateString()}. Check your email for details.`
                            }
                        });

                        await prisma.tenancy.update({
                            where: { id: t.id },
                            data: { leaseNoticeSent: true }
                        });
                    } catch (err) {
                        console.error(`[Cron] Failed to send notice for ${t.id}:`, err.message);
                    }
                }
            }

        } catch (err) {
            console.error('[Cron] Error running daily jobs:', err);
        }
    });

    // Every Monday at 8:00 AM — auto-generate maintenance insights for all properties
    cron.schedule('0 8 * * 1', async () => {
        console.log('[CRON] Running weekly maintenance predictions...');
        try {
            const { getMaintenanceInsights } = require('../controllers/ai.controller');
            const properties = await prisma.property.findMany({
                select: { id: true, ownerId: true, name: true }
            });

            for (const property of properties) {
                console.log(`[CRON] Generating insights for: ${property.name}`);
                // Simple hack: mock the req/res to reuse the controller logic (or refactor later)
                // For now, let's just log. The manual trigger is fully functional.
            }
        } catch (err) {
            console.error('[CRON] Maintenance prediction failed:', err);
        }
    });
};

module.exports = startCronJobs;
