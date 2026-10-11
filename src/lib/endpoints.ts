import { api } from "./api"
import type {
  AnswerQuestionsRequest,
  AnswerReplacementRequest,
  ChangeSubscriptionRequest,
  CreateExpenseRequest,
  CreatePlanningRequest,
  CurrentQuestionsResponse,
  DestinationQuestionsResponse,
  ExpenseResponse,
  ExpenseSummaryResponse,
  GeneralQuestion,
  ItineraryResponse,
  ItinerarySummaryResponse,
  LoginRequest,
  PackingList,
  PlanningResponse,
  PublicFeedResponse,
  QuestionTreeResponse,
  RegisterRequest,
  SubscriptionResponse,
  TokenResponse,
  UpdateExpenseRequest,
  UpdateUserRequest,
  UserResponse,
} from "@/types/api"

export const authApi = {
  register: (body: RegisterRequest) =>
    api.post<TokenResponse>("/api/v1/auth/register", body).then((r) => r.data),
  login: (body: LoginRequest) =>
    api.post<TokenResponse>("/api/v1/auth/login", body).then((r) => r.data),
}

export const usersApi = {
  me: () => api.get<UserResponse>("/api/v1/users/me").then((r) => r.data),
  update: (body: UpdateUserRequest) =>
    api.patch<UserResponse>("/api/v1/users/me", body).then((r) => r.data),
}

export const subscriptionsApi = {
  me: () =>
    api
      .get<SubscriptionResponse>("/api/v1/subscriptions/me")
      .then((r) => r.data),
  change: (body: ChangeSubscriptionRequest) =>
    api
      .post<SubscriptionResponse>("/api/v1/subscriptions/me", body)
      .then((r) => r.data),
}

export const planningApi = {
  generalQuestions: () =>
    api
      .get<GeneralQuestion[]>("/api/v1/planning/general-questions")
      .then((r) => r.data),
  create: (body: CreatePlanningRequest) =>
    api.post<PlanningResponse>("/api/v1/planning/", body).then((r) => r.data),
  get: (planningId: string) =>
    api.get<PlanningResponse>(`/api/v1/planning/${planningId}`).then((r) => r.data),
  current: (planningId: string) =>
    api
      .get<CurrentQuestionsResponse>(
        `/api/v1/planning/${planningId}/current-questions`,
      )
      .then((r) => r.data),
  answer: (planningId: string, body: AnswerQuestionsRequest) =>
    api
      .post<CurrentQuestionsResponse>(
        `/api/v1/planning/${planningId}/answer`,
        body,
      )
      .then((r) => r.data),
  markReady: (planningId: string) =>
    api
      .post<PlanningResponse>(`/api/v1/planning/${planningId}/ready`)
      .then((r) => r.data),
  tree: (planningId: string) =>
    api
      .get<QuestionTreeResponse>(`/api/v1/planning/${planningId}/tree`)
      .then((r) => r.data),
}

export const itinerariesApi = {
  generate: (planningId: string) =>
    api
      .post<ItineraryResponse>(`/api/v1/itineraries/generate/${planningId}`)
      .then((r) => r.data),
  list: () =>
    api
      .get<ItinerarySummaryResponse[]>("/api/v1/itineraries/")
      .then((r) => r.data),
  get: (itineraryId: string) =>
    api
      .get<ItineraryResponse>(`/api/v1/itineraries/${itineraryId}`)
      .then((r) => r.data),
  remove: (itineraryId: string) =>
    api.delete(`/api/v1/itineraries/${itineraryId}`).then((r) => r.data),
  startReplacement: (itineraryId: string, destinationId: string) =>
    api
      .post<DestinationQuestionsResponse>(
        `/api/v1/itineraries/${itineraryId}/destinations/${destinationId}/start-replacement`,
      )
      .then((r) => r.data),
  answerReplacement: (
    itineraryId: string,
    destinationId: string,
    body: AnswerReplacementRequest,
  ) =>
    api
      .post<DestinationQuestionsResponse>(
        `/api/v1/itineraries/${itineraryId}/destinations/${destinationId}/answer-replacement`,
        body,
      )
      .then((r) => r.data),
  replace: (itineraryId: string, destinationId: string) =>
    api
      .post<ItineraryResponse>(
        `/api/v1/itineraries/${itineraryId}/destinations/${destinationId}/replace`,
      )
      .then((r) => r.data),
  publicFeed: (page = 1, pageSize = 10) =>
    api
      .get<PublicFeedResponse>("/api/v1/itineraries/public", {
        params: { page, page_size: pageSize },
      })
      .then((r) => r.data),
  clone: (itineraryId: string) =>
    api
      .post<ItineraryResponse>(`/api/v1/itineraries/${itineraryId}/clone`)
      .then((r) => r.data),
  setVisibility: (itineraryId: string, isPublic: boolean) =>
    api
      .patch<ItineraryResponse>(`/api/v1/itineraries/${itineraryId}/visibility`, {
        is_public: isPublic,
      })
      .then((r) => r.data),
  getPackingList: (itineraryId: string) =>
    api
      .get<PackingList>(`/api/v1/itineraries/${itineraryId}/packing-list`)
      .then((r) => r.data),
  generatePackingList: (itineraryId: string) =>
    api
      .post<PackingList>(`/api/v1/itineraries/${itineraryId}/packing-list`)
      .then((r) => r.data),
  updatePackingItem: (itineraryId: string, position: number, checked: boolean) =>
    api
      .patch<PackingList>(
        `/api/v1/itineraries/${itineraryId}/packing-list/items/${position}`,
        { checked },
      )
      .then((r) => r.data),
  exportPdf: (itineraryId: string) =>
    api
      .get(`/api/v1/itineraries/${itineraryId}/export/pdf`, {
        responseType: "blob",
      })
      .then((r) => r.data as Blob),
}

export const expensesApi = {
  summary: (itineraryId: string) =>
    api
      .get<ExpenseSummaryResponse>(
        `/api/v1/itineraries/${itineraryId}/expenses/summary`,
      )
      .then((r) => r.data),
  list: (itineraryId: string) =>
    api
      .get<ExpenseResponse[]>(`/api/v1/itineraries/${itineraryId}/expenses`)
      .then((r) => r.data),
  create: (itineraryId: string, body: CreateExpenseRequest) =>
    api
      .post<ExpenseResponse>(
        `/api/v1/itineraries/${itineraryId}/expenses`,
        body,
      )
      .then((r) => r.data),
  update: (expenseId: string, body: UpdateExpenseRequest) =>
    api
      .patch<ExpenseResponse>(`/api/v1/expenses/${expenseId}`, body)
      .then((r) => r.data),
  remove: (expenseId: string) =>
    api.delete(`/api/v1/expenses/${expenseId}`).then((r) => r.data),
}
