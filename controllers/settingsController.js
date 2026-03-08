const SiteSettings = require('../models/SiteSettings');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// GET /admin/settings
exports.index = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.render('admin/settings/index', {
      layout: 'layouts/admin',
      title: 'Site Settings',
      settings
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading settings');
    res.redirect('/admin/dashboard');
  }
};

// POST /admin/settings/hero
exports.updateHero = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    if (req.files && req.files.heroImage && req.files.heroImage[0]) {
      if (settings.heroImage) await deleteFromCloudinary(settings.heroImage);
      const { url } = await uploadToCloudinary(req.files.heroImage[0].buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.files.heroImage[0].mimetype
      });
      settings.heroImage = url;
    }
    if (req.files && req.files.heroLogo && req.files.heroLogo[0]) {
      if (settings.heroLogo) await deleteFromCloudinary(settings.heroLogo);
      const { url } = await uploadToCloudinary(req.files.heroLogo[0].buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.files.heroLogo[0].mimetype
      });
      settings.heroLogo = url;
    }
    settings.updatedBy = req.user._id;
    await settings.save();

    req.flash('success_msg', 'Hero section updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating hero section');
    res.redirect('/admin/settings');
  }
};

// POST /admin/settings/about-naujan
exports.updateAboutNaujan = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    if (req.body.aboutNaujanTitle) settings.aboutNaujanTitle = req.body.aboutNaujanTitle.trim();
    if (req.body.aboutNaujanDescription !== undefined) settings.aboutNaujanDescription = req.body.aboutNaujanDescription.trim();

    if (req.files && req.files.aboutNaujanPhoto && req.files.aboutNaujanPhoto[0]) {
      if (settings.aboutNaujanPhoto) await deleteFromCloudinary(settings.aboutNaujanPhoto);
      const { url } = await uploadToCloudinary(req.files.aboutNaujanPhoto[0].buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.files.aboutNaujanPhoto[0].mimetype
      });
      settings.aboutNaujanPhoto = url;
    }
    settings.updatedBy = req.user._id;
    await settings.save();

    req.flash('success_msg', 'About Naujan section updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating About Naujan section');
    res.redirect('/admin/settings');
  }
};

// POST /admin/settings/about-office
exports.updateAboutOffice = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    if (req.body.aboutOfficeDescription !== undefined) settings.aboutOfficeDescription = req.body.aboutOfficeDescription.trim();

    if (req.files && req.files.aboutOfficePhoto && req.files.aboutOfficePhoto[0]) {
      if (settings.aboutOfficePhoto) await deleteFromCloudinary(settings.aboutOfficePhoto);
      const { url } = await uploadToCloudinary(req.files.aboutOfficePhoto[0].buffer, {
        folder: 'pio_naujan/images',
        mimetype: req.files.aboutOfficePhoto[0].mimetype
      });
      settings.aboutOfficePhoto = url;
    }
    settings.updatedBy = req.user._id;
    await settings.save();

    req.flash('success_msg', 'About Office section updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating About Office section');
    res.redirect('/admin/settings');
  }
};

// POST /admin/settings/pio-team
exports.updatePioTeam = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    const { names, positions, descriptions, colors, existingPhotos } = req.body;

    const namesArr = Array.isArray(names) ? names : (names ? [names] : []);
    const positionsArr = Array.isArray(positions) ? positions : (positions ? [positions] : []);
    const descriptionsArr = Array.isArray(descriptions) ? descriptions : (descriptions ? [descriptions] : []);
    const colorsArr = Array.isArray(colors) ? colors : (colors ? [colors] : []);
    const existingPhotosArr = Array.isArray(existingPhotos) ? existingPhotos : (existingPhotos ? [existingPhotos] : []);

    const teamPhotos = req.files && req.files.teamPhotos ? req.files.teamPhotos : [];

    const team = [];
    let photoIdx = 0;

    for (let i = 0; i < namesArr.length; i++) {
      if (!namesArr[i] || !namesArr[i].trim()) continue;

      let photo = existingPhotosArr[i] || '';

      // Check if there's a new photo for this index
      if (teamPhotos[photoIdx] && req.body[`photoIndex_${photoIdx}`] !== undefined) {
        // Match by file input order
      }
      // Use a simpler approach: if the existing photo is empty or a new file came for this slot
      if (req.files && req.files[`teamPhoto_${i}`] && req.files[`teamPhoto_${i}`][0]) {
        const file = req.files[`teamPhoto_${i}`][0];
        const { url } = await uploadToCloudinary(file.buffer, {
          folder: 'pio_naujan/images',
          mimetype: file.mimetype
        });
        photo = url;
      }

      team.push({
        name: namesArr[i].trim(),
        position: positionsArr[i] ? positionsArr[i].trim() : '',
        description: descriptionsArr[i] ? descriptionsArr[i].trim() : '',
        photo,
        color: colorsArr[i] ? colorsArr[i].trim() : '#3282b8'
      });
    }

    settings.pioTeam = team;
    settings.updatedBy = req.user._id;
    await settings.save();

    req.flash('success_msg', 'PIO Team updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating PIO Team');
    res.redirect('/admin/settings');
  }
};

// POST /admin/settings/partner-agencies
exports.updatePartnerAgencies = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    const { agencyNames, facebookUrls, existingLogos } = req.body;

    const namesArr = Array.isArray(agencyNames) ? agencyNames : (agencyNames ? [agencyNames] : []);
    const fbArr = Array.isArray(facebookUrls) ? facebookUrls : (facebookUrls ? [facebookUrls] : []);
    const existingLogosArr = Array.isArray(existingLogos) ? existingLogos : (existingLogos ? [existingLogos] : []);

    const agencies = [];

    for (let i = 0; i < namesArr.length; i++) {
      if (!namesArr[i] || !namesArr[i].trim()) continue;

      let logo = existingLogosArr[i] || '';

      if (req.files && req.files[`agencyLogo_${i}`] && req.files[`agencyLogo_${i}`][0]) {
        const file = req.files[`agencyLogo_${i}`][0];
        const { url } = await uploadToCloudinary(file.buffer, {
          folder: 'pio_naujan/images',
          mimetype: file.mimetype
        });
        logo = url;
      }

      agencies.push({
        name: namesArr[i].trim(),
        logo,
        facebookUrl: fbArr[i] ? fbArr[i].trim() : ''
      });
    }

    settings.partnerAgencies = agencies;
    settings.updatedBy = req.user._id;
    await settings.save();

    req.flash('success_msg', 'Partner Agencies updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating Partner Agencies');
    res.redirect('/admin/settings');
  }
};
