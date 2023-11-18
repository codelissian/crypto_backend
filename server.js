import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { extname } from 'path';
import dotenv from 'dotenv';
import cors from 'cors'; // Import the cors package

const app = express();
const port = 3000;

dotenv.config();

// Set up Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save images in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Serve static files (images) from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

app.post('/uploadImageAndSendEmail', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const imagePath = req.file.path;
  const originalName = req.file.originalname;

  const { to, subject, text } = req.body;

  const mailOptions = {
    from: 'your_email@gmail.com',
    to,
    subject,
    text,
    attachments: [
      {
        filename: originalName,
        path: imagePath,
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: 'Email not sent' });
    } else {
      console.log('Email sent: ' + info.response);
      res.json({ message: 'Email sent successfully' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
