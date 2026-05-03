"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { IconChevronLeft } from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionCard } from "@/components/sbmb/shared/SectionCard";
import { T } from "@/lib/sbmb/tokens";

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${T.pageBg};
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${T.maxWidth};
  margin: 0 auto;
  padding: 88px 20px 48px;
`;

const BackRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: ${T.textSecondary};

  &:hover {
    color: ${T.primary};
  }
`;

const ListLink = styled(Link)`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: ${T.mint};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const ImportantBadge = styled.span`
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 9999px;
  background: ${T.mintLight};
  color: ${T.mintDark};
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 11px;
`;

const DateText = styled.span`
  font-size: 13px;
  color: ${T.textTertiary};
`;

const Title = styled.h1`
  margin: 0 0 16px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 1.35;
  color: ${T.textPrimary};
`;

const Divider = styled.hr`
  border: none;
  border-top: 0.5px solid ${T.border};
  margin: 0 0 20px;
`;

const Body = styled.div`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.8;
  color: ${T.textMuted};
  white-space: pre-wrap;
  word-break: break-word;
`;

const ExtLink = styled.a`
  display: inline-block;
  margin-top: 20px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: ${T.mint};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Muted = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${T.textSecondary};
`;

type DetailJson =
  | { found: true; title: string; body: string; date: string; important: boolean; link: string }
  | { found: false; error?: string };

export default function SbmbNoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [state, setState] = useState<"load" | "ok" | "404" | "err">("load");
  const [detail, setDetail] = useState<{
    title: string;
    body: string;
    date: string;
    important: boolean;
    link: string;
  } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) {
      setState("404");
      return;
    }
    setState("load");
    setErrMsg(null);
    try {
      const res = await fetch(`/api/sbmb/notices/${encodeURIComponent(slug)}`);
      const json = (await res.json()) as DetailJson;
      if (res.status === 404 || !json || !("found" in json) || !json.found) {
        setState("404");
        setDetail(null);
        return;
      }
      setDetail({
        title: json.title,
        body: json.body,
        date: json.date,
        important: json.important,
        link: json.link,
      });
      setState("ok");
    } catch {
      setState("err");
      setErrMsg("공지를 불러오지 못했습니다.");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Shell>
      <Header />
      <Main>
        <BackRow>
          <BackBtn
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/sbmb");
            }}
          >
            <IconChevronLeft size={14} />
            뒤로
          </BackBtn>
          <span style={{ color: T.textTertiary, fontSize: 13 }} aria-hidden>
            |
          </span>
          <ListLink href="/sbmb#notice">목록으로</ListLink>
        </BackRow>

        {state === "load" && <Muted>불러오는 중…</Muted>}
        {state === "err" && <Muted>{errMsg}</Muted>}
        {state === "404" && <Muted>공지를 찾을 수 없습니다.</Muted>}

        {state === "ok" && detail && (
          <SbmbSectionCard>
            <MetaRow>
              {detail.important && <ImportantBadge>중요</ImportantBadge>}
              {detail.date ? <DateText>{detail.date}</DateText> : null}
            </MetaRow>
            <Title>{detail.title}</Title>
            <Divider />
            <Body>{detail.body || "내용이 없습니다."}</Body>
            {detail.link ? (
              <ExtLink href={detail.link} target="_blank" rel="noreferrer">
                관련 링크 바로가기 ↗
              </ExtLink>
            ) : null}
          </SbmbSectionCard>
        )}
      </Main>
      <Footer />
    </Shell>
  );
}
