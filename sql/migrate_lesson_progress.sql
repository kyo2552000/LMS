-- Migration to align lesson_progress with LMS progress tracking
-- Compatible with older MySQL versions

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lesson_progress'
    AND COLUMN_NAME = 'watch_percent'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE lesson_progress ADD COLUMN watch_percent DECIMAL(5, 2) DEFAULT 0 AFTER watch_time',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lesson_progress'
    AND COLUMN_NAME = 'last_position'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE lesson_progress ADD COLUMN last_position INT DEFAULT 0 AFTER watch_percent',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE lesson_progress
SET watch_percent = COALESCE(watch_percent, 0),
    last_position = COALESCE(last_position, 0);
