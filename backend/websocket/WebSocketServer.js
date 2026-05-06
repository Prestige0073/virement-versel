/**
 * WebSocket Server for Real-Time Transfer Attempt Updates
 * Socket.io implementation for live status streaming
 * 
 * Features:
 * - Real-time step updates
 * - Event streaming
 * - Connection management
 * - Auto-reconnect support
 * - Redis scaling for multi-instance
 */

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

class WebSocketServer {
  constructor(httpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.redisClient = null;
    this.pubClient = null;
    this.subClient = null;
    this.userConnections = new Map(); // userId -> Set of socket IDs
  }

  /**
   * Initialize Redis adapter for multi-instance scaling
   */
  async initializeRedis() {
    try {
      this.pubClient = createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
      });

      this.subClient = this.pubClient.duplicate();

      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);

      this.io.adapter(createAdapter(this.pubClient, this.subClient));

      console.log('✓ Redis adapter initialized for Socket.io');
    } catch (error) {
      console.error('✗ Redis initialization failed:', error.message);
      console.log('⚠ Falling back to in-memory adapter (single instance only)');
    }
  }

  /**
   * Setup authentication middleware
   */
  setupAuthentication() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Missing authentication token'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup connection and event handlers
   */
  setupHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;

      // Track user connection
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId).add(socket.id);

      console.log(`✓ User ${userId} connected (socket: ${socket.id})`);

      /**
       * Subscribe to attempt updates
       * Room: attempt:{attemptId}
       */
      socket.on('subscribe:attempt', (attemptId, callback) => {
        const room = `attempt:${attemptId}`;
        socket.join(room);
        
        if (callback) {
          callback({ success: true, room });
        }

        console.log(`  → Subscribed to ${room}`);
      });

      /**
       * Unsubscribe from attempt updates
       */
      socket.on('unsubscribe:attempt', (attemptId, callback) => {
        const room = `attempt:${attemptId}`;
        socket.leave(room);
        
        if (callback) {
          callback({ success: true });
        }
      });

      /**
       * Subscribe to user's attempt list
       * Room: user:{userId}:attempts
       */
      socket.on('subscribe:attempts', (callback) => {
        const room = `user:${userId}:attempts`;
        socket.join(room);
        
        if (callback) {
          callback({ success: true, room });
        }

        console.log(`  → Subscribed to ${room}`);
      });

      /**
       * Ping handler for connection keep-alive
       */
      socket.on('ping', (callback) => {
        if (callback) {
          callback({ pong: true, timestamp: Date.now() });
        }
      });

      /**
       * Disconnect handler
       */
      socket.on('disconnect', () => {
        const connections = this.userConnections.get(userId);
        if (connections) {
          connections.delete(socket.id);
          if (connections.size === 0) {
            this.userConnections.delete(userId);
          }
        }

        console.log(`✗ User ${userId} disconnected (socket: ${socket.id})`);
      });

      /**
       * Error handler
       */
      socket.on('error', (error) => {
        console.error(`✗ Socket error (${socket.id}):`, error);
      });
    });
  }

  /**
   * Emit step event to attempt room
   */
  emitStepEvent(attemptId, eventType, data) {
    const room = `attempt:${attemptId}`;
    const payload = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit('step:update', payload);

    console.log(`📤 Event "${eventType}" emitted to ${room}`);
  }

  /**
   * Emit webhook event
   */
  emitWebhookEvent(attemptId, webhookId, status, response) {
    const room = `attempt:${attemptId}`;
    const payload = {
      type: 'webhook_update',
      webhookId,
      status,
      response,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit('webhook:update', payload);
  }

  /**
   * Emit attempt completion
   */
  emitAttemptComplete(userId, attemptId, status, summary) {
    const room = `user:${userId}:attempts`;
    const payload = {
      type: 'attempt_complete',
      attemptId,
      status,
      summary,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit('attempt:complete', payload);
  }

  /**
   * Emit real-time progress update
   */
  emitProgressUpdate(attemptId, progress) {
    const room = `attempt:${attemptId}`;
    const payload = {
      type: 'progress_update',
      currentStep: progress.currentStep,
      totalSteps: progress.totalSteps,
      percentage: (progress.currentStep / progress.totalSteps) * 100,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit('progress:update', payload);
  }

  /**
   * Emit validation error
   */
  emitValidationError(attemptId, fieldName, error) {
    const room = `attempt:${attemptId}`;
    const payload = {
      type: 'validation_error',
      fieldName,
      error,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit('validation:error', payload);
  }

  /**
   * Emit rate limit warning
   */
  emitRateLimitWarning(userId, operation, remaining, resetTime) {
    const payload = {
      type: 'rate_limit',
      operation,
      remaining,
      resetTime,
      timestamp: new Date().toISOString(),
    };

    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('rate-limit:warning', payload);
        }
      });
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      totalUsers: this.userConnections.size,
      roomsCount: this.io.sockets.adapter.rooms.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
    };
  }

  /**
   * Start server
   */
  async start() {
    await this.initializeRedis();
    this.setupAuthentication();
    this.setupHandlers();

    console.log('✓ WebSocket server initialized');
  }

  /**
   * Shutdown server
   */
  async shutdown() {
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }
    this.io.close();
    console.log('✓ WebSocket server shutdown');
  }
}

export default WebSocketServer;
