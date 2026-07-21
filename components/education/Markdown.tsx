"use client";

// 최소 마크다운 렌더러 — 외부 의존성 없음. descriptionMd 등 신뢰된 운영자 입력 표시용.
// 지원: ## / ### 제목, - · * 리스트, **굵게**, 빈 줄 문단 분리, 나머지는 문단.
// ★ HTML은 렌더하지 않는다(텍스트로 이스케이프) — 원본 md 문자열만 파싱.

import { Fragment } from "react";
import styled from "styled-components";
import { eduColors } from "./tokens";

const Wrap = styled.div`
  font-size: 0.92rem;
  line-height: 1.7;
  color: ${eduColors.textSub};

  h2 {
    margin: 1.3rem 0 0.6rem;
    font-size: 1.05rem;
    font-weight: 800;
    color: ${eduColors.text};
  }
  h3 {
    margin: 1.1rem 0 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: ${eduColors.text};
  }
  p {
    margin: 0 0 0.7rem;
  }
  ul {
    margin: 0 0 0.8rem;
    padding-left: 1.2rem;
  }
  li {
    margin: 0.2rem 0;
  }
  strong {
    font-weight: 700;
    color: ${eduColors.text};
  }
  &:first-child > :first-child {
    margin-top: 0;
  }
`;

/** **굵게**만 인라인 처리(안전 — 텍스트 노드로만 구성). */
function inline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={`${keyBase}-b${i}`}>{p.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyBase}-t${i}`}>{p}</Fragment>;
  });
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length === 0) return;
    const items = list;
    blocks.push(
      <ul key={`ul-${key++}`}>
        {items.map((it, i) => (
          <li key={i}>{inline(it, `li-${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  const flushPara = () => {
    if (para.length === 0) return;
    const text = para.join(" ");
    blocks.push(<p key={`p-${key++}`}>{inline(text, `p-${key}`)}</p>);
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushList();
      flushPara();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      flushPara();
      blocks.push(<h3 key={`h-${key++}`}>{inline(line.slice(4), `h3-${key}`)}</h3>);
    } else if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(<h2 key={`h-${key++}`}>{inline(line.slice(3), `h2-${key}`)}</h2>);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushList();
  flushPara();

  return <Wrap>{blocks}</Wrap>;
}
