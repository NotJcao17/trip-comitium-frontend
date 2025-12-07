export interface Vote {
    vote_id?: number;
    poll_id: number;
    participant_id: number;
    option_id?: number;    // Para selección simple
    vote_value?: any;      // Para JSON (fechas, tier list, slider)
    text_response?: string; // Para texto
}
