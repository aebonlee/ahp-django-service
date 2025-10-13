import React, { useState } from 'react';

export type EvaluationMethod = 'pairwise-practical' | 'direct-input' | 'pairwise-theoretical';
export type ProjectStatus = 'creating' | 'waiting' | 'evaluating' | 'completed';

interface ProjectCreationFormProps {
  onSubmit: (projectData: ProjectFormData) => void;
  onCancel: () => void;
  initialData?: ProjectFormData;
  isEditing?: boolean;
}

export interface ProjectFormData {
  id?: string;
  title: string;
  description: string;
  evaluationMethod: EvaluationMethod;
  status?: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
}

const EnhancedProjectCreationForm: React.FC<ProjectCreationFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    evaluationMethod: initialData?.evaluationMethod || 'pairwise-practical',
    status: initialData?.status || 'creating'
  });

  const [errors, setErrors] = useState<Partial<ProjectFormData>>({});

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<ProjectFormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '프로젝트 이름을 입력해주세요.';
    } else if (formData.title.length < 3) {
      newErrors.title = '프로젝트 이름은 최소 3자 이상이어야 합니다.';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '프로젝트 설명을 입력해주세요.';
    } else if (formData.description.length < 10) {
      newErrors.description = '프로젝트 설명은 최소 10자 이상이어야 합니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        ...formData,
        id: initialData?.id,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {isEditing ? '프로젝트 수정' : '새 프로젝트 생성'} 🚀
          </h3>
          <p className="mt-2 text-gray-600">
            프로젝트의 목적과 설명을 명확하게 작성해주세요.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="예: 우리 회사에 가장 적합한 ERP 시스템 선정"
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> 프로젝트 이름은 목적(목표)을 나타낼 수 있도록 구체적이고 명확하게 작성하세요.
            </p>
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              placeholder="프로젝트의 배경, 목적, 기대효과 등을 자세히 설명해주세요."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="evaluation-method" className="block text-sm font-medium text-gray-700 mb-2">
              평가 방법 선택 <span className="text-red-500">*</span>
            </label>
            <select
              id="evaluation-method"
              value={formData.evaluationMethod}
              onChange={(e) => handleInputChange('evaluationMethod', e.target.value as EvaluationMethod)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pairwise-practical">쌍대비교-실용 (권장)</option>
              <option value="direct-input">직접입력</option>
              <option value="pairwise-theoretical">쌍대비교-이론</option>
            </select>
            
            <div className="mt-4 space-y-3 text-sm">
              {formData.evaluationMethod === 'pairwise-practical' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <strong className="text-green-800">쌍대비교-실용:</strong>
                  <p className="mt-1 text-green-700">필요한 최소한의 쌍대비교를 실시하여 상대적 중요도를 도출합니다.</p>
                  <p className="text-green-700 font-medium">✓ 실무 활용에 가장 적합 (추천)</p>
                </div>
              )}
              
              {formData.evaluationMethod === 'direct-input' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <strong className="text-yellow-800">직접입력:</strong>
                  <p className="mt-1 text-yellow-700">기존 데이터가 있는 경우 직접 입력하여 중요도를 도출합니다.</p>
                  <p className="text-yellow-700">※ 데이터가 있어도 쌍대비교가 더 적합할 수 있습니다.</p>
                </div>
              )}
              
              {formData.evaluationMethod === 'pairwise-theoretical' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <strong className="text-purple-800">쌍대비교-이론:</strong>
                  <p className="mt-1 text-purple-700">이론상 필요한 모든 쌍대비교를 실시하여 상대적 중요도를 도출합니다.</p>
                  <p className="text-purple-700 font-medium">✓ 논문 작성에 적합</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? '수정하기' : '프로젝트 생성'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedProjectCreationForm;