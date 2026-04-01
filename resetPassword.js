const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'data', 'users.json');

async function resetPassword(email, newPassword) {
  try {
    // Read current users
    const usersData = fs.readFileSync(usersFile, 'utf-8');
    const users = JSON.parse(usersData);

    // Find the user
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      console.log(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].password = hashedPassword;

    // Write back to file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    console.log(`✓ Password reset successfully for ${email}`);
    console.log(`   New password: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node resetPassword.js <email> <newPassword>');
  console.log('Example: node resetPassword.js soumyanayak446@gmail.com password123');
  process.exit(1);
}

resetPassword(email, password);
