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

export type SubscriptionType = "FREE" | "PREMIUM"

export type UserRole = "USER" | "ADMIN"

export type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR"

export type ExpenseCategory =
  | "food"
  | "transport"
  | "accommodation"
  | "activities"
  | "shopping"
  | "other"

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
  role: UserRole
  created_at: string
  updated_at: string
}

export interface UserAdminResponse {
  id: string
  email: string
  full_name: string
  role: UserRole
  subscription_type: string
  premium_since: string | null
  created_at: string
  updated_at: string
}

export interface UpdateUserRoleRequest {
  role: UserRole
}

export interface PaginatedUsersResponse {
  items: UserAdminResponse[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface UpdateUserRequest {
  full_name?: string | null
  birth_date?: string | null
  country_of_residence?: string | null
  phone?: string | null
  preferred_language?: string | null
}

export interface SubscriptionResponse {
  subscription_type: SubscriptionType
  is_premium: boolean
  premium_since: string | null
  monthly_planning_limit: number | null
  monthly_plannings_used: number
  max_total_days: number
  max_destinations: number
}

export interface ChangeSubscriptionRequest {
  subscription_type: SubscriptionType
}

export interface PlanResponse {
  id: string
  code: string
  name: string
  amount_in_cents: number
  currency: string
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePlanRequest {
  code: string
  name: string
  amount_in_cents: number
  currency?: string
  duration_days?: number
  is_active?: boolean
}

export interface UpdatePlanRequest {
  name?: string | null
  amount_in_cents?: number | null
  currency?: string | null
  duration_days?: number | null
  is_active?: boolean | null
}

export interface CheckoutResponse {
  payment_id: string
  reference: string
  amount_in_cents: number
  currency: string
  public_key: string
  signature_integrity: string
  redirect_url: string
}

export interface PaymentResponse {
  id: string
  user_id: string
  reference: string
  amount_in_cents: number
  currency: string
  status: PaymentStatus
  transaction_id: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedPaymentsResponse {
  items: PaymentResponse[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface DailyForecast {
  date: string
  temp_min: number
  temp_max: number
  description: string
  icon?: string | null
}

export interface WeatherForecast {
  city: string
  country: string
  days: DailyForecast[]
  summary?: string
}

export interface PackingItem {
  position?: number
  category: string
  item: string
  quantity?: string | null
  reason?: string | null
  checked?: boolean
}

export interface PackingList {
  itinerary_id: string
  destination_summary: string
  weather_summary?: string
  items: PackingItem[]
  notes?: string
}

export interface CategoryBreakdown {
  category: string
  total: number
}

export interface ExpenseResponse {
  id: string
  itinerary_id: string
  user_id: string
  category: ExpenseCategory
  description: string
  amount: number
  currency: string
  expense_date: string
  created_at: string
  updated_at: string
}

export interface CreateExpenseRequest {
  category: ExpenseCategory
  description: string
  amount: number
  currency?: string
  expense_date: string
}

export interface UpdateExpenseRequest {
  category?: ExpenseCategory | null
  description?: string | null
  amount?: number | null
  currency?: string | null
  expense_date?: string | null
}

export interface ExpenseSummaryResponse {
  itinerary_id: string
  currency: string
  total_estimated: number
  total_real: number
  difference: number
  status: string
  expenses_count: number
  by_category: CategoryBreakdown[]
}

export interface SetVisibilityRequest {
  is_public: boolean
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
  google_maps_url?: string | null
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
  is_public?: boolean
  weather?: WeatherForecast | null
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
  is_public?: boolean
  created_at: string
}

export interface PublicFeedResponse {
  items: ItinerarySummaryResponse[]
  page: number
  page_size: number
  total: number
  total_pages: number
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
