const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

// Get all ledgers based on user role
exports.getPayments = async (req, res) => {
    try {
        let whereClause = {};
        if (req.user.role === 'owner') {
            whereClause = { tenancy: { ownerId: req.user.id } };
        } else if (req.user.role === 'tenant') {
            whereClause = { tenantId: req.user.id };
        }

        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                tenancy: {
                    include: {
                        tenant: { select: { name: true, email: true } },
                        unit: { select: { unitNumber: true, property: { select: { name: true } } } }
                    }
                }
            },
            orderBy: { dueDate: 'desc' }
        });

        // Simple overdue trigger on fetch
        const modified = payments.map(p => {
             if (p.status === 'pending' && p.dueDate && new Date(p.dueDate) < new Date()) {
                  p.status = 'overdue';
             }
             return p;
        });

        return success(res, modified);
    } catch(err) {
        return error(res, err.message);
    }
};

// Owner issues a rent bill to a tenant manually
exports.issueBill = async (req, res) => {
    try {
        const { tenancyId, amount, dueDate, forMonth, paymentType, notes } = req.body;
        
        const tenancy = await prisma.tenancy.findFirst({ where: { id: tenancyId, ownerId: req.user.id }});
        if (!tenancy) return error(res, 'Tenancy not found or Unauthorized', 404);

        const payment = await prisma.payment.create({
            data: {
                tenancyId,
                tenantId: tenancy.tenantId,
                amount,
                dueDate: new Date(dueDate),
                forMonth: new Date(forMonth),
                paymentType: paymentType || 'rent',
                status: 'pending',
                notes
            }
        });

        await prisma.notification.create({
            data: {
                userId: tenancy.tenantId,
                type: 'rent_bill',
                title: 'New Rent Bill Generated',
                body: `A rent bill for ${new Date(forMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} is due on ${new Date(dueDate).toLocaleDateString()}.`,
                link: '/payments'
            }
        });

        return success(res, payment, 'Bill issued successfully');
    } catch(err) {
        return error(res, err.message);
    }
};

// Owner manually marks rent as paid
exports.markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, notes } = req.body;

        const payment = await prisma.payment.findFirst({
            where: { id, tenancy: { ownerId: req.user.id } }
        });

        if (!payment) return error(res, 'Payment record not found', 404);

        // Auto generate Receipt: REC-TIMESTAMP-RANDOM
        const receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random()*1000)}`;

        const updated = await prisma.payment.update({
            where: { id },
            data: {
                status: 'paid',
                paidDate: new Date(),
                paymentMethod: paymentMethod || 'cash',
                receiptNumber,
                notes: notes || payment.notes
            }
        });

        return success(res, updated, 'Payment marked as paid');
    } catch(err) {
        return error(res, err.message);
    }
};

// Tenant mocks a payment locally
exports.tenantMockPay = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await prisma.payment.findFirst({
            where: { id, tenantId: req.user.id, status: 'pending' }
        });
        if (!payment) return error(res, 'Payment not found or already paid', 404);

        const receiptNumber = `MOCK-${Date.now()}`;
        const updated = await prisma.payment.update({
            where: { id },
            data: { status: 'paid', paidDate: new Date(), paymentMethod: 'upi', receiptNumber }
        });
        return success(res, updated, 'Test Payment Successful');
    } catch(err) {
        return error(res, err.message);
    }
};

const crypto = require('crypto');
const Razorpay = require('razorpay');

let razorpayInstance;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
} catch (error) {
    console.error("Razorpay Initialization Error:", error);
}

// Init Razorpay order
exports.initRazorpay = async (req, res) => {
    try {
        if (!razorpayInstance) return error(res, 'Razorpay gateway not configured on server', 503);

        const { id } = req.params;
        const payment = await prisma.payment.findFirst({
            where: { 
                id, 
                tenantId: req.user.id, 
                status: { in: ['pending', 'overdue'] } 
            },
            include: { tenancy: true }
        });
        if (!payment) return error(res, 'Payment not found or not pending', 404);

        const options = {
            amount: Math.round(Number(payment.amount) * 100), // convert to paise
            currency: 'INR',
            receipt: `rcpt_${payment.id.substring(0, 8)}`,
            payment_capture: 1
        };

        const order = await razorpayInstance.orders.create(options);

        // Save order ID to DB
        await prisma.payment.update({
            where: { id },
            data: { razorpayOrderId: order.id }
        });

        return success(res, {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        }, "Order created");

    } catch(err) {
        return error(res, err.message);
    }
};

// Verify Razorpay signature
exports.verifyRazorpay = async (req, res) => {
    try {
        const { id } = req.params;
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                        .update(body.toString())
                                        .digest('hex');

        if (expectedSignature === razorpay_signature) {
             const receiptNumber = `RP-${Date.now()}`;
             const updated = await prisma.payment.update({
                 where: { id, razorpayOrderId: razorpay_order_id },
                 data: {
                     status: 'paid',
                     paidDate: new Date(),
                     paymentMethod: 'netbanking', // mapping Razorpay generally
                     razorpayPaymentId: razorpay_payment_id,
                     receiptNumber
                 }
             });
             return success(res, updated, 'Payment fully verified and closed.');
        } else {
             return error(res, 'Invalid Payment Signature', 400);
        }
    } catch(err) {
        return error(res, err.message);
    }
};
