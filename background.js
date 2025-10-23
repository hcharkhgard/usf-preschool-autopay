// Background script for USF Preschool For Creative Learning Auto Reminder extension
class BackgroundManager {
  constructor() {
    this.init();
  }

  init() {
    console.log('USF Autopay: Initializing background manager...');
    this.setupAlarmListener();
    this.setupInstallListener();
    this.setupBrowserStartListener();
    this.setupMessageListener();
    this.setupNotificationListener();
    console.log('USF Autopay: Background manager initialized successfully');
  }

  setupAlarmListener() {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      console.log('USF Autopay: ===== ALARM TRIGGERED =====');
      console.log('USF Autopay: Alarm name:', alarm.name);
      console.log('USF Autopay: Alarm details:', alarm);
      console.log('USF Autopay: Current time:', new Date().toISOString());
      
      if (alarm.name === 'usfAutopay') {
        console.log('USF Autopay: Processing usfAutopay alarm...');
        await this.handleAutopayAlarm();
      } else {
        console.log('USF Autopay: Unknown alarm name:', alarm.name);
      }
    });
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      }
    });
  }

  setupBrowserStartListener() {
    // Listen for when browser starts or tabs are created
    chrome.tabs.onCreated.addListener(async (tab) => {
      // Small delay to ensure browser is fully started
      setTimeout(() => {
        this.checkForSmartReminder();
      }, 2000);
    });

    // Also check when browser starts up
    chrome.runtime.onStartup.addListener(() => {
      setTimeout(() => {
        this.checkForSmartReminder();
      }, 3000);
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'triggerReminderNow') {
        this.handleTriggerReminderNow();
        sendResponse({ success: true });
      }
    });
  }

  setupNotificationListener() {
    chrome.notifications.onClicked.addListener((notificationId) => {
      console.log('USF Autopay: Notification clicked:', notificationId);
      // Open USF page when notification is clicked
      chrome.tabs.create({
        url: 'https://cloud.usf.edu/gateway/preschool/',
        active: true
      });
    });

    chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
      console.log('USF Autopay: Notification button clicked:', notificationId, buttonIndex);
      
      // Clear the notification when user interacts with it
      try {
        await chrome.notifications.clear(notificationId);
        console.log('USF Autopay: Notification cleared after user interaction');
      } catch (error) {
        console.error('USF Autopay: Error clearing notification:', error);
      }
      
      if (this.pendingPayNowConfirmation) {
        // Handle Pay Now confirmation buttons
        if (buttonIndex === 0) {
          // Continue button
          this.pendingPayNowConfirmation = false;
          await this.handlePayNowFromNotification();
        } else if (buttonIndex === 1) {
          // Cancel button
          this.pendingPayNowConfirmation = false;
          console.log('USF Autopay: Pay Now cancelled by user');
        }
      } else if (this.pendingFinalDeadlineWarning) {
        // Handle final deadline warning buttons
        if (buttonIndex === 0) {
          // Pay Now button
          this.pendingFinalDeadlineWarning = false;
          await this.handlePayNowFromFinalDeadlineWarning();
        } else if (buttonIndex === 1) {
          // Pay Later Manually button - disable reminders for this period
          this.pendingFinalDeadlineWarning = false;
          await this.handleDisableRemindersForPeriod();
        }
      } else if (this.pendingDeadlineWarning) {
        // Handle deadline warning buttons
        if (buttonIndex === 0) {
          // Pay Now button
          this.pendingDeadlineWarning = false;
          await this.handlePayNowFromDeadlineWarning();
        } else if (buttonIndex === 1) {
          // OK button - disable reminders for this period
          this.pendingDeadlineWarning = false;
          await this.handleDisableRemindersForPeriod();
        }
      } else {
        // Handle original reminder buttons
        if (buttonIndex === 0) {
          // Pay Now button - show confirmation warning first
          await this.showPayNowConfirmationFromNotification();
        } else if (buttonIndex === 1) {
          // Remind Later button - handle smart logic
          await this.handleRemindLaterFromNotification();
        }
      }
    });
  }

  async handleTriggerReminderNow() {
    try {
      console.log('USF Autopay: Manual reminder trigger requested');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;

      if (!settings || !settings.enableAutopay) {
        console.log('USF Autopay: Autopay is disabled, skipping manual reminder');
        return;
      }

      // Check if we have all required information
      if (!this.validateAutopaySettings(settings)) {
        console.log('USF Autopay: Invalid autopay settings, skipping manual reminder');
        return;
      }

      // Send smart reminder immediately
      await this.sendSmartReminder(settings);
      
      console.log('USF Autopay: Manual reminder sent');
      
    } catch (error) {
      console.error('Error handling manual reminder trigger:', error);
    }
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

  async showPayNowConfirmationFromNotification() {
    try {
      console.log('USF Autopay: Showing Pay Now confirmation from notification');
      
      // Show confirmation notification with warning
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: '⚠️ Continue to Payment?',
        message: 'If you continue, reminders will be disabled for this payment period. The next reminder will be scheduled for 7 days before your next payment due date.',
        buttons: [
          { title: 'Continue' },
          { title: 'Cancel' }
        ]
      });
      
      // Store the confirmation state
      this.pendingPayNowConfirmation = true;
      
    } catch (error) {
      console.error('Error showing Pay Now confirmation:', error);
    }
  }

  async handlePayNowFromNotification() {
    try {
      console.log('USF Autopay: Pay Now clicked from notification');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      if (!settings) {
        console.log('USF Autopay: No settings found');
        return;
      }

      // Disable reminders for this payment period
      settings.remindersDisabled = true;
      settings.disabledReason = 'User selected Pay Now from notification';
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
      nextReminderDate.setHours(hours, minutes, 0, 0);
      
      // Save updated settings
      await chrome.storage.local.set({ autopaySettings: settings });
      
      // Clear current alarms
      await chrome.alarms.clearAll();
      
      // Schedule next reminder for 7 days before next payment
      await chrome.alarms.create('usfAutopay', {
        when: nextReminderDate.getTime()
      });
      
      // Show confirmation notification
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Reminders Disabled',
        message: `Reminders disabled for this period! Next reminder scheduled for ${nextReminderDate.toLocaleDateString()}`
      });
      
      // Open USF page
      chrome.tabs.create({
        url: 'https://cloud.usf.edu/gateway/preschool/',
        active: true
      });
      
      console.log('USF Autopay: Pay Now handled - reminders disabled for this period');
      
    } catch (error) {
      console.error('Error handling Pay Now from notification:', error);
    }
  }

  async handlePayNowFromDeadlineWarning() {
    try {
      console.log('USF Autopay: Pay Now clicked from deadline warning');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      if (!settings) {
        console.log('USF Autopay: No settings found');
        return;
      }

      // Disable reminders for this payment period
      settings.remindersDisabled = true;
      settings.disabledReason = 'User selected Pay Now from deadline warning';
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
      nextReminderDate.setHours(hours, minutes, 0, 0);
      
      // Save updated settings
      await chrome.storage.local.set({ autopaySettings: settings });
      
      // Clear current alarms
      await chrome.alarms.clearAll();
      
      // Schedule next reminder for 7 days before next payment
      await chrome.alarms.create('usfAutopay', {
        when: nextReminderDate.getTime()
      });
      
      // Show confirmation notification (non-clickable)
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Reminders Disabled',
        message: `Reminders disabled for this period! Next reminder scheduled for ${nextReminderDate.toLocaleDateString()}`,
        requireInteraction: false,
        priority: 0
      });
      
      // Open USF page
      chrome.tabs.create({
        url: 'https://cloud.usf.edu/gateway/preschool/',
        active: true
      });
      
      console.log('USF Autopay: Pay Now from deadline warning handled - reminders disabled for this period');
      
    } catch (error) {
      console.error('Error handling Pay Now from deadline warning:', error);
    }
  }

  async handlePayNowFromFinalDeadlineWarning() {
    try {
      console.log('USF Autopay: Pay Now clicked from final deadline warning');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      if (!settings) {
        console.log('USF Autopay: No settings found');
        return;
      }

      // Disable reminders for this payment period
      settings.remindersDisabled = true;
      settings.disabledReason = 'User selected Pay Now from final deadline warning';
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
      nextReminderDate.setHours(hours, minutes, 0, 0);
      
      // Save updated settings
      await chrome.storage.local.set({ autopaySettings: settings });
      
      // Clear current alarms
      await chrome.alarms.clearAll();
      
      // Schedule next reminder for 7 days before next payment
      await chrome.alarms.create('usfAutopay', {
        when: nextReminderDate.getTime()
      });
      
      // Show confirmation notification (non-clickable)
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Reminders Disabled',
        message: `Reminders disabled for this period! Next reminder scheduled for ${nextReminderDate.toLocaleDateString()}`,
        requireInteraction: false,
        priority: 0
      });
      
      // Open USF page
      chrome.tabs.create({
        url: 'https://cloud.usf.edu/gateway/preschool/',
        active: true
      });
      
      console.log('USF Autopay: Pay Now from final deadline warning handled - reminders disabled for this period');
      
    } catch (error) {
      console.error('Error handling Pay Now from final deadline warning:', error);
    }
  }

  async showDeadlineWarningFromNotification() {
    try {
      console.log('USF Autopay: Showing deadline warning from notification');
      
      // Show warning notification with proper buttons
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: '⚠️ LAST REMINDER WARNING',
        message: 'This is the last reminder for this payment period! There will be no more reminders for this period. Choose your action:',
        buttons: [
          { title: 'Pay Now' },
          { title: 'OK' }
        ],
        requireInteraction: true,
        priority: 2
      });
      
      // Store the warning state
      this.pendingDeadlineWarning = true;
      
    } catch (error) {
      console.error('Error showing deadline warning:', error);
    }
  }

  async showFinalDeadlineWarningFromNotification() {
    try {
      console.log('USF Autopay: Showing final deadline warning from notification');
      
      // Show final warning notification with proper buttons
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: '⚠️ FINAL REMINDER WARNING',
        message: 'Unfortunately, this is the last reminder! The deadline will pass if you delay further. You must either pay now or pay later manually. Reminders will be disabled for this period regardless of your choice.',
        buttons: [
          { title: 'Pay Now' },
          { title: 'Pay Later Manually' }
        ],
        requireInteraction: true,
        priority: 2
      });
      
      // Store the final warning state
      this.pendingFinalDeadlineWarning = true;
      
    } catch (error) {
      console.error('Error showing final deadline warning:', error);
    }
  }

  async handleRemindLaterFromNotification() {
    try {
      console.log('USF Autopay: Remind Later clicked from notification');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      if (!settings) {
        console.log('USF Autopay: No settings found');
        return;
      }

      const now = new Date();
      const paymentDate = new Date(settings.paymentDate);
      const timeDiff = paymentDate.getTime() - now.getTime();
      const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      console.log(`USF Autopay: Days until payment: ${daysUntilPayment}`);
      
      // Check if deadline will pass within 24 hours
      if (daysUntilPayment <= 1) {
        // Deadline will pass - show final warning
        console.log('USF Autopay: Deadline will pass within 24 hours, showing final warning');
        await this.showFinalDeadlineWarningFromNotification();
        return; // Don't schedule reminder yet, wait for user confirmation
      } else {
        // Deadline not passed - remind in 24 hours
        const nextReminderDate = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        const message = `Reminder scheduled for 24 hours from now (${nextReminderDate.toLocaleString()})`;
        console.log('USF Autopay: Deadline not passed, scheduling for 24 hours later');
        
        // Clear current alarms
        await chrome.alarms.clearAll();
        
        // Schedule next reminder
        await chrome.alarms.create('usfAutopay', {
          when: nextReminderDate.getTime()
        });
        
        // Show confirmation notification (non-clickable)
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon48.png',
          title: 'Reminder Rescheduled',
          message: message,
          requireInteraction: false, // Allow auto-dismiss
          priority: 0 // Low priority, not clickable
        });
        
        console.log('USF Autopay: Remind Later handled - next reminder scheduled');
      }
      
    } catch (error) {
      console.error('Error handling Remind Later from notification:', error);
    }
  }

  async handleRemindLaterAfterWarning() {
    try {
      console.log('USF Autopay: User confirmed deadline warning, proceeding with remind later');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      if (!settings) {
        console.log('USF Autopay: No settings found');
        return;
      }

      const now = new Date();
      const paymentDate = new Date(settings.paymentDate);
      const timeDiff = paymentDate.getTime() - now.getTime();
      const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let nextReminderDate;
      let message;
      
      if (daysUntilPayment > 0) {
        // Deadline not passed - remind in 24 hours (user confirmed despite warning)
        nextReminderDate = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        message = `⚠️ WARNING: This is the last reminder for this period! Scheduled for 24 hours from now (${nextReminderDate.toLocaleString()})`;
        console.log('USF Autopay: User confirmed despite deadline warning, scheduling for 24 hours later');
      } else {
        // Deadline passed - show warning and move to next period
        console.log('USF Autopay: Deadline passed after warning confirmation, showing warning and moving to next period');
        
        // Show warning notification first
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon48.png',
          title: '⚠️ PAYMENT DEADLINE PASSED',
          message: `Your payment deadline has passed! The system will now move to the next payment period. You may need to make a late payment manually.`,
          requireInteraction: true,
          priority: 2
        });
        
        const nextPaymentDate = new Date(paymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        settings.paymentDate = nextPaymentDate.toISOString().split('T')[0];
        
        nextReminderDate = new Date(nextPaymentDate);
        nextReminderDate.setDate(nextReminderDate.getDate() - 7);
        
        const reminderTime = settings.reminderTime || '09:00';
        const [hours, minutes] = reminderTime.split(':').map(Number);
        nextReminderDate.setHours(hours, minutes, 0, 0);
        
        await chrome.storage.local.set({ autopaySettings: settings });
        
        message = `⚠️ DEADLINE PASSED! Moved to next period. Next reminder scheduled for ${nextReminderDate.toLocaleDateString()}`;
        console.log('USF Autopay: Moved to next period after warning confirmation');
      }
      
      // Clear current alarms
      await chrome.alarms.clearAll();
      
      // Schedule next reminder
      await chrome.alarms.create('usfAutopay', {
        when: nextReminderDate.getTime()
      });
      
      // Show confirmation notification (non-clickable)
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Reminder Rescheduled',
        message: message,
        requireInteraction: false, // Allow auto-dismiss
        priority: 0 // Low priority, not clickable
      });
      
      console.log('USF Autopay: Remind Later handled after warning confirmation');
      
    } catch (error) {
      console.error('Error handling Remind Later after warning:', error);
    }
  }

  async handleDisableRemindersForPeriod() {
    try {
      console.log('USF Autopay: User selected to disable reminders for this period');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      if (!settings) {
        console.log('USF Autopay: No settings found');
        return;
      }

      const paymentDate = new Date(settings.paymentDate);
      
      // Calculate next payment period (next month)
      const nextPaymentDate = new Date(paymentDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      
      // Update payment date to next period
      settings.paymentDate = nextPaymentDate.toISOString().split('T')[0];
      
      // Calculate next reminder date (7 days before next payment)
      const nextReminderDate = new Date(nextPaymentDate);
      nextReminderDate.setDate(nextReminderDate.getDate() - 7);
      
      // Get custom reminder time from settings
      const reminderTime = settings.reminderTime || '09:00';
      const [hours, minutes] = reminderTime.split(':').map(Number);
      nextReminderDate.setHours(hours, minutes, 0, 0);
      
      // Save updated settings
      await chrome.storage.local.set({ autopaySettings: settings });
      
      // Clear current alarms
      await chrome.alarms.clearAll();
      
      // Schedule next reminder
      await chrome.alarms.create('usfAutopay', {
        when: nextReminderDate.getTime()
      });
      
      // Show confirmation notification (non-clickable)
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Reminders Disabled',
        message: `Reminders disabled for this period! Next reminder scheduled for ${nextReminderDate.toLocaleDateString()}`,
        requireInteraction: false,
        priority: 0
      });
      
      console.log('USF Autopay: Reminders disabled for this period, next reminder scheduled');
      
    } catch (error) {
      console.error('Error disabling reminders for period:', error);
    }
  }

  async handleFirstInstall() {
    // Set up default settings on first install
    const defaultSettings = {
      autoFill: true,
      enableAutopay: false,
      monthlyAmount: 0,
      lastUpdated: new Date().toISOString()
    };

    await chrome.storage.local.set({ autopaySettings: defaultSettings });
  }


  async handleAutopayAlarm() {
    try {
      console.log('USF Autopay: handleAutopayAlarm called');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;
      
      console.log('USF Autopay: Retrieved settings:', settings);

      if (!settings || !settings.enableAutopay) {
        console.log('USF Autopay: Autopay is disabled, skipping payment');
        return;
      }

      // Check if we have all required information
      if (!this.validateAutopaySettings(settings)) {
        console.error('USF Autopay: Invalid autopay settings, skipping payment');
        await this.notifyUser('Autopay Error', 'Please check your payment settings. Some required information is missing.');
        return;
      }

      console.log('USF Autopay: Sending smart reminder...');
      // Send smart reminder notification
      await this.sendSmartReminder(settings);

      // Only schedule next reminder if we're not in daily reminder mode
      const now = new Date();
      const paymentDate = new Date(settings.paymentDate);
      const timeDiff = paymentDate.getTime() - now.getTime();
      const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysUntilPayment > 7) {
        console.log('USF Autopay: Scheduling next payment...');
        // Schedule next reminder
        await this.scheduleNextPayment(settings);
      } else {
        console.log('USF Autopay: In daily reminder mode, not scheduling next payment yet');
      }

    } catch (error) {
      console.error('USF Autopay: Error handling autopay alarm:', error);
      await this.notifyUser('Autopay Error', 'An error occurred during automatic payment. Please check your settings.');
    }
  }

  async sendSmartReminder(settings) {
    console.log('USF Autopay: sendSmartReminder called with settings:', settings);
    console.log('USF Autopay: sendSmartReminder - Full settings object:', JSON.stringify(settings, null, 2));
    
    const now = new Date();
    const paymentDate = new Date(settings.paymentDate);
    const timeDiff = paymentDate.getTime() - now.getTime();
    const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    console.log(`USF Autopay: Days until payment: ${daysUntilPayment}`);
    console.log(`USF Autopay: Current time: ${now.toISOString()}`);
    console.log(`USF Autopay: Payment date: ${paymentDate.toISOString()}`);
    console.log(`USF Autopay: Time difference (ms): ${timeDiff}`);
    
    // Check if payment deadline has passed and re-enable reminders for next period
    if (daysUntilPayment < -7) {
      console.log('USF Autopay: Payment deadline passed more than 7 days ago, re-enabling reminders for next period');
      await this.reEnableRemindersForNextPeriod(settings);
      return;
    }
    
    // Only send reminders during the last 7 days or if overdue
    if (daysUntilPayment > 7) {
      console.log(`USF Autopay: Payment is ${daysUntilPayment} days away, no reminder needed`);
      return;
    }
    
    // Check if reminders are temporarily disabled for this period
    if (settings.remindersDisabled && settings.disabledReason === 'User selected Pay Now') {
      console.log('USF Autopay: Reminders disabled by user, skipping');
      return;
    }
    
    // Check if we should show notification today (only once per day)
    const shouldShowNotification = await this.shouldShowNotificationToday(settings);
    console.log(`USF Autopay: Should show notification today: ${shouldShowNotification}`);
    
    // TEMPORARY: Force show notification for debugging
    console.log('USF Autopay: FORCING notification to show for debugging');
    // if (!shouldShowNotification) {
    //   console.log('USF Autopay: Notification already shown today, skipping');
    //   return;
    // }
    
    const title = 'PAYMENT DUE!';
    let daysMessage;
    
    if (daysUntilPayment <= 0) {
      daysMessage = `was due ${Math.abs(daysUntilPayment)} day(s) ago!`;
    } else if (daysUntilPayment === 1) {
      daysMessage = 'is due tomorrow!';
    } else {
      daysMessage = `is due in ${daysUntilPayment} days!`;
    }
    
    const message = `Your USF Preschool payment of $${settings.monthlyAmount} ${daysMessage}`;
    
    console.log('USF Autopay: About to show full-screen reminder...');
    
    // Show enhanced notification with click action
    await this.showEnhancedNotification(title, message, settings);
    
    // Mark notification as shown today
    await this.markNotificationShownToday(settings);
    
    console.log(`USF Autopay: Smart reminder sent: ${title} - ${message}`);
  }

  async openExtensionAndShowReminder(title, message, settings = null) {
    try {
      console.log('USF Autopay: Opening extension and showing reminder...');
      
      // Open extension popup
      await chrome.action.openPopup();
      
      // Wait a moment for popup to open, then send message to show reminder
      setTimeout(async () => {
        try {
          // Send message to popup to show the reminder
          await chrome.runtime.sendMessage({
            action: 'showScheduledReminder',
            title: title,
            message: message,
            settings: settings
          });
          console.log('USF Autopay: Message sent to popup to show reminder');
        } catch (error) {
          console.error('USF Autopay: Error sending message to popup:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('USF Autopay: Error opening extension:', error);
    }
  }

  async showFullScreenReminder(title, message, settings = null) {
    try {
      console.log('USF Autopay: showFullScreenReminder called with:', { title, message, settings });
      
      // Get the currently active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('USF Autopay: Active tab:', activeTab.id, activeTab.url);
      
      if (activeTab) {
        try {
          console.log('USF Autopay: Injecting script into active tab...');
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: this.displayFullScreenReminder,
            args: [title, message, settings]
          });
          console.log('USF Autopay: Script injected into active tab successfully');
        } catch (scriptError) {
          console.error('USF Autopay: Error injecting script into active tab:', scriptError);
          console.log('USF Autopay: Script injection failed, but continuing...');
        }
      } else {
        console.log('USF Autopay: No active tab found');
      }
    } catch (error) {
      console.error('USF Autopay: Error in showFullScreenReminder:', error);
    }
  }

  displayFullScreenReminder(title, message, settings) {
    // This function runs in the USF page context
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
      <div style="
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
      ">
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
            <button id="pay-now-btn" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 15px 25px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
            ">Pay Now</button>
            <button id="remind-later-btn" style="
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
      </div>
    `;

    // Add event listeners
    const payNowBtn = overlay.querySelector('#pay-now-btn');
    const remindLaterBtn = overlay.querySelector('#remind-later-btn');

    payNowBtn.addEventListener('click', async () => {
      console.log('USF Autopay: Pay Now clicked - disabling reminders for this period');
      overlay.remove();
      
      // Disable reminders for this payment period only
      try {
        const result = await chrome.storage.local.get(['autopaySettings']);
        const currentSettings = result.autopaySettings || {};
        currentSettings.remindersDisabled = true;
        currentSettings.disabledReason = 'User selected Pay Now';
        currentSettings.disabledTimestamp = new Date().toISOString();
        
        // Calculate next payment period (next month)
        const currentPaymentDate = new Date(currentSettings.paymentDate);
        const nextPaymentDate = new Date(currentPaymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        // Update payment date to next period
        currentSettings.paymentDate = nextPaymentDate.toISOString().split('T')[0];
        
        // Calculate next reminder date (7 days before next payment)
        const nextReminderDate = new Date(nextPaymentDate);
        nextReminderDate.setDate(nextReminderDate.getDate() - 7);
        
        // Get custom reminder time from settings
        const reminderTime = currentSettings.reminderTime || '09:00';
        const [hours, minutes] = reminderTime.split(':').map(Number);
        nextReminderDate.setHours(hours, minutes, 0, 0);
        
        // Save updated settings
        await chrome.storage.local.set({ autopaySettings: currentSettings });
        
        // Clear current alarms
        await chrome.alarms.clearAll();
        
        // Schedule next reminder for 7 days before next payment
        await chrome.alarms.create('usfAutopay', {
          when: nextReminderDate.getTime()
        });
        
        // Show confirmation
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #27ae60;
          color: white;
          padding: 15px 25px;
          border-radius: 8px;
          z-index: 1000000;
          font-weight: bold;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        confirmation.textContent = `✅ Reminders disabled for this period! Next reminder scheduled for ${nextReminderDate.toLocaleDateString()}`;
        document.body.appendChild(confirmation);
        
        setTimeout(() => confirmation.remove(), 5000);
        
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
        
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f39c12;
          color: white;
          padding: 15px 25px;
          border-radius: 8px;
          z-index: 1000000;
          font-weight: bold;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        confirmation.textContent = '⏰ Reminder scheduled for 24 hours from now';
        document.body.appendChild(confirmation);
        
        setTimeout(() => confirmation.remove(), 5000);
        
        console.log('USF Autopay: Reminder scheduled for 24 hours later');
      } catch (error) {
        console.error('Error scheduling reminder:', error);
      }
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


  validateAutopaySettings(settings) {
    const required = ['childLastName', 'parentName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'monthlyAmount'];
    
    for (const field of required) {
      if (!settings[field] || (field === 'monthlyAmount' && settings[field] <= 0)) {
        return false;
      }
    }
    
    return true;
  }

  async scheduleNextPayment(settings) {
    try {
      // Calculate next payment date based on frequency
      const nextPayment = this.calculateNextReminderDate(settings);
      
      // Update settings with next payment date
      settings.nextPaymentDate = nextPayment.toISOString();
      await chrome.storage.local.set({ autopaySettings: settings });

      // Schedule next alarm
      await chrome.alarms.create('usfAutopay', {
        when: nextPayment.getTime()
      });

      console.log('Next payment scheduled for:', nextPayment.toISOString());

    } catch (error) {
      console.error('Error scheduling next payment:', error);
    }
  }

  calculateNextReminderDate(settings) {
    const now = new Date();
    const paymentDate = new Date(settings.paymentDate);
    
    // Get custom reminder time from settings
    const reminderTime = settings.reminderTime || '09:00';
    const [hours, minutes] = reminderTime.split(':').map(Number);
    
    // Calculate days until payment
    const timeDiff = paymentDate.getTime() - now.getTime();
    const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    console.log(`USF Autopay: Days until payment: ${daysUntilPayment}, Reminder time: ${reminderTime}`);
    
    if (daysUntilPayment <= 0) {
      // Payment is overdue, remind daily until paid or 7 days after deadline
      const nextReminder = new Date(now);
      
      // Check if the custom time for today has already passed
      const todayAtCustomTime = new Date(now);
      todayAtCustomTime.setHours(hours, minutes, 0, 0);
      
      if (now < todayAtCustomTime) {
        // Custom time hasn't passed today, schedule for today
        nextReminder.setHours(hours, minutes, 0, 0);
        console.log(`USF Autopay: Payment overdue, scheduling reminder for today at custom time: ${nextReminder.toISOString()}`);
      } else {
        // Custom time has passed today, schedule for tomorrow
        nextReminder.setDate(nextReminder.getDate() + 1);
        nextReminder.setHours(hours, minutes, 0, 0);
        console.log(`USF Autopay: Payment overdue, scheduling reminder for tomorrow at custom time: ${nextReminder.toISOString()}`);
      }
      
      return nextReminder;
    } else if (daysUntilPayment <= 7) {
      // Within 7 days, remind daily at custom time
      const nextReminder = new Date(now);
      
      // Check if the custom time for today has already passed
      const todayAtCustomTime = new Date(now);
      todayAtCustomTime.setHours(hours, minutes, 0, 0);
      
      if (now < todayAtCustomTime) {
        // Custom time hasn't passed today, schedule for today
        nextReminder.setHours(hours, minutes, 0, 0);
        console.log(`USF Autopay: Within 7 days, scheduling reminder for today at custom time: ${nextReminder.toISOString()}`);
      } else {
        // Custom time has passed today, schedule for tomorrow
        nextReminder.setDate(nextReminder.getDate() + 1);
        nextReminder.setHours(hours, minutes, 0, 0);
        console.log(`USF Autopay: Within 7 days, scheduling reminder for tomorrow at custom time: ${nextReminder.toISOString()}`);
      }
      
      return nextReminder;
    } else {
      // More than 7 days away, schedule reminder for 7 days before payment
      const reminderDate = new Date(paymentDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      reminderDate.setHours(hours, minutes, 0, 0); // Custom time
      console.log(`USF Autopay: More than 7 days away, scheduling reminder for 7 days before: ${reminderDate.toISOString()}`);
      return reminderDate;
    }
  }

  async notifyUser(title, message) {
    try {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: title,
        message: message
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async showEnhancedNotification(title, message, settings) {
    try {
      // Show a persistent notification that stays until user interacts
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: title,
        message: message,
        buttons: [
          { title: 'Pay Now' },
          { title: 'Remind Later' }
        ],
        requireInteraction: true, // Keep notification visible until user interacts
        priority: 2 // High priority to ensure it stays visible
      });

      // Also try to show full-screen reminder on current tab
      await this.showFullScreenReminder(title, message, settings);
      
    } catch (error) {
      console.error('Error showing enhanced notification:', error);
    }
  }

  async shouldShowNotificationToday(settings) {
    try {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['notificationHistory']);
      const history = result.notificationHistory || {};
      
      console.log(`USF Autopay: Checking notification history for ${today}`);
      console.log('USF Autopay: Notification history:', history);
      
      // Check if notification was already shown today
      if (history[today]) {
        console.log(`USF Autopay: Notification already shown today (${today}), skipping`);
        return false;
      }
      
      console.log(`USF Autopay: No notification shown today (${today}), proceeding`);
      return true;
    } catch (error) {
      console.error('Error checking notification history:', error);
      return true; // Default to showing notification if there's an error
    }
  }

  async markNotificationShownToday(settings) {
    try {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['notificationHistory']);
      const history = result.notificationHistory || {};
      
      // Mark notification as shown today
      history[today] = {
        shown: true,
        timestamp: new Date().toISOString(),
        paymentDate: settings.paymentDate
      };
      
      // Clean up old entries (keep only last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      Object.keys(history).forEach(dateStr => {
        const date = new Date(dateStr);
        if (date < thirtyDaysAgo) {
          delete history[dateStr];
        }
      });
      
      await chrome.storage.local.set({ notificationHistory: history });
      console.log(`USF Autopay: Marked notification as shown for ${today}`);
    } catch (error) {
      console.error('Error marking notification as shown:', error);
    }
  }

  async reEnableRemindersForNextPeriod(settings) {
    try {
      console.log('USF Autopay: Re-enabling reminders for next payment period');
      
      // Calculate next payment date (next month)
      const nextPaymentDate = new Date(settings.paymentDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      
      // Update settings
      settings.paymentDate = nextPaymentDate.toISOString();
      settings.remindersDisabled = false;
      settings.disabledReason = null;
      settings.disabledTimestamp = null;
      settings.enableAutopay = true;
      
      // Save updated settings
      await chrome.storage.local.set({ autopaySettings: settings });
      
      // Schedule next reminder for 7 days before the new payment date
      const reminderDate = new Date(nextPaymentDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      
      // Get custom reminder time from settings
      const reminderTime = settings.reminderTime || '09:00';
      const [hours, minutes] = reminderTime.split(':').map(Number);
      reminderDate.setHours(hours, minutes, 0, 0); // Custom time
      
      await chrome.alarms.create('usfAutopay', {
        when: reminderDate.getTime()
      });
      
      console.log(`USF Autopay: Reminders re-enabled for next period. Next payment: ${nextPaymentDate.toISOString()}, Reminder scheduled: ${reminderDate.toISOString()}`);
      
      // Show notification to user
      await this.notifyUser(
        'Reminders Re-enabled', 
        `Payment reminders have been automatically re-enabled for the next payment period (${nextPaymentDate.toLocaleDateString()}).`
      );
      
    } catch (error) {
      console.error('Error re-enabling reminders for next period:', error);
    }
  }

  async checkForSmartReminder() {
    try {
      console.log('USF Autopay: Checking for smart reminder on browser start');
      
      // Get current settings
      const result = await chrome.storage.local.get(['autopaySettings']);
      const settings = result.autopaySettings;

      if (!settings || !settings.enableAutopay) {
        console.log('USF Autopay: Autopay is disabled, skipping smart reminder check');
        return;
      }

      // Check if we have all required information
      if (!this.validateAutopaySettings(settings)) {
        console.log('USF Autopay: Invalid autopay settings, skipping smart reminder check');
        return;
      }

      // Send smart reminder if conditions are met
      await this.sendSmartReminder(settings);

    } catch (error) {
      console.error('Error checking for smart reminder:', error);
    }
  }
}

// Initialize background manager
console.log('USF Autopay: Background script starting...');
const backgroundManager = new BackgroundManager();
console.log('USF Autopay: Background manager initialized:', backgroundManager);