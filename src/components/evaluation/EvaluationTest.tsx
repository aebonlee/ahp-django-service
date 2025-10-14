import React, { useState, useEffect } from 'react';
import UIIcon from '../common/UIIcon';
import { PrimaryButton, SecondaryButton } from '../common/UIButton';
import dataService from '../../services/dataService_clean';
import { ProjectData, CriteriaData, AlternativeData } from '../../services/api';

interface TestProject {
  id: string;
  title: string;
  description: string;
  criteria: CriteriaData[];
  alternatives: AlternativeData[];
  evaluationMethod: 'pairwise' | 'direct';
}

const EvaluationTest: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<TestProject | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'demographic' | 'evaluation' | 'result'>('select');
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [testMode, setTestMode] = useState<'preview' | 'simulate'>('preview');
  const [realProjects, setRealProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  // 실제 프로젝트 데이터 로드
  useEffect(() => {
    loadRealProjects();
  }, []);

  const loadRealProjects = async () => {
    try {
      setLoading(true);
      console.log('🔍 평가 테스트: 실제 프로젝트 데이터 로드 시작...');
      const projects = await dataService.getProjects();
      
      // 활성 프로젝트만 필터링
      const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'completed');
      setRealProjects(activeProjects);
      console.log('✅ 평가 테스트: 실제 프로젝트', activeProjects.length, '개 로드 완료');
    } catch (error) {
      console.error('❌ 평가 테스트: 프로젝트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트와 관련 데이터 로드
  const loadProjectDetails = async (project: ProjectData): Promise<TestProject> => {
    try {
      console.log('🔍 프로젝트 상세 정보 로드:', project.title);
      
      const [criteria, alternatives] = await Promise.all([
        dataService.getCriteria(project.id || ''),
        dataService.getAlternatives(project.id || '')
      ]);
      
      console.log('✅ 로드 완료 - 기준:', criteria.length, '개, 대안:', alternatives.length, '개');
      
      return {
        id: project.id || '',
        title: project.title,
        description: project.description,
        criteria: criteria,
        alternatives: alternatives,
        evaluationMethod: 'pairwise' // 기본값
      };
    } catch (error) {
      console.error('❌ 프로젝트 상세 정보 로드 실패:', error);
      throw error;
    }
  };

  // 실제 PostgreSQL DB 데이터만 사용

  // 평가 시뮬레이션
  const simulateEvaluation = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setEvaluationProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setCurrentStep('result');
      }
    }, 300);
  };

  // 실제 프로젝트 선택
  const handleProjectSelect = async (project: ProjectData) => {
    try {
      const projectDetails = await loadProjectDetails(project);
      setSelectedProject(projectDetails);
      setCurrentStep('demographic');
    } catch (error) {
      alert('프로젝트 데이터 로드에 실패했습니다.');
    }
  };

  // 프로젝트 선택 화면
  const ProjectSelection = () => {
    if (loading) {
      return (
        <div className="ui-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <UIIcon emoji="📋" size="lg" color="primary" />
            <h3 className="text-lg font-semibold text-gray-900">프로젝트 선택</h3>
          </div>
          <div className="text-center py-8">
            <UIIcon emoji="⏳" size="4xl" color="muted" className="mb-4" />
            <p className="text-gray-600">실제 프로젝트 데이터 로드 중...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="ui-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <UIIcon emoji="📋" size="lg" color="primary" />
          <h3 className="text-lg font-semibold text-gray-900">프로젝트 선택</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            평가 테스트를 진행할 실제 프로젝트를 선택하세요.
          </p>
          
          {realProjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <UIIcon emoji="📋" size="4xl" color="muted" className="mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">평가 가능한 프로젝트가 없습니다</h3>
              <p className="text-gray-500">먼저 '내 프로젝트'에서 프로젝트를 생성하고 기준과 대안을 설정해주세요.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {realProjects.map(project => (
                <div 
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">{project.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                      
                      <div className="flex items-center gap-6 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <UIIcon emoji="📊" size="xs" />
                          상태: {project.status === 'active' ? '진행중' : project.status === 'completed' ? '완료' : project.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <UIIcon emoji="🎯" size="xs" />
                          기준: {project.criteria_count || 0}개
                        </span>
                        <span className="flex items-center gap-1">
                          <UIIcon emoji="📋" size="xs" />
                          대안: {project.alternatives_count || 0}개
                        </span>
                      </div>
                    </div>
                    <UIIcon emoji="▶️" size="lg" color="secondary" className="ml-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 인구통계학적 설문 화면
  const DemographicSurvey = () => (
    <div className="ui-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <UIIcon emoji="📊" size="lg" color="primary" />
        <h3 className="text-lg font-semibold text-gray-900">인구통계학적 설문조사</h3>
      </div>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <UIIcon emoji="💡" size="lg" color="info" />
            <p className="text-sm text-blue-800">
              평가자에게 표시되는 설문 화면입니다. 실제 평가 시 수집되는 정보를 미리 확인하세요.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">이름</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">소속</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="○○기업 연구개발부"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">직위</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors">
              <option>선택하세요</option>
              <option>사원</option>
              <option>대리</option>
              <option>과장</option>
              <option>차장</option>
              <option>부장</option>
              <option>임원</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">경력</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors">
              <option>선택하세요</option>
              <option>1년 미만</option>
              <option>1-3년</option>
              <option>3-5년</option>
              <option>5-10년</option>
              <option>10년 이상</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">전문 분야</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              placeholder="AI/ML, 데이터 분석"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <SecondaryButton
            iconEmoji="⬅️"
            onClick={() => setCurrentStep('select')}
          >
            이전
          </SecondaryButton>
          <PrimaryButton 
            iconEmoji="➡️"
            onClick={() => setCurrentStep('evaluation')}
          >
            다음 단계
          </PrimaryButton>
        </div>
      </div>
    </div>
  );

  // 평가 화면
  const EvaluationScreen = () => (
    <div className="ui-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <UIIcon emoji="⚖️" size="lg" color="primary" />
        <h3 className="text-lg font-semibold text-gray-900">평가 진행</h3>
      </div>
      
      <div className="space-y-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <UIIcon emoji="👁️" size="lg" color="success" />
            <p className="text-sm text-green-800">
              실제 평가자가 보게 될 평가 인터페이스입니다.
            </p>
          </div>
        </div>

        {selectedProject?.evaluationMethod === 'pairwise' ? (
          // 쌍대비교 평가
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <UIIcon emoji="🎯" size="lg" color="primary" />
              <h4 className="font-semibold text-gray-900">기준 간 중요도 비교</h4>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 mb-2">
                    {selectedProject?.criteria[0]?.name || '기준 1'}
                  </div>
                  <UIIcon emoji="🔵" size="lg" color="primary" />
                </div>
                <UIIcon emoji="⚖️" size="xl" color="warning" />
                <div className="text-center">
                  <div className="font-semibold text-gray-900 mb-2">
                    {selectedProject?.criteria[1]?.name || '기준 2'}
                  </div>
                  <UIIcon emoji="🔴" size="lg" color="danger" />
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-600">매우 중요</span>
                <div className="flex gap-1">
                  {[9, 7, 5, 3, 1, 3, 5, 7, 9].map((value, idx) => (
                    <button
                      key={idx}
                      className={`w-10 h-10 border rounded-lg font-medium transition-colors hover:bg-blue-100 ${
                        idx === 4 ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-600">매우 중요</span>
              </div>
            </div>

            <div className="text-center">
              <UIIcon emoji="📊" size="lg" color="info" className="mr-2" />
              <span className="text-sm text-gray-600">1/6 비교 완료</span>
            </div>
          </div>
        ) : (
          // 직접입력 평가
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <UIIcon emoji="📝" size="lg" color="primary" />
              <h4 className="font-semibold text-gray-900">대안별 점수 입력</h4>
            </div>
            
            <div className="space-y-4">
              {selectedProject?.alternatives.map((alt, idx) => (
                <div key={alt.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <UIIcon emoji="🎯" size="lg" color="primary" />
                    <span className="w-32 font-medium text-gray-900">{alt.name}</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      defaultValue="50"
                    />
                    <span className="w-12 text-right font-medium text-blue-600">50</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {testMode === 'simulate' && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <UIIcon emoji="⏱️" size="sm" />
                진행률
              </span>
              <span className="font-semibold text-blue-600">{evaluationProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${evaluationProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <SecondaryButton
            iconEmoji="⬅️"
            onClick={() => setCurrentStep('demographic')}
          >
            이전
          </SecondaryButton>
          <PrimaryButton 
            iconEmoji={testMode === 'simulate' ? '🚀' : '👁️'}
            onClick={() => {
              if (testMode === 'simulate') {
                simulateEvaluation();
              } else {
                setCurrentStep('result');
              }
            }}
          >
            {testMode === 'simulate' ? '평가 시뮬레이션' : '결과 미리보기'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );

  // 결과 화면
  const ResultScreen = () => (
    <div className="ui-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <UIIcon emoji="📈" size="lg" color="primary" />
        <h3 className="text-lg font-semibold text-gray-900">평가 결과 미리보기</h3>
      </div>
      
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <UIIcon emoji="🎉" size="lg" color="secondary" />
            <p className="text-sm text-purple-800">
              평가 완료 후 평가자에게 표시되는 결과 화면입니다.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UIIcon emoji="🏆" size="lg" color="warning" />
            <h4 className="font-semibold text-gray-900">최종 우선순위</h4>
          </div>
          
          {selectedProject?.alternatives.map((alt, idx) => (
            <div key={alt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{alt.name}</div>
                  {alt.description && (
                    <div className="text-sm text-gray-500 mt-1">{alt.description}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">{(0.35 - idx * 0.1).toFixed(3)}</div>
                <div className="text-sm text-gray-500">{((0.35 - idx * 0.1) * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <UIIcon emoji="✅" size="sm" />
              일관성 비율 (CR)
            </span>
            <span className="font-bold text-green-600">0.087 (양호)</span>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <PrimaryButton 
            iconEmoji="🔄"
            onClick={() => {
              setCurrentStep('select');
              setSelectedProject(null);
              setEvaluationProgress(0);
            }}
          >
            처음으로
          </PrimaryButton>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* 헤더 - EnhancedEvaluatorManagement 스타일 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    평가 테스트
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    평가자 화면을 미리 확인하고 테스트해보세요
                  </p>
                </div>
              </div>

              {/* 테스트 모드 선택 */}
              <div className="flex space-x-2">
                {[
                  { key: 'preview', label: '미리보기', icon: '👁️' },
                  { key: 'simulate', label: '시뮬레이션', icon: '🚀' }
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setTestMode(mode.key as 'preview' | 'simulate')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      testMode === mode.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* 프로세스 단계 - Decision Support System 스타일 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {[
            { id: 'select', name: '프로젝트선택', icon: '📋', desc: '실제 프로젝트 데이터 선택' },
            { id: 'demographic', name: '설문조사', icon: '📊', desc: '인구통계학적 정보 수집' },
            { id: 'evaluation', name: '평가진행', icon: '⚖️', desc: 'AHP 쌍대비교 또는 직접입력' },
            { id: 'result', name: '결과확인', icon: '📈', desc: '평가 결과 및 우선순위' }
          ].map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setCurrentStep(step.id as any)}
                className={`flex-1 min-w-0 flex flex-col items-center py-6 px-4 rounded-lg transition-all duration-200 ${
                  currentStep === step.id 
                    ? 'bg-blue-50 text-blue-700 shadow-md border-2 border-blue-300' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-2 border-transparent'
                }`}
              >
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="text-base font-semibold mb-1">{step.name}</div>
                <div className="text-xs text-center leading-tight px-1">{step.desc}</div>
              </button>
              {index < 3 && (
                <div className="hidden lg:block flex-shrink-0 w-8 h-px bg-gray-300"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 단계별 화면 */}
      {currentStep === 'select' && <ProjectSelection />}
      {currentStep === 'demographic' && <DemographicSurvey />}
      {currentStep === 'evaluation' && <EvaluationScreen />}
      {currentStep === 'result' && <ResultScreen />}

      {/* 포괄적인 가이드 - Decision Support System 스타일 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ui-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <UIIcon emoji="📋" size="lg" color="primary" />
            <h3 className="text-lg font-semibold text-gray-900">테스트 모드 가이드</h3>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">미리보기 모드</h4>
              <div className="space-y-2 text-blue-700">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">1</span>
                  화면 구성과 흐름 확인
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">2</span>
                  UI/UX 요소 검토
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">3</span>
                  평가자 관점에서 검증
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">시뮬레이션 모드</h4>
              <div className="space-y-2 text-green-700">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">1</span>
                  실제 데이터 연동 테스트
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">2</span>
                  진행률 및 상태 변화 확인
                </div>
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">3</span>
                  결과 생성 프로세스 검증
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <UIIcon emoji="🎯" size="lg" color="warning" />
            <h3 className="text-lg font-semibold text-gray-900">베스트 프랙티스</h3>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">평가 전 체크리스트</h4>
              <ul className="space-y-1 text-purple-700 text-xs">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>프로젝트 기준과 대안이 충분히 설정되었는가?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>평가자들이 충분한 사전 정보를 갖고 있는가?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>평가 소요 시간이 적절하게 계획되었는가?</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">주의사항</h4>
              <ul className="space-y-1 text-orange-700 text-xs">
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>실제 평가 링크는 '평가자 관리'에서 생성</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>테스트 데이터는 실제 평가에 영향 없음</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>브라우저 호환성 사전 확인 필요</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <UIIcon emoji="💡" size="sm" color="warning" />
                <div className="text-xs text-yellow-800">
                  <div className="font-medium mb-1">프로 팁</div>
                  <div>평가자 교육용 자료로 미리보기 화면을 캡처하여 활용하세요.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 네비게이션 버튼 - Decision Support System 스타일 */}
      <div className="flex justify-between">
        <SecondaryButton 
          iconEmoji="⬅️"
          disabled={currentStep === 'select'}
          onClick={() => {
            const steps = ['select', 'demographic', 'evaluation', 'result'];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1] as any);
            }
          }}
        >
          이전 단계
        </SecondaryButton>
        
        <PrimaryButton 
          iconEmoji="➡️"
          disabled={currentStep === 'result'}
          onClick={() => {
            const steps = ['select', 'demographic', 'evaluation', 'result'];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex < steps.length - 1) {
              setCurrentStep(steps[currentIndex + 1] as any);
            }
          }}
        >
          다음 단계
        </PrimaryButton>
      </div>
      </div>
    </div>
  );
};

export default EvaluationTest;