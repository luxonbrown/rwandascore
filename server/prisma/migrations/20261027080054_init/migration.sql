-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stadiums` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `stadiums_name_city_key`(`name`, `city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `short_name` VARCHAR(191) NOT NULL,
    `initials` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `stadium_id` VARCHAR(191) NULL,
    `founded` INTEGER NULL,
    `nickname` VARCHAR(191) NULL,
    `coach` VARCHAR(191) NULL,
    `primary_color` VARCHAR(191) NOT NULL DEFAULT '#FF6B00',
    `secondary_color` VARCHAR(191) NOT NULL DEFAULT '#121212',
    `logo_url` VARCHAR(191) NULL,
    `is_national` BOOLEAN NOT NULL DEFAULT false,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teams_name_key`(`name`),
    UNIQUE INDEX `teams_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `short_name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'Rwanda',
    `type` ENUM('league', 'cup', 'national') NOT NULL DEFAULT 'league',
    `logo_url` VARCHAR(191) NULL,
    `primary_color` VARCHAR(191) NOT NULL DEFAULT '#FF6B00',
    `secondary_color` VARCHAR(191) NOT NULL DEFAULT '#121212',
    `description` TEXT NULL,
    `team_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `competitions_name_key`(`name`),
    UNIQUE INDEX `competitions_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seasons` (
    `id` VARCHAR(191) NOT NULL,
    `competition_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `is_current` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `seasons_competition_id_idx`(`competition_id`),
    UNIQUE INDEX `seasons_competition_id_name_key`(`competition_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `players` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NULL,
    `position` ENUM('GK', 'DF', 'MF', 'FW') NOT NULL DEFAULT 'MF',
    `number` INTEGER NULL,
    `nationality` VARCHAR(191) NOT NULL DEFAULT 'Rwanda',
    `date_of_birth` DATETIME(3) NULL,
    `height` INTEGER NULL,
    `foot` VARCHAR(191) NULL DEFAULT 'Right',
    `photo_url` VARCHAR(191) NULL,
    `is_national_team` BOOLEAN NOT NULL DEFAULT false,
    `bio` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `players_slug_key`(`slug`),
    INDEX `players_team_id_idx`(`team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `competition_id` VARCHAR(191) NOT NULL,
    `season_id` VARCHAR(191) NOT NULL,
    `home_team_id` VARCHAR(191) NOT NULL,
    `away_team_id` VARCHAR(191) NOT NULL,
    `kickoff_at` DATETIME(3) NOT NULL,
    `status` ENUM('scheduled', 'live', 'ht', 'ft', 'postponed') NOT NULL DEFAULT 'scheduled',
    `minute` INTEGER NOT NULL DEFAULT 0,
    `home_score` INTEGER NOT NULL DEFAULT 0,
    `away_score` INTEGER NOT NULL DEFAULT 0,
    `round` VARCHAR(191) NULL,
    `venue` VARCHAR(191) NULL,
    `stadium_id` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `referee` VARCHAR(191) NULL,
    `attendance` INTEGER NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `matches_status_idx`(`status`),
    INDEX `matches_kickoff_at_idx`(`kickoff_at`),
    INDEX `matches_competition_id_idx`(`competition_id`),
    INDEX `matches_season_id_idx`(`season_id`),
    INDEX `matches_home_team_id_idx`(`home_team_id`),
    INDEX `matches_away_team_id_idx`(`away_team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_events` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NULL,
    `player_id` VARCHAR(191) NULL,
    `related_player_id` VARCHAR(191) NULL,
    `type` ENUM('goal', 'own_goal', 'penalty', 'yellow', 'red', 'substitution') NOT NULL,
    `minute` INTEGER NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `match_events_match_id_idx`(`match_id`),
    INDEX `match_events_player_id_idx`(`player_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `standings` (
    `id` VARCHAR(191) NOT NULL,
    `season_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `played` INTEGER NOT NULL DEFAULT 0,
    `won` INTEGER NOT NULL DEFAULT 0,
    `drawn` INTEGER NOT NULL DEFAULT 0,
    `lost` INTEGER NOT NULL DEFAULT 0,
    `goals_for` INTEGER NOT NULL DEFAULT 0,
    `goals_against` INTEGER NOT NULL DEFAULT 0,
    `points` INTEGER NOT NULL DEFAULT 0,
    `position` INTEGER NOT NULL,
    `form` VARCHAR(10) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `standings_season_id_position_idx`(`season_id`, `position`),
    UNIQUE INDEX `standings_season_id_team_id_key`(`season_id`, `team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NULL,
    `author_id` VARCHAR(191) NULL,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `news_slug_key`(`slug`),
    INDEX `news_status_published_at_idx`(`status`, `published_at`),
    INDEX `news_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `record_type` VARCHAR(191) NULL,
    `record_id` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `ip_address` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_user_id_idx`(`user_id`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    INDEX `activity_logs_module_idx`(`module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_stadium_id_fkey` FOREIGN KEY (`stadium_id`) REFERENCES `stadiums`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seasons` ADD CONSTRAINT `seasons_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `players` ADD CONSTRAINT `players_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_competition_id_fkey` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_home_team_id_fkey` FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_away_team_id_fkey` FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_stadium_id_fkey` FOREIGN KEY (`stadium_id`) REFERENCES `stadiums`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_events` ADD CONSTRAINT `match_events_related_player_id_fkey` FOREIGN KEY (`related_player_id`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `standings` ADD CONSTRAINT `standings_season_id_fkey` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `standings` ADD CONSTRAINT `standings_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
