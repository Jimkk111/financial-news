import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, type LoginRequest } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";

interface LoginProps {
  onLogin: (
    username: string,
    email?: string,
    userId?: string,
    userInfo?: any,
  ) => void;
  onSwitchToRegister: () => void;
  onTabChange: (tab: string) => void;
  onUserClick: () => void;
}

export function Login({
  onLogin,
  onSwitchToRegister,
  onTabChange,
  onUserClick,
}: LoginProps) {
  const { login: authLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("请输入用户名或邮箱");
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

    try {
      setLoading(true);

      // 调用登录API
      const loginRequest: LoginRequest = {
        username: username.trim(),
        password,
      };

      const response = await login(loginRequest);

      if (response.success && response.data) {
        // 登录成功
        console.log("Login API response:", response);

        // 更新全局 AuthContext
        authLogin(response.data.access_token, response.data.user);

        const userData = response.data.user;
        console.log("Extracted user data:", userData);

        onLogin(
          userData.username,
          userData.email,
          userData.id.toString(),
          rememberMe ? userData : undefined,
        );
      } else {
        // 登录失败
        setError(response.error?.message || "登录失败，请检查用户名和密码");
      }
    } catch (err) {
      console.error("登录错误:", err);
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // 返回首页
    onTabChange("home");
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

          <h1 className="text-lg font-semibold text-gray-900">登录</h1>

          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-6 px-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
            <p className="text-gray-600 text-sm">登录您的账号，继续精彩体验</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名或邮箱
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名或邮箱"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
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
                    placeholder="请输入密码"
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

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">记住我</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  忘记密码？
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "登录中..." : "登录"}
              </button>
            </form>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-gray-600 text-sm">还没有账号？</span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm ml-1"
            >
              立即注册
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-400 text-xs">
            <p>
              登录即表示同意{" "}
              <a href="#" className="text-blue-600">
                用户协议
              </a>{" "}
              和{" "}
              <a href="#" className="text-blue-600">
                隐私政策
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
