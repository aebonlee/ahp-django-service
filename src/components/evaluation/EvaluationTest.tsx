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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <UIIcon emoji="🧪" size="3xl" color="primary" />
          <h1 className="text-3xl font-bold text-gray-900">평가 테스트</h1>
        </div>
        <p className="text-gray-600 text-lg">
          평가자 화면을 미리 확인하고 테스트해보세요
        </p>
      </div>

      {/* 테스트 모드 선택 */}
      <div className="ui-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <UIIcon emoji="⚙️" size="lg" color="secondary" />
          <h3 className="text-lg font-semibold text-gray-900">테스트 모드 선택</h3>
        </div>
        
        <div className="flex items-center justify-center gap-8">
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <input 
              type="radio" 
              checked={testMode === 'preview'}
              onChange={() => setTestMode('preview')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2">
              <UIIcon emoji="👁️" size="lg" color="info" />
              <span className="font-medium text-gray-900">미리보기 모드</span>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <input 
              type="radio"
              checked={testMode === 'simulate'}
              onChange={() => setTestMode('simulate')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex items-center gap-2">
              <UIIcon emoji="🚀" size="lg" color="success" />
              <span className="font-medium text-gray-900">시뮬레이션 모드</span>
            </div>
          </label>
        </div>
      </div>

      {/* 진행 단계 표시 */}
      <div className="flex items-center justify-center gap-2">
        {['select', 'demographic', 'evaluation', 'result'].map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep === step 
                ? 'bg-blue-500 text-white' 
                : idx < ['select', 'demographic', 'evaluation', 'result'].indexOf(currentStep)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {idx + 1}
            </div>
            {idx < 3 && (
              <div className={`w-16 h-1 ${
                idx < ['select', 'demographic', 'evaluation', 'result'].indexOf(currentStep)
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 단계별 화면 */}
      {currentStep === 'select' && <ProjectSelection />}
      {currentStep === 'demographic' && <DemographicSurvey />}
      {currentStep === 'evaluation' && <EvaluationScreen />}
      {currentStep === 'result' && <ResultScreen />}

      {/* 도움말 */}
      <div className="ui-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <UIIcon emoji="💡" size="lg" color="warning" />
          <h3 className="text-lg font-semibold text-gray-900">평가 테스트 가이드</h3>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <UIIcon emoji="👁️" size="lg" color="info" />
            <div>
              <div className="font-semibold text-blue-900 mb-1">미리보기 모드</div>
              <p className="text-blue-800">평가자가 보게 될 화면의 구성과 흐름을 확인합니다.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <UIIcon emoji="🚀" size="lg" color="success" />
            <div>
              <div className="font-semibold text-green-900 mb-1">시뮬레이션 모드</div>
              <p className="text-green-800">실제 평가 과정을 시뮬레이션하여 동작을 테스트합니다.</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <UIIcon emoji="🎯" size="lg" color="warning" />
              <div>
                <div className="font-semibold text-yellow-900 mb-1">팁</div>
                <p className="text-yellow-800">실제 평가 링크는 '평가자 관리' 메뉴에서 생성할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationTest;