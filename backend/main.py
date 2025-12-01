"""
FastAPI后端服务 - ChatGLM API代理
支持流式输出和会话管理
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
import requests
from dotenv import load_dotenv
import os

# 加载环境变量 - 明确指定.env文件路径，处理BOM字符
env_path = os.path.join(os.path.dirname(__file__), '.env')
# 先读取文件内容，去除BOM，然后重新写入临时文件
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8-sig') as f:
        content = f.read()
    # 使用utf-8-sig编码自动去除BOM，或手动处理
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(content)
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="ChatGLM API Service")

# 配置CORS，允许前端访问
# 从环境变量读取允许的前端域名，支持多个域名
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.(pages\.dev|cloudflarepages\.app)$",  # 允许所有 Cloudflare Pages 域名
    allow_origins=allowed_origins,  # 允许指定的本地开发域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ChatGLM API配置
CHATGLM_API_BASE = "https://open.bigmodel.cn/api/paas/v4"
# 从环境变量读取API Key，去除前后空格
_api_key = os.getenv("CHATGLM_API_KEY") or os.getenv("ZHIPU_API_KEY")
CHATGLM_API_KEY = _api_key.strip() if _api_key else None
CHATGLM_MODEL = os.getenv("CHATGLM_MODEL", "glm-4.5-airx")  # 默认使用glm-4.5-airx（高性价比-极速版）

if not CHATGLM_API_KEY:
    print("警告: CHATGLM_API_KEY 环境变量未设置")


# 请求模型
class ChatMessage(BaseModel):
    role: str  # "user" 或 "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    stream: bool = True


class SuggestedRepliesRequest(BaseModel):
    conversation_history: List[ChatMessage]


class AgentProfileRequest(BaseModel):
    initial_prompt: str


# 会话存储（生产环境应使用Redis等）
chat_sessions: Dict[str, List[ChatMessage]] = {}


def get_chatglm_headers():
    """获取ChatGLM API请求头"""
    if not CHATGLM_API_KEY:
        raise HTTPException(status_code=500, detail="ChatGLM API Key未配置")
    # 确保API Key去除前后空格，并正确格式化Bearer token
    api_key = CHATGLM_API_KEY.strip()
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }


@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """
    流式聊天接口
    支持SSE格式的流式响应
    """
    if not CHATGLM_API_KEY:
        raise HTTPException(status_code=500, detail="ChatGLM API Key未配置")

    # 构建消息列表
    messages = []
    
    # 如果有system_prompt，添加到消息列表开头
    if request.system_prompt:
        messages.append({
            "role": "system",
            "content": request.system_prompt
        })
    
    # 添加用户消息
    for msg in request.messages:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })

    # 构建ChatGLM API请求
    model = request.model or CHATGLM_MODEL
    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }

    def generate():
        """生成流式响应"""
        try:
            response = requests.post(
                f"{CHATGLM_API_BASE}/chat/completions",
                headers=get_chatglm_headers(),
                json=payload,
                stream=True,
                timeout=60
            )
            
            if response.status_code != 200:
                error_text = response.text
                yield f"data: {json.dumps({'error': f'API错误: {error_text}'})}\n\n"
                return

            # 处理SSE流
            for line in response.iter_lines():
                if line:
                    line_text = line.decode('utf-8')
                    if line_text.startswith('data: '):
                        data_str = line_text[6:]  # 移除 "data: " 前缀
                        
                        if data_str.strip() == '[DONE]':
                            yield f"data: {json.dumps({'done': True})}\n\n"
                            break
                        
                        try:
                            data = json.loads(data_str)
                            # 提取增量内容
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                
                                if content:
                                    yield f"data: {json.dumps({'text': content})}\n\n"
                                
                                # 检查是否完成
                                finish_reason = data['choices'][0].get('finish_reason')
                                if finish_reason:
                                    # 发送使用统计（如果有）
                                    if 'usage' in data:
                                        yield f"data: {json.dumps({'usage': data['usage']})}\n\n"
                                    yield f"data: {json.dumps({'done': True})}\n\n"
                                    break
                        except json.JSONDecodeError as e:
                            # 忽略JSON解析错误，继续处理下一行
                            continue
                            
        except Exception as e:
            error_msg = f"流式响应错误: {str(e)}"
            yield f"data: {json.dumps({'error': error_msg})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/chat/completions")
async def chat_completions(request: ChatRequest):
    """
    非流式聊天接口（用于建议回复等）
    """
    if not CHATGLM_API_KEY:
        raise HTTPException(status_code=500, detail="ChatGLM API Key未配置")

    messages = []
    if request.system_prompt:
        messages.append({
            "role": "system",
            "content": request.system_prompt
        })
    
    for msg in request.messages:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })

    model = request.model or CHATGLM_MODEL
    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }

    try:
        response = requests.post(
            f"{CHATGLM_API_BASE}/chat/completions",
            headers=get_chatglm_headers(),
            json=payload,
            timeout=60
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API调用错误: {str(e)}")


@app.post("/api/suggested-replies")
async def get_suggested_replies(request: SuggestedRepliesRequest):
    """
    获取建议回复 - 优化版本，减少延迟
    """
    if not CHATGLM_API_KEY:
        return {"suggestions": []}

    # 构建对话历史（只取最近3轮对话以减少token数）
    recent_history = request.conversation_history[-6:] if len(request.conversation_history) > 6 else request.conversation_history
    conversation_text = "\n".join([
        f"{msg.role}: {msg.content}" for msg in recent_history
    ])

    messages = [
        {
            "role": "user",
            "content": f"""根据以下对话，为用户建议3个简短、相关且引人入胜的回复（每个回复不超过15字）。

对话:
{conversation_text}

请以JSON格式提供输出，格式为: {{"suggestions": ["回复1", "回复2", "回复3"]}}"""
        }
    ]

    payload = {
        "model": CHATGLM_MODEL,
        "messages": messages,
        "stream": False,
        "response_format": {"type": "json_object"},
        "temperature": 0.7,
        "max_tokens": 100  # 限制token数以加快响应
    }

    try:
        response = requests.post(
            f"{CHATGLM_API_BASE}/chat/completions",
            headers=get_chatglm_headers(),
            json=payload,
            timeout=8  # 减少超时时间从30秒到8秒
        )
        
        if response.status_code != 200:
            return {"suggestions": []}
        
        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        try:
            parsed = json.loads(content)
            return {"suggestions": parsed.get("suggestions", [])}
        except:
            return {"suggestions": []}
            
    except Exception as e:
        print(f"获取建议回复错误: {e}")
        return {"suggestions": []}


@app.post("/api/agent-profile")
async def create_agent_profile(request: AgentProfileRequest):
    """
    创建智能体配置
    """
    if not CHATGLM_API_KEY:
        return {
            "name": "新智能体",
            "description": request.initial_prompt,
            "systemPrompt": "你是一个乐于助人的AI助手。"
        }

    messages = [
        {
            "role": "user",
            "content": f"""根据用户的初始请求，为AI智能体创建一个角色。该角色应包括一个简短、引人注目的中文名称、一句中文描述以及一个定义其角色和个性的系统提示。

用户请求: "{request.initial_prompt}"

请以JSON格式提供输出，格式为: {{"name": "名称", "description": "描述", "systemPrompt": "系统提示"}}"""
        }
    ]

    payload = {
        "model": CHATGLM_MODEL,
        "messages": messages,
        "stream": False,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(
            f"{CHATGLM_API_BASE}/chat/completions",
            headers=get_chatglm_headers(),
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        
        try:
            parsed = json.loads(content)
            return {
                "name": parsed.get("name", "新智能体"),
                "description": parsed.get("description", request.initial_prompt),
                "systemPrompt": parsed.get("systemPrompt", "你是一个乐于助人的AI助手。")
            }
        except:
            return {
                "name": "新智能体",
                "description": request.initial_prompt,
                "systemPrompt": "你是一个乐于助人的AI助手。"
            }
            
    except Exception as e:
        print(f"创建智能体配置错误: {e}")
        return {
            "name": "新智能体",
            "description": request.initial_prompt,
            "systemPrompt": "你是一个乐于助人的AI助手。"
        }


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "ok",
        "api_key_configured": bool(CHATGLM_API_KEY),
        "model": CHATGLM_MODEL
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

