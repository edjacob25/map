CREATE TABLE IF NOT EXISTS location (lat REAL, lon REAL, date TEXT, date_jp TEXT);

CREATE INDEX IF NOT EXISTS idx_jp_dt ON location (date_jp);

CREATE TABLE IF NOT EXISTS trip (name TEXT, start_date TEXT, end_date TEXT);

INSERT INTO
  trip
VALUES
  ("Spring 23", "2023-03-08", "2023-03-22");

INSERT INTO
  trip
VALUES
  ("Fall 23", "2023-10-28", "2023-11-13");

INSERT INTO
  trip
VALUES
  ("Fall 24", "2024-10-30", "2024-11-15");

INSERT INTO
  trip
VALUES
  ("Winter 26", "2026-01-28", "2026-02-14");
