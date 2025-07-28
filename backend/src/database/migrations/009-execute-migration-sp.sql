-- Execute the stored procedure to migrate data from staging_estructura_academica to academic_structures
CALL sp_MigrateStagingToAcademicStructures();