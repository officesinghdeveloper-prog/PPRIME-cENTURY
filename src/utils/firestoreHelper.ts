import {
  DocumentReference,
  setDoc,
  updateDoc,
  SetOptions,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

/**
 * Deeply removes all `undefined` values from an object or array.
 * Firestore throws a fatal client-side error if any field is `undefined`.
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Safely writes a document to Cloud Firestore after stripping undefined fields.
 */
export async function safeSetDoc(
  docRef: DocumentReference,
  data: any,
  options?: SetOptions
): Promise<boolean> {
  try {
    const cleaned = cleanForFirestore(data);
    if (options) {
      await setDoc(docRef, cleaned, options);
    } else {
      await setDoc(docRef, cleaned);
    }
    return true;
  } catch (err) {
    console.error(`[Firestore safeSetDoc Error on ${docRef.path}]:`, err);
    try {
      handleFirestoreError(err, OperationType.WRITE, docRef.path);
    } catch {
      // Re-throw or let caller handle
    }
    throw err;
  }
}

/**
 * Safely updates a document in Cloud Firestore after stripping undefined fields.
 */
export async function safeUpdateDoc(
  docRef: DocumentReference,
  data: any
): Promise<boolean> {
  try {
    const cleaned = cleanForFirestore(data);
    await updateDoc(docRef, cleaned);
    return true;
  } catch (err) {
    console.error(`[Firestore safeUpdateDoc Error on ${docRef.path}]:`, err);
    try {
      handleFirestoreError(err, OperationType.UPDATE, docRef.path);
    } catch {
      // Re-throw or let caller handle
    }
    throw err;
  }
}
