import { head, put } from "@vercel/blob";
import { Redis } from "@upstash/redis";
import type { LogisticsSubmissionRecord } from "./types";

const STORAGE_KEY = "logistics:submissions:v1";
const GITHUB_FILE_PATH = "data/logistics-submissions.json";
const BLOB_PATH = "logistics-submissions.json";

let memoryStore: LogisticsSubmissionRecord[] = [];

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getGitHubConfig() {
  const token = process.env.GITHUB_SUBMISSIONS_TOKEN?.trim();
  const repo = process.env.GITHUB_SUBMISSIONS_REPO?.trim() || "Jasper1974/exam-portal";
  if (!token) return null;
  const [owner, name] = repo.split("/");
  if (!owner || !name) return null;
  return { token, owner, name };
}

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function storageReady() {
  return (
    Boolean(getRedis() || getGitHubConfig() || hasBlobStorage()) ||
    process.env.NODE_ENV !== "production"
  );
}

export function isLogisticsStoreConfigured() {
  return storageReady();
}

export function getLogisticsStorageMode() {
  if (getRedis()) return "upstash";
  if (hasBlobStorage()) return "blob";
  if (getGitHubConfig()) return "github";
  if (process.env.NODE_ENV !== "production") return "memory";
  return "none";
}

async function readAll(): Promise<LogisticsSubmissionRecord[]> {
  const redis = getRedis();
  if (redis) {
    return (await redis.get<LogisticsSubmissionRecord[]>(STORAGE_KEY)) ?? [];
  }

  if (hasBlobStorage()) {
    return readFromBlob();
  }

  const github = getGitHubConfig();
  if (github) {
    return readFromGitHub(github);
  }

  return memoryStore;
}

async function writeAll(list: LogisticsSubmissionRecord[]) {
  const redis = getRedis();
  if (redis) {
    await redis.set(STORAGE_KEY, list);
    return;
  }

  if (hasBlobStorage()) {
    await writeToBlob(list);
    return;
  }

  const github = getGitHubConfig();
  if (github) {
    await writeToGitHub(github, list);
    return;
  }

  memoryStore = list;
}

async function readFromBlob(): Promise<LogisticsSubmissionRecord[]> {
  try {
    const meta = await head(BLOB_PATH);
    const response = await fetch(meta.url, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as LogisticsSubmissionRecord[];
  } catch {
    return [];
  }
}

async function writeToBlob(list: LogisticsSubmissionRecord[]) {
  await put(BLOB_PATH, JSON.stringify(list, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

type GitHubConfig = { token: string; owner: string; name: string };

type GitHubContentResponse = {
  content: string;
  sha: string;
};

async function readFromGitHub(config: GitHubConfig): Promise<LogisticsSubmissionRecord[]> {
  const url = `https://api.github.com/repos/${config.owner}/${config.name}/contents/${GITHUB_FILE_PATH}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`GITHUB_READ_FAILED_${response.status}`);
  }

  const payload = (await response.json()) as GitHubContentResponse;
  const decoded = Buffer.from(payload.content, "base64").toString("utf8");
  return JSON.parse(decoded) as LogisticsSubmissionRecord[];
}

async function writeToGitHub(config: GitHubConfig, list: LogisticsSubmissionRecord[]) {
  const url = `https://api.github.com/repos/${config.owner}/${config.name}/contents/${GITHUB_FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  let sha: string | undefined;
  const existing = await fetch(url, { headers, cache: "no-store" });
  if (existing.ok) {
    const payload = (await existing.json()) as GitHubContentResponse;
    sha = payload.sha;
  }

  const body = {
    message: `Sync logistics submissions (${list.length})`,
    content: Buffer.from(JSON.stringify(list, null, 2), "utf8").toString("base64"),
    sha,
  };

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`GITHUB_WRITE_FAILED_${response.status}`);
  }
}

export async function listLogisticsSubmissions(): Promise<LogisticsSubmissionRecord[]> {
  if (!storageReady()) {
    throw new Error("SERVER_STORAGE_NOT_CONFIGURED");
  }
  const list = await readAll();
  return list.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export async function upsertLogisticsSubmission(
  submission: LogisticsSubmissionRecord,
): Promise<LogisticsSubmissionRecord> {
  if (!storageReady()) {
    throw new Error("SERVER_STORAGE_NOT_CONFIGURED");
  }

  const list = await readAll();
  const index = list.findIndex((item) => item.id === submission.id);
  if (index >= 0) {
    list[index] = submission;
  } else {
    list.unshift(submission);
  }
  await writeAll(list);
  return submission;
}

export async function getLogisticsSubmissionById(id: string) {
  const list = await listLogisticsSubmissions();
  return list.find((item) => item.id === id) ?? null;
}

export async function listLogisticsSubmissionsByStudentId(studentId: string) {
  const list = await listLogisticsSubmissions();
  return list.filter((item) => item.studentId === studentId);
}
