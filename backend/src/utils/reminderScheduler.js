const cron = require('node-cron');
const { Op } = require('sequelize');
const Reminder = require('../models/Reminder');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEventReminderEmail } = require('../utils/emailTemplates');

// Schedule reminders every minute
const scheduleReminders = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            const reminders = await Reminder.findAll({
                where: {
                    status: 'pending',
                    scheduledFor: { [Op.lte]: now }
                },
                include: [
                    { model: User, as: 'user' },
                    { model: Event, as: 'event' }
                ]
            });

            for (const reminder of reminders) {
                try {
                    await sendEventReminderEmail(
                        reminder.user,
                        reminder.event,
                        reminder.reminderType === '24h-before' ? 'in 24 hours' :
                        reminder.reminderType === '1h-before' ? 'in 1 hour' : 'today'
                    );

                    reminder.status = 'sent';
                    reminder.sentAt = new Date();
                    await reminder.save();
                } catch (error) {
                    console.error(`Failed to send reminder ${reminder.id}:`, error);
                    reminder.status = 'failed';
                    await reminder.save();
                }
            }
        } catch (error) {
            console.error('Error in reminder scheduler:', error);
        }
    });

    console.log('✅ Reminder scheduler initialized');
};

// Create reminders for registered users (Sequelize)
const createRemindersForEvent = async (eventId) => {
    try {
        const event = await Event.findByPk(eventId);
        if (!event) return;

        const registrations = await Registration.findAll({
            where: { eventId, status: 'registered' },
            include: [{ model: User, as: 'user' }]
        });

        const eventDate = new Date(event.date);

        const scheduleMap = [
            { type: '24h-before', time: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000) },
            { type: '1h-before', time: new Date(eventDate.getTime() - 60 * 60 * 1000) },
            { type: 'day-of', time: new Date(eventDate.getTime() - 15 * 60 * 1000) } // 15 minutes prior
        ];

        for (const registration of registrations) {
            for (const reminder of scheduleMap) {
                const [entry] = await Reminder.findOrCreate({
                    where: {
                        userId: registration.userId,
                        eventId,
                        reminderType: reminder.type
                    },
                    defaults: {
                        scheduledFor: reminder.time,
                        status: 'pending',
                        method: 'email'
                    }
                });

                if (entry && entry.status === 'failed' && entry.scheduledFor <= new Date()) {
                    entry.status = 'pending';
                    await entry.save();
                }
            }
        }
    } catch (error) {
        console.error('Error creating reminders for event:', error);
    }
};

module.exports = { scheduleReminders, createRemindersForEvent };
