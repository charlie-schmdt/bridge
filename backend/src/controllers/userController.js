const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const oauthLogin = async (req, res) => {
  try {
    const { email, name, picture, provider, providerId } = req.body;

    console.log('🔍 OAuth login attempt:', { email, provider });

    if (!email || !provider || !providerId) {
      return res.status(400).json({
        success: false,
        message: 'Email, provider, and providerId are required'
      });
    }

    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (user) {
      const updates = {
        lastLogin: new Date(),
        picture: picture || user.picture
      };

      if (user.provider === 'local') {
        updates.provider = 'both';
      } else if (user.provider !== provider && user.provider !== 'both') {
        updates.provider = 'both';
      }

      await user.update(updates);
      console.log('Existing user logged in via OAuth:', user.email);
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        password: null,
        name: name || email.split('@')[0],
        picture,
        provider,
        providerId,
        isVerified: true, 
        lastLogin: new Date()
      });
      console.log('New OAuth user created:', user.email);
    }

    const token = generateToken(user.id);

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
      isVerified: user.isVerified,
      onboarding_completed: user.onboarding_completed,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'OAuth login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during OAuth login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const generateToken = (userId) => {
  // return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15d' });
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getSettings = async (req, res) => {
  try {
    console.log('Get settings request received');
    console.log('Query params:', req.query);
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const settings = {
      profile: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        timezone: user.timezone,
        picture: user.picture
      },
      notifications: {
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        meetingReminders: user.meetingReminders,
        weeklyDigest: user.weeklyDigest,
      },
      privacy: {
        profileVisibility: user.profileVisibility,
        showOnlineStatus: user.showOnlineStatus,
        allowDirectMessages: user.allowDirectMessages,
      },
      appearance: {
        theme: user.theme,
      }
    };

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    console.log('Updating settings...', req.body);
    const { userId } = req.body;
    const updates = req.body;
    
    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    console.log('Found userId:', userId);

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create an object to hold all updates
    const updateData = {};

    // Update profile settings
    if (updates.profile) {
      if (updates.profile.name) updateData.name = updates.profile.name;
      if (updates.profile.email) updateData.email = updates.profile.email;
      if (updates.profile.bio !== undefined) updateData.bio = updates.profile.bio;
      if (updates.profile.timezone) updateData.timezone = updates.profile.timezone;
      if (updates.profile.picture) updateData.picture = updates.profile.picture;
    }
    
    // Update notification settings
    if (updates.notifications) {
      if (updates.notifications.emailNotifications !== undefined) {
        updateData.emailNotifications = updates.notifications.emailNotifications;
      }
      if (updates.notifications.pushNotifications !== undefined) {
        updateData.pushNotifications = updates.notifications.pushNotifications;
      }
      if (updates.notifications.meetingReminders !== undefined) {
        updateData.meetingReminders = updates.notifications.meetingReminders;
      }
      if (updates.notifications.weeklyDigest !== undefined) {
        updateData.weeklyDigest = updates.notifications.weeklyDigest;
      }
    }
    
    // Update privacy settings
    if (updates.privacy) {
      if (updates.privacy.profileVisibility) {
        updateData.profileVisibility = updates.privacy.profileVisibility;
      }
      if (updates.privacy.showOnlineStatus !== undefined) {
        updateData.showOnlineStatus = updates.privacy.showOnlineStatus;
      }
      if (updates.privacy.allowDirectMessages !== undefined) {
        updateData.allowDirectMessages = updates.privacy.allowDirectMessages;
      }
    }
    
    // Update appearance settings
    if (updates.appearance && updates.appearance.theme) {
      updateData.theme = updates.appearance.theme;
    }

    // Apply all updates at once
    await user.update(updateData);

    // Get fresh user data for response
    const updatedUser = await User.findByPk(userId);
    const updatedSettings = {
      profile: {
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        timezone: updatedUser.timezone,
      },
      notifications: {
        emailNotifications: updatedUser.emailNotifications,
        pushNotifications: updatedUser.pushNotifications,
        meetingReminders: updatedUser.meetingReminders,
        weeklyDigest: updatedUser.weeklyDigest,
      },
      privacy: {
        profileVisibility: updatedUser.profileVisibility,
        showOnlineStatus: updatedUser.showOnlineStatus,
        allowDirectMessages: updatedUser.allowDirectMessages,
      },
      appearance: {
        theme: updatedUser.theme,
      }
    };

    return res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Error updating settings' });
  }
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
      onboarding_completed: user.onboarding_completed,
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
      onboarding_completed: user.onboarding_completed,
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

// Set onboarding completion flag for the authenticated user
const setOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    // req.user is set by authenticateToken middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized!!!!' });
    }

    // Ensure the token owner matches the id in the URL
    if (String(user.id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await user.update({ onboarding_completed: !!completed });

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
      isVerified: user.isVerified,
      onboarding_completed: user.onboarding_completed,
      createdAt: user.createdAt
    };

    res.json({ success: true, message: 'Onboarding updated', data: { user: userData } });
  } catch (error) {
    console.error('Set onboarding error:', error);
    res.status(500).json({ success: false, message: 'Error updating onboarding' });
  }
};

// Public: get a user's public profile by id
const getUserById = async (req, res) => {
  try {
  const { id } = req.params;
  console.log('getUserById: requested id =', id);
    const authHeader = req.headers['authorization'];
    let requesterId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requesterId = decoded.userId;
      } catch (e) {
        // ignore token errors; treat as anonymous
        requesterId = null;
      }
    }

    let target = await User.findByPk(id);
    if (!target) {
      // fallback: try a findOne by id cast to string (some DBs/ORMS have subtle typing differences)
      console.log('getUserById: primary lookup failed, attempting fallback findOne by id string');
      target = await User.findOne({ where: { id: String(id) } });
    }

    if (!target) {
      console.log('getUserById: user not found for id=', id);
      return res.status(404).json({ success: false, message: `User not found for id ${id}` });
    }
    console.log('getUserById: found user id=', target.id);

    const isOwner = requesterId && String(requesterId) === String(target.id);
    const visibility = target.profileVisibility || 'team';

    // Build response with limited fields based on visibility
    const response = {
      id: target.id,
      name: target.name,
      picture: target.picture,
      bio: target.bio,
      timezone: target.timezone,
      createdAt: target.createdAt,
      profileVisibility: visibility,
      onboarding_completed: !!target.onboarding_completed
    };

    if (visibility !== 'private' || isOwner) {
      response.email = target.email;
    }

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
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

const deleteAccount = async (req, res) => {
  try {
    const { password, reauthToken } = req.body;
    const user = req.user; // From authentication middleware

    console.log('🔍 Account deletion request for user:', user.email);
    console.log('🔍 User provider:', user.provider);

    if (user.provider === 'local' || user.provider === 'both') {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password required for account deletion'
        });
      }

      // Verify password matches
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password. Account deletion cancelled.'
        });
      }
    } else if (user.provider === 'google') {
      console.log('OAuth user account deletion - no additional auth required');
    }

    await user.destroy();

    console.log('✅ Account successfully deleted for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createUser,
  loginUser,
  logoutUser,
  getSettings,
  updateSettings,
  oauthLogin,
  setOnboarding,
  getUserById,
  deleteAccount,
  getUsers
};