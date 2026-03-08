const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  position: { type: String, default: '' },
  description: { type: String, default: '' },
  photo: { type: String, default: '' },
  color: { type: String, default: '#3282b8' }
}, { _id: true });

const partnerAgencySchema = new mongoose.Schema({
  name: { type: String, default: '' },
  logo: { type: String, default: '' },
  facebookUrl: { type: String, default: '' }
}, { _id: true });

const siteSettingsSchema = new mongoose.Schema({
  // Hero Section
  heroImage: { type: String, default: '/uploads/images/heropic.jpg' },
  heroLogo: { type: String, default: '/uploads/images/pio-logo.png' },

  // About Naujan (home page)
  aboutNaujanTitle: { type: String, default: 'A Gateway to Natural Wonders' },
  aboutNaujanDescription: { type: String, default: '' },
  aboutNaujanPhoto: { type: String, default: '/uploads/images/aboutnaujan.jpg' },

  // About PIO - Office section
  aboutOfficeDescription: { type: String, default: '' },
  aboutOfficePhoto: { type: String, default: '/uploads/images/heropic.jpg' },

  // PIO Team
  pioTeam: [teamMemberSchema],

  // Partner Agencies
  partnerAgencies: [partnerAgencySchema],

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure only one settings document exists
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
