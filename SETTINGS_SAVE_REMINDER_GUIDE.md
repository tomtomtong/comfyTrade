# Settings Save Reminder Feature

## Overview
The settings modal now includes a save reminder system that prevents accidental loss of changes when closing the settings dialog.

## Features

### 1. Change Tracking
- Automatically detects when settings have been modified
- Tracks changes in:
  - Overtrade control settings (enabled/disabled, max trades, time period, etc.)
  - Quick symbols (adding/removing symbols)
  - All form inputs in the settings modal

### 2. Visual Indicators
- **Asterisk (*)** appears next to "Settings" title when there are unsaved changes
- **Close button** turns red when there are unsaved changes
- Clear visual feedback to indicate unsaved state

### 3. Save Reminder Dialog
When attempting to close settings with unsaved changes, a custom dialog appears with three options:
- **Save & Close**: Saves all changes and closes the settings modal
- **Discard Changes**: Closes without saving (discards all changes)
- **Continue Editing**: Returns to settings modal to continue editing

### 4. Multiple Close Methods Supported
The save reminder works for all ways of closing the settings:
- Clicking the "Close" button
- Clicking outside the modal
- Pressing the Escape key

## How It Works

### Change Detection
```javascript
// Automatically tracks changes in form inputs
function markSettingsAsChanged() {
  settingsHasUnsavedChanges = true;
  updateSettingsVisualIndicator();
}
```

### Visual Feedback
```css
/* Red asterisk next to title */
.settings-modal.has-unsaved-changes h2::after {
  content: " *";
  color: #ff6b6b;
}

/* Red close button */
.settings-modal.has-unsaved-changes .modal-buttons #closeSettingsBtn {
  background-color: #ff6b6b;
}
```

### Save Reminder Dialog
- Custom styled dialog with clear options
- Prevents accidental data loss
- User-friendly interface with descriptive buttons

## Usage

1. **Open Settings**: Click the Settings button in the main interface
2. **Make Changes**: Modify any settings (overtrade controls, quick symbols, etc.)
3. **Notice Visual Indicators**: See the red asterisk (*) next to "Settings" and red close button
4. **Attempt to Close**: Try to close via any method (button, outside click, Escape key)
5. **Choose Action**: Select from the three options in the reminder dialog

## Benefits

- **Prevents Data Loss**: No more accidentally losing settings changes
- **Clear Feedback**: Visual indicators show when changes need saving
- **Flexible Options**: Users can save, discard, or continue editing
- **Consistent Experience**: Works the same way regardless of how user tries to close
- **User-Friendly**: Custom dialog is more intuitive than browser confirm dialogs

## Technical Implementation

The feature uses:
- JavaScript event listeners for change tracking
- CSS classes for visual indicators
- Custom modal dialog for better UX
- State management to track unsaved changes
- Event handling for multiple close methods

This ensures a professional, user-friendly experience that prevents accidental loss of settings changes.