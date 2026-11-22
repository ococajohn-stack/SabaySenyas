import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FINGERSPELLING_LETTERS } from '../data/fingerspelling';

const FRAME_INTERVAL_MS = 350;
const MAX_FRAME_GAP_MS = 1000;
const HOLD_DURATION_MS = 1400;
const PROGRESS_INTERVAL_MS = 80;
const GRID_SIZE = 48;
const GRID_AREA = GRID_SIZE * GRID_SIZE;
const NO_HAND_MESSAGE = 'Walang nakitang kamay — itaas ang iyong kamay sa loob ng gabay';
const HAND_MESSAGE = 'Panatilihin ang kamay sa gabay...';

export type DetectorStatus = 'loading' | 'ready' | 'error';

export type DetectorProgress = {
  signId: string;
  confidence: number;
  holdProgress: number;
  detected: boolean;
  message: string;
};

type Props = {
  targetSignId: string;
  onProgress: (progress: DetectorProgress) => void;
  onVerified: (signId: string) => void;
  onStatusChange?: (status: DetectorStatus, message?: string) => void;
};

type HandOrientation = 'up' | 'side' | 'down';

function decodeBase64(value: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const byteLength = Math.floor((value.length * 3) / 4) - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0);
  const bytes = new Uint8Array(byteLength);
  let accumulator = 0;
  let bitCount = 0;
  let outputIndex = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '=') break;
    const valueIndex = alphabet.indexOf(character);
    if (valueIndex < 0) continue;

    accumulator = (accumulator << 6) | valueIndex;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[outputIndex] = (accumulator >> bitCount) & 0xff;
      outputIndex += 1;
    }
  }

  if (outputIndex !== byteLength) {
    throw new Error('Hindi mabasa ang na-sample na larawan mula sa kamera.');
  }
  return bytes;
}

function isSkinPixel(red: number, green: number, blue: number) {
  if (red < 45 || green < 20 || blue < 10 || red < green * 0.85) return false;
  const chromaBlue = 128 - 0.169 * red - 0.331 * green + 0.5 * blue;
  const chromaRed = 128 + 0.5 * red - 0.419 * green - 0.081 * blue;
  return chromaBlue >= 70 && chromaBlue <= 135 && chromaRed >= 125 && chromaRed <= 185;
}

function countRowRuns(
  labels: Int16Array,
  row: number,
  left: number,
  right: number,
  componentId: number,
) {
  let runs = 0;
  let insideRun = false;
  for (let x = left; x <= right; x += 1) {
    const included = labels[row * GRID_SIZE + x] === componentId;
    if (included && !insideRun) runs += 1;
    insideRun = included;
  }
  return runs;
}

function countColumnRuns(
  labels: Int16Array,
  column: number,
  top: number,
  bottom: number,
  componentId: number,
) {
  let runs = 0;
  let insideRun = false;
  for (let y = top; y <= bottom; y += 1) {
    const included = labels[y * GRID_SIZE + column] === componentId;
    if (included && !insideRun) runs += 1;
    insideRun = included;
  }
  return runs;
}

function hasSeparatedProtrusions(
  labels: Int16Array,
  componentId: number,
  bounds: { left: number; right: number; top: number; bottom: number },
  direction: HandOrientation,
) {
  let splitSlices = 0;
  if (direction === 'up' || direction === 'down') {
    const height = bounds.bottom - bounds.top + 1;
    const sliceCount = Math.max(2, Math.floor(height * 0.45));
    for (let offset = 0; offset < sliceCount; offset += 1) {
      const row = direction === 'up' ? bounds.top + offset : bounds.bottom - offset;
      if (countRowRuns(labels, row, bounds.left, bounds.right, componentId) >= 2) {
        splitSlices += 1;
      }
    }
  } else {
    const width = bounds.right - bounds.left + 1;
    const sliceCount = Math.max(2, Math.floor(width * 0.45));
    for (let offset = 0; offset < sliceCount; offset += 1) {
      const column = bounds.left + offset;
      if (countColumnRuns(labels, column, bounds.top, bounds.bottom, componentId) >= 2) {
        splitSlices += 1;
      }
    }
    if (splitSlices < 2) {
      for (let offset = 0; offset < sliceCount; offset += 1) {
        const column = bounds.right - offset;
        if (countColumnRuns(labels, column, bounds.top, bounds.bottom, componentId) >= 2) {
          splitSlices += 1;
        }
      }
    }
  }
  return splitSlices >= 2;
}

function hasClearGap(
  labels: Int16Array,
  componentId: number,
  bounds: { left: number; right: number; top: number; bottom: number },
  direction: HandOrientation,
) {
  let skinPixelsInGap = 0;
  if (direction === 'up' || direction === 'down') {
    const firstRow = direction === 'up' ? bounds.top - 3 : bounds.bottom + 1;
    for (let y = firstRow; y <= firstRow + 2; y += 1) {
      if (y < 0 || y >= GRID_SIZE) continue;
      for (let x = bounds.left; x <= bounds.right; x += 1) {
        if (labels[y * GRID_SIZE + x] !== 0 && labels[y * GRID_SIZE + x] !== componentId) {
          skinPixelsInGap += 1;
        }
      }
    }
  } else {
    for (let offset = 1; offset <= 3; offset += 1) {
      for (const x of [bounds.left - offset, bounds.right + offset]) {
        if (x < 0 || x >= GRID_SIZE) continue;
        for (let y = bounds.top; y <= bounds.bottom; y += 1) {
          if (labels[y * GRID_SIZE + x] !== 0 && labels[y * GRID_SIZE + x] !== componentId) {
            skinPixelsInGap += 1;
          }
        }
      }
    }
  }
  return skinPixelsInGap <= 2;
}

function expectedOrientation(targetSignId: string): HandOrientation | null {
  const letter = targetSignId.match(/^letter:([A-Z]):/);
  if (!letter) return null;
  return FINGERSPELLING_LETTERS.find((item) => item.letter === letter[1])?.orientation ?? 'up';
}

function hasRaisedHand(
  pixels: Uint8Array,
  orientation: HandOrientation | null,
  backgroundPixels: Uint8Array | null,
) {
  const skinMask = new Uint8Array(GRID_AREA);
  const labels = new Int16Array(GRID_AREA);
  for (let y = 2; y < 40; y += 1) {
    for (let x = 4; x < 44; x += 1) {
      const pixelOffset = (y * GRID_SIZE + x) * 4;
      const differsFromBackground = backgroundPixels === null
        || Math.abs(pixels[pixelOffset] - backgroundPixels[pixelOffset])
          + Math.abs(pixels[pixelOffset + 1] - backgroundPixels[pixelOffset + 1])
          + Math.abs(pixels[pixelOffset + 2] - backgroundPixels[pixelOffset + 2]) > 48;
      if (
        differsFromBackground
        && isSkinPixel(pixels[pixelOffset], pixels[pixelOffset + 1], pixels[pixelOffset + 2])
      ) {
        skinMask[y * GRID_SIZE + x] = 1;
      }
    }
  }

  const stack = new Int16Array(GRID_AREA);
  let componentId = 0;
  for (let index = 0; index < GRID_AREA; index += 1) {
    if (!skinMask[index] || labels[index]) continue;
    componentId += 1;
    let stackSize = 1;
    stack[0] = index;
    labels[index] = componentId;
    let area = 0;
    let left = GRID_SIZE;
    let right = 0;
    let top = GRID_SIZE;
    let bottom = 0;
    let sumX = 0;
    let sumY = 0;

    while (stackSize > 0) {
      const pixelIndex = stack[--stackSize];
      const x = pixelIndex % GRID_SIZE;
      const y = Math.floor(pixelIndex / GRID_SIZE);
      area += 1;
      sumX += x;
      sumY += y;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);

      for (let nextY = Math.max(0, y - 1); nextY <= Math.min(GRID_SIZE - 1, y + 1); nextY += 1) {
        for (let nextX = Math.max(0, x - 1); nextX <= Math.min(GRID_SIZE - 1, x + 1); nextX += 1) {
          const nextIndex = nextY * GRID_SIZE + nextX;
          if (skinMask[nextIndex] && !labels[nextIndex]) {
            labels[nextIndex] = componentId;
            stack[stackSize] = nextIndex;
            stackSize += 1;
          }
        }
      }
    }

    const width = right - left + 1;
    const height = bottom - top + 1;
    const centerX = sumX / area;
    const centerY = sumY / area;
    if (
      area < 25
      || area > 520
      || width < 5
      || height < 7
      || centerX < 7
      || centerX > 40
      || centerY < 8
      || centerY > 34
      || bottom > 38
      || area / (width * height) < 0.18
    ) {
      continue;
    }

    const bounds = { left, right, top, bottom };
    const directions: HandOrientation[] = orientation ? [orientation] : ['up', 'side'];
    if (directions.some((direction) => (
      hasSeparatedProtrusions(labels, componentId, bounds, direction)
      && hasClearGap(labels, componentId, bounds, direction)
    ))) {
      return true;
    }
  }
  return false;
}

export default function SignGestureDetector({
  targetSignId,
  onProgress,
  onVerified,
  onStatusChange,
}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const targetRef = useRef(targetSignId);
  const callbacksRef = useRef({ onProgress, onVerified, onStatusChange });
  const backgroundPixelsRef = useRef<Uint8Array | null>(null);
  const holdStartedAtRef = useRef<number | null>(null);
  const lastDetectedAtRef = useRef<number | null>(null);
  const isDetectedRef = useRef(false);
  const verifiedTargetRef = useRef<string | null>(null);
  const hasReportedErrorRef = useRef(false);

  useEffect(() => {
    callbacksRef.current = { onProgress, onVerified, onStatusChange };
  }, [onProgress, onStatusChange, onVerified]);

  useEffect(() => {
    targetRef.current = targetSignId;
    holdStartedAtRef.current = null;
    lastDetectedAtRef.current = null;
    isDetectedRef.current = false;
    verifiedTargetRef.current = null;
    callbacksRef.current.onProgress({
      signId: targetSignId,
      confidence: 0,
      holdProgress: 0,
      detected: false,
      message: NO_HAND_MESSAGE,
    });
  }, [targetSignId]);

  useEffect(() => {
    callbacksRef.current.onStatusChange?.('loading', 'Inihahanda ang kamera...');
    const timer = setInterval(() => {
      if (!isDetectedRef.current || holdStartedAtRef.current === null) return;
      const now = Date.now();
      const lastDetectedAt = lastDetectedAtRef.current;
      if (lastDetectedAt === null || now - lastDetectedAt > MAX_FRAME_GAP_MS) {
        isDetectedRef.current = false;
        holdStartedAtRef.current = null;
        callbacksRef.current.onProgress({
          signId: targetRef.current,
          confidence: 0,
          holdProgress: 0,
          detected: false,
          message: NO_HAND_MESSAGE,
        });
        return;
      }

      const holdProgress = Math.min((now - holdStartedAtRef.current) / HOLD_DURATION_MS, 1);
      callbacksRef.current.onProgress({
        signId: targetRef.current,
        confidence: 85,
        holdProgress,
        detected: true,
        message: HAND_MESSAGE,
      });
      if (holdProgress >= 1 && verifiedTargetRef.current !== targetRef.current) {
        verifiedTargetRef.current = targetRef.current;
        callbacksRef.current.onVerified(targetRef.current);
      }
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!cameraReady) return undefined;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let capturedUri: string | null = null;
    let resizedUri: string | null = null;

    const sampleFrame = async () => {
      const sampleStartedAt = Date.now();
      try {
        const camera = cameraRef.current;
        if (!camera) return;

        const picture = await camera.takePictureAsync({
          base64: true,
          quality: 0.1,
          skipProcessing: true,
          shutterSound: false,
        });
        capturedUri = picture.uri;
        if (!picture.base64) {
          throw new Error('Walang laman ang larawan mula sa kamera.');
        }

        const imageContext = ImageManipulator.manipulate(picture.uri, {
          maxWidth: GRID_SIZE,
          maxHeight: GRID_SIZE,
        });
        if (picture.width > picture.height) imageContext.rotate(90);
        imageContext.resize({ width: GRID_SIZE, height: GRID_SIZE });
        const image = await imageContext.renderAsync();
        const resized = await image.saveAsync({
          base64: true,
          compress: 0.65,
          format: SaveFormat.JPEG,
        });
        resizedUri = resized.uri;
        if (!resized.base64) {
          throw new Error('Hindi maihanda ang maliit na frame para sa pagsusuri.');
        }

        const decoded = decode(decodeBase64(resized.base64), { useTArray: true, formatAsRGBA: true });
        if (decoded.width !== GRID_SIZE || decoded.height !== GRID_SIZE) {
          throw new Error('Hindi tugma ang sukat ng na-sample na frame.');
        }

        const detected = hasRaisedHand(
          decoded.data,
          expectedOrientation(targetRef.current),
          backgroundPixelsRef.current,
        );
        if (cancelled) return;
        if (!detected && backgroundPixelsRef.current === null) {
          backgroundPixelsRef.current = decoded.data.slice();
        }
        if (hasReportedErrorRef.current) {
          hasReportedErrorRef.current = false;
          callbacksRef.current.onStatusChange?.('ready');
        }
        if (detected) {
          const now = Date.now();
          if (!isDetectedRef.current) holdStartedAtRef.current = now;
          isDetectedRef.current = true;
          lastDetectedAtRef.current = now;
        } else {
          isDetectedRef.current = false;
          holdStartedAtRef.current = null;
          lastDetectedAtRef.current = null;
          callbacksRef.current.onProgress({
            signId: targetRef.current,
            confidence: 0,
            holdProgress: 0,
            detected: false,
            message: NO_HAND_MESSAGE,
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          hasReportedErrorRef.current = true;
          callbacksRef.current.onStatusChange?.('error', `Hindi masuri ang frame ng kamera: ${message}`);
          isDetectedRef.current = false;
          holdStartedAtRef.current = null;
          lastDetectedAtRef.current = null;
          callbacksRef.current.onProgress({
            signId: targetRef.current,
            confidence: 0,
            holdProgress: 0,
            detected: false,
            message: NO_HAND_MESSAGE,
          });
        }
      } finally {
        const temporaryUris = [capturedUri, resizedUri].filter((uri): uri is string => uri !== null);
        capturedUri = null;
        resizedUri = null;
        try {
          await Promise.all(temporaryUris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true })));
        } catch (error) {
          if (!cancelled) {
            const message = error instanceof Error ? error.message : String(error);
            hasReportedErrorRef.current = true;
            callbacksRef.current.onStatusChange?.('error', `Hindi malinis ang pansamantalang larawan: ${message}`);
          }
        }
        const delay = Math.max(0, FRAME_INTERVAL_MS - (Date.now() - sampleStartedAt));
        if (!cancelled) timeout = setTimeout(() => { void sampleFrame(); }, delay);
      }
    };

    void sampleFrame();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [cameraReady]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <CameraView
        ref={cameraRef}
        facing="front"
        style={StyleSheet.absoluteFill}
        onCameraReady={() => {
          setCameraReady(true);
          callbacksRef.current.onStatusChange?.('ready');
        }}
        onMountError={(event) => {
          callbacksRef.current.onStatusChange?.('error', `Hindi mabuksan ang kamera: ${event.message}`);
        }}
      />
    </View>
  );
}
