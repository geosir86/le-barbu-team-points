-- Add sort_order column to events_settings table
ALTER TABLE events_settings ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add event_type_id foreign key column to employee_events table
ALTER TABLE employee_events ADD COLUMN event_type_id UUID REFERENCES events_settings(id);

-- Update existing events_settings with simple sort_order values
-- First update positive events (1, 2, 3, etc.)
UPDATE events_settings 
SET sort_order = 1 
WHERE event_type = 'positive' AND sort_order = 0;

UPDATE events_settings 
SET sort_order = 2 
WHERE event_type = 'positive' AND sort_order = 1 AND id != (
  SELECT id FROM events_settings 
  WHERE event_type = 'positive' AND sort_order = 1 
  LIMIT 1
);

-- Update negative events (101, 102, 103, etc.)
UPDATE events_settings 
SET sort_order = 101 
WHERE event_type = 'negative' AND sort_order = 0;

UPDATE events_settings 
SET sort_order = 102 
WHERE event_type = 'negative' AND sort_order = 101 AND id != (
  SELECT id FROM events_settings 
  WHERE event_type = 'negative' AND sort_order = 101 
  LIMIT 1
);

-- Create index for better performance
CREATE INDEX idx_events_settings_sort_order ON events_settings(sort_order);
CREATE INDEX idx_employee_events_event_type_id ON employee_events(event_type_id);