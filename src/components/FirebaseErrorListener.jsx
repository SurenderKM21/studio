'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (error) {
    throw error;
  }

  return null;
}