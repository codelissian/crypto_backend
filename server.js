import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { extname } from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

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
app.use(cors());
app.use('/uploads', express.static('uploads'));



const sendEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};




app.post('/uploadImageAndSendEmail', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const imagePath = req.file.path;
  const originalName = req.file.originalname;
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields. Please provide "to", "subject", and "text".' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
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

  try {
    await sendEmail(mailOptions);
    console.log('Email sent successfully');
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Email not sent' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
