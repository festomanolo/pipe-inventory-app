# Pipe Inventory App - Windows Unpacked Version

This is the Windows unpacked version of the Pipe Inventory App. This version contains all the application files separately, which can be useful for advanced users or for custom deployments.

## System Requirements

- Windows 10 or Windows 11 (64-bit)
- At least 4GB of RAM
- At least 200MB of free disk space

## Installation Instructions

Since this is an unpacked application, follow these steps:

1. Extract the entire `win-unpacked` folder to a location of your choice
2. Navigate to the extracted folder
3. Run the `Pipe Inventory.exe` file to start the application

## Advantages of the Unpacked Version

The unpacked version offers several advantages:

1. **Customization**: You can modify resources or configuration files directly
2. **Portability**: The entire folder can be moved or copied to other locations
3. **Troubleshooting**: Easier to diagnose issues by examining individual components
4. **Updates**: Individual files can be updated without replacing the entire application

## Data Storage

The application stores its data in a SQLite database file named `pipe-inventory.db` which will be created in the application directory when you first run the application.

## First-Time Setup

When you run the application for the first time:

1. The application will create a database file in the same directory
2. You can start adding inventory items immediately
3. The data will be stored locally on your computer

## Features

- Inventory management for pipe products and hardware items
- Product categorization and type filtering
- Stock level tracking with low-stock alerts
- Search functionality
- Data persistence using SQLite database

## Troubleshooting

If you encounter any issues:

1. **Application won't start**: Make sure you have the latest Windows updates installed
2. **Missing DLL errors**: Ensure all files from the unpacked folder remain together
3. **Database errors**: Check if you have write permissions in the directory where the app is located
4. **Display issues**: Try running the app in compatibility mode for Windows 10

## Data Backup

To back up your data:

1. Locate the `pipe-inventory.db` file in the application directory
2. Copy this file to a safe location regularly
3. To restore data, replace the current database file with your backup

## Contact

If you need assistance or want to report issues, please contact the developer.

---

Thank you for using Pipe Inventory App! 