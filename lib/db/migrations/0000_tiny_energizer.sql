CREATE TABLE `derived_dates` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`run_id` text NOT NULL,
	`date_type` text NOT NULL,
	`label` text NOT NULL,
	`value` text,
	`status` text NOT NULL,
	`reason` text,
	`source_field_keys` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`filename` text NOT NULL,
	`title` text NOT NULL,
	`page_count` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_slug_unique` ON `documents` (`slug`);--> statement-breakpoint
CREATE TABLE `eval_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`prompt_version` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`field_accuracy` text,
	`date_accuracy` text
);
--> statement-breakpoint
CREATE TABLE `extractions` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`run_id` text NOT NULL,
	`prompt_version` text NOT NULL,
	`field_group` text NOT NULL,
	`field_key` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`evidence_text` text NOT NULL,
	`page_number` integer NOT NULL,
	`bounding_box` text,
	`confidence` real NOT NULL,
	`grounding_status` text NOT NULL,
	`verifier_status` text,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `gold_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`field_key` text NOT NULL,
	`expected_value` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gold_labels_document_id_field_key_unique` ON `gold_labels` (`document_id`,`field_key`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`document_id` text NOT NULL,
	`page_number` integer NOT NULL,
	`char_count` integer NOT NULL,
	`text_cache_path` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_document_id_page_number_unique` ON `pages` (`document_id`,`page_number`);--> statement-breakpoint
CREATE TABLE `risk_flags` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`run_id` text NOT NULL,
	`flag_type` text NOT NULL,
	`label` text NOT NULL,
	`present` integer NOT NULL,
	`status` text NOT NULL,
	`evidence_text` text,
	`page_number` integer,
	`source_field_key` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
