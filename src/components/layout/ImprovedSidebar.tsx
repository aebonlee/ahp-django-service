import React, { useState } from 'react';
import UIIcon from '../common/UIIcon';
import type { UserRole } from '../../types';

interface ImprovedSidebarProps {
  isCollapsed: boolean;
  userRole: UserRole | null;
  viewMode?: 'service' | 'evaluator';
  activeTab: string;
  onTabChange: (tab: string) => void;
  canSwitchModes?: boolean;
  onModeSwitch?: (mode: 'service' | 'evaluator') => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  shortcut?: string;
}

interface MenuSection {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
  collapsible?: boolean;
}

const ImprovedSidebar: React.FC<ImprovedSidebarProps> = ({ 
  isCollapsed, 
  userRole, 
  viewMode, 
  activeTab, 
  onTabChange, 
  canSwitchModes, 
  onModeSwitch 
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['research', 'tools']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // 연구자용 메뉴 구성
  const researcherMenuSections: MenuSection[] = [
    {
      id: 'research',
      title: '연구 프로젝트',
      icon: '🔬',
      items: [
        { id: 'dashboard', label: '대시보드', icon: '🏠', shortcut: 'Ctrl+H' },
        { id: 'project-creation', label: '새 연구 시작', icon: '➕', shortcut: 'Ctrl+N' },
        { id: 'my-projects', label: '내 프로젝트', icon: '📋', shortcut: 'Ctrl+P' },
        { id: 'model-builder', label: '모델 설계', icon: '🏗️', shortcut: 'Ctrl+M' }
      ]
    },
    {
      id: 'data',
      title: '데이터 수집',
      icon: '📊',
      items: [
        { id: 'evaluator-management', label: '평가자 관리', icon: '👥' },
        { id: 'progress-monitoring', label: '수집 모니터링', icon: '📈' },
        { id: 'demographic-survey', label: '표본 특성 조사', icon: '📝' }
      ]
    },
    {
      id: 'analysis',
      title: '분석 및 결과',
      icon: '🧠',
      items: [
        { id: 'results-analysis', label: '결과 분석', icon: '📊' },
        { id: 'export-reports', label: '보고서 출력', icon: '📄' },
        { id: 'workshop-management', label: '전문가 워크숍', icon: '🎯' }
      ]
    },
    {
      id: 'tools',
      title: '연구 도구',
      icon: '🛠️',
      collapsible: true,
      items: [
        { id: 'ai-chatbot', label: 'AI 연구 도우미', icon: '🤖', badge: 'NEW' },
        { id: 'ai-materials', label: 'AI 자료 생성', icon: '📚' },
        { id: 'ai-interpretation', label: 'AI 결과 해석', icon: '🔍' },
        { id: 'evaluation-test', label: '평가 도구 검증', icon: '🧪' }
      ]
    },
    {
      id: 'support',
      title: '지원 및 설정',
      icon: '⚙️',
      collapsible: true,
      items: [
        { id: 'researcher-guide', label: '연구 가이드', icon: '📖' },
        { id: 'personal-settings', label: '환경 설정', icon: '⚙️' },
        { id: 'connection-test', label: '연결 테스트', icon: '🔧' }
      ]
    }
  ];

  // 평가자용 메뉴 구성 (더 단순화)
  const evaluatorMenuSections: MenuSection[] = [
    {
      id: 'evaluation',
      title: '평가 참여',
      icon: '✏️',
      items: [
        { id: 'dashboard', label: '평가자 대시보드', icon: '🏠' },
        { id: 'assigned-projects', label: '참여 연구', icon: '📋' },
        { id: 'pairwise-evaluation', label: '쌍대비교 평가', icon: '⚖️' },
        { id: 'direct-evaluation', label: '직접입력 평가', icon: '📝' }
      ]
    },
    {
      id: 'history',
      title: '평가 이력',
      icon: '📚',
      items: [
        { id: 'my-evaluations', label: '내 평가 현황', icon: '📊' },
        { id: 'evaluation-history', label: '평가 완료 이력', icon: '✅' }
      ]
    },
    {
      id: 'help',
      title: '도움말',
      icon: '❓',
      collapsible: true,
      items: [
        { id: 'evaluation-guide', label: '평가 가이드', icon: '📖' },
        { id: 'evaluator-settings', label: '평가자 설정', icon: '⚙️' }
      ]
    }
  ];

  const currentMenuSections = viewMode === 'evaluator' ? evaluatorMenuSections : researcherMenuSections;

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        {!isCollapsed ? (
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <UIIcon 
                emoji={viewMode === 'evaluator' ? '✏️' : '🔬'} 
                size="lg" 
                color="primary" 
              />
              {viewMode === 'evaluator' ? '평가자 모드' : '연구자 모드'}
            </h2>
            {canSwitchModes && (
              <button
                onClick={() => onModeSwitch?.(viewMode === 'evaluator' ? 'service' : 'evaluator')}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <UIIcon emoji="🔄" size="xs" />
                모드 전환
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <UIIcon 
              emoji={viewMode === 'evaluator' ? '✏️' : '🔬'} 
              size="xl" 
              color="primary" 
            />
          </div>
        )}
      </div>

      {/* 메뉴 섹션 */}
      <div className="flex-1 overflow-y-auto py-4">
        {currentMenuSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const showContent = !section.collapsible || isExpanded;

          return (
            <div key={section.id} className="mb-6">
              {/* 섹션 헤더 */}
              {!isCollapsed && (
                <div 
                  className={`px-4 mb-2 flex items-center justify-between ${
                    section.collapsible ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={section.collapsible ? () => toggleSection(section.id) : undefined}
                >
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <UIIcon emoji={section.icon} size="sm" color="muted" />
                    {section.title}
                  </h3>
                  {section.collapsible && (
                    <UIIcon 
                      emoji={isExpanded ? '🔽' : '▶️'} 
                      size="xs" 
                      color="muted" 
                    />
                  )}
                </div>
              )}

              {/* 메뉴 아이템 */}
              {showContent && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors group ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <UIIcon 
                          emoji={item.icon} 
                          size="lg" 
                          color={isActive ? 'primary' : 'secondary'}
                          className={isActive ? '' : 'group-hover:text-blue-600'}
                        />
                        
                        {!isCollapsed && (
                          <>
                            <span className={`flex-1 font-medium ${
                              isActive ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {item.label}
                            </span>
                            
                            {/* 뱃지 */}
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                                {item.badge}
                              </span>
                            )}
                            
                            {/* 단축키 */}
                            {item.shortcut && (
                              <span className="text-xs text-gray-400 font-mono">
                                {item.shortcut}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 정보 */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">AHP Research Platform</div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>시스템 정상</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedSidebar;