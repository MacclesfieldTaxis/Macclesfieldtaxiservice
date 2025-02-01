require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname)); // Serve static files

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB', err));

// Email Configuration (No OAuth, only Gmail + App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Your Gmail
        pass: process.env.EMAIL_PASS   // Your App Password
    }
});

// Function to Send Email
async function sendEmail(to, subject, htmlContent) {
    try {
        await transporter.sendMail({
            from: `"Macclesfield Taxis" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Booking Schema
const bookingSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    passengers: Number,
    from: String,
    destination: String,
    phone: String,
    date: String,
    time: String,
    accepted: { type: Boolean, default: false },
    driverPhone: String,
    rejectedBy: [String]
});

const Booking = mongoose.model('Booking', bookingSchema);

// Routes
app.post("/", async (req, res) => {
    const { fullName, email, passengers, from, destination, phone, date, time } = req.body;
    console.log("POSTED!!")
    try {
        const newBooking = new Booking({
            fullName,
            email,
            passengers,
            from,
            destination,
            phone,
            date,
            time
        });

        await newBooking.save();
        console.log("Booking Saved!")
        
        // Send confirmation email
        const customerHtml = `
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #4CAF50;">Booking Confirmation</h2>
                    <p>Hello ${fullName},</p>
                    <p>Your booking has been received!</p>
                    <table style="border-collapse: collapse; width: 100%;">
                        <tr>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Detail</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Information</th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Date</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${date}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Time</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${time}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Pickup Location</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${from}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Destination</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${destination}</td>
                        </tr>
                    </table>
                    <p>Thank you for choosing Macclesfield Taxis!</p>
                </body>
            </html>
        `;

        await sendEmail(email, 'Booking Confirmation', customerHtml);
        console.log("Email Sent!")
        res.redirect("/");
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).send('Error saving booking');
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
