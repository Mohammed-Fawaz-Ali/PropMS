const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

exports.getProperties = async (req, res) => {
  try {
    const filters = { ownerId: req.user.id };
    // Add optional filters here if needed
    
    const properties = await prisma.property.findMany({
      where: filters,
      include: {
        units: true,
        _count: {
          select: { units: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return success(res, properties);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findFirst({
      where: { id, ownerId: req.user.id },
      include: {
        units: {
          include: {
            tenancies: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                tenant: { select: { id: true, name: true, email: true, phone: true } }
              }
            }
          }
        }
      }
    });
    
    if (!property) return error(res, 'Property not found', 404);
    
    return success(res, property);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createProperty = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      pincode,
      propertyType,
      amenities,
      coverImageUrl,
      totalUnits,
      plotAreaSqft,
      builtUpAreaSqft,
      lengthFt,
      widthFt,
      floors
    } = req.body;
    
    let computedTotalUnits = Number(totalUnits) || 1;
    if (['residential', 'commercial'].includes(propertyType)) {
        computedTotalUnits = 1;
    }

    const property = await prisma.property.create({
      data: {
        ownerId: req.user.id,
        name,
        address,
        city,
        state,
        pincode,
        propertyType,
        totalUnits: computedTotalUnits,
        amenities: amenities || [],
        plotAreaSqft: plotAreaSqft !== undefined && plotAreaSqft !== '' ? Number(plotAreaSqft) : null,
        builtUpAreaSqft: builtUpAreaSqft !== undefined && builtUpAreaSqft !== '' ? Number(builtUpAreaSqft) : null,
        lengthFt: lengthFt !== undefined && lengthFt !== '' ? Number(lengthFt) : null,
        widthFt: widthFt !== undefined && widthFt !== '' ? Number(widthFt) : null,
        floors: floors !== undefined && floors !== '' ? Number(floors) : null,
        coverImageUrl: coverImageUrl || null
      }
    });

    // Auto-spawn units
    const unitsToCreate = [];
    for (let i = 1; i <= computedTotalUnits; i++) {
        unitsToCreate.push({
            propertyId: property.id,
            unitNumber: computedTotalUnits === 1 ? 'Main Unit' : `Unit-${i}`,
            floor: 1,
            rentAmount: 0,
            depositAmount: 0,
            status: 'vacant'
        });
    }

    await prisma.unit.createMany({
        data: unitsToCreate
    });
    
    return success(res, property, 'Property and Units created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First confirm ownership
    const existing = await prisma.property.findFirst({ where: { id, ownerId: req.user.id } });
    if (!existing) return error(res, 'Property not found or unauthorized', 404);
    
    const {
      plotAreaSqft,
      builtUpAreaSqft,
      lengthFt,
      widthFt,
      floors,
      ...rest
    } = req.body || {};

    const property = await prisma.property.update({
      where: { id },
      data: {
        ...rest,
        plotAreaSqft: plotAreaSqft !== undefined ? (plotAreaSqft === '' ? null : Number(plotAreaSqft)) : undefined,
        builtUpAreaSqft: builtUpAreaSqft !== undefined ? (builtUpAreaSqft === '' ? null : Number(builtUpAreaSqft)) : undefined,
        lengthFt: lengthFt !== undefined ? (lengthFt === '' ? null : Number(lengthFt)) : undefined,
        widthFt: widthFt !== undefined ? (widthFt === '' ? null : Number(widthFt)) : undefined,
        floors: floors !== undefined ? (floors === '' ? null : Number(floors)) : undefined
      }
    });
    
    return success(res, property, 'Property updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listAmenityItems = async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const ownerId = req.user.id;

    const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId } });
    if (!property) return error(res, 'Property not found', 404);

    const items = await prisma.amenityItem.findMany({
      where: { propertyId, ownerId },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, items);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.addAmenityItem = async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const ownerId = req.user.id;
    const { name, price, billing, unitId } = req.body;

    const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId } });
    if (!property) return error(res, 'Property not found', 404);

    if (!name || !String(name).trim()) return error(res, 'Amenity name is required', 400);

    const created = await prisma.amenityItem.create({
      data: {
        propertyId,
        ownerId,
        unitId: unitId || null,
        name: String(name).trim(),
        price: Number(price || 0),
        billing: billing === 'one_time' ? 'one_time' : 'monthly'
      }
    });

    // Mirror into expenses so it shows in expense reporting/dashboard
    await prisma.expense.create({
      data: {
        propertyId,
        unitId: unitId || null,
        ownerId,
        category: 'amenities',
        amount: Number(price || 0),
        date: new Date(),
        description: `Amenity: ${String(name).trim()} (${created.billing})`
      }
    });

    return success(res, created, 'Amenity added', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.removeAmenityItem = async (req, res) => {
  try {
    const { id: propertyId, amenityId } = req.params;
    const ownerId = req.user.id;

    const item = await prisma.amenityItem.findFirst({ where: { id: amenityId, propertyId, ownerId } });
    if (!item) return error(res, 'Amenity not found', 404);

    await prisma.amenityItem.delete({ where: { id: amenityId } });
    return success(res, null, 'Amenity removed');
  } catch (err) {
    return error(res, err.message);
  }
};

const deletePropertyData = async (propertyId) => {
  const units = await prisma.unit.findMany({ where: { propertyId } });
  const unitIds = units.map(u => u.id);
  const tenancies = await prisma.tenancy.findMany({ where: { unitId: { in: unitIds } } });
  const tenancyIds = tenancies.map(t => t.id);

  await prisma.maintenanceTicket.deleteMany({ where: { unitId: { in: unitIds } } });
  await prisma.inspection.deleteMany({ where: { OR: [ { unitId: { in: unitIds } }, { tenancyId: { in: tenancyIds } } ] } });
  await prisma.message.deleteMany({ where: { tenancyId: { in: tenancyIds } } });
  await prisma.payment.deleteMany({ where: { tenancyId: { in: tenancyIds } } });
  await prisma.tenancy.deleteMany({ where: { id: { in: tenancyIds } } });
  await prisma.expense.deleteMany({ where: { propertyId } });
  await prisma.maintenanceInsight.deleteMany({ where: { propertyId } });
  await prisma.unit.deleteMany({ where: { propertyId } });
  await prisma.property.delete({ where: { id: propertyId } });
};

exports.deletePropertyData = deletePropertyData;

exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.property.findFirst({ where: { id, ownerId: req.user.id } });
    if (!existing) return error(res, 'Property not found or unauthorized', 404);
    
    await deletePropertyData(id);
    
    return success(res, null, 'Property deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
