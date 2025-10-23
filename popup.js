// Popup script for USF Preschool For Creative Learning Auto Reminder
class PopupManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
    this.setupMessageListener();
  }

  setupEventListeners() {
    document.getElementById('saveSettings').addEventListener('click', async () => {
      await this.validateAndAdjustDueDate(); // Validate date before saving
      this.saveSettings();
    });
    document.getElementById('payNow').addEventListener('click', () => this.payNow());
    document.getElementById('clearSettings').addEventListener('click', () => this.clearSettings());
    document.getElementById('viewTerms').addEventListener('click', (e) => {
      e.preventDefault();
      this.showTermsAndConditions();
    });
    
    // Handle consent checkbox change
    document.getElementById('acceptTerms').addEventListener('change', () => {
      this.handleConsentChange();
    });
    
    // Handle payment date change for validation
    document.getElementById('paymentDate').addEventListener('change', async () => {
      await this.validateAndAdjustDueDate();
    });
    
    // Auto-save on input change (except terms checkbox and payment date)
    const inputs = document.querySelectorAll('input:not(#acceptTerms, #paymentDate), select');
    inputs.forEach(input => {
      input.addEventListener('change', () => this.saveSettings());
    });
  }


  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings || {};

      // Load form data
      document.getElementById('childLastName').value = settings.childLastName || '';
      document.getElementById('parentName').value = settings.parentName || '';
      document.getElementById('email').value = settings.email || '';
      document.getElementById('phone').value = settings.phone || '';
      document.getElementById('address').value = settings.address || '';
      document.getElementById('city').value = settings.city || '';
      document.getElementById('state').value = settings.state || '';
      document.getElementById('zipCode').value = settings.zipCode || '';
      document.getElementById('billingAddress1').value = settings.billingAddress1 || '';
      document.getElementById('billingAddress2').value = settings.billingAddress2 || '';
      document.getElementById('billingCity').value = settings.billingCity || '';
      document.getElementById('billingState').value = settings.billingState || '';
      document.getElementById('billingZipCode').value = settings.billingZipCode || '';
      document.getElementById('country').value = settings.country || 'United States';
      document.getElementById('dayPhone').value = settings.dayPhone || '';
      document.getElementById('nightPhone').value = settings.nightPhone || '';
      document.getElementById('mobilePhone').value = settings.mobilePhone || '';
      document.getElementById('monthlyAmount').value = settings.monthlyAmount || '';
      document.getElementById('paymentDate').value = settings.paymentDate || this.getNextMonthDate();
      document.getElementById('reminderTime').value = settings.reminderTime || '09:00';
      document.getElementById('paymentMethod').value = settings.paymentMethod || 'credit_card';
      document.getElementById('autoFill').checked = settings.autoFill || false;
      document.getElementById('enableAutopay').checked = settings.enableAutopay || false;
      document.getElementById('acceptTerms').checked = settings.termsAccepted || false;

      this.updateStatus();
      this.handleConsentChange(); // Set initial state of checkboxes
      await this.validateAndAdjustDueDate(); // Validate and adjust due date if needed
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async handleConsentChange() {
    const consentAccepted = document.getElementById('acceptTerms').checked;
    const autoFillCheckbox = document.getElementById('autoFill');
    const autoReminderCheckbox = document.getElementById('enableAutopay');
    const autoFillHelp = document.getElementById('autoFillHelp');
    const autoReminderHelp = document.getElementById('autoReminderHelp');
    
    // If consent is not accepted, uncheck the checkboxes FIRST and clear all fields
    if (!consentAccepted) {
      autoFillCheckbox.checked = false;
      autoReminderCheckbox.checked = false;
      
      // Clear all form fields
      this.clearAllFormFields();
      
      // Also update stored settings to reflect unchecked state
      try {
        const result = await chrome.storage.local.get(['autopaySettings']);
        const settings = result.autopaySettings || {};
        settings.termsAccepted = false;
        settings.autoFill = false;
        settings.enableAutopay = false;
        settings.termsAcceptedDate = null;
        // Clear all form data from settings
        this.clearSettingsData(settings);
        await chrome.storage.local.set({ autopaySettings: settings });
        console.log('USF Autopay: Settings updated - terms unchecked, features disabled, all fields cleared');
      } catch (error) {
        console.error('Error updating settings when terms unchecked:', error);
      }
    }
    
    // Then disable/enable checkboxes based on consent
    autoFillCheckbox.disabled = !consentAccepted;
    autoReminderCheckbox.disabled = !consentAccepted;
    
    // Update visual styling for disabled state
    const autoFillLabel = autoFillCheckbox.nextElementSibling;
    const autoReminderLabel = autoReminderCheckbox.nextElementSibling;
    
    if (consentAccepted) {
      autoFillLabel.style.color = '#333';
      autoFillLabel.style.opacity = '1';
      autoReminderLabel.style.color = '#333';
      autoReminderLabel.style.opacity = '1';
      // Hide help text when enabled
      autoFillHelp.style.display = 'none';
      autoReminderHelp.style.display = 'none';
    } else {
      autoFillLabel.style.color = '#999';
      autoFillLabel.style.opacity = '0.6';
      autoReminderLabel.style.color = '#999';
      autoReminderLabel.style.opacity = '0.6';
      // Show help text when disabled
      autoFillHelp.style.display = 'block';
      autoReminderHelp.style.display = 'block';
    }
  }

  clearAllFormFields() {
    // Clear all form input fields
    const fieldsToClear = [
      'childLastName', 'parentName', 'email', 'phone', 'address', 'city', 'state', 'zipCode',
      'billingAddress1', 'billingAddress2', 'billingCity', 'billingState', 'billingZipCode',
      'country', 'dayPhone', 'nightPhone', 'mobilePhone', 'monthlyAmount', 'paymentDate',
      'reminderTime', 'paymentMethod'
    ];
    
    fieldsToClear.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = false;
        } else {
          element.value = '';
        }
      }
    });
    
    // Reset payment date to default (next month 15th)
    document.getElementById('paymentDate').value = this.getNextMonthDate();
    
    // Reset reminder time to default
    document.getElementById('reminderTime').value = '09:00';
    
    // Reset payment method to default
    document.getElementById('paymentMethod').value = 'credit_card';
    
    // Reset country to default
    document.getElementById('country').value = 'United States';
    
    console.log('USF Autopay: All form fields cleared');
  }

  clearSettingsData(settings) {
    // Clear all form-related data from settings object
    const fieldsToClear = [
      'childLastName', 'parentName', 'email', 'phone', 'address', 'city', 'state', 'zipCode',
      'billingAddress1', 'billingAddress2', 'billingCity', 'billingState', 'billingZipCode',
      'country', 'dayPhone', 'nightPhone', 'mobilePhone', 'monthlyAmount', 'paymentDate',
      'reminderTime', 'paymentMethod', 'autoFill', 'enableAutopay', 'termsAccepted', 'termsAcceptedDate'
    ];
    
    fieldsToClear.forEach(field => {
      delete settings[field];
    });
    
    // Reset to default values
    settings.paymentDate = this.getNextMonthDate();
    settings.reminderTime = '09:00';
    settings.paymentMethod = 'credit_card';
    settings.country = 'United States';
    settings.autoFill = false;
    settings.enableAutopay = false;
    settings.termsAccepted = false;
    settings.termsAcceptedDate = null;
    
    console.log('USF Autopay: Settings data cleared');
  }

  async validateAndAdjustDueDate() {
    const paymentDateInput = document.getElementById('paymentDate');
    const currentDate = new Date();
    const selectedDate = new Date(paymentDateInput.value);
    
    if (!paymentDateInput.value || isNaN(selectedDate.getTime())) {
      return; // No date selected or invalid date
    }
    
    // Calculate days difference
    const timeDiff = selectedDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    console.log(`USF Autopay: Current due date: ${selectedDate.toISOString().split('T')[0]}, Days away: ${daysDiff}`);
    
    // If more than 52 days away, adjust the date
    if (daysDiff > 52) {
      let adjustedDate = new Date(selectedDate);
      let adjustments = 0;
      const maxAdjustments = 12; // Prevent infinite loop
      
      // Keep reducing by one month until within 52 days or max adjustments reached
      while (daysDiff - (adjustments * 30) > 52 && adjustments < maxAdjustments) {
        adjustedDate.setMonth(adjustedDate.getMonth() - 1);
        adjustments++;
        
        // Recalculate days difference
        const newTimeDiff = adjustedDate.getTime() - currentDate.getTime();
        const newDaysDiff = Math.ceil(newTimeDiff / (1000 * 3600 * 24));
        
        if (newDaysDiff <= 52) {
          break;
        }
      }
      
      // Update the input field with adjusted date
      paymentDateInput.value = adjustedDate.toISOString().split('T')[0];
      
      // Show notification to user
      this.showMessage(`Due date adjusted from ${selectedDate.toISOString().split('T')[0]} to ${adjustedDate.toISOString().split('T')[0]} (was ${daysDiff} days away)`, 'info');
      
      console.log(`USF Autopay: Due date adjusted by ${adjustments} month(s). New date: ${adjustedDate.toISOString().split('T')[0]}`);
      
      // Reschedule reminder for 7 days before the new due date
      await this.rescheduleReminderForNewDueDate(adjustedDate);
    }
  }

  async rescheduleReminderForNewDueDate(newDueDate) {
    try {
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      if (!settings || !settings.enableAutopay) {
        console.log('USF Autopay: Autopay not enabled, skipping reminder reschedule');
        return;
      }
      
      // Calculate new reminder date (7 days before new due date)
      const newReminderDate = new Date(newDueDate);
      newReminderDate.setDate(newReminderDate.getDate() - 7);
      
      // Get custom reminder time from settings
      const reminderTime = settings.reminderTime || '09:00';
      const [hours, minutes] = reminderTime.split(':').map(Number);
      newReminderDate.setHours(hours, minutes, 0, 0);
      
      // Clear existing alarms
      await chrome.alarms.clearAll();
      
      // Schedule new reminder
      await chrome.alarms.create('usfAutopay', {
        when: newReminderDate.getTime()
      });
      
      console.log(`USF Autopay: Reminder rescheduled for ${newReminderDate.toISOString()} (7 days before new due date)`);
      
      // Show notification about reminder reschedule
      this.showMessage(`Reminder rescheduled for ${newReminderDate.toLocaleDateString()} at ${reminderTime}`, 'info');
      
    } catch (error) {
      console.error('USF Autopay: Error rescheduling reminder for new due date:', error);
    }
  }

  getFormData() {
    return {
      childLastName: document.getElementById('childLastName').value,
      parentName: document.getElementById('parentName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zipCode: document.getElementById('zipCode').value,
      billingAddress1: document.getElementById('billingAddress1').value,
      billingAddress2: document.getElementById('billingAddress2').value,
      billingCity: document.getElementById('billingCity').value,
      billingState: document.getElementById('billingState').value,
      billingZipCode: document.getElementById('billingZipCode').value,
      country: document.getElementById('country').value,
      dayPhone: document.getElementById('dayPhone').value,
      nightPhone: document.getElementById('nightPhone').value,
      mobilePhone: document.getElementById('mobilePhone').value,
      monthlyAmount: parseFloat(document.getElementById('monthlyAmount').value) || 0,
      paymentDate: document.getElementById('paymentDate').value,
      reminderTime: document.getElementById('reminderTime').value,
      paymentMethod: document.getElementById('paymentMethod').value,
      autoFill: document.getElementById('autoFill').checked,
      enableAutopay: document.getElementById('enableAutopay').checked,
      termsAccepted: document.getElementById('acceptTerms').checked,
      lastUpdated: new Date().toISOString()
    };
  }

  validateSettings(settings) {
    const required = ['childLastName', 'parentName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'billingAddress1', 'billingCity', 'billingState', 'billingZipCode', 'country', 'dayPhone', 'monthlyAmount', 'paymentDate', 'reminderTime'];
    
    for (const field of required) {
      if (!settings[field] || (field === 'monthlyAmount' && settings[field] <= 0)) {
        return false;
      }
    }
    
    return true;
  }

  async saveSettings() {
    try {
      // Validate and adjust due date before getting form data
      await this.validateAndAdjustDueDate();
      
      const settings = this.getFormData();
      
      // Check if terms are accepted
      const termsAccepted = document.getElementById('acceptTerms').checked;
      if (!termsAccepted) {
        this.showMessage('You must accept the Terms and Conditions to save settings', 'error');
        return;
      }
      
      if (!this.validateSettings(settings)) {
        this.showMessage('Please fill in all required fields', 'error');
        return;
      }

      // Add terms acceptance to settings
      settings.termsAccepted = true;
      settings.termsAcceptedDate = new Date().toISOString();
      
      // Ensure auto-fill and auto-reminder are false if consent is not accepted
      if (!termsAccepted) {
        settings.autoFill = false;
        settings.enableAutopay = false;
      }

      await chrome.storage.local.set({ autopaySettings: settings });
      this.updateStatus();
      this.showMessage('Settings saved successfully!', 'success');
      
      // Schedule next payment if autopay is enabled
      if (settings.enableAutopay) {
        console.log('USF Autopay: Scheduling next payment with settings:', settings);
        await this.scheduleNextPayment(settings);
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showMessage(`Error saving settings: ${error.message}`, 'error');
    }
  }

  async scheduleNextPayment(settings) {
    try {
      console.log('USF Autopay: Calculating next reminder date...');
      
      // Use the same logic as background script
      const now = new Date();
      const paymentDate = new Date(settings.paymentDate);
      
      // Get custom reminder time from settings
      const reminderTime = settings.reminderTime || '09:00';
      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      // Calculate days until payment
      const timeDiff = paymentDate.getTime() - now.getTime();
      const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      console.log(`USF Autopay: Days until payment: ${daysUntilPayment}, Reminder time: ${reminderTime}`);
      
      let nextReminderDate;
      
      if (daysUntilPayment <= 0) {
        // Payment is overdue, remind daily until paid or 7 days after deadline
        nextReminderDate = new Date(now);
        
        // Check if the custom time for today has already passed
        const todayAtCustomTime = new Date(now);
        todayAtCustomTime.setHours(hours, minutes, 0, 0);
        
        if (now < todayAtCustomTime) {
          // Custom time hasn't passed today, schedule for today
          nextReminderDate.setHours(hours, minutes, 0, 0);
          console.log(`USF Autopay: Payment overdue, scheduling reminder for today at custom time: ${nextReminderDate.toISOString()}`);
        } else {
          // Custom time has passed today, schedule for tomorrow
          nextReminderDate.setDate(nextReminderDate.getDate() + 1);
          nextReminderDate.setHours(hours, minutes, 0, 0);
          console.log(`USF Autopay: Payment overdue, scheduling reminder for tomorrow at custom time: ${nextReminderDate.toISOString()}`);
        }
      } else if (daysUntilPayment <= 7) {
        // Within 7 days, remind daily at custom time
        nextReminderDate = new Date(now);
        
        // Check if the custom time for today has already passed
        const todayAtCustomTime = new Date(now);
        todayAtCustomTime.setHours(hours, minutes, 0, 0);
        
        if (now < todayAtCustomTime) {
          // Custom time hasn't passed today, schedule for today
          nextReminderDate.setHours(hours, minutes, 0, 0);
          console.log(`USF Autopay: Within 7 days, scheduling reminder for today at custom time: ${nextReminderDate.toISOString()}`);
        } else {
          // Custom time has passed today, schedule for tomorrow
          nextReminderDate.setDate(nextReminderDate.getDate() + 1);
          nextReminderDate.setHours(hours, minutes, 0, 0);
          console.log(`USF Autopay: Within 7 days, scheduling reminder for tomorrow at custom time: ${nextReminderDate.toISOString()}`);
        }
      } else {
        // More than 7 days away, schedule reminder for 7 days before payment
        nextReminderDate = new Date(paymentDate);
        nextReminderDate.setDate(nextReminderDate.getDate() - 7);
        nextReminderDate.setHours(hours, minutes, 0, 0);
        console.log(`USF Autopay: More than 7 days away, scheduling reminder for 7 days before: ${nextReminderDate.toISOString()}`);
      }
      
      // Clear only the usfAutopay alarm first
      await chrome.alarms.clear('usfAutopay');
      
      // Create new alarm
      await chrome.alarms.create('usfAutopay', {
        when: nextReminderDate.getTime()
      });
      
      console.log('USF Autopay: Next reminder scheduled for:', nextReminderDate.toISOString());
      console.log('USF Autopay: Alarm created with when:', nextReminderDate.getTime());
      console.log('USF Autopay: Current time:', Date.now());
      console.log('USF Autopay: Time difference (ms):', nextReminderDate.getTime() - Date.now());
      
      // Verify alarm was created
      const alarms = await chrome.alarms.getAll();
      console.log('USF Autopay: All active alarms:', alarms);
      
      // Show user what was scheduled
      this.showMessage(`Reminder scheduled for ${nextReminderDate.toLocaleString()}`, 'info');
      
    } catch (error) {
      console.error('Error scheduling next payment:', error);
    }
  }

  getNextMonthDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    return nextMonth.toISOString().split('T')[0];
  }

  async updateStatus() {
    const settings = this.getFormData();
    const statusDiv = document.getElementById('status');
    
    if (settings.enableAutopay && this.validateSettings(settings)) {
      // Check if reminders are temporarily disabled
      if (settings.remindersDisabled) {
        const disabledReason = settings.disabledReason || 'Unknown reason';
        const disabledDate = settings.disabledTimestamp ? new Date(settings.disabledTimestamp).toLocaleDateString() : 'Unknown date';
        statusDiv.innerHTML = `Auto-reminder: Temporarily Disabled<br><small>Reason: ${disabledReason} (${disabledDate})</small>`;
        statusDiv.className = 'status inactive';
      } else {
        // Calculate days until next reminder
        const now = new Date();
        const paymentDate = new Date(settings.paymentDate);
        const timeDiff = paymentDate.getTime() - now.getTime();
        const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysUntilPayment <= 7 && daysUntilPayment > 0) {
          statusDiv.innerHTML = `Auto-reminder: Active (Daily)<br><small>${daysUntilPayment} days until payment</small>`;
        } else if (daysUntilPayment <= 0) {
          statusDiv.innerHTML = `Auto-reminder: Active (Overdue)<br><small>${Math.abs(daysUntilPayment)} days overdue</small>`;
        } else {
          statusDiv.innerHTML = `Auto-reminder: Active<br><small>Next reminder in ${daysUntilPayment - 7} days</small>`;
        }
        statusDiv.className = 'status active';
      }
    } else {
      statusDiv.textContent = 'Auto-reminder: Inactive';
      statusDiv.className = 'status inactive';
    }
  }

  showMessage(message, type = 'info') {
    // Create or update message element
    let messageDiv = document.getElementById('message');
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = 'message';
      messageDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 90%;
        text-align: center;
      `;
      document.body.appendChild(messageDiv);
    }

    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
      warning: '#ffc107'
    };

    messageDiv.textContent = message;
    messageDiv.style.backgroundColor = colors[type] || colors.info;
    messageDiv.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }


  async payNow() {
    try {
      // Show confirmation popup
      const confirmed = await this.showPayNowConfirmation();
      
      if (confirmed) {
        // Disable reminders for this payment period and set up next period
        await this.disableRemindersForCurrentPeriod();
        
        // Open USF page
        await this.openUSFPage();
      }
      
    } catch (error) {
      console.error('Error in payNow:', error);
      this.showMessage(`Error: ${error.message}`, 'error');
    }
  }

  async showPayNowConfirmation() {
    return new Promise((resolve) => {
      // Create confirmation popup
      const confirmDiv = document.createElement('div');
      confirmDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
      `;
      
      confirmDiv.innerHTML = `
        <div style="
          background: white;
          color: #333;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 50px; margin-bottom: 20px;">⚠️</div>
          <h2 style="margin: 0 0 20px 0; color: #d32f2f;">Continue to Payment?</h2>
          <p style="margin: 0 0 25px 0; line-height: 1.5; font-size: 16px;">
            If you continue, reminders will be disabled for this payment period as we assume you want to make the payment now.
          </p>
          <p style="margin: 0 0 25px 0; line-height: 1.5; font-size: 14px; color: #666;">
            The next reminder will be scheduled for 7 days before your next payment due date.
          </p>
          <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="confirm-pay" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 12px 25px;
              border-radius: 6px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
            ">Continue</button>
            <button id="cancel-pay" style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 12px 25px;
              border-radius: 6px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
            ">Cancel</button>
          </div>
        </div>
      `;
      
      // Add event listeners
      const confirmBtn = confirmDiv.querySelector('#confirm-pay');
      const cancelBtn = confirmDiv.querySelector('#cancel-pay');
      
      confirmBtn.addEventListener('click', () => {
        confirmDiv.remove();
        resolve(true);
      });
      
      cancelBtn.addEventListener('click', () => {
        confirmDiv.remove();
        resolve(false);
      });
      
      // Add to page
      document.body.appendChild(confirmDiv);
    });
  }

  calculateValidNextPaymentDate(currentPaymentDate) {
    const currentDate = new Date();
    let nextPaymentDate = new Date(currentPaymentDate);
    let adjustments = 0;
    const maxAdjustments = 12; // Prevent infinite loop
    
    // Keep adding months until we find a valid date
    while (adjustments < maxAdjustments) {
      // Calculate reminder date (7 days before payment)
      const reminderDate = new Date(nextPaymentDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      
      // Calculate days from current date to reminder date
      const timeDiff = reminderDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // If reminder is within 52 days, this is a valid payment date
      if (daysDiff <= 52 && daysDiff > 0) {
        console.log(`USF Autopay: Valid next payment date found: ${nextPaymentDate.toISOString().split('T')[0]} (reminder in ${daysDiff} days)`);
        return nextPaymentDate;
      }
      
      // Move to next month and try again
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      adjustments++;
    }
    
    // If we couldn't find a valid date, return the original next month
    console.warn('USF Autopay: Could not find valid payment date within 12 months, using next month');
    const fallbackDate = new Date(currentPaymentDate);
    fallbackDate.setMonth(fallbackDate.getMonth() + 1);
    return fallbackDate;
  }

  async disableRemindersForCurrentPeriod() {
    try {
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings || {};
      
      // Disable reminders for this payment period
      settings.remindersDisabled = true;
      settings.disabledReason = 'User selected Pay Now';
      settings.disabledTimestamp = new Date().toISOString();
      
      // Calculate next payment period with validation
      const currentPaymentDate = new Date(settings.paymentDate);
      const nextPaymentDate = this.calculateValidNextPaymentDate(currentPaymentDate);
      
      // Update payment date to next period
      settings.paymentDate = nextPaymentDate.toISOString().split('T')[0];
      
      // Calculate next reminder date (7 days before next payment)
      const nextReminderDate = new Date(nextPaymentDate);
      nextReminderDate.setDate(nextReminderDate.getDate() - 7);
      
      // Get custom reminder time from settings
      const reminderTime = settings.reminderTime || '09:00';
      const [hours, minutes] = reminderTime.split(':').map(Number);
      nextReminderDate.setHours(hours, minutes, 0, 0); // Custom time
      
      // Save updated settings
      await chrome.storage.local.set({ autopaySettings: settings });
      
      // Clear current alarms
      await chrome.alarms.clearAll();
      
      // Schedule next reminder for 7 days before next payment
      await chrome.alarms.create('usfAutopay', {
        when: nextReminderDate.getTime()
      });
      
      this.showMessage(`✅ Reminders disabled for this period! Next reminder scheduled for ${nextReminderDate.toLocaleDateString()}`, 'success');
      
      console.log('USF Autopay: Reminders disabled for current period, next reminder scheduled for:', nextReminderDate.toISOString());
      
    } catch (error) {
      console.error('Error disabling reminders for current period:', error);
      throw error;
    }
  }

  async openUSFPage() {
    try {
      // Always use the correct URL
      const url = 'https://cloud.usf.edu/gateway/preschool/';
      
      // Try to find existing USF tab first
      const tabs = await chrome.tabs.query({url: 'https://cloud.usf.edu/*'});
      
      if (tabs.length > 0) {
        // Update existing tab
        await chrome.tabs.update(tabs[0].id, { url: url, active: true });
        console.log('USF Autopay: Updated existing USF tab');
      } else {
        // Create new tab
        await chrome.tabs.create({ url: url, active: true });
        console.log('USF Autopay: Created new USF tab');
      }
      
    } catch (error) {
      console.error('Error opening USF page:', error);
      // Fallback: open in new window
      window.open('https://cloud.usf.edu/gateway/preschool/', '_blank');
    }
  }


  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'showScheduledReminder') {
        console.log('USF Autopay: Received scheduled reminder request');
        this.showScheduledReminder(request.title, request.message, request.settings);
        sendResponse({ success: true });
      }
    });
  }

  showScheduledReminder(title, message, settings) {
    // Show the same full-screen reminder as test reminder
    const reminderDiv = document.createElement('div');
    reminderDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;
    
    reminderDiv.innerHTML = `
      <div style="
        background: #ff4444;
        color: white;
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      ">
        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
        <h1 style="font-size: 28px; margin: 0 0 20px 0;">${title}</h1>
        <p style="font-size: 18px; margin: 0 0 30px 0; line-height: 1.5;">
          ${message}<br>
          Don't forget to pay on time.
        </p>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button id="scheduled-pay-now-btn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          ">Pay Now</button>
          <button id="scheduled-remind-later-btn" style="
            background: #ffc107;
            color: black;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          ">Remind Later</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    const payNowBtn = reminderDiv.querySelector('#scheduled-pay-now-btn');
    const remindLaterBtn = reminderDiv.querySelector('#scheduled-remind-later-btn');
    
    payNowBtn.addEventListener('click', async () => {
      console.log('Scheduled Pay Now clicked');
      reminderDiv.remove();
      
      // Disable reminders for this period and open USF page
      await this.disableRemindersForCurrentPeriod();
      await this.openUSFPage();
    });
    
    remindLaterBtn.addEventListener('click', async () => {
      console.log('Scheduled Remind Later clicked');
      reminderDiv.remove();
      
      // Schedule reminder for 24 hours later
      try {
        const remindTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        await chrome.alarms.create('usfAutopay', {
          when: remindTime
        });
        
        this.showMessage('Reminder scheduled for 24 hours from now', 'info');
        console.log('USF Autopay: Reminder scheduled for 24 hours later');
      } catch (error) {
        console.error('Error scheduling reminder:', error);
      }
    });
    
    // Add to page
    document.body.appendChild(reminderDiv);
    
    console.log('Scheduled reminder displayed');
  }


  async clearSettings() {
    try {
      await chrome.storage.local.clear();
      await chrome.alarms.clearAll();
      this.loadSettings();
      this.showMessage('All settings cleared!', 'success');
    } catch (error) {
      console.error('Error clearing settings:', error);
      this.showMessage(`Error clearing settings: ${error.message}`, 'error');
    }
  }

  showTermsAndConditions() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      ">
        <h2 style="color: #333; margin-top: 0; text-align: center;">Terms and Conditions</h2>
        
        <div style="line-height: 1.6; color: #555;">
          <h3>1. NO WARRANTY DISCLAIMER</h3>
          <p>This browser extension is provided "AS IS" without any warranties, express or implied. The developer makes no representations or warranties of any kind, including but not limited to the accuracy, reliability, or completeness of the extension's functionality.</p>
          
          <h3>2. ZERO FINANCIAL RESPONSIBILITY</h3>
          <p>The developer assumes ZERO financial responsibility for any monetary losses, payment failures, late fees, penalties, or any other financial consequences that may arise from the use of this extension. Users are solely responsible for all financial transactions and their outcomes.</p>
          
          <h3>3. ZERO INFORMATIONAL RESPONSIBILITY</h3>
          <p>The developer assumes ZERO responsibility for any informational issues, data loss, privacy breaches, or security concerns that may arise from the use of this extension. Users are solely responsible for the security and privacy of their information.</p>
          
          <h3>4. USE AT YOUR OWN RISK</h3>
          <p>This extension is provided for convenience only. Users acknowledge that they use this extension entirely at their own risk and discretion. The developer is not liable for any damages, losses, or issues arising from the use of this extension.</p>
          
          <h3>5. NO LIABILITY</h3>
          <p>In no event shall the developer be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses, resulting from the use or inability to use this extension.</p>
          
          <h3>6. MANUAL VERIFICATION REQUIRED</h3>
          <p>Users must manually verify all payment information and complete all transactions themselves. This extension only assists with form filling and reminder scheduling - it does not process payments or guarantee payment success.</p>
          
          <h3>7. INDEPENDENCE FROM USF</h3>
          <p><strong>This tool has NOTHING to do with USF or USF Preschool For Creative Learning.</strong> Neither USF nor USF Preschool For Creative Learning developed this tool, maintain it, or have any association with it. This is an independent third-party tool created by an external developer.</p>
          
          <h3>8. ACCEPTANCE OF TERMS</h3>
          <p>By using this extension, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions. If you do not agree to these terms, you must not use this extension.</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ IMPORTANT NOTICE:</strong> This extension is not affiliated with, endorsed by, or associated with the University of South Florida or USF Preschool For Creative Learning. It is an independent third-party tool designed to help automate form filling. Always verify payment information before submitting.
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button id="closeTerms" style="
            background: #0066cc;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
          ">I Understand</button>
        </div>
      </div>
    `;

    // Add close functionality
    const closeBtn = modal.querySelector('#closeTerms');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Add to page
    document.body.appendChild(modal);
  }
}

// Initialize popup manager
new PopupManager();