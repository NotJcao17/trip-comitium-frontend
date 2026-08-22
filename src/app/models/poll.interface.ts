export interface Poll {
    poll_id?: number;
    trip_id: number;
    title: string;
    type: 'date' | 'tier_list' | 'slider' | 'multiple_choice' | 'text';
    status: 'active' | 'locked' | 'hidden';
    config?: any;
    created_at?: Date;
    options?: PollOption[];
}

export interface PollOption {
    option_id?: number;
    poll_id?: number;
    text: string;
    image_url?: string;
}

export interface PollCreatePayload {
    title: string;
    type: 'date' | 'tier_list' | 'slider' | 'multiple_choice' | 'text';
    config?: any;
    options?: string[];
}

export interface PollStats {
    pollId?: number;
    type?: string;
    title?: string;
    status?: string;
    totalVotes?: number;
    results?: Record<string | number, number>;
    votersByOption?: Record<string | number, Array<{ id: number; name: string }>>;
    min?: number;
    max?: number;
    average?: number;
    votes?: Array<{ id?: number; name: string; value: any }>;
    heatmap?: Record<string, { count: number; voters: Array<{ id: number; name: string } | string> }>;
    ranking?: Array<{ item: string; score: number }>;
    rawVotes?: Array<{ id?: number; name: string; tiers?: any }>;
    responses?: Array<{ id?: number; name: string; text: string }>;
    days?: any[];
}
