const BACKEND = "http://localhost:8080"

export const WebSocketURL = "ws://localhost:8080/ws"
export const Endpoints = {
  WORKSPACES_PUBLIC: BACKEND + "/api/workspaces/public",
  USERS: BACKEND + "/api/users",
  SETTINGS: BACKEND + "/api/settings",
  AUTH_DELETE: BACKEND + "/api/auth/delete-account",
  WORKSPACES: BACKEND + "/api/workspaces",
  AUTH_OAUTH: BACKEND + "/api/auth/oauth",
  AUTH_LOGIN: BACKEND + "/api/auth/login",
  AUTH_REGISTER: BACKEND + "/api/auth/register",
  AUTH_ACCOUNT: BACKEND + "/api/auth/account"
};
