-- Datenbank-Struktur für SchulKonflikt Manager

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Tabellenstruktur für Tabelle `years`
--

CREATE TABLE IF NOT EXISTS `years` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tabellenstruktur für Tabelle `classes`
--

CREATE TABLE IF NOT EXISTS `classes` (
  `id` varchar(36) NOT NULL,
  `yearLevelId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `yearLevelId` (`yearLevelId`),
  CONSTRAINT `fk_classes_year` FOREIGN KEY (`yearLevelId`) REFERENCES `years` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tabellenstruktur für Tabelle `students`
--

CREATE TABLE IF NOT EXISTS `students` (
  `id` varchar(36) NOT NULL,
  `classId` varchar(36) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `classId` (`classId`),
  CONSTRAINT `fk_students_class` FOREIGN KEY (`classId`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tabellenstruktur für Tabelle `incidents`
--

CREATE TABLE IF NOT EXISTS `incidents` (
  `id` varchar(36) NOT NULL,
  `studentId` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `time` varchar(10) NOT NULL,
  `location` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `involvedPersons` text DEFAULT NULL,
  `witnesses` text DEFAULT NULL,
  `immediateActions` text DEFAULT NULL,
  `agreements` text DEFAULT NULL,
  `parentContacted` tinyint(1) NOT NULL DEFAULT 0,
  `socialServiceContacted` tinyint(1) NOT NULL DEFAULT 0,
  `socialServiceAbbreviation` varchar(10) DEFAULT NULL,
  `administrationContacted` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL,
  `createdAt` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `fk_incidents_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;