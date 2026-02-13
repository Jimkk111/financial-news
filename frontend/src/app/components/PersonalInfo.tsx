import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface PersonalInfoProps {
  username: string;
  account: string | number;
  email: string;
  onBack: () => void;
  onLogout: () => void;
}

export function PersonalInfo({ username, account, email, onBack, onLogout }: PersonalInfoProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/>
              <path d="m12 19-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">个人信息</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col items-center mb-6">
            <button 
              className="w-20 h-20 bg-transparent rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow mb-4"
            >
              <User className="text-gray-600" size={40} />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{username}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Id</span>
              <span className="text-gray-900 font-medium">{account}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">用户名</span>
              <span className="text-gray-900 font-medium">{username}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">邮箱</span>
              <span className="text-gray-900 font-medium">{email}</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={onLogout}
              className="w-full py-3 bg-transparent text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors border border-red-600"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
