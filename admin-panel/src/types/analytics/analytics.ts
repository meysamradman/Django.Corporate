export interface AnalyticsDashboard {
  today: {
    total: number;
    unique: number;
    web: number;
    app: number;
  };
  last_30_days: {
    total: number;
    unique: number;
    web: number;
    app: number;
    mobile: number;
    desktop: number;
  };
  top_pages: TopPage[];
  top_countries: TopCountry[];
}

export interface TopPage {
  path: string;
  count: number;
}

export interface TopCountry {
  country: string;
  count: number;
}

export interface AnalyticsChartData {
  labels: string[];
  visits: number[];
  unique: number[];
}

export interface AnalyticsFilters {
  days?: number;
  source?: 'web' | 'app' | 'all';
  date_from?: string;
  date_to?: string;
}

export interface DashboardStats {
  total_portfolios: number;
  total_portfolio_categories: number;
  total_portfolio_tags: number;
  total_portfolio_options: number;
  total_admins: number;
  total_users: number;
  total_media: number;
  total_posts: number;
  total_blog_categories: number;
  total_blog_tags: number;
  total_emails: number;
  new_emails: number;
  unanswered_emails: number;
  total_tickets: number;
  open_tickets: number;
  active_tickets: number;
  unanswered_tickets: number;
}

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
