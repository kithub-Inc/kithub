DROP DATABASE IF EXISTS `kithub-inc`;
CREATE DATABASE `kithub-inc` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `kithub-inc`;


CREATE TABLE `users` (
    `node_id` INT AUTO_INCREMENT,

    `user_email` VARCHAR(255),
    `user_name` VARCHAR(25) UNIQUE,
    `user_password` TEXT,
    `user_bio` VARCHAR(150),
    `avatar_src` VARCHAR(150),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`, `user_email`)
);
CREATE INDEX `users_index` ON `users` (`node_id`, `user_email`);

CREATE TABLE `user_device` (
    `node_id` INT AUTO_INCREMENT,

    `user_email` VARCHAR(255),

    `device_agent` TEXT,

    `updated_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`, `user_email`)
);
CREATE INDEX `user_device_index` ON `user_device` (`node_id`, `user_email`);

CREATE TABLE `otps` (
    `node_id` INT AUTO_INCREMENT,

    `user_email` VARCHAR(255),
    `code` VARCHAR(4),

    PRIMARY KEY (`node_id`, `user_email`)
);
CREATE INDEX `otps_index` ON `otps` (`user_email`, `code`);


CREATE TABLE `repositories` (
    `node_id` INT AUTO_INCREMENT,

    `user_email` VARCHAR(255),

    `repo_type` VARCHAR(20),
    `repo_name` VARCHAR(20),
    `repo_description` VARCHAR(100),
    `repo_category` VARCHAR(70),
    `repo_subcategory` VARCHAR(70),
    `repo_visibility` BOOLEAN,
    `repo_archive` BOOLEAN,
    `repo_license` VARCHAR(100),
    `image_src` VARCHAR(500),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repositories_index` ON `repositories` (`node_id`, `repo_name`, `repo_category`);

CREATE TABLE `repository_branch` (
    `node_id` INT AUTO_INCREMENT,

    `repo_id` INT,

    `branch_name` VARCHAR(15),
    `branch_src` VARCHAR(500),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`, `branch_name`)
);
CREATE INDEX `repository_branch_index` ON `repository_branch` (`node_id`, `branch_name`, `repo_id`);

CREATE TABLE `repository_branch_commit` (
    `node_id` INT AUTO_INCREMENT,

    `branch_id` INT,

    `commit_src` VARCHAR(500),
    `commit_message` VARCHAR(50),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repository_branch_commit_index` ON `repository_branch_commit` (`node_id`, `branch_id`);

CREATE TABLE `repository_authorities` (
    `node_id` INT AUTO_INCREMENT,

    `repo_id` INT,

    `authority_type` VARCHAR(20),
    `target_email` VARCHAR(255),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repository_authorities_index` ON `repository_authorities` (`repo_id`);

CREATE TABLE `repository_issue` (
    `node_id` INT AUTO_INCREMENT,
    
    `repo_id` INT,

    `user_email` VARCHAR(255),
    
    `issue_title` VARCHAR(100),
    `issue_content` TEXT,
    `issue_status` VARCHAR(20),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repository_issue_index` ON `repository_issue` (`node_id`, `issue_title`, `repo_id`);

DROP TABLE IF EXISTS `repository_issue_comment`;
CREATE TABLE `repository_issue_comment` (
    `node_id` INT AUTO_INCREMENT,
    
    `issue_id` INT,

    `user_email` VARCHAR(255),
    
    `comment_type` VARCHAR(50),
    `comment_target_id` INT,
    `comment_content` TEXT,

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repository_issue_comment_index` ON `repository_issue_comment` (`issue_id`);

CREATE TABLE `repository_star` (
    `node_id` INT AUTO_INCREMENT,
    
    `repo_id` INT,

    `user_email` VARCHAR(255),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repository_star_index` ON `repository_star` (`repo_id`, `user_email`);

CREATE TABLE `repository_issue_comment_heart` (
    `node_id` INT AUTO_INCREMENT,
    
    `comment_id` INT,

    `user_email` VARCHAR(255),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repository_issue_comment_heart_index` ON `repository_issue_comment_heart` (`comment_id`, `user_email`);

-- DROP TABLE repository_pullrequest;
CREATE TABLE `repository_pullrequest` (
    `node_id` INT AUTO_INCREMENT,

    `repo_id` INT,
    `target_repo_id` INT,

    `user_email` VARCHAR(255),

    `pr_status` VARCHAR(15),
    `branch_name` VARCHAR(15),
    `target_branch_name` VARCHAR(15),
    `commit_id` INT,
    `pr_title` VARCHAR(100),
    `pr_content` TEXT,

    `created_at` DATETIME DEFAULT NOW(),
    PRIMARY KEY (`node_id`)
);
CREATE INDEX `repository_pullrequest_index` ON `repository_pullrequest` (`node_id`, `repo_id`);


CREATE TABLE `user_alert` (
    `node_id` INT AUTO_INCREMENT,

    `user_email` VARCHAR(255),

    `alert_read` BOOLEAN,
    `alert_link` TEXT,
    `alert_title` VARCHAR(100),
    `alert_content` VARCHAR(100),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `user_alert_index` ON `user_alert` (`user_email`);

CREATE TABLE `user_follow` (
    `node_id` INT AUTO_INCREMENT,

    `user_email` VARCHAR(255),
    `target_email` VARCHAR(255),

    `created_at` DATETIME DEFAULT NOW(),

    PRIMARY KEY (`node_id`)
);
CREATE INDEX `user_follow_index` ON `user_follow` (`user_email`, `target_email`);
DELETE FROM `user_follow` WHERE 1;


INSERT INTO `users` (`user_email`, `user_name`, `user_password`, `user_bio`)
VALUES ("ice1github@gmail.com", "고서온", "ebfbe675b88f8b8e995b19ea93da66bba62ae67d7f07c22e9ccdd44b19de9a7b0e20d6ee212205a8708eb4eb53fc679b5bc4ee494b7fd33ce11dd67e9e12dd05", "Node.js Express, React **Master**");

-- INSERT INTO `user_device` (`user_email`, `device_agent`) VALUES ("ice1github@gmail.com", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36");
-- SELECT * FROM `user_device`;
-- SELECT * FROM `repository_authorities` WHERE `repo_id` = 3;
-- SELECT * FROM `user_follow`;
-- INSERT INTO `user_alert` (`user_email`, `alert_read`, `alert_title`, `alert_content`, `alert_link`, `created_at`) VALUES ("ice1github@gmail.com", 0, "환영", "하빈다 ㅉㅈㅈㅈ", "/", "2024-09-20 14:32:09");

SELECT * FROM repository_branch_commit;
-- SELECT * FROM repositories ORDER BY created_at DESC;

-- INSERT INTO repository_pullrequest (repo_id, target_repo_id, user_email, pr_status, branch_name, target_branch_name, commit_id, pr_title, pr_content) VALUES (17, 9, "ice1github@gmail.com", "대기", "main", "main", 58, "[fixed] docs update@ 2.x -> 3", "2.x 버전에서 3버전으로 업그레이드 시킵니다.")