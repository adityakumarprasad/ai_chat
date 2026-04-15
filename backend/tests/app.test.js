import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../app.js";
import * as projectService from "../services/project.service.js";
import Project from "../models/project.model.js";

function createTestServer() {
  const app = createApp({
    clientUrls: ["http://localhost:5173"],
    redisClient: {
      async get() {
        return null;
      },
      async set() {
        return "OK";
      },
    },
  });

  const server = app.listen(0);
  return { app, server };
}

async function request(server, path, options = {}) {
  await once(server, "listening");
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}${path}`;
  return fetch(url, options);
}

test("GET /health returns ok status", async () => {
  const { server } = createTestServer();
  try {
    const response = await request(server, "/health");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ok");
  } finally {
    server.close();
  }
});

test("POST /users/register returns validation errors for bad payload", async () => {
  const { server } = createTestServer();
  try {
    const response = await request(server, "/users/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bad", password: "1" }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.length >= 1);
  } finally {
    server.close();
  }
});

test("POST /users/login returns validation errors for bad payload", async () => {
  const { server } = createTestServer();
  try {
    const response = await request(server, "/users/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bad", password: "1" }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(Array.isArray(body.errors));
  } finally {
    server.close();
  }
});

test("GET /users/profile denies unauthorized requests", async () => {
  const { server } = createTestServer();
  try {
    const response = await request(server, "/users/profile");
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.match(body.message, /authorization denied/i);
  } finally {
    server.close();
  }
});

test("project service createProject returns created project in happy path", async () => {
  const originalCreate = Project.create;
  const fakeProject = { _id: "project-1", name: "Demo", users: ["user-1"] };

  Project.create = async ({ name, users }) => ({
    ...fakeProject,
    name,
    users,
  });

  try {
    const created = await projectService.createProject("Demo", "user-1");
    assert.equal(created.name, "Demo");
    assert.deepEqual(created.users, ["user-1"]);
  } finally {
    Project.create = originalCreate;
  }
});
