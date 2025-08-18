# F1 Telemetry Web App

A comprehensive real-time telemetry application for EA Sports F1 25/24 games, featuring a Node.js backend for UDP data collection and a Next.js frontend for live visualization.

## 🏎️ Features

- **Real-time Telemetry**: Captures UDP telemetry data from F1 25/24 games at 60Hz
- **Live Dashboard**: Interactive web dashboard with real-time data visualization
- **WebSocket Streaming**: Low-latency data transmission to frontend clients
- **F1 25 Compliant**: Fully compatible with official EA Sports F1 25 telemetry specification
- **Multi-car Support**: Tracks telemetry for all 22 cars simultaneously
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📋 Project Structure

```
apexdata/
├── backend/                    # Node.js + Fastify backend
│   ├── src/
│   │   ├── server.ts          # Main server entry point
│   │   ├── types/             # TypeScript type definitions
│   │   ├── telemetry/         # UDP listener and packet parsers
│   │   └── websocket/         # WebSocket server for real-time streaming
│   ├── package.json
│   └── README.md
├── frontend/                   # Next.js React frontend
│   ├── app/                   # Next.js App Router structure
│   │   └── (dashboard)/       # Dashboard route group
│   ├── components/            # Reusable React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── package.json
│   └── README.md
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- F1 25 or F1 24 game with telemetry enabled
- UDP telemetry configured to broadcast on port 20777

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apexdata
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will start on `http://localhost:3001`

2. **Start the frontend application**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

3. **Configure F1 Game Settings**
   - Launch F1 25 or F1 24
   - Go to Settings → Telemetry Settings
   - Enable UDP Telemetry
   - Set IP Address to your computer's IP (127.0.0.1 for local)
   - Set Port to 20777
   - Set Send Rate to 60Hz (maximum)

4. **View Live Telemetry**
   - Navigate to `http://localhost:3000/live`
   - Start a race or practice session in F1 game
   - Watch real-time telemetry data stream in

## 🎮 F1 Game Configuration

### F1 25 Settings
- **Telemetry Settings → UDP Telemetry**: ON
- **IP Address**: 127.0.0.1 (for local development)
- **Port**: 20777
- **Send Rate**: 60Hz
- **Format**: 2025

### F1 24 Settings
- **Telemetry Settings → UDP Telemetry**: ON
- **IP Address**: 127.0.0.1 (for local development)  
- **Port**: 20777
- **Send Rate**: 60Hz
- **Format**: 2024

## 📊 Telemetry Data Types

The application supports multiple F1 telemetry packet types:

- **Car Telemetry** (Type 6): Speed, throttle, brake, steering, RPM, temperatures
- **Lap Data** (Type 2): Lap times, sector times, positions, pit status
- **Session Data** (Type 1): Weather, track temperature, session type
- **Participants** (Type 4): Driver names, team info
- **Motion Data** (Type 0): G-forces, velocity, acceleration
- **Car Status** (Type 7): Fuel levels, tire wear, damage
- **And more...** (10 total packet types supported)

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Fastify** - High-performance web framework
- **TypeScript** - Type-safe JavaScript
- **ws** - WebSocket implementation
- **dgram** - UDP socket handling

### Frontend  
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization library

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Frontend Development
```bash
cd frontend
npm run dev        # Start Next.js development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Testing Telemetry
Use the included test UDP sender to simulate F1 telemetry data:
```bash
cd backend
node test-udp-sender.js
```

## 🌟 Features in Development

- [ ] Historical data storage and analysis
- [ ] User authentication and profiles
- [ ] Data export functionality (CSV, JSON)
- [ ] Advanced telemetry visualizations
- [ ] Race strategy analysis tools
- [ ] Multiplayer session support
- [ ] Mobile-first responsive design enhancements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is not affiliated with or endorsed by EA Sports, Codemasters, or Formula 1. It is an independent project for educational and entertainment purposes.

## 🆘 Troubleshooting

### Common Issues

**No telemetry data received:**
- Ensure F1 game telemetry is enabled
- Check that port 20777 is not blocked by firewall
- Verify IP address configuration in game settings

**WebSocket connection failed:**
- Ensure backend server is running on port 3001
- Check for port conflicts with other applications
- Verify WebSocket endpoint URL in frontend

**Build errors:**
- Ensure Node.js version is 18 or higher
- Clear node_modules and reinstall dependencies
- Check TypeScript version compatibility

For more detailed troubleshooting, see the individual README files in the `backend/` and `frontend/` directories.
