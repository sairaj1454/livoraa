const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://virtuous-interiors.onrender.com' 
    : 'http://localhost:3001',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ecnodev@gmail.com',
    pass: process.env.EMAIL_PASS || 'dzdw tzrn rumu wjim'
  }
});

// Email sending endpoint
app.post('/api/send-credentials', async (req, res) => {
  const { email, password, name, phone } = req.body;

  try {
    const mailOptions = {
      from: 'ecnodev@gmail.com',
      to: email,
      subject: 'Your Interior Master Account Credentials',
      html: `
        <h2>Welcome to virtuous interiors!</h2>
        <p>Dear ${name},</p>
        <p>Your account has been successfully created. Here are your login credentials:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please keep these credentials safe and change your password upon first login.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>virtuous interiors Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Credentials sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send credentials email' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle all other routes by serving the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;

// Start the server
if (process.env.NODE_ENV === 'production') {
  // In production, start the Express server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // In development, export the app for potential different configuration
  module.exports = app;
}
