import type { BuildRequest } from '../../data/model';
export function validateBuildRequest(request: BuildRequest): string | null {
  if (!request.target.trim()) return '빌드 대상을 선택해주세요.';
  if (!request.branch.trim()) return '브랜치를 입력해주세요.';
  if (!request.profile.trim()) return '빌드 프로필을 선택해주세요.';
  return null;
}
