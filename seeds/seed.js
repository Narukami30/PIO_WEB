require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const User = require('../models/User');
const Department = require('../models/Department');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pio_naujan';

const roles = [
  {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full system access',
    permissions: [
      'manage_users', 'manage_roles', 'manage_departments',
      'manage_announcements', 'manage_events', 'manage_documents',
      'manage_transparency', 'manage_services', 'manage_feedback',
      'manage_complaints', 'manage_disaster', 'view_audit_logs',
      'manage_all_content', 'approve_content', 'view_dashboard',
      'submit_feedback', 'submit_complaint', 'view_public'
    ]
  },
  {
    name: 'ict_officer',
    displayName: 'ICT Officer',
    description: 'ICT department officer with broad access',
    permissions: [
      'manage_announcements', 'manage_events', 'manage_documents',
      'manage_transparency', 'manage_services', 'manage_feedback',
      'manage_complaints', 'manage_disaster', 'view_audit_logs',
      'manage_all_content', 'approve_content', 'view_dashboard'
    ]
  },
  {
    name: 'department_editor',
    displayName: 'Department Editor',
    description: 'Can manage content for assigned department',
    permissions: [
      'manage_announcements', 'manage_events', 'manage_documents',
      'manage_services', 'approve_content', 'view_dashboard'
    ]
  },
  {
    name: 'mayors_office',
    displayName: "Mayor's Office",
    description: 'Mayor\'s office staff',
    permissions: [
      'manage_announcements', 'manage_events', 'manage_transparency',
      'manage_feedback', 'manage_complaints', 'approve_content',
      'view_dashboard'
    ]
  },
  {
    name: 'public_user',
    displayName: 'Public User',
    description: 'Registered public user (limited access)',
    permissions: ['submit_feedback', 'submit_complaint', 'view_public']
  }
];

const departments = [
  { name: 'Office of the Municipal Mayor', code: 'OMM', head: '', headTitle: 'Municipal Mayor', order: 1 },
  { name: 'Office of the Municipal Vice Mayor', code: 'OMVM', headTitle: 'Municipal Vice Mayor', order: 2 },
  { name: 'Sangguniang Bayan', code: 'SB', headTitle: 'Presiding Officer', order: 3 },
  { name: 'Municipal Planning & Development Office', code: 'MPDO', headTitle: 'Municipal Planning & Dev. Officer', order: 4 },
  { name: 'Municipal Budget Office', code: 'MBO', headTitle: 'Municipal Budget Officer', order: 5 },
  { name: 'Municipal Accounting Office', code: 'MACCO', headTitle: 'Municipal Accountant', order: 6 },
  { name: 'Municipal Treasurer\'s Office', code: 'MTO', headTitle: 'Municipal Treasurer', order: 7 },
  { name: 'Municipal Assessor\'s Office', code: 'MAO', headTitle: 'Municipal Assessor', order: 8 },
  { name: 'Municipal Civil Registrar', code: 'MCR', headTitle: 'Municipal Civil Registrar', order: 9 },
  { name: 'Municipal Health Office', code: 'MHO', headTitle: 'Municipal Health Officer', order: 10 },
  { name: 'Municipal Social Welfare & Development Office', code: 'MSWDO', headTitle: 'MSWDO Head', order: 11 },
  { name: 'Municipal Agriculture Office', code: 'MAGRO', headTitle: 'Municipal Agriculturist', order: 12 },
  { name: 'Municipal Engineering Office', code: 'MEO', headTitle: 'Municipal Engineer', order: 13 },
  { name: 'Municipal Disaster Risk Reduction & Management Office', code: 'MDRRMO', headTitle: 'MDRRMO Head', order: 14 },
  { name: 'Municipal Environment & Natural Resources Office', code: 'MENRO', headTitle: 'MENRO Head', order: 15 },
  { name: 'Human Resource Management Office', code: 'HRMO', headTitle: 'HRMO Head', order: 16 },
  { name: 'Municipal Information & Communications Technology Office', code: 'MICTO', headTitle: 'ICT Officer', order: 17 },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed Roles
    console.log('Seeding roles...');
    const seededRoles = {};
    for (const roleData of roles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (existing) {
        seededRoles[roleData.name] = existing;
        console.log(`  Role "${roleData.name}" already exists`);
      } else {
        const role = await Role.create(roleData);
        seededRoles[roleData.name] = role;
        console.log(`  Created role: ${roleData.name}`);
      }
    }

    // Seed Departments
    console.log('Seeding departments...');
    for (const deptData of departments) {
      const existing = await Department.findOne({ code: deptData.code });
      if (existing) {
        console.log(`  Department "${deptData.code}" already exists`);
      } else {
        await Department.create(deptData);
        console.log(`  Created department: ${deptData.code} - ${deptData.name}`);
      }
    }

    // Seed Super Admin User
    console.log('Seeding super admin user...');
    const adminEmail = 'publicinformationoffice02@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('  Super admin already exists');
    } else {
      const generatedPassword = process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(16).toString('hex');
      await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        password: generatedPassword,
        role: seededRoles['super_admin']._id,
        isActive: true
      });
      console.log('  Created super admin:');
      console.log('    Email: publicinformationoffice02@gmail.com');
      console.log(`    Password: ${generatedPassword}`);
      console.log('    *** SAVE THIS PASSWORD — IT WILL NOT BE SHOWN AGAIN ***');
    }

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
