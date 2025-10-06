const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least 1 letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least 1 special character (!@#$%^&*(),.?":{}|<>)');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }
  
  return errors;
};


const createUser = async (req, res) => {
  try {
    console.log('🔍 createUser called');
    console.log('🔍 User model:', typeof User);
    console.log('🔍 User.findOne:', typeof User.findOne);

    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet strength requirements',
        errors: passwordErrors
      });
    }

    console.log('🔍 About to call User.findOne...');
    
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    
    console.log('🔍 User.findOne completed');
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      provider: 'local'
    });

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    console.log(`✅ New user created: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.password) {
          return res.status(401).json({
        success: false,
        message: 'Please login with your OAuth provider'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id);

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('❌ Login user error:', error);
    console.error('❌ Error stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Error logging in user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    // In a simple JWT setup, we don't need to do much server-side
    // The client will remove the token from storage
    
    console.log('👋 User logout request received');
    
    // Optional: You could add token blacklisting here in the future
    // For now, we'll just confirm the logout
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};
module.exports = {
  createUser,
  loginUser,
  logoutUser
};