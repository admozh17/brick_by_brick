# Video Information Extractor Mobile App

A React Native mobile application for the Video Information Extractor system, built with Expo.

## Features

- **📱 Mobile-First Design**: Native mobile experience with smooth animations
- **🗺️ Places Gallery**: Browse all extracted places with infinite scroll
- **📤 Video Upload**: Process Instagram Reels, TikTok, and YouTube Shorts
- **🔍 Semantic Search**: Find places using natural language queries
- **⚡ Real-time Updates**: Live connection to the Flask backend
- **🎨 Modern UI**: Beautiful Material Design with React Native Paper

## Screens

### 1. Places Screen
- **Gallery View**: All extracted places in a beautiful card layout
- **Pull to Refresh**: Update the list with latest data
- **Infinite Scroll**: Load more places as you scroll
- **Place Details**: View place name, genre, address, and takeaways

### 2. Upload Screen
- **URL Input**: Enter video URLs from social media platforms
- **Processing Status**: Real-time feedback during video processing
- **Results Display**: View extracted places immediately after processing
- **Error Handling**: Clear error messages for failed uploads

### 3. Search Screen
- **Semantic Search**: Find places using natural language
- **Multiple Search Types**: Search by name, genre, or semantic similarity
- **Search Examples**: Quick access to common search queries
- **Similarity Scoring**: Results ranked by relevance

## Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- The Flask backend running on `localhost:8080`

## Installation

1. **Install dependencies:**
   ```bash
   cd VideoExtractorApp
   npm install
   ```

2. **Start the Flask backend:**
   ```bash
   # In the parent directory
   python3 run_app.py
   ```

3. **Start the mobile app:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Development

### Project Structure
```
VideoExtractorApp/
├── src/
│   └── screens/
│       ├── PlacesScreen.tsx    # Places gallery
│       ├── UploadScreen.tsx    # Video upload
│       └── SearchScreen.tsx    # Semantic search
├── App.tsx                     # Main app with navigation
├── package.json               # Dependencies
└── README.md                  # This file
```

### Key Technologies
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **React Navigation**: Tab-based navigation
- **React Native Paper**: Material Design components
- **Axios**: HTTP client for API calls
- **TypeScript**: Type-safe development

### API Integration
The app connects to the Flask backend at `http://localhost:8080` and uses these endpoints:
- `GET /places` - Fetch all places with pagination
- `POST /process-url` - Process video URLs
- `GET /search` - Search places with various filters

## Configuration

### API Base URL
To change the backend URL, update the `API_BASE_URL` constant in each screen:
```typescript
const API_BASE_URL = 'http://your-server-ip:8080';
```

### Development vs Production
For production deployment, you'll need to:
1. Update API URLs to your production server
2. Configure Expo for production builds
3. Set up proper error handling for network issues

## Troubleshooting

### Common Issues

1. **Connection Error**: Make sure the Flask backend is running on port 8080
2. **Metro Bundler Issues**: Try `expo start --clear`
3. **iOS Simulator Issues**: Reset simulator and try again
4. **Android Emulator Issues**: Check AVD settings and try cold boot

### Debug Mode
Enable debug mode by shaking your device or pressing `Cmd+D` (iOS) / `Cmd+M` (Android) in the simulator.

## Building for Production

1. **Configure app.json** with your app details
2. **Build for iOS:**
   ```bash
   expo build:ios
   ```
3. **Build for Android:**
   ```bash
   expo build:android
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## License

This project is part of the Video Information Extractor system. 