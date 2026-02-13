import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BottomNav } from './BottomNav';
import { createSession, chatCompletion, healthCheck, getSessions, getSessionMessages, updateSessionTitle, deleteSession, ChatMessage } from '@/services/aiService';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  time: string;
}

interface Conversation {
  session_id: string;
  title: string;
  time: string;
}

interface AIAssistantProps {
  onTabChange: (tab: string) => void;
}

const initialMessages: Message[] = [];

const quickQuestions = [
  '今日A股行情如何？',
  '如何选择基金？',
  '什么是量化交易？',
  '新手如何理财？'
];

export function AIAssistant({ onTabChange }: AIAssistantProps) {
  const [showConversations, setShowConversations] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isServiceHealthy, setIsServiceHealthy] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 组件初始化时检查服务健康状态并加载上次会话
  useEffect(() => {
    const initApp = async () => {
      try {
        // 首先检查服务健康状态
        const healthy = await healthCheck();
        setIsServiceHealthy(healthy);
        
        if (!healthy) {
          setError('后端服务不可用，请检查服务是否运行');
          return;
        }
        
        // 服务健康，清除旧的会话列表缓存并加载最新会话列表
        localStorage.removeItem('aiAssistantConversations');
        await loadConversations();
        
        // 尝试从本地存储获取上次的会话ID
        const lastSessionId = localStorage.getItem('aiAssistantLastSessionId');
        
        if (lastSessionId) {
          try {
            // 尝试加载上次的会话
            await handleSelectConversation(lastSessionId);
            return;
          } catch (err) {
            console.error('加载上次会话失败:', err);
            // 加载失败，继续
          }
        }
        
        // 如果没有上次的会话ID或加载失败，不自动创建会话
        // 等到用户发送消息时再创建
        setSessionId(null);
        setMessages([]);
        // 清除本地存储中的无效会话ID
        localStorage.removeItem('aiAssistantLastSessionId');
      } catch (err) {
        console.error('初始化应用失败:', err);
        setIsServiceHealthy(false);
        setError('初始化应用失败，请刷新页面重试');
      }
    };

    initApp();
  }, []);

  // 加载会话列表
  const loadConversations = async () => {
    try {
      // 从API获取最新会话列表
      const sessions = await getSessions();
      
      // 格式化会话列表，不再获取每个会话的消息
      const formattedConversations: Conversation[] = sessions.map(session => ({
        session_id: session.session_id,
        title: session.title || '未命名会话',
        time: new Date(session.updated_at).toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric'
        })
      }));
      
      // 确保只显示属于当前用户的会话
      // 这里添加一个安全检查，防止显示不属于当前用户的会话
      console.log('Loaded conversations:', formattedConversations);
      setConversations(formattedConversations);
      
      // 缓存会话列表到本地
      localStorage.setItem('aiAssistantConversations', JSON.stringify(formattedConversations));
    } catch (err) {
      console.error('加载会话列表失败:', err);
      // 加载失败时，尝试从本地缓存获取会话列表
      const cachedConversations = localStorage.getItem('aiAssistantConversations');
      if (cachedConversations) {
        try {
          const parsedConversations = JSON.parse(cachedConversations);
          // 处理可能包含lastMessage字段的旧缓存数据
          const cleanedConversations = parsedConversations.map((conv: any) => ({
            session_id: conv.session_id,
            title: conv.title || '未命名会话',
            time: conv.time
          }));
          setConversations(cleanedConversations);
        } catch (e) {
          // 解析失败，设置为空列表
          setConversations([]);
        }
      } else {
        // 没有缓存，设置为空列表
        setConversations([]);
      }
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // 添加用户消息到历史
    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setError('');

    let currentSessionId = sessionId;
    let aiMessageId: number;
    let currentContent = '';
    let hasCreatedMessage = false;

    try {
      // 如果没有会话ID，创建新会话
      if (!sessionId) {
        const newSessionId = await createSession();
        setSessionId(newSessionId);
        currentSessionId = newSessionId;
        // 存储新会话ID到本地
        localStorage.setItem('aiAssistantLastSessionId', newSessionId);
      }

      // 转换消息格式为后端需要的格式
      const chatMessages: ChatMessage[] = updatedMessages.map(msg => ({
        role: msg.type,
        content: msg.content
      }));

      // 调用 AI 服务（使用流式输出）
      const chatResponse = await chatCompletion(
        chatMessages,
        currentSessionId!,
        true,
        (chunk) => {
          // 流式处理回调
          currentContent += chunk;
          
          // 只有在收到第一个响应数据后才创建AI消息
          if (!hasCreatedMessage) {
            aiMessageId = messages.length + 2;
            const aiMessage: Message = {
              id: aiMessageId,
              type: 'assistant',
              content: currentContent,
              time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMessage]);
            hasCreatedMessage = true;
          } else {
            // 更新已有消息内容
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId ? { ...msg, content: currentContent } : msg
            ));
          }
        }
      );

      // 最终更新消息内容
      if (hasCreatedMessage) {
        // 如果已经创建了消息，则更新内容
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, content: chatResponse.content || 'AI暂无回应' } : msg
        ));
      } else {
        // 如果还没有创建消息，则创建一个新消息
        aiMessageId = messages.length + 2;
        const aiMessage: Message = {
          id: aiMessageId,
          type: 'assistant',
          content: chatResponse.content || 'AI暂无回应',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      // 重新加载会话列表，确保最新的会话信息显示
      await loadConversations();
    } catch (err) {
      console.error('发送消息失败:', err);
      
      // 提供更详细的错误信息
      let errorMessage = '发送消息失败，请重试';
      if (err instanceof Error) {
        errorMessage = `发送消息失败: ${err.message}`;
      } else {
        errorMessage = '发送消息失败: 未知错误';
      }
      setError(errorMessage);
      
      // 移除刚才添加的用户消息，因为发送失败
      // 如果已经创建了AI消息，也一并移除
      if (hasCreatedMessage) {
        setMessages(prev => prev.slice(0, -2));
      } else {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleSelectConversation = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      try {
        // 获取会话消息
        const sessionMessages = await getSessionMessages(sessionId);
        
        // 转换消息格式
        const formattedMessages: Message[] = sessionMessages.map((msg, index) => ({
          id: index + 1,
          type: msg.role,
          content: msg.content,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }));
        
        // 更新会话ID和消息列表
        setSessionId(sessionId);
        setMessages(formattedMessages);
        setShowConversations(false);
        
        // 存储当前会话ID到本地
        localStorage.setItem('aiAssistantLastSessionId', sessionId);
      } catch (err) {
        console.error('加载会话消息失败，创建新会话:', err);
        // 如果后端没有该会话，自动创建新会话
        await handleNewConversation();
      }
    } catch (err) {
      console.error('处理会话失败:', err);
      setError('处理会话失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      setIsLoading(true);
      
      // 检查服务健康状态
      const healthy = await healthCheck();
      if (!healthy) {
        setIsServiceHealthy(false);
        setError('后端服务不可用，请检查服务是否运行');
        return;
      }
      
      // 服务健康，重置到欢迎页面状态
      // 不立即创建会话，等到用户发送消息时再创建
      setSessionId(null);
      setIsServiceHealthy(true);
      setMessages([]);
      setShowConversations(false);
      setError('');
      
      // 清除本地存储中的会话ID
      localStorage.removeItem('aiAssistantLastSessionId');
      
      // 重新加载会话列表
      await loadConversations();
    } catch (err) {
      setIsServiceHealthy(false);
      setError('创建新会话失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始编辑会话标题
  const handleStartEditTitle = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
    
    // 在下一个渲染周期聚焦输入框
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  // 保存会话标题
  const handleSaveTitle = async () => {
    if (editingSessionId && editingTitle.trim()) {
      try {
        const conv = conversations.find(c => c.session_id === editingSessionId);
        if (conv && editingTitle.trim() !== conv.title) {
          const success = await updateSessionTitle(editingSessionId, editingTitle.trim());
          if (success) {
            await loadConversations();
          }
        }
        setEditingSessionId(null);
        setEditingTitle('');
      } catch (err) {
        setError('修改会话标题失败，请重试');
        setEditingSessionId(null);
        setEditingTitle('');
      }
    } else {
      setEditingSessionId(null);
      setEditingTitle('');
    }
  };

  // 取消编辑会话标题
  const handleCancelEditTitle = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // 删除会话
  const handleDeleteConversation = async (deleteSessionId: string, e: React.MouseEvent) => {
    try {
      e.stopPropagation(); // 阻止事件冒泡，避免触发选择会话
      
      if (window.confirm('确定要删除这个会话吗？')) {
        const success = await deleteSession(deleteSessionId);
        if (success) {
          await loadConversations();
          
          // 检查是否删除的是当前存储的会话ID
          const lastSessionId = localStorage.getItem('aiAssistantLastSessionId');
          if (deleteSessionId === lastSessionId) {
            // 清除本地存储中的会话ID
            localStorage.removeItem('aiAssistantLastSessionId');
          }
          
          // 如果删除的是当前会话，创建新会话
          if (deleteSessionId === sessionId) {
            await handleNewConversation();
          }
        }
      }
    } catch (err) {
      setError('删除会话失败，请重试');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <button 
            onClick={() => setShowConversations(!showConversations)}
            className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <MessageSquare size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <span className="font-medium">AI助手</span>
          </div>
          
          <button 
            onClick={handleNewConversation}
            disabled={isLoading}
            className="p-2 -mr-2 hover:bg-white/20 rounded-full transition-colors"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      {/* Conversations Sidebar */}
      {showConversations && (
        <div 
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => {
            // 只有在没有编辑会话标题时才关闭
            if (!editingSessionId) {
              setShowConversations(false);
            }
          }}
        >
          <div 
            className="absolute left-0 top-14 bottom-16 w-4/5 max-w-xs bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">历史会话</h3>
              {conversations.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">暂无历史会话</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div 
                      key={conv.session_id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleSelectConversation(conv.session_id)}
                    >
                      <div className="flex items-start justify-between">
                        {editingSessionId === conv.session_id ? (
                          <div 
                            className="flex-1 flex flex-col gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div 
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                ref={titleInputRef}
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTitle();
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditTitle();
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveTitle();
                                }}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                保存
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEditTitle();
                                }}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                取消
                              </button>
                            </div>
                            <span className="text-xs text-gray-500">
                              {conv.time}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <h4 
                                className="text-sm font-medium text-gray-900 line-clamp-1"
                              >
                                {conv.title}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {conv.time}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                
                                // 检查是否已经存在该会话的菜单
                                const existingMenu = document.querySelector(`.session-menu-${conv.session_id}`);
                                if (existingMenu) {
                                  // 如果存在，移除它（隐藏菜单）
                                  existingMenu.remove();
                                  return;
                                }
                                
                                // 创建新菜单
                                const menu = document.createElement('div');
                                menu.className = `absolute right-4 z-50 bg-white shadow-lg rounded-md py-1 px-2 border border-gray-200 session-menu-${conv.session_id}`;
                                menu.style.width = '100px';
                                
                                // 添加重命名按钮
                                const renameBtn = document.createElement('button');
                                renameBtn.className = 'block w-full text-left text-xs py-1 px-2 hover:bg-gray-100 rounded';
                                renameBtn.textContent = '重命名';
                                renameBtn.onclick = (event) => {
                                  event.stopPropagation();
                                  handleStartEditTitle(conv.session_id, conv.title);
                                  menu.remove();
                                };
                                menu.appendChild(renameBtn);
                                
                                // 添加删除按钮
                                const deleteBtn = document.createElement('button');
                                deleteBtn.className = 'block w-full text-left text-xs py-1 px-2 hover:bg-gray-100 rounded text-red-600';
                                deleteBtn.textContent = '删除';
                                deleteBtn.onclick = (event) => {
                                  event.stopPropagation();
                                  handleDeleteConversation(conv.session_id, event as unknown as React.MouseEvent);
                                  menu.remove();
                                };
                                menu.appendChild(deleteBtn);
                                
                                // 添加到文档
                                document.body.appendChild(menu);
                                
                                // 定位菜单
                                const rect = e.currentTarget.getBoundingClientRect();
                                menu.style.top = `${rect.bottom + window.scrollY}px`;
                                menu.style.right = `${window.innerWidth - rect.right + window.scrollX}px`;
                                
                                // 点击其他地方关闭菜单
                                setTimeout(() => {
                                  const closeMenu = (event: MouseEvent) => {
                                    if (!menu.contains(event.target as Node) && event.target !== e.currentTarget) {
                                      menu.remove();
                                      document.removeEventListener('click', closeMenu);
                                    }
                                  };
                                  document.addEventListener('click', closeMenu);
                                }, 0);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="12" cy="5" r="1"/>
                                <circle cx="12" cy="19" r="1"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto pt-14 pb-32 px-4">
        <div className="max-w-md mx-auto space-y-4 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {messages.length === 0 ? (
            // 会话为空时显示问候语作为背景提示
            <div className="flex justify-center py-12">
              <div className="max-w-[80%] text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">您好！我是AI财经助手</h3>
                <p className="text-sm text-gray-600 mb-4">很高兴为您服务。我可以帮您：</p>
                <ul className="text-xs text-gray-500 text-left space-y-1 mb-6">
                  <li>• 分析市场行情和投资机会</li>
                  <li>• 解答金融知识问题</li>
                  <li>• 提供个性化理财建议</li>
                  <li>• 解读财经新闻和政策</li>
                </ul>
                <p className="text-xs text-gray-500">请问有什么可以帮助您的？</p>
              </div>
            </div>
          ) : (
            // 会话不为空时显示消息列表
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.type === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Sparkles size={14} className="text-white" />
                      </div>
                      <span className="text-xs text-gray-600">AI助手</span>
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-900 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {message.type === 'assistant' ? (
                      <div className="text-sm leading-relaxed">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-1 px-1 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator - 不再需要，因为我们使用流式输出 */}

          {/* Scroll to bottom indicator */}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 0 && (
          <div className="max-w-md mx-auto mt-6">
            <p className="text-xs text-gray-500 mb-3 px-1">快速提问</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="p-3 bg-white rounded-lg text-xs text-left text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading && isServiceHealthy) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isServiceHealthy === false ? "后端服务不可用" : "输入您的问题..."}
                disabled={isLoading || isServiceHealthy === false}
                className="w-full bg-transparent text-sm resize-none outline-none max-h-24"
                rows={1}
                style={{ lineHeight: '1.5' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading || isServiceHealthy === false}
              className={`p-2.5 rounded-full transition-all ${
                inputValue.trim() && !isLoading && isServiceHealthy
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI助手可能会出错，请谨慎对待投资建议
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="ai" onTabChange={onTabChange} />
    </div>
  );
}