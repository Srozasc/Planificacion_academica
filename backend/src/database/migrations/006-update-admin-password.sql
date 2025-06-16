-- Actualizar contraseña del usuario admin
UPDATE users 
SET password_hash = '$2a$10$vuRjJZMenDXrldzKKsfiH.WGXTxouKuDOK.BFnIrEbffL8sFWKdF.' 
WHERE email_institucional = 'admin@planificacion.edu';
