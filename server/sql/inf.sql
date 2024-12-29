DROP DATABASE IF EXISTS `inf`;
CREATE DATABASE `inf`;
USE `inf`;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `node_id` INT AUTO_INCREMENT,
    `user_email` VARCHAR(255),
    `user_name` VARCHAR(20),
    `user_password` TEXT,
    `user_bio` VARCHAR(500),
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`, `user_email`)
);
ALTER TABLE `user` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `user-index` ON `user` (`node_id`, `user_email`);

DROP TABLE IF EXISTS `code`;
CREATE TABLE `code` (
    `node_id` INT AUTO_INCREMENT,
    `user_email` VARCHAR(255),
    `user_name` VARCHAR(20),
    `user_password` TEXT,
    `code` VARCHAR(6),
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`)
);
ALTER TABLE `code` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `code-index` ON `code` (`node_id`, `user_email`, `code`);

DROP TABLE IF EXISTS `group`;
CREATE TABLE `group` (
    `node_id` INT AUTO_INCREMENT,
    `user_email` VARCHAR(255),
    `group_name` VARCHAR(20),
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`)
);
ALTER TABLE `group` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `group-index` ON `group` (`node_id`, `user_email`);

DROP TABLE IF EXISTS `repository`;
CREATE TABLE `repository` (
    `node_id` INT AUTO_INCREMENT,
    `user_email` VARCHAR(255),
    `group_id` INT,
    `repo_name` VARCHAR(20),
    `repo_description` VARCHAR(100),
    `repo_license` VARCHAR(50),
    `repo_path` TEXT,
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`)
);
ALTER TABLE `repository` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `repository-index` ON `repository` (`node_id`, `user_email`);

DROP TABLE IF EXISTS `branch`;
CREATE TABLE `branch` (
    `node_id` INT AUTO_INCREMENT,
    `user_email` VARCHAR(255),
    `repo_id` INT,
    `branch_name` VARCHAR(20),
    `branch_description` VARCHAR(100),
    `branch_path` TEXT,
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`)
);
ALTER TABLE `branch` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `branch-index` ON `branch` (`node_id`, `user_email`, `repo_id`);

DROP TABLE IF EXISTS `commit_group`;
CREATE TABLE `commit_group` (
    `node_id` INT AUTO_INCREMENT,
    `group_id` VARCHAR(10),
    `user_email` VARCHAR(255),
    `repo_id` INT,
    `branch_id` INT,
    `group_path` TEXT,
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`, `group_id`)
);
ALTER TABLE `commit_group` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `commit_group-index` ON `commit_group` (`node_id`, `group_id`, `user_email`);

DROP TABLE IF EXISTS `commit`;
CREATE TABLE `commit` (
    `node_id` INT AUTO_INCREMENT,
    `user_email` VARCHAR(255),
    `commit_name` VARCHAR(100),
    `commit_group_id` INT,
    `commit_path` TEXT,
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`)
);
ALTER TABLE `commit` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `commit-index` ON `commit` (`node_id`, `user_email`);

DROP TABLE IF EXISTS `event`;
CREATE TABLE `event` (
    `node_id` INT AUTO_INCREMENT,
    `user_email` VARCHAR(255),
    `event_name` VARCHAR(50),
    `event_description` TEXT,
    `type` VARCHAR(50),
    `content` JSON,
    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`)
);
ALTER TABLE `event` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `event-index` ON `event` (`node_id`, `user_email`);











SELECT * FROM `repository`;
SELECT * FROM `commit_group`;
