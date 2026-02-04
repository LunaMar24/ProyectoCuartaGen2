-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: veterinaria_bd
-- ------------------------------------------------------
-- Server version	9.3.0

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
-- Table structure for table `historial_medico`
--

DROP TABLE IF EXISTS `historial_medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_medico` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `Mascota` int NOT NULL,
  `FechaAtencion` datetime NOT NULL,
  `Motivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Diagnostico` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `Nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Especie` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Raza` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Edad` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `Nombre` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Cedula` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`idPropietario`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `propietario`
--

LOCK TABLES `propietario` WRITE;
/*!40000 ALTER TABLE `propietario` DISABLE KEYS */;
INSERT INTO `propietario` VALUES (2,'Marcela','Jiménez','6-0291-0060','83641655','marcelamja@gmail.com'),(3,'Daniela','Rojas Morales','0101234561','87123456','daniela.rojas1@gmail.com'),(5,'Sofia','Vargas Jimenez','0101234563','70111222','sofia.vargas@mail.com'),(7,'Maria','Fernandez Soto','0101234565','60012345','maria.fernandez@empresa.com'),(8,'Laura Maria','Ramirez Quesada','0101234566','71122334','lauraramirez@gmail.com'),(9,'Paula','Navarro Chaves','0101234567','83004567','paula.navarro@mail.com'),(10,'Diego','Solis Arias','0101234568','84001234','diego.solis@example.com'),(11,'Valeria','Campos Mora','0101234569','85007890','valeria.campos@outlook.com'),(12,'Ricardo','Pineda Rojas','0101234570','86123456','ricardo.pineda@empresa.com'),(13,'Laura','Jimenez Sequeira','0101234571','87001234','laura.jimenez@mail.com'),(14,'Esteban','Brenes Marin','0101234572','88997766','esteban.brenes@gmail.com'),(15,'Andres','valverde','29460044','65981245','andres.val@ejemplo.com'),(16,'viviana','valverde','208620070','25649832','viviana.valverde@ejemplo.com');
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
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre completo del usuario',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email único del usuario',
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Número de teléfono del usuario',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contraseña hasheada del usuario',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha y hora de última actualización',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  KEY `idx_nombre_email` (`nombre`,`email`),
  KEY `idx_fecha_actualizacion` (`fecha_actualizacion`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para almacenar información de usuarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Juan Pérez Gonzalez','juan.perez@ejemplo.com','+52 55 1234-5678','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-04 06:38:20'),(2,'María García','maria.garcia@ejemplo.com','+52 55 2345-6789','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-04 06:38:20'),(4,'Ana Martínez','ana.martinez@ejemplo.com','+52 55 4567-8901','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-04 06:38:20'),(5,'Luis Rodríguez','luis.rodriguez@ejemplo.com','+52 55 5678-9012','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-04 06:38:20'),(6,'Elena Fernández','elena.fernandez@ejemplo.com','+52 55 6789-0123','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-04 06:38:20'),(8,'Patricia Ruiz','patricia.ruiz@ejemplo.com','+52 55 8901-2345','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-04 06:38:20'),(9,'Roberto Jiménez','roberto.jimenez@ejemplo.com','+52 55 9012-3456','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-02 22:43:28','2026-02-04 06:38:20'),(11,'Eladio Valverde','eladiovch@gmail.com','83641656','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-03 02:08:54','2026-02-04 06:38:20'),(13,'Andres Valverde','andres.valverde@ejemplo.com','52364256','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-03 20:04:43','2026-02-04 06:38:20'),(14,'Valeria medina','valeria.medina@ejempol.com','23568945','$2a$12$aLWq3PLK1wTIHXqvEQAdLOTLDD1tn3I36lvbGTpRqWklgliBXNjoC','2025-11-03 20:44:21','2026-02-04 06:38:20');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

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
 1 AS `dias_desde_registro`*/;
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
/*!50001 VIEW `vista_usuarios` AS select `usuarios`.`id` AS `id`,`usuarios`.`nombre` AS `nombre`,`usuarios`.`email` AS `email`,`usuarios`.`telefono` AS `telefono`,date_format(`usuarios`.`fecha_creacion`,'%d/%m/%Y %H:%i') AS `fecha_creacion_formato`,date_format(`usuarios`.`fecha_actualizacion`,'%d/%m/%Y %H:%i') AS `fecha_actualizacion_formato`,(to_days(now()) - to_days(`usuarios`.`fecha_creacion`)) AS `dias_desde_registro` from `usuarios` order by `usuarios`.`fecha_creacion` desc */;
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

-- Dump completed on 2026-02-04  0:40:13
