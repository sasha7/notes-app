const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'Mailgun',
  auth: {
    user: process.env.MAILGUN_USERNAME,
    pass: process.env.MAILGUN_PASSWORD
  }
});
const emailSanitizerConfig = require('../config/sanitizer').email;

/**
 * GET /contact
 */
const contactGet = (req, res, next) => {
  // Check if there was previous old form input
  const contactFormOldInput = req.session.contactFormOldInput || {};
  delete req.session.contactFormOldInput;

  res.render('contact', { contactFormOldInput });
};

const contactPost = (req, res, next) => {
  // remember current data from input fields
  req.session.contactFormOldInput = {
    name: req.body.name,
    email: req.body.email,
    body: req.body.body || ''
  };

  // Validate data
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('message', 'Message cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail(emailSanitizerConfig);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      // There are validation errors, redirect to /contact page with error notification.
      const errors = result.array();
      req.flash('errors', errors);
      res.redirect('/contact');
    } else { // Send mail.
      const mailOptions = {
        from: `req.body.name <${req.body.email}>`,
        to: process.env.TO_EMAIL,
        subject: '✔ Contact Form | Notes App',
        text: req.body.message
      };

      transporter.sendMail(mailOptions, (err) => {
        req.flash('success', { msg: 'Thank you! Your message has been sent.' });
        delete req.session.contactFormOldInput;
        res.redirect('/contact');
      });
    }
  });
};

const ContactController = {
  contactGet,
  contactPost
};

module.exports = ContactController;
