const { readJSON, writeJSON } = require('../utils/fileHandler');
const ServiceModel = require('../models/Service');
const TechnicianModel = require('../models/TechnicianRegister');
const pad = (num) => String(num).padStart(3, '0'); 

// GET - list of services that have been scheduled but not yet assigned.
exports.getUnassignedServices = async (req, res) => {
  try {
    const services = await ServiceModel.find({ status: 'Unassigned' }).lean();
    if (!services.length) {
      return res.status(400).json({ message: 'No Unassigned Services' });
    }
    res.status(200).json(services);
  } catch (err) {
    console.error('getUnassignedServices error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST - Creates an official task assignment for a scheduled service.
exports.createAssignment = async (req, res) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID is required.' });
    }

    // find service in DB
    const service = await ServiceModel.findById(serviceId);
    if (!service) return res.status(400).json({ message: 'Corresponding service schedule not found.' });

    // technician must already be set on the service by scheduling
    const techIdToUse = service.technicianId;
    if (!techIdToUse) return res.status(400).json({ message: 'No technician specified on this service. Provide technicianId when scheduling or call assignment with technicianId.' });
 
    // find technician in DB
    const tech = await TechnicianModel.findById(techIdToUse).lean();
    if (!tech) return res.status(400).json({ message: 'Technician not found' });

    // check required skill
    const requiredServiceType = service.serviceType;
    if (!requiredServiceType) return res.status(400).json({ message: 'Service record missing serviceType' });
    const hasSkill = Array.isArray(tech.skills) && tech.skills.some(s => String(s).toLowerCase() === String(requiredServiceType).toLowerCase());
    if (!hasSkill) return res.status(400).json({ message: 'Technician does not have the required skill for this service' });

    // check availability for today
    const weekdayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const todayDay = weekdayNames[new Date().getDay()];
    const availabilityArray = Array.isArray(tech.availability) ? tech.availability.map(d => String(d).toLowerCase()) : [String(tech.availability || '').toLowerCase()];
    if (!availabilityArray.includes(todayDay)) {
      return res.status(400).json({ message: `Technician is not available today (${todayDay})` });
    }

    // prevent double-booking: check Service collection for active assignment excluding the current service
    const busy = await ServiceModel.findOne({ technicianId: techIdToUse, status: { $ne: 'Completed' }, _id: { $ne: service._id } });
    if (busy) return res.status(400).json({ message: 'Technician already has an active assignment' });

    // set status to Assigned and assignmentDate
    service.status = 'Assigned';
    service.assignmentDate = new Date();
    await service.save();

    return res.status(200).json({ message: 'Service assigned', serviceId: service._id });
  } catch (err) {
    console.error('createAssignment error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// GET - list of all assignments (services with assignment info)
exports.getAllAssignments = async (req, res) => {
  try {
    const services = await ServiceModel.find({ status: { $in: ['Assigned','Work In Progress','Completed'] } }).populate('technicianId', 'firstName lastName').lean();
    res.status(200).json(services);
  } catch (err) {
    console.error('getAllAssignments error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH - Allows a technician to update the status of their task.
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const serviceId = req.params.id; // using Service._id
    const { status } = req.body;
    const technicianId = req.user && (req.user.id || req.user._id);

    if (!status) return res.status(400).json({ message: 'status is required' });

    const service = await ServiceModel.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // ensure requester is assigned technician
    if (!service.technicianId || String(service.technicianId) !== String(technicianId)) {
      return res.status(403).json({ message: 'You are not assigned to this service' });
    }

    service.status = status;
    if (String(status).toLowerCase() === 'completed') {
      service.technicianCompletedOn = new Date();
      service.completedOn = new Date();
    }

    await service.save();

    return res.status(200).json({ message: 'Assignment status updated', serviceId: service._id, status: service.status, technicianCompletedOn: service.technicianCompletedOn || null });
  } catch (err) {
    console.error('updateAssignmentStatus error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};