import os
import uuid
import requests
from typing import Dict, Any, Optional, List

class AIService:
    """大语言模型服务类"""
    
    def __init__(self):
        """初始化 AI 服务"""
        self.api_key = os.getenv("AI_API_KEY")
        self.model = os.getenv("AI_MODEL", "deepseek-chat")
        # DeepSeek API 基础 URL
        self.api_base = os.getenv("AI_API_BASE", "https://api.deepseek.com/v1")
        # 会话存储：使用字典存储会话，键为会话ID，值为包含messages和user_id的字典
        self.sessions: Dict[str, Dict[str, Any]] = {}
        # 数据库标志
        self.use_database = False
        
        # 尝试初始化数据库
        try:
            from spiders.database_news import SessionLocal, Session as DBSession, Message, init_db
            init_db()
            self.use_database = True
            self.SessionLocal = SessionLocal
            self.DBSession = DBSession
            self.Message = Message
        except Exception as e:
            self.use_database = False
    
    def generate_response(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """
        生成 AI 响应
        
        Args:
            prompt: 提示词
            **kwargs: 其他参数
            
        Returns:
            包含响应的字典
        """
        try:
            # 检查是否配置了 API 密钥
            if not self.api_key:
                # 模拟响应（当没有 API 密钥时）
                return {
                    "prompt": prompt,
                    "response": f"这是模拟的 AI 响应，基于提示: {prompt}",
                    "model": self.model,
                    "usage": {
                        "prompt_tokens": len(prompt.split()),
                        "completion_tokens": 50,
                        "total_tokens": len(prompt.split()) + 50
                    }
                }
            
            # 调用 DeepSeek API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload
            )
            
            # 检查响应状态
            if response.status_code != 200:
                return {
                    "error": f"API 请求失败: {response.status_code} - {response.text}"
                }
            
            # 处理响应
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]
            usage = result["usage"]
            
            return {
                "prompt": prompt,
                "response": ai_response,
                "model": self.model,
                "usage": {
                    "prompt_tokens": usage["prompt_tokens"],
                    "completion_tokens": usage["completion_tokens"],
                    "total_tokens": usage["total_tokens"]
                }
            }
        except Exception as e:
            return {
                "error": str(e)
            }
    
    def create_session(self, user_id: Optional[int] = None) -> str:
        """
        创建新会话
        
        Args:
            user_id: 用户 ID（可选）
            
        Returns:
            会话 ID
        """
        session_id = str(uuid.uuid4())
        
        if self.use_database:
            # 保存到数据库
            db = self.SessionLocal()
            try:
                new_session = self.DBSession(id=session_id, user_id=user_id)
                db.add(new_session)
                db.commit()
                db.refresh(new_session)
            finally:
                db.close()
        else:
            # 使用内存存储
            self.sessions[session_id] = {
                "messages": [],
                "user_id": user_id
            }
        
        return session_id
    
    def get_session(self, session_id: str, user_id: Optional[int] = None) -> Optional[List[Dict[str, str]]]:
        """
        获取会话消息
        
        Args:
            session_id: 会话 ID
            user_id: 用户 ID（可选），用于验证会话所属权
            
        Returns:
            会话消息列表，如果会话不存在或不属于该用户则返回 None
        """
        if self.use_database:
            db = self.SessionLocal()
            try:
                # 查询会话，添加用户 ID 验证
                query = db.query(self.DBSession).filter(self.DBSession.id == session_id)
                if user_id:
                    query = query.filter(self.DBSession.user_id == user_id)
                session = query.first()
                if not session:
                    return None
                
                # 构建消息列表
                messages = []
                for msg in session.messages:
                    messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
                return messages
            finally:
                db.close()
        else:
            # 使用内存存储
            session_data = self.sessions.get(session_id)
            if not session_data:
                return None
            # 验证用户ID
            if user_id is not None and session_data.get("user_id") != user_id:
                return None
            return session_data.get("messages", [])
    
    def chat_completion(self, messages: list, session_id: Optional[str] = None, stream: bool = False, user_id: Optional[int] = None, **kwargs):
        """
        聊天完成
        
        Args:
            messages: 消息列表
            session_id: 会话 ID（可选）
            stream: 是否使用流式输出
            user_id: 用户 ID（可选），用于验证会话所属权
            **kwargs: 其他参数
            
        Returns:
            包含响应的字典或流式生成器
        """
        if stream:
            return self._chat_completion_stream(messages, session_id, user_id, **kwargs)
        else:
            return self._chat_completion_non_stream(messages, session_id, user_id, **kwargs)
    
    def _chat_completion_non_stream(self, messages: list, session_id: Optional[str] = None, user_id: Optional[int] = None, **kwargs) -> Dict[str, Any]:
        """
        非流式聊天完成
        
        Args:
            messages: 消息列表
            session_id: 会话 ID（可选）
            user_id: 用户 ID（可选），用于验证会话所属权
            **kwargs: 其他参数
            
        Returns:
            包含响应的字典
        """
        full_messages = []
        
        if self.use_database:
            db = self.SessionLocal()
            try:
                # 处理会话
                if session_id:
                    # 检查会话是否存在，并验证用户 ID
                    query = db.query(self.DBSession).filter(self.DBSession.id == session_id)
                    if user_id:
                        query = query.filter(self.DBSession.user_id == user_id)
                    session = query.first()
                    if not session:
                        return {
                            "error": "Session not found or not owned by user"
                        }
                    
                    # 获取当前会话中已有的消息数量
                    existing_message_count = len(session.messages)
                    
                    # 只保存新增的用户消息到数据库
                    # 假设前端发送的是完整的对话历史，我们只需要存储新增的消息
                    # 检查messages中哪些是新增的消息
                    new_messages = []
                    if existing_message_count > 0:
                        # 如果会话中已有消息，只存储新增的消息
                        # 假设前端发送的是完整的对话历史
                        # 我们只需要存储前端发送的消息中，角色为"user"的最新消息
                        # 因为assistant的消息是由我们的API生成的，不需要重复存储
                        user_messages = [msg for msg in messages if msg.get("role") == "user"]
                        if user_messages:
                            # 只存储最新的用户消息
                            latest_user_message = user_messages[-1]
                            msg_id = str(uuid.uuid4())
                            new_message = self.Message(
                                id=msg_id,
                                session_id=session_id,
                                role=latest_user_message.get("role"),
                                content=latest_user_message.get("content")
                            )
                            db.add(new_message)
                            db.commit()
                            new_messages.append(latest_user_message)
                    else:
                        # 如果会话是空的，存储所有消息
                        for msg in messages:
                            msg_id = str(uuid.uuid4())
                            new_message = self.Message(
                                id=msg_id,
                                session_id=session_id,
                                role=msg.get("role"),
                                content=msg.get("content")
                            )
                            db.add(new_message)
                            new_messages.append(msg)
                        db.commit()
                    
                    # 获取完整的消息列表
                    for msg in session.messages:
                        full_messages.append({
                            "role": msg.role,
                            "content": msg.content
                        })
                else:
                    # 如果没有会话 ID，只使用当前消息
                    full_messages = messages
                
                # 检查是否配置了 API 密钥
                if not self.api_key:
                    # 模拟响应
                    ai_response = "这是模拟的 AI 聊天响应"
                    
                    # 保存模拟响应到数据库
                    if session_id:
                        msg_id = str(uuid.uuid4())
                        new_message = self.Message(
                            id=msg_id,
                            session_id=session_id,
                            role="assistant",
                            content=ai_response
                        )
                        db.add(new_message)
                        db.commit()
                        full_messages.append({"role": "assistant", "content": ai_response})
                    
                    return {
                        "messages": full_messages,
                        "response": ai_response,
                        "model": self.model,
                        "usage": {
                            "prompt_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages),
                            "completion_tokens": 50,
                            "total_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages) + 50
                        },
                        "session_id": session_id
                    }
                
                # 调用 DeepSeek API
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                payload = {
                    "model": self.model,
                    "messages": full_messages,
                    "temperature": 0.7,
                    "max_tokens": 1000,
                    "stream": False
                }
                
                # 非流式响应处理
                response = requests.post(
                    f"{self.api_base}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                # 检查响应状态
                if response.status_code != 200:
                    return {
                        "error": f"API 请求失败: {response.status_code} - {response.text}"
                    }
                
                # 处理响应
                result = response.json()
                ai_response = result["choices"][0]["message"]["content"]
                usage = result["usage"]
                
                # 保存 AI 响应到数据库
                if session_id:
                    msg_id = str(uuid.uuid4())
                    new_message = self.Message(
                        id=msg_id,
                        session_id=session_id,
                        role="assistant",
                        content=ai_response
                    )
                    db.add(new_message)
                    db.commit()
                    full_messages.append({"role": "assistant", "content": ai_response})
                
                return {
                    "messages": full_messages,
                    "response": ai_response,
                    "model": self.model,
                    "usage": {
                        "prompt_tokens": usage["prompt_tokens"],
                        "completion_tokens": usage["completion_tokens"],
                        "total_tokens": usage["total_tokens"]
                    },
                    "session_id": session_id
                }
            except Exception as e:
                db.rollback()
                return {
                    "error": str(e)
                }
            finally:
                db.close()
        else:
            # 使用内存存储
            if session_id:
                # 检查会话是否存在
                session_data = self.sessions.get(session_id)
                if not session_data:
                    # 创建新会话
                    self.sessions[session_id] = {
                        "messages": [],
                        "user_id": user_id
                    }
                    session_data = self.sessions[session_id]
                # 验证用户ID
                if user_id is not None and session_data.get("user_id") != user_id:
                    return {
                        "error": "Session not found or not owned by user"
                    }
                
                # 获取当前会话中已有的消息数量
                existing_message_count = len(session_data.get("messages", []))
                
                if existing_message_count > 0:
                    # 如果会话中已有消息，只存储新增的用户消息
                    # 假设前端发送的是完整的对话历史
                    # 我们只需要存储前端发送的消息中，角色为"user"的最新消息
                    user_messages = [msg for msg in messages if msg.get("role") == "user"]
                    if user_messages:
                        # 只存储最新的用户消息
                        latest_user_message = user_messages[-1]
                        session_data["messages"].append(latest_user_message)
                else:
                    # 如果会话是空的，存储所有消息
                    session_data["messages"].extend(messages)
                
                full_messages = session_data["messages"]
            else:
                # 如果没有会话 ID，只使用当前消息
                full_messages = messages
            
            # 检查是否配置了 API 密钥
            if not self.api_key:
                # 模拟响应
                ai_response = "这是模拟的 AI 聊天响应"
                
                # 保存模拟响应
                if session_id:
                    session_data = self.sessions.get(session_id)
                    if session_data:
                        session_data["messages"].append({"role": "assistant", "content": ai_response})
                
                return {
                    "messages": full_messages + [{"role": "assistant", "content": ai_response}],
                    "response": ai_response,
                    "model": self.model,
                    "usage": {
                        "prompt_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages),
                        "completion_tokens": 50,
                        "total_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages) + 50
                    },
                    "session_id": session_id
                }
            
            # 调用 DeepSeek API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            payload = {
                "model": self.model,
                "messages": full_messages,
                "temperature": 0.7,
                "max_tokens": 1000,
                "stream": False
            }
            
            # 非流式响应处理
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload
            )
            
            # 检查响应状态
            if response.status_code != 200:
                return {
                    "error": f"API 请求失败: {response.status_code} - {response.text}"
                }
            
            # 处理响应
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]
            usage = result["usage"]
            
            # 保存模拟响应
            if session_id:
                session_data = self.sessions.get(session_id)
                if session_data:
                    session_data["messages"].append({"role": "assistant", "content": ai_response})
            
            return {
                "messages": full_messages + [{"role": "assistant", "content": ai_response}],
                "response": ai_response,
                "model": self.model,
                "usage": {
                    "prompt_tokens": usage["prompt_tokens"],
                    "completion_tokens": usage["completion_tokens"],
                    "total_tokens": usage["total_tokens"]
                },
                "session_id": session_id
            }
    
    def _chat_completion_stream(self, messages: list, session_id: Optional[str] = None, user_id: Optional[int] = None, **kwargs):
        """
        流式聊天完成
        
        Args:
            messages: 消息列表
            session_id: 会话 ID（可选）
            user_id: 用户 ID（可选），用于验证会话所属权
            **kwargs: 其他参数
            
        Yields:
            流式响应块
        """
        full_messages = []
        
        if self.use_database:
            db = self.SessionLocal()
            try:
                # 处理会话
                if session_id:
                    # 检查会话是否存在，并验证用户 ID
                    query = db.query(self.DBSession).filter(self.DBSession.id == session_id)
                    if user_id:
                        query = query.filter(self.DBSession.user_id == user_id)
                    session = query.first()
                    if not session:
                        # 会话不存在或不属于该用户，返回错误
                        yield {
                            "error": "Session not found or not owned by user"
                        }
                        return
                    
                    # 获取当前会话中已有的消息数量
                    existing_message_count = len(session.messages)
                    
                    # 只保存新增的用户消息到数据库
                    # 假设前端发送的是完整的对话历史，我们只需要存储新增的消息
                    # 检查messages中哪些是新增的消息
                    new_messages = []
                    if existing_message_count > 0:
                        # 如果会话中已有消息，只存储新增的消息
                        # 假设前端发送的是完整的对话历史
                        # 我们只需要存储前端发送的消息中，角色为"user"的最新消息
                        # 因为assistant的消息是由我们的API生成的，不需要重复存储
                        user_messages = [msg for msg in messages if msg.get("role") == "user"]
                        if user_messages:
                            # 只存储最新的用户消息
                            latest_user_message = user_messages[-1]
                            msg_id = str(uuid.uuid4())
                            new_message = self.Message(
                                id=msg_id,
                                session_id=session_id,
                                role=latest_user_message.get("role"),
                                content=latest_user_message.get("content")
                            )
                            db.add(new_message)
                            db.commit()
                            new_messages.append(latest_user_message)
                    else:
                        # 如果会话是空的，存储所有消息
                        for msg in messages:
                            msg_id = str(uuid.uuid4())
                            new_message = self.Message(
                                id=msg_id,
                                session_id=session_id,
                                role=msg.get("role"),
                                content=msg.get("content")
                            )
                            db.add(new_message)
                            new_messages.append(msg)
                        db.commit()
                    
                    # 获取完整的消息列表
                    for msg in session.messages:
                        full_messages.append({
                            "role": msg.role,
                            "content": msg.content
                        })
                else:
                    # 如果没有会话 ID，只使用当前消息
                    full_messages = messages
                
                # 检查是否配置了 API 密钥
                if not self.api_key:
                    # 模拟响应
                    ai_response = "这是模拟的 AI 聊天响应"
                    
                    # 保存模拟响应到数据库
                    if session_id:
                        msg_id = str(uuid.uuid4())
                        new_message = self.Message(
                            id=msg_id,
                            session_id=session_id,
                            role="assistant",
                            content=ai_response
                        )
                        db.add(new_message)
                        db.commit()
                        full_messages.append({"role": "assistant", "content": ai_response})
                    
                    # 流式模拟响应
                    for char in ai_response:
                        yield {
                            "chunk": char,
                            "session_id": session_id
                        }
                    # 最终响应
                    yield {
                        "messages": full_messages,
                        "response": ai_response,
                        "model": self.model,
                        "usage": {
                            "prompt_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages),
                            "completion_tokens": 50,
                            "total_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages) + 50
                        },
                        "session_id": session_id,
                        "finish": True
                    }
                    return
                
                # 调用 DeepSeek API
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                
                payload = {
                    "model": self.model,
                    "messages": full_messages,
                    "temperature": 0.7,
                    "max_tokens": 1000,
                    "stream": True
                }
                
                # 流式响应处理
                response = requests.post(
                    f"{self.api_base}/chat/completions",
                    headers=headers,
                    json=payload,
                    stream=True
                )
                
                # 检查响应状态
                if response.status_code != 200:
                    yield {
                        "error": f"API 请求失败: {response.status_code} - {response.text}"
                    }
                    return
                
                # 保存完整响应的变量
                full_response = ""
                usage = None
                
                # 流式生成响应
                for chunk in response.iter_lines():
                    if chunk:
                        # 处理 SSE 格式
                        chunk = chunk.decode('utf-8')
                        if chunk.startswith('data: '):
                            chunk_data = chunk[6:]
                            if chunk_data == '[DONE]':
                                break
                            try:
                                import json
                                chunk_json = json.loads(chunk_data)
                                # 提取内容
                                delta = chunk_json['choices'][0]['delta']
                                if 'content' in delta:
                                    content = delta['content']
                                    full_response += content
                                    # 生成流式响应
                                    yield {
                                        "chunk": content,
                                        "session_id": session_id
                                    }
                                # 提取使用情况
                                if 'usage' in chunk_json:
                                    usage = chunk_json['usage']
                            except Exception as e:
                                pass
                
                # 保存完整响应到数据库
                if session_id and full_response:
                    msg_id = str(uuid.uuid4())
                    new_message = self.Message(
                        id=msg_id,
                        session_id=session_id,
                        role="assistant",
                        content=full_response
                    )
                    db.add(new_message)
                    db.commit()
                    full_messages.append({"role": "assistant", "content": full_response})
                
                # 生成最终响应
                yield {
                    "messages": full_messages,
                    "response": full_response,
                    "model": self.model,
                    "usage": usage or {
                        "prompt_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages),
                        "completion_tokens": len(full_response.split()),
                        "total_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages) + len(full_response.split())
                    },
                    "session_id": session_id,
                    "finish": True
                }
            except Exception as e:
                db.rollback()
                yield {
                    "error": str(e)
                }
            finally:
                db.close()
        else:
            # 使用内存存储
            if session_id:
                # 检查会话是否存在
                session_data = self.sessions.get(session_id)
                if not session_data:
                    # 创建新会话
                    self.sessions[session_id] = {
                        "messages": [],
                        "user_id": user_id
                    }
                    session_data = self.sessions[session_id]
                # 验证用户ID
                if user_id is not None and session_data.get("user_id") != user_id:
                    # 会话不存在或不属于该用户，返回错误
                    yield {
                        "error": "Session not found or not owned by user"
                    }
                    return
                
                # 获取当前会话中已有的消息数量
                existing_message_count = len(session_data.get("messages", []))
                
                if existing_message_count > 0:
                    # 如果会话中已有消息，只存储新增的用户消息
                    # 假设前端发送的是完整的对话历史
                    # 我们只需要存储前端发送的消息中，角色为"user"的最新消息
                    user_messages = [msg for msg in messages if msg.get("role") == "user"]
                    if user_messages:
                        # 只存储最新的用户消息
                        latest_user_message = user_messages[-1]
                        session_data["messages"].append(latest_user_message)
                else:
                    # 如果会话是空的，存储所有消息
                    session_data["messages"].extend(messages)
                
                full_messages = session_data["messages"]
            else:
                # 如果没有会话 ID，只使用当前消息
                full_messages = messages
            
            # 检查是否配置了 API 密钥
            if not self.api_key:
                # 模拟响应
                ai_response = "这是模拟的 AI 聊天响应"
                
                # 保存模拟响应
                if session_id:
                    session_data = self.sessions.get(session_id)
                    if session_data:
                        session_data["messages"].append({"role": "assistant", "content": ai_response})
                
                # 流式模拟响应
                for char in ai_response:
                    yield {
                        "chunk": char,
                        "session_id": session_id
                    }
                # 最终响应
                yield {
                    "messages": full_messages + [{"role": "assistant", "content": ai_response}],
                    "response": ai_response,
                    "model": self.model,
                    "usage": {
                        "prompt_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages),
                        "completion_tokens": 50,
                        "total_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages) + 50
                    },
                    "session_id": session_id,
                    "finish": True
                }
                return
            
            # 调用 DeepSeek API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            payload = {
                "model": self.model,
                "messages": full_messages,
                "temperature": 0.7,
                "max_tokens": 1000,
                "stream": True
            }
            
            # 流式响应处理
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload,
                stream=True
            )
            
            # 检查响应状态
            if response.status_code != 200:
                yield {
                    "error": f"API 请求失败: {response.status_code} - {response.text}"
                }
                return
            
            # 保存完整响应的变量
            full_response = ""
            usage = None
            
            # 流式生成响应
            for chunk in response.iter_lines():
                if chunk:
                    # 处理 SSE 格式
                    chunk = chunk.decode('utf-8')
                    if chunk.startswith('data: '):
                        chunk_data = chunk[6:]
                        if chunk_data == '[DONE]':
                            break
                        try:
                            import json
                            chunk_json = json.loads(chunk_data)
                            # 提取内容
                            delta = chunk_json['choices'][0]['delta']
                            if 'content' in delta:
                                content = delta['content']
                                full_response += content
                                # 生成流式响应
                                yield {
                                    "chunk": content,
                                    "session_id": session_id
                                }
                            # 提取使用情况
                            if 'usage' in chunk_json:
                                usage = chunk_json['usage']
                        except Exception as e:
                            pass
            
            # 保存完整响应
            if session_id and full_response:
                session_data = self.sessions.get(session_id)
                if session_data:
                    session_data["messages"].append({"role": "assistant", "content": full_response})
            
            # 生成最终响应
            yield {
                "messages": full_messages + [{"role": "assistant", "content": full_response}],
                "response": full_response,
                "model": self.model,
                "usage": usage or {
                    "prompt_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages),
                    "completion_tokens": len(full_response.split()),
                    "total_tokens": sum(len(msg.get("content", "").split()) for msg in full_messages) + len(full_response.split())
                },
                "session_id": session_id,
                "finish": True
            }
    
    def delete_session(self, session_id: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        删除会话
        
        Args:
            session_id: 会话 ID
            user_id: 用户 ID（可选），用于验证会话所属权
            
        Returns:
            删除结果
        """
        if self.use_database:
            db = self.SessionLocal()
            try:
                # 查询会话，添加用户 ID 验证
                query = db.query(self.DBSession).filter(self.DBSession.id == session_id)
                if user_id:
                    query = query.filter(self.DBSession.user_id == user_id)
                session = query.first()
                if not session:
                    return {"error": "Session not found or not owned by user"}
                
                # 删除会话（级联删除消息）
                db.delete(session)
                db.commit()
                
                return {"session_id": session_id}
            except Exception as e:
                db.rollback()
                return {"error": str(e)}
            finally:
                db.close()
        else:
            # 使用内存存储
            session_data = self.sessions.get(session_id)
            if not session_data:
                return {"error": "Session not found"}
            # 验证用户ID
            if user_id is not None and session_data.get("user_id") != user_id:
                return {"error": "Session not found or not owned by user"}
            del self.sessions[session_id]
            return {"session_id": session_id}
    
    def delete_message(self, session_id: str, message_index: int, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        删除会话内的消息
        
        Args:
            session_id: 会话 ID
            message_index: 消息索引
            user_id: 用户 ID（可选），用于验证会话所属权
            
        Returns:
            删除结果
        """
        if self.use_database:
            db = self.SessionLocal()
            try:
                # 查询会话，添加用户 ID 验证
                query = db.query(self.DBSession).filter(self.DBSession.id == session_id)
                if user_id:
                    query = query.filter(self.DBSession.user_id == user_id)
                session = query.first()
                if not session:
                    return {"error": "Session not found or not owned by user"}
                
                # 检查消息索引是否有效
                if message_index < 0 or message_index >= len(session.messages):
                    return {"error": "Invalid message index"}
                
                # 删除指定索引的消息
                message_to_delete = session.messages[message_index]
                db.delete(message_to_delete)
                db.commit()
                
                return {
                    "session_id": session_id,
                    "message_index": message_index
                }
            except Exception as e:
                db.rollback()
                return {"error": str(e)}
            finally:
                db.close()
        else:
            # 使用内存存储
            session_data = self.sessions.get(session_id)
            if not session_data:
                return {"error": "Session not found"}
            # 验证用户ID
            if user_id is not None and session_data.get("user_id") != user_id:
                return {"error": "Session not found or not owned by user"}
            messages = session_data.get("messages", [])
            if message_index < 0 or message_index >= len(messages):
                return {"error": "Invalid message index"}
            # 删除指定索引的消息
            del messages[message_index]
            
            return {
                "session_id": session_id,
                "message_index": message_index
            }
    
    def get_sessions(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        获取所有会话
        
        Args:
            user_id: 用户 ID（可选），用于验证会话所属权
            
        Returns:
            会话列表
        """
        if self.use_database:
            db = self.SessionLocal()
            try:
                # 查询会话，添加用户 ID 验证
                query = db.query(self.DBSession)
                if user_id:
                    query = query.filter(self.DBSession.user_id == user_id)
                sessions = query.order_by(self.DBSession.updated_at.desc()).all()
                
                # 构建会话列表
                sessions_list = []
                for session in sessions:
                    sessions_list.append({
                        "session_id": session.id,
                        "title": session.title,
                        "created_at": session.created_at.isoformat() if session.created_at else None,
                        "updated_at": session.updated_at.isoformat() if session.updated_at else None
                    })
                
                return {"sessions": sessions_list}
            except Exception as e:
                return {"error": str(e)}
            finally:
                db.close()
        else:
            # 使用内存存储
            sessions_list = []
            for session_id, session_data in self.sessions.items():
                # 验证用户ID
                if user_id is not None and session_data.get("user_id") != user_id:
                    continue
                sessions_list.append({
                    "session_id": session_id,
                    "title": "新会话",
                    "created_at": None,
                    "updated_at": None
                })
            
            return {"sessions": sessions_list}
    
    def update_session_title(self, session_id: str, title: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        更新会话标题
        
        Args:
            session_id: 会话 ID
            title: 新标题
            user_id: 用户 ID（可选），用于验证会话所属权
            
        Returns:
            更新结果
        """
        if self.use_database:
            db = self.SessionLocal()
            try:
                # 查询会话，添加用户 ID 验证
                query = db.query(self.DBSession).filter(self.DBSession.id == session_id)
                if user_id:
                    query = query.filter(self.DBSession.user_id == user_id)
                session = query.first()
                if not session:
                    return {"error": "Session not found or not owned by user"}
                
                # 更新标题
                session.title = title
                db.commit()
                
                return {
                    "session_id": session_id,
                    "title": title
                }
            except Exception as e:
                db.rollback()
                return {"error": str(e)}
            finally:
                db.close()
        else:
            # 使用内存存储
            session_data = self.sessions.get(session_id)
            if not session_data:
                return {"error": "Session not found"}
            # 验证用户ID
            if user_id is not None and session_data.get("user_id") != user_id:
                return {"error": "Session not found or not owned by user"}
            # 内存存储模式下，标题只是一个占位符
            return {
                "session_id": session_id,
                "title": title
            }