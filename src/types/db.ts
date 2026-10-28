export type PublicationStatus = 'draft' | 'published' | 'archived';
export interface NewsRow {
  id: string; image_url: string | null; category: string; title: string; slug: string; excerpt: string | null;
  content: string; external_url: string | null; status: PublicationStatus; published_at: string | null; is_pinned: boolean; pinned_at: string | null;
  created_at: string; updated_at: string;
}
export interface EventRow {
  id: string; image_url: string | null; title: string; slug: string; category: string; game_type: string; start_date: string;
  end_date: string | null; venue: string | null; description: string; result_url: string | null; teacher_certificate_url: string | null;
  student_certificate_url: string | null; competition_status: string; publication_status: PublicationStatus; published_at: string | null; is_pinned: boolean; pinned_at: string | null;
}
export interface RankingRow {
  athlete_id: string; full_name: string; school_name: string | null; province: string | null; game_type: string;
  rating_value: number; effective_date: string; rating_period: string | null; rank: number;
}
export interface FaqRow { id: string; question: string; answer: string; game_type: string | null; sort_order: number; status: PublicationStatus; created_at: string; updated_at: string }
