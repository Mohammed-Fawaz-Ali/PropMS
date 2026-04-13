const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

exports.getGlobalDocuments = async (req, res) => {
    try {
        const documents = await prisma.document.findMany({
            where: { ownerId: req.user.id, docType: 'global_template' }
        });
        return success(res, documents);
    } catch (err) {
        return error(res, err.message);
    }
};

exports.saveGlobalDocument = async (req, res) => {
    try {
        const { relatedType, url, name } = req.body;
        
        // Upsert logic for template docs
        const existing = await prisma.document.findFirst({
            where: { ownerId: req.user.id, docType: 'global_template', relatedType }
        });

        if (existing) {
            const updated = await prisma.document.update({
                where: { id: existing.id },
                data: { url, name }
            });
            return success(res, updated);
        } else {
            const created = await prisma.document.create({
                data: {
                    ownerId: req.user.id,
                    docType: 'global_template',
                    relatedType,
                    relatedId: 'global',
                    url,
                    name
                }
            });
            return success(res, created);
        }
    } catch (err) {
        return error(res, err.message);
    }
};
