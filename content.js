// Content script for USF Preschool For Creative Learning Auto Reminder extension
class USFPreschoolAutopay {
  constructor() {
        this.formSelectors = {
          childLastName: 'input[name*="txtChildsLN"], input[id*="txtChildsLN"]',
          parentName: 'input[name*="txtparentsname"], input[id*="txtparentsname"]',
          email: 'input[name*="txtEmail"], input[id*="txtEmail"]',
          phone: 'input[name*="txtphone"], input[id*="txtphone"]',
          address: 'input[name*="txtaddress"], input[id*="txtaddress"]',
          city: 'input[name*="txtcity"], input[id*="txtcity"]',
          state: 'select[name*="ddlState"], select[id*="ddlState"]',
          zipCode: 'input[name*="txtZip"], input[id*="txtZip"]',
          totalAmount: 'input[name*="txttotalamount"], input[id*="txttotalamount"]',
          // Billing Information selectors (for third page)
          billingAddress1: 'input[name*="billingAddress1"], input[id*="billingAddress1"], input[name*="street1"], input[id*="street1"]',
          billingAddress2: 'input[name*="billingAddress2"], input[id*="billingAddress2"], input[name*="street2"], input[id*="street2"]',
          billingCity: 'input[name*="billingCity"], input[id*="billingCity"], input[name*="billing_city"], input[id*="billing_city"]',
          billingState: 'select[name*="billingState"], select[id*="billingState"], select[name*="billing_state"], select[id*="billing_state"]',
          billingZipCode: 'input[name*="billingZipCode"], input[id*="billingZipCode"], input[name*="billing_zip"], input[id*="billing_zip"]',
          country: 'select[name*="country"], select[id*="country"]',
          // Contact Information selectors (for third page)
          dayPhone: 'input[name*="dayPhone"], input[id*="dayPhone"], input[name*="day_phone"], input[id*="day_phone"]',
          nightPhone: 'input[name*="nightPhone"], input[id*="nightPhone"], input[name*="night_phone"], input[id*="night_phone"]',
          mobilePhone: 'input[name*="mobilePhone"], input[id*="mobilePhone"], input[name*="mobile_phone"], input[id*="mobile_phone"]'
        };
    
    this.init();
  }

  async init() {
    // Check if we're on a supported page
    if (!this.isUSFPreschoolPage() && !this.isTouchNetPage()) {
      console.log('USF Autopay: Not on supported page, extension disabled');
      return;
    }
    
    
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupFormFilling());
    } else {
      this.setupFormFilling();
    }
  }


  async setupFormFilling() {
    // Handle USF Preschool payment page
    if (this.isUSFPreschoolPage()) {
      console.log('USF Autopay: Setting up USF page functionality');
      
      // Add autopay button to the page
      this.addAutopayButton();
      
      // Initialize payment assistant
      this.initializePaymentAssistant();
      
      // Listen for storage changes to auto-fill
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.autopaySettings) {
          this.autoFillForm();
        }
      });

      // Auto-fill if settings exist
      const settings = await this.getStoredSettings();
      if (settings && settings.autoFill) {
        this.autoFillForm();
      }

      // Set up page change monitoring to handle multi-page flow
      this.setupPageChangeMonitoring();
    }
      // Handle TouchNet payment page
      else if (this.isTouchNetPage()) {
        console.log('USF Autopay: Setting up TouchNet page functionality');
        
        // Wait a moment for page to load, then try to handle payment method
        setTimeout(() => {
          this.tryHandlePaymentMethodPage();
        }, 2000);
        
        // Set up continuous monitoring for billing fields
        this.setupBillingFieldMonitoring();
      }
  }

  initializePaymentAssistant() {
    // No external assistant script required - functionality built into content script
  }

  setupPageChangeMonitoring() {
    // Monitor for page changes to handle multi-page flow
    let currentUrl = window.location.href;
    
    // Check every 2 seconds for URL changes
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('USF Autopay: Page changed to:', currentUrl);
        
        // Wait a moment for page to load, then check what page we're on
        setTimeout(() => {
          this.handlePageChange();
        }, 1000);
      }
    }, 2000);
    
    // Also check immediately in case we're already on a different page
    setTimeout(() => {
      this.handlePageChange();
    }, 2000);
  }

  setupBillingFieldMonitoring() {
    console.log('USF Autopay: Setting up continuous billing field monitoring...');
    
    // Check for billing fields every 3 seconds
    const billingMonitor = setInterval(() => {
      if (!this.isTouchNetPage()) {
        console.log('USF Autopay: No longer on TouchNet page, stopping billing monitoring');
        clearInterval(billingMonitor);
        return;
      }
      
      // Check if we have billing fields on the current page
      const billingFields = document.querySelectorAll('input[name*="address" i], input[name*="city" i], input[name*="state" i], input[name*="zip" i], input[name*="phone" i]');
      
      if (billingFields.length > 0) {
        console.log('USF Autopay: Found billing fields on page, attempting to fill...');
        this.tryHandleBillingContactPage();
        
        // If we successfully filled fields, we can stop monitoring
        setTimeout(() => {
          const filledFields = document.querySelectorAll('input[value]:not([value=""])');
          if (filledFields.length > 3) { // If we filled several fields
            console.log('USF Autopay: Billing fields filled successfully, stopping monitoring');
            clearInterval(billingMonitor);
          }
        }, 2000);
      }
    }, 3000);
    
    // Also try immediately
    setTimeout(() => {
      this.tryHandleBillingContactPage();
    }, 3000);
  }

      async handlePageChange() {
        const url = window.location.href;
        console.log('USF Autopay: Handling page change for URL:', url);
        
        // Handle different page types
        if (url.includes('cloud.usf.edu/gateway/preschool')) {
          console.log('USF Autopay: On USF page - extension active');
          // Extension is active on USF pages
        } else if (url.includes('touchnet.com')) {
          console.log('USF Autopay: On TouchNet page - handling payment method selection');
          // Handle payment method selection on TouchNet
          this.tryHandlePaymentMethodPage();
          
          // Also try to handle billing/contact page after a delay
          setTimeout(() => {
            console.log('USF Autopay: Checking for billing/contact page after payment method...');
            this.tryHandleBillingContactPage();
          }, 5000);
        } else {
          console.log('USF Autopay: On external page - extension disabled');
          // Disable extension on other external pages
          return;
        }
      }

  isUSFPreschoolPage() {
    return window.location.href.includes('cloud.usf.edu/gateway/preschool');
  }

  isTouchNetPage() {
    return window.location.href.includes('touchnet.com');
  }

  async getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['autopaySettings'], (result) => {
        resolve(result.autopaySettings);
      });
    });
  }

  addAutopayButton() {
    // Create autopay control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'usf-autopay-panel';
    controlPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff;
      border: 2px solid #0066cc;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      min-width: 250px;
    `;

    controlPanel.innerHTML = `
      <div style="margin-bottom: 10px;">
        <h3 style="margin: 0 0 10px 0; color: #0066cc; font-size: 16px;">USF Autopay</h3>
        <button id="fill-form-btn" style="
          background: #0066cc;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        ">Fill Form</button>
        <button id="clear-form-btn" style="
          background: #666;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Clear</button>
      </div>
      <div style="font-size: 12px; color: #666;">
        <div>Auto-fill: <span id="autofill-status">Off</span></div>
        <div>Next payment: <span id="next-payment">Not scheduled</span></div>
      </div>
    `;

    document.body.appendChild(controlPanel);

    // Add event listeners
    document.getElementById('fill-form-btn').addEventListener('click', () => this.autoFillForm());
    document.getElementById('clear-form-btn').addEventListener('click', () => this.clearForm());
  }

  async autoFillForm() {
    const settings = await this.getStoredSettings();
    if (!settings) {
      alert('Please configure your payment settings first by clicking the extension icon.');
      return;
    }

    try {
      // Debug: Log what fields we're looking for
      console.log('USF Autopay: Looking for fields with selectors:', this.formSelectors);
      console.log('USF Autopay: Settings:', settings);
      console.log('USF Autopay: Current URL:', window.location.href);
      console.log('USF Autopay: Page title:', document.title);

      // Wait a bit for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Debug: Check what fields are actually found
      Object.entries(this.formSelectors).forEach(([name, selector]) => {
        const field = document.querySelector(selector);
        console.log(`USF Autopay: ${name} field (${selector}):`, field ? 'FOUND' : 'NOT FOUND', field);
      });

      // Auto-inspect all fields to help find missing ones
      console.log('=== AUTO FIELD INSPECTOR ===');
      const allInputs = document.querySelectorAll('input, select, textarea');
      console.log(`USF Autopay: Found ${allInputs.length} total form elements on page`);
      
      if (allInputs.length === 0) {
        console.warn('USF Autopay: No form elements found - page may be loading or have an error');
        this.showNotification('No form fields found. Page may be loading or have an error.', 'error');
        return;
      }
      
      allInputs.forEach((field, index) => {
        console.log(`Field ${index + 1}:`, {
          tag: field.tagName,
          type: field.type,
          name: field.name,
          id: field.id,
          placeholder: field.placeholder,
          className: field.className,
          value: field.value
        });
      });
      console.log('=== END AUTO FIELD INSPECTOR ===');

      // Fill form fields
      this.fillField(this.formSelectors.childLastName, settings.childLastName);
      this.fillField(this.formSelectors.parentName, settings.parentName);
      this.fillField(this.formSelectors.email, settings.email);
      this.fillField(this.formSelectors.phone, settings.phone);
      this.fillField(this.formSelectors.address, settings.address);
      this.fillField(this.formSelectors.city, settings.city);
      this.selectState(settings.state);
      this.fillField(this.formSelectors.zipCode, settings.zipCode);
      this.fillField(this.formSelectors.totalAmount, settings.monthlyAmount);

      // Update status
      document.getElementById('autofill-status').textContent = 'On';
      
      // Show success message
      this.showNotification('Form filled successfully!', 'success');
      
      // Add form validation helper
      // this.addFormValidationHelper(); // Disabled to prevent interference with form submission
      
      // Add field inspector to help find missing fields
      this.addFieldInspector();
      
    } catch (error) {
      console.error('Error filling form:', error);
      this.showNotification('Error filling form. Please check your settings.', 'error');
    }
  }

  // Form validation helper removed to prevent interference with form submission

  fillField(selector, value) {
    if (!value) return;
    
    const field = document.querySelector(selector);
    if (field) {
      console.log(`USF Autopay: Filling ${selector} with:`, value);
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      console.log(`USF Autopay: Field not found: ${selector}`);
    }
  }

  selectState(state) {
    const stateField = document.querySelector(this.formSelectors.state);
    if (stateField && state) {
      console.log(`USF Autopay: Selecting state "${state}" in dropdown:`, stateField);
      
      if (stateField.tagName === 'SELECT') {
        // Try to find the option by value first
        let option = Array.from(stateField.options).find(opt => 
          opt.value.toLowerCase() === state.toLowerCase()
        );
        
        // If not found by value, try by text
        if (!option) {
          option = Array.from(stateField.options).find(opt => 
            opt.textContent.toLowerCase().includes(state.toLowerCase())
          );
        }
        
        if (option) {
          stateField.value = option.value;
          stateField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`USF Autopay: State selected: ${option.textContent} (${option.value})`);
        } else {
          console.warn(`USF Autopay: State "${state}" not found in dropdown options`);
          // Log all available options for debugging
          console.log('Available state options:', Array.from(stateField.options).map(opt => ({
            value: opt.value,
            text: opt.textContent
          })));
        }
      } else {
        stateField.value = state;
        stateField.dispatchEvent(new Event('input', { bubbles: true }));
        stateField.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  clearForm() {
    Object.values(this.formSelectors).forEach(selector => {
      const field = document.querySelector(selector);
      if (field) {
        field.value = '';
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    document.getElementById('autofill-status').textContent = 'Off';
    this.showNotification('Form cleared', 'info');
  }

  async tryHandlePaymentMethodPage() {
    try {
      console.log('USF Autopay: Checking for payment method page...');
      
      // Get user's preferred payment method from settings
      const settings = await this.getStoredSettings();
      const preferredMethod = settings?.paymentMethod || 'credit_card';
      console.log('USF Autopay: Preferred payment method:', preferredMethod);
      
      // Look for payment method options (could be radio buttons, dropdowns, or buttons)
      const paymentSelect = document.querySelector('select[name*="payment" i], select[id*="payment" i], select[name*="method" i], select[id*="method" i]');
      const paymentRadios = document.querySelectorAll('input[type="radio"][name*="payment" i], input[type="radio"][name*="method" i]');
      const paymentButtons = document.querySelectorAll('button[class*="payment" i], button[id*="payment" i], input[type="button"][value*="credit" i], input[type="button"][value*="card" i]');
      
      if (paymentSelect) {
        console.log('USF Autopay: Found payment dropdown');
        const optionsText = Array.from(paymentSelect.options).map(o => o.textContent.trim().toLowerCase());
        
        let desiredIndex = -1;
        if (preferredMethod === 'credit_card') {
          desiredIndex = optionsText.findIndex(t => t.includes('credit') || t.includes('card'));
        } else if (preferredMethod === 'ach') {
          desiredIndex = optionsText.findIndex(t => t.includes('ach') || t.includes('electronic') || t.includes('check'));
        }
        
        if (desiredIndex >= 0) {
          paymentSelect.selectedIndex = desiredIndex;
          paymentSelect.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`USF Autopay: Selected ${preferredMethod} in dropdown`);
        } else {
          // Fallback to first option
          paymentSelect.selectedIndex = 0;
          paymentSelect.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Selected first payment option (fallback)');
        }
      } else if (paymentRadios.length > 0) {
        console.log('USF Autopay: Found payment radio buttons');
        let selectedRadio = null;
        
        if (preferredMethod === 'credit_card') {
          selectedRadio = Array.from(paymentRadios).find(radio => 
            radio.value.toLowerCase().includes('credit') || 
            radio.value.toLowerCase().includes('card') ||
            radio.id.toLowerCase().includes('credit') ||
            radio.id.toLowerCase().includes('card')
          );
        } else if (preferredMethod === 'ach') {
          selectedRadio = Array.from(paymentRadios).find(radio => 
            radio.value.toLowerCase().includes('ach') || 
            radio.value.toLowerCase().includes('electronic') ||
            radio.value.toLowerCase().includes('check') ||
            radio.id.toLowerCase().includes('ach') ||
            radio.id.toLowerCase().includes('electronic')
          );
        }
        
        if (selectedRadio) {
          selectedRadio.checked = true;
          selectedRadio.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`USF Autopay: Selected ${preferredMethod} radio button`);
        } else if (paymentRadios[0]) {
          paymentRadios[0].checked = true;
          paymentRadios[0].dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Selected first payment option (fallback)');
        }
      } else if (paymentButtons.length > 0) {
        console.log('USF Autopay: Found payment buttons');
        let selectedButton = null;
        
        if (preferredMethod === 'credit_card') {
          selectedButton = Array.from(paymentButtons).find(btn => 
            btn.textContent.toLowerCase().includes('credit') || 
            btn.textContent.toLowerCase().includes('card') ||
            btn.value.toLowerCase().includes('credit') ||
            btn.value.toLowerCase().includes('card')
          );
        } else if (preferredMethod === 'ach') {
          selectedButton = Array.from(paymentButtons).find(btn => 
            btn.textContent.toLowerCase().includes('ach') || 
            btn.textContent.toLowerCase().includes('electronic') ||
            btn.textContent.toLowerCase().includes('check') ||
            btn.value.toLowerCase().includes('ach') ||
            btn.value.toLowerCase().includes('electronic')
          );
        }
        
        if (selectedButton) {
          selectedButton.click();
          console.log(`USF Autopay: Clicked ${preferredMethod} button`);
        }
      } else {
        console.log('USF Autopay: No payment method controls found on this page');
        return;
      }

      // Look for Continue/Next/Submit button with more comprehensive selectors
      const continueSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[name*="continue" i]',
        'button[id*="continue" i]',
        'input[name*="continue" i]',
        'input[id*="continue" i]',
        'button:contains("Continue")',
        'button:contains("Next")',
        'button:contains("Submit")',
        'input[value*="Continue" i]',
        'input[value*="Next" i]',
        'input[value*="Submit" i]',
        'button[class*="continue" i]',
        'button[class*="next" i]',
        'button[class*="submit" i]'
      ];
      
      let continueBtn = null;
      for (const selector of continueSelectors) {
        try {
          continueBtn = document.querySelector(selector);
          if (continueBtn) {
            console.log(`USF Autopay: Found continue button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Skip invalid selectors like :contains
          continue;
        }
      }
      
      // If no button found with selectors, try finding by text content
      if (!continueBtn) {
        const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (const btn of allButtons) {
          const text = (btn.textContent || btn.value || '').toLowerCase();
          if (text.includes('continue') || text.includes('next') || text.includes('submit')) {
            continueBtn = btn;
            console.log(`USF Autopay: Found continue button by text: ${text}`);
            break;
          }
        }
      }
      
          if (continueBtn) {
            console.log('USF Autopay: Found continue button, clicking in 2 seconds');
            setTimeout(() => {
              try {
                continueBtn.click();
                console.log('USF Autopay: Clicked continue button - proceeding to next page');
                
                // Show notification that we're proceeding
                this.showNotification('Payment method selected! Proceeding to billing page...', 'success');
              } catch (e) {
                console.error('USF Autopay: Error clicking continue button:', e);
              }
            }, 2000); // Increased delay to 2 seconds for better reliability
          } else {
            console.log('USF Autopay: No continue button found');
            // Log all buttons for debugging
            const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
            console.log('USF Autopay: Available buttons:', Array.from(allButtons).map(btn => ({
              tag: btn.tagName,
              type: btn.type,
              text: btn.textContent,
              value: btn.value,
              id: btn.id,
              name: btn.name,
              className: btn.className
            })));
          }
    } catch (e) {
      console.warn('USF Autopay: Payment method step assist skipped:', e);
    }
  }

  async tryHandleBillingContactPage() {
    try {
      console.log('USF Autopay: Attempting to fill billing/contact page...');
      const settings = await this.getStoredSettings();
      if (!settings) {
        console.log('USF Autopay: No settings found for billing/contact page');
        return;
      }

      console.log('USF Autopay: Settings for billing/contact:', settings);
      
      // First, let's inspect all form fields on this page to see what we're working with
      console.log('USF Autopay: Adding field inspector to see available fields...');
      this.addFieldInspector();
      
      // Also try a more aggressive approach to find any input fields
      console.log('USF Autopay: Looking for all input fields on the page...');
      const allInputs = document.querySelectorAll('input, select, textarea');
      console.log('USF Autopay: Found', allInputs.length, 'form elements');
      allInputs.forEach((input, index) => {
        console.log(`Field ${index + 1}:`, {
          tag: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className,
          value: input.value
        });
      });

          // Use the new form selectors for billing and contact information
          const billingFields = {
            billingAddress1: settings.billingAddress1 || settings.address,
            billingAddress2: settings.billingAddress2 || '',
            billingCity: settings.billingCity || settings.city,
            billingState: settings.billingState || settings.state,
            billingZipCode: settings.billingZipCode || settings.zipCode,
            country: settings.country || 'United States',
            email: settings.email || '',
            dayPhone: settings.dayPhone || settings.phone,
            nightPhone: settings.nightPhone || '',
            mobilePhone: settings.mobilePhone || ''
          };

      let filledAny = false;

      // Fill billing address fields - try multiple common selectors
      if (billingFields.billingAddress1) {
        const address1Selectors = [
          'input[name*="address1" i]',
          'input[id*="address1" i]',
          'input[name*="street1" i]',
          'input[id*="street1" i]',
          'input[name*="billingAddress1" i]',
          'input[id*="billingAddress1" i]',
          'input[placeholder*="Street Address" i]',
          'input[placeholder*="Address 1" i]',
          'input[placeholder*="Address Line 1" i]'
        ];
        
        let address1Field = null;
        for (const selector of address1Selectors) {
          address1Field = document.querySelector(selector);
          if (address1Field) {
            console.log('USF Autopay: Found billing address 1 with selector:', selector);
            break;
          }
        }
        
        if (address1Field) {
          address1Field.value = billingFields.billingAddress1;
          address1Field.dispatchEvent(new Event('input', { bubbles: true }));
          address1Field.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Filled billing address 1');
          filledAny = true;
        } else {
          console.log('USF Autopay: Billing address 1 field not found with any selector');
        }
      }

      if (billingFields.billingAddress2) {
        const address2Selectors = [
          'input[name*="address2" i]',
          'input[id*="address2" i]',
          'input[name*="street2" i]',
          'input[id*="street2" i]',
          'input[name*="billingAddress2" i]',
          'input[id*="billingAddress2" i]',
          'input[placeholder*="Address 2" i]',
          'input[placeholder*="Address Line 2" i]'
        ];
        
        let address2Field = null;
        for (const selector of address2Selectors) {
          address2Field = document.querySelector(selector);
          if (address2Field) {
            console.log('USF Autopay: Found billing address 2 with selector:', selector);
            break;
          }
        }
        
        if (address2Field) {
          address2Field.value = billingFields.billingAddress2;
          address2Field.dispatchEvent(new Event('input', { bubbles: true }));
          address2Field.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Filled billing address 2');
          filledAny = true;
        }
      }

      if (billingFields.billingCity) {
        const citySelectors = [
          'input[name*="city" i]',
          'input[id*="city" i]',
          'input[name*="billingCity" i]',
          'input[id*="billingCity" i]',
          'input[placeholder*="City" i]'
        ];
        
        let cityField = null;
        for (const selector of citySelectors) {
          cityField = document.querySelector(selector);
          if (cityField) {
            console.log('USF Autopay: Found billing city with selector:', selector);
            break;
          }
        }
        
        if (cityField) {
          cityField.value = billingFields.billingCity;
          cityField.dispatchEvent(new Event('input', { bubbles: true }));
          cityField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Filled billing city');
          filledAny = true;
        }
      }

      if (billingFields.billingState) {
        const stateSelectors = [
          'select[name*="state" i]',
          'select[id*="state" i]',
          'input[name*="state" i]',
          'input[id*="state" i]',
          'select[name*="billingState" i]',
          'select[id*="billingState" i]'
        ];
        
        let stateField = null;
        for (const selector of stateSelectors) {
          stateField = document.querySelector(selector);
          if (stateField) {
            console.log('USF Autopay: Found billing state with selector:', selector);
            break;
          }
        }
        
        if (stateField) {
          if (stateField.tagName === 'SELECT') {
            this.selectState(stateField, billingFields.billingState);
            console.log('USF Autopay: Selected billing state');
          } else {
            stateField.value = billingFields.billingState;
            stateField.dispatchEvent(new Event('input', { bubbles: true }));
            stateField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('USF Autopay: Filled billing state');
          }
          filledAny = true;
        }
      }

      if (billingFields.billingZipCode) {
        const zipSelectors = [
          'input[name*="zip" i]',
          'input[id*="zip" i]',
          'input[name*="postal" i]',
          'input[id*="postal" i]',
          'input[name*="billingZip" i]',
          'input[id*="billingZip" i]',
          'input[placeholder*="Zip" i]',
          'input[placeholder*="Postal" i]'
        ];
        
        let zipField = null;
        for (const selector of zipSelectors) {
          zipField = document.querySelector(selector);
          if (zipField) {
            console.log('USF Autopay: Found billing zip with selector:', selector);
            break;
          }
        }
        
        if (zipField) {
          zipField.value = billingFields.billingZipCode;
          zipField.dispatchEvent(new Event('input', { bubbles: true }));
          zipField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Filled billing zip code');
          filledAny = true;
        }
      }

          if (billingFields.country) {
            const countryField = document.querySelector(this.formSelectors.country);
            if (countryField) {
              if (countryField.tagName === 'SELECT') {
                // Try to find matching country option
                let matched = false;
                for (const option of countryField.options) {
                  if (option.value.toLowerCase() === billingFields.country.toLowerCase() || 
                      option.textContent.toLowerCase().includes(billingFields.country.toLowerCase())) {
                    countryField.value = option.value;
                    countryField.dispatchEvent(new Event('change', { bubbles: true }));
                    matched = true;
                    break;
                  }
                }
                if (matched) {
                  console.log('USF Autopay: Selected country');
                  filledAny = true;
                }
              } else {
                countryField.value = billingFields.country;
                countryField.dispatchEvent(new Event('input', { bubbles: true }));
                countryField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('USF Autopay: Filled country');
                filledAny = true;
              }
            }
          }

          // Fill email field
          if (billingFields.email) {
            const emailSelectors = [
              'input[name*="email" i]',
              'input[id*="email" i]',
              'input[type="email"]',
              'input[placeholder*="Email" i]',
              'input[placeholder*="E-mail" i]'
            ];
            
            let emailField = null;
            for (const selector of emailSelectors) {
              emailField = document.querySelector(selector);
              if (emailField) {
                console.log('USF Autopay: Found email field with selector:', selector);
                break;
              }
            }
            
            if (emailField) {
              emailField.value = billingFields.email;
              emailField.dispatchEvent(new Event('input', { bubbles: true }));
              emailField.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('USF Autopay: Filled email field');
              filledAny = true;
            } else {
              console.log('USF Autopay: Email field not found with any selector');
            }
          }

      // Fill contact information fields
      if (billingFields.dayPhone) {
        const dayPhoneSelectors = [
          'input[name*="dayPhone" i]',
          'input[id*="dayPhone" i]',
          'input[name*="day_phone" i]',
          'input[id*="day_phone" i]',
          'input[name*="day" i][name*="phone" i]',
          'input[type="tel"]',
          'input[placeholder*="Day Phone" i]',
          'input[placeholder*="Phone" i]'
        ];
        
        let dayPhoneField = null;
        for (const selector of dayPhoneSelectors) {
          dayPhoneField = document.querySelector(selector);
          if (dayPhoneField) {
            console.log('USF Autopay: Found day phone with selector:', selector);
            break;
          }
        }
        
        if (dayPhoneField) {
          dayPhoneField.value = billingFields.dayPhone;
          dayPhoneField.dispatchEvent(new Event('input', { bubbles: true }));
          dayPhoneField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Filled day phone');
          filledAny = true;
        }
      }

      if (billingFields.nightPhone) {
        const nightPhoneSelectors = [
          'input[name*="nightPhone" i]',
          'input[id*="nightPhone" i]',
          'input[name*="night_phone" i]',
          'input[id*="night_phone" i]',
          'input[name*="night" i][name*="phone" i]',
          'input[placeholder*="Night Phone" i]'
        ];
        
        let nightPhoneField = null;
        for (const selector of nightPhoneSelectors) {
          nightPhoneField = document.querySelector(selector);
          if (nightPhoneField) {
            console.log('USF Autopay: Found night phone with selector:', selector);
            break;
          }
        }
        
        if (nightPhoneField) {
          nightPhoneField.value = billingFields.nightPhone;
          nightPhoneField.dispatchEvent(new Event('input', { bubbles: true }));
          nightPhoneField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Filled night phone');
          filledAny = true;
        }
      }

      if (billingFields.mobilePhone) {
        const mobilePhoneSelectors = [
          'input[name*="mobilePhone" i]',
          'input[id*="mobilePhone" i]',
          'input[name*="mobile_phone" i]',
          'input[id*="mobile_phone" i]',
          'input[name*="mobile" i][name*="phone" i]',
          'input[name*="cell" i]',
          'input[id*="cell" i]',
          'input[placeholder*="Mobile Phone" i]',
          'input[placeholder*="Cell Phone" i]'
        ];
        
        let mobilePhoneField = null;
        for (const selector of mobilePhoneSelectors) {
          mobilePhoneField = document.querySelector(selector);
          if (mobilePhoneField) {
            console.log('USF Autopay: Found mobile phone with selector:', selector);
            break;
          }
        }
        
        if (mobilePhoneField) {
          mobilePhoneField.value = billingFields.mobilePhone;
          mobilePhoneField.dispatchEvent(new Event('input', { bubbles: true }));
          mobilePhoneField.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('USF Autopay: Filled mobile phone');
          filledAny = true;
        }
      }

      // If no fields were filled with our specific selectors, try a more general approach
      if (!filledAny) {
        console.log('USF Autopay: Trying general field filling approach...');
        const generalFilled = this.tryGeneralFieldFilling(billingFields);
        if (!generalFilled) {
          console.log('USF Autopay: Trying aggressive field filling approach...');
          this.tryAggressiveFieldFilling(billingFields);
        }
      }

      if (filledAny) {
        this.showNotification('Billing and contact information filled successfully!', 'success');
        console.log('USF Autopay: Billing/contact page filled successfully');
      } else {
        console.log('USF Autopay: No billing/contact fields found to fill');
        this.showNotification('Could not find billing fields to fill. Please check console for field details.', 'error');
      }
    } catch (e) {
      console.warn('USF Autopay: Billing/contact step assist skipped:', e);
    }
  }

  tryGeneralFieldFilling(billingFields) {
    try {
      console.log('USF Autopay: Attempting general field filling...');
      
      // Get all input fields on the page
      const allInputs = document.querySelectorAll('input, select, textarea');
      let filledCount = 0;
      
      allInputs.forEach((field, index) => {
        const fieldName = (field.name || field.id || '').toLowerCase();
        const fieldType = field.type ? field.type.toLowerCase() : '';
        const fieldPlaceholder = (field.placeholder || '').toLowerCase();
        
        console.log(`Field ${index + 1}: name="${field.name}", id="${field.id}", type="${field.type}", placeholder="${field.placeholder}"`);
        
        // Try to match fields by name, id, or placeholder
        if (fieldName.includes('address') || fieldPlaceholder.includes('address')) {
          if (fieldName.includes('1') || fieldPlaceholder.includes('1') || fieldName.includes('street')) {
            if (billingFields.billingAddress1) {
              field.value = billingFields.billingAddress1;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('USF Autopay: Filled address field 1');
              filledCount++;
            }
          } else if (fieldName.includes('2') || fieldPlaceholder.includes('2')) {
            if (billingFields.billingAddress2) {
              field.value = billingFields.billingAddress2;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('USF Autopay: Filled address field 2');
              filledCount++;
            }
          }
        }
        
        if (fieldName.includes('city') || fieldPlaceholder.includes('city')) {
          if (billingFields.billingCity) {
            field.value = billingFields.billingCity;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('USF Autopay: Filled city field');
            filledCount++;
          }
        }
        
        if (fieldName.includes('state') || fieldPlaceholder.includes('state')) {
          if (billingFields.billingState) {
            if (field.tagName === 'SELECT') {
              this.selectState(field, billingFields.billingState);
              console.log('USF Autopay: Selected state');
            } else {
              field.value = billingFields.billingState;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('USF Autopay: Filled state field');
            }
            filledCount++;
          }
        }
        
        if (fieldName.includes('zip') || fieldName.includes('postal') || fieldPlaceholder.includes('zip') || fieldPlaceholder.includes('postal')) {
          if (billingFields.billingZipCode) {
            field.value = billingFields.billingZipCode;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('USF Autopay: Filled zip field');
            filledCount++;
          }
        }
        
        if (fieldName.includes('country') || fieldPlaceholder.includes('country')) {
          if (billingFields.country) {
            if (field.tagName === 'SELECT') {
              // Try to find matching country option
              for (const option of field.options) {
                if (option.value.toLowerCase() === billingFields.country.toLowerCase() || 
                    option.textContent.toLowerCase().includes(billingFields.country.toLowerCase())) {
                  field.value = option.value;
                  field.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log('USF Autopay: Selected country');
                  filledCount++;
                  break;
                }
              }
            } else {
              field.value = billingFields.country;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('USF Autopay: Filled country field');
              filledCount++;
            }
          }
        }
        
            if (fieldName.includes('email') || fieldPlaceholder.includes('email') || fieldPlaceholder.includes('e-mail')) {
              if (billingFields.email) {
                field.value = billingFields.email;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('USF Autopay: Filled email field');
                filledCount++;
              }
            }
            
            if (fieldName.includes('phone') || fieldName.includes('tel') || fieldPlaceholder.includes('phone')) {
              if (fieldName.includes('day') || fieldPlaceholder.includes('day')) {
                if (billingFields.dayPhone) {
                  field.value = billingFields.dayPhone;
                  field.dispatchEvent(new Event('input', { bubbles: true }));
                  field.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log('USF Autopay: Filled day phone');
                  filledCount++;
                }
              } else if (fieldName.includes('night') || fieldPlaceholder.includes('night')) {
                if (billingFields.nightPhone) {
                  field.value = billingFields.nightPhone;
                  field.dispatchEvent(new Event('input', { bubbles: true }));
                  field.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log('USF Autopay: Filled night phone');
                  filledCount++;
                }
              } else if (fieldName.includes('mobile') || fieldName.includes('cell') || fieldPlaceholder.includes('mobile') || fieldPlaceholder.includes('cell')) {
                if (billingFields.mobilePhone) {
                  field.value = billingFields.mobilePhone;
                  field.dispatchEvent(new Event('input', { bubbles: true }));
                  field.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log('USF Autopay: Filled mobile phone');
                  filledCount++;
                }
              } else if (billingFields.dayPhone) {
                // If it's a generic phone field, use day phone
                field.value = billingFields.dayPhone;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('USF Autopay: Filled generic phone field');
                filledCount++;
              }
            }
      });
      
      console.log(`USF Autopay: General field filling completed. Filled ${filledCount} fields.`);
      
      if (filledCount > 0) {
        this.showNotification(`Filled ${filledCount} billing/contact fields using general approach!`, 'success');
        return true;
      }
      
      return false;
    } catch (e) {
      console.log('USF Autopay: Error in general field filling:', e);
      return false;
    }
  }

  tryAggressiveFieldFilling(billingFields) {
    try {
      console.log('USF Autopay: Attempting aggressive field filling...');
      
      // Get all input fields on the page
      const allInputs = document.querySelectorAll('input, select, textarea');
      let filledCount = 0;
      
      // Create an array of values to fill in order
      const valuesToFill = [
        billingFields.billingAddress1,
        billingFields.billingAddress2,
        billingFields.billingCity,
        billingFields.billingState,
        billingFields.billingZipCode,
        billingFields.country,
        billingFields.email,
        billingFields.dayPhone,
        billingFields.nightPhone,
        billingFields.mobilePhone
      ].filter(value => value && value.trim() !== ''); // Only non-empty values
      
      console.log('USF Autopay: Values to fill:', valuesToFill);
      console.log('USF Autopay: Found', allInputs.length, 'input fields');
      
      // Try to fill fields in order, skipping hidden fields and already filled fields
      allInputs.forEach((field, index) => {
        if (field.type === 'hidden' || field.disabled || field.readOnly) {
          return; // Skip hidden, disabled, or read-only fields
        }
        
        if (field.value && field.value.trim() !== '') {
          return; // Skip already filled fields
        }
        
        // Try to fill with the next available value
        if (filledCount < valuesToFill.length) {
          const valueToFill = valuesToFill[filledCount];
          
          if (field.tagName === 'SELECT') {
            // For select fields, try to find matching option
            let matched = false;
            for (const option of field.options) {
              if (option.value.toLowerCase() === valueToFill.toLowerCase() || 
                  option.textContent.toLowerCase().includes(valueToFill.toLowerCase())) {
                field.value = option.value;
                field.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`USF Autopay: Filled select field ${index + 1} with: ${valueToFill}`);
                filledCount++;
                matched = true;
                break;
              }
            }
            if (!matched) {
              // If no exact match, try the first non-empty option
              for (const option of field.options) {
                if (option.value && option.value.trim() !== '') {
                  field.value = option.value;
                  field.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(`USF Autopay: Filled select field ${index + 1} with first option: ${option.value}`);
                  filledCount++;
                  break;
                }
              }
            }
          } else {
            // For input fields, fill with the value
            field.value = valueToFill;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`USF Autopay: Filled input field ${index + 1} with: ${valueToFill}`);
            filledCount++;
          }
        }
      });
      
      console.log(`USF Autopay: Aggressive field filling completed. Filled ${filledCount} fields.`);
      
      if (filledCount > 0) {
        this.showNotification(`Filled ${filledCount} fields using aggressive approach!`, 'success');
        return true;
      }
      
      return false;
    } catch (e) {
      console.log('USF Autopay: Error in aggressive field filling:', e);
      return false;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 10001;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  async sendEmailReminder(title, message, settings) {
    try {
      // Create email content
      const emailSubject = `USF Preschool Payment Reminder - ${title}`;
      const emailBody = `
Dear ${settings.parentName},

${message}

Payment Details:
- Child: ${settings.childLastName}
- Amount: $${settings.monthlyAmount}
- Due Date: ${new Date(settings.paymentDate).toLocaleDateString()}
- Payment Method: ${settings.paymentMethod === 'credit_card' ? 'Credit Card' : 'Electronic Check (ACH)'}

To make your payment, please visit:
https://cloud.usf.edu/gateway/preschool/

This is an automated reminder from the USF Preschool Payment Assistant.

Best regards,
USF Preschool Payment Assistant
      `.trim();

      // Create mailto link
      const mailtoLink = `mailto:${settings.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open default email client
      window.open(mailtoLink, '_blank');
      
      console.log('Email reminder prepared and opened in default email client');
      this.showNotification('Email reminder opened in your default email client', 'success');
      
    } catch (error) {
      console.error('Error sending email reminder:', error);
      this.showNotification('Error preparing email reminder', 'error');
    }
  }

  addFieldInspector() {
    // Add a button to inspect all form fields on the page
    const inspectBtn = document.createElement('button');
    inspectBtn.textContent = 'Inspect Fields';
    inspectBtn.style.cssText = `
      background: #ff9800;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 8px;
    `;
    
    inspectBtn.addEventListener('click', () => {
      console.log('=== USF FORM FIELD INSPECTOR ===');
      const allInputs = document.querySelectorAll('input, select, textarea');
      allInputs.forEach((field, index) => {
        console.log(`Field ${index + 1}:`, {
          tag: field.tagName,
          type: field.type,
          name: field.name,
          id: field.id,
          placeholder: field.placeholder,
          className: field.className,
          value: field.value
        });
      });
      console.log('=== END FIELD INSPECTOR ===');
    });
    
    // Add to the control panel
    const controlPanel = document.getElementById('usf-autopay-panel');
    if (controlPanel) {
      const buttonContainer = controlPanel.querySelector('div');
      buttonContainer.appendChild(inspectBtn);
    }
  }

  displayFullScreenReminder(title, message, settings = null) {
    console.log('USF Autopay: Displaying full-screen reminder');
    
    // Remove any existing reminder
    const existingReminder = document.querySelector('.usf-autopay-fullscreen-reminder');
    if (existingReminder) {
      existingReminder.remove();
    }
    
    // Create full-screen reminder overlay
    const overlay = document.createElement('div');
    overlay.className = 'usf-autopay-fullscreen-reminder';
    overlay.innerHTML = `
      <div class="reminder-container">
        <div class="reminder-header">
          <div class="reminder-icon">⚠️</div>
          <h1 class="reminder-title">${title}</h1>
        </div>
        <div class="reminder-body">
          <p class="reminder-message">${message}</p>
          ${settings ? `
            <div class="reminder-details">
              <div class="detail-item">
                <strong>Child:</strong> ${settings.childLastName || 'N/A'}
              </div>
              <div class="detail-item">
                <strong>Amount:</strong> $${settings.monthlyAmount || '0'}
              </div>
              <div class="detail-item">
                <strong>Due Date:</strong> ${new Date(settings.paymentDate || new Date()).toLocaleDateString()}
              </div>
              <div class="detail-item">
                <strong>Payment Method:</strong> ${settings.paymentMethod === 'credit_card' ? 'Credit Card' : 'Electronic Check (ACH)'}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="reminder-actions">
          <button class="reminder-btn pay-now" id="reminder-pay-now">
            <span class="btn-icon">💳</span>
            Pay Now
          </button>
          <button class="reminder-btn remind-later" id="reminder-remind-later">
            <span class="btn-icon">⏰</span>
            Remind Me Later
          </button>
          <button class="reminder-btn acknowledge" id="reminder-acknowledge">
            <span class="btn-icon">✓</span>
            Acknowledgment
          </button>
        </div>
      </div>
    `;

    // Add styles if not already present
    if (!document.querySelector('#usf-autopay-reminder-styles')) {
      const style = document.createElement('style');
      style.id = 'usf-autopay-reminder-styles';
      style.textContent = `
        .usf-autopay-fullscreen-reminder {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.95);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .reminder-container {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: slideIn 0.4s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .reminder-header {
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          color: white;
          padding: 30px;
          border-radius: 20px 20px 0 0;
          text-align: center;
          position: relative;
        }
        
        .reminder-icon {
          font-size: 60px;
          margin-bottom: 15px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .reminder-title {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .reminder-body {
          padding: 40px 30px;
          background: white;
          text-align: center;
        }
        
        .reminder-message {
          font-size: 20px;
          line-height: 1.6;
          color: #2c3e50;
          margin-bottom: 30px;
          font-weight: 500;
        }
        
        .reminder-details {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 30px;
          text-align: left;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
          font-size: 16px;
        }
        
        .detail-item:last-child {
          border-bottom: none;
        }
        
        .reminder-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 0 30px 30px;
        }
        
        .reminder-btn {
          padding: 15px 25px;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .reminder-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .reminder-btn:active {
          transform: translateY(-1px);
        }
        
        .reminder-btn.pay-now {
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
          box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
        }
        
        .reminder-btn.pay-now:hover {
          background: linear-gradient(135deg, #229954, #27ae60);
          box-shadow: 0 10px 25px rgba(46, 204, 113, 0.6);
        }
        
        .reminder-btn.remind-later {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          box-shadow: 0 5px 15px rgba(243, 156, 18, 0.4);
        }
        
        .reminder-btn.remind-later:hover {
          background: linear-gradient(135deg, #e67e22, #d35400);
          box-shadow: 0 10px 25px rgba(243, 156, 18, 0.6);
        }
        
        .reminder-btn.acknowledge {
          background: linear-gradient(135deg, #95a5a6, #7f8c8d);
          color: white;
          box-shadow: 0 5px 15px rgba(149, 165, 166, 0.4);
        }
        
        .reminder-btn.acknowledge:hover {
          background: linear-gradient(135deg, #7f8c8d, #6c7b7d);
          box-shadow: 0 10px 25px rgba(149, 165, 166, 0.6);
        }
        
        .btn-icon {
          font-size: 20px;
        }
        
        @media (max-width: 600px) {
          .reminder-container {
            width: 95%;
            margin: 20px;
          }
          
          .reminder-title {
            font-size: 24px;
          }
          
          .reminder-message {
            font-size: 18px;
          }
          
          .reminder-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .reminder-btn {
            width: 100%;
            max-width: 250px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Add event listeners
    const payNowBtn = overlay.querySelector('#reminder-pay-now');
    const remindLaterBtn = overlay.querySelector('#reminder-remind-later');
    const acknowledgeBtn = overlay.querySelector('#reminder-acknowledge');

    payNowBtn.addEventListener('click', async () => {
      console.log('USF Autopay: Pay Now clicked - disabling reminders for this period');
      overlay.remove();
      
      // Disable reminders for this payment period only
      try {
        const result = await chrome.storage.local.get(['autopaySettings']);
        const settings = result.autopaySettings || {};
        settings.remindersDisabled = true;
        settings.disabledReason = 'User selected Pay Now';
        settings.disabledTimestamp = new Date().toISOString();
        
        await chrome.storage.local.set({ autopaySettings: settings });
        
        // Clear current alarms (new ones will be scheduled for next period)
        await chrome.alarms.clearAll();
        
        // Show confirmation
        this.showNotification('✅ Reminders disabled for this payment period! They will automatically re-enable for the next period.', 'success');
        
        console.log('USF Autopay: Reminders disabled for this payment period');
      } catch (error) {
        console.error('Error disabling reminders:', error);
      }
    });

    remindLaterBtn.addEventListener('click', async () => {
      console.log('USF Autopay: Remind Me Later clicked');
      overlay.remove();
      
      // Schedule reminder for 24 hours later
      try {
        const remindTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        await chrome.alarms.create('usfAutopay', {
          when: remindTime
        });
        
        this.showNotification('⏰ Reminder scheduled for 24 hours from now', 'info');
        
        console.log('USF Autopay: Reminder scheduled for 24 hours later');
      } catch (error) {
        console.error('Error scheduling reminder:', error);
      }
    });

    acknowledgeBtn.addEventListener('click', () => {
      console.log('USF Autopay: Acknowledgment clicked');
      overlay.remove();
      
      // Just acknowledge and close
      this.showNotification('✓ Acknowledged - Next reminder will be shown as scheduled', 'info');
    });

    // Add to page
    document.body.appendChild(overlay);
    
    // Prevent scrolling when reminder is shown
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when reminder is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const removedNodes = Array.from(mutation.removedNodes);
          if (removedNodes.includes(overlay)) {
            document.body.style.overflow = '';
            observer.disconnect();
          }
        }
      });
    });
    observer.observe(document.body, { childList: true });
  }
}

// Initialize the autopay functionality
new USFPreschoolAutopay();
