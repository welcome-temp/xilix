const sqlite3 = require("sqlite3").verbose();

// Connect to SQLite database
const db = new sqlite3.Database("./db/clothings.sqlite", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// Sample properties data
const breadsamples = [
    [
        "Classic Suit",
        "A timeless formal wear for business and special occasions.",
        "The Classic Suit is a sophisticated outfit designed for professionals and those attending formal events. Made from high-quality fabric, it ensures a perfect fit and a refined look. It typically includes a tailored jacket, matching trousers, and a dress shirt, often paired with a tie for a complete appearance.",
        "Formal Wear",
        "$120",
        "../pics/s2.jpg"
],
    [
        "Cultural Senator Wear",
        "A stylish traditional outfit inspired by African heritage.",
        "The Cultural Senator Wear is a well-crafted traditional attire popular among men who appreciate elegance and culture. Made with fine-quality fabrics like cashmere or cotton, it features a long or short-sleeved tunic with matching trousers. It is often worn for formal events, weddings, and special occasions.",
        "Traditional Wear",
        "$80",
        "../pics/s1.jpg"
    ],
    [
        "Stylish Jacket",
        "A fashionable outerwear for casual and semi-formal occasions.",
        "This stylish jacket combines comfort and elegance. Made from high-quality leather, denim, or wool, it is designed to provide warmth while maintaining a trendy look. Ideal for layering over shirts or sweaters, it enhances your fashion appeal in both casual and formal settings.",
        "Casual Wear",
        "$60",
        "../pics/s3.jpg"
    ],
    [
        "Designer Blazer",
        "A sleek, modern blazer for a sophisticated look.",
        "The Designer Blazer is a tailored outfit that adds a touch of class to your wardrobe. Designed for both business and semi-formal occasions, it pairs well with dress pants or even jeans for a smart-casual appeal. Available in various colors and patterns, it suits different fashion tastes.",
        "Semi-Formal Wear",
        "$90",
        "../pics/s4.jpg"
    ],
    [
        "Trendy Tuxedo",
        "A luxurious evening wear for grand occasions.",
        "The Trendy Tuxedo is an exclusive outfit designed for high-class events, such as weddings, galas, and black-tie dinners. Crafted with premium materials, it features a well-fitted jacket, satin lapels, and matching trousers. When paired with a bow tie and formal shoes, it exudes elegance.",
        "Luxury Wear",
        "$150",
        "../pics/s5.jpg"
    ],
    [
        " Urban Denim Jacket",
        "A rugged yet stylish denim jacket for street fashion.",
        "The Urban Denim Jacket is a trendy casual wear ideal for a relaxed and stylish look. Made from durable denim, it offers versatility and can be layered over t-shirts, hoodies, or sweaters. Suitable for all seasons, it’s a must-have for fashion-forward individuals.",
        "Street Wear",
        "$50",
        "../pics/s6.jpg"
    ]

];

// Insert properties into the database
db.serialize(() => {
  db.run(
    " CREATE TABLE IF NOT EXISTS fashion ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, short_description TEXT, description TEXT, title TEXT,price TEXT, image TEXT)"
  );

  const insertQuery =  `INSERT INTO fashion (name, short_description, description, title, price, image) 
  VALUES (?, ?, ?, ?, ?, ?)`;
  
  breadsamples.forEach((bread) => {
    db.run(insertQuery, bread, function (err) {
      if (err) {
        console.error("Error inserting fashion:", err.message);
      } else {
        console.log(" added with ID:", this.lastID);
      }
    });
  });
});

// Close database connection after insertion
db.close((err) => {
  if (err) {
    console.error("Error closing database:", err.message);
  } else {
    console.log("Database connection closed.");
  }
});
