import { createClient } from '@supabase/supabase-js';
import express from 'express';
import path from 'path'; 
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();



const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

// Initialize Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to send emails
const sendEmail = async (to, subject, html) => {
  try {
    if (!to || !subject || !html) {
      throw new Error('Missing required email parameters');
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const getCustomerBookingEmail = (booking) => `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #4CAF50;">Booking Confirmation</h2>
      <p>Hello ${booking.full_name},</p>
      <p>Your booking has been received! We will assign a driver shortly.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Date</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.date}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Time</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.time}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Pickup Location</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.from_location}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Destination</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.destination}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Passengers</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.passengers}</td>
        </tr>
      </table>
      <p>Thank you for choosing our service!</p>
    </body>
  </html>
`;

const getDriverNotificationEmail = (booking) => `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #4CAF50;">New Booking Available</h2>
      <p>A new booking request has been received:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Passenger Name</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.full_name}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Date</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.date}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Time</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.time}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Pickup Location</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.from_location}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Destination</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.destination}</td>
        </tr>
      </table>
      <p>Please log in to your dashboard to accept or reject this booking. <a href="https://www.macclesfieldtaxis.com/driver.html" target="_blank">Click here</a>.</p>
    </body>
</html>
;

const getBookingAcceptedEmail = (booking, driver) => `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
      <p>Hello ${booking.full_name},</p>
      <p>Great news! Your booking has been accepted by our driver.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Driver Phone</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${driver.phone}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Pickup Time</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.time}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Pickup Location</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.from_location}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Drop Location</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.destination}</td>
        </tr>
      </table>
      <p>Your driver will arrive at the scheduled time. Have a great journey!</p>
    </body>
  </html>
`;

const getBookingRejectedEmail = (booking) => `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #FF4444;">Booking Update</h2>
      <p>Hello ${booking.full_name},</p>
      <p>We regret to inform you that your booking could not be accepted at this time.</p>
      <p>Your booking details:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Date</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.date}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Time</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${booking.time}</td>
        </tr>
      </table>
      <p>We will notify you once another driver accepts your booking.</p>
    </body>
  </html>
`;

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

// API Routes
// Create new booking
app.post("/", async (req, res) => {
  const { fullName, email, phone, date, time, passengers, from, destination } = req.body;

  try {
    // Prepare the booking data object
    const bookingData = {
      full_name: fullName,
      email,
      phone,
      passengers: parseInt(passengers, 10),
      from_location: from,
      destination,
      date,
      time,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Insert booking into the database
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email to customer
    await sendEmail(booking.email, 'Booking Confirmation', getCustomerBookingEmail(booking));

    // Notify all active drivers
    const { data: drivers, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active');

    if (driverError) {
      console.error('Error fetching drivers:', driverError);
      return res.status(500).json({ error: 'Error fetching drivers' });
    }

    if (drivers && Array.isArray(drivers)) {
      for (const driver of drivers) {
        await sendEmail(driver.email, 'New Booking Available', getDriverNotificationEmail(booking));
      }
    } else {
      console.log('No active drivers found');
    }

    // Redirect to the same page after booking creation
    res.redirect('/');  
  } catch (error) {
    console.error('Error creating booking:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error creating booking' });
    }
  }
});


app.post("/driver/login", async (req, res) => {

  const { email, password } = req.body;

  try {
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select("*")
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (!drivers || drivers.password !== password) { 
      console.log("Invalid credentials for:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("User logged in:", drivers.email);
    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reject booking
app.post("/api/bookings/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'rejected'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send rejection email to customer
    await sendEmail(
      booking.email,
      'Booking Update',
      getBookingRejectedEmail(booking)
    );

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: 'Error rejecting booking' });
  }
});


// Accepting booking
app.post("/api/bookings/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'accept' })
      .eq('id', id)
      .select();  
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = data[0]; 
    const { data: drivers, error1 } = await supabase
      .from("drivers")
      .select("*")
      .single();

    if (error1) throw error1;

    // Send acceptance email to customer
    await sendEmail(
      booking.email,
      'Booking Update',
      getBookingAcceptedEmail(booking, drivers)
    );

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ error: 'Error accepting booking' });
  }
});


// Get all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// Get driver's bookings
app.get("/api/drivers/:driverId/bookings", async (req, res) => {
  try {
    const { driverId } = req.params;
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({ error: 'Error fetching driver bookings' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
