import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { extname } from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';



const app = express();
const port = 3000;

dotenv.config();


const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465, 
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      // Check if the directory exists, if not, create it
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
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




// app.post('/uploadImageAndSendEmail', upload.single('image'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No image provided' });
//   }

//   const imagePath = req.file.path;
//   const originalName = req.file.originalname;
//   const { to, subject, text } = req.body;

//   if (!to || !subject || !text) {
//     return res.status(400).json({ error: 'Missing required fields. Please provide "to", "subject", and "text".' });
//   }
  
//   const selfMail = {
//     from: process.env.EMAIL_USER,
//     to :  process.env.EMAIL_USER,
//     subject,
//     text,
//     attachments: [
//       {
//         filename: originalName,
//         path: imagePath,
//       },
//     ],
//   };

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     text,
//     attachments: [
//       {
//         filename: originalName,
//         path: imagePath,
//       },
//     ],
//   };

//   try {
//     const selfMailInfo = await sendEmail(selfMail)
//     console.log('Self mail sent successfully');
//     res.json({ message: 'Email sent successfully' });
//     try {
//       const userMailInfo = await sendEmail(mailOptions);
//       fs.unlinkSync(imagePath);
//       console.log('User Email sent successfully');
//     } catch (alternateError) {
//       console.error('Error sending alternate email:', alternateError);
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Email not sent' });
//   }
// });




app.post('/uploadImageAndSendEmail', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imagePath = req.file.path;
    const originalName = req.file.originalname;
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ error: 'Missing required fields. Please provide "to", "subject", and "text".' });
    }

    const selfMail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject,
      text,
      attachments: [{ filename: originalName, path: imagePath }],
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments: [{ filename: originalName, path: imagePath }],
    };

    const selfMailInfo = await sendEmail(selfMail);
    console.log('Self mail sent successfully');

    res.json({ message: 'Email sent successfully' });

    const userMailInfo = await sendEmail(mailOptions);
    console.log('User Email sent successfully');

    fs.unlinkSync(imagePath); // Delete the image after sending both emails
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Email not sent' });
  }
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
