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
}

/** 모바일에서 후면·외부 카메라 우선 (라벨 휴리스틱) */
async function pickCameraDeviceId(): Promise<string | undefined> {
  try {
    const devices = await BrowserCodeReader.listVideoInputDevices();
    if (devices.length === 0) return undefined;
    const back = devices.find((d) =>
      /back|rear|environment|후면|wide|ultra|world|외부/i.test(d.label),
    );
    return back?.deviceId ?? devices[devices.length - 1]?.deviceId;
  } catch {
    return undefined;
  }
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

export function WalletQrScanner({ onDetected, paused }: WalletQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const debounceRef = useRef<{ addr: string; t: number }>({
    addr: "",
    t: 0,
  });
  const [error, setError] = useState<string | null>(null);
  /** 기본 켜짐.「카메라 끄기」시에만 유도 화면으로 전환 */
  const [cameraActive, setCameraActive] = useState(true);

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    if (!cameraActive || paused) {
      stop();
      return;
    }

    let cancelled = false;

    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, "UTF-8");

    const reader = new BrowserQRCodeReader(hints, {
      /** 기본 500ms는 프레임 시도가 너무 느려 인식이 답답함 */
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
      onDetected(addr);
    };

    const decodeCallback = (result: { getText: () => string } | undefined, err: unknown | undefined) => {
      if (cancelled) return;
      if (result) {
        onResult(result.getText());
        return;
      }
      if (err && !(err instanceof NotFoundException)) {
        console.warn("[WalletQrScanner]", err);
      }
    };

    (async () => {
      await waitNextFrames(2);
      if (cancelled) return;

      const videoEl = videoRef.current;
      if (!videoEl) return;

      setError(null);

      const videoConstraints: MediaTrackConstraints = {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
      };

      const tryDecode = async (
        start: () => Promise<{ stop: () => void }>,
      ): Promise<{ stop: () => void } | null> => {
        try {
          return await start();
        } catch {
          return null;
        }
      };

      let controls =
        (await tryDecode(() =>
          reader.decodeFromConstraints({ video: videoConstraints }, videoEl, decodeCallback),
        )) ??
        (await tryDecode(async () => {
          const id = await pickCameraDeviceId();
          return reader.decodeFromVideoDevice(id, videoEl, decodeCallback);
        })) ??
        (await tryDecode(() =>
          reader.decodeFromVideoDevice(undefined, videoEl, decodeCallback),
        ));

      if (cancelled) {
        controls?.stop();
        return;
      }

      if (!controls) {
        setError(
          "카메라를 켤 수 없습니다. 브라우저 권한·HTTPS(또는 localhost)를 확인해 주세요.",
        );
        setCameraActive(false);
        return;
      }

      controlsRef.current = controls;
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [cameraActive, paused, onDetected, stop]);

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
            {paused ? (
              <S.QrPausedOverlay aria-live="polite">잔고 조회 중…</S.QrPausedOverlay>
            ) : null}
          </>
        )}
      </S.QrVideoWrap>
      {cameraActive ? (
        <>
          <S.QrScannerHint>
            <strong>공개 주소를 스캔해 주세요.</strong> QR을 파란 모서리 안에
            맞추면 주소가 입력되고 자동으로 조회됩니다.
          </S.QrScannerHint>
          <S.QrStopRow>
            <S.QrStopButton
              type="button"
              onClick={() => {
                setCameraActive(false);
                stop();
                setError(null);
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
