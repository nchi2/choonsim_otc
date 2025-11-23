// 회관 정보 상수 정의
export interface BranchInfo {
  name: string;
  address: string;
  naverMapUrl: string;
}

export const BRANCH_INFO: Record<string, BranchInfo> = {
  "서초 모빅회관": {
    name: "서초 모빅회관",
    address: "서울특별시 서초구 사임당로 149-5",
    naverMapUrl:
      "https://map.naver.com/p/entry/place/1054196152?c=15.00,0,0,0,dh",
  },
  "수원 모빅회관": {
    name: "수원 모빅회관",
    address: "경기도 수원시 권선구 세화로 168번길 6, 3층 4층",
    naverMapUrl:
      "https://map.naver.com/p/entry/place/1025817147?c=19.00,0,0,0,dh",
  },
  "대전 커뮤니티센터": {
    name: "대전 커뮤니티센터",
    address: "대전시 유성구 송림로 48번길 6-28, 103호",
    naverMapUrl:
      "https://map.naver.com/p/search/%EB%8C%80%EC%A0%84%EC%8B%9C%20%EC%9C%A0%EC%84%B1%EA%B5%AC%20%EC%86%A1%EB%A6%BC%EB%A1%9C%2048%EB%B2%88%EA%B8%B8%206-28/address/14173425.917471,4353932.7972786,%EB%8C%80%EC%A0%84%EA%B4%91%EC%97%AD%EC%8B%9C%20%EC%9C%A0%EC%84%B1%EA%B5%AC%20%EC%86%A1%EB%A6%BC%EB%A1%9C48%EB%B2%88%EA%B8%B8%206-28,new?c=15.49,0,0,0,dh&isCorrectAnswer=true",
  },
  "호남광주 모빅회관": {
    name: "호남광주 모빅회관",
    address: "광주시 동구 충장로 58번길 2, 2층",
    naverMapUrl:
      "https://map.naver.com/p/entry/address/14128006.2071296,4184233.6830722,%EA%B4%91%EC%A3%BC%20%EB%8F%99%EA%B5%AC%20%EC%B6%A9%EC%9E%A5%EB%A1%9C58%EB%B2%88%EA%B8%B8%202?c=16.00,0,0,0,dh",
  },
  "대구 모빅회관": {
    name: "대구 모빅회관",
    address: "대구광역시 서구 팔달로 92, B1F",
    naverMapUrl:
      "https://map.naver.com/p/entry/place/1516625458?c=15.00,0,0,0,dh",
  },
  "부산 모빅회관": {
    name: "부산 모빅회관",
    address: "부산 수영구 광안해변로 95, 3층 304호",
    naverMapUrl:
      "https://map.naver.com/p/entry/place/1448581230?c=10.00,0,0,2,dh",
  },
} as const;

// 회관 이름 목록
export const BRANCH_NAMES = Object.keys(BRANCH_INFO) as Array<
  keyof typeof BRANCH_INFO
>;

// 회관 정보 조회 함수
export function getBranchInfo(branchName: string): BranchInfo | undefined {
  return BRANCH_INFO[branchName];
}

// 회관 주소 복사용 텍스트 생성
export function getBranchAddressText(branchName: string): string {
  const info = getBranchInfo(branchName);
  return info ? `${info.name}\n${info.address}` : "";
}
