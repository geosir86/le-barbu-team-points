-- Add sort_order column to events_settings table
ALTER TABLE events_settings ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add event_type_id foreign key column to employee_events table
ALTER TABLE employee_events ADD COLUMN event_type_id UUID REFERENCES events_settings(id);

-- Update existing events_settings to have proper sort_order values
-- Positive events get lower sort_order (appear first)
UPDATE events_settings 
SET sort_order = 
  CASE 
    WHEN event_type = 'positive' THEN ROW_NUMBER() OVER (PARTITION BY event_type ORDER BY name)
    WHEN event_type = 'negative' THEN 100 + ROW_NUMBER() OVER (PARTITION BY event_type ORDER BY name)
  END;

-- Create index for better performance on sort_order
CREATE INDEX idx_events_settings_sort_order ON events_settings(sort_order);
CREATE INDEX idx_employee_events_event_type_id ON employee_events(event_type_id);