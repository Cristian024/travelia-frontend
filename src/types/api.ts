export type BudgetRange = "economic" | "moderate" | "luxury"

export type TravelPurpose =
  | "leisure"
  | "adventure"
  | "rest"
  | "business"
  | "cultural"
  | "gastronomic"
  | "romantic"
  | "family"

export type PlanningStatus = "in_progress" | "ready_to_generate" | "completed"

export type ItineraryStatus = "active" | "archived"

export type QuestionType =
  | "text"
  | "single_choice"
  | "multiple_choice"
  | "scale"
  | "date"
  | "number"

export type ReplacementStatus = "none" | "in_progress"

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type?: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  birth_date: string
  country_of_residence: string
  phone?: string | null
  preferred_language?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string
  birth_date: string
  country_of_residence: string
  phone: string | null
  preferred_language: string
  created_at: string
  updated_at: string
}

export interface UpdateUserRequest {
  full_name?: string | null
  birth_date?: string | null
  country_of_residence?: string | null
  phone?: string | null
  preferred_language?: string | null
}

export interface DynamicQuestion {
  question_id: string
  question_text: string
  question_type: QuestionType
  options?: string[] | null
  required?: boolean
}

export interface QuestionAnswer {
  question_id: string
  answer: unknown
}

export interface CreatePlanningRequest {
  destination_country: string
  destination_city?: string | null
  arrival_date: string
  departure_date: string
  number_of_travelers: number
  budget_range: BudgetRange
  travel_purpose: TravelPurpose
  has_children?: boolean
  special_requirements?: string | null
}

export interface GeneralAnswers {
  destination_country: string
  destination_city?: string | null
  arrival_date: string
  departure_date: string
  total_days: number
  number_of_travelers: number
  budget_range: BudgetRange
  travel_purpose: TravelPurpose
  has_children?: boolean
  special_requirements?: string | null
}

export interface QuestionTreeNodeResponse {
  node_id: string
  parent_id: string | null
  depth: number
  questions: DynamicQuestion[]
  answers: QuestionAnswer[] | null
  children_ids: string[]
  is_answered: boolean
  created_at: string
  answered_at: string | null
}

export interface QuestionTreeResponse {
  root_id: string | null
  current_node_id: string | null
  nodes: Record<string, QuestionTreeNodeResponse>
}

export interface PlanningResponse {
  id: string
  user_id: string
  status: PlanningStatus
  general_answers: GeneralAnswers
  tree: QuestionTreeResponse
  created_at: string
  updated_at: string
}

export interface CurrentQuestionsResponse {
  planning_id: string
  node_id: string
  depth: number
  questions: DynamicQuestion[]
  can_generate_itinerary: boolean
}

export interface AnswerQuestionsRequest {
  node_id: string
  answers: QuestionAnswer[]
}

export interface ActivityResponse {
  activity_id: string
  name: string
  description: string
  duration_hours: number
  category: string
  estimated_cost: string | null
}

export interface DestinationReplacementResponse {
  status: ReplacementStatus
  current_node_id: string | null
  tree: QuestionTreeResponse | null
}

export interface DestinationResponse {
  destination_id: string
  order: number
  name: string
  country: string
  city: string
  days_allocated: number
  description: string
  highlights: string[]
  accommodation_suggestions: string[]
  transportation: string
  estimated_cost: string | null
  activities: ActivityResponse[]
  replacement: DestinationReplacementResponse
}

export interface ItineraryResponse {
  id: string
  user_id: string
  planning_id: string
  title: string
  summary: string
  arrival_date: string
  departure_date: string
  total_days: number
  destinations: DestinationResponse[]
  status: ItineraryStatus
  created_at: string
  updated_at: string
}

export interface ItinerarySummaryResponse {
  id: string
  planning_id: string
  title: string
  summary: string
  arrival_date: string
  departure_date: string
  total_days: number
  destination_count: number
  status: ItineraryStatus
  created_at: string
}

export interface DestinationQuestionsResponse {
  itinerary_id: string
  destination_id: string
  node_id: string
  depth: number
  questions: DynamicQuestion[]
  can_replace: boolean
}

export interface AnswerReplacementRequest {
  node_id: string
  answers: QuestionAnswer[]
}

export interface GeneralQuestion {
  id: string
  text: string
  type: QuestionType
  options?: string[]
  [key: string]: unknown
}
