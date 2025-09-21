import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useColorTheme, ColorTheme } from '../../hooks/useColorTheme';
import { API_BASE_URL } from '../../config/api';

interface PersonalSettingsProps {
  user: {
    id: string | number;  // 백엔드는 number로 보냄
    first_name: string;
    last_name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'service_tester' | 'evaluator';
    admin_type?: 'super' | 'personal';
  };
  onBack?: () => void;
  onUserUpdate?: (updatedUser: {
    id: string | number;  // 백엔드는 number로 보냄
    first_name: string;
    last_name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'service_tester' | 'evaluator';
    admin_type?: 'super' | 'personal';
  }) => void;
}

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    organization: string;
    department: string;
    phone: string;
    profileImage: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  workflow: {
    autoSaveInterval: number;
    defaultTemplate: string;
    screenLayout: string;
    defaultViewMode: string;
    showTutorials: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    evaluationComplete: boolean;
    projectStatusChange: boolean;
    weeklyReport: boolean;
    systemUpdates: boolean;
    deadlineReminders: boolean;
  };
  display: {
    theme: ColorTheme | 'auto';
    darkMode: boolean;
    language: string;
    dateFormat: string;
    numberFormat: string;
    timezone: string;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'team';
    showEmail: boolean;
    showPhone: boolean;
    activityTracking: boolean;
  };
}

const PersonalSettings: React.FC<PersonalSettingsProps> = ({ user, onBack, onUserUpdate }) => {
  const { currentTheme, changeColorTheme } = useColorTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'workflow' | 'notifications' | 'display' | 'privacy' | 'data'>('profile');
  
  // 서버 기반 사용자 설정 초기화 (localStorage 완전 제거)
  const getInitialSettings = (): UserSettings => {
    return {
      profile: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        organization: '',
        department: '',
        phone: '',
        profileImage: ''
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30,
        loginAlerts: true
      },
      workflow: {
        autoSaveInterval: 60,
        defaultTemplate: 'standard',
        screenLayout: 'standard',
        defaultViewMode: 'grid',
        showTutorials: true
      },
      notifications: {
        emailNotifications: true,
        evaluationComplete: true,
        projectStatusChange: true,
        weeklyReport: false,
        systemUpdates: false,
        deadlineReminders: true
      },
      display: {
        theme: currentTheme,
        darkMode: false,
        language: 'ko',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: '1,234.56',
        timezone: 'Asia/Seoul'
      },
      privacy: {
        profileVisibility: 'team',
        showEmail: false,
        showPhone: false,
        activityTracking: true
      }
    };
  };
  
  const [settings, setSettings] = useState<UserSettings>(getInitialSettings());

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 서버에서 사용자 설정 로드 (localStorage 제거됨)
  useEffect(() => {
    const loadUserDataFromAPI = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ API에서 사용자 설정 로드 성공');
          
          if (data.user) {
            const apiSettings = {
              profile: {
                firstName: data.user.first_name || settings.profile.firstName,
                lastName: data.user.last_name || settings.profile.lastName,
                email: data.user.email || settings.profile.email,
                phone: data.user.phone || settings.profile.phone,
                organization: data.user.organization || settings.profile.organization,
                department: data.user.department || settings.profile.department,
                profileImage: data.user.profile_image || settings.profile.profileImage
              },
              security: settings.security,
              workflow: settings.workflow,
              notifications: data.user.notifications || settings.notifications,
              display: {
                ...settings.display,
                theme: data.user.theme || settings.display.theme,
                language: data.user.language || settings.display.language
              },
              privacy: settings.privacy
            };
            
            setSettings(apiSettings);
            
            // 사용자 정보 업데이트 콜백 호출
            if (onUserUpdate && (data.user.first_name !== user.first_name || data.user.last_name !== user.last_name)) {
              onUserUpdate({
                ...user,
                first_name: data.user.first_name,
                last_name: data.user.last_name
              });
            }
          }
        } else if (response.status === 404) {
          console.log('⚠️ 사용자 프로필이 DB에 없음 - 초기 설정 사용');
          // DB에 프로필이 없으면 현재 설정을 저장
          saveSettingsToAPI();
        }
      } catch (error) {
        console.warn('📴 API 연결 실패:', error);
        // API 실패 시 기본 설정 유지
      }
    };

    loadUserDataFromAPI();
  }, []);

  // 설정을 API로 저장 (localStorage 완전 제거)
  const saveSettingsToAPI = async () => {
    setSaveStatus('saving');
    
    try {
      // 테마 설정 적용 (즉시)
      if (settings.display.theme !== 'auto' && settings.display.theme !== currentTheme) {
        changeColorTheme(settings.display.theme);
      }

      // 사용자 정보 변경 시 즉시 UI 업데이트
      const isNameChanged = settings.profile.firstName !== user.first_name || settings.profile.lastName !== user.last_name;
      console.log('🔍 PersonalSettings: 이름 변경 체크', {
        현재이름: `${user.first_name} ${user.last_name}`,
        새이름: `${settings.profile.firstName} ${settings.profile.lastName}`,
        변경됨: isNameChanged,
        onUserUpdate존재: !!onUserUpdate
      });
      
      if (isNameChanged && onUserUpdate) {
        // 즉시 상위 컴포넌트에 변경사항 알림
        const updatedUser = {
          ...user,
          first_name: settings.profile.firstName,
          last_name: settings.profile.lastName,
          _updated: Date.now()
        };
        console.log('🔄 PersonalSettings: 즉시 UI 업데이트!', updatedUser);
        onUserUpdate(updatedUser);
      }

      // API로 서버에 저장
      const requestData = {
        first_name: settings.profile.firstName,
        last_name: settings.profile.lastName,
        email: settings.profile.email,
        phone: settings.profile.phone,
        organization: settings.profile.organization,
        department: settings.profile.department,
        notifications: settings.notifications,
        theme: settings.display.theme,
        language: settings.display.language
      };

      console.log('💾 API로 사용자 설정 저장 시작');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        console.log('✅ API 설정 저장 성공');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error('API 저장 실패');
      }
    } catch (error) {
      console.error('❌ 설정 저장 실패:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 데이터 가져오기 함수
  const handleDataImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (window.confirm('가져온 데이터로 현재 설정을 덮어쓰시겠습니까?')) {
        setSettings(importData.settings || importData);
        await saveSettingsToAPI();
        alert('설정을 성공적으로 가져왔습니다.');
      }
    } catch (error) {
      alert('파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  // 데이터 내보내기 함수
  const handleDataExport = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      settings
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahp-settings-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 비밀번호 변경 함수
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        alert(error.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  // 계정 삭제 함수
  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    if (!window.confirm('모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('계정이 삭제되었습니다.');
        // 로그아웃 처리
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(error.message || '계정 삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('계정 삭제 중 오류가 발생했습니다.');
    }
  };

  const updateSettings = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving': return '저장 중...';
      case 'saved': return '저장됨';
      case 'error': return '저장 실패';
      default: return '저장';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving': return 'bg-yellow-500';
      case 'saved': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const tabs = [
    { id: 'profile', label: '프로필', icon: '👤' },
    { id: 'security', label: '보안', icon: '🔒' },
    { id: 'workflow', label: '워크플로우', icon: '⚙️' },
    { id: 'notifications', label: '알림', icon: '🔔' },
    { id: 'display', label: '표시', icon: '🎨' },
    { id: 'privacy', label: '개인정보', icon: '🛡️' },
    { id: 'data', label: '데이터 관리', icon: '💾' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">개인 설정</h1>
          <p className="text-gray-600 mt-1">계정 정보와 개인 환경설정을 관리합니다 (서버 기반)</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={onBack}
            className="flex items-center"
          >
            ← 뒤로
          </Button>
          
          <Button
            variant="primary"
            onClick={saveSettingsToAPI}
            disabled={saveStatus === 'saving'}
            className={`flex items-center ${getSaveStatusColor()}`}
          >
            💾 {getSaveStatusText()}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 사이드바 탭 */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card title="프로필 정보">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                    <input
                      type="text"
                      value={settings.profile.firstName}
                      onChange={(e) => updateSettings('profile', 'firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">성</label>
                    <input
                      type="text"
                      value={settings.profile.lastName}
                      onChange={(e) => updateSettings('profile', 'lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                    <input
                      type="tel"
                      value={settings.profile.phone}
                      onChange={(e) => updateSettings('profile', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">조직</label>
                    <input
                      type="text"
                      value={settings.profile.organization}
                      onChange={(e) => updateSettings('profile', 'organization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
                    <input
                      type="text"
                      value={settings.profile.department}
                      onChange={(e) => updateSettings('profile', 'department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card title="보안 설정">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">비밀번호 변경</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button variant="primary" onClick={handlePasswordChange}>
                      비밀번호 변경
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">보안 옵션</h3>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorEnabled}
                        onChange={(e) => updateSettings('security', 'twoFactorEnabled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2">2단계 인증 사용</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.loginAlerts}
                        onChange={(e) => updateSettings('security', 'loginAlerts', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2">로그인 알림 받기</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'workflow' && (
            <Card title="워크플로우 설정">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">자동 저장 간격 (초)</label>
                  <select
                    value={settings.workflow.autoSaveInterval}
                    onChange={(e) => updateSettings('workflow', 'autoSaveInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30초</option>
                    <option value={60}>1분</option>
                    <option value={120}>2분</option>
                    <option value={300}>5분</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기본 템플릿</label>
                  <select
                    value={settings.workflow.defaultTemplate}
                    onChange={(e) => updateSettings('workflow', 'defaultTemplate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">표준</option>
                    <option value="academic">학술</option>
                    <option value="business">비즈니스</option>
                  </select>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.workflow.showTutorials}
                    onChange={(e) => updateSettings('workflow', 'showTutorials', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2">튜토리얼 표시</span>
                </label>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card title="알림 설정">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2">이메일 알림 받기</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.evaluationComplete}
                    onChange={(e) => updateSettings('notifications', 'evaluationComplete', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2">평가 완료 알림</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.projectStatusChange}
                    onChange={(e) => updateSettings('notifications', 'projectStatusChange', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2">프로젝트 상태 변경 알림</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.deadlineReminders}
                    onChange={(e) => updateSettings('notifications', 'deadlineReminders', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2">마감일 알림</span>
                </label>
              </div>
            </Card>
          )}

          {activeTab === 'display' && (
            <Card title="표시 설정">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
                  <select
                    value={settings.display.language}
                    onChange={(e) => updateSettings('display', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">날짜 형식</label>
                  <select
                    value={settings.display.dateFormat}
                    onChange={(e) => updateSettings('display', 'dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YYYY-MM-DD">2024-01-01</option>
                    <option value="MM/DD/YYYY">01/01/2024</option>
                    <option value="DD/MM/YYYY">01/01/2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시간대</label>
                  <select
                    value={settings.display.timezone}
                    onChange={(e) => updateSettings('display', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Seoul">한국 표준시 (KST)</option>
                    <option value="UTC">협정 세계시 (UTC)</option>
                    <option value="America/New_York">미국 동부시간 (EST)</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card title="개인정보 설정">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">프로필 공개 범위</label>
                  <select
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => updateSettings('privacy', 'profileVisibility', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">공개</option>
                    <option value="team">팀 내 공개</option>
                    <option value="private">비공개</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showEmail}
                      onChange={(e) => updateSettings('privacy', 'showEmail', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2">이메일 주소 표시</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showPhone}
                      onChange={(e) => updateSettings('privacy', 'showPhone', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2">전화번호 표시</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.privacy.activityTracking}
                      onChange={(e) => updateSettings('privacy', 'activityTracking', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2">활동 추적 허용</span>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card title="데이터 관리">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">데이터 백업 및 복원</h3>
                  <div className="flex space-x-4">
                    <Button variant="primary" onClick={handleDataExport}>
                      📥 설정 내보내기
                    </Button>
                    <label className="cursor-pointer">
                      <Button variant="secondary">
                        📤 설정 가져오기
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleDataImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 text-red-600">위험 구역</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 mb-4">
                      계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                    </p>
                    <Button variant="error" onClick={handleDeleteAccount}>
                      ⚠️ 계정 삭제
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalSettings;