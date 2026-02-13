export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: UserProfile | null;
  journal: Journal | null;
}

export interface UserProfile {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Journal {
  id: string;
  auth_user_id: string;
  url_prefix: string;
  display_name: string;
  description?: string;
  styles: Style[];
}

export interface Style {
  name: string;
  user_prompt_template: string;
  tone: string;
  length: string;
  is_active: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}
