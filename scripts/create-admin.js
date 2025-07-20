const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        name: 'Admin Kullanıcı',
        role: 'ADMIN',
        isSuperAdmin: true,
        isActive: true,
        password: hashedPassword
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:', admin.id);

    return admin;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('✨ Admin user creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin user creation failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createAdmin };