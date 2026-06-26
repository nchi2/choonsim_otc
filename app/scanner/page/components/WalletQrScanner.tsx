"use client";

import {
  BrowserCodeReader,
  BrowserQRCodeReader,
} from "@zxing/browser";
import { DecodeHintType, NotFoundException } from "@zxing/library";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { extractEvmAddressFromText } from "@/app/scanner/lib/utils";
import * as S from "../styles";

export interface WalletQrScannerProps {
  /** 유효한 0x 주소가 들어오면 호출 */
  onDetected: (address: string) => void;
  /** true면 스트림 중단 (잔고 조회 중 등) */
  paused: boolean;
  /** 연속 스캔 모드 — 안내 문구 변경 */
  continuous?: boolean;
  /** 증가할 때마다 성공 플래시 표시 */
  successFlashTick?: number;
}

const SCAN_FAIL_HINT_MS = 12_000;
const DEFAULT_HINT =
  "공개 주소를 스캔해 주세요. QR을 파란 모서리 안에 맞추면 주소가 입력되고 자동으로 조회됩니다.";
const CONTINUOUS_HINT =
  "연속 스캔: QR을 읽을 때마다 주소가 목록에 추가됩니다. 중복 주소는 무시됩니다.";
const FAIL_HINT = "인식이 잘 안 되면 카메라 전환을 눌러보세요.";

/** 후면 후보 — 큰 가점 */
const BACK_LABEL_RE =
  /back|rear|environment|후면|world|외부|camera\s*0\b/i;
/** 전면 — 큰 감점 */
const FRONT_LABEL_RE = /front|전면|selfie|user|facetime/i;
/**
 * 초광각·망원·보조 렌즈 — 큰 감점.
 * 단독 "wide"는 iPhone 메인("Back Dual Wide Camera")과 혼동되므로 제외.
 */
const EXCLUDE_LABEL_RE =
  /ultra|wide[- ]?angle|광각|telephoto|tele|zoom|macro|depth|truedepth|lidari/i;

type VideoDevice = MediaDeviceInfo;

function scoreCameraLabel(label: string): number {
  const l = label.toLowerCase();
  if (!l.trim()) return 0;
  let score = 0;
  if (BACK_LABEL_RE.test(l)) score += 100;
  if (FRONT_LABEL_RE.test(l)) score -= 200;
  if (EXCLUDE_LABEL_RE.test(l)) score -= 150;
  return score;
}

/** 점수 최고 → 동점이면 목록 앞쪽(낮은 index) 우선 */
function pickBestDeviceId(devices: VideoDevice[]): string | undefined {
  if (devices.length === 0) return undefined;
  let bestIdx = 0;
  let bestScore = scoreCameraLabel(devices[0].label);
  for (let i = 1; i < devices.length; i++) {
    const s = scoreCameraLabel(devices[i].label);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return devices[bestIdx].deviceId;
}

/** 권한 전 enumerateDevices 라벨이 비어 있으므로 임시 스트림으로 권한 확보 */
async function ensureCameraPermission(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
  });
  stream.getTracks().forEach((t) => t.stop());
}

async function listVideoDevices(): Promise<VideoDevice[]> {
  return BrowserCodeReader.listVideoInputDevices();
}

function buildDeviceConstraints(
  deviceId: string,
  withFocus: boolean,
): MediaStreamConstraints {
  const video: MediaTrackConstraints & {
    advanced?: Array<{ focusMode?: string }>;
  } = {
    deviceId: { exact: deviceId },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };
  if (withFocus) {
    video.advanced = [{ focusMode: "continuous" }];
  }
  return { video };
}

function waitNextFrames(n = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = () => {
      if (n <= 0) {
        resolve();
        return;
      }
      n -= 1;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function SwitchCameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
      <path d="M13 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
      <path d="M8 12h8" />
      <path d="m16 9 3 3-3 3" />
      <path d="m8 15-3-3 3-3" />
    </svg>
  );
}

export function WalletQrScanner({
  onDetected,
  paused,
  continuous = false,
  successFlashTick = 0,
}: WalletQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const debounceRef = useRef<{ addr: string; t: number }>({
    addr: "",
    t: 0,
  });
  /** 같은 세션에서 마지막 성공 deviceId — localStorage 미사용 */
  const preferredDeviceIdRef = useRef<string | undefined>(undefined);
  const currentDeviceIdRef = useRef<string | undefined>(undefined);
  const scanFailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([]);
  const [hintText, setHintText] = useState(
    continuous ? CONTINUOUS_HINT : DEFAULT_HINT,
  );
  const [restartCounter, setRestartCounter] = useState(0);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  useEffect(() => {
    setHintText(continuous ? CONTINUOUS_HINT : DEFAULT_HINT);
  }, [continuous]);

  useEffect(() => {
    if (successFlashTick <= 0) return;
    setShowSuccessFlash(true);
    const t = setTimeout(() => setShowSuccessFlash(false), 450);
    return () => clearTimeout(t);
  }, [successFlashTick]);

  const clearScanFailTimer = useCallback(() => {
    if (scanFailTimerRef.current) {
      clearTimeout(scanFailTimerRef.current);
      scanFailTimerRef.current = null;
    }
  }, []);

  const resetScanFailTimer = useCallback(() => {
    clearScanFailTimer();
    setHintText(continuous ? CONTINUOUS_HINT : DEFAULT_HINT);
    scanFailTimerRef.current = setTimeout(() => {
      setHintText(FAIL_HINT);
    }, SCAN_FAIL_HINT_MS);
  }, [clearScanFailTimer, continuous]);

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const switchCamera = useCallback(() => {
    const devices = videoDevices;
    if (devices.length < 2) return;

    const current = currentDeviceIdRef.current;
    const idx = devices.findIndex((d) => d.deviceId === current);
    const nextIdx = idx < 0 ? 0 : (idx + 1) % devices.length;
    preferredDeviceIdRef.current = devices[nextIdx].deviceId;

    resetScanFailTimer();
    stop();
    setRestartCounter((c) => c + 1);
  }, [videoDevices, resetScanFailTimer, stop]);

  useEffect(() => {
    if (!cameraActive || paused) {
      stop();
      clearScanFailTimer();
      return;
    }

    let cancelled = false;

    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, "UTF-8");

    const reader = new BrowserQRCodeReader(hints, {
      delayBetweenScanAttempts: 50,
      delayBetweenScanSuccess: 350,
      tryPlayVideoTimeout: 10_000,
    });
    const onResult = (text: string) => {
      const addr = extractEvmAddressFromText(text);
      if (!addr) return;
      const now = Date.now();
      const { addr: last, t } = debounceRef.current;
      if (addr === last && now - t < 2200) return;
      debounceRef.current = { addr, t: now };
      resetScanFailTimer();
      onDetected(addr);
    };

    const decodeCallback = (
      result: { getText: () => string } | undefined,
      err: unknown | undefined,
    ) => {
      if (cancelled) return;
      if (result) {
        onResult(result.getText());
        return;
      }
      if (err && !(err instanceof NotFoundException)) {
        console.warn("[WalletQrScanner]", err);
      }
    };

    const tryDecodeConstraints = async (
      constraints: MediaStreamConstraints,
    ): Promise<{ stop: () => void } | null> => {
      try {
        return await reader.decodeFromConstraints(
          constraints,
          videoRef.current!,
          decodeCallback,
        );
      } catch {
        return null;
      }
    };

    const openByDeviceId = async (
      deviceId: string,
    ): Promise<{ stop: () => void } | null> => {
      let controls = await tryDecodeConstraints(
        buildDeviceConstraints(deviceId, true),
      );
      if (!controls) {
        controls = await tryDecodeConstraints(
          buildDeviceConstraints(deviceId, false),
        );
      }
      return controls;
    };

    const startCamera = async (): Promise<{
      controls: { stop: () => void } | null;
      deviceId: string | undefined;
    }> => {
      try {
        await ensureCameraPermission();
      } catch {
        /* 권한 거부 — 아래 decode 단계에서 실패 처리 */
      }

      let devices: VideoDevice[] = [];
      try {
        devices = await listVideoDevices();
      } catch {
        devices = [];
      }

      if (!cancelled) {
        setVideoDevices(devices);
      }

      const candidateIds: string[] = [];
      const preferred = preferredDeviceIdRef.current;
      if (preferred && devices.some((d) => d.deviceId === preferred)) {
        candidateIds.push(preferred);
      }
      const best = pickBestDeviceId(devices);
      if (best && !candidateIds.includes(best)) {
        candidateIds.push(best);
      }

      for (const id of candidateIds) {
        const controls = await openByDeviceId(id);
        if (controls) {
          return { controls, deviceId: id };
        }
      }

      const fallback = await tryDecodeConstraints({
        video: { facingMode: { ideal: "environment" } },
      });
      return { controls: fallback, deviceId: undefined };
    };

    (async () => {
      await waitNextFrames(2);
      if (cancelled) return;

      const videoEl = videoRef.current;
      if (!videoEl) return;

      setError(null);
      resetScanFailTimer();

      const { controls, deviceId } = await startCamera();

      if (cancelled) {
        controls?.stop();
        return;
      }

      if (!controls) {
        setError(
          "카메라를 켤 수 없습니다. 브라우저 권한·HTTPS(또는 localhost)를 확인해 주세요.",
        );
        setCameraActive(false);
        clearScanFailTimer();
        return;
      }

      controlsRef.current = controls;
      currentDeviceIdRef.current = deviceId;
      if (deviceId) {
        preferredDeviceIdRef.current = deviceId;
      }
    })();

    return () => {
      cancelled = true;
      stop();
      clearScanFailTimer();
    };
  }, [
    cameraActive,
    paused,
    onDetected,
    stop,
    restartCounter,
    resetScanFailTimer,
    clearScanFailTimer,
  ]);

  const showSwitchButton =
    cameraActive && !paused && videoDevices.length > 1;

  return (
    <S.QrScannerBlock aria-label="지갑 주소 QR 스캔">
      <S.QrVideoWrap>
        <S.QrVideo ref={videoRef} muted playsInline autoPlay />
        {!cameraActive ? (
          <S.QrGuideOverlay aria-label="QR 스캔 — 카메라를 켜려면 버튼을 누르세요">
            <S.QrGuideInner>
              <S.QrGuideFrame aria-hidden />
              <S.QrStartButton
                type="button"
                onClick={() => {
                  setError(null);
                  setHintText(continuous ? CONTINUOUS_HINT : DEFAULT_HINT);
                  setCameraActive(true);
                }}
              >
                카메라로 스캔하기
              </S.QrStartButton>
            </S.QrGuideInner>
          </S.QrGuideOverlay>
        ) : (
          <>
            <S.QrScanHud aria-hidden>
              <S.QrScanCorners />
            </S.QrScanHud>
            {showSwitchButton ? (
              <S.QrSwitchButton
                type="button"
                aria-label="카메라 전환"
                title="카메라 전환"
                onClick={switchCamera}
              >
                <SwitchCameraIcon />
                전환
              </S.QrSwitchButton>
            ) : null}
            {paused ? (
              <S.QrPausedOverlay aria-live="polite">잔고 조회 중…</S.QrPausedOverlay>
            ) : null}
            {showSuccessFlash ? <S.QrSuccessFlash aria-hidden /> : null}
          </>
        )}
      </S.QrVideoWrap>
      {cameraActive ? (
        <>
          <S.QrScannerHint>
            <strong>{hintText}</strong>
          </S.QrScannerHint>
          <S.QrStopRow>
            <S.QrStopButton
              type="button"
              onClick={() => {
                setCameraActive(false);
                stop();
                setError(null);
                clearScanFailTimer();
                setHintText(continuous ? CONTINUOUS_HINT : DEFAULT_HINT);
              }}
            >
              카메라 끄기
            </S.QrStopButton>
          </S.QrStopRow>
        </>
      ) : null}
      {error ? <S.QrScannerError role="alert">{error}</S.QrScannerError> : null}
    </S.QrScannerBlock>
  );
}
