const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');
const { generateRentBillsForTenancy } = require('../services/rentBilling.service');
const bcrypt = require('bcrypt');

exports.getTenants = async (req, res) => {
  try {
    const tenancies = await prisma.tenancy.findMany({
        where: { ownerId: req.user.id },
        include: {
            tenant: { select: { id: true, name: true, email: true, personalEmail: true, phone: true } },
            unit: { include: { property: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return success(res, tenancies);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.addTenant = async (req, res) => {
  try {
    const { name, email, personalEmail, phone, password, unitId, leaseStart, leaseEnd, monthlyRent, depositPaid, noticePeriodDays, rentDueDay } = req.body;

    // First check if unit is owned by caller
    const unit = await prisma.unit.findFirst({
        where: { id: unitId, property: { ownerId: req.user.id } }
    });

    if (!unit) return error(res, 'Unit not found or unauthorized', 404);

    // See if user already exists
    let tenant = await prisma.user.findUnique({ where: { email } });
    
    if (!tenant) {
        // Use owner provided password or default fallback
        const finalPassword = password || 'propms123!';
        const hashed = await bcrypt.hash(finalPassword, 12);
        
        tenant = await prisma.user.create({
            data: {
                name, email, personalEmail, phone, password: hashed, role: 'tenant'
            }
        });
    } else {
        // Edit existing user password if owner provided one
        let updateData = { name, phone, personalEmail };
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }
        tenant = await prisma.user.update({
            where: { email },
            data: updateData
        });
    }

    // Create the Tenancy
    const tenancy = await prisma.tenancy.create({
        data: {
            tenantId: tenant.id,
            unitId,
            ownerId: req.user.id,
            leaseStart: new Date(leaseStart),
            leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
            monthlyRent: Number(monthlyRent),
            depositPaid: Number(depositPaid || 0),
            noticePeriodDays: Number(noticePeriodDays || 30),
            rentDueDay: Number(rentDueDay ?? new Date(leaseStart).getDate()),
            status: 'active'
        }
    });

    // Automatically set the Unit status to occupied
    await prisma.unit.update({
        where: { id: unitId },
        data: { status: 'occupied' }
    });

    // Generate initial rent bills for the tenancy immediately
    await generateRentBillsForTenancy(tenancy);

    // Formal Email Service logic
    if (personalEmail) {
        const emailService = require('../services/email.service');
        await emailService.sendWelcomeEmail(personalEmail, name, unit?.property?.name, email, password || 'propms123!');
    }

    return success(res, tenancy, 'Tenant onboarded successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, personalEmail, password, leaseEnd, monthlyRent, depositPaid, noticePeriodDays, rentDueDay } = req.body;
        
        const tenancy = await prisma.tenancy.findFirst({ where: { id, ownerId: req.user.id }});
        if (!tenancy) return error(res, 'Tenancy not found', 404);

        if (name || phone || email || personalEmail !== undefined || password) {
            let userData = { name, phone };
            if (email) userData.email = email;
            if (personalEmail !== undefined) userData.personalEmail = personalEmail;
            if (password) {
                userData.password = await bcrypt.hash(password, 12);
            }
            if (Object.keys(userData).length > 0) {
                await prisma.user.update({
                    where: { id: tenancy.tenantId },
                    data: userData
                });
            }
        }
        
        if (leaseEnd !== undefined || monthlyRent !== undefined || depositPaid !== undefined || noticePeriodDays !== undefined || rentDueDay !== undefined) {
            let tenData = {};
            if (leaseEnd) tenData.leaseEnd = new Date(leaseEnd);
            if (monthlyRent) tenData.monthlyRent = Number(monthlyRent);
            if (depositPaid) tenData.depositPaid = Number(depositPaid);
            if (noticePeriodDays) tenData.noticePeriodDays = Number(noticePeriodDays);
            if (rentDueDay !== undefined) tenData.rentDueDay = Number(rentDueDay);
            
            if (Object.keys(tenData).length > 0) {
                await prisma.tenancy.update({
                    where: { id },
                    data: tenData
                });
            }
        }
        return success(res, null, 'Tenant updated successfully');
    } catch(err) {
        return error(res, err.message);
    }
};

exports.deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const tenancy = await prisma.tenancy.findFirst({ where: { id, ownerId: req.user.id }});
        if (!tenancy) return error(res, 'Tenancy not found', 404);
        
        await prisma.payment.deleteMany({ where: { tenancyId: id } });
        await prisma.tenancy.delete({ where: { id } });
        
        await prisma.unit.update({
            where: { id: tenancy.unitId },
            data: { status: 'vacant' }
        });
        
        return success(res, null, 'Tenant removed successfully');
    } catch(err) {
        return error(res, err.message);
    }
};

exports.getMyTenancy = async (req, res) => {
    try {
        const tenancy = await prisma.tenancy.findFirst({
            where: { tenantId: req.user.id },
            include: { unit: { include: { property: true } }, owner: { select: { name: true, email: true, personalEmail: true, phone: true } } },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!tenancy) return error(res, 'No active leasing found', 404);

        // Attach global template if not already locally cached on tenancy?
        // Let's just find the global template for the property type associated with this unit!
        const globalTemplate = await prisma.document.findFirst({
            where: { ownerId: tenancy.ownerId, docType: 'global_template', relatedType: tenancy.unit.property.type }
        });

        // Pack it
        const payload = { ...tenancy, masterLeaseUrl: globalTemplate?.url || null };

        return success(res, payload);
    } catch(err) {
        return error(res, err.message);
    }
};

exports.signLease = async (req, res) => {
    try {
        const tenancy = await prisma.tenancy.findFirst({ where: { tenantId: req.user.id } });
        if (!tenancy) return error(res, 'Not found', 404);

        await prisma.tenancy.update({
            where: { id: tenancy.id },
            data: { isLeaseSigned: true }
        });
        return success(res, null, 'Terms accepted successfully');
    } catch(err) {
        return error(res, err.message);
    }
};
