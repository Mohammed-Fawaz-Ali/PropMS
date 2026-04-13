const express = require('express');
const router = express.Router();
const { getRentSuggestion, getMarketPricingTrend, getTenantRiskScore, getMaintenanceInsights } = require('../controllers/ai.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const rateLimit = require('express-rate-limit');

// Additional rate limiting for these routes
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 AI calls per hour per IP
  message: { success: false, message: 'Too many insight requests. Please wait before trying again.' }
});

// All insight routes require owner authentication
router.post('/rent-suggestion', authenticate, authorize('owner'), aiRateLimit, getRentSuggestion);
router.post('/market-pricing', authenticate, authorize('owner'), aiRateLimit, getMarketPricingTrend);
router.post('/tenant-risk', authenticate, authorize('owner'), aiRateLimit, getTenantRiskScore);
router.post('/maintenance-insights', authenticate, authorize('owner'), aiRateLimit, getMaintenanceInsights);

module.exports = router;
