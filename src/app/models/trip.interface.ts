export interface Trip {
    trip_id?: number;
    id?: number;
    name: string;
    description?: string;
    share_code?: string;
    shareCode?: string;
    room_type?: 'open' | 'closed';
    roomType?: 'open' | 'closed';
    created_at?: Date;
}

export interface Participant {
    participant_id?: number;
    id?: number;
    trip_id?: number;
    name: string;
    is_admin?: boolean;
    isAdmin?: boolean;
    status?: 'invited' | 'active';
    is_claimed?: boolean;
    isClaimed?: boolean;
}

export interface RosterResponse {
    roomType: 'open' | 'closed';
    participants: Participant[];
}
