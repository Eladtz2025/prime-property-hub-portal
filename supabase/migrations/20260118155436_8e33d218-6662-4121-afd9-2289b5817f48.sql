-- Function to get matches grouped by hour for a date range
CREATE OR REPLACE FUNCTION get_matches_by_hour(start_date DATE, end_date DATE)
RETURNS TABLE(hour_key TEXT, match_count BIGINT) AS $$
  SELECT 
    to_char(created_at AT TIME ZONE 'Asia/Jerusalem', 'YYYY-MM-DD-HH24') as hour_key,
    COALESCE(SUM(jsonb_array_length(matched_leads)), 0) as match_count
  FROM scouted_properties
  WHERE created_at >= start_date::TIMESTAMPTZ
    AND created_at < (end_date + 1)::TIMESTAMPTZ
    AND is_active = true
    AND matched_leads IS NOT NULL
    AND jsonb_array_length(matched_leads) > 0
  GROUP BY to_char(created_at AT TIME ZONE 'Asia/Jerusalem', 'YYYY-MM-DD-HH24');
$$ LANGUAGE SQL STABLE;