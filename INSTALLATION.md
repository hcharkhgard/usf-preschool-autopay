# Installation Guide for USF Preschool Autopay Extension
## Pre-Install Consent (Recommended)

To avoid consent popups inside the extension (which some environments may block), capture consent during unzip/setup:

1. Extract the extension folder to a convenient location (e.g., Desktop).
2. Open the folder in File Explorer.
3. Double-click `preinstall_consent.bat`.
4. Read the terms (or open `CONSENT.md`), then type `YES` to accept.
5. The script will create `consent.json` in the folder.
6. Now proceed to load the extension in your browser.

If you skip this step, the extension will attempt to show an in-extension consent page.

## Load the Unpacked Extension (Chrome/Edge)

1. Open Chrome and navigate to `chrome://extensions/` (Edge: `edge://extensions/`).
2. Enable "Developer mode" (top-right toggle).
3. Click "Load unpacked" and select the extension folder.
4. Verify the extension icon appears in the toolbar.

## First Run

- If you completed the Pre-Install Consent, the extension should open normally.
- If not, a consent page may appear. If the browser blocks interaction, run `preinstall_consent.bat` and reload the extension.

## Updating / Reinstalling

When updating the extension, you generally do not need to re-accept consent if `consent.json` remains in the folder. If you remove it, you’ll be asked to accept again.


## Quick Setup

1. **Download the Extension Files**
   - Download all the files in this folder to your computer
   - Keep them in a single folder (e.g., "usf-autopay-extension")

2. **Create Icon Files**
   - You need to create three icon files: `icon16.png`, `icon48.png`, and `icon128.png`
   - You can use any image editor to create simple icons with a dollar sign ($) on a blue background
   - Or use the `create_icons.html` file in a web browser to generate them

3. **Install in Chrome/Edge**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing all the extension files
   - The extension should appear in your extensions list

4. **Install in Firefox**
   - Open Firefox and go to `about:debugging`
   - Click "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the extension folder

## First Use

1. Click the extension icon in your browser toolbar
2. Fill in all your payment information
3. Set your monthly payment amount
4. Enable auto-fill and/or autopay as desired
5. Click "Save Settings"

## Using the Extension

- **Auto-fill**: Visit the USF Preschool payment page and the form will fill automatically
- **Manual Fill**: Click the "Fill Form" button in the control panel that appears on the page
- **Autopay**: The extension will automatically open the payment page monthly and fill the form

## Important Notes

- You must still manually enter your credit card information and complete the payment
- The extension only fills out the form - it doesn't process payments
- All your information is stored locally in your browser
- Make sure you're on the official USF Preschool payment page

## Troubleshooting

- If the form doesn't fill, try refreshing the page
- Check that all required fields are filled in the extension settings
- Make sure you're on the correct USF Preschool payment page
- If autopay isn't working, check that notifications are enabled for the extension


