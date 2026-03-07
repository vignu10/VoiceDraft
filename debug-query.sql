-- Check the complete published post data with all relationships
SELECT
  p.id,
  p.title,
  p.slug,
  LEFT(p.content, 100) as content_preview,
  p.content IS NOT NULL as has_content,
  p.excerpt,
  p.status,
  p.published_at,
  p.meta_description,
  p.target_keyword,
  p.word_count,
  p.reading_time_minutes,
  p.view_count,
  p.audio_file_url,
  p.audio_duration_seconds,
  p.style_used,
  j.id as journal_id,
  j.url_prefix,
  j.display_name as journal_name,
  j.auth_user_id,
  up.full_name,
  up.avatar_url,
  up.bio
FROM posts p
JOIN journals j ON j.id = p.journal_id
LEFT JOIN user_profiles up ON up.auth_user_id = j.auth_user_id
WHERE p.slug IS NOT NULL
LIMIT 5;
