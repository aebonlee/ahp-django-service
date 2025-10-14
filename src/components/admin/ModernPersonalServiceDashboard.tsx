import React, { useState } from 'react';
import UIIcon from '../common/UIIcon';
import UIButton, { PrimaryButton, SecondaryButton } from '../common/UIButton';
import type { User, Project } from '../../types';

interface ModernPersonalServiceDashboardProps {
  user: User;
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
  onTabChange: (tab: string) => void;
}

const ModernPersonalServiceDashboard: React.FC<ModernPersonalServiceDashboardProps> = ({
  user,
  projects,
  onCreateProject,
  onSelectProject,
  onTabChange
}) => {
  // Remove unused state - was for future feature

  // 프로젝트 상태 계산
  const activeProjects = projects.filter(p => 
    p.status === 'evaluation_in_progress' || p.status === 'model_building' || p.status === 'evaluator_assignment'
  );
  const completedProjects = projects.filter(p => 
    p.status === 'evaluation_complete' || p.status === 'results_available'
  );
  const totalEvaluators = projects.reduce((sum, p) => sum + (p.evaluator_count || 0), 0);

  // 최근 프로젝트 (최대 3개)
  const recentProjects = projects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* 헤더 섹션 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UIIcon emoji="🏠" size="2xl" color="primary" />
            연구자 대시보드
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            안녕하세요, <span className="font-semibold text-gray-800">{user.first_name || user.username}</span>님! 
            오늘도 의미있는 연구를 시작해보세요.
          </p>
        </div>
        <div className="flex gap-3">
          <PrimaryButton
            iconEmoji="➕"
            onClick={onCreateProject}
            size="lg"
          >
            새 연구 시작
          </PrimaryButton>
          <SecondaryButton
            iconEmoji="📊"
            onClick={() => onTabChange('results-analysis')}
            size="lg"
          >
            분석 결과
          </SecondaryButton>
        </div>
      </div>

      {/* 연구 현황 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="ui-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 연구</p>
              <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-500">개의 프로젝트</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UIIcon emoji="📋" size="xl" color="primary" />
            </div>
          </div>
        </div>

        <div className="ui-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">진행중</p>
              <p className="text-3xl font-bold text-green-600">{activeProjects.length}</p>
              <p className="text-sm text-gray-500">활성 연구</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UIIcon emoji="🚀" size="xl" color="success" />
            </div>
          </div>
        </div>

        <div className="ui-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료</p>
              <p className="text-3xl font-bold text-purple-600">{completedProjects.length}</p>
              <p className="text-sm text-gray-500">연구 완료</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <UIIcon emoji="✅" size="xl" color="success" />
            </div>
          </div>
        </div>

        <div className="ui-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">참여자</p>
              <p className="text-3xl font-bold text-orange-600">{totalEvaluators}</p>
              <p className="text-sm text-gray-500">총 평가자</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <UIIcon emoji="👥" size="xl" color="warning" />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 최근 연구 프로젝트 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="ui-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UIIcon emoji="📊" size="lg" color="primary" />
                최근 연구 프로젝트
              </h2>
              <SecondaryButton 
                onClick={() => onTabChange('my-projects')}
                size="sm"
              >
                전체 보기
              </SecondaryButton>
            </div>

            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => onSelectProject(String(project.id))}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <UIIcon emoji="📅" size="xs" />
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <UIIcon emoji="👥" size="xs" />
                          {project.evaluator_count || 0}명 참여
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'evaluation_in_progress' || project.status === 'model_building' || project.status === 'evaluator_assignment' ? 'bg-green-100 text-green-800' :
                          project.status === 'evaluation_complete' || project.status === 'results_available' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status === 'evaluation_in_progress' || project.status === 'model_building' || project.status === 'evaluator_assignment' ? '진행중' :
                           project.status === 'evaluation_complete' || project.status === 'results_available' ? '완료' : '대기중'}
                        </span>
                      </div>
                    </div>
                    <UIIcon 
                      emoji="🔍" 
                      size="lg" 
                      color="secondary" 
                      className="ml-4"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UIIcon emoji="📋" size="4xl" color="muted" className="mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 연구 프로젝트가 없습니다</h3>
                <p className="text-gray-600 mb-4">첫 번째 AHP 연구를 시작해보세요!</p>
                <PrimaryButton
                  iconEmoji="➕"
                  onClick={onCreateProject}
                >
                  첫 연구 시작하기
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>

        {/* 사이드 패널 - 빠른 액션 및 가이드 */}
        <div className="space-y-6">
          {/* 빠른 액션 */}
          <div className="ui-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UIIcon emoji="⚡" size="lg" color="warning" />
              빠른 작업
            </h3>
            <div className="space-y-3">
              <UIButton
                variant="ghost"
                fullWidth
                iconEmoji="🏗️"
                onClick={() => onTabChange('model-builder')}
                className="justify-start"
              >
                AHP 모델 설계
              </UIButton>
              <UIButton
                variant="ghost"
                fullWidth
                iconEmoji="👥"
                onClick={() => onTabChange('evaluator-management')}
                className="justify-start"
              >
                평가자 관리
              </UIButton>
              <UIButton
                variant="ghost"
                fullWidth
                iconEmoji="📈"
                onClick={() => onTabChange('progress-monitoring')}
                className="justify-start"
              >
                진행상황 모니터링
              </UIButton>
              <UIButton
                variant="ghost"
                fullWidth
                iconEmoji="📄"
                onClick={() => onTabChange('export-reports')}
                className="justify-start"
              >
                보고서 출력
              </UIButton>
            </div>
          </div>

          {/* 연구 가이드 */}
          <div className="ui-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UIIcon emoji="📚" size="lg" color="info" />
              연구 가이드
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <UIIcon emoji="🎯" size="lg" color="primary" />
                <div>
                  <h4 className="font-medium text-gray-900">AHP 방법론</h4>
                  <p className="text-sm text-gray-600">계층적 의사결정 과정 학습</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <UIIcon emoji="🔧" size="lg" color="success" />
                <div>
                  <h4 className="font-medium text-gray-900">연구 설계 팁</h4>
                  <p className="text-sm text-gray-600">효과적인 프로젝트 구성</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <UIIcon emoji="📊" size="lg" color="info" />
                <div>
                  <h4 className="font-medium text-gray-900">결과 해석</h4>
                  <p className="text-sm text-gray-600">분석 결과 이해하기</p>
                </div>
              </div>
            </div>
          </div>

          {/* 시스템 상태 */}
          <div className="ui-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UIIcon emoji="⚙️" size="lg" color="secondary" />
              시스템 현황
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">서버 상태</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">정상</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">데이터베이스</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">연결됨</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">백업</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-600">최신</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 힌트 */}
      <div className="ui-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-4">
          <UIIcon emoji="💡" size="xl" color="primary" />
          <div>
            <h4 className="font-medium text-gray-900">💡 사용 팁</h4>
            <p className="text-sm text-gray-600">
              왼쪽 사이드바를 통해 자세한 메뉴에 접근할 수 있습니다. 
              각 기능별 상세 설정은 해당 메뉴를 이용해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPersonalServiceDashboard;