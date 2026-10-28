ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'EDITOR', 'TEAM_MANAGER') NOT NULL DEFAULT 'EDITOR';
ALTER TABLE `match_events` MODIFY `type` ENUM('goal', 'own_goal', 'penalty', 'yellow', 'red', 'substitution', 'shot', 'shot_on_target', 'shot_off_target', 'save', 'position') NOT NULL;
ALTER TABLE `match_events` ADD COLUMN `x` DOUBLE NULL, ADD COLUMN `y` DOUBLE NULL;
ALTER TABLE `teams` ADD COLUMN `manager_user_id` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `teams_manager_user_id_key` ON `teams`(`manager_user_id`);
ALTER TABLE `teams` ADD CONSTRAINT `teams_manager_user_id_fkey` FOREIGN KEY (`manager_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
