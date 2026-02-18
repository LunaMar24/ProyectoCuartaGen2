ALTER TABLE `veterinaria_bd`.`propietario`
   ADD usuarioId INT NULL;
   
UPDATE veterinaria_bd.propietario p
INNER JOIN veterinaria_bd.usuarios u 
    ON p.idPropietario = u.id
SET p.usuarioId = u.id;

DELETE FROM veterinaria_bd.propietario
WHERE idPropietario not in (2,11);

ALTER TABLE `veterinaria_bd`.`propietario`
   MODIFY usuarioId INT NOT NULL;
   
ALTER TABLE propietario
ADD CONSTRAINT fk_propietario_usuario
FOREIGN KEY (usuarioId)
REFERENCES usuarios(id);

CREATE UNIQUE INDEX `uq_propietario_usuarioId` ON `veterinaria_bd`.`propietario` (`usuarioId` ASC) VISIBLE;

DELETE FROM veterinaria_bd.usuarios
WHERE id not in (2,11,1);

update veterinaria_bd.usuarios
set tipo_Usuario = 'C'
WHERE id in (2,11);

update veterinaria_bd.usuarios
set tipo_Usuario = 'A'
WHERE id in (1);


ALTER TABLE veterinaria_bd.propietario MODIFY Correo VARCHAR(255);