import { openDB, IDBPDatabase } from 'idb';
import { FormDraftState } from '../../types';

const DB_NAME = 'formpatch-storage';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'formId' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Saves the current draft to IndexedDB
 */
export async function saveDraft(
  formId: string,
  currentStepIndex: number,
  answers: Record<string, any>
): Promise<void> {
  try {
    const db = await getDB();
    const draft: FormDraftState = {
      formId,
      currentStepIndex,
      answers,
      lastSavedAt: new Date().toISOString(),
      completed: false,
    };
    await db.put(STORE_NAME, draft);
  } catch (error) {
    // Graceful fallback to sessionStorage/localStorage in testing environments
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`formpatch_draft_${formId}`, JSON.stringify({
        formId,
        currentStepIndex,
        answers,
        lastSavedAt: new Date().toISOString(),
        completed: false,
      }));
    }
  }
}

/**
 * Loads a saved draft for a form ID
 */
export async function loadDraft(formId: string): Promise<FormDraftState | null> {
  try {
    const db = await getDB();
    const draft = await db.get(STORE_NAME, formId);
    if (draft) return draft;
  } catch {
    // Fallback to localStorage
  }

  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(`formpatch_draft_${formId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Deletes a draft completely
 */
export async function clearDraft(formId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, formId);
  } catch {
    // Fallback
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(`formpatch_draft_${formId}`);
  }
}
