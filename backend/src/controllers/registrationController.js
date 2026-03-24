const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateTicketId } = require('../utils/tokenUtils');
const { generateQRCode } = require('../utils/qrCodeUtils');
const { sendEventRegistrationEmail } = require('../utils/emailTemplates');
const { createRemindersForEvent } = require('../utils/reminderScheduler');

// Register for event
exports.registerForEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        // Check if event exists
        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check capacity
        if (event.registeredCount >= event.capacity) {
            return res.status(400).json({
                success: false,
                message: 'Event is at full capacity'
            });
        }

        // Check if already registered
        const existing = await Registration.findOne({
            where: { userId: req.user.id, eventId }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Already registered for this event'
            });
        }

        // Create registration
        const ticketId = generateTicketId(eventId, req.user.id);
        const qrCode = await generateQRCode(ticketId);

        const registration = await Registration.create({
            userId: req.user.id,
            eventId,
            ticketId,
            qrCode,
            status: 'registered'
        });

        // Update event
        event.registeredCount += 1;
        await event.save();

        // Send confirmation email
        const user = await User.findByPk(req.user.id);
        try {
            await sendEventRegistrationEmail(user, event);
        } catch (error) {
            console.error('Failed to send registration email:', error);
        }

        // Schedule reminders for this event registration
        try {
            await createRemindersForEvent(eventId);
        } catch (error) {
            console.error('Failed to create reminders for event:', error);
        }

        res.status(201).json({
            success: true,
            message: 'Registered for event successfully',
            registration: {
                id: registration.id,
                ticketId: registration.ticketId,
                qrCode: registration.qrCode,
                status: registration.status
            }
        });
    } catch (error) {
        next(error);
    }
};

// Cancel registration
exports.cancelRegistration = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const { reason } = req.body;

        const registration = await Registration.findOne({
            where: { userId: req.user.id, eventId }
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        registration.status = 'cancelled';
        registration.cancelledAt = new Date();
        registration.cancelledReason = reason;
        await registration.save();

        // Update event
        const event = await Event.findByPk(eventId);
        event.registeredCount -= 1;
        await event.save();

        res.json({
            success: true,
            message: 'Registration cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get registration
exports.getRegistration = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        const registration = await Registration.findOne({
            where: { userId: req.user.id, eventId },
            include: [{
                association: 'event',
                model: Event,
                attributes: ['id', 'title', 'date', 'time', 'location']
            }]
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.json({
            success: true,
            registration
        });
    } catch (error) {
        next(error);
    }
};

// Get all registrations for event (staff/admin only)
exports.getEventRegistrations = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const { page = 1, limit = 50, status } = req.query;

        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check authorization
        if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let where = { eventId };
        if (status) where.status = status;

        const { count, rows: registrations } = await Registration.findAndCountAll({
            where,
            include: [{
                association: 'user',
                model: User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'studentId']
            }],
            offset,
            limit: limitNum,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: registrations.length,
            total: count,
            registrations
        });
    } catch (error) {
        next(error);
    }
};

// Check in attendee
exports.checkInAttendee = async (req, res, next) => {
    try {
        const { registrationId } = req.params;

        const registration = await Registration.findByPk(registrationId);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        if (registration.status === 'checked-in') {
            return res.status(400).json({
                success: false,
                message: 'Already checked in'
            });
        }

        registration.status = 'checked-in';
        registration.checkedInAt = new Date();
        registration.checkedInById = req.user.id;
        await registration.save();

        // Update event
        const event = await Event.findByPk(registration.eventId);
        event.attendedCount += 1;
        await event.save();

        res.json({
            success: true,
            message: 'Attendee checked in successfully'
        });
    } catch (error) {
        next(error);
    }
};
