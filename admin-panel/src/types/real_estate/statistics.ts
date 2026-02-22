export interface PropertyStatistics {
    generated_at: string;
    properties: {
        total: number;
        published: number;
        draft: number;
        featured: number;
        verified: number;
        active: number;
        public: number;
        published_percentage: number;
        featured_percentage: number;
        verified_percentage: number;
    };
    types: {
        total: number;
        with_properties: number;
        without_properties: number;
    };
    listing_types: {
        total: number;
        with_properties: number;
        without_properties: number;
    };
    labels: {
        total: number;
        with_properties: number;
        without_properties: number;
    };
    features: {
        total: number;
        with_properties: number;
        without_properties: number;
    };
    tags: {
        total: number;
        with_properties: number;
        without_properties: number;
    };
    agents: {
        total: number;
        active: number;
        verified: number;
        with_properties: number;
        active_percentage: number;
        verified_percentage: number;
    };
    agencies: {
        total: number;
        active: number;
        verified: number;
        with_properties: number;
        active_percentage: number;
        verified_percentage: number;
    };
    financials: {
        total_sales_value: number;
        total_commissions: number;
        total_sold_properties: number;
    };
    traffic: {
        web_views: number;
        app_views: number;
        total_views: number;
    };
    top_agents: {
        id: number;
        name: string;
        avatar: string | null;
        rating: number;
        total_sales: number;
        total_commissions: number;
        sold_count: number;
    }[];
    recent_properties?: any[];
}
