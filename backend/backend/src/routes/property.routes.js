const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Protect all property routes - only owners can manage properties
router.use(authenticate, authorize('owner', 'admin'));

router.get('/', propertyController.getProperties);
router.post('/', propertyController.createProperty);
router.get('/:id', propertyController.getProperty);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

// Amenity items with prices (property-level, optional unitId)
router.get('/:id/amenity-items', propertyController.listAmenityItems);
router.post('/:id/amenity-items', propertyController.addAmenityItem);
router.delete('/:id/amenity-items/:amenityId', propertyController.removeAmenityItem);

module.exports = router;
