# 📥 Installation Guide - USF Preschool Autopay Extension

This comprehensive guide will walk you through installing the USF Preschool Autopay Extension on different browsers.

## 📋 Prerequisites

Before installing the extension, ensure you have:

- **Chrome 88+**, **Edge 88+**, or **Firefox 78+**
- Access to the USF Preschool payment portal
- Administrator privileges (for some installation methods)
- A stable internet connection

## 🔧 Installation Methods

### Method 1: Load Unpacked Extension (Recommended)

This method is best for developers or users who want the latest version directly from the source code.

#### Step 1: Download the Extension

**Option A: Download ZIP**
1. Go to the [GitHub repository](https://github.com/yourusername/usf-preschool-autopay)
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to a convenient location (e.g., Desktop)

**Option B: Clone with Git**
```bash
git clone https://github.com/yourusername/usf-preschool-autopay.git
cd usf-preschool-autopay
```

#### Step 2: Install in Chrome/Edge

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in the address bar
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner
   - You should see additional buttons appear

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the folder containing `manifest.json`
   - Select the folder and click "Select Folder"

4. **Verify Installation**
   - The extension should appear in your extensions list
   - You should see the extension icon in your browser toolbar

#### Step 3: Install in Firefox

1. **Open Firefox Debugging Page**
   - Type `about:debugging` in the address bar
   - Click "This Firefox" in the left sidebar

2. **Load Temporary Add-on**
   - Click "Load Temporary Add-on"
   - Navigate to the extension folder
   - Select the `manifest.json` file

3. **Verify Installation**
   - The extension should appear in the temporary add-ons list
   - You should see the extension icon in your browser toolbar

### Method 2: Chrome Web Store (Coming Soon)

Once the extension is published to the Chrome Web Store:

1. **Visit the Chrome Web Store**
   - Go to [Chrome Web Store](https://chrome.google.com/webstore)
   - Search for "USF Preschool Autopay"

2. **Install the Extension**
   - Click "Add to Chrome"
   - Confirm the installation
   - The extension will be automatically installed

### Method 3: Firefox Add-ons (Coming Soon)

Once the extension is published to Firefox Add-ons:

1. **Visit Firefox Add-ons**
   - Go to [Firefox Add-ons](https://addons.mozilla.org)
   - Search for "USF Preschool Autopay"

2. **Install the Extension**
   - Click "Add to Firefox"
   - Confirm the installation
   - The extension will be automatically installed

## 🖼️ Visual Installation Guide

### Chrome Installation Screenshots

#### Step 1: Enable Developer Mode
![Chrome Developer Mode](https://via.placeholder.com/800x400/4285f4/ffffff?text=Chrome+Developer+Mode+Enabled)

#### Step 2: Load Unpacked Extension
![Load Unpacked](https://via.placeholder.com/800x400/34a853/ffffff?text=Load+Unpacked+Extension)

#### Step 3: Select Extension Folder
![Select Folder](https://via.placeholder.com/800x400/ea4335/ffffff?text=Select+Extension+Folder)

#### Step 4: Extension Installed
![Extension Installed](https://via.placeholder.com/800x400/ff9800/ffffff?text=Extension+Successfully+Installed)

### Firefox Installation Screenshots

#### Step 1: Open Debugging Page
![Firefox Debugging](https://via.placeholder.com/800x400/ff7139/ffffff?text=Firefox+Debugging+Page)

#### Step 2: Load Temporary Add-on
![Load Add-on](https://via.placeholder.com/800x400/00a9e0/ffffff?text=Load+Temporary+Add-on)

#### Step 3: Select Manifest File
![Select Manifest](https://via.placeholder.com/800x400/ff4f00/ffffff?text=Select+Manifest+File)

## ⚙️ First-Time Setup

After installation, you need to configure the extension:

### Step 1: Accept Terms and Conditions

1. **Click the Extension Icon**
   - Look for the extension icon in your browser toolbar
   - Click to open the popup

2. **Read the Terms**
   - Click "Terms and Conditions" link
   - Read through the legal disclaimer
   - Click "I Understand" to close

3. **Accept Terms**
   - Check the "I have read and agree to the Terms and Conditions" checkbox
   - This enables the configuration options

### Step 2: Configure Payment Information

1. **Fill Required Fields**
   - Child's Last Name
   - Parent's Name
   - Email Address
   - Phone Number
   - Complete Address Information
   - Billing Address Details

2. **Set Payment Preferences**
   - Monthly Payment Amount
   - Next Payment Date
   - Reminder Time
   - Payment Method (Credit Card or ACH)

3. **Enable Features**
   - Auto-fill forms when visiting USF Preschool page
   - Enable monthly auto-reminder

### Step 3: Save Settings

1. **Click "Save Settings"**
   - Verify all required fields are filled
   - Ensure terms are accepted
   - Click the blue "Save Settings" button

2. **Verify Configuration**
   - Check that the status shows "Auto-reminder: Active"
   - Confirm your settings are saved

## 🔍 Verification Steps

After installation, verify everything is working:

### 1. Check Extension Status
- Extension icon appears in toolbar
- Popup opens when clicked
- Settings can be saved and loaded

### 2. Test Auto-Fill
- Navigate to USF Preschool payment page
- Form should auto-fill with your information
- Manual "Fill Form" button should work

### 3. Test Reminders
- Check that reminders are scheduled
- Verify notification permissions are granted
- Test the "Pay Now" functionality

## 🐛 Troubleshooting

### Common Installation Issues

#### Extension Won't Load

**Problem**: Extension fails to load or shows errors

**Solutions**:
- Ensure you're using a supported browser version
- Check that Developer mode is enabled (Chrome/Edge)
- Verify the manifest.json file is present
- Try reloading the extension

#### Missing Extension Icon

**Problem**: Extension installed but icon not visible

**Solutions**:
- Check if extension is enabled in extensions page
- Look for the icon in the extensions menu
- Try pinning the extension to toolbar
- Restart the browser

#### Permission Errors

**Problem**: Extension requests permissions but fails

**Solutions**:
- Grant all requested permissions
- Check browser security settings
- Disable conflicting extensions temporarily
- Try incognito/private mode

#### Settings Not Saving

**Problem**: Configuration changes don't persist

**Solutions**:
- Ensure you've accepted Terms and Conditions
- Check browser storage permissions
- Clear browser cache and cookies
- Try disabling other extensions

### Browser-Specific Issues

#### Chrome Issues

**Extension Disabled by Policy**
- Check Chrome policies
- Contact system administrator
- Try installing in user profile

**Manifest V3 Compatibility**
- Ensure using Chrome 88+
- Check for manifest errors
- Update to latest Chrome version

#### Firefox Issues

**Temporary Add-on Expires**
- Reinstall every 24 hours
- Use Firefox Developer Edition
- Consider permanent installation

**Permission Denied**
- Check Firefox security settings
- Allow installation from unknown sources
- Update Firefox to latest version

#### Edge Issues

**Extension Not Loading**
- Enable Developer mode
- Check Edge security settings
- Try Chrome Web Store version

## 🔄 Updating the Extension

### Manual Updates

1. **Download Latest Version**
   - Get the latest code from GitHub
   - Replace existing files

2. **Reload Extension**
   - Go to extensions page
   - Click reload button
   - Or remove and reinstall

### Automatic Updates

- Chrome Web Store: Updates automatically
- Firefox Add-ons: Updates automatically
- Manual installation: Requires manual updates

## 🗑️ Uninstalling the Extension

### Chrome/Edge

1. Go to `chrome://extensions/` (Edge: `edge://extensions/`)
2. Find the USF Preschool Autopay Extension
3. Click "Remove"
4. Confirm removal

### Firefox

1. Go to `about:addons`
2. Find the extension
3. Click "Remove"
4. Confirm removal

## 📞 Getting Help

If you encounter issues not covered in this guide:

1. **Check the FAQ** in the main README
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Contact support** through the extension popup

## ✅ Installation Checklist

- [ ] Browser version is supported
- [ ] Extension files downloaded
- [ ] Developer mode enabled (Chrome/Edge)
- [ ] Extension loaded successfully
- [ ] Extension icon visible in toolbar
- [ ] Terms and Conditions accepted
- [ ] Payment information configured
- [ ] Settings saved successfully
- [ ] Auto-fill tested on USF page
- [ ] Reminders scheduled properly

## 🎉 Success!

Once you've completed all steps, your USF Preschool Autopay Extension should be fully functional. You can now:

- Automatically fill payment forms
- Receive monthly payment reminders
- Manage your payment settings
- Use the "Pay Now" feature

Remember: The extension only fills forms and sends reminders. You must still manually complete the actual payment transaction.

---

**Need more help?** Check out our [main README](README.md) or [create an issue](https://github.com/yourusername/usf-preschool-autopay/issues) on GitHub.
