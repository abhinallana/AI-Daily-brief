export interface Article {
  title: string;
  link: string;
  published_at: string;
  summary?: string;
  source?: string;
  icon?: string;
  ai_summary?: string;
  category?: string;
  priority?: string;
  why_it_matters?: string;
  reading_time?: string;
  link_hash?: string;
}

export interface DailyReport {
  date: string;
  biggest_announcement: string;
  biggest_trend: string;
  one_thing_to_know: string;
  time_saved_minutes: number;
  articles: Article[];
}

const API_BASE_URL = "http://localhost:8000/api/v1";

export async function fetchTodayReport(): Promise<DailyReport> {
  const response = await fetch(`${API_BASE_URL}/reports/today`);
  if (!response.ok) {
    throw new Error(`Failed to fetch today's report: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRecentArticles(
  limit: number = 50,
  category?: string,
  priority?: string
): Promise<Article[]> {
  let url = `${API_BASE_URL}/articles?limit=${limit}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  if (priority) {
    url += `&priority=${encodeURIComponent(priority)}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`);
  }
  return response.json();
}
