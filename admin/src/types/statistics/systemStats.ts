export interface SystemStats {
  storage: {
    total_bytes: number;
    total_mb: number;
    total_gb: number;
    total_formatted: string;
    by_type: {
      [key: string]: {
        size_bytes: number;
        size_mb: number;
        size_gb: number;
        count: number;
        formatted: string;
      };
    };
  };
  cache: {
    status: string;
    used_memory_bytes: number;
    used_memory_formatted: string;
    total_keys: number;
    hit_rate: number;
    keyspace_hits: number;
    keyspace_misses: number;
  };
  database: {
    size_formatted: string;
    size_bytes: number;
    size_mb: number;
    size_gb: number;
    vendor: string;
  };
  generated_at: string;
}
