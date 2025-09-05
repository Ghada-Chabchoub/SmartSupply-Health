const express = require('express');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // <-- ADD STRIPE
const { auth } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  checkValidation 
} = require('../middleware/validation');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const authController = require('../controllers/authController');

const router = express.Router();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};


// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateRegister, checkValidation, async (req, res) => {
  try {
    const { role, email, name } = req.body;

    if (!['client', 'supplier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    let existingUser;
    if (role === 'client') {
      existingUser = await Client.findOne({ email });
    } else if (role === 'supplier') {
      existingUser = await Supplier.findOne({ email });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    let user;
    if (role === 'client') {
      // Create a Stripe customer for the new client
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        description: 'New client for SmartSupply-Health',
      });

      // Create a new client with the Stripe Customer ID
      user = new Client({
        ...req.body,
        stripeCustomerId: customer.id, // <-- SAVE THE STRIPE ID
      });

    } else if (role === 'supplier') {
      user = new Supplier(req.body);
    }

    await user.save();

    const token = generateToken(user._id, role);

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully', 
      data: { user, token } 
    });

  } catch (error) {
    console.error('Registration error:', error);
    // If there's a Stripe error, it will be caught here as well
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, checkValidation, async (req, res) => {
  const { email, password, role } = req.body;

  console.log('Login attempt:', email, role);

  if (!['client', 'supplier'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be either client or supplier' });
  }

  let user;
  if (role === 'client') {
    user = await Client.findOne({ email });
  } else if (role === 'supplier') {
    user = await Supplier.findOne({ email });
  }

  if (!user) {
    console.log('User not found');
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    console.log('Wrong password');
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    console.log('User inactive');
    return res.status(403).json({ success: false, message: 'User is inactive' });
  }

  const token = generateToken(user._id, role);
  console.log('Login successful for:', email);

// Dans votre route login, juste avant res.json()
console.log('Données envoyées au frontend:', { user: user.toObject(), token, role });
res.json({ success: true, message: 'Login successful', data: { user, token, role } });});



// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, clinicName, clinicType, address, companyName } = req.body;
    
    const updateData = { name, phone };

    if (req.role === 'client') {
      if (clinicName) updateData.clinicName = clinicName;
      if (clinicType) updateData.clinicType = clinicType;
      if (address) updateData.address = address;

      const updated = await Client.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      );

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updated }
      });

    } else if (req.role === 'supplier') {
      if (companyName) updateData.companyName = companyName;

      const updated = await Supplier.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      );

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updated }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid role' });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});


module.exports = router;