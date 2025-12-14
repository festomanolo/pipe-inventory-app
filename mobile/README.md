# Pipe Inventory Mobile App

A mobile version of the Pipe Inventory Management System built with React, Tailwind CSS, Vite, and Capacitor.

## Features

- **Inventory Management**: Track products, categories, stock levels, and pricing
- **Sales Recording**: Create and manage sales transactions
- **Customer Management**: Maintain customer information and purchase history
- **Reports & Analytics**: Generate reports and view business analytics
- **Settings**: Configure application preferences

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Mobile Framework**: Capacitor
- **Icons**: Heroicons
- **Date Handling**: Moment.js

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 7.x or higher
- Android Studio (for building Android APK)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pipe-inventory-app.git
cd pipe-inventory-app/mobile
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

### Building for Android

1. Build the web app
```bash
npm run build
```

2. Add Android platform
```bash
npx cap add android
```

3. Copy web assets to Android
```bash
npx cap copy android
```

4. Update native plugins
```bash
npx cap update android
```

5. Open in Android Studio
```bash
npx cap open android
```

6. Build the APK from Android Studio

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React context providers
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── services/        # API and service functions
│   └── assets/          # Static assets
├── public/              # Public assets
├── capacitor.config.ts  # Capacitor configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.ts       # Vite configuration
└── index.html           # HTML entry point
```

## Data Storage

The mobile app uses local storage for data persistence. In a production environment, this would be enhanced with:

- SQLite for local database storage
- Cloud synchronization with Supabase or similar service
- Offline-first capabilities with background sync

## License

This project is licensed under the ISC License.

## Acknowledgments

- This mobile app is based on the desktop version of Pipe Inventory Management System
- Uses the same design language and business logic as the desktop version
