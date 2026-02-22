CREATE TABLE citas (
    idCita INT AUTO_INCREMENT PRIMARY KEY,

    mascotaId INT NOT NULL,

    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,

    estado VARCHAR(1) NOT NULL DEFAULT 'P',

    motivo VARCHAR(255) NOT NULL,
    notas VARCHAR(2000) NULL,

    creada_por INT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    modificada_por INT NULL,
    fecha_actualizacion DATETIME NOT NULL 
        DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_cita_mascota
        FOREIGN KEY (mascotaId)
        REFERENCES mascota(idMascota),

    CONSTRAINT fk_cita_creada_por
        FOREIGN KEY (creada_por)
        REFERENCES usuarios(id),

    CONSTRAINT fk_cita_modificada_por
        FOREIGN KEY (modificada_por)
        REFERENCES usuarios(id),

    -- Índices importantes
    INDEX idx_cita_fecha_inicio (fecha_inicio),
    INDEX idx_cita_estado (estado),
    INDEX idx_cita_rango (fecha_inicio, fecha_fin)
);


CREATE TABLE cita_reservas (
    idReserva INT AUTO_INCREMENT PRIMARY KEY,

    mascotaId INT NOT NULL,
    usuarioId INT NOT NULL,

    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,

    fecha_expiracion DATETIME NOT NULL,

    -- Foreign Keys
    CONSTRAINT fk_reserva_mascota
        FOREIGN KEY (mascotaId)
        REFERENCES mascota(idMascota),

    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (usuarioId)
        REFERENCES usuarios(id),

    -- Índices para validaciones críticas
    INDEX idx_reserva_rango (fecha_inicio, fecha_fin),
    INDEX idx_reserva_expiracion (fecha_expiracion),
    INDEX idx_reserva_mascota_fecha (mascotaId, fecha_inicio)
);


DELIMITER $$

CREATE PROCEDURE sp_reservar_cita_temporal(
    IN p_usuarioId INT,
    IN p_mascotaId INT,
    IN p_fecha_inicio DATETIME,
    IN p_fecha_fin DATETIME,
    IN p_timeout_minutos INT
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_fecha_expiracion DATETIME;

    DECLARE v_hora_inicio TIME DEFAULT '09:00:00';
    DECLARE v_hora_fin TIME DEFAULT '17:00:00';

    -- Aislamiento fuerte
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    START TRANSACTION;

    -- Limpiar reservas expiradas
    DELETE FROM cita_reservas
    WHERE fecha_expiracion <= NOW();

    -- Validar rango correcto
    IF p_fecha_inicio >= p_fecha_fin THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Rango de fecha inválido';
    END IF;

    -- Validar que no cruce de día
    IF DATE(p_fecha_inicio) <> DATE(p_fecha_fin) THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se permiten reservas que crucen de día';
    END IF;

    -- Validar horario laboral
    IF TIME(p_fecha_inicio) < v_hora_inicio
       OR TIME(p_fecha_fin) > v_hora_fin THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Fuera de horario laboral';
    END IF;

    -- Validar que la mascota no tenga cita P o F ese día
    SELECT COUNT(*) INTO v_existe
    FROM citas
    WHERE estado IN ('P','F')
      AND mascotaId = p_mascotaId
      AND DATE(fecha_inicio) = DATE(p_fecha_inicio)
    FOR UPDATE;

    IF v_existe > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La mascota ya tiene una cita ese día';
    END IF;

    -- Eliminar cualquier reserva activa previa de la mascota
    DELETE FROM cita_reservas
    WHERE mascotaId = p_mascotaId
      AND fecha_expiracion > NOW();

    -- Validar solapamiento contra citas activas
    SELECT COUNT(*) INTO v_existe
    FROM citas
    WHERE estado IN ('P','F')
      AND fecha_inicio < p_fecha_fin
      AND fecha_fin > p_fecha_inicio
    FOR UPDATE;

    IF v_existe > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya existe una cita en ese rango';
    END IF;

    -- Validar solapamiento contra reservas activas
    SELECT COUNT(*) INTO v_existe
    FROM cita_reservas
    WHERE fecha_expiracion > NOW()
      AND fecha_inicio < p_fecha_fin
      AND fecha_fin > p_fecha_inicio
    FOR UPDATE;

    IF v_existe > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya existe una reserva activa en ese rango';
    END IF;

    -- Calcular expiración
    SET v_fecha_expiracion = DATE_ADD(NOW(), INTERVAL p_timeout_minutos MINUTE);

    -- Insertar reserva
    INSERT INTO cita_reservas (
        mascotaId,
        usuarioId,
        fecha_inicio,
        fecha_fin,
        fecha_expiracion
    )
    VALUES (
        p_mascotaId,
        p_usuarioId,
        p_fecha_inicio,
        p_fecha_fin,
        v_fecha_expiracion
    );

    COMMIT;

    SELECT LAST_INSERT_ID() AS idReserva;

END$$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_confirmar_reserva_y_crear_cita(
    IN p_idReserva INT,
    IN p_usuarioId INT,
    IN p_motivo VARCHAR(255),
    IN p_notas VARCHAR(2000)
)
BEGIN
    DECLARE v_mascotaId INT;
    DECLARE v_fecha_inicio DATETIME;
    DECLARE v_fecha_fin DATETIME;
    DECLARE v_expiracion DATETIME;
    DECLARE v_idCita INT;

    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    START TRANSACTION;

    -- Obtener datos de la reserva con bloqueo
    SELECT mascotaId, fecha_inicio, fecha_fin, fecha_expiracion
    INTO v_mascotaId, v_fecha_inicio, v_fecha_fin, v_expiracion
    FROM cita_reservas
    WHERE idReserva = p_idReserva
    FOR UPDATE;

    -- Validar que exista
    IF v_mascotaId IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Reserva no existe';
    END IF;

    -- Validar que no esté expirada
    IF v_expiracion <= NOW() THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La reserva ha expirado';
    END IF;

    -- Insertar cita
    INSERT INTO citas (
        mascotaId,
        fecha_inicio,
        fecha_fin,
        estado,
        motivo,
        notas,
        creada_por,
        fecha_creacion
    )
    VALUES (
        v_mascotaId,
        v_fecha_inicio,
        v_fecha_fin,
        'P',
        p_motivo,
        p_notas,
        p_usuarioId,
        NOW()
    );

    SET v_idCita = LAST_INSERT_ID();

    -- Eliminar reserva
    DELETE FROM cita_reservas
    WHERE idReserva = p_idReserva;

    COMMIT;

    -- Devolver idCita
    SELECT v_idCita AS idCita;

END$$

DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_cancelar_cita(
    IN p_idCita INT,
    IN p_usuarioId INT
)
BEGIN
    DECLARE v_tipoUsuario VARCHAR(1);
    DECLARE v_estado VARCHAR(1);
    DECLARE v_fecha_inicio DATETIME;

    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    START TRANSACTION;

    -- 1 Obtener tipo de usuario
    SELECT tipo_Usuario
    INTO v_tipoUsuario
    FROM usuarios
    WHERE id = p_usuarioId
    FOR UPDATE;

    IF v_tipoUsuario IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario no existe';
    END IF;

    -- 2 Obtener estado y fecha de la cita
    SELECT estado, fecha_inicio
    INTO v_estado, v_fecha_inicio
    FROM citas
    WHERE idCita = p_idCita
    FOR UPDATE;

    IF v_estado IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cita no existe';
    END IF;

    -- 3 Validar estado cancelable
    IF v_estado NOT IN ('P','F') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cita no puede cancelarse';
    END IF;

    -- 4 Validar regla de 1 hora para clientes
    IF v_tipoUsuario = 'C' THEN
        IF NOW() > DATE_SUB(v_fecha_inicio, INTERVAL 1 HOUR) THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede cancelar con menos de 1 hora de anticipación';
        END IF;
    END IF;

    -- 5 Cancelar cita
    UPDATE citas
    SET estado = 'C',
        modificada_por = p_usuarioId
    WHERE idCita = p_idCita;

    COMMIT;

END$$

DELIMITER ;