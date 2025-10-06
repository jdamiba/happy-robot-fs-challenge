"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [wsStatus, setWsStatus] = useState<string>("Not connected");
  const [wsUrl, setWsUrl] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // Get the WebSocket URL - use production URL for testing
    const url = "wss://happy-robot-fs-challenge.onrender.com/ws";
    setWsUrl(url);
    addLog(`WebSocket URL: ${url}`);

    // Test WebSocket connection
    try {
      addLog("Attempting to connect to WebSocket...");
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setWsStatus("Connected");
        addLog("✅ WebSocket connected successfully");

        // Test sending a message
        ws.send(
          JSON.stringify({
            type: "JOIN_PROJECT",
            projectId: "debug-project-123",
            userId: "debug-user-456",
          })
        );
        addLog("📤 Sent JOIN_PROJECT message");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        addLog(`📨 Received: ${message.type}`);
      };

      ws.onerror = (error) => {
        setWsStatus("Error");
        addLog(`❌ WebSocket error: ${error}`);
      };

      ws.onclose = () => {
        setWsStatus("Disconnected");
        addLog("🔌 WebSocket disconnected");
      };

      // Cleanup
      return () => {
        ws.close();
      };
    } catch (error) {
      setWsStatus("Failed to create WebSocket");
      addLog(`❌ Failed to create WebSocket: ${error}`);
    }
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket Debug Page</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <p className="text-sm text-gray-600">URL: {wsUrl}</p>
        <p className="text-sm">
          Status:{" "}
          <span
            className={`font-semibold ${
              wsStatus === "Connected"
                ? "text-green-600"
                : wsStatus === "Error"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {wsStatus}
          </span>
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
