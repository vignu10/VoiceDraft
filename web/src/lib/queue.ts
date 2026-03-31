/**
 * BullMQ + Upstash Redis Queue Configuration
 *
 * This module sets up the job queue infrastructure for background processing.
 * Uses Upstash Redis for serverless-compatible job queue management.
 * Falls back to in-memory storage for local development.
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from '@upstash/redis';

// Environment variables for Upstash Redis
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Create and configure Upstash Redis connection
 *
 * Upstash Redis is used instead of standard Redis for serverless compatibility.
 * It provides HTTP REST API access to Redis, perfect for Vercel Edge Functions.
 */
export function createUpstashRedis() {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return null; // Return null to indicate fallback to in-memory
  }

  return new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Job type definitions for the queue
 */
export type JobType = 'transcribe' | 'generate';

export interface TranscriptionJobData {
  audioUrl: string;
  userId: string;
  postId?: string;
  language?: string;
}

export interface GenerationJobData {
  postId: string;
  userId: string;
  transcript: string;
  title?: string;
  keywords?: string[];
}

export type JobData = TranscriptionJobData | GenerationJobData;

/**
 * Queue configuration constants
 */
export const QUEUE_CONFIG = {
  connection: {
    host: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Remove jobs older than 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 7 * 24 * 3600, // Remove jobs older than 7 days
    },
  },
} as const;

/**
 * Create a BullMQ queue with Upstash Redis connection
 *
 * Note: BullMQ doesn't directly support Upstash's REST API.
 * This is a placeholder for when we migrate to a proper Redis instance.
 * For now, we'll use a hybrid approach with direct Upstash calls.
 */
export class VoiceScribeQueue {
  private redis: Redis | null;
  private fallbackStore: Map<string, any>;
  private queuePrefix = 'voicescribe:queue';
  private useFallback: boolean;

  constructor() {
    this.redis = createUpstashRedis();
    this.fallbackStore = new Map();
    this.useFallback = !this.redis;
  }

  /**
   * Add a job to the queue
   */
  async addJob<T extends JobData>(
    type: JobType,
    data: T,
    options?: { jobId?: string; delay?: number }
  ): Promise<string> {
    const jobId = options?.jobId || `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (this.useFallback) {
      // Fallback to in-memory storage
      this.fallbackStore.set(jobId, {
        id: jobId,
        type,
        data,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Auto-cleanup after 1 hour
      setTimeout(() => {
        this.fallbackStore.delete(jobId);
      }, 60 * 60 * 1000);

      return jobId;
    }

    // Store job in Upstash Redis
    const jobKey = `${this.queuePrefix}:${type}:${jobId}`;
    await this.redis!.hset(jobKey, {
      id: jobId,
      type,
      data: JSON.stringify(data),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Set expiration (24 hours)
    await this.redis!.expire(jobKey, 24 * 3600);

    // Add to pending jobs list
    await this.redis!.lpush(`${this.queuePrefix}:${type}:pending`, jobId);

    return jobId;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string, type: JobType): Promise<Job | null> {
    if (this.useFallback) {
      const jobData = this.fallbackStore.get(jobId);
      if (!jobData) {
        return null;
      }

      return {
        id: jobData.id,
        name: jobData.type,
        data: jobData.data,
        status: jobData.status,
        createdAt: jobData.createdAt,
        processedOn: jobData.processedOn,
        finishedOn: jobData.finishedOn,
        failedReason: jobData.error,
        returnvalue: jobData.result,
      } as Job;
    }

    const jobKey = `${this.queuePrefix}:${type}:${jobId}`;
    const jobData = await this.redis!.hgetall(jobKey);

    if (!jobData || Object.keys(jobData).length === 0) {
      return null;
    }

    return {
      id: jobId,
      name: type,
      data: JSON.parse(jobData.data as string),
      status: jobData.status as Job['status'],
      createdAt: Number(jobData.createdAt),
      processedOn: jobData.processedOn ? Number(jobData.processedOn) : undefined,
      finishedOn: jobData.finishedOn ? Number(jobData.finishedOn) : undefined,
      failedReason: jobData.failedReason as string | undefined,
      returnvalue: jobData.result ? JSON.parse(jobData.result as string) : undefined,
    } as Job;
  }

  /**
   * Update job status
   */
  async updateJob(
    jobId: string,
    type: JobType,
    updates: {
      status: 'processing' | 'completed' | 'failed';
      result?: unknown;
      error?: string;
    }
  ): Promise<void> {
    const now = Date.now();

    if (this.useFallback) {
      const job = this.fallbackStore.get(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      const updatedJob = {
        ...job,
        status: updates.status,
        updatedAt: now,
        ...(updates.status === 'processing' && { processedOn: now }),
        ...((updates.status === 'completed' || updates.status === 'failed') && {
          finishedOn: now,
          ...(updates.result && { result: updates.result }),
          ...(updates.error && { error: updates.error }),
        }),
      };

      this.fallbackStore.set(jobId, updatedJob);
      return;
    }

    const jobKey = `${this.queuePrefix}:${type}:${jobId}`;
    const updateData: Record<string, string> = {
      status: updates.status,
      updatedAt: now.toString(),
    };

    if (updates.status === 'processing') {
      updateData.processedOn = now.toString();
    } else if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.finishedOn = now.toString();
      if (updates.result) {
        updateData.result = JSON.stringify(updates.result);
      }
      if (updates.error) {
        updateData.failedReason = updates.error;
      }

      // Remove from pending list
      await this.redis!.lrem(`${this.queuePrefix}:${type}:pending`, 0, jobId);

      // Add to completed/failed list
      const listName = updates.status === 'completed' ? 'completed' : 'failed';
      await this.redis!.lpush(`${this.queuePrefix}:${type}:${listName}`, jobId);
    }

    await this.redis!.hset(jobKey, updateData);
  }

  /**
   * Get queue health status
   */
  async getHealthStatus(): Promise<{
    connected: boolean;
    pendingTranscription: number;
    pendingGeneration: number;
    recentCompleted: number;
    recentFailed: number;
  }> {
    if (this.useFallback) {
      // Count jobs in fallback store
      let pendingTranscription = 0;
      let pendingGeneration = 0;

      for (const job of this.fallbackStore.values()) {
        if (job.status === 'pending' || job.status === 'processing') {
          if (job.type === 'transcribe') pendingTranscription++;
          else if (job.type === 'generate') pendingGeneration++;
        }
      }

      return {
        connected: false,
        pendingTranscription,
        pendingGeneration,
        recentCompleted: 0,
        recentFailed: 0,
      };
    }

    try {
      const pendingTranscription = await this.redis!.llen(`${this.queuePrefix}:transcribe:pending`);
      const pendingGeneration = await this.redis!.llen(`${this.queuePrefix}:generate:pending`);
      const recentCompleted = await this.redis!.llen(`${this.queuePrefix}:transcribe:completed`);
      const recentFailed = await this.redis!.llen(`${this.queuePrefix}:transcribe:failed`);

      return {
        connected: true,
        pendingTranscription,
        pendingGeneration,
        recentCompleted,
        recentFailed,
      };
    } catch (error) {
      return {
        connected: false,
        pendingTranscription: 0,
        pendingGeneration: 0,
        recentCompleted: 0,
        recentFailed: 0,
      };
    }
  }

  /**
   * Clean up old jobs (called periodically)
   */
  async cleanup(): Promise<void> {
    // Upstash Redis handles expiration via TTL, so we don't need manual cleanup
    // This is a placeholder for any additional cleanup logic
  }
}

// Singleton instance
let queueInstance: VoiceScribeQueue | null = null;

export function getQueue(): VoiceScribeQueue {
  if (!queueInstance) {
    queueInstance = new VoiceScribeQueue();
  }
  return queueInstance;
}
