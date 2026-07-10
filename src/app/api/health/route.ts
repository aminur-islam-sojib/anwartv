import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  const startTime = Date.now();

  const health: {
    status: "ok" | "error";
    timestamp: string;
    uptime: number;
    responseTime?: string;
    services: {
      database: {
        status: "connected" | "disconnected" | "error";
        message?: string;
        latency?: string;
      };
    };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: "disconnected",
      },
    },
  };

  try {
    const dbStart = Date.now();
    await connectDB();

    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      // Ping the DB to confirm it's actually responsive, not just "connected" in name
      await mongoose.connection.db?.admin().ping();

      health.services.database.status = "connected";
      health.services.database.latency = `${Date.now() - dbStart}ms`;
    } else {
      health.services.database.status = "disconnected";
      health.status = "error";
    }
  } catch (err) {
    health.services.database.status = "error";
    health.services.database.message =
      err instanceof Error ? err.message : "Unknown database error";
    health.status = "error";
  }

  health.responseTime = `${Date.now() - startTime}ms`;

  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
  });
}
