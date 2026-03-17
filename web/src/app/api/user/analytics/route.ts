import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleError } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabase';

// GET user analytics data
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Type guard to check if user is NextResponse (error case)
    if (user instanceof NextResponse) {
      return user;
    }

    // Fetch user's drafts with recording data
    const { data: drafts, error: draftsError } = await supabase
      .from('drafts')
      .select('id, created_at, recording_duration, word_count, tags')
      .eq('user_id', user.id);

    if (draftsError) {
      return handleError(draftsError);
    }

    // Calculate analytics
    const totalDrafts = drafts?.length || 0;
    const totalWords = drafts?.reduce((sum, d) => sum + (d.word_count || 0), 0) || 0;
    const totalRecordings = drafts?.filter(d => d.recording_duration && d.recording_duration > 0).length || 0;
    const totalRecordingTime = drafts?.reduce((sum, d) => sum + (d.recording_duration || 0), 0) || 0;

    // Calculate top tags
    const tagCounts = new Map<string, number>();
    drafts?.forEach(draft => {
      if (draft.tags && Array.isArray(draft.tags)) {
        draft.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    const tagColors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
    ];

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        count,
        color: tagColors[index % tagColors.length],
      }));

    // Calculate recent activity (last 7 days)
    const recentActivity: { type: string; count: number; date: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayDrafts = drafts?.filter(d => {
        const draftDate = new Date(d.created_at);
        return draftDate >= dayStart && draftDate <= dayEnd;
      }) || [];

      if (dayDrafts.length > 0) {
        const recordingsCount = dayDrafts.filter(d => d.recording_duration && d.recording_duration > 0).length;
        const publishedCount = dayDrafts.filter(d => d.status === 'published').length;

        if (recordingsCount > 0) {
          recentActivity.push({ type: 'recording', count: recordingsCount, date: dateStr });
        }
        if (dayDrafts.filter(d => d.status === 'draft').length > 0) {
          recentActivity.push({ type: 'draft_created', count: dayDrafts.filter(d => d.status === 'draft').length, date: dateStr });
        }
        if (publishedCount > 0) {
          recentActivity.push({ type: 'draft_published', count: publishedCount, date: dateStr });
        }
      }
    }

    const analytics = {
      totalDrafts,
      totalWords,
      totalRecordings,
      totalRecordingTime,
      topTags,
      recentActivity,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    return handleError(error);
  }
}
