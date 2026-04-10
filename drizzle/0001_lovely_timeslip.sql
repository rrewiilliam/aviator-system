CREATE TABLE `gameRounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`multiplier` varchar(10) NOT NULL,
	`serverSeedHash` varchar(128),
	`clientSeed` varchar(128),
	`nonce` int,
	`roundTimestamp` timestamp NOT NULL,
	`isVerified` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameRounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patternLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patternType` enum('rainbow','double','hotStreak','coldStreak','consecutive_sub2x') NOT NULL,
	`description` text,
	`roundCount` int,
	`confidence` varchar(10) DEFAULT '0',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patternLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('threshold','streak','pattern') NOT NULL,
	`threshold` varchar(10),
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userStrategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyType` enum('martingale','antiMartingale','fixedCashout') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`initialBet` varchar(20) NOT NULL,
	`parameters` text,
	`profitLoss` varchar(20) DEFAULT '0',
	`roundsSimulated` int DEFAULT 0,
	`winRate` varchar(10) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStrategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `gameRounds` ADD CONSTRAINT `gameRounds_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patternLogs` ADD CONSTRAINT `patternLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAlerts` ADD CONSTRAINT `userAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userStrategies` ADD CONSTRAINT `userStrategies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;