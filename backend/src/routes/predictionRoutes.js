const express = require('express');
const {
  predictForEmployee,
  getPredictionHistory,
  batchPredictAll,
} = require('../controllers/predictionController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/predict/:employeeId', predictForEmployee);
router.get('/history/:employeeId', getPredictionHistory);
router.post('/batch-predict', requireRoles('ADMIN', 'HR_MANAGER'), batchPredictAll);

module.exports = router;
