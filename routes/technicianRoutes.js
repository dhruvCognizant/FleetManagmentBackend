const express = require('express');
const router = express.Router();
const {
    getUnassignedServices,
    createAssignment,
    getAllAssignments,
    updateAssignmentStatus
} = require('../controllers/technicianController');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/unassigned-services', getUnassignedServices);
 
router.get('/assignments', getAllAssignments);
 
router.post('/assignments', createAssignment);
 
router.patch('/assignments/:id/status',authorize(['technician']), updateAssignmentStatus);
 
module.exports = router;