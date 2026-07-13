import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE } from "@/lib/api";
import type { Transaction } from "@/types";

const MAX_FEED = 60;

export function useLiveFeed() {
  const [connected, setConnected] = useState(false);
  const [feed, setFeed] = useState<Transaction[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/live-feed`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "transaction") {
          setFeed((prev) => [msg.data as Transaction, ...prev].slice(0, MAX_FEED));
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
      retryRef.current += 1;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, feed };
}
