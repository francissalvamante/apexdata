"use client";

import { TelemetryDataPoint } from "@/lib/telemetry-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";

interface TelemetryChartsProps {
  telemetryData: TelemetryDataPoint[];
}

const TelemetryCharts = ({ telemetryData }: TelemetryChartsProps) => {
  // Process data for charts
  const chartData = telemetryData.map((point) => ({
    distance: point.distanceFromStart,
    speed: point.speed,
    throttle: point.throttle * 100, // Convert to percentage
    brake: point.brake * 100, // Convert to percentage
    gear: point.gear,
    rpm: point.engineRpm,
    drs: point.drs,
    engineTemp: point.engineTemp,
    // Average brake temperatures
    brakeTemp:
      (point.brakeTempFl +
        point.brakeTempFr +
        point.brakeTempRl +
        point.brakeTempRr) /
      4,
    // Average tyre surface temperatures
    tyreTemp:
      (point.tyreSurfaceTempFl +
        point.tyreSurfaceTempFr +
        point.tyreSurfaceTempRl +
        point.tyreSurfaceTempRr) /
      4,
    // Individual brake temperatures
    brakeTempFL: point.brakeTempFl,
    brakeTempFR: point.brakeTempFr,
    brakeTempRL: point.brakeTempRl,
    brakeTempRR: point.brakeTempRr,
    // Individual tyre temperatures
    tyreTempFL: point.tyreSurfaceTempFl,
    tyreTempFR: point.tyreSurfaceTempFr,
    tyreTempRL: point.tyreSurfaceTempRl,
    tyreTempRR: point.tyreSurfaceTempRr,
    // Tyre pressures
    tyrePressureFL: point.tyrePressureFl,
    tyrePressureFR: point.tyrePressureFr,
    tyrePressureRL: point.tyrePressureRl,
    tyrePressureRR: point.tyrePressureRr,
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number | string; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded p-3 shadow-lg">
          <p className="text-white font-medium">{`Distance: ${label}m`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${
                typeof entry.value === "number"
                  ? entry.value.toFixed(1)
                  : entry.value
              }${
                entry.name.includes("Temp")
                  ? "°C"
                  : entry.name.includes("Speed")
                  ? " km/h"
                  : entry.name.includes("RPM")
                  ? " rpm"
                  : entry.name.includes("Pressure")
                  ? " PSI"
                  : entry.name.includes("throttle") ||
                    entry.name.includes("brake")
                  ? "%"
                  : ""
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Speed */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">🏁 Speed</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              label={{
                value: "Speed (km/h)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="speed"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="Speed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Throttle */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          🟢 Throttle Input
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              domain={[0, 100]}
              label={{
                value: "Throttle (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="throttle"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Throttle"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Brake */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          🔴 Brake Input
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              domain={[0, 100]}
              label={{
                value: "Brake (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="brake"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Brake"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gear and RPM */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          ⚙️ Gear & Engine RPM
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              yAxisId="rpm"
              stroke="#9CA3AF"
              label={{
                value: "RPM",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              yAxisId="gear"
              orientation="right"
              stroke="#9CA3AF"
              domain={[0, 8]}
              label={{
                value: "Gear",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="rpm"
              type="monotone"
              dataKey="rpm"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              name="RPM"
            />
            <Bar yAxisId="gear" dataKey="gear" fill="#8B5CF6" name="Gear" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Engine and Brake Temperatures */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          🌡️ Engine & Brake Temperatures
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              label={{
                value: "Temperature (°C)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="engineTemp"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              name="Engine Temp"
            />
            <Line
              type="monotone"
              dataKey="brakeTemp"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Avg Brake Temp"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Individual Brake Temperatures */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          🟥 Brake Temperatures by Corner
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              label={{
                value: "Temperature (°C)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="brakeTempFL"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="Front Left"
            />
            <Line
              type="monotone"
              dataKey="brakeTempFR"
              stroke="#F97316"
              strokeWidth={2}
              dot={false}
              name="Front Right"
            />
            <Line
              type="monotone"
              dataKey="brakeTempRL"
              stroke="#DC2626"
              strokeWidth={2}
              dot={false}
              name="Rear Left"
            />
            <Line
              type="monotone"
              dataKey="brakeTempRR"
              stroke="#B91C1C"
              strokeWidth={2}
              dot={false}
              name="Rear Right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tyre Temperatures */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          🏎️ Tyre Surface Temperatures
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              label={{
                value: "Temperature (°C)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="tyreTempFL"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Front Left"
            />
            <Line
              type="monotone"
              dataKey="tyreTempFR"
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              name="Front Right"
            />
            <Line
              type="monotone"
              dataKey="tyreTempRL"
              stroke="#047857"
              strokeWidth={2}
              dot={false}
              name="Rear Left"
            />
            <Line
              type="monotone"
              dataKey="tyreTempRR"
              stroke="#065F46"
              strokeWidth={2}
              dot={false}
              name="Rear Right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tyre Pressures */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          💨 Tyre Pressures
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="distance"
              stroke="#9CA3AF"
              label={{
                value: "Distance (m)",
                position: "insideBottom",
                offset: -10,
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              label={{
                value: "Pressure (PSI)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#9CA3AF" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="tyrePressureFL"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              name="Front Left"
            />
            <Line
              type="monotone"
              dataKey="tyrePressureFR"
              stroke="#7C3AED"
              strokeWidth={2}
              dot={false}
              name="Front Right"
            />
            <Line
              type="monotone"
              dataKey="tyrePressureRL"
              stroke="#6D28D9"
              strokeWidth={2}
              dot={false}
              name="Rear Left"
            />
            <Line
              type="monotone"
              dataKey="tyrePressureRR"
              stroke="#5B21B6"
              strokeWidth={2}
              dot={false}
              name="Rear Right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          📊 Lap Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Max Speed</div>
            <div className="text-white font-bold text-xl">
              {Math.max(...chartData.map((d) => d.speed)).toFixed(0)} km/h
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Max RPM</div>
            <div className="text-white font-bold text-xl">
              {Math.max(...chartData.map((d) => d.rpm)).toLocaleString()} rpm
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Max Engine Temp</div>
            <div className="text-white font-bold text-xl">
              {Math.max(...chartData.map((d) => d.engineTemp)).toFixed(0)}°C
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Max Brake Temp</div>
            <div className="text-white font-bold text-xl">
              {Math.max(...chartData.map((d) => d.brakeTemp)).toFixed(0)}°C
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryCharts;
