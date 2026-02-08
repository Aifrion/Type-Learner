import { useEffect, useRef } from 'react';

export function useSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // TODO: Implement WebSocket connection
    // socketRef.current = new WebSocket(url);

    return () => {
      socketRef.current?.close();
    };
  }, [url]);

  return socketRef.current;
}
