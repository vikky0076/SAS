import express from 'express';
import {
  getPendingRequests,
  approveDeviceRequest,
  rejectDeviceRequest
} from '../controllers/deviceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/requests', protect, authorize('teacher', 'admin'), getPendingRequests);
router.post('/approve/:requestId', protect, authorize('teacher', 'admin'), approveDeviceRequest);
router.post('/reject/:requestId', protect, authorize('teacher', 'admin'), rejectDeviceRequest);

export default router;
