CREATE DATABASE  IF NOT EXISTS `calendar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `calendar`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: calendar
-- ------------------------------------------------------
-- Server version	8.0.41

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
-- Table structure for table `event_type`
--

DROP TABLE IF EXISTS `event_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_type` (
  `eid` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `duration_time` int NOT NULL DEFAULT '1',
  `duration_unit` enum('minutes','hours') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'hours',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `type` enum('one-on-one','group') COLLATE utf8mb4_general_ci NOT NULL,
  `max_invitees` int DEFAULT '1',
  `location` enum('phone','in person','zoom') COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`eid`),
  KEY `uid` (`uid`),
  CONSTRAINT `event_type_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `user` (`uid`) ON DELETE CASCADE,
  CONSTRAINT `event_type_chk_1` CHECK ((`max_invitees` > 0)),
  CONSTRAINT `event_type_chk_2` CHECK ((`duration_time` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_type`
--

LOCK TABLES `event_type` WRITE;
/*!40000 ALTER TABLE `event_type` DISABLE KEYS */;
INSERT INTO `event_type` VALUES (13,19,'e1',40,'minutes',1,'group',2,'phone'),(17,24,'e2',30,'minutes',1,'group',3,'in person'),(18,24,'e1',1,'minutes',1,'one-on-one',1,'phone'),(22,34,'event 6 ?',45,'minutes',0,'group',4,'zoom'),(23,32,'zoom event',30,'minutes',1,'one-on-one',1,'phone'),(24,32,'test?',30,'minutes',1,'group',3,'phone'),(29,34,'test?',1,'hours',1,'one-on-one',1,'phone'),(30,40,'test?',30,'minutes',1,'group',5,'in person');
/*!40000 ALTER TABLE `event_type` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-06 11:24:54
