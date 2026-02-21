-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: veterinaria_bd
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cita_reservas`
--

DROP TABLE IF EXISTS `cita_reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cita_reservas` (
  `idReserva` int NOT NULL AUTO_INCREMENT,
  `mascotaId` int NOT NULL,
  `usuarioId` int NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `fecha_expiracion` datetime NOT NULL,
  PRIMARY KEY (`idReserva`),
  KEY `fk_reserva_usuario` (`usuarioId`),
  KEY `idx_reserva_rango` (`fecha_inicio`,`fecha_fin`),
  KEY `idx_reserva_expiracion` (`fecha_expiracion`),
  KEY `idx_reserva_mascota_fecha` (`mascotaId`,`fecha_inicio`),
  CONSTRAINT `fk_reserva_mascota` FOREIGN KEY (`mascotaId`) REFERENCES `mascota` (`idMascota`),
  CONSTRAINT `fk_reserva_usuario` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cita_reservas`
--

LOCK TABLES `cita_reservas` WRITE;
/*!40000 ALTER TABLE `cita_reservas` DISABLE KEYS */;
/*!40000 ALTER TABLE `cita_reservas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `idCita` int NOT NULL AUTO_INCREMENT,
  `mascotaId` int NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `estado` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'P',
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notas` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creada_por` int NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modificada_por` int DEFAULT NULL,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCita`),
  KEY `fk_cita_mascota` (`mascotaId`),
  KEY `fk_cita_creada_por` (`creada_por`),
  KEY `fk_cita_modificada_por` (`modificada_por`),
  KEY `idx_cita_fecha_inicio` (`fecha_inicio`),
  KEY `idx_cita_estado` (`estado`),
  KEY `idx_cita_rango` (`fecha_inicio`,`fecha_fin`),
  CONSTRAINT `fk_cita_creada_por` FOREIGN KEY (`creada_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_cita_mascota` FOREIGN KEY (`mascotaId`) REFERENCES `mascota` (`idMascota`),
  CONSTRAINT `fk_cita_modificada_por` FOREIGN KEY (`modificada_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_medico`
--

DROP TABLE IF EXISTS `historial_medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_medico` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `Mascota` int NOT NULL,
  `FechaAtencion` datetime NOT NULL,
  `Motivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Diagnostico` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`idHistorial`),
  KEY `fk_Historial_Medico_Mascota1_idx` (`Mascota`),
  CONSTRAINT `fk_Historial_Medico_Mascota1` FOREIGN KEY (`Mascota`) REFERENCES `mascota` (`idMascota`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_medico`
--

LOCK TABLES `historial_medico` WRITE;
/*!40000 ALTER TABLE `historial_medico` DISABLE KEYS */;
INSERT INTO `historial_medico` VALUES (2,5,'2025-11-03 01:08:00','Dolor de panza','Gastroenteritis aguda'),(3,5,'2025-11-04 02:03:00','corte de uñas','arreglo por picos en uñas'),(7,4,'2025-11-03 14:21:00','atropello','patita quebrada'),(8,5,'2025-11-03 14:57:00','desparacitacion','se desparacito por presentar pequeños vomitos');
/*!40000 ALTER TABLE `historial_medico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mascota`
--

DROP TABLE IF EXISTS `mascota`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mascota` (
  `idMascota` int NOT NULL AUTO_INCREMENT,
  `Propietario` int NOT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Especie` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Raza` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Edad` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idMascota`),
  UNIQUE KEY `uq_mascota_propietario_nombre` (`Propietario`,`Nombre`),
  KEY `fk_Mascota_Propietario_idx` (`Propietario`),
  CONSTRAINT `fk_Mascota_Propietario` FOREIGN KEY (`Propietario`) REFERENCES `propietario` (`idPropietario`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mascota`
--

LOCK TABLES `mascota` WRITE;
/*!40000 ALTER TABLE `mascota` DISABLE KEYS */;
INSERT INTO `mascota` VALUES (4,2,'Muñeca','Perro','French Puddle','9 años'),(5,2,'LunaVivi','Perro','pastor','3 años'),(11,11,'LunaVal','perro','chiguagua','7 años');
/*!40000 ALTER TABLE `mascota` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `propietario`
--

DROP TABLE IF EXISTS `propietario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `propietario` (
  `idPropietario` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Cedula` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Telefono` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Correo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuarioId` int NOT NULL,
  PRIMARY KEY (`idPropietario`),
  UNIQUE KEY `uq_propietario_usuarioId` (`usuarioId`),
  CONSTRAINT `fk_propietario_usuario` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `propietario`
--

LOCK TABLES `propietario` WRITE;
/*!40000 ALTER TABLE `propietario` DISABLE KEYS */;
INSERT INTO `propietario` VALUES (2,'Marcela','Jiménez','6-0291-0060','83641655','marcelamja@gmail.com',2),(11,'Valeria','Campos Mora','0101234569','85007890','valeria.campos@outlook.com',11);
/*!40000 ALTER TABLE `propietario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo del usuario',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email único del usuario',
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Número de teléfono del usuario',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contraseña hasheada del usuario',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de última actualización',
  `tipo_Usuario` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  KEY `idx_nombre_email` (`nombre`,`email`),
  KEY `idx_fecha_actualizacion` (`fecha_actualizacion`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para almacenar información de usuarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Juan Pérez Gonzalez','juan.perez@ejemplo.com','83641656','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-21 01:59:52','A'),(2,'María García','marcelamja@gmail.com','+52 55 2345-6789','$2a$12$vuIJ6Z90FQfIFLlaatJlF.QVUhIO.o86u28tawMZOtz4zm5UGH8wu','2025-11-02 22:43:28','2026-02-21 00:08:20','C'),(11,'Valeria Campos','valeria.campos@outlook.com','83641656','$2a$12$ce1hdfiUcctR8b5iAD9l2eg7uC7Fo6GnN9iZskjzXpCGE.WcPpsR6','2025-11-03 02:08:54','2026-02-21 00:11:41','C');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `validar_email_insert` BEFORE INSERT ON `usuarios` FOR EACH ROW BEGIN
    -- Validar formato de email básico
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Formato de email inválido';
    END IF;
    
    -- Validar que el nombre no esté vacío
    IF TRIM(NEW.nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre no puede estar vacío';
    END IF;
    
    -- Limpiar espacios en blanco
    SET NEW.nombre = TRIM(NEW.nombre);
    SET NEW.email = TRIM(LOWER(NEW.email));
    SET NEW.telefono = TRIM(NEW.telefono);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `validar_email_update` BEFORE UPDATE ON `usuarios` FOR EACH ROW BEGIN
    -- Validar formato de email básico
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Formato de email inválido';
    END IF;
    
    -- Validar que el nombre no esté vacío
    IF TRIM(NEW.nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre no puede estar vacío';
    END IF;
    
    -- Limpiar espacios en blanco
    SET NEW.nombre = TRIM(NEW.nombre);
    SET NEW.email = TRIM(LOWER(NEW.email));
    SET NEW.telefono = TRIM(NEW.telefono);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `vhistorial_medico`
--

DROP TABLE IF EXISTS `vhistorial_medico`;
/*!50001 DROP VIEW IF EXISTS `vhistorial_medico`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vhistorial_medico` AS SELECT 
 1 AS `idHistorial`,
 1 AS `Mascota`,
 1 AS `FechaAtencion`,
 1 AS `Motivo`,
 1 AS `Diagnostico`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_usuarios`
--

DROP TABLE IF EXISTS `vista_usuarios`;
/*!50001 DROP VIEW IF EXISTS `vista_usuarios`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_usuarios` AS SELECT 
 1 AS `id`,
 1 AS `nombre`,
 1 AS `email`,
 1 AS `telefono`,
 1 AS `fecha_creacion_formato`,
 1 AS `fecha_actualizacion_formato`,
 1 AS `dias_desde_registro`,
 1 AS `tipo_usuario`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vmascota`
--

DROP TABLE IF EXISTS `vmascota`;
/*!50001 DROP VIEW IF EXISTS `vmascota`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vmascota` AS SELECT 
 1 AS `idMascota`,
 1 AS `propietario`,
 1 AS `nombre`,
 1 AS `especie`,
 1 AS `raza`,
 1 AS `edad`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vproietariosmascota`
--

DROP TABLE IF EXISTS `vproietariosmascota`;
/*!50001 DROP VIEW IF EXISTS `vproietariosmascota`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vproietariosmascota` AS SELECT 
 1 AS `id`,
 1 AS `propietario`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'veterinaria_bd'
--
/*!50003 DROP PROCEDURE IF EXISTS `BuscarUsuariosPorNombre` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `BuscarUsuariosPorNombre`(IN patron VARCHAR(100))
BEGIN
    SELECT * FROM usuarios 
    WHERE nombre LIKE CONCAT('%', patron, '%')
    ORDER BY nombre;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `ObtenerEstadisticasUsuarios` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `ObtenerEstadisticasUsuarios`()
BEGIN
    SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as usuarios_ultima_semana,
        COUNT(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as usuarios_ultimo_mes,
        MIN(fecha_creacion) as primer_registro,
        MAX(fecha_creacion) as ultimo_registro
    FROM usuarios;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_cancelar_cita` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancelar_cita`(
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_confirmar_reserva_y_crear_cita` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_confirmar_reserva_y_crear_cita`(
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_crear_usuario_y_propietario` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_crear_usuario_y_propietario`(
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_eliminar_propietario` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_eliminar_propietario`(
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reservar_cita_temporal` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_reservar_cita_temporal`(
    IN p_usuarioId INT,
    IN p_mascotaId INT,
    IN p_fecha_inicio DATETIME,
    IN p_fecha_fin DATETIME,
    IN p_timeout_minutos INT
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_fecha_expiracion DATETIME;

    -- Variables de horario laboral (ajustables en futuro)
    DECLARE v_hora_inicio TIME DEFAULT '09:00:00';
    DECLARE v_hora_fin TIME DEFAULT '17:00:00';

    -- Aislamiento fuerte
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    START TRANSACTION;

    -- Limpiar reservas expiradas
    DELETE FROM cita_reservas
    WHERE fecha_expiracion <= NOW();

    -- 1 Validar rango correcto
    IF p_fecha_inicio >= p_fecha_fin THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Rango de fecha inválido';
    END IF;

    -- 2 Validar que no cruce de día
    IF DATE(p_fecha_inicio) <> DATE(p_fecha_fin) THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se permiten reservas que crucen de día';
    END IF;

    -- 3 Validar horario laboral
    IF TIME(p_fecha_inicio) < v_hora_inicio
       OR TIME(p_fecha_fin) > v_hora_fin THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Fuera de horario laboral';
    END IF;

    -- 4 Validar solapamiento contra citas activas (P, F)
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

    -- 5 Validar solapamiento contra reservas activas
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

    -- 6 Validar que la mascota no tenga cita (P,F) ese mismo día
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

    -- 7 Validar que la mascota no tenga reserva activa ese día
    SELECT COUNT(*) INTO v_existe
    FROM cita_reservas
    WHERE mascotaId = p_mascotaId
      AND fecha_expiracion > NOW()
      AND DATE(fecha_inicio) = DATE(p_fecha_inicio)
    FOR UPDATE;

    IF v_existe > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La mascota ya tiene una reserva activa ese día';
    END IF;

    -- 8 Calcular expiración
    SET v_fecha_expiracion = DATE_ADD(NOW(), INTERVAL p_timeout_minutos MINUTE);

    -- 9 Insertar reserva
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

    -- Devolver idReserva
    SELECT LAST_INSERT_ID() AS idReserva;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_sincronizar_correo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_sincronizar_correo`(
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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vhistorial_medico`
--

/*!50001 DROP VIEW IF EXISTS `vhistorial_medico`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vhistorial_medico` AS select `hm`.`idHistorial` AS `idHistorial`,concat('(',`m`.`idMascota`,') ',`m`.`Nombre`) AS `Mascota`,`hm`.`FechaAtencion` AS `FechaAtencion`,`hm`.`Motivo` AS `Motivo`,`hm`.`Diagnostico` AS `Diagnostico` from (`historial_medico` `hm` join `mascota` `m` on((`hm`.`Mascota` = `m`.`idMascota`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_usuarios`
--

/*!50001 DROP VIEW IF EXISTS `vista_usuarios`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_usuarios` AS select `usuarios`.`id` AS `id`,`usuarios`.`nombre` AS `nombre`,`usuarios`.`email` AS `email`,`usuarios`.`telefono` AS `telefono`,date_format(`usuarios`.`fecha_creacion`,'%d/%m/%Y %H:%i') AS `fecha_creacion_formato`,date_format(`usuarios`.`fecha_actualizacion`,'%d/%m/%Y %H:%i') AS `fecha_actualizacion_formato`,(to_days(now()) - to_days(`usuarios`.`fecha_creacion`)) AS `dias_desde_registro`,(case `usuarios`.`tipo_Usuario` when 'A' then 'Administrador' when 'C' then 'Cliente' end) AS `tipo_usuario` from `usuarios` order by `usuarios`.`fecha_creacion` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vmascota`
--

/*!50001 DROP VIEW IF EXISTS `vmascota`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vmascota` AS select `m`.`idMascota` AS `idMascota`,concat(`p`.`Nombre`,' ',`p`.`Apellidos`,' (',`p`.`Cedula`,')') AS `propietario`,`m`.`Nombre` AS `nombre`,`m`.`Especie` AS `especie`,`m`.`Raza` AS `raza`,`m`.`Edad` AS `edad` from (`mascota` `m` join `propietario` `p` on((`m`.`Propietario` = `p`.`idPropietario`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vproietariosmascota`
--

/*!50001 DROP VIEW IF EXISTS `vproietariosmascota`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vproietariosmascota` AS select `p`.`idPropietario` AS `id`,concat(`p`.`Nombre`,' ',`p`.`Apellidos`,' (',`p`.`Cedula`,')') AS `propietario` from `propietario` `p` group by `p`.`idPropietario`,`p`.`Nombre`,`p`.`Apellidos`,`p`.`Cedula` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-20 23:38:12
