import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { newDb } from "pg-mem";
import { runMigrations } from "../db/setup.js";
import { seedDemoDataset } from "../devDemo.js";

async function createTestDatabase() {
  const db = newDb();
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool();

  await runMigrations(pool);

  return pool;
}

describe("demo seed", () => {
  it("seeds persistent full-surface demo data and skips duplicates on rerun", async () => {
    const dataDir = mkdtempSync(path.join(tmpdir(), "forenotes-demo-seed-"));
    process.env.FORENOTES_DATA_DIR = dataDir;
    const pool = await createTestDatabase();
    const anchorTime = new Date("2026-05-22T09:00:00.000Z");

    try {
      const firstRun = await seedDemoDataset(pool, { anchorTime });
      const secondRun = await seedDemoDataset(pool, { anchorTime });

      expect(firstRun.createdUsers).toBe(3);
      expect(firstRun.createdCases).toBe(6);
      expect(firstRun.createdIncidents).toBe(11);
      expect(firstRun.skippedCases).toBe(0);

      expect(secondRun.createdUsers).toBe(0);
      expect(secondRun.reusedUsers).toBe(3);
      expect(secondRun.createdCases).toBe(0);
      expect(secondRun.createdIncidents).toBe(0);
      expect(secondRun.skippedCases).toBe(6);

      const countsResult = await pool.query(
        `
        select
          (select count(*)::text from cases) as case_count,
          (select count(*)::text from incidents) as incident_count,
          (select count(*)::text from timeline_events) as timeline_count,
          (select count(*)::text from findings) as finding_count,
          (select count(*)::text from queries) as query_count,
          (select count(*)::text from tasks) as task_count,
          (select count(*)::text from report_templates) as report_template_count,
          (select count(*)::text from reports) as report_count,
          (select count(*)::text from incident_entity_links) as link_count,
          (select count(*)::text from finding_evidence_links) as evidence_count
      `
      );
      const counts = countsResult.rows[0] as {
        case_count: string;
        incident_count: string;
        timeline_count: string;
        finding_count: string;
        query_count: string;
        task_count: string;
        report_template_count: string;
        report_count: string;
        link_count: string;
        evidence_count: string;
      };

      expect(Number(counts.case_count)).toBe(6);
      expect(Number(counts.incident_count)).toBe(11);
      expect(Number(counts.timeline_count)).toBeGreaterThan(20);
      expect(Number(counts.finding_count)).toBeGreaterThan(20);
      expect(Number(counts.query_count)).toBeGreaterThan(20);
      expect(Number(counts.task_count)).toBeGreaterThan(20);
      expect(Number(counts.report_template_count)).toBe(11);
      expect(Number(counts.report_count)).toBe(11);
      expect(Number(counts.link_count)).toBeGreaterThan(0);
      expect(Number(counts.evidence_count)).toBeGreaterThan(0);

      const timelineWindowResult = await pool.query(
        `
        select
          min(event_time) as min_event_time,
          max(event_time) as max_event_time
        from timeline_events
      `
      );
      const timelineWindow = timelineWindowResult.rows[0] as {
        min_event_time: Date;
        max_event_time: Date;
      };

      const minEventTime = new Date(timelineWindow.min_event_time);
      const maxEventTime = new Date(timelineWindow.max_event_time);
      const weekAgo = new Date(anchorTime.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(minEventTime.getTime()).toBeGreaterThanOrEqual(weekAgo.getTime());
      expect(maxEventTime.getTime()).toBeLessThanOrEqual(anchorTime.getTime());
    } finally {
      delete process.env.FORENOTES_DATA_DIR;
      rmSync(dataDir, { recursive: true, force: true });
    }
  }, 30000);
});
