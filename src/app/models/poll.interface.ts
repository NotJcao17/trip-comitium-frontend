export interface Poll {
    poll_id?: number;
    trip_id: number;
    title: string;
    description?: string;
    type: 'date' | 'tier_list' | 'slider' | 'multiple_choice' | 'text';
    status: 'active' | 'locked' | 'hidden';
    /** Solo el organizador ve quién votó qué. */
    is_anonymous?: boolean | number;
    config?: any;
    created_at?: Date;
    options?: PollOption[];
}

export interface PollOption {
    option_id?: number;
    poll_id?: number;
    text: string;
    description?: string | null;
    image_url?: string;
}

/** Opción tal como la captura el organizador antes de publicar la encuesta. */
export interface PollOptionDraft {
    text: string;
    description?: string;
}

export interface PollCreatePayload {
    title: string;
    description?: string;
    type: 'date' | 'tier_list' | 'slider' | 'multiple_choice' | 'text';
    isAnonymous?: boolean;
    config?: any;
    options?: Array<string | PollOptionDraft>;
}

export interface PollStats {
    pollId?: number;
    type?: string;
    title?: string;
    status?: string;
    isAnonymous?: boolean;
    /** El servidor no envió los nombres porque quien consulta no es el organizador. */
    votersHidden?: boolean;
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
