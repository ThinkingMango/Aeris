import { afterEach, describe, expect, it } from "vitest";

import { databaseUrl, isPooledUrl } from "./client";

const DIRECT = "postgresql://postgres:pw@db.abcdefgh.supabase.co:5432/postgres";
const POOLED = "postgresql://postgres.abcdefgh:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

const original = { url: process.env["DATABASE_URL"], env: process.env["APP_ENV"] };

afterEach(() => {
  process.env["DATABASE_URL"] = original.url;
  process.env["APP_ENV"] = original.env;
});

describe("connection strings", () => {
  it("recognises the transaction pooler by its port", () => {
    expect(isPooledUrl(POOLED)).toBe(true);
    expect(isPooledUrl(DIRECT)).toBe(false);
    expect(isPooledUrl("not a url")).toBe(false);
  });

  it("says what is missing rather than failing obscurely", () => {
    delete process.env["DATABASE_URL"];
    expect(() => databaseUrl()).toThrow(/DATABASE_URL is not set/);
  });

  it("refuses the direct connection in production", () => {
    // Serverless opens a connection per instance. The direct port exhausts
    // Postgres's limit under load, which fails in production and never in
    // development — so it is refused at startup instead.
    process.env["APP_ENV"] = "production";
    process.env["DATABASE_URL"] = DIRECT;
    expect(() => databaseUrl()).toThrow(/transaction pooler/);
  });

  it("allows the direct connection outside production, for a local database", () => {
    process.env["APP_ENV"] = "development";
    process.env["DATABASE_URL"] = DIRECT;
    expect(databaseUrl()).toBe(DIRECT);
  });

  it("accepts the pooler in production", () => {
    process.env["APP_ENV"] = "production";
    process.env["DATABASE_URL"] = POOLED;
    expect(databaseUrl()).toBe(POOLED);
  });
});
