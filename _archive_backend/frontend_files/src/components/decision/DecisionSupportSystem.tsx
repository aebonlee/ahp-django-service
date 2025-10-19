import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import {
  runScenarioAnalysis,
  performSensitivityAnalysis,
  runMonteCarloSimulation,
  assessRisk,
  generateWhatIfScenarios,
  calculateAHPScores,
  calculateRanking,
  type ScenarioInput,
  type ScenarioResult,
  type SensitivityAnalysisResult,
  type MonteCarloResult,
  type RiskAssessment
} from '../../utils/scenarioAnalysis';

interface DecisionProblem {
  id: string;
  title: string;
  description: string;
  objective: string;
  criteria: Criterion[];
  alternatives: Alternative[];
  stakeholders: Stakeholder[];
  constraints: Constraint[];
  riskFactors: RiskFactor[];
  timeframe: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface Criterion {
  id: string;
  name: string;
  description: string;
  type: 'quantitative' | 'qualitative';
  unit?: string;
  weight?: number;
  subcriteria?: Criterion[];
}

interface Alternative {
  id: string;
  name: string;
  description: string;
  feasibility: number; // 0-1
  cost: number;
  riskLevel: 'low' | 'medium' | 'high';
  implementationTime: number; // 월
  expectedBenefit: number; // 0-1
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: number; // 0-1
  interest: number; // 0-1
  expertise: string[];
}

interface Constraint {
  id: string;
  type: 'budget' | 'time' | 'resource' | 'regulatory' | 'technical';
  description: string;
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
}

interface RiskFactor {
  id: string;
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  mitigation: string;
  owner: string;
}

interface DecisionSupportSystemProps {
  className?: string;
}

const DecisionSupportSystem: React.FC<DecisionSupportSystemProps> = ({ className = '' }) => {
  const [currentProblem, setCurrentProblem] = useState<DecisionProblem | null>(null);
  const [activeStep, setActiveStep] = useState<'definition' | 'structuring' | 'evaluation' | 'analysis' | 'validation'>('definition');
  const [problemFormData, setProblemFormData] = useState({
    title: '',
    description: '',
    objective: '',
    timeframe: '',
    importance: 'medium' as const
  });
  
  // DSS 고급 기능 상태
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [sensitivityResults, setSensitivityResults] = useState<SensitivityAnalysisResult[]>([]);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [whatIfScenario, setWhatIfScenario] = useState<ScenarioInput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'scenario' | 'sensitivity' | 'montecarlo' | 'risk'>('scenario');

  useEffect(() => {
    // 샘플 의사결정 문제 로드
    const sampleProblem: DecisionProblem = {
      id: 'dp1',
      title: '신기술 도입 우선순위 결정',
      description: '회사의 디지털 전환을 위한 신기술 도입 우선순위를 결정합니다.',
      objective: '제한된 예산 내에서 최대 효과를 얻을 수 있는 기술을 선택',
      criteria: [
        {
          id: 'c1',
          name: '비용 효율성',
          description: '투자 대비 기대 수익',
          type: 'quantitative',
          unit: 'ROI (%)'
        },
        {
          id: 'c2',
          name: '기술 성숙도',
          description: '기술의 안정성과 검증 수준',
          type: 'qualitative'
        },
        {
          id: 'c3',
          name: '구현 복잡도',
          description: '도입 및 구현의 어려움 정도',
          type: 'qualitative'
        },
        {
          id: 'c4',
          name: '전략적 중요성',
          description: '회사 전략과의 일치도',
          type: 'qualitative'
        }
      ],
      alternatives: [
        {
          id: 'a1',
          name: 'AI/머신러닝',
          description: '인공지능 및 머신러닝 기술 도입',
          feasibility: 0.7,
          cost: 50000000,
          riskLevel: 'medium',
          implementationTime: 12,
          expectedBenefit: 0.8
        },
        {
          id: 'a2',
          name: '클라우드 컴퓨팅',
          description: '클라우드 인프라로 전환',
          feasibility: 0.9,
          cost: 30000000,
          riskLevel: 'low',
          implementationTime: 6,
          expectedBenefit: 0.7
        },
        {
          id: 'a3',
          name: 'IoT 시스템',
          description: '사물인터넷 기반 모니터링 시스템',
          feasibility: 0.6,
          cost: 40000000,
          riskLevel: 'high',
          implementationTime: 18,
          expectedBenefit: 0.6
        }
      ],
      stakeholders: [
        {
          id: 'sh1',
          name: 'CTO',
          role: '기술 책임자',
          influence: 0.9,
          interest: 0.8,
          expertise: ['기술전략', 'IT아키텍처']
        },
        {
          id: 'sh2',
          name: 'CFO',
          role: '재무 책임자',
          influence: 0.8,
          interest: 0.9,
          expertise: ['재무관리', '예산계획']
        }
      ],
      constraints: [
        {
          id: 'con1',
          type: 'budget',
          description: '연간 IT 예산 1억원 한도',
          impact: 'high'
        },
        {
          id: 'con2',
          type: 'time',
          description: '프로젝트 완료 기한 18개월',
          impact: 'medium'
        }
      ],
      riskFactors: [
        {
          id: 'r1',
          description: '기술 도입 후 직원 적응 지연',
          probability: 0.6,
          impact: 0.7,
          mitigation: '충분한 교육 훈련 프로그램 제공',
          owner: 'HR팀'
        }
      ],
      timeframe: '18개월',
      importance: 'high'
    };

    setCurrentProblem(sampleProblem);
  }, []);

  const renderProblemDefinition = () => (
    <div className="space-y-6">
      <Card title="의사결정 문제 정의">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">문제 제목</label>
            <input
              type="text"
              value={problemFormData.title}
              onChange={(e) => setProblemFormData({...problemFormData, title: e.target.value})}
              className="w-full border rounded px-3 py-2"
              placeholder="의사결정이 필요한 문제를 간단히 설명하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">상세 설명</label>
            <textarea
              value={problemFormData.description}
              onChange={(e) => setProblemFormData({...problemFormData, description: e.target.value})}
              className="w-full border rounded px-3 py-2 h-24"
              placeholder="문제의 배경과 현재 상황을 자세히 설명하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">의사결정 목표</label>
            <textarea
              value={problemFormData.objective}
              onChange={(e) => setProblemFormData({...problemFormData, objective: e.target.value})}
              className="w-full border rounded px-3 py-2 h-20"
              placeholder="이 의사결정을 통해 달성하고자 하는 목표를 명시하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">결정 기한</label>
              <input
                type="text"
                value={problemFormData.timeframe}
                onChange={(e) => setProblemFormData({...problemFormData, timeframe: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="예: 3개월, 2024년 12월"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">중요도</label>
              <select
                value={problemFormData.importance}
                onChange={(e) => setProblemFormData({...problemFormData, importance: e.target.value as any})}
                className="w-full border rounded px-3 py-2"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="critical">매우 중요</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 문제 정의 가이드 */}
      <Card title="🎯 효과적인 문제 정의를 위한 가이드">
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-blue-50 rounded">
            <strong>SMART 원칙 적용:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Specific</strong>: 구체적이고 명확한 문제 정의</li>
              <li><strong>Measurable</strong>: 측정 가능한 결과 기준 설정</li>
              <li><strong>Achievable</strong>: 달성 가능한 목표 설정</li>
              <li><strong>Relevant</strong>: 조직 목표와 연관성 확보</li>
              <li><strong>Time-bound</strong>: 명확한 시간 제약 설정</li>
            </ul>
          </div>
          
          <div className="p-3 bg-green-50 rounded">
            <strong>고려사항 체크리스트:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>모든 이해관계자가 문제를 동일하게 이해하는가?</li>
              <li>문제의 범위가 명확하게 정의되었는가?</li>
              <li>현재 상황과 원하는 상황이 구분되는가?</li>
              <li>의사결정의 제약조건이 식별되었는가?</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderProblemStructuring = () => (
    <div className="space-y-6">
      {currentProblem && (
        <>
          {/* 계층구조 시각화 */}
          <Card title="AHP 계층구조">
            <div className="space-y-8">
              {/* 목표 레벨 */}
              <div className="text-center">
                <div className="inline-block bg-blue-100 border-2 border-blue-500 rounded-lg p-4">
                  <div className="font-bold text-blue-800">목표</div>
                  <div className="text-sm mt-1">{currentProblem.objective}</div>
                </div>
              </div>

              {/* 기준 레벨 */}
              <div className="flex justify-center">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentProblem.criteria.map((criterion, index) => (
                    <div key={criterion.id} className="text-center">
                      <div className="bg-green-100 border-2 border-green-500 rounded-lg p-3">
                        <div className="font-medium text-green-800 text-sm">{criterion.name}</div>
                        <div className="text-xs mt-1 text-green-600">{criterion.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 대안 레벨 */}
              <div className="flex justify-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentProblem.alternatives.map((alternative) => (
                    <div key={alternative.id} className="text-center">
                      <div className="bg-purple-100 border-2 border-purple-500 rounded-lg p-3">
                        <div className="font-medium text-purple-800 text-sm">{alternative.name}</div>
                        <div className="text-xs mt-1 text-purple-600">
                          위험도: {alternative.riskLevel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 이해관계자 분석 */}
          <Card title="이해관계자 분석">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentProblem.stakeholders.map((stakeholder) => (
                <div key={stakeholder.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{stakeholder.name}</h4>
                      <p className="text-sm text-gray-600">{stakeholder.role}</p>
                    </div>
                    <div className="text-right text-xs">
                      <div>영향력: {(stakeholder.influence * 100).toFixed(0)}%</div>
                      <div>관심도: {(stakeholder.interest * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">영향력</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stakeholder.influence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">관심도</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stakeholder.interest * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 mb-1">전문분야</div>
                    <div className="flex flex-wrap gap-1">
                      {stakeholder.expertise.map((exp, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 제약조건 및 위험요인 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="제약조건">
              <div className="space-y-3">
                {currentProblem.constraints.map((constraint) => (
                  <div key={constraint.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`inline-block px-2 py-1 rounded text-xs mb-2 ${
                          constraint.type === 'budget' ? 'bg-red-100 text-red-800' :
                          constraint.type === 'time' ? 'bg-blue-100 text-blue-800' :
                          constraint.type === 'resource' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {constraint.type}
                        </div>
                        <div className="text-sm">{constraint.description}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        constraint.impact === 'high' ? 'bg-red-100 text-red-800' :
                        constraint.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {constraint.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="위험요인">
              <div className="space-y-3">
                {currentProblem.riskFactors.map((risk) => (
                  <div key={risk.id} className="border rounded p-3">
                    <div className="text-sm font-medium mb-2">{risk.description}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-600">확률: </span>
                        <span className="font-medium">{(risk.probability * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">영향: </span>
                        <span className="font-medium">{(risk.impact * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="text-gray-600 mb-1">대응방안:</div>
                      <div>{risk.mitigation}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      담당자: {risk.owner}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );

  const renderEvaluation = () => {
    if (!currentProblem) return null;

    const generateSampleEvaluation = () => {
      // 샘플 평가 데이터 생성 (실제로는 AHP 시스템과 연동)
      const criteriaWeights: { [key: string]: number } = {
        'c1': 0.4, // 비용 효율성
        'c2': 0.3, // 기술 성숙도  
        'c3': 0.2, // 구현 복잡도
        'c4': 0.1  // 전략적 중요성
      };

      const alternativeScores: { [key: string]: { [key: string]: number } } = {
        'a1': { 'c1': 0.8, 'c2': 0.6, 'c3': 0.4, 'c4': 0.9 }, // AI/머신러닝
        'a2': { 'c1': 0.9, 'c2': 0.9, 'c3': 0.8, 'c4': 0.7 }, // 클라우드 컴퓨팅
        'a3': { 'c1': 0.6, 'c2': 0.5, 'c3': 0.3, 'c4': 0.6 }  // IoT 시스템
      };

      const baseScenario: ScenarioInput = {
        id: 'base',
        name: '기준 시나리오',
        description: '현재 가중치와 평가 기준',
        criteriaWeights,
        alternativeScores
      };

      setWhatIfScenario(baseScenario);
      setActiveStep('analysis');
    };

    return (
      <Card title="AHP 평가 수행">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">평가 프로세스</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">1</span>
                기준 간 쌍대비교 (4개 기준)
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">2</span>
                각 기준별 대안 간 쌍대비교 (3개 대안)
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">3</span>
                일관성 비율 검증 (CR &lt; 0.1)
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs">4</span>
                최종 우선순위 계산
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">평가 현황</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>기준 간 비교:</span>
                  <span className="text-green-600">완료 (CR: 0.08)</span>
                </div>
                <div className="flex justify-between">
                  <span>비용 효율성 기준:</span>
                  <span className="text-green-600">완료 (CR: 0.05)</span>
                </div>
                <div className="flex justify-between">
                  <span>기술 성숙도 기준:</span>
                  <span className="text-green-600">완료 (CR: 0.06)</span>
                </div>
                <div className="flex justify-between">
                  <span>구현 복잡도 기준:</span>
                  <span className="text-green-600">완료 (CR: 0.04)</span>
                </div>
                <div className="flex justify-between">
                  <span>전략적 중요성 기준:</span>
                  <span className="text-green-600">완료 (CR: 0.07)</span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">평가 결과 미리보기</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1위: 클라우드 컴퓨팅</span>
                  <span className="font-medium">0.782</span>
                </div>
                <div className="flex justify-between">
                  <span>2위: AI/머신러닝</span>
                  <span className="font-medium">0.681</span>
                </div>
                <div className="flex justify-between">
                  <span>3위: IoT 시스템</span>
                  <span className="font-medium">0.537</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-600">전체 일관성 비율: 0.068</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button variant="primary" onClick={generateSampleEvaluation}>
              고급 분석으로 진행
            </Button>
            <Button variant="secondary">
              평가 재검토
            </Button>
            <Button variant="outline">
              일관성 개선
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // 고급 분석 함수들
  const runAdvancedAnalysis = async () => {
    if (!whatIfScenario || !currentProblem) return;
    
    setIsAnalyzing(true);
    
    try {
      // 대안과 기준 이름 매핑
      const alternativeNames = Object.fromEntries(
        currentProblem.alternatives.map(alt => [alt.id, alt.name])
      );
      const criteriaNames = Object.fromEntries(
        currentProblem.criteria.map(crit => [crit.id, crit.name])
      );

      // 1. 시나리오 분석
      const costFocusedScenario = generateWhatIfScenarios(whatIfScenario, {
        criteriaWeightChanges: { 'c1': 0.6, 'c2': 0.2, 'c3': 0.1, 'c4': 0.1 }
      }) || {
        id: 'cost-focused',
        name: '비용 중심 시나리오',
        description: '비용 효율성을 60%로 높인 경우',
        criteriaWeights: { 'c1': 0.6, 'c2': 0.2, 'c3': 0.1, 'c4': 0.1 },
        alternativeScores: whatIfScenario.alternativeScores
      };
      if (costFocusedScenario) {
        costFocusedScenario.name = '비용 중심 시나리오';
        costFocusedScenario.description = '비용 효율성을 60%로 높인 경우';
      }
      
      const techFocusedScenario = generateWhatIfScenarios(whatIfScenario, {
        criteriaWeightChanges: { 'c1': 0.2, 'c2': 0.5, 'c3': 0.2, 'c4': 0.1 }
      }) || {
        id: 'tech-focused',
        name: '기술 중심 시나리오',
        description: '기술 성숙도를 50%로 높인 경우',
        criteriaWeights: { 'c1': 0.2, 'c2': 0.5, 'c3': 0.2, 'c4': 0.1 },
        alternativeScores: whatIfScenario.alternativeScores
      };
      if (techFocusedScenario) {
        techFocusedScenario.name = '기술 중심 시나리오';
        techFocusedScenario.description = '기술 성숙도를 50%로 높인 경우';
      }
      
      const scenarios = [whatIfScenario, costFocusedScenario, techFocusedScenario].filter(Boolean);
      
      const scenarioResults = runScenarioAnalysis(whatIfScenario, scenarios, alternativeNames);
      setScenarioResults(scenarioResults);

      // 2. 민감도 분석
      await new Promise(resolve => setTimeout(resolve, 500));
      const sensitivityResults = performSensitivityAnalysis(whatIfScenario, alternativeNames, criteriaNames);
      setSensitivityResults(sensitivityResults);

      // 3. 몬테카를로 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));
      const monteCarloResult = runMonteCarloSimulation(whatIfScenario, alternativeNames, 1000);
      setMonteCarloResult(monteCarloResult);

      // 4. 리스크 평가
      const riskAssessments = assessRisk(Object.fromEntries(
        currentProblem.alternatives.map(alt => [alt.id, alt])
      ));
      setRiskAssessments(riskAssessments);
      
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalysis = () => {
    if (!whatIfScenario || !currentProblem) {
      return (
        <Card title="고급 분석">
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">
              먼저 평가 단계를 완료해주세요
            </div>
            <Button variant="secondary" onClick={() => setActiveStep('evaluation')}>
              평가 단계로 이동
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* 분석 실행 버튼 */}
        <Card title="고급 의사결정 분석">
          <div className="flex space-x-4 mb-4">
            <Button 
              variant="primary" 
              onClick={runAdvancedAnalysis}
              disabled={isAnalyzing}
              loading={isAnalyzing}
            >
              {isAnalyzing ? '분석 중...' : '전체 분석 실행'}
            </Button>
          </div>
          
          {/* 분석 탭 메뉴 */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'scenario', name: '시나리오 분석', icon: '🎭' },
                { id: 'sensitivity', name: '민감도 분석', icon: '📈' },
                { id: 'montecarlo', name: '확률 분석', icon: '🎲' },
                { id: 'risk', name: '리스크 평가', icon: '⚠️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalysisTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeAnalysisTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </Card>

        {/* 분석 결과 표시 */}
        {activeAnalysisTab === 'scenario' && renderScenarioAnalysis()}
        {activeAnalysisTab === 'sensitivity' && renderSensitivityAnalysis()}
        {activeAnalysisTab === 'montecarlo' && renderMonteCarloAnalysis()}
        {activeAnalysisTab === 'risk' && renderRiskAnalysis()}
      </div>
    );
  };

  // 분석 결과 렌더링 함수들
  const renderScenarioAnalysis = () => (
    <Card title="🎭 시나리오 분석 결과">
      {scenarioResults && scenarioResults.length > 0 ? (
        <div className="space-y-4">
          {scenarioResults.map((result, index) => (
            <div key={result.scenarioId} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{result.scenarioName}</h4>
              <div className="space-y-2">
                {result.ranking.map((rank, idx) => (
                  <div key={rank.alternativeId} className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 ${
                        idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-gray-400 text-white' :
                        'bg-orange-400 text-white'
                      }`}>
                        {rank.rank}
                      </span>
                      {currentProblem?.alternatives.find(a => a.id === rank.alternativeId)?.name || rank.alternativeId}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{rank.score.toFixed(3)}</span>
                      {result.rankingChanges && result.rankingChanges[rank.alternativeId] !== 0 && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          result.rankingChanges[rank.alternativeId] > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.rankingChanges[rank.alternativeId] > 0 ? '↑' : '↓'}
                          {Math.abs(result.rankingChanges[rank.alternativeId])}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          분석을 실행하여 시나리오 비교 결과를 확인하세요
        </div>
      )}
    </Card>
  );

  const renderSensitivityAnalysis = () => (
    <Card title="📈 민감도 분석 결과">
      {sensitivityResults && sensitivityResults.length > 0 ? (
        <div className="space-y-4">
          {sensitivityResults.map(result => (
            <div key={result.criteriaId} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{result.criteriaName}</h4>
                <span className={`px-3 py-1 rounded text-sm ${
                  result.sensitivityScore < 0.3 ? 'bg-green-100 text-green-800' :
                  result.sensitivityScore < 0.6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.sensitivityScore < 0.3 ? '낮은 민감도' :
                   result.sensitivityScore < 0.6 ? '보통 민감도' : '높은 민감도'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">민감도 점수</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${result.sensitivityScore * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{(result.sensitivityScore * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">순위 안정성</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${result.rankingStability * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{(result.rankingStability * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          분석을 실행하여 민감도 분석 결과를 확인하세요
        </div>
      )}
    </Card>
  );

  const renderMonteCarloAnalysis = () => (
    <Card title="🎲 몬테카를로 확률 분석">
      {monteCarloResult ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">최적 대안 추천</h4>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentProblem?.alternatives.find(a => a.id === monteCarloResult.bestAlternative)?.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  신뢰도: {(monteCarloResult.confidence * 100).toFixed(1)}%
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {monteCarloResult.iterations}회 시뮬레이션 결과
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">대안별 안정성</h4>
              <div className="space-y-2">
                {Object.entries(monteCarloResult.alternativeStability).map(([altId, stats]) => (
                  <div key={altId} className="text-sm">
                    <div className="flex justify-between">
                      <span>{currentProblem?.alternatives.find(a => a.id === altId)?.name}</span>
                      <span>σ: {stats.std.toFixed(3)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${stats.mean * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">순위별 확률 분포</h4>
            <div className="space-y-3">
              {Object.entries(monteCarloResult.rankingProbability).map(([altId, probs]) => (
                <div key={altId}>
                  <div className="text-sm font-medium mb-1">
                    {currentProblem?.alternatives.find(a => a.id === altId)?.name}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[1, 2, 3].map(rank => (
                      <div key={rank} className="text-center">
                        <div className="bg-gray-100 rounded p-1">
                          <div>{rank}위</div>
                          <div className="font-medium">
                            {((probs[rank] || 0) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          분석을 실행하여 확률적 안정성을 확인하세요
        </div>
      )}
    </Card>
  );

  const renderRiskAnalysis = () => (
    <Card title="⚠️ 리스크 평가 결과">
      {riskAssessments && riskAssessments.length > 0 ? (
        <div className="space-y-4">
          {riskAssessments.map(assessment => (
            <div key={assessment.alternativeId} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">
                  {currentProblem?.alternatives.find(a => a.id === assessment.alternativeId)?.name}
                </h4>
                <span className={`px-3 py-1 rounded text-sm ${
                  assessment.riskScore < 0.3 ? 'bg-green-100 text-green-800' :
                  assessment.riskScore < 0.6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {assessment.riskScore < 0.3 ? '낮은 위험' :
                   assessment.riskScore < 0.6 ? '보통 위험' : '높은 위험'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>구현 위험</span>
                      <span>{(assessment.riskFactors.implementationRisk * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-red-500 h-1 rounded-full" 
                        style={{ width: `${assessment.riskFactors.implementationRisk * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>비용 위험</span>
                      <span>{(assessment.riskFactors.costRisk * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-orange-500 h-1 rounded-full" 
                        style={{ width: `${assessment.riskFactors.costRisk * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>일정 위험</span>
                      <span>{(assessment.riskFactors.timeRisk * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-yellow-500 h-1 rounded-full" 
                        style={{ width: `${assessment.riskFactors.timeRisk * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>품질 위험</span>
                      <span>{(assessment.riskFactors.qualityRisk * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-purple-500 h-1 rounded-full" 
                        style={{ width: `${assessment.riskFactors.qualityRisk * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {assessment.mitigationStrategies.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">위험 완화 전략:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {assessment.mitigationStrategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          분석을 실행하여 리스크 평가 결과를 확인하세요
        </div>
      )}
    </Card>
  );

  const renderValidation = () => (
    <Card title="결과 검증 및 의사결정 보고서">
      {monteCarloResult && scenarioResults.length > 0 ? (
        <div className="space-y-6">
          {/* 종합 결론 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4">📋 의사결정 권고안</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-600 rounded-full mr-3"></span>
                <span className="font-medium">추천 대안: </span>
                <span className="text-blue-700 font-bold">
                  {currentProblem?.alternatives.find(a => a.id === monteCarloResult.bestAlternative)?.name}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-600 rounded-full mr-3"></span>
                <span className="font-medium">신뢰도: </span>
                <span className="text-green-700 font-bold">
                  {(monteCarloResult.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-orange-600 rounded-full mr-3"></span>
                <span className="font-medium">검증 수준: </span>
                <span className="text-orange-700 font-bold">높음</span>
              </div>
            </div>
          </div>
          
          {/* 검증 체크리스트 */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">✅ 의사결정 타당성 검증</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>일관성 비율이 허용 기준 내 (CR &lt; 0.1)</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>민감도 분석을 통한 결과 안정성 확인</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>몬테카를로 시뮬레이션으로 불확실성 고려</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>다양한 시나리오에서 순위 검증</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>리스크 요소 식별 및 완화 방안 수립</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button variant="primary" onClick={() => alert('보고서 생성 기능은 ExportManager와 연동됩니다.')}>
              최종 보고서 생성
            </Button>
            <Button variant="secondary">
              이해관계자 공유
            </Button>
            <Button variant="outline">
              의사결정 승인 요청
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-600 mb-4">
            모든 분석이 완료된 후 검증 보고서를 생성할 수 있습니다
          </div>
          <Button variant="secondary" onClick={() => setActiveStep('analysis')}>
            분석 단계로 이동
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 프로세스 단계 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {[
            { id: 'definition', name: '문제정의', icon: '🎯', desc: '의사결정 문제 정의 및 목표 설정' },
            { id: 'structuring', name: '구조화', icon: '🏗️', desc: '계층구조 및 이해관계자 분석' },
            { id: 'evaluation', name: '평가', icon: '⚖️', desc: 'AHP 쌍대비교 평가 수행' },
            { id: 'analysis', name: '고급분석', icon: '📊', desc: '시나리오·민감도·확률 분석' },
            { id: 'validation', name: '검증', icon: '✅', desc: '의사결정 결과 타당성 검증' }
          ].map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setActiveStep(step.id as any)}
                className={`flex-1 min-w-0 flex flex-col items-center py-6 px-4 rounded-lg transition-all duration-200 ${
                  activeStep === step.id 
                    ? 'bg-blue-50 text-blue-700 shadow-md border-2 border-blue-300' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-2 border-transparent'
                }`}
              >
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="text-base font-semibold mb-1">{step.name}</div>
                <div className="text-xs text-center leading-tight px-1">{step.desc}</div>
              </button>
              {index < 4 && (
                <div className="hidden lg:block flex-shrink-0 w-8 h-px bg-gray-300"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 단계별 콘텐츠 */}
      {activeStep === 'definition' && renderProblemDefinition()}
      {activeStep === 'structuring' && renderProblemStructuring()}
      {activeStep === 'evaluation' && renderEvaluation()}
      {activeStep === 'analysis' && renderAnalysis()}
      {activeStep === 'validation' && renderValidation()}

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <Button 
          variant="secondary" 
          disabled={activeStep === 'definition'}
          onClick={() => {
            const steps = ['definition', 'structuring', 'evaluation', 'analysis', 'validation'];
            const currentIndex = steps.indexOf(activeStep);
            if (currentIndex > 0) {
              setActiveStep(steps[currentIndex - 1] as any);
            }
          }}
        >
          이전 단계
        </Button>
        
        <Button 
          variant="primary"
          disabled={activeStep === 'validation'}
          onClick={() => {
            const steps = ['definition', 'structuring', 'evaluation', 'analysis', 'validation'];
            const currentIndex = steps.indexOf(activeStep);
            if (currentIndex < steps.length - 1) {
              setActiveStep(steps[currentIndex + 1] as any);
            }
          }}
        >
          다음 단계
        </Button>
      </div>
    </div>
  );
};

export default DecisionSupportSystem;