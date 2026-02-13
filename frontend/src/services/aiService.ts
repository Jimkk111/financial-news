// src/services/aiService.ts
import { API_BASE_URL } from '../config/api';

// 定义消息类型
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 定义响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 生成AI响应的请求参数
interface GenerateRequest {
  prompt: string;
}

// 生成AI响应的响应数据
interface GenerateResponse {
  response: string;
}

// 聊天完成的请求参数
interface ChatRequest {
  messages: ChatMessage[];
  session_id?: string;
  stream: boolean;
}

// 聊天完成的响应数据
interface ChatResponse {
  role: 'assistant';
  content: string;
}

// 会话创建的响应数据
interface SessionCreateResponse {
  session_id: string;
}

// 会话消息的响应数据
interface SessionMessagesResponse {
  messages: ChatMessage[];
}

// 会话信息
interface SessionInfo {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

// 会话列表响应
interface SessionsListResponse {
  sessions: SessionInfo[];
}



// 获取用户ID（从本地存储获取，登录或注册成功时后端返回的值）
const getUserId = (): string => {
  // 从本地存储获取userId
  const userId = localStorage.getItem('userId') || '4';
  console.log('Using user ID:', userId);
  return userId;
};

// 生成AI响应（单轮对话）
export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<GenerateResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || '生成响应失败');
    }

    return data.data.response;
  } catch (error) {
    console.error('生成响应错误:', error);
    throw error;
  }
}

// 创建新会话
export async function createSession(): Promise<string> {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/api/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<SessionCreateResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || '创建会话失败');
    }

    return data.data.session_id;
  } catch (error) {
    console.error('创建会话错误:', error);
    throw error;
  }
}

// 获取会话消息
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<SessionMessagesResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || '获取会话消息失败');
    }

    return data.data.messages;
  } catch (error) {
    console.error('获取会话消息错误:', error);
    throw error;
  }
}

// 删除会话
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<{ message: string }> = await response.json();

    if (!data.success) {
      throw new Error(data.error || '删除会话失败');
    }

    return true;
  } catch (error) {
    console.error('删除会话错误:', error);
    throw error;
  }
}

// 删除会话内消息
export async function deleteSessionMessage(sessionId: string, messageIndex: number): Promise<boolean> {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/message/${messageIndex}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<{ message: string }> = await response.json();

    if (!data.success) {
      throw new Error(data.error || '删除消息失败');
    }

    return true;
  } catch (error) {
    console.error('删除消息错误:', error);
    throw error;
  }
}

// 获取会话列表
export async function getSessions(): Promise<SessionInfo[]> {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/api/sessions?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<SessionsListResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || '获取会话列表失败');
    }

    console.log('API returned sessions:', data.data.sessions);
    return data.data.sessions;
  } catch (error) {
    console.error('获取会话列表错误:', error);
    throw error;
  }
}

// 更新会话标题
export async function updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<{ message: string }> = await response.json();

    if (!data.success) {
      throw new Error(data.error || '更新会话标题失败');
    }

    return true;
  } catch (error) {
    console.error('更新会话标题错误:', error);
    throw error;
  }
}

// 聊天完成
export async function chatCompletion(
  messages: ChatMessage[],
  sessionId?: string,
  stream: boolean = false,
  onChunk?: (chunk: string) => void
): Promise<ChatResponse> {
  try {
    const userId = getUserId();
    const request: any = { messages, stream, user_id: userId };
    if (sessionId) {
      request.session_id = sessionId;
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || '未知错误'}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    if (stream && onChunk) {
      // 流式处理
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应体读取器');
      }

      let completeContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码chunk
        const chunk = new TextDecoder('utf-8').decode(value);
        // 处理流式响应，假设每行是一个JSON chunk
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            // 检查响应格式
            let contentChunk = '';
            if (data.chunk) {
              // 格式1: data.chunk 包含AI回答（流式响应）
              contentChunk = data.chunk;
            } else if (data.success && data.data) {
              // 格式2: data.data 包含AI回答（非流式响应）
              if (data.data.response) {
                contentChunk = data.data.response;
              } else if (data.data.content) {
                contentChunk = data.data.content;
              }
            }
            
            if (contentChunk) {
              completeContent += contentChunk;
              onChunk(contentChunk);
            }
          } catch (e) {
            // 解析失败，忽略该chunk
          }
        }
      }

      if (!completeContent) {
        return {
          role: 'assistant',
          content: '我是AI财经助手，很高兴为您服务。请问有什么可以帮助您的？'
        };
      }

      return {
        role: 'assistant',
        content: completeContent
      };
    } else {
      // 非流式处理
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '聊天完成失败');
      }

      if (!data.data) {
        throw new Error('聊天完成失败: 无响应数据');
      }

      // 检查响应格式，根据实际格式解析
      if (data.data.response) {
        // 格式1: data.response 包含AI回答
        return {
          role: 'assistant',
          content: data.data.response
        };
      } else if (data.data.content) {
        // 格式2: data.content 包含AI回答
        return {
          role: 'assistant',
          content: data.data.content
        };
      } else {
        // 如果都没有，提供默认响应
        return {
          role: 'assistant',
          content: '我是AI财经助手，很高兴为您服务。请问有什么可以帮助您的？'
        };
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('聊天完成错误: 未知错误');
  }
}

// 获取欢迎信息
export async function getWelcomeMessage(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.message || 'Welcome';
  } catch (error) {
    console.error('获取欢迎信息错误:', error);
    throw error;
  }
}

// 健康检查
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('健康检查错误:', error);
    return false;
  }
}
