const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Product = require('./data/Product');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const products = JSON.parse(fs.readFileSync('./products.json', 'utf-8'));

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log('Products seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();