const express = require('express');
const router = express.Router();
const AutomationRequest = require('../models/requestModel');
const { authenticate } = require('../middleware/authMiddleware');
const winston = require('winston');
const { sendMail } = require('../config/mailer');


// Logger Configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => 
            `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

// Submit Automation Request
router.post('/create-request', authenticate, async (req, res) => {
    try {
        const { direction, title, description } = req.body;

        if (!direction || !title || !description) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        const newRequest = new AutomationRequest({
            direction,
            title,
            description,
            user: req.user.id  // Save the user who made the request
        });

        await newRequest.save();

// 📌 Create a Styled HTML Email Template
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #e63946; text-align: center;">🚀 New Automation Request</h2>
        
        <p style="font-size: 16px; color: #333;"><strong>Direction:</strong> ${direction}</p>
        <p style="font-size: 16px; color: #333;"><strong>Title:</strong> ${title}</p>
        <p style="font-size: 16px; color: #333;"><strong>Description:</strong> ${description}</p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="mailto:it.administration@gmail.com" style="background: #e63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">📩 Review Request</a>
        </div>

        <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
        <p style="text-align: center; font-size: 14px; color: #666;">This is an automated email. Please do not reply.</p>
      </div>
    `;

    // Send the email with HTML content
    await sendMail('sami.tfifha@gmail.com', '📌 New Automation Request Submitted', emailHTML);

        res.status(201).json({
            msg: 'Automation request submitted successfully',
            request: newRequest
        });

        logger.info(`Automation request submitted by user: ${req.user.id}, title: ${title}`);

    } catch (err) {
        logger.error('Error submitting automation request:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/requests/:id', async (req, res) => {
    try {
      const request = await AutomationRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      res.json(request);
    } catch (error) {
      console.error('Error fetching automation request:', error);
      res.status(500).json({ error: 'Failed to fetch automation request' });
    }
  });
  
  /**
   * @route GET /requests
   * @desc Get all automation requests
   */
  router.get('/requests', async (req, res) => {
    try {
        const requests = await AutomationRequest.find().sort({ createdAt: -1 });
        res.json(requests);
      } catch (error) {
        console.error('Error fetching automation requests:', error);
        res.status(500).json({ error: 'Failed to fetch automation requests' });
      }
    });
  router.get('/myrequests', authenticate, async (req, res) => {
    try {
      const userId = req.user.id; // Get user ID from the token
      const myRequests = await AutomationRequest.find({ userId }).sort({ createdAt: -1 });
  
      res.json(myRequests);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

module.exports = router;
