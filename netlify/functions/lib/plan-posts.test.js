import assert from "node:assert/strict";
import test from "node:test";
import {
  createPlanPostsHandler,
  deriveExecutionState,
  notionPageToPost,
} from "./plan-posts.js";

const ORIGIN = "https://fandom.justlikekatie.com";
const env = {
  NOTION_API_KEY: "notion-token",
  NOTION_POSTS_DB_ID: "database-id",
  PLAN_OPERATOR_TOKEN: "operator-token",
};

test("reads the full ScheduledDate value without truncating legacy or datetime values", () => {
  assert.equal(notionPageToPost(page("2026-08-01")).scheduledDate, "2026-08-01");
  assert.equal(
    notionPageToPost(page("2026-08-01T18:30:00-04:00")).scheduledDate,
    "2026-08-01T18:30:00-04:00",
  );
});

test("distinguishes the exact four scheduler examples from intended time and canonical XHS state", () => {
  const now = new Date("2026-08-05T13:35:00.000Z");
  const ready = {
    Thumbnail: { url: "https://cdn.example/post.png" },
    "Weibo text": { rich_text: [{ plain_text: "Ready caption #tag" }] },
    "Publish packet ready": { checkbox: true },
  };
  const examples = [
    notionPageToPost(
      page("2026-08-05T08:30:00-04:00", undefined, {
        ...ready,
        Headline: { title: [{ plain_text: "Aug 5 early" }] },
      }),
      undefined,
      now,
    ),
    notionPageToPost(
      page("2026-08-05T09:00:00-04:00", undefined, {
        ...ready,
        Headline: { title: [{ plain_text: "Aug 5 late" }] },
      }),
      undefined,
      now,
    ),
    notionPageToPost(
      page("2026-08-06T10:30:00-04:00", undefined, {
        ...ready,
        Headline: { title: [{ plain_text: "Day 5 | 微博不在，小红书继续等" }] },
      }),
      {
        id: "day-5-job",
        notionPageId: "page",
        status: "operator_attested",
        successAttestation: { contractRevision: "operator-success-attestation/v1" },
      },
      now,
    ),
    notionPageToPost(
      page("2026-08-06T11:30:00-04:00", undefined, {
        ...ready,
        Headline: { title: [{ plain_text: "When a Cdrama Edit Hits Harder Because of the BTS" }] },
      }),
      { id: "bts-job", notionPageId: "page", status: "queued" },
      now,
    ),
  ];

  assert.deepEqual(
    examples.map(({ executionState, nextAction }) => ({ executionState, nextAction })),
    [
      { executionState: "overdue", nextAction: "Dispatch/recover now" },
      { executionState: "overdue", nextAction: "Dispatch/recover now" },
      { executionState: "scheduled", nextAction: "Await receipt verification" },
      { executionState: "queued", nextAction: "Next worker" },
    ],
  );
  assert.equal(examples[2].noteId, undefined);
  assert.equal(examples[2].shareUrl, undefined);
});

test("keeps published separate and never treats a future ScheduledDate as execution proof", () => {
  assert.equal(deriveExecutionState({
    scheduledDate: "2026-08-06T11:30:00-04:00",
    status: "Ready",
    now: new Date("2026-08-05T13:35:00.000Z"),
  }).state, "planned");
  assert.equal(deriveExecutionState({
    scheduledDate: "2026-08-06T11:30:00-04:00",
    status: "Ready",
    xhsJob: { id: "verified", status: "verified", noteId: "note", shareUrl: "https://xhs.example/note" },
  }).state, "published");
  assert.equal(deriveExecutionState({
    scheduledDate: "2026-08-06T11:30:00-04:00",
    status: "Published",
    xhsJob: { id: "attested", status: "operator_attested" },
  }).state, "scheduled");
  assert.equal(deriveExecutionState({
    scheduledDate: "2026-08-06T11:30:00-04:00",
    status: "Ready",
    xhsJob: { id: "failed", status: "failed" },
  }).state, "failed");
});

test("uses the persisted Notion URL to distinguish published backfill work", () => {
  const ready = {
    Thumbnail: { url: "https://cdn.example/post.png" },
    "Weibo text": { rich_text: [{ plain_text: "Ready caption #tag" }] },
    "Publish packet ready": { checkbox: true },
    Status: { status: { name: "Published" } },
  };
  assert.equal(notionPageToPost(page("", undefined, ready)).nextAction, "Backfill URL/metrics");
  assert.equal(notionPageToPost(page("", undefined, {
    ...ready,
    "Weibo URL": { url: "https://xhs.example/published-note" },
  })).nextAction, "Backfill metrics");
});

test("uses America/New_York calendar dates for legacy date-only intent", () => {
  const beforeEtMidnight = new Date("2026-01-02T04:30:00.000Z");
  const afterEtMidnight = new Date("2026-01-02T05:30:00.000Z");
  assert.equal(deriveExecutionState({
    scheduledDate: "2026-01-01",
    status: "Ready",
    now: beforeEtMidnight,
  }).state, "planned");
  assert.equal(deriveExecutionState({
    scheduledDate: "2026-01-01",
    status: "Ready",
    now: afterEtMidnight,
  }).state, "overdue");
});

test("joins canonical XHS jobs to PLAN posts by Notion page id", async () => {
  const linkedEnv = {
    ...env,
    XHS_LOCAL_PUBLISH_JOBS_URL: "https://xhs.example/admin/api/local-publish-jobs",
    XHS_ACCESS_CLIENT_ID: "client-id",
    XHS_ACCESS_CLIENT_SECRET: "client-secret",
  };
  const handler = createPlanPostsHandler({
    env: linkedEnv,
    fetchImpl: async (url, init = {}) => {
      if (url === linkedEnv.XHS_LOCAL_PUBLISH_JOBS_URL) {
        assert.equal(init.headers["CF-Access-Client-Id"], "client-id");
        assert.equal(init.headers["CF-Access-Client-Secret"], "client-secret");
        return Response.json({
          jobs: [{
            id: "canonical-job",
            notionPageId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            status: "operator_attested",
            updatedAt: "2026-08-05T13:00:00.000Z",
          }],
        });
      }
      if (url.endsWith("/databases/database-id/query")) {
        return Response.json({
          results: [page("2026-08-06T10:30:00-04:00")],
          has_more: false,
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });
  const headers = new Headers();
  headers.set("Authorization", ["Bearer", linkedEnv.PLAN_OPERATOR_TOKEN].join(" "));
  const response = await handler(new Request(`${ORIGIN}/api/plan-posts`, { headers }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.executionSource, "xhs-local-jobs");
  assert.equal(body.posts[0].executionState, "scheduled");
  assert.equal(body.posts[0].nextAction, "Await receipt verification");
  assert.equal(body.posts[0].localPublishJobId, "canonical-job");
  assert.equal(body.posts[0].noteId, undefined);
  assert.equal(body.posts[0].shareUrl, undefined);
});

test("preserves canonical XHS execution state in PATCH responses", async () => {
  const linkedEnv = {
    ...env,
    XHS_LOCAL_PUBLISH_JOBS_URL: "https://xhs.example/admin/api/local-publish-jobs",
    XHS_ACCESS_CLIENT_ID: "client-id",
    XHS_ACCESS_CLIENT_SECRET: "client-secret",
  };
  const handler = createPlanPostsHandler({
    env: linkedEnv,
    fetchImpl: async (url, init = {}) => {
      if (url.endsWith("/databases/database-id")) return Response.json(schema());
      if (url.endsWith("/pages/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")) {
        return Response.json(page(
          init.method === "PATCH"
            ? "2026-08-06T11:00:00-04:00"
            : "2026-08-06T10:30:00-04:00",
        ));
      }
      if (url === linkedEnv.XHS_LOCAL_PUBLISH_JOBS_URL) {
        return Response.json({
          jobs: [{
            id: "attested-job",
            notionPageId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            status: "operator_attested",
            updatedAt: "2026-08-05T13:00:00.000Z",
          }],
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });
  const response = await handler(mutation({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    scheduledDate: "2026-08-06T11:00:00-04:00",
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.post.executionState, "scheduled");
  assert.equal(body.post.nextAction, "Await receipt verification");
  assert.equal(body.post.localPublishJobId, "attested-job");
});

test("updates only ScheduledDate and returns the exact persisted instant", async () => {
  const calls = [];
  const handler = createPlanPostsHandler({
    env,
    fetchImpl: async (url, init = {}) => {
      calls.push({ url, init });
      if (url.endsWith("/databases/database-id")) {
        return Response.json(schema());
      }
      if (url.endsWith("/pages/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") && init.method !== "PATCH") {
        return Response.json(page("2026-08-01", "2026-08-01T10:00:00.000Z"));
      }
      const body = JSON.parse(init.body);
      assert.deepEqual(body, {
        properties: {
          ScheduledDate: { date: { start: "2026-08-01T22:30:00.000Z" } },
        },
      });
      return Response.json(page("2026-08-01T22:30:00.000Z", "2026-08-01T10:01:00.000Z"));
    },
  });
  const response = await handler(mutation({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    expectedVersion: "2026-08-01T10:00:00.000Z",
    scheduledDate: "2026-08-01T22:30:00.000Z",
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.post.scheduledDate, "2026-08-01T22:30:00.000Z");
  assert.equal(calls.length, 3);
});

test("clears a schedule and updates canonical status properties", async () => {
  const patches = [];
  const handler = createPlanPostsHandler({
    env,
    fetchImpl: async (url, init = {}) => {
      if (url.endsWith("/databases/database-id")) return Response.json(schema());
      if (url.endsWith("/pages/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") && init.method !== "PATCH") {
        return Response.json(page("2026-08-01"));
      }
      patches.push(JSON.parse(init.body));
      return Response.json(page(""));
    },
  });
  const response = await handler(mutation({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    scheduledDate: null,
    status: "Approved",
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(patches[0], {
    properties: {
      ScheduledDate: { date: null },
      Status: { status: { name: "Approved" } },
    },
  });
});

test("rejects stale mutations before writing", async () => {
  let calls = 0;
  const handler = createPlanPostsHandler({
    env,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? Response.json(schema())
        : Response.json(page("2026-08-01", "2026-08-01T10:01:00.000Z"));
    },
  });
  const response = await handler(mutation({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    expectedVersion: "2026-08-01T10:00:00.000Z",
    status: "Ready",
  }));
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /changed in Notion/);
  assert.equal(calls, 2);
});

test("rejects cross-origin and non-canonical status mutations", async () => {
  const handler = createPlanPostsHandler({ env, fetchImpl: async () => Response.json({}) });
  const crossOrigin = new Request(`${ORIGIN}/api/plan-posts`, {
    method: "PATCH",
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    body: JSON.stringify({ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", status: "Ready" }),
  });
  assert.equal((await handler(crossOrigin)).status, 403);
  assert.equal((await handler(mutation({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    status: "Queued",
  }))).status, 400);
});

test("requires operator authorization and rejects pages outside the configured database", async () => {
  const handler = createPlanPostsHandler({
    env,
    fetchImpl: async (url) => (
      url.endsWith("/databases/database-id")
        ? Response.json(schema())
        : Response.json({
            ...page("2026-08-01"),
            parent: { type: "database_id", database_id: "another-database" },
          })
    ),
  });
  const unauthorized = new Request(`${ORIGIN}/api/plan-posts`);
  assert.equal((await handler(unauthorized)).status, 401);
  const wrongParent = await handler(mutation({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    status: "Ready",
  }));
  assert.equal(wrongParent.status, 403);
  assert.match((await wrongParent.json()).error, /configured Posts DB/);
});

function mutation(body) {
  return new Request(`${ORIGIN}/api/plan-posts`, {
    method: "PATCH",
    headers: {
      Origin: ORIGIN,
      Authorization: "Bearer operator-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function schema() {
  return {
    properties: {
      ScheduledDate: { type: "date" },
      Status: { type: "status" },
    },
  };
}

function page(scheduledDate, version = "2026-08-01T10:00:00.000Z", overrides = {}) {
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    url: "https://notion.so/post",
    last_edited_time: version,
    parent: { type: "database_id", database_id: "database-id" },
    properties: {
      Headline: { title: [{ plain_text: "Tonight post" }] },
      ScheduledDate: { date: scheduledDate ? { start: scheduledDate } : null },
      Status: { status: { name: "Draft" } },
      Thumbnail: { url: "https://cdn.example/post.png" },
      "Weibo text": { rich_text: [{ plain_text: "Ready caption #tag" }] },
      "Publish packet ready": { checkbox: true },
      ...overrides,
    },
  };
}
