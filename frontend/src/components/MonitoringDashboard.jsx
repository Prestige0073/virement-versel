/**
 * Monitoring Dashboard Component
 * Real-time metrics and alerting for Phase 7
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({
    apiResponseTime: 0,
    activeConnections: 0,
    failureRate: 0,
    webhookDelivery: 0,
    cacheHitRate: 0,
    rpsCount: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch metrics from backend
   */
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/metrics/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setMetrics(response.data.metrics);
      setAlerts(response.data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, []);

  /**
   * Fetch historical data for charts
   */
  const fetchHistoricalData = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/metrics/history?hours=24', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setHistoricalData(response.data.history);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchHistoricalData();

    // Refresh metrics every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchHistoricalData]);

  const getStatusColor = (metric, value) => {
    if (metric === 'apiResponseTime') {
      if (value < 200) return 'green';
      if (value < 500) return 'yellow';
      return 'red';
    }
    if (metric === 'failureRate') {
      if (value < 0.1) return 'green';
      if (value < 0.5) return 'yellow';
      return 'red';
    }
    if (metric === 'cacheHitRate' || metric === 'webhookDelivery') {
      if (value > 95) return 'green';
      if (value > 80) return 'yellow';
      return 'red';
    }
    return 'blue';
  };

  if (loading) {
    return <div className="p-4">Loading metrics...</div>;
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold">📊 Monitoring Dashboard</h1>
        <p className="text-gray-400 mt-2">Real-time platform metrics and performance</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-900 border border-red-700 rounded p-4">
          <h2 className="font-bold mb-3">⚠️ Active Alerts ({alerts.length})</h2>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="bg-red-800 p-3 rounded text-sm">
                <span className="font-mono">{alert.type}</span>: {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* API Response Time */}
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">API Response Time</p>
              <p className="text-3xl font-bold mt-2">{metrics.apiResponseTime}ms</p>
            </div>
            <div
              className={`w-4 h-4 rounded-full bg-${getStatusColor(
                'apiResponseTime',
                metrics.apiResponseTime
              )}-500`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">Target: &lt; 200ms (99th percentile)</div>
        </div>

        {/* Active Connections */}
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Active WebSocket Connections</p>
              <p className="text-3xl font-bold mt-2">{metrics.activeConnections}</p>
            </div>
            <div className="w-4 h-4 rounded-full bg-blue-500" />
          </div>
          <div className="text-xs text-gray-500 mt-2">Concurrent users connected</div>
        </div>

        {/* Failure Rate */}
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Failure Rate</p>
              <p className="text-3xl font-bold mt-2">{(metrics.failureRate * 100).toFixed(2)}%</p>
            </div>
            <div
              className={`w-4 h-4 rounded-full bg-${getStatusColor(
                'failureRate',
                metrics.failureRate
              )}-500`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">Target: &lt; 0.1%</div>
        </div>

        {/* Webhook Delivery */}
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Webhook Delivery Rate</p>
              <p className="text-3xl font-bold mt-2">{metrics.webhookDelivery.toFixed(1)}%</p>
            </div>
            <div
              className={`w-4 h-4 rounded-full bg-${getStatusColor(
                'webhookDelivery',
                metrics.webhookDelivery
              )}-500`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">Successfully delivered within 30s</div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Cache Hit Rate</p>
              <p className="text-3xl font-bold mt-2">{metrics.cacheHitRate.toFixed(1)}%</p>
            </div>
            <div
              className={`w-4 h-4 rounded-full bg-${getStatusColor(
                'cacheHitRate',
                metrics.cacheHitRate
              )}-500`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">Target: &gt; 80%</div>
        </div>

        {/* Requests Per Second */}
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Throughput</p>
              <p className="text-3xl font-bold mt-2">{metrics.rpsCount} req/s</p>
            </div>
            <div className="w-4 h-4 rounded-full bg-green-500" />
          </div>
          <div className="text-xs text-gray-500 mt-2">Current requests per second</div>
        </div>
      </div>

      {/* Performance Legend */}
      <div className="bg-gray-800 rounded p-4 border border-gray-700">
        <h3 className="font-bold mb-3">Status Legend</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Healthy / Within Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Warning / Approaching Limit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical / Exceeding Limit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Informational</span>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      {historicalData.length > 0 && (
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <h3 className="font-bold mb-3">24-Hour History (Last 10 entries)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Avg Response</th>
                <th className="text-left py-2">Connections</th>
                <th className="text-left py-2">Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {historicalData.slice(-10).map((entry, idx) => (
                <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-2">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2">{entry.avgResponse}ms</td>
                  <td className="py-2">{entry.connections}</td>
                  <td className="py-2">{(entry.errorRate * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Performance Targets */}
      <div className="bg-gray-800 rounded p-4 border border-gray-700">
        <h3 className="font-bold mb-3">🎯 Phase 7 Performance Targets</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>API Response: &lt; 200ms (99th percentile)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Webhook Delivery: &lt; 30s</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Cache Hit Rate: &gt; 80%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Uptime: &gt; 99.9%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Error Rate: &lt; 0.1%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Throughput: &gt; 1000 req/sec</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
