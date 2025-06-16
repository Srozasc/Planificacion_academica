export class ScheduleEvent {
  id: number;
  asignatura_id: number;
  docente_id: number;
  start_datetime: Date;
  end_datetime: Date;
  dia_semana: string;
  aula: string;
  vacantes: number;
  area_id: number;
  status_id: number;
  created_by_user_id: number;
  created_at: Date;
  updated_at: Date;
}
