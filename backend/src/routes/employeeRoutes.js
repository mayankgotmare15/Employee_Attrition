const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadCSV,
} = require('../controllers/employeeController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Multer storage configuration for temporary CSV uploads
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are supported.'));
    }
  },
});

router.use(authenticateToken);

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', requireRoles('ADMIN', 'HR_MANAGER', 'HR_ANALYST'), createEmployee);
router.put('/:id', requireRoles('ADMIN', 'HR_MANAGER', 'HR_ANALYST'), updateEmployee);
router.delete('/:id', requireRoles('ADMIN', 'HR_MANAGER'), deleteEmployee);
router.post('/upload-csv', requireRoles('ADMIN', 'HR_MANAGER', 'HR_ANALYST'), upload.single('file'), uploadCSV);

module.exports = router;
