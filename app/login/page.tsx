"use client";

// /login — 회원 로그인. B-1 POST /api/member/auth/login 배선. 구글 버튼은 키 있을 때만.
// 로그인 후 next 쿼리(미들웨어가 넘겨줌)로 복귀, 없으면 마이페이지.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/education/PublicShell";
import {
  AuthCard,
  AuthFootLink,
  AuthForm,
  AuthSub,
  AuthTitle,
  AuthWrap,
  Divider,
  ErrorNote,
  Field,
  FieldLabel,
  GoogleBtn,
  Input,
  SubmitBtn,
  fetchGoogleEnabled,
} from "@/components/education/auth-ui";
import { useMemberSession } from "@/lib/member-client";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/mypage";
  const { refresh } = useMemberSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    void fetchGoogleEnabled().then(setGoogleEnabled);
  }, []);

  const canSubmit = !submitting && email.trim() !== "" && password !== "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/member/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "로그인에 실패했습니다.");
      await refresh();
      router.push(next.startsWith("/") ? next : "/mypage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <AuthWrap>
      <AuthCard>
        <AuthTitle>로그인</AuthTitle>
        <AuthSub>춘심 허브 회원 계정으로 로그인하세요.</AuthSub>
        <AuthForm onSubmit={submit}>
          <Field>
            <FieldLabel>이메일</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field>
            <FieldLabel>비밀번호</FieldLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <SubmitBtn type="submit" disabled={!canSubmit}>
            {submitting ? "로그인 중…" : "로그인"}
          </SubmitBtn>
        </AuthForm>

        {googleEnabled ? (
          <>
            <Divider>또는</Divider>
            <GoogleBtn href="/api/member/auth/google">Google로 로그인</GoogleBtn>
          </>
        ) : null}

        <AuthFootLink>
          아직 회원이 아니신가요? <Link href="/signup">회원가입</Link>
        </AuthFootLink>
      </AuthCard>
    </AuthWrap>
  );
}

export default function LoginPage() {
  return (
    <PublicShell showTicker={false}>
      <Suspense fallback={null}>
        <LoginInner />
      </Suspense>
    </PublicShell>
  );
}
