// 用户服务，处理用户认证、收藏和浏览历史相关的API调用
import api from "../config/api";

// 定义响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  success: boolean;
}

// 用户信息
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  created_at?: string;
}

// 用户注册请求
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  code: string;
  avatar?: string;
}

// 用户登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  user: UserInfo;
}

// 发送验证码请求
export interface SendCodeRequest {
  email: string;
}

// 收藏/历史操作响应
export interface MessageResponse {
  message: string;
}

// 检查收藏状态响应
export interface CheckFavoriteResponse {
  is_favorite: boolean;
}

// 新闻摘要信息
export interface NewsSummary {
  id: number;
  title: string;
  summary: string;
  publish_time: string;
  source: string;
}

// 收藏项
export interface FavoriteItem {
  id: number;
  news_id: number;
  created_at: string;
  news: NewsSummary;
}

// 历史记录项
export interface HistoryItem {
  id: number;
  news_id: number;
  viewed_at: string;
  news: NewsSummary;
}

// 分页响应
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

// 会话信息
export interface UserSession {
  id: string;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

// 会话列表响应
export interface SessionsResponse {
  sessions: UserSession[];
}

// 创建会话请求
export interface CreateSessionRequest {
  title: string;
}

// 创建会话响应
export interface CreateSessionResponse {
  session_id: string;
}

/**
 * 发送验证码
 * @param email 邮箱
 * @returns API响应
 */
export async function sendCode(
  email: string,
): Promise<ApiResponse<MessageResponse>> {
  try {
    const response = await api.post<ApiResponse<MessageResponse>>(
      "/api/auth/send-code",
      { email },
    );
    return response.data;
  } catch (error: any) {
    console.error("发送验证码失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 用户注册
 * @param userData 用户注册数据
 * @returns API响应
 */
export async function register(
  userData: RegisterRequest,
): Promise<ApiResponse<UserInfo>> {
  try {
    const response = await api.post<ApiResponse<UserInfo>>(
      "/api/auth/register",
      userData,
    );
    return response.data;
  } catch (error: any) {
    console.error("注册失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 用户登录
 * @param credentials 登录凭证
 * @returns API响应
 */
export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/api/auth/login",
      credentials,
    );
    return response.data;
  } catch (error: any) {
    console.error("登录失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 添加收藏
 * @param userId 用户ID
 * @param newsId 新闻ID
 * @returns API响应
 */
export async function addFavorite(
  userId: number,
  newsId: number,
): Promise<ApiResponse<MessageResponse>> {
  try {
    const response = await api.post<ApiResponse<MessageResponse>>(
      `/api/user/${userId}/favorites`,
      { news_id: newsId },
    );
    return response.data;
  } catch (error: any) {
    console.error("添加收藏失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 取消收藏
 * @param userId 用户ID
 * @param newsId 新闻ID
 * @returns API响应
 */
export async function removeFavorite(
  userId: number,
  newsId: number,
): Promise<ApiResponse<MessageResponse>> {
  try {
    const response = await api.delete<ApiResponse<MessageResponse>>(
      `/api/user/${userId}/favorites/${newsId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("取消收藏失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 获取收藏列表
 * @param userId 用户ID
 * @param page 页码
 * @param pageSize 每页数量
 * @returns API响应
 */
export async function getFavorites(
  userId: number,
  page: number = 1,
  pageSize: number = 20,
): Promise<ApiResponse<PaginatedResponse<FavoriteItem>>> {
  try {
    const response = await api.get<
      ApiResponse<PaginatedResponse<FavoriteItem>>
    >(`/api/user/${userId}/favorites`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  } catch (error: any) {
    console.error("获取收藏列表失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 检查是否收藏
 * @param userId 用户ID
 * @param newsId 新闻ID
 * @returns API响应
 */
export async function checkFavorite(
  userId: number,
  newsId: number,
): Promise<ApiResponse<CheckFavoriteResponse>> {
  try {
    const response = await api.get<ApiResponse<CheckFavoriteResponse>>(
      `/api/user/${userId}/favorites/${newsId}/check`,
    );
    return response.data;
  } catch (error: any) {
    console.error("检查收藏状态失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 添加浏览历史
 * @param userId 用户ID
 * @param newsId 新闻ID
 * @returns API响应
 */
export async function addHistory(
  userId: number,
  newsId: number,
): Promise<ApiResponse<MessageResponse>> {
  try {
    const response = await api.post<ApiResponse<MessageResponse>>(
      `/api/user/${userId}/history`,
      { news_id: newsId },
    );
    return response.data;
  } catch (error: any) {
    console.error("添加浏览历史失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 获取浏览历史
 * @param userId 用户ID
 * @param page 页码
 * @param pageSize 每页数量
 * @returns API响应
 */
export async function getHistory(
  userId: number,
  page: number = 1,
  pageSize: number = 20,
): Promise<ApiResponse<PaginatedResponse<HistoryItem>>> {
  try {
    const response = await api.get<ApiResponse<PaginatedResponse<HistoryItem>>>(
      `/api/user/${userId}/history`,
      {
        params: { page, page_size: pageSize },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error("获取浏览历史失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 获取用户会话列表
 * @param userId 用户ID
 * @returns API响应
 */
export async function getUserSessions(
  userId: number,
): Promise<ApiResponse<SessionsResponse>> {
  try {
    const response = await api.get<ApiResponse<SessionsResponse>>(
      `/api/user/${userId}/sessions`,
    );
    return response.data;
  } catch (error: any) {
    console.error("获取用户会话列表失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 创建用户会话
 * @param userId 用户ID
 * @param sessionData 会话数据
 * @returns API响应
 */
export async function createUserSession(
  userId: number,
  sessionData: CreateSessionRequest,
): Promise<ApiResponse<CreateSessionResponse>> {
  try {
    const response = await api.post<ApiResponse<CreateSessionResponse>>(
      `/api/user/${userId}/session/create`,
      sessionData,
    );
    return response.data;
  } catch (error: any) {
    console.error("创建用户会话失败:", error);
    return {
      success: false,
      error: {
        code: error.response?.data?.error?.code || "NETWORK_ERROR",
        message: error.response?.data?.error?.message || "网络错误，请稍后重试",
      },
    };
  }
}
