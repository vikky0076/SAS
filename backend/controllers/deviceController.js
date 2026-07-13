import DeviceRequest from '../models/DeviceRequest.js';
import Student from '../models/Student.js';

// @desc    Get all pending device approval requests
// @route   GET /api/device/requests
// @access  Private (Teacher, Admin)
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await DeviceRequest.find({ status: 'Pending' })
      .populate('student', 'name registerNumber email department year trustedDeviceToken')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve device change request
// @route   POST /api/device/approve/:requestId
// @access  Private (Teacher, Admin)
export const approveDeviceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await DeviceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status.toLowerCase()}` });
    }

    // Update Student trusted token
    const student = await Student.findById(request.student);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.trustedDeviceToken = request.newToken;
    student.deviceApproved = true;
    await student.save();

    // Mark request as Approved
    request.status = 'Approved';
    await request.save();

    // Clean up older approved/rejected requests for this student if desired, or keep history
    // For now we keep history but set state to Approved

    res.json({
      success: true,
      message: `Device request for ${student.name} approved. Token updated successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject device change request
// @route   POST /api/device/reject/:requestId
// @access  Private (Teacher, Admin)
export const rejectDeviceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await DeviceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status.toLowerCase()}` });
    }

    request.status = 'Rejected';
    await request.save();

    res.json({
      success: true,
      message: 'Device request rejected successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
