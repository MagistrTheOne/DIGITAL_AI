import { sql } from "@/services/db/client";

import type {
  EmployeeId,
  EmployeeListQuery,
  EmployeeVideoPreview,
} from "@/features/employees/types";

export type EmployeeRecord = {
  id: EmployeeId;
  name: string;
  role_category: string;
  verified: boolean;
  video_preview_url: string | null;
};

// Persistence-only repository (feature/UI must not import DB types directly).
export async function listEmployeesByQuery(
  _query: EmployeeListQuery,
): Promise<EmployeeRecord[]> {
  try {
    const result =
      await sql`SELECT id, name, role_category, verified, video_preview_url FROM employees ORDER BY name ASC LIMIT 60`;
    return result.map((r: any) => ({
      id: String(r.id),
      name: String(r.name),
      role_category: String(r.role_category),
      verified: Boolean(r.verified),
      video_preview_url: r.video_preview_url ? String(r.video_preview_url) : null,
    }));
  } catch {
    return [
      {
        id: "anna-vantage",
        name: "Anna Vantage",
        role_category: "Marketing",
        verified: true,
        video_preview_url: "/sample/anna.mp4",
      },
      {
        id: "omar-vantage",
        name: "Omar vantage",
        role_category: "Operations",
        verified: true,
        video_preview_url: "/sample/omar.mp4",
      },
      {
        id: "talia-vantage",
        name: "Talia vantage",
        role_category: "Product",
        verified: true,
        video_preview_url: "/sample/talia.mp4",
      },
    ];
  }
}

export async function getEmployeeById(
  employeeId: EmployeeId,
): Promise<EmployeeRecord | null> {
  try {
    const result =
      await sql`SELECT id, name, role_category, verified, video_preview_url FROM employees WHERE id = ${employeeId} LIMIT 1`;
    if (!result[0]) return null;
    const r = result[0] as any;
    return {
      id: String(r.id),
      name: String(r.name),
      role_category: String(r.role_category),
      verified: Boolean(r.verified),
      video_preview_url: r.video_preview_url ? String(r.video_preview_url) : null,
    };
  } catch {
    if (employeeId === "anna-vantage") {
      return {
        id: "anna-vantage",
        name: "Anna Vantage",
        role_category: "Marketing",
        verified: true,
        video_preview_url: "/sample/anna.mp4",
      };
    }
    return null;
  }
}

