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


DELIMITER $$

CREATE PROCEDURE sp_sincronizar_correo(
    IN p_usuarioId INT,
    IN p_nuevoCorreo VARCHAR(255)
)
BEGIN
    DECLARE v_existente INT DEFAULT 0;

    START TRANSACTION;

    -- Validar que el correo no esté registrado en otro usuario
    SELECT COUNT(*) INTO v_existente
    FROM usuarios
    WHERE email = p_nuevoCorreo
      AND id <> p_usuarioId;

    IF v_existente > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El correo ya está registrado en otro usuario';
    END IF;

    -- Actualizar usuario
    UPDATE usuarios
    SET email = p_nuevoCorreo
    WHERE id = p_usuarioId;

    -- Actualizar propietario asociado
    UPDATE propietario
    SET Correo = p_nuevoCorreo
    WHERE usuarioId = p_usuarioId;

    COMMIT;

END$$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_crear_usuario_y_propietario(
    IN p_nombre VARCHAR(100),
    IN p_apellidos VARCHAR(100),
    IN p_cedula VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_telefono VARCHAR(20),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_existente INT DEFAULT 0;
    DECLARE v_usuarioId INT;
    DECLARE v_propietarioId INT;

    START TRANSACTION;

    -- 1 Validar email en usuarios
    SELECT COUNT(*) INTO v_existente
    FROM usuarios
    WHERE email = p_email;

    IF v_existente > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El correo ya está registrado en usuarios';
    END IF;

    -- 2️ Validar email en propietario
    SELECT COUNT(*) INTO v_existente
    FROM propietario
    WHERE Correo = p_email;

    IF v_existente > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El correo ya está registrado en propietarios';
    END IF;

    -- 3 Validar cédula única
    SELECT COUNT(*) INTO v_existente
    FROM propietario
    WHERE Cedula = p_cedula;

    IF v_existente > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cédula ya está registrada';
    END IF;

    -- 4 Insertar usuario
    INSERT INTO usuarios (
        nombre,
        email,
        telefono,
        password,
        fecha_creacion,
        tipo_Usuario
    )
    VALUES (
        CONCAT(p_nombre, ' ', p_apellidos),
        p_email,
        p_telefono,
        p_password,
        NOW(),
        'C'
    );

    SET v_usuarioId = LAST_INSERT_ID();

    -- 5 Insertar propietario
    INSERT INTO propietario (
        Nombre,
        Apellidos,
        Cedula,
        Telefono,
        Correo,
        usuarioId
    )
    VALUES (
        p_nombre,
        p_apellidos,
        p_cedula,
        p_telefono,
        p_email,
        v_usuarioId
    );

    SET v_propietarioId = LAST_INSERT_ID();

    COMMIT;

    -- 6 Devolver id del propietario
    SELECT v_propietarioId AS propietarioId;

END$$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_eliminar_propietario(
    IN p_idPropietario INT
)
BEGIN
    DECLARE v_usuarioId INT;

    START TRANSACTION;

    -- 1️⃣ Verificar que exista el propietario
    SELECT usuarioId
    INTO v_usuarioId
    FROM propietario
    WHERE idPropietario = p_idPropietario;

    IF v_usuarioId IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El propietario no existe';
    END IF;

    -- 2️⃣ Eliminar propietario
    DELETE FROM propietario
    WHERE idPropietario = p_idPropietario;

    -- 3️⃣ Eliminar usuario asociado
    DELETE FROM usuarios
    WHERE id = v_usuarioId;

    COMMIT;

END$$

DELIMITER ;