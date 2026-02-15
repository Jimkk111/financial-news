import { useState, useEffect } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import {
  register,
  sendCode,
  type RegisterRequest,
} from "@/services/userService";

interface RegisterProps {
  onRegister: (
    username: string,
    email?: string,
    userId?: string,
    userInfo?: any,
  ) => void;
  onSwitchToLogin: () => void;
  onTabChange: (tab: string) => void;
  onUserClick: () => void;
}

export function Register({
  onRegister,
  onSwitchToLogin,
  onTabChange,
  onUserClick,
}: RegisterProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [avatar, setAvatar] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 验证码倒计时相关
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    setError("");

    if (!email) {
      setError("请输入邮箱");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入正确的邮箱地址");
      return;
    }

    try {
      setIsSending(true);
      const res = await sendCode(email);
      if (res.success) {
        setCountdown(60);
        // 这里可以使用 toast 提示发送成功，目前先用 console
        console.log("验证码发送成功");
      } else {
        setError(res.error?.message || "验证码发送失败");
      }
    } catch (e) {
      setError("验证码发送失败，请稍后重试");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }

    if (username.length < 2 || username.length > 20) {
      setError("用户名长度应为2-20个字符");
      return;
    }

    if (!email) {
      setError("请输入邮箱");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入正确的邮箱地址");
      return;
    }

    if (!code) {
      setError("请输入验证码");
      return;
    }

    if (!password) {
      setError("请输入密码");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少为6位");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (!agreedToTerms) {
      setError("请阅读并同意用户协议和隐私政策");
      return;
    }

    try {
      setLoading(true);

      // 调用注册API
      const registerRequest: RegisterRequest = {
        username: username.trim(),
        email: email.trim(),
        password,
        code,
        avatar: avatar.trim() || undefined,
      };

      const response = await register(registerRequest);

      if (response.success && response.data) {
        // 注册成功
        console.log("Register API response:", response);
        const userData = response.data;
        console.log("Extracted user data:", userData);
        onRegister(
          userData.username,
          userData.email,
          userData.id.toString(),
          userData,
        );
      } else {
        // 注册失败
        setError(response.error?.message || "注册失败，请稍后重试");
      }
    } catch (err) {
      console.error("注册错误:", err);
      setError("注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // 返回登录页
    onSwitchToLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">注册</h1>

          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-6 px-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">创建账号</h1>
            <p className="text-gray-600 text-sm">
              加入AI金融快讯，开启智能投资之旅
            </p>
          </div>

          {/* Register Form */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名 (2-20个字符)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
              </div>

              {/* Verification Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  验证码
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSending || countdown > 0}
                    className="px-4 py-3 bg-blue-50 text-blue-600 font-medium rounded-xl hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-w-[100px]"
                  >
                    {countdown > 0
                      ? `${countdown}s后重发`
                      : isSending
                        ? "发送中..."
                        : "发送验证码"}
                  </button>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码 (至少6位)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Avatar Input (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  头像 (可选)
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="请输入头像URL (可选)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Terms Agreement */}
              <div>
                <label className="flex items-start cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    {agreedToTerms && (
                      <Check
                        className="absolute text-white pointer-events-none"
                        size={14}
                      />
                    )}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    我已阅读并同意
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {" "}
                      用户协议{" "}
                    </a>
                    和
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {" "}
                      隐私政策
                    </a>
                  </span>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "注册中..." : "注册"}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-gray-600 text-sm">已有账号？</span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm ml-1"
            >
              立即登录
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-400 text-xs">
            <p>注册即表示同意相关条款</p>
          </div>
        </div>
      </main>
    </div>
  );
}
