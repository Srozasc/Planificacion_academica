// Types for scheduling feature
export interface ScheduleEvent {
  id: string;
  asignaturaId: number;
  docenteId: number;
  startDate: string;
  endDate: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aula?: string;
  vacantes?: number;
  areaId: number;
}
