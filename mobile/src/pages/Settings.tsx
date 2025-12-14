import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSettings } from '../contexts/SettingsContext';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    companyName: settings.companyName,
    currency: settings.currency,
    taxRate: settings.taxRate * 100, // Convert to percentage for display
    lowStockThreshold: settings.lowStockThreshold,
    showNotifications: settings.showNotifications,
    theme: settings.theme,
    dailyReportEnabled: settings.dailyReportEnabled,
    dailyReportTime: settings.dailyReportTime
  });
  
  const [saveMessage, setSaveMessage] = useState('');
  
  // Update local state when settings change
  useEffect(() => {
    setFormValues({
      companyName: settings.companyName,
      currency: settings.currency,
      taxRate: settings.taxRate * 100,
      lowStockThreshold: settings.lowStockThreshold,
      showNotifications: settings.showNotifications,
      theme: settings.theme,
      dailyReportEnabled: settings.dailyReportEnabled,
      dailyReportTime: settings.dailyReportTime
    });
  }, [settings]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert tax rate back to decimal
    const updatedSettings = {
      ...formValues,
      taxRate: formValues.taxRate / 100
    };
    
    updateSettings(updatedSettings);
    
    // Show save message
    setSaveMessage('Settings saved successfully');
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };
  
  return (
    <Layout title="Settings">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Application Settings</h2>
          
          {saveMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center animate-fadeIn">
              <CheckIcon className="h-5 w-5 mr-2" />
              {saveMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Company Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="companyName" className="form-label">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      className="form-input"
                      value={formValues.companyName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="currency" className="form-label">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      className="form-select"
                      value={formValues.currency}
                      onChange={handleInputChange}
                    >
                      <option value="TZS">TZS - Tanzanian Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="UGX">UGX - Ugandan Shilling</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="taxRate" className="form-label">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      id="taxRate"
                      name="taxRate"
                      className="form-input"
                      value={formValues.taxRate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Inventory Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Inventory Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="lowStockThreshold" className="form-label">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      id="lowStockThreshold"
                      name="lowStockThreshold"
                      className="form-input"
                      value={formValues.lowStockThreshold}
                      onChange={handleInputChange}
                      min="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Items with quantity below this value will be marked as low stock
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Notification Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showNotifications"
                      name="showNotifications"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      checked={formValues.showNotifications}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="showNotifications" className="ml-2 block text-sm text-gray-700">
                      Show in-app notifications
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Appearance Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Appearance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="theme" className="form-label">
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      className="form-select"
                      value={formValues.theme}
                      onChange={handleInputChange}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Report Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Report Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dailyReportEnabled"
                      name="dailyReportEnabled"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      checked={formValues.dailyReportEnabled}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="dailyReportEnabled" className="ml-2 block text-sm text-gray-700">
                      Generate daily reports
                    </label>
                  </div>
                  
                  {formValues.dailyReportEnabled && (
                    <div className="form-group ml-6 mt-2">
                      <label htmlFor="dailyReportTime" className="form-label">
                        Report Time
                      </label>
                      <input
                        type="time"
                        id="dailyReportTime"
                        name="dailyReportTime"
                        className="form-input"
                        value={formValues.dailyReportTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 