ALTER TABLE veterinaria_bd.usuarios
	ADD tipo_Usuario VARCHAR(1) NULL;    
    
UPDATE veterinaria_bd.usuarios
SET tipo_Usuario = 'A'
WHERE ID != 0;

ALTER TABLE veterinaria_bd.usuarios
	MODIFY tipo_Usuario VARCHAR(1) NOT NULL;    
    
ALTER VIEW veterinaria_bd.`vista_usuarios` AS
    SELECT 
        `usuarios`.`id` AS `id`,
        `usuarios`.`nombre` AS `nombre`,
        `usuarios`.`email` AS `email`,
        `usuarios`.`telefono` AS `telefono`,
        DATE_FORMAT(`usuarios`.`fecha_creacion`,
                '%d/%m/%Y %H:%i') AS `fecha_creacion_formato`,
        DATE_FORMAT(`usuarios`.`fecha_actualizacion`,
                '%d/%m/%Y %H:%i') AS `fecha_actualizacion_formato`,
        (TO_DAYS(NOW()) - TO_DAYS(`usuarios`.`fecha_creacion`)) AS `dias_desde_registro`,
        case `usuarios`.`tipo_usuario` when 'A' then 'Administrador' when 'C' then 'Cliente' end AS `tipo_usuario`
    FROM
        `usuarios`
    ORDER BY `usuarios`.`fecha_creacion` DESC;