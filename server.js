require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const bodyParser = require("body-parser");
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require("path");


const PORT = 3000;

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));



app.use(session({
  secret: process.env.MY_CODE,
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000 // ⏳ Set session timeout to 10 minutes
  }
}));


// Database connection
const db = new sqlite3.Database("./db/clothings.sqlite", (err) => {
  if (err) console.error("Error opening main database:", err.message);
  else console.log("Connected to main database.");
});

// Create tables
db.serialize(() => {

db.run(`
  CREATE TABLE IF NOT EXISTS fashion (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    short_description TEXT, 
    description TEXT, 
    title TEXT,
    price TEXT, 
    image TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      product_id INTEGER, 
      user_email TEXT, 
      FOREIGN KEY (product_id) REFERENCES fashion(id)
  )
`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  verified INTEGER DEFAULT 0,
  verification_code TEXT
)`);


 

  // Insert sample data if the table is empty
  db.get("SELECT COUNT(*) AS count FROM fashion", (err, row) => {
    if (err) {
      console.error("Error checking fashion count:", err);
      return;
    }

    if (row.count === 0) {
      const clothssamples = [
        [
          "suit",
          "A  russian classic suit",
          "A healing bread that turn an infectious body to, a strong and healthy living, this bread play a crusal role when it comes to healing. A healing bread that turn an infectious body to, a strong and healthy living, this bread play a crusal role when it comes to healing",
          "FLay suit",
          "$40",
          "../pics/s1.jpg",
  
        ],
      ];

      clothssamples.forEach((clot) => {
        db.run(
          `INSERT INTO fashion (name, short_description, description, title, price, image) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          clot,
          function (err) {
            if (err) console.error("Error inserting fashion:", err);
          }
        );
      });
    }
  });
});

// API route to get properties
app.get("/fashion", (req, res) => {
  db.all("SELECT * FROM fashion", (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});


app.get('/check-session', (req, res) => {
  if (req.session.user) {
      res.json({ loggedIn: true, email: req.session.user.email });
  } else {
      res.json({ loggedIn: false });
  }
});

app.post('/add-favorite', (req, res) => {
  const { productId, userEmail } = req.body;

  db.get('SELECT * FROM favorites WHERE product_id = ? AND user_email = ?', 
      [productId, userEmail], 
      (err, row) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ success: false, message: "Database error." });
          }
          if (row) {
              return res.json({ success: false, message: "Item already exists in your favorite list." });
          }

          db.run('INSERT INTO favorites (product_id, user_email) VALUES (?, ?)', 
              [productId, userEmail], 
              function (err) {
                  if (err) {
                      console.error('Error adding favorite:', err);
                      return res.status(500).json({ success: false, message: "Server error. Please try again." });
                  }
                  res.json({ success: true });
              }
          );
      }
  );
});

app.get('/get-favorites', (req, res) => {
  if (!req.session.user || !req.session.user.email) {
      return res.status(403).json({ message: "Unauthorized access. Please log in." });
  }

  db.all(`
      SELECT fashion.*
      FROM favorites 
      JOIN fashion ON favorites.product_id = fashion.id
      WHERE favorites.user_email = ?`, 
      [req.session.user.email], 
      (err, rows) => {
          if (err) {
              console.error('Error fetching favorites:', err);
              return res.status(500).json({ message: "Server error. Please try again." });
          }
          res.json(rows);
      }
  );
});




const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Use 465 for SSL
  secure: true, // Use SSL for better security
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
  },
  tls: {
      rejectUnauthorized: false, // Ignore SSL certificate issues
  },
});



// Contact Us Email Route
app.post('/send-email', async (req, res) => {
    const { name, email, number, message } = req.body;
  
  
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: "Email service is not configured." });
    }
  
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Contact Us Form Submission from ${name}`,
      text: `You have received a new message:
  
  Name: ${name}
  Email: ${email}
  Phone Number: ${number}
  Message: ${message}`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully.' });
    } catch (error) {
      console.error("Email Error:", error);
      res.status(500).json({ error: 'Failed to send the email. Please try again later.' });
    }
  });

  app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = crypto.randomBytes(16).toString('hex');

        db.run('INSERT INTO users (name, email, password, verification_code) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, verificationCode],
            async (err) => {
                if (err) {
                    console.error("Signup error:", err.message);
                    return res.status(400).json({ error: 'Email already registered' });
                }

                const link = `http://localhost:${PORT}/verify?code=${verificationCode}`;
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: 'Verify Your Email',
                        text: `Click here to verify your email: ${link}`
                    });

                    console.log("✅ Verification email sent successfully to:", email);
                    res.json({ message: 'Verification email sent' });

                } catch (emailError) {
                    console.error("❌ Error sending email:", emailError.message);
                    res.status(500).json({ error: 'Failed to send verification email' });
                }
            }
        );
    } catch (error) {
        console.error("❌ Unexpected error:", error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get("/verify", (req, res) => {
  const { code } = req.query;

  if (!code) {
      return res.status(400).send("Invalid or missing verification code.");
  }

  db.get("SELECT * FROM users WHERE verification_code = ?", [code], (err, user) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Database error.");
      }

      if (!user) {
          return res.status(400).send("Invalid verification code.");
      }

      db.run(
          "UPDATE users SET verified = 1, verification_code = NULL WHERE email = ?",
          [user.email],
          (updateErr) => {
              if (updateErr) {
                  console.error("Error updating verification status:", updateErr);
                  return res.status(500).send("Failed to verify email.");
              }

              // ✅ Set session after verification
              req.session.userId = user.id;
              req.session.email = user.email;
              req.session.loggedIn = true;

              console.log("Session Set:", req.session);

              // ✅ Redirect to the products page
              res.redirect("http://localhost:3000/products.html");
          }
      );
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
          return res.status(400).json({ error: "User not found" });
      }
      if (!user.verified) {
          return res.status(400).json({ error: "Email not verified" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
          return res.status(400).json({ error: "Invalid password" });
      }

      // ✅ Password is correct, generate login verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      req.session.verificationCode = verificationCode;
      req.session.email = email;

      try {
          await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: email,
              subject: "Login Verification Code",
              text: `Your login code is: ${verificationCode}`
          });

          res.json({ message: "Verification code sent. Check your email." });
      } catch (emailError) {
          console.error("Email error:", emailError);
          res.status(500).json({ error: "Failed to send verification email" });
      }
  });
});



app.post('/verify-code', (req, res) => {
  const { code } = req.body;
  
  if (parseInt(code) === req.session.verificationCode) {
      req.session.user = { email: req.session.email };  // Ensure user object is stored in session
      req.session.cookie.maxAge = 60 * 1000; // 1-minute session expiration
      res.json({ success: true });
  } else {
      res.status(400).json({ error: 'Invalid code' });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
