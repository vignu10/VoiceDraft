import { openDB } from 'idb';

const DB_NAME = 'voicedraft-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  DRAFTS: 'drafts',
  QUEUED_REQUESTS: 'queued_requests',
  RECORDINGS: 'recordings',
} as const;

export interface DraftRecord {
  id: string;
  title: string;
  content: string;
  transcript?: string;
  status: 'draft' | 'published' | 'archived';
  word_count: number;
  created_at: string;
  updated_at: string;
  synced: boolean;
  audio_blob?: Blob;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

export interface RecordingRecord {
  id: string;
  audio_blob: Blob;
  created_at: string;
  synced: boolean;
}

// Initialize IndexedDB
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Drafts store
      if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
        const draftStore = db.createObjectStore(STORES.DRAFTS, {
          keyPath: 'id',
        });
        draftStore.createIndex('status', 'status');
        draftStore.createIndex('synced', 'synced');
        draftStore.createIndex('updated_at', 'updated_at');
      }

      // Queued requests store
      if (!db.objectStoreNames.contains(STORES.QUEUED_REQUESTS)) {
        const queueStore = db.createObjectStore(STORES.QUEUED_REQUESTS, {
          keyPath: 'id',
        });
        queueStore.createIndex('timestamp', 'timestamp');
      }

      // Recordings store
      if (!db.objectStoreNames.contains(STORES.RECORDINGS)) {
        const recordingStore = db.createObjectStore(STORES.RECORDINGS, {
          keyPath: 'id',
        });
        recordingStore.createIndex('synced', 'synced');
        recordingStore.createIndex('created_at', 'created_at');
      }
    },
  });
}

// Draft operations
export async function saveDraftOffline(draft: DraftRecord) {
  const db = await initDB();
  await db.put(STORES.DRAFTS, { ...draft, synced: false });
}

export async function getOfflineDrafts() {
  const db = await initDB();
  return await db.getAll(STORES.DRAFTS);
}

export async function getOfflineDraft(id: string) {
  const db = await initDB();
  return await db.get(STORES.DRAFTS, id);
}

export async function deleteOfflineDraft(id: string) {
  const db = await initDB();
  await db.delete(STORES.DRAFTS, id);
}

export async function markDraftSynced(id: string) {
  const db = await initDB();
  const draft = await db.get(STORES.DRAFTS, id);
  if (draft) {
    await db.put(STORES.DRAFTS, { ...draft, synced: true });
  }
}

// Queued request operations
export async function queueRequest(request: QueuedRequest) {
  const db = await initDB();
  await db.put(STORES.QUEUED_REQUESTS, request);
}

export async function getQueuedRequests() {
  const db = await initDB();
  return await db.getAll(STORES.QUEUED_REQUESTS);
}

export async function removeQueuedRequest(id: string) {
  const db = await initDB();
  await db.delete(STORES.QUEUED_REQUESTS, id);
}

export async function incrementRequestRetries(id: string) {
  const db = await initDB();
  const request = await db.get(STORES.QUEUED_REQUESTS, id);
  if (request) {
    await db.put(STORES.QUEUED_REQUESTS, {
      ...request,
      retries: request.retries + 1,
    });
  }
}

// Recording operations
export async function saveRecordingOffline(recording: RecordingRecord) {
  const db = await initDB();
  await db.put(STORES.RECORDINGS, recording);
}

export async function getOfflineRecordings() {
  const db = await initDB();
  return await db.getAll(STORES.RECORDINGS);
}

export async function deleteRecording(id: string) {
  const db = await initDB();
  await db.delete(STORES.RECORDINGS, id);
}

// Sync all offline data
export async function syncOfflineData(token: string) {
  const db = await initDB();
  const tx = db.transaction(STORES.QUEUED_REQUESTS, 'readwrite');
  const store = tx.objectStore(STORES.QUEUED_REQUESTS);
  const requests = await store.getAll();

  const results = {
    successful: [] as string[],
    failed: [] as string[],
  };

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers || {}),
          Authorization: `Bearer ${token}`,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      if (response.ok) {
        await store.delete(request.id);
        results.successful.push(request.id);
      } else {
        await incrementRequestRetries(request.id);
        results.failed.push(request.id);
      }
    } catch (error) {
      await incrementRequestRetries(request.id);
      results.failed.push(request.id);
    }
  }

  return results;
}
