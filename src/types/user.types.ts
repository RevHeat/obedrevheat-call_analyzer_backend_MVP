export type UserAttributes = {
  id: string;

  auth0_user_id: string | null;
  email: string;
  password_hash: string;

  email_verified: boolean;
  full_name: string | null;
  avatar_url: string | null;
  last_seen_at: Date | null;

  created_at?: Date;
  updated_at?: Date;
};

export type UserCreationAttributes = {
  id?: string;

  auth0_user_id?: string | null;
  email: string;
  password_hash: string;

  email_verified?: boolean;
  full_name?: string | null;
  avatar_url?: string | null;
  last_seen_at?: Date | null;


  created_at?: Date;
  updated_at?: Date;
};
