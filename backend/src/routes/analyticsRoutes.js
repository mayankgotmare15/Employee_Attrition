const express = require('express');
const { getDashboardOverview } = require('../controllers/analyticsController');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const MLClient = require('../services/mlClient');

const router = express.Router();

router.use(authenticateToken);

router.get('/overview', getDashboardOverview);

router.get('/model-metrics', requireRoles('ADMIN', 'HR_MANAGER', 'HR_ANALYST'), async (req, res, next) => {
  try {
    const metrics = await MLClient.getMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
