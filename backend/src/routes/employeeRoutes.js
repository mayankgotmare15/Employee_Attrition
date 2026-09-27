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
  getSampleCSV,
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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const isCsvName = (file.originalname || '').toLowerCase().endsWith('.csv');
    const isCsvMime = (file.mimetype || '').includes('csv') || 
                      (file.mimetype || '').includes('excel') || 
                      (file.mimetype || '').includes('text') ||
                      file.mimetype === 'application/octet-stream';
    if (isCsvName || isCsvMime) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are supported.'));
    }
  },
});

// Download sample CSV template (accessible without token or with token)
router.get('/sample-csv', getSampleCSV);

router.use(authenticateToken);

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', requireRoles('ADMIN', 'HR_MANAGER', 'HR_ANALYST'), createEmployee);
router.put('/:id', requireRoles('ADMIN', 'HR_MANAGER', 'HR_ANALYST'), updateEmployee);
router.delete('/:id', requireRoles('ADMIN', 'HR_MANAGER'), deleteEmployee);
router.post('/upload-csv', requireRoles('ADMIN', 'HR_MANAGER', 'HR_ANALYST'), upload.single('file'), uploadCSV);


module.exports = router;
