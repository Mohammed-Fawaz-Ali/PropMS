const prisma = require('../prisma');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/ai/rent-suggestion
 * Body: { unitId }
 * Returns: { minRent, recommendedRent, maxRent, reasoning, factors }
 */
const getRentSuggestion = async (req, res) => {
  try {
    const { unitId } = req.body;

    // Fetch unit with property details
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true }
    });

    if (!unit) return error(res, 'Unit not found', 404);

    // Prefer active tenancy rent if the unit is assigned
    const activeTenancy = await prisma.tenancy.findFirst({
      where: { unitId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: { monthlyRent: true, depositPaid: true }
    });

    // Fetch comparable occupied units in same city to give Gemini real context
    const comparableUnits = await prisma.unit.findMany({
      where: {
        property: { city: unit.property.city },
        status: 'occupied',
        bedrooms: unit.bedrooms,
        id: { not: unitId }
      },
      select: {
        rentAmount: true,
        areaSqft: true,
        furnishing: true,
        amenities: true,
        property: { select: { city: true, state: true, propertyType: true } }
      },
      take: 10
    });

    const roundTo = (n, step = 100) => Math.round(n / step) * step;

    const cityName = String(unit.property.city || '').trim().toLowerCase();
    const tier1 = new Set([
      'mumbai',
      'delhi',
      'new delhi',
      'bengaluru',
      'bangalore',
      'hyderabad',
      'chennai',
      'pune',
      'kolkata',
      'gurgaon',
      'noida'
    ]);
    const tier2 = new Set([
      'ahmedabad',
      'jaipur',
      'lucknow',
      'indore',
      'kochi',
      'coimbatore',
      'surat',
      'nagpur',
      'bhopal',
      'visakhapatnam'
    ]);

    const getCityTier = () => {
      if (tier1.has(cityName)) return 1;
      if (tier2.has(cityName)) return 2;
      return 3;
    };

    const estimateBaseRent = () => {
      const tier = getCityTier();
      const bedrooms = Number(unit.bedrooms) || 1;
      const area = unit.areaSqft ? Number(unit.areaSqft) : null;

      // INR per sqft per month (very rough baseline)
      const perSqft = tier === 1 ? 110 : tier === 2 ? 75 : 45;
      let base = area && area > 0 ? area * perSqft : 0;

      // If area isn't provided, use a bedroom-based baseline
      if (!base) {
        const bhkBase =
          tier === 1
            ? { 1: 18000, 2: 28000, 3: 42000, 4: 65000 }
            : tier === 2
              ? { 1: 12000, 2: 20000, 3: 30000, 4: 45000 }
              : { 1: 8000, 2: 14000, 3: 22000, 4: 32000 };
        base = bhkBase[Math.min(4, Math.max(1, bedrooms))] || 12000;
      }

      // Furnishing adjustment
      const furnishing = String(unit.furnishing || 'unfurnished').toLowerCase();
      const furnishingMult =
        furnishing === 'fully' ? 1.1 : furnishing === 'semi' ? 1.0 : 0.95;
      base *= furnishingMult;

      // Amenities adjustment: up to +10%
      const amenityCount = Array.isArray(unit.amenities) ? unit.amenities.length : 0;
      const amenityMult = 1 + Math.min(0.1, amenityCount * 0.01);
      base *= amenityMult;

      return roundTo(Math.max(5000, base), 100);
    };

    // Prefer tenancy rent -> unit rent -> comparables -> baseline
    const currentRent = Number(activeTenancy?.monthlyRent ?? unit.rentAmount) || 0;

    const rents = comparableUnits
      .map(u => Number(u.rentAmount))
      .filter(n => Number.isFinite(n) && n > 0);

    let recommendedRent;
    if (rents.length) {
      const avg = rents.reduce((sum, n) => sum + n, 0) / rents.length;
      // Blend comparable average with current rent (if present) to avoid wild swings
      recommendedRent = roundTo(currentRent > 0 ? avg * 0.7 + currentRent * 0.3 : avg, 100);
    } else if (currentRent > 0) {
      recommendedRent = roundTo(currentRent, 100);
    } else {
      recommendedRent = estimateBaseRent();
    }

    const minRent = roundTo(recommendedRent * 0.9, 100);
    const maxRent = roundTo(recommendedRent * 1.1, 100);

    let marketPosition = 'at_market';
    if (currentRent && recommendedRent) {
      const diffPct = ((currentRent - recommendedRent) / recommendedRent) * 100;
      if (diffPct <= -10) marketPosition = 'below_market';
      else if (diffPct >= 10) marketPosition = 'above_market';
    }

    const reasoningParts = [];
    if (rents.length) {
      reasoningParts.push(
        `Based on ${rents.length} similar occupied unit${rents.length > 1 ? 's' : ''} in ${unit.property.city}.`
      );
    } else if (currentRent > 0) {
      reasoningParts.push('No comparable units found; using the unit/lease rent you have already set.');
    } else {
      reasoningParts.push('No comparable units and no rent set yet; using a city-tier + BHK/area baseline estimate.');
    }
    if (unit.areaSqft) reasoningParts.push(`Area: ${unit.areaSqft} sqft.`);
    reasoningParts.push(`Furnishing: ${unit.furnishing}.`);

    const aiResult = {
      minRent,
      recommendedRent,
      maxRent,
      marketPosition,
      reasoning: reasoningParts.join(' '),
      factors: [
        `Location: ${unit.property.city}, ${unit.property.state}`,
        `Bedrooms: ${unit.bedrooms}, Bathrooms: ${unit.bathrooms}`,
        `Furnishing: ${unit.furnishing}`,
      ],
      tip:
        'For higher rent, keep the unit freshly painted, fix minor issues proactively, and add high-demand amenities (e.g., RO/water purifier provision, inverter backup, reliable internet).',
    };

    return success(res, aiResult, 'Rent suggestion generated (rule-based, no external AI)');

  } catch (err) {
    console.error('Rent suggestion error:', err);
    return error(res, 'Failed to generate rent suggestion', 500);
  }
};

/**
 * POST /api/ai/market-pricing
 * Body: { propertyId }
 * Returns current market pricing trend for the property area and type
 */
const getMarketPricingTrend = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: req.user.id },
      include: { units: true }
    });

    if (!property) return error(res, 'Property not found', 404);

    const city = property.city || '';
    const state = property.state || '';
    const residenceType = property.propertyType || '';

    const comparableUnits = await prisma.unit.findMany({
      where: {
        property: {
          city,
          state,
          propertyType: residenceType
        },
        status: 'occupied',
        propertyId: { not: propertyId }
      },
      select: {
        rentAmount: true,
        areaSqft: true,
        bedrooms: true,
        bathrooms: true,
        furnishing: true,
        unitNumber: true,
        property: { select: { city: true, state: true, propertyType: true } }
      },
      take: 10
    });

    const currentAvgRent = property.units?.length
      ? Math.round(property.units.reduce((sum, unit) => sum + Number(unit.rentAmount), 0) / property.units.length)
      : null;

    // Rule-based market trend using property vs comparable averages (no external AI)
    const comparableRents = comparableUnits
      .map(u => Number(u.rentAmount))
      .filter(n => Number.isFinite(n) && n > 0);

    let marketAvg = null;
    if (comparableRents.length) {
      marketAvg = Math.round(
        comparableRents.reduce((sum, n) => sum + n, 0) / comparableRents.length
      );
    }

    let marketTrend = 'stable';
    let suggestedMarketRange = 'N/A';

    if (marketAvg) {
      const low = Math.round(marketAvg * 0.95);
      const high = Math.round(marketAvg * 1.05);
      suggestedMarketRange = `₹${low} - ₹${high}`;

      if (currentAvgRent && currentAvgRent > high) marketTrend = 'falling';
      else if (currentAvgRent && currentAvgRent < low) marketTrend = 'rising';
      else marketTrend = 'stable';
    }

    const headline =
      !marketAvg || !currentAvgRent
        ? 'Limited local data – using basic averages'
        : `Rents in ${city} look ${marketTrend} compared to similar properties`;

    const marketSummaryParts = [];
    if (marketAvg && currentAvgRent) {
      const diffPct = Math.round(((currentAvgRent - marketAvg) / marketAvg) * 100);
      if (Math.abs(diffPct) <= 5) {
        marketSummaryParts.push('Your average rent is roughly in line with nearby occupied units.');
      } else if (diffPct > 5) {
        marketSummaryParts.push(
          `Your average rent is about ${diffPct}% higher than comparable occupied units.`
        );
      } else {
        marketSummaryParts.push(
          `Your average rent is about ${Math.abs(diffPct)}% lower than comparable occupied units.`
        );
      }
    } else {
      marketSummaryParts.push(
        'There is not enough comparable data yet; values are based only on the property itself.'
      );
    }

    const aiResult = {
      headline,
      marketTrend,
      currentAverageRent: currentAvgRent,
      suggestedMarketRange,
      residenceType,
      marketSummary: marketSummaryParts.join(' '),
      recommendedAction:
        marketTrend === 'rising'
          ? 'Review expiring leases and consider a moderate increase for units that are far below the suggested range.'
          : marketTrend === 'falling'
          ? 'For upcoming vacancies, price closer to the lower end of the suggested range to reduce days vacant.'
          : 'Keep monitoring occupancy and renewals; adjust rent gradually instead of sharp jumps.',
    };

    return success(res, aiResult, 'Market pricing trend generated (rule-based, no external AI)');

  } catch (err) {
    console.error('Market pricing error:', err);
    return error(res, 'Failed to generate market pricing trend', 500);
  }
};

/**
 * POST /api/ai/tenant-risk
 * Body: { tenantId, unitId }
 * Returns risk score object
 */
const getTenantRiskScore = async (req, res) => {
  try {
    const { tenantId, unitId } = req.body;

    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        tenancies: {
          include: {
            payments: true,
            unit: { include: { property: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true }
    });

    if (!tenant || !unit) return error(res, 'Tenant or unit not found', 404);

    // Calculate payment history stats
    const allPayments = tenant.tenancies.flatMap(t => t.payments);
    const totalPayments = allPayments.length;
    const paidOnTime = allPayments.filter(p => p.status === 'paid' && p.paidDate && p.dueDate && new Date(p.paidDate) <= new Date(p.dueDate)).length;
    const overduePayments = allPayments.filter(p => p.status === 'overdue').length;
    const onTimeRate = totalPayments > 0 ? Math.round((paidOnTime / totalPayments) * 100) : null;

    // Income to rent ratio
    const incomeToRentRatio = tenant.monthlyIncome
      ? (Number(tenant.monthlyIncome) / Number(unit.rentAmount)).toFixed(2)
      : null;

    // Simple risk scoring model based on income ratio and payment history (no external AI)
    let score = 70; // baseline
    const breakdown = {
      incomeRatio: { score: 0, maxScore: 25, comment: '' },
      paymentHistory: { score: 0, maxScore: 30, comment: '' },
      employmentStability: { score: 0, maxScore: 25, comment: '' },
      profileCompleteness: { score: 0, maxScore: 20, comment: '' }
    };

    // Income ratio
    if (incomeToRentRatio) {
      const ratio = Number(incomeToRentRatio);
      if (ratio >= 3) {
        breakdown.incomeRatio.score = 23;
        breakdown.incomeRatio.comment = 'Income is at least 3x the rent, which is ideal.';
        score += 10;
      } else if (ratio >= 2) {
        breakdown.incomeRatio.score = 17;
        breakdown.incomeRatio.comment = 'Income is between 2x and 3x the rent, acceptable for many owners.';
      } else if (ratio >= 1) {
        breakdown.incomeRatio.score = 10;
        breakdown.incomeRatio.comment = 'Income is close to the rent; consider a stronger deposit.';
        score -= 5;
      } else {
        breakdown.incomeRatio.score = 5;
        breakdown.incomeRatio.comment = 'Income appears lower than the rent amount.';
        score -= 15;
      }
    } else {
      breakdown.incomeRatio.score = 8;
      breakdown.incomeRatio.comment = 'Income not provided; using conservative default.';
      score -= 5;
    }

    // Payment history
    if (totalPayments === 0) {
      breakdown.paymentHistory.score = 15;
      breakdown.paymentHistory.comment = 'No payment history on this platform yet.';
    } else {
      const overdueRate = overduePayments / totalPayments;
      if (overdueRate === 0) {
        breakdown.paymentHistory.score = 28;
        breakdown.paymentHistory.comment = 'All payments recorded were on time.';
        score += 10;
      } else if (overdueRate <= 0.2) {
        breakdown.paymentHistory.score = 20;
        breakdown.paymentHistory.comment = 'Mostly on-time payments with a few delays.';
      } else {
        breakdown.paymentHistory.score = 10;
        breakdown.paymentHistory.comment = 'Significant overdue history; monitor closely.';
        score -= 15;
      }
    }

    // Employment stability
    if (tenant.employmentType) {
      const type = String(tenant.employmentType).toLowerCase();
      if (type.includes('full')) {
        breakdown.employmentStability.score = 22;
        breakdown.employmentStability.comment = 'Full-time employment suggests stable income.';
        score += 5;
      } else if (type.includes('self') || type.includes('business')) {
        breakdown.employmentStability.score = 17;
        breakdown.employmentStability.comment =
          'Self-employed; ask for extra documentation or deposit if needed.';
      } else {
        breakdown.employmentStability.score = 15;
        breakdown.employmentStability.comment = 'Employment type provided but not clearly full-time.';
      }
    } else {
      breakdown.employmentStability.score = 10;
      breakdown.employmentStability.comment =
        'Employment details missing; treat as medium risk until verified.';
      score -= 5;
    }

    // Profile completeness
    let completenessScore = 10;
    const completenessComments = [];
    if (tenant.referenceContact) {
      completenessScore += 5;
      completenessComments.push('Reference contact available.');
    }
    if (tenant.employerName) {
      completenessScore += 3;
      completenessComments.push('Employer details filled.');
    }
    breakdown.profileCompleteness.score = completenessScore;
    breakdown.profileCompleteness.comment = completenessComments.join(' ') || 'Basic profile present.';

    // Clamp and classify
    score = Math.max(1, Math.min(100, score));

    let riskLevel = 'moderate';
    if (score >= 80) riskLevel = 'low';
    else if (score >= 60) riskLevel = 'moderate';
    else if (score >= 40) riskLevel = 'high';
    else riskLevel = 'very_high';

    let verdict;
    if (riskLevel === 'low') verdict = 'Strong overall profile; suitable tenant for standard terms.';
    else if (riskLevel === 'moderate')
      verdict = 'Acceptable profile; consider slightly higher deposit or clearer payment terms.';
    else if (riskLevel === 'high')
      verdict = 'High risk profile; proceed only with strong safeguards like higher deposit and strict due dates.';
    else
      verdict =
        'Very high risk profile; not recommended unless there are exceptional compensating factors.';

    const redFlags = [];
    const greenFlags = [];

    if (!incomeToRentRatio) redFlags.push('Income not declared in the application.');
    else if (Number(incomeToRentRatio) < 2) redFlags.push('Income appears low relative to the monthly rent.');
    else greenFlags.push('Income is comfortably above the rent amount.');

    if (overduePayments > 0) redFlags.push('Has overdue payments in history on this platform.');
    else if (totalPayments > 0) greenFlags.push('Clean payment record on this platform so far.');

    if (tenant.referenceContact) greenFlags.push('Reference contact is provided.');

    const recommendations = [];
    if (riskLevel === 'low') {
      recommendations.push('Proceed with standard one-month security deposit and usual agreement terms.');
    } else if (riskLevel === 'moderate') {
      recommendations.push(
        'Ask for one to two months of security deposit and confirm employment details before approval.'
      );
    } else {
      recommendations.push(
        'If you accept this tenant, consider a higher deposit, post-dated cheques, or stricter payment clauses.'
      );
    }

    const aiResult = {
      score,
      riskLevel,
      verdict,
      scoreBreakdown: breakdown,
      redFlags,
      greenFlags,
      recommendations
    };

    return success(
      res,
      { ...aiResult, tenantId, unitId, generatedAt: new Date() },
      'Risk score generated (rule-based, no external AI)'
    );

  } catch (err) {
    console.error('Risk score error:', err);
    return error(res, 'Failed to generate risk score', 500);
  }
};

/**
 * POST /api/ai/maintenance-insights
 * Body: { propertyId }
 * Analyzes ticket history and predicts future issues
 */
const getMaintenanceInsights = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const ownerId = req.user.id;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId },
      include: {
        units: {
          include: {
            tickets: {
              orderBy: { createdAt: 'desc' },
              take: 50
            }
          }
        }
      }
    });

    if (!property) return error(res, 'Property not found', 404);

    // Build ticket summary
    const allTickets = property.units.flatMap(u =>
      u.tickets.map(t => ({
        unit: u.unitNumber,
        category: t.category,
        priority: t.priority,
        status: t.status,
        cost: t.cost ? Number(t.cost) : 0,
        createdAt: t.createdAt.toISOString().split('T')[0],
        resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString().split('T')[0] : null,
        title: t.title
      }))
    );

    const categoryCount = {};
    allTickets.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });

    const unitCount = {};
    allTickets.forEach(t => {
      unitCount[t.unit] = (unitCount[t.unit] || 0) + 1;
    });

    const currentMonth = new Date().getMonth() + 1;

    // Simple deterministic insights based on ticket counts (no external AI)
    const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
    const sortedUnits = Object.entries(unitCount).sort((a, b) => b[1] - a[1]);

    const totalTickets = allTickets.length;
    const overallHealthScore = Math.max(30, Math.min(95, 100 - totalTickets));

    const predictions = sortedCategories.slice(0, 5).map(([category, count], index) => {
      let probability = 'medium';
      if (count >= 10) probability = 'high';
      else if (count <= 2) probability = 'low';

      const affectedUnits = sortedUnits
        .filter(([, c]) => c > 0)
        .slice(0, 5)
        .map(([unit]) => unit);

      return {
        rank: index + 1,
        category,
        title: `More ${category} issues are likely in frequently affected units`,
        probability,
        expectedTimeframe: 'Next 60 days',
        affectedUnits,
        reasoning: `Category "${category}" has appeared ${count} time(s) in recent tickets.`,
        preventiveAction:
          'Schedule a quick inspection for the affected units and fix small issues before they turn into major repairs.',
        estimatedCostIfIgnored: 5000 * count,
        preventionCost: 1500 * Math.max(1, affectedUnits.length)
      };
    });

    const aiResult = {
      summary:
        totalTickets === 0
          ? 'No recent maintenance tickets recorded; overall condition looks healthy.'
          : `There have been ${totalTickets} maintenance tickets recently, mainly in ${sortedCategories
              .slice(0, 2)
              .map(([c]) => c)
              .join(' and ')}. Focus inspections on the units that generate the most tickets.`,
      overallHealthScore,
      predictions,
      highCostRisks:
        totalTickets === 0
          ? [
              'If routine inspections are skipped, small issues may not be logged and can become expensive later.'
            ]
          : [
              'Ignoring repeat issues in the same units will likely increase repair costs and tenant dissatisfaction.'
            ],
      seasonalAlert:
        currentMonth >= 6 && currentMonth <= 9
          ? 'Monsoon months often increase leakage and dampness complaints; check roofs and balconies early.'
          : null
    };

    const savedInsight = await prisma.maintenanceInsight.create({
      data: {
        propertyId,
        ownerId,
        insights: aiResult,
        summary: aiResult.summary,
        highRiskCount: aiResult.predictions?.filter(p => p.probability === 'high').length || 0
      }
    });

    return success(
      res,
      { ...aiResult, insightId: savedInsight.id },
      'Maintenance insights generated (rule-based, no external AI)'
    );

  } catch (err) {
    console.error('Maintenance insight error:', err);
    return error(res, 'Failed to generate maintenance insights', 500);
  }
};

module.exports = { getRentSuggestion, getMarketPricingTrend, getTenantRiskScore, getMaintenanceInsights };
