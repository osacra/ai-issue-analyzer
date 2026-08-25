CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`category` varchar(80) NOT NULL,
	`priority` enum('low','medium','high','critical') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`area` varchar(120) NOT NULL,
	`summary` text NOT NULL,
	`possibleCause` text NOT NULL,
	`suggestedSolution` text NOT NULL,
	`suggestedTests` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','analyzed','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`)
);
