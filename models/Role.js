const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['super_admin', 'ict_officer', 'department_editor', 'mayors_office', 'public_user']
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  permissions: [{
    type: String,
    enum: [
      'manage_users', 'manage_roles', 'manage_all_content',
      'manage_announcements', 'manage_events', 'manage_documents',
      'manage_transparency', 'manage_services', 'manage_departments',
      'manage_feedback', 'manage_complaints', 'manage_disaster',
      'approve_content', 'view_audit_logs', 'view_dashboard',
      'submit_feedback', 'submit_complaint', 'view_public'
    ]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
