# F1 Telemetry Frontend

A modern React-based dashboard for visualizing real-time F1 telemetry data, built with Next.js 15 and featuring comprehensive session analysis with interactive charts, responsive design for desktop and mobile devices.

## 🎯 Features

- **Real-time Dashboard**: Live telemetry visualization with WebSocket connectivity
- **Session Recording**: Manual session control with automatic flying lap detection
- **Telemetry Analysis**: Comprehensive session analysis with interactive charts
- **Session History**: Complete archive of recorded sessions with detailed visualization
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing
- **Interactive Charts**: Dynamic data visualization with Recharts including speed, throttle/brake, temperatures
- **Auto-reconnection**: Robust WebSocket handling with exponential backoff
- **Route Groups**: Clean URL structure with dashboard layouts
- **TypeScript**: Full type safety with shared backend interfaces
- **Modern UI**: Beautiful interface with TailwindCSS v4

## 📋 Project Structure

```
frontend/
├── app/                          # Next.js 15 App Router
│   ├── (dashboard)/             # Route group for dashboard pages
│   │   ├── layout.tsx          # Dashboard layout with navigation
│   │   ├── live/               # Live telemetry page
│   │   │   └── page.tsx        # Main telemetry dashboard
│   │   └── history/            # Session history and analysis
│   │       ├── page.tsx        # Session history listing
│   │       └── session/        # Individual session analysis
│   │           └── [id]/       # Dynamic session route
│   │               └── page.tsx # Session detail with charts
│   ├── globals.css             # Global styles and Tailwind
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                  # Reusable React components
│   ├── ui/                     # Base UI components
│   ├── telemetry/              # Telemetry-specific components
│   │   ├── session/            # Session management components
│   │   └── charts/             # Chart visualization components
│   │       └── TelemetryCharts.tsx # Comprehensive telemetry charts
├── hooks/                      # Custom React hooks
│   ├── useWebSocket.ts         # WebSocket connection management
│   ├── useTelemetry.ts         # Telemetry data state management
│   └── useSession.ts           # Session management and API calls
├── lib/                        # Utility functions
│   ├── telemetry-types.ts      # Shared TypeScript definitions
│   └── config.ts               # Configuration and API endpoints
├── public/                     # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🛠️ Technology Stack

- **Next.js 15** - React framework with App Router
- **React 19** - Component-based UI library
- **TypeScript** - Type-safe JavaScript development
- **TailwindCSS v4** - Utility-first CSS framework
- **Recharts** - Composable charting library for telemetry visualization
- **Supabase** - PostgreSQL database integration
- **Lucide React** - Modern icon library
- **clsx** - Conditional className utility

## 🚀 Installation & Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

The development server will start on `http://localhost:3000`.

## 🌐 Pages & Routes

### Dashboard Routes (Route Group)

All dashboard pages use the `(dashboard)` route group with shared layout:

- **`/live`** - Real-time telemetry dashboard
- **`/history`** - Session history archive with search and filtering
- **`/history/session/[id]`** - Individual session analysis with telemetry charts
- **`/settings`** - Configuration options (planned)

### Layout Structure

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-container">
      <Sidebar navigation />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  )
}
```

## 🔌 WebSocket Integration

### useWebSocket Hook

Custom hook for WebSocket connection management:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const MyComponent = () => {
  const { 
    isConnected, 
    connectionState, 
    lastMessage 
  } = useWebSocket('ws://localhost:3001/telemetry');
  
  return (
    <div>
      Status: {connectionState}
      {lastMessage && <div>{JSON.stringify(lastMessage)}</div>}
    </div>
  );
};
```

**Features:**
- Automatic reconnection with exponential backoff
- Connection state management
- Message queuing during disconnections
- Cleanup on component unmount

### useTelemetry Hook

Telemetry data state management:

```typescript
import { useTelemetry } from '@/hooks/useTelemetry';

const TelemetryDashboard = () => {
  const {
    carTelemetry,
    lapData,
    playerCarIndex,
    lastUpdate
  } = useTelemetry();
  
  const playerCar = carTelemetry?.[playerCarIndex];
  
  return (
    <div>
      Speed: {playerCar?.speed} KPH
      RPM: {playerCar?.engineRPM}
      Gear: {playerCar?.gear}
    </div>
  );
};
```

## 📊 Dashboard Components

### Live Telemetry Page (`/live`)

The main dashboard displays real-time F1 telemetry data:

#### Key Sections:
1. **Connection Status** - WebSocket connection indicator
2. **Session Controls** - Start/stop recording with session management
3. **Player Car Metrics** - Speed, RPM, gear, DRS status
4. **Input Controls** - Throttle, brake, steering visualization
5. **Temperature Monitoring** - Engine and tire temperatures
6. **Lap Information** - Current lap, sector times, position

### Session History Page (`/history`)

Archive of all recorded sessions with search and filtering:

#### Features:
1. **Session Cards** - Display session metadata, duration, lap count
2. **Search & Filter** - Find sessions by player name, track, car
3. **Session Statistics** - Quick overview of session performance
4. **Navigation** - Click cards to view detailed session analysis

### Session Detail Page (`/history/session/[id]`)

Comprehensive telemetry analysis for individual sessions:

#### Chart Components:
1. **Speed Chart** - LineChart showing speed vs distance
2. **Throttle Chart** - AreaChart for throttle input (0-100%)
3. **Brake Chart** - AreaChart for brake input (0-100%)
4. **Gear & RPM** - Combined visualization with dual Y-axes
5. **Temperature Charts** - Engine, brake temperatures by corner
6. **Tyre Analysis** - Surface temperatures and pressures by corner
7. **Lap Summary** - Maximum values and key statistics

#### Example Chart Component:

```typescript
// components/telemetry/charts/TelemetryCharts.tsx
interface TelemetryChartsProps {
  telemetryData: TelemetryDataPoint[];
}

const TelemetryCharts = ({ telemetryData }: TelemetryChartsProps) => {
  const chartData = telemetryData.map((point) => ({
    distance: point.distanceFromStart,
    speed: point.speed,
    throttle: point.throttle * 100,
    brake: point.brake * 100,
    // ... other telemetry fields
  }));

  return (
    <div className="space-y-8">
      {/* Speed Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">🏁 Speed</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="distance" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="speed" stroke="#3B82F6" strokeWidth={2} dot={false} name="Speed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Additional charts for throttle, brake, temperatures, etc. */}
    </div>
  );
};
```

### Responsive Design

The dashboard adapts to different screen sizes:

```typescript
// Desktop: Full sidebar navigation
// Tablet: Collapsible sidebar
// Mobile: Bottom navigation tabs

<div className="hidden md:flex md:w-64 md:flex-col">
  {/* Desktop Sidebar */}
</div>

<div className="md:hidden">
  {/* Mobile Navigation */}
</div>
```

## 🎨 Styling & Theming

### Tailwind Configuration

Custom design system with F1-inspired colors:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#FF1E00',
          white: '#FFFFFF',
          dark: '#15151E',
          gray: '#38383F'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite'
      }
    }
  }
}
```

### Component Styling Patterns

```typescript
// Consistent styling patterns
const cardStyles = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6";
const buttonStyles = "px-4 py-2 bg-f1-red text-white rounded-md hover:bg-red-600";
const inputStyles = "border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-f1-red";
```

## 🔧 Development Workflow

### Adding New Components

1. **Create component** in appropriate directory:
   ```typescript
   // components/telemetry/NewComponent.tsx
   interface NewComponentProps {
     data: TelemetryData;
   }
   
   export function NewComponent({ data }: NewComponentProps) {
     return <div>{/* Component JSX */}</div>;
   }
   ```

2. **Export from index**:
   ```typescript
   // components/telemetry/index.ts
   export { NewComponent } from './NewComponent';
   ```

3. **Use in pages**:
   ```typescript
   // app/(dashboard)/live/page.tsx
   import { NewComponent } from '@/components/telemetry';
   ```

### Custom Hooks Pattern

```typescript
// hooks/useCustomHook.ts
import { useState, useEffect } from 'react';

export function useCustomHook() {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  return { state, setState };
}
```

### Type Safety

Shared types from backend ensure consistency:

```typescript
// lib/types.ts
export interface CarTelemetryData {
  speed: number;
  throttle: number;
  brake: number;
  steer: number;
  gear: number;
  engineRPM: number;
  // ... matches backend types exactly
}
```

## 📱 Responsive Breakpoints

Tailwind CSS breakpoint system:

```typescript
// Mobile-first approach
const ResponsiveComponent = () => (
  <div className="
    grid grid-cols-1 gap-4        // Mobile: 1 column
    md:grid-cols-2 md:gap-6       // Tablet: 2 columns
    lg:grid-cols-3 lg:gap-8       // Desktop: 3 columns
    xl:grid-cols-4               // Large: 4 columns
  ">
    {/* Content */}
  </div>
);
```

## 🚨 Error Handling

### WebSocket Error Handling

```typescript
// hooks/useWebSocket.ts
const handleWebSocketError = (error: Event) => {
  console.error('WebSocket error:', error);
  setConnectionState('error');
  // Attempt reconnection with exponential backoff
  setTimeout(() => reconnect(), retryDelay);
};
```

### Component Error Boundaries

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with telemetry display.</div>;
    }
    return this.props.children;
  }
}
```

## 🎯 Performance Optimization

### React Optimization

```typescript
// Memoize expensive calculations
const processedTelemetry = useMemo(() => {
  return processTelemetryData(rawTelemetry);
}, [rawTelemetry]);

// Prevent unnecessary re-renders
const MemoizedComponent = memo(({ data }) => {
  return <div>{data.value}</div>;
});
```

### WebSocket Optimization

- Debounced state updates for high-frequency data
- Message queuing during temporary disconnections
- Selective component updates based on data changes

## 🧪 Testing

### Component Testing (Planned)

```bash
npm run test              # Run test suite
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Manual Testing Checklist

- [ ] WebSocket connects to backend successfully
- [ ] Real-time data updates display correctly
- [ ] Dashboard responsive on mobile/tablet/desktop
- [ ] Auto-reconnection works after network interruption
- [ ] Error states display appropriate messages

## 🔮 Roadmap

### Short Term
- [x] Historical data visualization pages ✅
- [x] Session-based telemetry analysis ✅
- [x] Interactive telemetry charts ✅
- [ ] Settings page for WebSocket configuration
- [ ] Dark mode theme toggle
- [ ] Performance metrics dashboard

### Medium Term
- [ ] Chart export functionality (PNG, SVG)
- [ ] Telemetry data filtering and search
- [ ] Lap comparison analysis tools
- [ ] Real-time notifications for events
- [ ] Session data export (CSV, JSON)

### Long Term  
- [ ] 3D track visualization
- [ ] Advanced analytics and insights
- [ ] Social sharing features
- [ ] Mobile app (React Native)

## 📞 Support & Troubleshooting

### Common Issues

**WebSocket won't connect:**
```bash
# Check if backend is running
curl http://localhost:3001

# Verify WebSocket endpoint
# Should be: ws://localhost:3001/telemetry
```

**No telemetry data displaying:**
1. Check WebSocket connection status indicator
2. Verify F1 game is sending data to backend
3. Check browser developer console for errors

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

**Performance issues:**
- Check WebSocket message frequency (should be ~60Hz)
- Monitor React DevTools for unnecessary re-renders
- Verify component memoization for expensive operations

### Development Tools

- **React DevTools** - Component inspection
- **Next.js DevTools** - Route and performance analysis
- **WebSocket King** - WebSocket connection testing
- **Tailwind CSS IntelliSense** - CSS class autocomplete
