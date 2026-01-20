# Dsign Accounting Website

Professional website for Dsign Accounting Co., Ltd. - A comprehensive accounting services firm.

## Overview

This is a clean, modern, and professional website designed for Dsign Accounting, targeting SME (Small and Medium Enterprises) clients in Thailand. The website showcases the firm's services, expertise, and reliability.

## Features

- **Professional Design**: Clean and modern design with teal brand colors
- **Responsive Layout**: Fully responsive design that works on all devices (desktop, tablet, mobile)
- **Service Showcase**: Comprehensive display of all accounting services offered
- **FAQ Section**: 8 common accounting questions answered in Thai language
- **Contact Form**: Email contact functionality for client inquiries
- **Trust Indicators**: Display of credentials (10+ years experience, CPA & CPD certified)
- **Smooth Navigation**: Sticky navigation bar with smooth scrolling
- **Interactive Elements**: FAQ accordion, mobile menu, form validation

## Services Offered

1. รับทำบัญชีรายเดือน (Monthly Accounting)
2. ปิดงบการเงินรายปี (Annual Financial Statements)
3. ที่ปรึกษาภาษีอากร (Tax Consulting)
4. รับตรวจสอบบัญชี (Auditing Services)
5. วางระบบบัญชี (Accounting System Setup)
6. งานทะเบียน (Business Registration)
7. วางแผนภาษี (Tax Planning)
8. ให้คำปรึกษา (Consulting Services)

## Technologies Used

- HTML5
- CSS3 (Custom styling with CSS variables)
- Vanilla JavaScript
- Google Fonts (Kanit & Prompt - Thai fonts)

## File Structure

```
Dsign-Acc/
├── index.html          # Main HTML file
├── styles.css          # Stylesheet
├── script.js           # JavaScript functionality
├── logo.png           # Company logo (to be added)
└── README.md          # This file
```

## Setup Instructions

1. **Add Logo**: Place your company logo image as `logo.png` in the root directory
2. **Update Contact Information**: Edit the phone number and address in `index.html`
3. **Customize Email**: The contact form is set to send emails to `info@dsignaccounting.com`

## Customization

### Colors
The website uses CSS variables for easy color customization. Edit in `styles.css`:

```css
:root {
    --primary-color: #17a2b8;      /* Main teal color */
    --primary-dark: #138496;       /* Darker teal */
    --accent-color: #28a745;       /* Green accent */
}
```

### Contact Email
To change the contact email, edit the `mailto:` link in `script.js`:

```javascript
const mailtoLink = `mailto:YOUR_EMAIL@domain.com?subject=...`;
```

### Phone Number
Update the phone number in the contact section of `index.html`:

```html
<p>02-XXX-XXXX</p>
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Key Features for SMEs

The website is specifically designed to appeal to SME clients by:

- Highlighting reliability and trustworthiness
- Showcasing professional credentials (CPA, CPD)
- Emphasizing 10+ years of experience
- Clear, transparent pricing approach
- Comprehensive one-stop service offering
- Thai language content for local market

## Contact Form Functionality

The contact form uses a `mailto:` link to open the user's default email client. This approach:
- Requires no backend server
- Works on all devices
- Maintains privacy
- Simple to implement

For a more advanced solution with form submission to a server, consider integrating with services like:
- FormSpree
- Netlify Forms
- Google Forms
- Custom backend with PHP/Node.js

## FAQ Section

The FAQ section includes 8 common questions about accounting in Thai:
1. Do SMEs need to do accounting?
2. Deadline for financial statement submission
3. Tax-deductible expenses
4. Benefits of hiring an accounting firm
5. When to start accounting for new companies
6. VAT registration requirements
7. Document retention period
8. Tax planning benefits

## Deployment

This is a static website that can be deployed on:
- **GitHub Pages**: Free hosting for static sites
- **Netlify**: Free tier with continuous deployment
- **Vercel**: Free hosting with excellent performance
- **Traditional Web Hosting**: Upload via FTP to any web server

### Quick Deploy to GitHub Pages

1. Push to GitHub repository
2. Go to Settings > Pages
3. Select branch and folder
4. Save and wait for deployment

## Future Enhancements

Potential additions for future versions:
- Blog section for accounting tips
- Client testimonials
- Case studies
- Online booking system
- Live chat integration
- Multilingual support (English version)
- Service pricing calculator
- Document upload portal for clients

## License

© 2026 Dsign Accounting Co., Ltd. All rights reserved.

## Support

For website issues or customization requests, please contact the development team.

---

**Note**: Remember to replace the placeholder phone number (02-XXX-XXXX) with your actual contact number before going live.
