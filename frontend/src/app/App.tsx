import { useState, useEffect } from "react";
import { Header } from "@/app/components/Header";
import { HotCarousel } from "@/app/components/HotCarousel";
import { SearchBar } from "@/app/components/SearchBar";
import { CategoryTabs } from "@/app/components/CategoryTabs";
import { NewsList } from "@/app/components/NewsList";
import { BottomNav } from "@/app/components/BottomNav";
import { NewsDetail } from "@/app/components/NewsDetail";
import { AIAssistant } from "@/app/components/AIAssistant";
import { Login } from "@/app/components/Login";
import { Register } from "@/app/components/Register";
import { Profile } from "@/app/components/Profile";
import { PersonalInfo } from "@/app/components/PersonalInfo";
import { SearchResults } from "@/app/components/SearchResults";
import { Collection } from "@/app/components/Collection";
import { History } from "@/app/components/History";

export default function App() {
  const [currentPage, setCurrentPage] =
    useState<
      "home" | "detail" | "ai" | "profile" | "personalInfo" | "login" | "register" | "search" | "collection" | "history"
    >("home");
  const [selectedNewsId, setSelectedNewsId] = useState<
    number | null
  >(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<number>(0);

  // 检查本地存储的登录状态
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedEmail = localStorage.getItem("email");
    const savedUserId = localStorage.getItem("userId");
    const savedUserInfo = localStorage.getItem("userInfo");
    
    if (savedUsername || savedUserInfo) {
      // 优先从完整的userInfo中恢复数据
      if (savedUserInfo) {
        try {
          const userInfo = JSON.parse(savedUserInfo);
          if (userInfo.username) {
            setUsername(userInfo.username);
          }
          if (userInfo.email) {
            setEmail(userInfo.email);
          }
          if (userInfo.id) {
            setUserId(typeof userInfo.id === 'string' ? parseInt(userInfo.id) : userInfo.id);
          }
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      } else {
        // 从单独的存储项中恢复数据
        if (savedUsername) {
          setUsername(savedUsername);
        }
        if (savedEmail) {
          setEmail(savedEmail);
        }
        if (savedUserId) {
          setUserId(parseInt(savedUserId));
        }
      }
      setIsLoggedIn(true);
      setCurrentPage("home");
    }
  }, []);

  const handleLogin = (user: string, userEmail?: string, userUserId?: string, userInfo?: any) => {
    console.log('Login received:', { user, userEmail, userUserId, userInfo });
    setUsername(user);
    if (userEmail) {
      setEmail(userEmail);
    }
    if (userUserId) {
      setUserId(parseInt(userUserId));
    }
    setIsLoggedIn(true);
    localStorage.setItem("username", user);
    if (userEmail) {
      localStorage.setItem("email", userEmail);
    }
    if (userUserId) {
      localStorage.setItem("userId", userUserId);
    }
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      console.log('User info stored:', userInfo);
    }
    setCurrentPage("home");
  };

  const handleRegister = (user: string, userEmail?: string, userUserId?: string, userInfo?: any) => {
    console.log('Register received:', { user, userEmail, userUserId, userInfo });
    setUsername(user);
    if (userEmail) {
      setEmail(userEmail);
    }
    if (userUserId) {
      setUserId(parseInt(userUserId));
    }
    setIsLoggedIn(true);
    localStorage.setItem("username", user);
    if (userEmail) {
      localStorage.setItem("email", userEmail);
    }
    if (userUserId) {
      localStorage.setItem("userId", userUserId);
    }
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      console.log('User info stored:', userInfo);
    }
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setEmail("");
    setUserId("");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    localStorage.removeItem("userInfo");
    setCurrentPage("login");
  };

  const handleNewsClick = (id: number) => {
    setSelectedNewsId(id);
    setCurrentPage("detail");
  };

  const handleBack = () => {
    setCurrentPage("home");
    setSelectedNewsId(null);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "ai" && !isLoggedIn) {
      // 如果用户未登录且点击了AI助手，跳转到登录页
      setCurrentPage("login");
    } else {
      setCurrentPage(tab as "home" | "detail" | "ai" | "profile");
    }
  };

  const handleUserClick = () => {
    if (!isLoggedIn) {
      setCurrentPage("login");
    } else {
      setCurrentPage("profile");
    }
  };

  const handleBackToProfile = () => {
    setCurrentPage("profile");
  };

  const handleNavigateToCollection = () => {
    setCurrentPage("collection");
  };

  const handleNavigateToHistory = () => {
    setCurrentPage("history");
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage("search");
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
  };

  // 登录页面
  if (!isLoggedIn && currentPage === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setCurrentPage("register")}
        onTabChange={handleTabChange}
        onUserClick={handleUserClick}
      />
    );
  }

  // 注册页面
  if (!isLoggedIn && currentPage === "register") {
    return (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setCurrentPage("login")}
        onTabChange={handleTabChange}
        onUserClick={handleUserClick}
      />
    );
  }

  // AI助手页面
  if (currentPage === "ai") {
    return <AIAssistant onTabChange={handleTabChange} />;
  }

  // 新闻详情页面
  if (currentPage === "detail" && selectedNewsId) {
    return (
      <NewsDetail newsId={selectedNewsId} onBack={handleBack} userId={userId} />
    );
  }

  // 个人中心页面
  if (currentPage === "profile") {
    if (!isLoggedIn) {
      setCurrentPage("login");
      return null;
    }
    return (
      <Profile
        username={username}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        onNavigateToPersonalInfo={() => setCurrentPage("personalInfo")}
        onNavigateToCollection={handleNavigateToCollection}
        onNavigateToHistory={handleNavigateToHistory}
      />
    );
  }

  // 个人信息页面
  if (currentPage === "personalInfo") {
    console.log('PersonalInfo props:', { username, userId, email });
    return (
      <PersonalInfo
        username={username}
        account={userId || '未设置'}
        email={email || '未绑定'}
        onBack={handleBackToProfile}
        onLogout={handleLogout}
      />
    );
  }

  // 收藏页面
  if (currentPage === "collection") {
    return (
      <Collection
        onBack={handleBackToProfile}
        onNewsClick={handleNewsClick}
        userId={userId}
      />
    );
  }

  // 阅读历史页面
  if (currentPage === "history") {
    return (
      <History
        onBack={handleBackToProfile}
        onNewsClick={handleNewsClick}
        userId={userId}
      />
    );
  }

  // 搜索结果页面
  if (currentPage === "search") {
    return (
      <SearchResults 
        keyword={searchKeyword} 
        onNewsClick={handleNewsClick} 
        onBack={handleBackToHome} 
        onTabChange={handleTabChange}
      />
    );
  }

  // 首页
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header onUserClick={handleUserClick} />

      {/* Main Content */}
      <main className="pt-14 pb-16">
        {/* Hot News Carousel */}
        <div className="pt-4">
          <HotCarousel />
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />

        {/* Category Tabs */}
        <CategoryTabs onCategoryChange={setSelectedCategoryId} />

        {/* News List */}
        <NewsList onNewsClick={handleNewsClick} categoryId={selectedCategoryId} />
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab="home"
        onTabChange={handleTabChange}
      />
    </div>
  );
}