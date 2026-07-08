export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 24px 96px',
        lineHeight: 1.8,
        color: '#1a1a1a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        개인정보처리방침
      </h1>
      <p style={{ color: '#666', marginBottom: 40, fontSize: 14 }}>
        시행일: 2026년 7월 8일 · 적용 서비스: 춘심 뷰어 (evm-viewer-app)
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          1. 앱의 성격
        </h2>
        <p>
          춘심 뷰어(이하 &ldquo;앱&rdquo;)는 이더리움, Base, BNB Smart Chain
          등 공개 블록체인 네트워크상의 지갑 주소 잔고를 <b>조회만 하는</b>{' '}
          watch-only 애플리케이션입니다. 앱은 개인키·니모닉 등 지갑을
          제어할 수 있는 정보를 요청하거나 저장하지 않으며, 자산의 전송·
          스왑·서명 등 어떠한 트랜잭션 기능도 제공하지 않습니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          2. 수집하는 정보
        </h2>
        <p style={{ marginBottom: 12 }}>
          앱은 별도의 회원가입이나 로그인을 요구하지 않으며, 아래 정보는{' '}
          <b>이용자의 기기 내부(로컬 저장소)에만</b> 저장되고, 춘심팀
          서버로 전송되거나 서버에 보관되지 않습니다.
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li>이용자가 조회 등록한 지갑 주소 및 사용자가 지정한 별칭</li>
          <li>자산 표시 설정(온/오프), 통화 표시 단위, 테마 설정</li>
          <li>이용자가 직접 추가한 사용자 지정 토큰의 컨트랙트 주소 정보</li>
        </ul>
        <p>
          위 정보는 앱을 삭제하거나 기기 내 앱 데이터를 초기화하면 함께
          삭제됩니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          3. 카메라 접근 권한
        </h2>
        <p>
          앱은 QR 코드를 스캔하여 지갑 주소를 인식하는 목적으로만 카메라
          접근 권한을 요청합니다. 촬영된 영상이나 이미지는 저장되거나
          외부로 전송되지 않으며, QR 코드 인식 즉시 폐기됩니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          4. 서버로 전송되는 정보
        </h2>
        <p style={{ marginBottom: 12 }}>
          잔고·시세 조회를 위해, 이용자가 조회를 요청한 지갑 주소와
          조회 대상 토큰 정보가 춘심팀이 운영하는 API 서버(choonsim.com)로
          전송됩니다. 이 요청은 아래 목적에 한해서만 사용되며, 별도로
          저장·분석되거나 제3자에게 제공되지 않습니다.
        </p>
        <ul style={{ paddingLeft: 20 }}>
          <li>블록체인 네트워크(RPC)에 잔고 조회를 대신 요청하기 위함</li>
          <li>시세 정보(환율, 토큰 가격) 조회를 위함</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          5. 제3자 서비스
        </h2>
        <p>
          앱은 잔고 조회를 위해 Alchemy 등 블록체인 인프라 제공업체의
          RPC 서비스를, 시세 조회를 위해 CoinGecko 등 시세 정보 제공업체의
          API를 이용합니다. 이 과정에서 조회 대상 지갑 주소가 해당
          서비스로 전달될 수 있으며, 각 서비스의 개인정보 처리방침이
          함께 적용될 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          6. 만 14세 미만 아동의 이용
        </h2>
        <p>
          본 앱은 만 14세 미만 아동을 대상으로 하지 않으며, 아동으로부터
          개인정보를 의도적으로 수집하지 않습니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          7. 문의처
        </h2>
        <p>
          본 방침에 대한 문의사항은 아래로 연락해 주시기 바랍니다.
        </p>
        <p style={{ marginTop: 8 }}>
          이메일: <b>choonsim.dev@gmail.com</b>
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          8. 방침의 변경
        </h2>
        <p>
          본 방침은 서비스 내용 변경에 따라 개정될 수 있으며, 변경 시 본
          페이지를 통해 고지합니다.
        </p>
      </section>
    </main>
  );
}
