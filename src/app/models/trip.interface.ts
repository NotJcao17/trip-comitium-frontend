export interface Trip {
    trip_id?: number;
    name: string;
    description?: string;
    share_code: string;
    created_at?: Date;
}

export interface Participant {
    participant_id: number;
    trip_id: number;
    name: string;
    is_admin: boolean; // MySQL devuelve 0/1, pero en el front lo trataremos como boolean
    has_paid?: boolean; // (Aunque lo quitamos de la BD, lo dejo opcional por si acaso en visualización)
}
