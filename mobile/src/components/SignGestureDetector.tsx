import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { FINGERSPELLING_LETTERS } from '../data/fingerspelling';

// Metro requires static asset references so these files are bundled offline.
/* eslint-disable @typescript-eslint/no-require-imports */
const MODEL_ASSETS = [
  require('../../assets/models/vision_bundle.bin'),
  require('../../assets/models/vision_wasm_internal.js.bin'),
  require('../../assets/models/vision_wasm_internal.wasm.bin'),
  require('../../assets/models/hand_landmarker.task.bin'),
  require('../../assets/models/LICENSE.txt'),
];
/* eslint-enable @typescript-eslint/no-require-imports */

const MODEL_FILENAMES = [
  'vision_bundle.js',
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'hand_landmarker.task',
  'LICENSE.txt',
] as const;

const MODEL_CACHE_VERSION = 'mediapipe-hand-landmarker-1.2.3-v1';
const HOLD_DURATION_MS = 1200;

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

type WebViewSource = {
  uri: string;
  baseUrl: string;
};

function buildDetectorHtml(targetSignId: string, modelDirectory: string) {
  const letterDefinitions = FINGERSPELLING_LETTERS.map(
    ({ letter, fingers, thumb, orientation, motion }) => ({
      letter,
      fingers,
      thumb,
      orientation,
      motion,
    }),
  );

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' file: blob:; script-src 'self' file: 'unsafe-inline' 'wasm-unsafe-eval'; connect-src 'self' file: blob:; img-src 'self' data: file:; media-src 'self' blob: file:; worker-src 'self' blob: file:">
  <style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}video{width:1px;height:1px;opacity:0}</style>
</head>
<body>
  <video id="camera" autoplay muted playsinline></video>
  <script>
    const MODEL_DIRECTORY = ${JSON.stringify(modelDirectory)};
    const INITIAL_TARGET = ${JSON.stringify(targetSignId)};
    const LETTERS = ${JSON.stringify(letterDefinitions)};
    const HOLD_DURATION = ${HOLD_DURATION_MS};
    const video = document.getElementById('camera');
    let activeTarget = INITIAL_TARGET;
    let landmarker = null;
    let cameraStream = null;
    let holdStartedAt = null;
    let verifiedTarget = null;
    let motionSeenAt = null;
    let history = [];
    let frameRequest = null;
    let lastSentAt = 0;
    let stopped = false;

    function post(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    }

    function resetHold() {
      holdStartedAt = null;
      verifiedTarget = null;
    }

    function motionReady(seen, duration = 4000) {
      if (seen) motionSeenAt = performance.now();
      return motionSeenAt !== null && performance.now() - motionSeenAt < duration;
    }

    function sendProgress(confidence, holdProgress, detected, message) {
      const now = performance.now();
      if (now - lastSentAt < 60 && holdProgress < 1) return;
      lastSentAt = now;
      post({
        type: 'progress',
        signId: activeTarget,
        confidence: Math.round(confidence * 100),
        holdProgress: Math.max(0, Math.min(holdProgress, 1)),
        detected,
        message,
      });
    }

    function clamp(value) {
      return Math.max(0, Math.min(1, value));
    }

    function distance(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function angle(a, b, c) {
      const abx = a.x - b.x;
      const aby = a.y - b.y;
      const cbx = c.x - b.x;
      const cby = c.y - b.y;
      const denominator = Math.sqrt((abx * abx + aby * aby) * (cbx * cbx + cby * cby));
      if (!denominator) return 0;
      const cosine = Math.max(-1, Math.min(1, (abx * cbx + aby * cby) / denominator));
      return Math.acos(cosine) * 180 / Math.PI;
    }

    function rangeScore(value, minimum, maximum) {
      if (value >= minimum && value <= maximum) return 1;
      const distanceFromRange = value < minimum ? minimum - value : value - maximum;
      return clamp(1 - distanceFromRange / Math.max(maximum - minimum, 1));
    }

    function orientation(a, b, c) {
      return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
    }

    function segmentsIntersect(a, b, c, d) {
      const abC = orientation(a, b, c);
      const abD = orientation(a, b, d);
      const cdA = orientation(c, d, a);
      const cdB = orientation(c, d, b);
      return abC * abD < 0 && cdA * cdB < 0;
    }

    function handFeatures(hand) {
      const wrist = hand[0];
      const palmScale = Math.max(distance(wrist, hand[9]), 0.001);
      const fingerBases = [5, 9, 13, 17];
      const chains = [
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
        [17, 18, 19, 20],
      ];
      const fingers = chains.map((chain) => {
        const [base, pip, dip, tip] = chain;
        const pipAngle = angle(hand[base], hand[pip], hand[tip]);
        const dipAngle = angle(hand[pip], hand[dip], hand[tip]);
        const reach = distance(wrist, hand[tip]) / palmScale;
        const extended = clamp((pipAngle - 110) / 70) * 0.58
          + clamp((reach - 1.0) / 0.85) * 0.42;
        const curved = rangeScore(pipAngle, 115, 155) * 0.45
          + rangeScore(dipAngle, 105, 155) * 0.35
          + rangeScore(reach, 1.05, 1.75) * 0.2;
        const hooked = rangeScore(pipAngle, 65, 125) * 0.6
          + clamp((dipAngle - 120) / 55) * 0.4;
        return {
          extended,
          curled: 1 - extended,
          curved,
          hooked,
        };
      });

      const thumbTip = hand[4];
      const palmCenter = {
        x: (hand[0].x + hand[5].x + hand[9].x + hand[13].x + hand[17].x) / 5,
        y: (hand[0].y + hand[5].y + hand[9].y + hand[13].y + hand[17].y) / 5,
      };
      const thumbReach = distance(thumbTip, wrist) / palmScale;
      const indexMiddleDistance = distance(hand[8], hand[12]) / palmScale;
      const betweenCenter = {
        x: (hand[6].x + hand[10].x) / 2,
        y: (hand[6].y + hand[10].y) / 2,
      };
      const acrossCenter = {
        x: (hand[6].x + hand[9].x) / 2,
        y: (hand[6].y + hand[9].y) / 2,
      };
      const underThreeCenter = {
        x: (hand[13].x + hand[17].x) / 2,
        y: (hand[13].y + hand[17].y) / 2,
      };
      const underTwoCenter = {
        x: (hand[9].x + hand[13].x) / 2,
        y: (hand[9].y + hand[13].y) / 2,
      };
      const thumbScores = {
        side: clamp((thumbReach - 0.55) / 0.85) * 0.7
          + clamp(1 - distance(thumbTip, hand[5]) / (palmScale * 1.1)) * 0.3,
        folded: clamp(1 - Math.abs(thumbReach - 0.72) / 0.7) * 0.55
          + clamp(1 - distance(thumbTip, palmCenter) / (palmScale * 0.85)) * 0.45,
        circle: clamp(1 - distance(thumbTip, hand[8]) / (palmScale * 0.55)),
        across: clamp(1 - distance(thumbTip, acrossCenter) / (palmScale * 0.7)),
        tucked: clamp(1 - distance(thumbTip, palmCenter) / (palmScale * 0.65)),
        between: clamp(1 - distance(thumbTip, betweenCenter) / (palmScale * 0.65)),
        'under-three': clamp(1 - distance(thumbTip, underThreeCenter) / (palmScale * 0.8)),
        'under-two': clamp(1 - distance(thumbTip, underTwoCenter) / (palmScale * 0.8)),
      };
      const palmDirectionX = hand[9].x - wrist.x;
      const palmDirectionY = hand[9].y - wrist.y;
      const handOrientation = Math.abs(palmDirectionX) > Math.abs(palmDirectionY)
        ? 'side'
        : palmDirectionY < 0 ? 'up' : 'down';
      const spread = indexMiddleDistance;
      const crossed = segmentsIntersect(hand[5], hand[8], hand[9], hand[12]) ? 1 : 0;
      const center = {
        x: fingerBases.reduce((sum, index) => sum + hand[index].x, 0) / fingerBases.length,
        y: fingerBases.reduce((sum, index) => sum + hand[index].y, 0) / fingerBases.length,
      };

      return {
        fingers,
        thumbScores,
        palmScale,
        handOrientation,
        spread,
        crossed,
        center,
      };
    }

    function isInGuide(features) {
      return features.center.x >= 0.12 && features.center.x <= 0.88
        && features.center.y >= 0.1 && features.center.y <= 0.88;
    }

    function scoreLetter(letter, features) {
      const definition = LETTERS.find((item) => item.letter === letter);
      if (!definition) return 0;
      const fingerScores = definition.fingers.map((shape, index) => (
        shape === 'crossed' ? features.crossed : features.fingers[index][shape]
      ));
      const fingerAverage = fingerScores.reduce((sum, score) => sum + score, 0) / fingerScores.length;
      const fingerMinimum = Math.min(...fingerScores);
      const thumbScore = features.thumbScores[definition.thumb] || 0;
      let score = fingerAverage * 0.68 + thumbScore * 0.24;
      const requiredScore = 0.76;

      if (definition.orientation) {
        score = score * 0.85 + (features.handOrientation === definition.orientation ? 0.15 : 0);
      }
      if (letter === 'U') {
        score = score * 0.8 + clamp(1 - features.spread / 0.55) * 0.2;
      } else if (letter === 'V' || letter === 'K') {
        score = score * 0.8 + clamp((features.spread - 0.08) / 0.5) * 0.2;
      }

      if (fingerMinimum < 0.52 || thumbScore < 0.45) return 0;
      if (score < requiredScore) return 0;
      if (definition.motion && !motionReady(hasMotion(definition.motion))) return 0;
      return score;
    }

    function scoreSign(signId, features, handCount) {
      const extended = features.fingers.map((finger) => finger.extended);
      const openPalm = extended.every((value) => value > 0.52);
      const indexOnly = extended[0] > 0.62 && extended.slice(1).every((value) => value < 0.5);
      const twoFingers = extended[0] > 0.58 && extended[1] > 0.58
        && extended[2] < 0.5 && extended[3] < 0.5;
      const recent = history.filter((sample) => performance.now() - sample.time < 1400);
      const verticalRange = recent.length
        ? Math.max(...recent.map((sample) => sample.center.y))
          - Math.min(...recent.map((sample) => sample.center.y))
        : 0;
      const horizontalRange = recent.length
        ? Math.max(...recent.map((sample) => sample.center.x))
          - Math.min(...recent.map((sample) => sample.center.x))
        : 0;
      const movingOutward = recent.length >= 5
        && (horizontalRange > 0.08
          || Math.abs(recent[recent.length - 1].palmScale - recent[0].palmScale) > 0.14);
      const movingUpward = recent.length >= 5
        && recent[0].center.y - recent[recent.length - 1].center.y > 0.06;
      const waving = hasMotion('wave');
      const handY = features.center.y;

      switch (signId) {
        case '1':
          return openPalm && handY <= 0.52 && motionReady(waving) ? 1 : 0;
        case '2':
          return openPalm && handY >= 0.2 && handY <= 0.68 && motionReady(movingOutward) ? 1 : 0;
        case '3':
          return openPalm && handY < 0.68 && motionReady(movingUpward) ? 1 : 0;
        case '4':
          return openPalm && handY >= 0.38 && motionReady(waving) ? 1 : 0;
        case '5':
          return handCount > 1 && (openPalm || (twoFingers && features.spread > 0.12)) ? 1 : 0;
        case '6':
          return openPalm && features.thumbScores.side > 0.45 && handY >= 0.38 && handY <= 0.66 ? 1 : 0;
        case '7':
          return openPalm && features.thumbScores.side > 0.45 && handY >= 0.1 && handY <= 0.39 ? 1 : 0;
        case '8':
          return indexOnly ? 1 : 0;
        case '9':
          return twoFingers && features.spread > 0.12 ? 1 : 0;
        default:
          return 0;
      }
    }

    function hasMotion(kind) {
      const recent = history.filter((sample) => performance.now() - sample.time < 1400);
      if (recent.length < 5) return false;
      if (kind === 'wave') {
        const values = recent.map((sample) => sample.center.x);
        let directionChanges = 0;
        let previousDirection = 0;
        for (let index = 1; index < values.length; index += 1) {
          const delta = values[index] - values[index - 1];
          const direction = Math.abs(delta) > 0.008 ? Math.sign(delta) : 0;
          if (direction && previousDirection && direction !== previousDirection) directionChanges += 1;
          if (direction) previousDirection = direction;
        }
        return Math.max(...values) - Math.min(...values) > 0.09 && directionChanges >= 2;
      }
      const xValues = recent.map((sample) => sample.indexTip.x);
      const yValues = recent.map((sample) => sample.indexTip.y);
      const xRange = Math.max(...xValues) - Math.min(...xValues);
      const yRange = Math.max(...yValues) - Math.min(...yValues);
      if (kind === 'J') {
        const pinkyYs = recent.map((sample) => sample.pinkyTip.y);
        const pinkyXs = recent.map((sample) => sample.pinkyTip.x);
        return Math.max(...pinkyYs) - Math.min(...pinkyYs) > 0.12
          && Math.max(...pinkyXs) - Math.min(...pinkyXs) > 0.035;
      }
      let directionChanges = 0;
      let previousDirection = 0;
      for (let index = 1; index < xValues.length; index += 1) {
        const delta = xValues[index] - xValues[index - 1];
        const direction = Math.abs(delta) > 0.008 ? Math.sign(delta) : 0;
        if (direction && previousDirection && direction !== previousDirection) directionChanges += 1;
        if (direction) previousDirection = direction;
      }
      return xRange > 0.12 && yRange > 0.035 && directionChanges >= 1;
    }

    function evaluateTarget(hand, handCount) {
      const features = handFeatures(hand);
      if (!isInGuide(features)) {
        return { detected: false, matched: false, confidence: 0, message: 'Itapat ang iyong kamay sa loob ng gabay.' };
      }
      const letterMatch = activeTarget.match(/^letter:([A-Z]):/);
      if (letterMatch) {
        const confidence = scoreLetter(letterMatch[1], features);
        return confidence
          ? { detected: true, matched: true, confidence, message: 'Panatilihin ang hugis ng kamay.' }
          : {
              detected: true,
              matched: false,
              confidence: 0,
              message: 'Itama ang hugis ng kamay para sa letrang ' + letterMatch[1] + '...',
            };
      }
      const confidence = scoreSign(activeTarget, features, handCount);
      const signNames = {
        '1': 'Kumusta',
        '2': 'Salamat',
        '3': 'Magandang Umaga',
        '4': 'Paalam',
        '5': 'Ingat',
        '6': 'Nanay',
        '7': 'Tatay',
        '8': 'Isa',
        '9': 'Dalawa',
      };
      return confidence
        ? { detected: true, matched: true, confidence, message: 'Panatilihin ang hugis at galaw ng senyas.' }
        : {
            detected: true,
            matched: false,
            confidence: 0,
            message: 'Itama ang hugis ng kamay para sa senyas na ' + (signNames[activeTarget] || activeTarget) + '...',
          };
    }

    function frameLoop() {
      if (stopped || !landmarker || video.readyState < 2) {
        frameRequest = requestAnimationFrame(frameLoop);
        return;
      }
      const now = performance.now();
      let result;
      try {
        result = landmarker.detectForVideo(video, now);
      } catch (error) {
        const rawMessage = String(error && error.message ? error.message : error);
        post({
          type: 'error',
          message: /fetch/i.test(rawMessage)
            ? 'Hindi gumana ang lokal na pagkilala sa kamay. Subukang isara at buksan muli ang pagsasanay.'
            : rawMessage,
        });
        stopped = true;
        return;
      }
      const hands = result && result.landmarks ? result.landmarks : [];
      if (!hands.length) {
        history = [];
        motionSeenAt = null;
        resetHold();
        sendProgress(0, 0, false, 'Walang nakitang kamay — itapat ang iyong kamay sa loob ng gabay');
        frameRequest = requestAnimationFrame(frameLoop);
        return;
      }

      const hand = hands[0];
      const features = handFeatures(hand);
      const sample = {
        time: now,
        center: features.center,
        palmScale: features.palmScale,
        indexTip: hand[8],
        pinkyTip: hand[20],
      };
      history.push(sample);
      history = history.filter((item) => now - item.time < 1600);
      const evaluation = evaluateTarget(hand, hands.length);
      if (!evaluation.detected) {
        motionSeenAt = null;
        resetHold();
        sendProgress(0, 0, false, evaluation.message);
        frameRequest = requestAnimationFrame(frameLoop);
        return;
      }
      if (!evaluation.matched) {
        resetHold();
        sendProgress(0, 0, true, evaluation.message);
        frameRequest = requestAnimationFrame(frameLoop);
        return;
      }

      if (holdStartedAt === null) holdStartedAt = now;
      const holdProgress = Math.min((now - holdStartedAt) / HOLD_DURATION, 1);
      sendProgress(evaluation.confidence, holdProgress, true, evaluation.message);
      if (holdProgress >= 1 && verifiedTarget !== activeTarget) {
        verifiedTarget = activeTarget;
        post({ type: 'verified', signId: activeTarget });
      }
      frameRequest = requestAnimationFrame(frameLoop);
    }

    async function start() {
      try {
        if (!window.isSecureContext && location.protocol !== 'file:') {
          throw new Error('Hindi ligtas ang lokal na konteksto para sa kamera.');
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Hindi magamit ang kamera sa web view na ito.');
        }
        cameraStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        video.srcObject = cameraStream;
        await video.play();

        const vision = window.Vision;
        if (!vision || !vision.FilesetResolver || !vision.HandLandmarker) {
          throw new Error('Hindi makita ang nakabundle na MediaPipe runtime.');
        }
        const fileset = await vision.FilesetResolver.forVisionTasks(MODEL_DIRECTORY, false);
        landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: MODEL_DIRECTORY + 'hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.5,
        });
        post({ type: 'status', status: 'ready' });
        frameRequest = requestAnimationFrame(frameLoop);
      } catch (error) {
        const rawMessage = String(error && error.message ? error.message : error);
        const message = /fetch/i.test(rawMessage)
          ? 'Hindi ma-load ang nakabundle na pagkilala sa kamay. Subukang isara at buksan muli ang pagsasanay.'
          : rawMessage;
        post({ type: 'error', message });
      }
    }

    window.setTargetSign = function (nextTarget) {
      if (nextTarget === activeTarget) return;
      activeTarget = nextTarget;
      history = [];
      motionSeenAt = null;
      resetHold();
      sendProgress(0, 0, false, 'Walang nakitang kamay — itapat ang iyong kamay sa loob ng gabay');
    };

    window.addEventListener('pagehide', function () {
      stopped = true;
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      if (landmarker) landmarker.close();
      if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    });

    const visionScript = document.createElement('script');
    visionScript.src = MODEL_DIRECTORY + 'vision_bundle.js';
    visionScript.onload = start;
    visionScript.onerror = function () {
      post({ type: 'error', message: 'Hindi mabasa ang lokal na MediaPipe runtime.' });
    };
    document.head.appendChild(visionScript);
  </script>
</body>
</html>`;
}

async function prepareModelFiles() {
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error('Walang lokal na cache directory para sa pagkilala sa kamay.');
  }

  const modelDirectory = `${cacheDirectory}${MODEL_CACHE_VERSION}/`;
  const directoryInfo = await FileSystem.getInfoAsync(modelDirectory);
  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(modelDirectory, { intermediates: true });
  }

  const assets = await Asset.loadAsync(MODEL_ASSETS);
  if (assets.length !== MODEL_FILENAMES.length) {
    throw new Error('Hindi kumpleto ang mga lokal na file ng pagkilala sa kamay.');
  }

  await Promise.all(assets.map(async (asset, index) => {
    if (!asset.localUri) {
      throw new Error(`Hindi maihanda ang lokal na file na ${MODEL_FILENAMES[index]}.`);
    }
    const destination = `${modelDirectory}${MODEL_FILENAMES[index]}`;
    const destinationInfo = await FileSystem.getInfoAsync(destination);
    if (!destinationInfo.exists) {
      await FileSystem.copyAsync({ from: asset.localUri, to: destination });
    }
  }));

  return modelDirectory;
}

export default function SignGestureDetector({
  targetSignId,
  onProgress,
  onVerified,
  onStatusChange,
}: Props) {
  const [source, setSource] = useState<WebViewSource | null>(null);
  const webViewRef = useRef<WebView<object>>(null);
  const isMountedRef = useRef(true);
  const isReadyRef = useRef(false);
  const targetRef = useRef(targetSignId);
  const callbacksRef = useRef({ onProgress, onVerified, onStatusChange });

  useEffect(() => {
    callbacksRef.current = { onProgress, onVerified, onStatusChange };
  }, [onProgress, onStatusChange, onVerified]);

  useEffect(() => {
    isMountedRef.current = true;
    callbacksRef.current.onStatusChange?.('loading', 'Inihahanda ang lokal na pagkilala sa kamay...');
    void prepareModelFiles()
      .then(async (modelDirectory) => {
        if (!isMountedRef.current) return;
        const htmlUri = `${modelDirectory}detector.html`;
        await FileSystem.writeAsStringAsync(
          htmlUri,
          buildDetectorHtml(targetRef.current, modelDirectory),
        );
        if (!isMountedRef.current) return;
        setSource({
          uri: htmlUri,
          baseUrl: modelDirectory,
        });
      })
      .catch((error: unknown) => {
        if (!isMountedRef.current) return;
        const message = error instanceof Error ? error.message : 'Hindi naihanda ang lokal na pagkilala sa kamay.';
        callbacksRef.current.onStatusChange?.('error', message);
      });

    return () => {
      isMountedRef.current = false;
      isReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    targetRef.current = targetSignId;
    if (!isReadyRef.current) return;
    const target = JSON.stringify(targetSignId);
    webViewRef.current?.injectJavaScript(`window.setTargetSign(${target}); true;`);
  }, [targetSignId]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: {
      type?: string;
      status?: DetectorStatus;
      signId?: string;
      confidence?: number;
      holdProgress?: number;
      detected?: boolean;
      message?: string;
    };
    try {
      message = JSON.parse(event.nativeEvent.data) as typeof message;
    } catch (error) {
      callbacksRef.current.onStatusChange?.('error', `Hindi mabasa ang tugon ng lokal na pagkilala: ${String(error)}`);
      return;
    }

    if (message.type === 'status' && message.status === 'ready') {
      isReadyRef.current = true;
      callbacksRef.current.onStatusChange?.('ready');
      const target = JSON.stringify(targetRef.current);
      webViewRef.current?.injectJavaScript(`window.setTargetSign(${target}); true;`);
      return;
    }
    if (message.type === 'error') {
      callbacksRef.current.onStatusChange?.('error', message.message ?? 'Hindi gumana ang lokal na pagkilala sa kamay.');
      return;
    }
    if (message.type === 'progress' && message.signId) {
      callbacksRef.current.onProgress({
        signId: message.signId,
        confidence: message.confidence ?? 0,
        holdProgress: message.holdProgress ?? 0,
        detected: message.detected ?? false,
        message: message.message ?? '',
      });
      return;
    }
    if (message.type === 'verified' && message.signId) {
      callbacksRef.current.onVerified(message.signId);
    }
  };

  const handleWebViewError = (event: { nativeEvent: { description?: string } }) => {
    const description = event.nativeEvent.description;
    callbacksRef.current.onStatusChange?.('error', description
      ? `Hindi mabuksan ang lokal na pagkilala sa kamay: ${/fetch/i.test(description) ? 'hindi ma-access ang nakabundle na modelo' : description}`
      : 'Hindi mabuksan ang lokal na pagkilala sa kamay.');
  };

  return (
    <View pointerEvents="none" style={styles.hidden}>
      {source ? (
        <WebView<object>
          ref={webViewRef}
          source={source}
          originWhitelist={['file://*']}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs={false}
          allowingReadAccessToURL={source.baseUrl}
          {...(Platform.OS === 'ios' ? { mediaCapturePermissionGrantType: 'grant' as const } : {})}
          onMessage={handleMessage}
          onError={handleWebViewError}
          onHttpError={handleWebViewError}
          mixedContentMode="never"
          style={styles.webView}
          {...(Platform.OS === 'android' ? { androidLayerType: 'software' as const } : {})}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
  webView: { width: 1, height: 1, backgroundColor: 'transparent' },
});
