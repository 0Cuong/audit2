type Row = Record<string, any>;
interface QueryResult<T = any> { data: T; error: any; }

const base = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
const apiUrl = (path: string) => base + path;

async function request<T = any>(path: string, init?: RequestInit): Promise<QueryResult<T>> {
  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) }
    });
    const body = await response.json().catch(() => ({ data: null, error: { message: "Invalid backend response" } }));
    if (!response.ok && !body.error) body.error = { message: response.statusText || "Request failed", status: response.status };
    return body;
  } catch (error: any) {
    return { data: null, error: { message: error?.message || "Network error", status: 0 } };
  }
}

class Query<T = any> implements PromiseLike<QueryResult<T>> {
  private payload: any;
  constructor(table: string) { this.payload = { table, action: "select", select: "*", filters: [] }; }

  select(columns = "*") { this.payload.select = columns || "*"; if (this.payload.action !== "select") this.payload.returnRows = true; return this; }
  insert(data: Row | Row[]) { this.payload.action = "insert"; this.payload.data = data; this.payload.returnRows = false; return this; }
  upsert(data: Row | Row[], options?: { onConflict?: string }) { this.payload.action = "upsert"; this.payload.data = data; this.payload.returnRows = false; this.payload.onConflict = options?.onConflict || "id"; return this; }
  update(data: Row) { this.payload.action = "update"; this.payload.data = data; this.payload.returnRows = false; return this; }
  delete() { this.payload.action = "delete"; return this; }

  eq(column: string, value: any) { this.payload.filters.push({ column, op: "eq", value }); return this; }
  neq(column: string, value: any) { this.payload.filters.push({ column, op: "neq", value }); return this; }
  gt(column: string, value: any) { this.payload.filters.push({ column, op: "gt", value }); return this; }
  gte(column: string, value: any) { this.payload.filters.push({ column, op: "gte", value }); return this; }
  lt(column: string, value: any) { this.payload.filters.push({ column, op: "lt", value }); return this; }
  lte(column: string, value: any) { this.payload.filters.push({ column, op: "lte", value }); return this; }
  in(column: string, values: any[]) { this.payload.filters.push({ column, op: "in", value: values }); return this; }
  is(column: string, value: any) { this.payload.filters.push({ column, op: "is", value }); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.payload.order = { column, ascending: options?.ascending !== false }; return this; }
  limit(count: number) { this.payload.limit = count; return this; }

  single() { this.payload.single = "single"; return this.execute(); }
  maybeSingle() { this.payload.single = "maybeSingle"; return this.execute(); }

  execute() { return request<QueryResult<T>>("/api/data", { method: "POST", body: JSON.stringify(this.payload) }); }
  then(onfulfilled?: any, onrejected?: any) { return this.execute().then(onfulfilled, onrejected); }
  catch(onrejected?: any) { return this.execute().catch(onrejected); }
}

class StorageBucket {
  constructor(private readonly bucket: string) {}

  async upload(path: string, file: Blob) {
    const form = new FormData();
    form.append("file", file, file instanceof File ? file.name : path.split("/").pop() || "file");
    const response = await fetch(apiUrl("/api/storage/" + encodeURIComponent(this.bucket) + "/" + path.split("/").map(encodeURIComponent).join("/")), { method: "POST", body: form });
    return response.json();
  }

  async remove(paths: string[]) {
    let firstError: any = null;
    for (const path of paths) {
      const response = await fetch(apiUrl("/api/storage/" + encodeURIComponent(this.bucket) + "/" + path.split("/").map(encodeURIComponent).join("/")), { method: "DELETE" });
      if (!response.ok && !firstError) firstError = { message: "Storage delete failed", status: response.status };
    }
    return { data: firstError ? null : [], error: firstError };
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: apiUrl("/api/media/" + encodeURIComponent(this.bucket) + "/" + path.split("/").map(encodeURIComponent).join("/")) } };
  }
}

class StorageClient { from(bucket: string) { return new StorageBucket(bucket); } }
class BackendCompatClient {
  storage = new StorageClient();
  from<T = any>(table: string) { return new Query<T>(table); }
}

export const supabase = new BackendCompatClient();
export const backendClient = supabase;
export const isSupabaseConfigured = true;