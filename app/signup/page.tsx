"use client";

// /signup — 자체가입(이메일·비번·이름·전화 필수). B-1 POST /api/member/auth/signup 배선.
// 가입 즉시 세션 발급 → 완료 안내(인증 메일 발송됨) 후 마이페이지로.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { eduColors } from "@/components/education/tokens";
import { useMemberSession } from "@/lib/member-client";

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useMemberSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    void fetchGoogleEnabled().then(setGoogleEnabled);
  }, []);

  const canSubmit =
    !submitting &&
    email.trim() !== "" &&
    password.length >= 8 &&
    name.trim() !== "" &&
    phone.trim() !== "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/member/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "가입에 실패했습니다.");
      await refresh();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "가입에 실패했습니다.");
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <PublicShell showTicker={false}>
        <AuthWrap>
          <AuthCard>
            <AuthTitle>가입 완료 🎉</AuthTitle>
            <AuthSub>
              환영합니다! 입력하신 이메일로 인증 메일을 보냈습니다. 메일의 링크를
              눌러 이메일 인증을 완료해 주세요. (인증 전에도 이용은 가능합니다.)
            </AuthSub>
            <SubmitBtn type="button" onClick={() => router.push("/mypage")}>
              마이페이지로 이동
            </SubmitBtn>
          </AuthCard>
        </AuthWrap>
      </PublicShell>
    );
  }

  return (
    <PublicShell showTicker={false}>
      <AuthWrap>
        <AuthCard>
          <AuthTitle>회원가입</AuthTitle>
          <AuthSub>강의·행사 신청 내역을 관리하려면 회원으로 가입하세요.</AuthSub>
          <AuthForm onSubmit={submit}>
            <Field>
              <FieldLabel>
                이메일 <em>*</em>
              </FieldLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <FieldLabel>
                비밀번호 <em>*</em>
              </FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="8자 이상"
                required
              />
              {password !== "" && password.length < 8 ? (
                <span style={{ fontSize: "0.72rem", color: eduColors.danger }}>
                  비밀번호는 8자 이상이어야 합니다.
                </span>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>
                이름 <em>*</em>
              </FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel>
                전화번호 <em>*</em>
              </FieldLabel>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="010-0000-0000"
                required
              />
            </Field>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            <SubmitBtn type="submit" disabled={!canSubmit}>
              {submitting ? "가입 중…" : "가입하기"}
            </SubmitBtn>
          </AuthForm>

          {googleEnabled ? (
            <>
              <Divider>또는</Divider>
              <GoogleBtn href="/api/member/auth/google">Google로 시작하기</GoogleBtn>
            </>
          ) : null}

          <AuthFootLink>
            이미 회원이신가요? <Link href="/login">로그인</Link>
          </AuthFootLink>
        </AuthCard>
      </AuthWrap>
    </PublicShell>
  );
}
