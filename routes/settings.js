const router = require('express').Router();
const { authorize } = require('../middleware/roles');
const { uploadImage } = require('../config/multer');
const ctrl = require('../controllers/settingsController');

// All settings routes require super_admin or ict_officer
router.use(authorize('manage_all_content'));

// Main settings page
router.get('/', ctrl.index);

// Hero section update (hero image + logo)
router.post('/hero', uploadImage.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'heroLogo', maxCount: 1 }
]), ctrl.updateHero);

// About Naujan section (home page)
router.post('/about-naujan', uploadImage.fields([
  { name: 'aboutNaujanPhoto', maxCount: 1 }
]), ctrl.updateAboutNaujan);

// About Office section (about page)
router.post('/about-office', uploadImage.fields([
  { name: 'aboutOfficePhoto', maxCount: 1 }
]), ctrl.updateAboutOffice);

// PIO Team update - dynamic fields for team member photos
router.post('/pio-team', uploadImage.fields([
  { name: 'teamPhoto_0', maxCount: 1 },
  { name: 'teamPhoto_1', maxCount: 1 },
  { name: 'teamPhoto_2', maxCount: 1 },
  { name: 'teamPhoto_3', maxCount: 1 },
  { name: 'teamPhoto_4', maxCount: 1 },
  { name: 'teamPhoto_5', maxCount: 1 },
  { name: 'teamPhoto_6', maxCount: 1 },
  { name: 'teamPhoto_7', maxCount: 1 },
  { name: 'teamPhoto_8', maxCount: 1 },
  { name: 'teamPhoto_9', maxCount: 1 }
]), ctrl.updatePioTeam);

// Partner Agencies update - dynamic fields for agency logos
router.post('/partner-agencies', uploadImage.fields([
  { name: 'agencyLogo_0', maxCount: 1 },
  { name: 'agencyLogo_1', maxCount: 1 },
  { name: 'agencyLogo_2', maxCount: 1 },
  { name: 'agencyLogo_3', maxCount: 1 },
  { name: 'agencyLogo_4', maxCount: 1 },
  { name: 'agencyLogo_5', maxCount: 1 },
  { name: 'agencyLogo_6', maxCount: 1 },
  { name: 'agencyLogo_7', maxCount: 1 },
  { name: 'agencyLogo_8', maxCount: 1 },
  { name: 'agencyLogo_9', maxCount: 1 }
]), ctrl.updatePartnerAgencies);

module.exports = router;
