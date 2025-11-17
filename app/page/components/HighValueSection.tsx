"use client";

import * as S from "../styles";

export default function HighValueSection() {
  return (
    <S.Section>
      <S.SectionTitle>고액권 | SBMB</S.SectionTitle>
      <S.SectionDescription>
        고액권 및 SBMB 관련 서비스를 제공합니다. 자세한 내용은 아래 버튼을 통해 확인하실 수 있습니다.
      </S.SectionDescription>
      <div style={{ textAlign: "center" }}>
        <S.ActionButton>자세히 보기</S.ActionButton>
        <S.ActionButton style={{ marginLeft: "1rem" }}>신청하기</S.ActionButton>
      </div>
    </S.Section>
  );
}
