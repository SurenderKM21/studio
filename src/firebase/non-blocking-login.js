
'use client';
import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

export function initiateAnonymousSignIn(authInstance) {
  signInAnonymously(authInstance);
}

export function initiateEmailSignUp(authInstance, email, password) {
  createUserWithEmailAndPassword(authInstance, email, password);
}

export function initiateEmailSignIn(authInstance, email, password) {
  signInWithEmailAndPassword(authInstance, email, password);
}
