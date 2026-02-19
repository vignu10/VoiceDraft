export interface Journal {
  id: string;
  auth_user_id: string;
  url_prefix: string;
  display_name: string;
  description?: string;
  styles: Style[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Style {
  name: string;
  user_prompt_template: string;
  tone: string;
  length: string;
  is_active: boolean;
}

export interface CreateJournalData {
  display_name?: string;
  description?: string;
  url_prefix?: string;
}

export interface UpdateJournalData {
  display_name?: string;
  description?: string;
  url_prefix?: string;
}

export interface UpdateStylesData {
  styles: Style[];
}
