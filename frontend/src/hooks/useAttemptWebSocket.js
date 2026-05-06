import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Phase 7: Real-Time WebSocket Integration Hook
 * 
 * Enables real-time updates for transfer attempts via WebSocket
 * - Status changes
 * - Step progression
 * - Error notifications
 * - Live progress tracking
 */

export function useAttemptWebSocket(attemptId) {
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!attemptId) return;

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/attempts/${attemptId}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setWsStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log(`✅ WebSocket connected for attempt: ${attemptId}`);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setUpdates((prev) => [
            {
              ...data,
              receivedAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        setWsStatus('error');
        setError('WebSocket connection error');
        console.error('WebSocket error:', event);
      };

      wsRef.current.onclose = () => {
        setWsStatus('disconnected');
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `🔄 Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
            );
            connect();
          }, RECONNECT_INTERVAL);
        } else {
          setError('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      setError(`WebSocket connection failed: ${err.message}`);
      console.error('WebSocket error:', err);
    }
  }, [attemptId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setWsStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not ready, message queued');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [attemptId, connect, disconnect]);

  return {
    wsStatus,
    updates,
    error,
    sendMessage,
    reconnect: connect,
    disconnect,
    isConnected: wsStatus === 'connected',
  };
}

/**
 * Hook for subscribing to specific attempt events
 */
export function useAttemptEvents(attemptId) {
  const { updates } = useAttemptWebSocket(attemptId);

  const getEventsByType = (eventType) => {
    return updates.filter((u) => u.event === eventType);
  };

  const getLatestEvent = (eventType) => {
    const events = getEventsByType(eventType);
    return events.length > 0 ? events[0] : null;
  };

  return {
    allUpdates: updates,
    stepStarted: getLatestEvent('step_started'),
    stepCompleted: getLatestEvent('step_completed'),
    stepFailed: getLatestEvent('step_failed'),
    stepSkipped: getLatestEvent('step_skipped'),
    validationError: getLatestEvent('validation_error'),
    attemptCompleted: getLatestEvent('attempt_completed'),
    attemptFailed: getLatestEvent('attempt_failed'),
    webhookSent: getLatestEvent('webhook_sent'),
    getEventsByType,
    getLatestEvent,
  };
}

/**
 * Hook for real-time progress tracking
 */
export function useAttemptProgress(attemptId) {
  const { updates, isConnected } = useAttemptWebSocket(attemptId);
  const [progress, setProgress] = useState({
    currentStep: 0,
    totalSteps: 0,
    percentage: 0,
  });

  useEffect(() => {
    const lastUpdate = updates.find((u) =>
      ['step_started', 'step_completed', 'step_skipped'].includes(u.event)
    );

    if (lastUpdate) {
      setProgress({
        currentStep: lastUpdate.stepNumber || 0,
        totalSteps: lastUpdate.totalSteps || 5,
        percentage: ((lastUpdate.stepNumber || 0) / (lastUpdate.totalSteps || 5)) * 100,
      });
    }
  }, [updates]);

  return {
    ...progress,
    isLive: isConnected,
    updateCount: updates.length,
  };
}

/**
 * Hook for webhook delivery status tracking
 */
export function useWebhookStatus(attemptId) {
  const { updates } = useAttemptWebSocket(attemptId);
  const [webhooks, setWebhooks] = useState([]);

  useEffect(() => {
    const webhookUpdates = updates.filter(
      (u) =>
        u.event === 'webhook_sent' ||
        u.event === 'webhook_failed' ||
        u.event === 'webhook_retry'
    );

    const webhookMap = new Map();

    webhookUpdates.forEach((update) => {
      const id = `${update.event}_${update.url}`;
      webhookMap.set(id, {
        event: update.event,
        url: update.url,
        status: update.status,
        timestamp: update.receivedAt,
        attempt: update.attempt,
        nextRetry: update.nextRetry,
      });
    });

    setWebhooks(Array.from(webhookMap.values()));
  }, [updates]);

  return {
    webhooks,
    successCount: webhooks.filter((w) => w.event === 'webhook_sent').length,
    failureCount: webhooks.filter((w) => w.event === 'webhook_failed').length,
    retryCount: webhooks.filter((w) => w.event === 'webhook_retry').length,
  };
}

/**
 * Hook for error tracking
 */
export function useAttemptErrors(attemptId) {
  const { updates } = useAttemptWebSocket(attemptId);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const errorUpdates = updates.filter(
      (u) =>
        u.event === 'validation_error' ||
        u.event === 'step_failed' ||
        u.event === 'attempt_failed' ||
        u.event === 'connection_error'
    );

    const errorMap = new Map();

    errorUpdates.forEach((update) => {
      const id = `${update.event}_${update.timestamp}`;
      errorMap.set(id, {
        event: update.event,
        message: update.message,
        severity: update.severity || 'warning',
        timestamp: update.receivedAt,
        details: update.details,
      });
    });

    setErrors(Array.from(errorMap.values()).slice(0, 10)); // Keep last 10 errors
  }, [updates]);

  const hasErrors = errors.length > 0;
  const hasWarnings = errors.some((e) => e.severity === 'warning');
  const hasCritical = errors.some((e) => e.severity === 'critical');

  return {
    errors,
    hasErrors,
    hasWarnings,
    hasCritical,
    lastError: errors[0] || null,
  };
}

/**
 * Hook for activity feed / timeline
 */
export function useAttemptTimeline(attemptId) {
  const { updates } = useAttemptWebSocket(attemptId);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    const events = updates
      .filter((u) =>
        [
          'step_started',
          'step_completed',
          'step_failed',
          'step_skipped',
          'validation_error',
          'webhook_sent',
          'attempt_completed',
          'attempt_failed',
        ].includes(u.event)
      )
      .map((update) => ({
        id: `${update.event}_${update.timestamp}`,
        event: update.event,
        eventType: getEventCategory(update.event),
        title: getEventTitle(update.event, update),
        description: update.message || '',
        timestamp: update.receivedAt,
        icon: getEventIcon(update.event),
        color: getEventColor(update.event),
      }));

    setTimeline(events);
  }, [updates]);

  return { timeline };
}

// Helper functions
function getEventCategory(event) {
  if (event.startsWith('step_')) return 'step';
  if (event.startsWith('webhook_')) return 'webhook';
  if (event.startsWith('validation_')) return 'validation';
  if (event.startsWith('attempt_')) return 'attempt';
  return 'other';
}

function getEventTitle(event, data) {
  const titles = {
    step_started: `Step "${data.stepName}" started`,
    step_completed: `Step "${data.stepName}" completed`,
    step_failed: `Step "${data.stepName}" failed`,
    step_skipped: `Step "${data.stepName}" skipped`,
    validation_error: 'Validation error',
    webhook_sent: `Webhook sent to ${data.url}`,
    webhook_failed: `Webhook failed: ${data.url}`,
    attempt_completed: 'Transfer completed',
    attempt_failed: 'Transfer failed',
  };
  return titles[event] || event;
}

function getEventIcon(event) {
  const icons = {
    step_started: '▶️',
    step_completed: '✅',
    step_failed: '❌',
    step_skipped: '⏭️',
    validation_error: '⚠️',
    webhook_sent: '📤',
    webhook_failed: '🚫',
    attempt_completed: '🎉',
    attempt_failed: '💥',
  };
  return icons[event] || '•';
}

function getEventColor(event) {
  const colors = {
    step_started: 'blue',
    step_completed: 'green',
    step_failed: 'red',
    step_skipped: 'yellow',
    validation_error: 'orange',
    webhook_sent: 'purple',
    webhook_failed: 'red',
    attempt_completed: 'green',
    attempt_failed: 'red',
  };
  return colors[event] || 'gray';
}

export default useAttemptWebSocket;
