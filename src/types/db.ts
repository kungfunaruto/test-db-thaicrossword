export type NewsStatus = 'draft' | 'published';
export type NewsCategory = 'general' | 'competition';
export interface NewsCardRow {
  id: string; images: string[]; category: NewsCategory; title: string; title_en: string | null; excerpt: string | null; excerpt_en: string | null;
  published_at: string | null; is_pinned: boolean; created_at: string;
}
export interface NewsRow extends NewsCardRow { content: string; content_en: string | null; external_url: string | null; updated_at: string }

export type CompetitionStatus = 'open' | 'closed' | 'ended';
export interface EventCardRow {
  id: string; images: string[]; title: string; title_en: string | null; games: string[]; start_date: string; end_date: string | null;
  registration_deadline: string | null; reg_close: string; last_date: string; venue: string | null; venue_en: string | null; is_pinned: boolean; created_at: string;
}
export interface EventRow extends EventCardRow {
  description: string; description_en: string | null; result_url: string | null; teacher_certificate_url: string | null; student_certificate_url: string | null; updated_at: string;
}
export interface Revision { id: string; note: string; note_en: string | null; edited_at: string }
export interface RankingRow {
  athlete_id: string; full_name: string; full_name_en: string | null; photo_url: string | null; game_type: string;
  rating_value: number; effective_date: string; rank: number;
}
export interface FaqRow { id: string; question: string; question_en: string | null; answer: string; answer_en: string | null; game_type: string | null; created_at: string }
