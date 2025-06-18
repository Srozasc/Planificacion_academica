export class ScheduleEventDto {
  id: number;
  academic_structure_id: number;
  teacher_id: number;
  area_id: number;
  start_datetime: string;
  end_datetime: string;
  day_of_week: string;
  classroom?: string;
  vacancies?: number;
  max_capacity?: number;
  status_id: number;
  approval_comment?: string;
  approved_by?: number;
  approved_at?: string;
  weekly_hours?: number;
  academic_period?: string;
  section?: string;
  is_recurring: boolean;
  recurrence_end_date?: string;
  is_active: boolean;
  conflicts_checked: boolean;
  validation_notes?: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;

  // Información relacionada
  subject_name?: string;
  subject_code?: string;
  semester?: number;
  credits?: number;
  teacher_name?: string;
  teacher_email?: string;
  teacher_phone?: string;
  status_name?: string;
  status_description?: string;
  status_color?: string;
  can_edit?: boolean;
  can_delete?: boolean;
  created_by_name?: string;
  created_by_email?: string;
  approved_by_name?: string;
  approved_by_email?: string;
}
