
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function setDocumentNonBlocking(docRef, data, options) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'write',
      requestResourceData: data,
    }));
  });
}

export function addDocumentNonBlocking(colRef, data) {
  return addDoc(colRef, data).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
    }));
  });
}

export function updateDocumentNonBlocking(docRef, data) {
  updateDoc(docRef, data).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    }));
  });
}

export function deleteDocumentNonBlocking(docRef) {
  deleteDoc(docRef).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    }));
  });
}
