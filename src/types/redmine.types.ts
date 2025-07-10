export interface UserRef {
  id: number;
  name: string;
}

export interface JournalDetail {
  property: string;       // e.g., "attr"
  name: string;           // e.g., "status_id"
  old_value?: string;
  new_value?: string;
}

export interface Journal {
  id: number;
  user: UserRef;
  notes: string;
  created_on: string;            // ISO date string
  details: JournalDetail[];
}

export interface CustomField {
  id: number;
  name: string;
  value: any;
}

export interface IssueRef {
  id: number;
}

export interface Issue {
  id: number;
  project: UserRef;
  tracker: UserRef;
  status: UserRef;
  priority: UserRef;
  author: UserRef;
  assigned_to: UserRef;
  parent?: IssueRef;
  subject: string;
  description: string;
  start_date: string | null;
  due_date: string | null;
  created_on: string;
  updated_on: string;
  closed_on: string | null;
  done_ratio: number;
  estimated_hours: number;
  total_estimated_hours?: number;
  spent_hours: number;
  total_spent_hours?: number;
  is_private: boolean;
  custom_fields: CustomField[];
  journals: Journal[];
}

export interface RedmineIssueResponse {
  issue: Issue;
}
