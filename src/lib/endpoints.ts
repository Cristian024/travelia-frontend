import { api } from "./api"
import type {
  AnswerQuestionsRequest,
  AnswerReplacementRequest,
  CreatePlanningRequest,
  CurrentQuestionsResponse,
  DestinationQuestionsResponse,
  GeneralQuestion,
  ItineraryResponse,
  ItinerarySummaryResponse,
  LoginRequest,
  PlanningResponse,
  QuestionTreeResponse,
  RegisterRequest,
  TokenResponse,
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
}
