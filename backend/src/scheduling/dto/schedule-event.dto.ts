export class ScheduleEventDto {
  id: number;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  teacher?: string;
  subject?: string;
  room?: string;
  students?: number;
  background_color?: string;
  bimestre_id?: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;

  // Información adicional del bimestre si está disponible
  bimestre?: {
    id: number;
    nombre: string;
    anoAcademico: number;
  };

  // Métodos helper para el frontend
  static fromEntity(entity: any): ScheduleEventDto {
    const dto = new ScheduleEventDto();
    dto.id = entity.id;
    dto.title = entity.title;
    dto.description = entity.description;
    dto.start_date = entity.start_date;
    dto.end_date = entity.end_date;
    dto.teacher = entity.teacher;
    dto.subject = entity.subject;
    dto.room = entity.room;
    dto.students = entity.students;
    dto.background_color = entity.background_color;
    dto.bimestre_id = entity.bimestre_id;
    dto.active = entity.active;
    dto.created_at = entity.created_at;
    dto.updated_at = entity.updated_at;

    // Incluir información del bimestre si está disponible
    if (entity.bimestre) {
      dto.bimestre = {
        id: entity.bimestre.id,
        nombre: entity.bimestre.nombre,
        anoAcademico: entity.bimestre.anoAcademico,
      };
    }

    return dto;
  }

  // Convertir al formato esperado por el frontend
  toFrontendFormat(): any {
    return {
      id: this.id.toString(),
      title: this.title,
      description: this.description,
      start: this.start_date.toISOString(),
      end: this.end_date.toISOString(),
      backgroundColor: this.background_color,
      extendedProps: {
        teacher: this.teacher,
        room: this.room,
        students: this.students,
        subject: this.subject,
        bimestre: this.bimestre,
      },
    };
  }
}
