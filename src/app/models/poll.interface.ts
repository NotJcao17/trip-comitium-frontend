export interface Poll {
    poll_id?: number;
    trip_id: number;
    title: string;
    type: 'date' | 'tier_list' | 'slider' | 'multiple_choice' | 'text';
    status: 'active' | 'locked' | 'hidden';
    config?: any; // Aquí guardamos el JSON (ej. rango de fechas)
    created_at?: Date;
    options?: PollOption[]; // Lista de opciones (si aplica)
}

export interface PollOption {
    option_id?: number;
    poll_id?: number;
    text: string;
    image_url?: string;
}
