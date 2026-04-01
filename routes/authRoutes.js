const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../utils/db');

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone,
    country: user.country,
    createdAt: user.createdAt
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  try {
    const users = await readData('users.json');
    const {
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      country = '',
      password = ''
    } = req.body;

    const cleanUser = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      country: country.trim(),
      password: String(password)
    };

    if (!cleanUser.firstName || !cleanUser.lastName || !cleanUser.email || !cleanUser.phone || !cleanUser.country || !cleanUser.password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!isValidEmail(cleanUser.email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (cleanUser.password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = users.find((user) => user.email.toLowerCase() === cleanUser.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(cleanUser.password, 10);

    const newUser = {
      id: Date.now().toString(),
      ...cleanUser,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeData('users.json', users);

    return res.status(201).json({
      message: 'Registration successful',
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Unable to register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const users = await readData('users.json');
    const { email, password } = req.body;

    const user = users.find(
      (u) => String(u.email).toLowerCase() === String(email).toLowerCase()
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'shoppingweb_secret_key',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Unable to login' });
  }
});

module.exports = router;
