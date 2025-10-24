# USF Preschool For Creative Learning Auto Reminder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/yourusername/usf-preschool-autopay)

A browser extension that automatically fills out the USF Preschool For Creative Learning payment form and provides monthly autopay reminders. This extension helps streamline the payment process by automatically populating form fields with your saved information and sending timely payment reminders.

## 🚀 Features

- **🔧 Automatic Form Filling**: Automatically fills out the USF Preschool payment form with your saved information
- **📅 Monthly Autopay Reminders**: Schedule automatic monthly payment reminders with customizable timing
- **🔒 Secure Local Storage**: All payment information is stored locally in your browser - no external servers
- **⚙️ Easy Configuration**: Simple popup interface to manage your payment settings and preferences
- **✅ Form Validation**: Ensures all required fields are properly filled before submission
- **🔔 Smart Notifications**: Daily reminders starting 7 days before payment due date
- **📱 Cross-Browser Support**: Works with Chrome, Edge, and Firefox

## ⚠️ Important Legal Notice

**BEFORE USING THIS EXTENSION, YOU MUST READ AND ACCEPT THE LEGAL CONSENT FORM. THIS EXTENSION IS PROVIDED "AS IS" WITH NO WARRANTIES AND THE DEVELOPER ASSUMES ZERO FINANCIAL OR INFORMATIONAL RESPONSIBILITY.**

**INDEPENDENCE NOTICE: This tool has NOTHING to do with USF or USF Preschool For Creative Learning. Neither USF nor USF Preschool For Creative Learning developed this tool, maintain it, or have any association with it. This is an independent third-party tool created by an external developer.**

## 📸 Video

[![Watch the video](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=cICa25vTNic)


## 🛠️ Installation

### Prerequisites
- Chrome 88+, Edge 88+, or Firefox 78+
- Access to the USF Preschool payment portal

### Method 1: Load Unpacked Extension (Recommended)

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/usf-preschool-autopay.git
   cd usf-preschool-autopay
   ```

2. **For Chrome/Edge:**
   - Open Chrome and navigate to `chrome://extensions/` (Edge: `edge://extensions/`)
   - Enable "Developer mode" (toggle in top right corner)
   - Click "Load unpacked"
   - Select the extension folder containing `manifest.json`
   - The extension icon should appear in your browser toolbar

3. **For Firefox:**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the extension folder

### Method 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store for easy installation.

## 📖 Usage

### First Time Setup

1. **Accept Terms and Conditions**
   - Click the extension icon in your browser toolbar
   - Read and accept the Terms and Conditions
   - This is required before saving any settings

2. **Configure Payment Information**
   - Fill in all required fields:
     - Child's information (last name)
     - Parent/Guardian information
     - Contact details (email, phone)
     - Address information
     - Billing address
     - Payment preferences

3. **Set Up Payment Settings**
   - Enter your monthly payment amount
   - Select your next payment date
   - Choose your preferred reminder time
   - Select payment method (Credit Card or ACH)
   - Enable auto-fill and/or monthly autopay

4. **Save Settings**
   - Click "Save Settings" to store your configuration
   - The extension will schedule your first reminder

### Using Auto-Fill

1. **Automatic Fill**
   - Navigate to the USF Preschool payment page
   - The extension will automatically fill the form with your saved information
   - Review and complete the payment manually

2. **Manual Fill**
   - Click the "Fill Form" button in the control panel that appears on the page
   - The form will be populated with your saved information

### Monthly Autopay Reminders

- **Smart Scheduling**: Reminders start 7 days before your payment due date
- **Daily Notifications**: You'll receive daily reminders until payment is made
- **Custom Timing**: Choose your preferred reminder time
- **Auto-Renewal**: Reminders automatically reschedule for the next payment period

### Pay Now Feature

- Click "Pay Now" to immediately open the USF payment page
- Reminders will be disabled for the current payment period
- Next reminder will be scheduled for 7 days before your next due date

## 🔧 Configuration Options

### Payment Information
- Child's last name
- Parent/Guardian name
- Email address
- Phone numbers (day, night, mobile)
- Complete address information
- Billing address details

### Payment Settings
- Monthly payment amount
- Next payment date
- Reminder time preference
- Payment method selection
- Auto-fill toggle
- Monthly autopay toggle

### Smart Features
- **Due Date Validation**: Automatically adjusts payment dates if more than 52 days away
- **Reminder Management**: Smart reminder scheduling based on payment timing
- **Form Validation**: Ensures all required fields are completed

## 🔒 Security & Privacy

- **Local Storage Only**: All data is stored locally in your browser
- **No External Servers**: No payment information is sent to external servers
- **Secure Permissions**: Extension only works on official USF Preschool payment pages
- **User Control**: You maintain full control over your payment information
- **Data Encryption**: All stored data uses browser's built-in encryption

## ⚠️ Important Notes

- **Manual Payment Required**: This extension fills out forms but does not complete payments. You must manually enter your credit card information and complete the transaction.
- **Browser Notifications**: The extension may request permission to show notifications for autopay reminders.
- **Data Storage**: Your information is stored in your browser's local storage and will be lost if you clear your browser data.
- **USF Independence**: This extension is not affiliated with, endorsed by, or associated with USF or USF Preschool For Creative Learning.

## 🐛 Troubleshooting

### Common Issues

**Form doesn't fill automatically:**
- Ensure you're on the correct USF Preschool payment page
- Check that auto-fill is enabled in extension settings
- Try refreshing the page
- Verify all required fields are filled in the extension settings

**Reminders not working:**
- Check that notifications are enabled for the extension
- Verify that autopay is enabled in settings
- Ensure the payment date is correctly set
- Check browser notification permissions

**Extension not loading:**
- Verify you're using a supported browser version
- Check that Developer mode is enabled (Chrome/Edge)
- Try reloading the extension
- Clear browser cache and cookies

**Settings not saving:**
- Ensure you've accepted the Terms and Conditions
- Check that all required fields are filled
- Verify browser storage permissions
- Try clearing and re-entering settings

### Getting Help

1. Check the extension's popup interface for error messages
2. Review the browser console for detailed error logs
3. Ensure you're using the latest version of the extension
4. Verify your browser supports the required APIs

## 🔄 Updates

### Version 1.0.0
- Initial release
- Automatic form filling
- Monthly autopay reminders
- Smart due date validation
- Cross-browser support

### Upcoming Features
- Enhanced form validation
- Multiple payment profiles
- Export/import settings
- Advanced reminder customization

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Load the extension in developer mode
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal Disclaimer

This extension is provided "AS IS" without any warranties. The developer assumes zero financial or informational responsibility. Users are solely responsible for all financial transactions and data security. This tool is not affiliated with, endorsed by, or associated with USF or USF Preschool For Creative Learning.

## 📞 Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the extension's built-in help

## 🙏 Acknowledgments

- USF Preschool For Creative Learning for providing the payment portal
- Browser extension community for development resources
- Users for feedback and suggestions

---

**⚠️ Remember: This extension only assists with form filling and reminders. You must manually complete all payment transactions. Always verify payment information before submitting.**
