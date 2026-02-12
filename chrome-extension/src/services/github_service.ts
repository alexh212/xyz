export interface GitHubUser {
  login: string;
  id: number;
  avatar_url?: string;
  html_url?: string;
}

export interface PullRequestMetadata {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  user: GitHubUser;
  base: { sha: string; ref: string };
  head: { sha: string; ref: string };
  changed_files: number;
  additions: number;
  deletions: number;
}

export interface PullRequestFile {
  sha: string;
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface PullRequestFileWithContent extends PullRequestFile {
  contentBefore: string | null;
  contentAfter: string | null;
}

export interface StructuredPullRequestData {
  repository: {
    owner: string;
    name: string;
  };
  pullRequest: {
    number: number;
    title: string;
    description: string;
    author: string;
    url: string;
    baseSha: string;
    headSha: string;
    changedFilesCount: number;
    additions: number;
    deletions: number;
  };
  files: PullRequestFileWithContent[];
}

interface GitHubApiErrorOptions {
  status?: number;
  url?: string;
  details?: string;
}

export class GitHubApiError extends Error {
  public readonly status?: number;
  public readonly url?: string;
  public readonly details?: string;

  constructor(message: string, options: GitHubApiErrorOptions = {}) {
    super(message);
    this.name = "GitHubApiError";
    this.status = options.status;
    this.url = options.url;
    this.details = options.details;
  }
}

export class GitHubAuthError extends GitHubApiError {
  constructor(message: string, options: GitHubApiErrorOptions = {}) {
    super(message, options);
    this.name = "GitHubAuthError";
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  public readonly resetAtEpochSeconds?: number;

  constructor(message: string, resetAtEpochSeconds?: number, options: GitHubApiErrorOptions = {}) {
    super(message, options);
    this.name = "GitHubRateLimitError";
    this.resetAtEpochSeconds = resetAtEpochSeconds;
  }
}

export class GitHubService {
  private readonly apiBaseUrl = "https://api.github.com";
  private readonly owner: string;
  private readonly repo: string;
  private readonly pullNumber: number;
  private readonly token?: string;

  constructor(owner: string, repo: string, pullNumber: number, token?: string) {
    if (!owner || !repo || !Number.isFinite(pullNumber) || pullNumber <= 0) {
      throw new Error("Invalid repository coordinates for GitHubService");
    }

    this.owner = owner;
    this.repo = repo;
    this.pullNumber = pullNumber;
    this.token = token;
  }

  static fromPullRequestUrl(url: string, token?: string): GitHubService {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);

    if (!match) {
      throw new Error(`URL is not a valid GitHub PR URL: ${url}`);
    }

    const [, owner, repo, numberRaw] = match;
    const pullNumber = Number(numberRaw);
    return new GitHubService(owner, repo, pullNumber, token);
  }

  static async getStoredToken(): Promise<string | null> {
    if (typeof chrome === "undefined" || !chrome.storage?.sync) {
      return null;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get(["githubToken"], (result) => {
        const token = typeof result.githubToken === "string" ? result.githubToken.trim() : "";
        resolve(token || null);
      });
    });
  }

  static async saveToken(token: string): Promise<void> {
    if (typeof chrome === "undefined" || !chrome.storage?.sync) {
      throw new Error("Chrome storage API is not available in this context");
    }

    const normalized = token.trim();
    await new Promise<void>((resolve, reject) => {
      chrome.storage.sync.set({ githubToken: normalized }, () => {
        const runtimeError = chrome.runtime?.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve();
      });
    });
  }

  async getPullRequestMetadata(): Promise<PullRequestMetadata> {
    return this.request<PullRequestMetadata>(
      `/repos/${this.owner}/${this.repo}/pulls/${this.pullNumber}`,
    );
  }

  async getChangedFiles(): Promise<PullRequestFile[]> {
    return this.getAllPages<PullRequestFile>(
      `/repos/${this.owner}/${this.repo}/pulls/${this.pullNumber}/files`,
      100,
    );
  }

  async getFileContent(path: string, ref: string): Promise<string | null> {
    if (!path || !ref) {
      return null;
    }

    try {
      const response = await this.request<{ content?: string; encoding?: string }>(
        `/repos/${this.owner}/${this.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`,
      );

      if (!response.content) {
        return null;
      }

      if (response.encoding === "base64") {
        return this.decodeBase64(response.content);
      }

      return response.content;
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getStructuredPullRequestData(): Promise<StructuredPullRequestData> {
    const metadata = await this.getPullRequestMetadata();
    const files = await this.getChangedFiles();

    const filesWithContent = await Promise.all(
      files.map(async (file): Promise<PullRequestFileWithContent> => {
        const beforePath = file.previous_filename || file.filename;

        const [contentBefore, contentAfter] = await Promise.all([
          file.status === "added" ? Promise.resolve(null) : this.getFileContent(beforePath, metadata.base.sha),
          file.status === "removed" ? Promise.resolve(null) : this.getFileContent(file.filename, metadata.head.sha),
        ]);

        return {
          ...file,
          contentBefore,
          contentAfter,
        };
      }),
    );

    return {
      repository: {
        owner: this.owner,
        name: this.repo,
      },
      pullRequest: {
        number: metadata.number,
        title: metadata.title,
        description: metadata.body || "",
        author: metadata.user?.login || "unknown",
        url: metadata.html_url,
        baseSha: metadata.base.sha,
        headSha: metadata.head.sha,
        changedFilesCount: metadata.changed_files,
        additions: metadata.additions,
        deletions: metadata.deletions,
      },
      files: filesWithContent,
    };
  }

  private async getAllPages<T>(path: string, perPage = 100): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (true) {
      const separator = path.includes("?") ? "&" : "?";
      const pagedPath = `${path}${separator}per_page=${perPage}&page=${page}`;
      const pageItems = await this.request<T[]>(pagedPath);

      results.push(...pageItems);

      if (pageItems.length < perPage) {
        break;
      }

      page += 1;
      if (page > 100) {
        throw new GitHubApiError("Pagination safety limit reached", { url: path });
      }
    }

    return results;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.apiBaseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const bodyText = await response.text();
        const rateRemaining = response.headers.get("x-ratelimit-remaining");
        const rateReset = response.headers.get("x-ratelimit-reset");

        if (response.status === 401 || response.status === 403) {
          if (rateRemaining === "0") {
            throw new GitHubRateLimitError(
              "GitHub API rate limit exceeded",
              rateReset ? Number(rateReset) : undefined,
              { status: response.status, url, details: bodyText },
            );
          }

          throw new GitHubAuthError("GitHub authentication failed or token lacks scope", {
            status: response.status,
            url,
            details: bodyText,
          });
        }

        if (response.status === 429) {
          throw new GitHubRateLimitError(
            "GitHub API secondary rate limit hit",
            rateReset ? Number(rateReset) : undefined,
            { status: response.status, url, details: bodyText },
          );
        }

        throw new GitHubApiError(`GitHub API request failed with status ${response.status}`, {
          status: response.status,
          url,
          details: bodyText,
        });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new GitHubApiError("GitHub API request timed out", { url });
      }

      throw new GitHubApiError("GitHub API request failed unexpectedly", {
        url,
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private decodeBase64(base64Text: string): string {
    try {
      const cleaned = base64Text.replace(/\n/g, "");
      return atob(cleaned);
    } catch {
      throw new GitHubApiError("Failed to decode base64 file content from GitHub API");
    }
  }
}
