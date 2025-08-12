# Modelo Entidad-Relación - Sistema de Planificación Académica

## Diagrama ER en Mermaid

```mermaid
erDiagram
    %% Entidades principales del sistema
    
    %% Usuarios y Roles
    users {
        int id PK
        varchar email_institucional UK
        varchar password_hash
        varchar name
        varchar phone
        int role_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    roles {
        int id PK
        varchar name
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    permissions {
        int id PK
        varchar name UK
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    role_permissions {
        int role_id PK,FK
        int permission_id PK,FK
        timestamp created_at
    }
    
    %% Estructura Académica
    academic_structures {
        int id PK
        varchar code UK
        varchar name
        varchar semester
        int credits
        varchar modality
        varchar career
        varchar area
        varchar subject_type
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    bimestres {
        int id PK
        varchar name UK
        date start_date
        date end_date
        int year
        boolean is_active
        boolean is_current
        timestamp created_at
        timestamp updated_at
    }
    
    %% Docentes
    teachers {
        int id PK
        varchar rut UK
        varchar name
        varchar email UK
        varchar phone
        text address
        varchar academic_degree
        varchar specialization
        varchar university
        int category_id FK
        int contract_type_id FK
        date hire_date
        decimal contract_hours
        decimal salary_base
        boolean is_active
        boolean can_coordinate
        int max_hours_per_week
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    %% Códigos de Pago
    payment_codes {
        int id PK
        varchar code_name UK
        varchar description
        decimal factor
        decimal base_amount
        enum category
        enum type
        boolean is_active
        boolean requires_hours
        boolean is_taxable
        date valid_from
        date valid_until
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    %% Eventos de Programación
    schedule_events {
        int id PK
        varchar title
        text description
        datetime start_date
        datetime end_date
        varchar room
        int academic_structure_id FK
        int teacher_id FK
        int area_id
        datetime start_datetime
        datetime end_datetime
        varchar day_of_week
        varchar classroom
        int vacancies
        int max_capacity
        int status_id FK
        text approval_comment
        int approved_by FK
        datetime approved_at
        decimal weekly_hours
        varchar academic_period
        varchar section
        boolean is_recurring
        date recurrence_end_date
        boolean is_active
        boolean conflicts_checked
        text validation_notes
        int created_by_user_id FK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    event_statuses {
        int id PK
        varchar name UK
        text description
        boolean is_active
        int sort_order
        varchar color_hex
        boolean can_edit
        boolean can_delete
        timestamp created_at
        timestamp updated_at
    }
    
    event_teachers {
        int id PK
        int event_id FK
        int teacher_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    %% Reportes y Datos
    course_reports_data {
        int id PK
        int academic_structure_id FK
        varchar term
        int year
        varchar modality
        int student_count
        decimal hours_per_week
        int total_weeks
        decimal total_hours
        varchar observations
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    %% Configuración del Sistema
    configuration {
        int id PK
        varchar config_key UK
        text config_value
        varchar data_type
        text description
        varchar category
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    %% Logs y Auditoría
    upload_logs {
        int id PK
        varchar file_name
        varchar upload_type
        timestamp upload_date
        int bimestre_id FK
        enum status
        enum approval_status
        int approved_by FK
        timestamp approved_at
        boolean is_processed
        timestamp processed_at
        int total_records
        int error_count
        int user_id FK
        text error_details
    }
    
    sp_debug_log {
        int id PK
        varchar procedure_name
        text log_message
        varchar log_level
        text context_data
        timestamp created_at
    }
    
    conexion_test {
        int id PK
        varchar test_name
        text test_result
        timestamp test_date
    }
    
    %% Relaciones
    
    %% Usuarios y Roles
    users ||--o{ roles : "tiene"
    roles ||--o{ role_permissions : "tiene"
    permissions ||--o{ role_permissions : "asignado_a"
    
    %% Docentes y Códigos de Pago
    teachers }o--|| payment_codes : "categoria"
    teachers }o--|| payment_codes : "tipo_contrato"
    
    %% Eventos de Programación
    schedule_events }o--|| academic_structures : "pertenece_a"
    schedule_events }o--|| teachers : "asignado_a"
    schedule_events }o--|| event_statuses : "tiene_estado"
    schedule_events }o--|| users : "creado_por"
    schedule_events }o--|| users : "aprobado_por"
    
    %% Relación Many-to-Many entre Eventos y Docentes
    schedule_events ||--o{ event_teachers : "tiene"
    teachers ||--o{ event_teachers : "asignado_a"
    
    %% Reportes
    course_reports_data }o--|| academic_structures : "reporta"
    
    %% Logs
    upload_logs }o--|| bimestres : "asociado_a"
    upload_logs }o--|| users : "cargado_por"
    upload_logs }o--|| users : "aprobado_por"
```

## Descripción de las Entidades Principales

### 1. **Gestión de Usuarios y Permisos**
- **users**: Usuarios del sistema con roles asignados
- **roles**: Roles del sistema (Administrador, Coordinador, etc.)
- **permissions**: Permisos granulares del sistema
- **role_permissions**: Tabla pivot para asignar permisos a roles

### 2. **Estructura Académica**
- **academic_structures**: Asignaturas y materias del plan de estudios
- **bimestres**: Períodos académicos (bimestres/semestres)

### 3. **Gestión de Docentes**
- **teachers**: Información personal, académica y contractual de docentes
- **payment_codes**: Códigos de pago para categorías, contratos, bonos y descuentos

### 4. **Programación Académica**
- **schedule_events**: Eventos de programación (clases, actividades)
- **event_statuses**: Estados de los eventos (Borrador, En Revisión, Aprobado, etc.)
- **event_teachers**: Relación many-to-many entre eventos y docentes

### 5. **Reportes y Datos**
- **course_reports_data**: Datos de reportes de cursos y matriculados

### 6. **Sistema y Configuración**
- **configuration**: Configuraciones del sistema
- **upload_logs**: Logs de cargas de archivos
- **sp_debug_log**: Logs de depuración de procedimientos almacenados
- **conexion_test**: Tabla para pruebas de conexión

## Características del Modelo

### Funcionalidades Principales:
1. **Gestión de Usuarios**: Sistema de roles y permisos granulares
2. **Programación Académica**: Asignación de docentes a materias con control de conflictos
3. **Gestión de Docentes**: Información completa incluyendo datos contractuales
4. **Reportes**: Generación de reportes académicos y de programación
5. **Auditoría**: Logs completos de actividades y cargas de datos

### Características Técnicas:
- **Soft Delete**: Eliminación lógica en tablas principales
- **Timestamps**: Control de creación y actualización
- **Validaciones**: Constraints y triggers para integridad de datos
- **Índices**: Optimización para consultas frecuentes
- **Procedimientos Almacenados**: Lógica de negocio en base de datos