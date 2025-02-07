const User = require('../models/userModel');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const winston = require('winston');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/authMiddleware');


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

// Login Route
router.post('/login', async (req, res) => {
 try {
        const { email, password } = req.body;
        const bcrypt = require("bcryptjs");

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.post('/create-user', authenticate, isAdmin, async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if ( !email || !password || !role) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({  email, password: hashedPassword, role });

        await newUser.save();
        res.status(201).json({ msg: 'User created successfully', user: { email, role } });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get Current User Route (Authenticated User)
router.get('/me', authenticate, async (req, res) => {
    try {
        // The authenticate middleware will set the user id in req.user
        const user = await User.findById(req.user.id).select('-password'); // Exclude the password field
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Return user details without password
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
});
module.exports = router;