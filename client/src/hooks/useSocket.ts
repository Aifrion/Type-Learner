import { createContext, createElement, useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_WS_URL || undefined);
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  return createElement(
    SocketContext.Provider,
    { value: socket },
    createElement(Outlet)
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
