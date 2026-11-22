import { useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

export type DetectorStatus = 'loading' | 'ready' | 'error';

export type DetectorProgress = {
  signId: string;
  confidence: number;
  holdProgress: number;
  detected: boolean;
  faceVisible: boolean;
};

type Props = {
  targetSignId: string;
  onProgress: (progress: DetectorProgress) => void;
  onVerified: (signId: string) => void;
  onStatusChange: (status: DetectorStatus, message?: string) => void;
};

const MEDIAPIPE_VERSION = '1.2.3';
const MEDIAPIPE_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

type EmbeddedWebViewProps = {
  ref?: Ref<WebView>;
  source: { html: string; baseUrl: string };
  originWhitelist: string[];
  onMessage: (event: WebViewMessageEvent) => void;
  onError: () => void;
  onHttpError: () => void;
  javaScriptEnabled: boolean;
  mediaPlaybackRequiresUserAction: boolean;
  mediaCapturePermissionGrantType: 'grant';
  allowsInlineMediaPlayback: boolean;
  scrollEnabled: boolean;
  bounces: boolean;
  style: StyleProp<ViewStyle>;
  containerStyle: StyleProp<ViewStyle>;
};

const EmbeddedWebView = WebView as unknown as ComponentType<EmbeddedWebViewProps>;

function detectorHtml(targetSignId: string) {
  return `<!DOCTYPE html>
<html lang="tl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https: blob:; worker-src 'self' blob:; connect-src 'self' https: blob: data:; img-src 'self' data: blob: https:; media-src 'self' blob:; style-src 'self' 'unsafe-inline' https:;" />
  <style>
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #172b2a; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    #stage { position: absolute; inset: 0; overflow: hidden; }
    #camera, #skeleton { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
    #skeleton { pointer-events: none; }
    #message { position: absolute; left: 16px; right: 16px; top: 45%; color: white; text-align: center; font-size: 13px; line-height: 19px; text-shadow: 0 1px 5px #000; }
  </style>
</head>
<body>
  <div id="stage">
    <video id="camera" autoplay playsinline muted></video>
    <canvas id="skeleton"></canvas>
    <div id="message">Inihahanda ang kamera at pagkilala sa senyas…</div>
  </div>
  <script type="module">
    import { FilesetResolver, HandLandmarker, FaceLandmarker } from '${MEDIAPIPE_ROOT}/vision_bundle.mjs';

    const video = document.getElementById('camera');
    const canvas = document.getElementById('skeleton');
    const context = canvas.getContext('2d');
    const message = document.getElementById('message');
    let targetSignId = ${JSON.stringify(targetSignId)};
    let handLandmarker = null;
    let faceLandmarker = null;
    let stream = null;
    let lastVideoTime = -1;
    let lastInferenceTime = 0;
    let lastMessageTime = 0;
    let holdStarted = 0;
    let heldSignId = null;
    let verified = false;
    let history = [];
    let motionSeenUntil = 0;
    let inferenceErrorReported = false;
    let animationFrame = 0;

    const HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
    const SIGN_NAMES = {
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

    function post(data) {
      window.ReactNativeWebView?.postMessage(JSON.stringify(data));
    }

    function clamp(value, min = 0, max = 1) {
      return Math.max(min, Math.min(max, value));
    }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
    }

    function angle(a, b, c) {
      const first = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
      const second = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
      const denominator = Math.hypot(first.x, first.y, first.z) * Math.hypot(second.x, second.y, second.z);
      if (!denominator) return 0;
      const dot = first.x * second.x + first.y * second.y + first.z * second.z;
      return Math.acos(clamp(dot / denominator, -1, 1)) * 180 / Math.PI;
    }

    function midpoint(a, b) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 };
    }

    function handFeatures(hand) {
      const chains = [[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
      const scale = Math.max(distance(hand[0], hand[9]), 0.001);
      const straightness = chains.map(([mcp, pip, dip, tip]) => {
        const pipAngle = angle(hand[mcp], hand[pip], hand[dip]);
        const dipAngle = angle(hand[pip], hand[dip], hand[tip]);
        const reach = distance(hand[tip], hand[0]) / Math.max(distance(hand[pip], hand[0]), 0.001);
        return clamp((pipAngle - 108) / 62) * 0.55 + clamp((dipAngle - 108) / 62) * 0.25 + clamp((reach - 0.96) / 0.48) * 0.2;
      });
      const thumbAngle = angle(hand[2], hand[3], hand[4]);
      const thumbReach = distance(hand[4], hand[0]) / Math.max(distance(hand[2], hand[0]), 0.001);
      const thumb = clamp((thumbAngle - 98) / 72) * 0.7 + clamp((thumbReach - 0.9) / 0.58) * 0.3;
      const palm = {
        x: (hand[0].x + hand[5].x + hand[9].x + hand[13].x + hand[17].x) / 5,
        y: (hand[0].y + hand[5].y + hand[9].y + hand[13].y + hand[17].y) / 5,
        z: (hand[0].z + hand[5].z + hand[9].z + hand[13].z + hand[17].z) / 5,
      };
      return {
        scale,
        palm,
        straightness,
        thumb,
        indexMiddleSpread: distance(hand[8], hand[12]) / scale,
        thumbTip: hand[4],
      };
    }

    function faceFeatures(landmarks) {
      if (!landmarks?.length) return null;
      const points = landmarks[0];
      const forehead = points[10];
      const chin = points[152];
      const leftTemple = points[234];
      const rightTemple = points[454];
      const mouth = midpoint(points[13], points[14]);
      const width = Math.max(distance(leftTemple, rightTemple), 0.001);
      const height = Math.max(distance(forehead, chin), 0.001);
      return { forehead, chin, leftTemple, rightTemple, mouth, width, height };
    }

    function extendedScore(features, indices) {
      return indices.reduce((sum, index) => sum + features.straightness[index], 0) / indices.length;
    }

    function openHandScore(features) {
      return extendedScore(features, [0, 1, 2, 3]) * 0.82 + features.thumb * 0.18;
    }

    function flatHandScore(features) {
      return Math.min(...features.straightness) * 0.78 + features.thumb * 0.22;
    }

    function oneFingerScore(features) {
      const [index, middle, ring, pinky] = features.straightness;
      return index * (1 - middle) * (1 - ring) * (1 - pinky);
    }

    function twoFingerScore(features) {
      const [index, middle, ring, pinky] = features.straightness;
      const fingers = index * middle * (1 - ring) * (1 - pinky);
      const vShape = clamp((features.indexMiddleSpread - 0.08) / 0.2);
      return fingers * (0.65 + vShape * 0.35);
    }

    function handSpan(hand) {
      return Math.max(distance(hand[0], hand[9]), 0.001);
    }

    function recentMotion(test) {
      const now = performance.now();
      const recent = history.filter((point) => now - point.time < 1700);
      if (recent.length < 3) return false;
      return test(recent, recent[0], recent[recent.length - 1]);
    }

    function hasWave() {
      return recentMotion((points, first, last) => {
        const xs = points.map((point) => point.palm.x);
        const range = Math.max(...xs) - Math.min(...xs);
        let reversals = 0;
        let previousDirection = 0;
        for (let index = 1; index < xs.length; index += 1) {
          const delta = xs[index] - xs[index - 1];
          if (Math.abs(delta) < 0.012) continue;
          const direction = Math.sign(delta);
          if (previousDirection && direction !== previousDirection) reversals += 1;
          previousDirection = direction;
        }
        return range > 0.13 && reversals >= 1 && Math.abs(last.palm.y - first.palm.y) < 0.22;
      });
    }

    function near(point, target, threshold) {
      return distance(point, target) < threshold;
    }

    function scoreSign(signId, handLandmarks, face) {
      const signName = SIGN_NAMES[signId];
      if (!signName) return { confidence: 0, matches: false, faceVisible: false };
      if (!handLandmarks.length) {
        const faceNeeded = ['Kumusta', 'Salamat', 'Magandang Umaga', 'Paalam', 'Ingat', 'Nanay', 'Tatay'].includes(signName);
        return { confidence: 0, matches: false, faceVisible: !faceNeeded || Boolean(face) };
      }
      const hands = handLandmarks;
      const hand = hands[0];
      const features = handFeatures(hand);
      const needsFace = ['Kumusta', 'Salamat', 'Magandang Umaga', 'Paalam', 'Ingat', 'Nanay', 'Tatay'].includes(signName);
      if (needsFace && !face) return { confidence: 0, matches: false, faceVisible: false };

      const faceScale = face?.width || features.scale * 3;
      const atChest = face
        ? features.palm.y > face.chin.y + face.height * 0.05
          && features.palm.y < face.chin.y + face.height * 1.1
        : features.palm.y > 0.48 && features.palm.y < 0.82;
      let confidence = 0;
      let matches = false;

      if (signName === 'Kumusta') {
        const priorNearTemple = history.some((point) => face && (
          near(point.palm, face.leftTemple, face.width * 0.44)
          || near(point.palm, face.rightTemple, face.width * 0.44)
        ));
        const outward = recentMotion((points, first, last) => {
          const startDistance = Math.min(distance(first.palm, face.leftTemple), distance(first.palm, face.rightTemple));
          const endDistance = Math.min(distance(last.palm, face.leftTemple), distance(last.palm, face.rightTemple));
          return startDistance < face.width * 0.48
            && endDistance > startDistance + face.width * 0.1
            && last.palm.y < face.chin.y;
        });
        if (priorNearTemple && outward) motionSeenUntil = performance.now() + 1500;
        const pose = openHandScore(features);
        confidence = pose * 0.68 + (performance.now() < motionSeenUntil ? 0.32 : 0);
        matches = pose > 0.48 && performance.now() < motionSeenUntil;
      } else if (signName === 'Salamat') {
        const startedAtMouth = history.some((point) => face && near(point.palm, face.mouth, face.width * 0.48));
        const movedForwardOrDown = recentMotion((points, first, last) => {
          const approachedCamera = last.scale > first.scale * 1.12 || last.palm.z < first.palm.z - 0.035;
          const movedDown = last.palm.y > first.palm.y + 0.055;
          return startedAtMouth && (approachedCamera || movedDown);
        });
        if (movedForwardOrDown) motionSeenUntil = performance.now() + 1500;
        const pose = flatHandScore(features);
        confidence = pose * 0.67 + (performance.now() < motionSeenUntil ? 0.33 : 0);
        matches = pose > 0.58 && performance.now() < motionSeenUntil;
      } else if (signName === 'Magandang Umaga') {
        const startedAtChin = history.some((point) => face && near(point.palm, face.chin, face.width * 0.48));
        const outwardLift = recentMotion((points, first, last) => {
          const outward = Math.abs(last.palm.x - first.palm.x) > face.width * 0.14
            || last.scale > first.scale * 1.1
            || last.palm.z < first.palm.z - 0.035;
          const lifted = last.palm.y < first.palm.y + 0.08;
          return startedAtChin && outward && lifted;
        });
        if (outwardLift) motionSeenUntil = performance.now() + 1500;
        const pose = flatHandScore(features);
        confidence = pose * 0.65 + (performance.now() < motionSeenUntil ? 0.35 : 0);
        matches = pose > 0.55 && performance.now() < motionSeenUntil;
      } else if (signName === 'Paalam') {
        const raised = features.palm.y < face.chin.y + face.height * 0.15;
        const wave = hasWave();
        if (wave) motionSeenUntil = performance.now() + 1500;
        const pose = openHandScore(features);
        confidence = pose * 0.55 + (raised ? 0.15 : 0) + (performance.now() < motionSeenUntil ? 0.3 : 0);
        matches = pose > 0.48 && raised && performance.now() < motionSeenUntil;
      } else if (signName === 'Ingat') {
        const bothHands = handLandmarks.length >= 2;
        const otherPalm = bothHands ? handFeatures(handLandmarks[1]).palm : null;
        const stackedHands = Boolean(otherPalm && atChest
          && distance(features.palm, otherPalm) < faceScale * 0.72
          && Math.abs(features.palm.y - otherPalm.y) > features.scale * 0.04);
        const kOrV = features.straightness[0] > 0.55
          && features.straightness[1] > 0.5
          && features.straightness[2] < 0.55
          && features.straightness[3] < 0.55;
        const tap = recentMotion((points) => {
          const ys = points.map((point) => point.palm.y);
          return Math.max(...ys) - Math.min(...ys) > features.scale * 0.13;
        });
        if (stackedHands || (kOrV && atChest && tap)) motionSeenUntil = performance.now() + 1300;
        const shape = stackedHands ? 0.85 : kOrV ? 0.72 : openHandScore(features);
        confidence = shape * 0.55 + (atChest ? 0.15 : 0) + (performance.now() < motionSeenUntil ? 0.3 : 0);
        matches = atChest && (stackedHands || (kOrV && performance.now() < motionSeenUntil));
      } else if (signName === 'Nanay' || signName === 'Tatay') {
        const target = signName === 'Nanay' ? face.chin : face.forehead;
        const thumbAtTarget = near(features.thumbTip, target, face.width * 0.28);
        if (thumbAtTarget) motionSeenUntil = performance.now() + 1400;
        const fingersOpen = extendedScore(features, [0, 1, 2, 3]);
        confidence = fingersOpen * 0.64 + (thumbAtTarget ? 0.36 : performance.now() < motionSeenUntil ? 0.28 : 0);
        matches = fingersOpen > 0.48 && performance.now() < motionSeenUntil;
      } else if (signName === 'Isa') {
        confidence = oneFingerScore(features);
        matches = features.straightness[0] > 0.65
          && features.straightness.slice(1).every((value) => value < 0.52);
      } else if (signName === 'Dalawa') {
        confidence = twoFingerScore(features);
        matches = features.straightness[0] > 0.6
          && features.straightness[1] > 0.6
          && features.straightness[2] < 0.55
          && features.straightness[3] < 0.55
          && features.indexMiddleSpread > 0.13;
      }

      return {
        confidence: clamp(confidence),
        matches: Boolean(matches && confidence >= 0.7),
        faceVisible: true,
      };
    }

    function drawHands(hands) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.clearRect(0, 0, width, height);
      context.lineWidth = Math.max(3, width * 0.006);
      context.lineCap = 'round';
      context.strokeStyle = '#5eead4';
      context.fillStyle = '#d1fae5';
      context.shadowColor = '#34d399';
      context.shadowBlur = 7;
      for (const landmarks of hands) {
        for (const [start, end] of HAND_CONNECTIONS) {
          context.beginPath();
          context.moveTo(landmarks[start].x * width, landmarks[start].y * height);
          context.lineTo(landmarks[end].x * width, landmarks[end].y * height);
          context.stroke();
        }
        for (const point of landmarks) {
          context.beginPath();
          context.arc(point.x * width, point.y * height, Math.max(2.5, width * 0.006), 0, Math.PI * 2);
          context.fill();
        }
      }
      context.shadowBlur = 0;
    }

    function sendProgress(confidence, holdProgress, detected, faceVisible) {
      const now = performance.now();
      if (now - lastMessageTime < 90 && holdProgress < 1) return;
      lastMessageTime = now;
      post({ type: 'progress', signId: targetSignId, confidence: Math.round(confidence * 100), holdProgress, detected, faceVisible });
    }

    function renderLoop() {
      if (video.readyState >= 2
        && video.currentTime !== lastVideoTime
        && performance.now() - lastInferenceTime >= 50
        && handLandmarker
        && faceLandmarker) {
        lastVideoTime = video.currentTime;
        lastInferenceTime = performance.now();
        try {
          const timestamp = performance.now();
          const handResult = handLandmarker.detectForVideo(video, timestamp);
          const faceResult = faceLandmarker.detectForVideo(video, timestamp);
          const hands = handResult.landmarks || [];
          const face = faceFeatures(faceResult.faceLandmarks);
          drawHands(hands);
          const primaryHand = hands[0];
          if (primaryHand) {
            const features = handFeatures(primaryHand);
            history.push({ palm: features.palm, scale: features.scale, time: timestamp });
            history = history.filter((point) => timestamp - point.time <= 1800);
          } else {
            history = [];
            motionSeenUntil = 0;
          }

          const result = scoreSign(targetSignId, hands, face);
          inferenceErrorReported = false;
          if (result.matches && !verified) {
            if (heldSignId !== targetSignId) {
              heldSignId = targetSignId;
              holdStarted = timestamp;
            }
            const holdProgress = clamp((timestamp - holdStarted) / 1200);
            sendProgress(result.confidence, holdProgress, true, result.faceVisible);
            if (holdProgress >= 1) {
              verified = true;
              post({ type: 'verified', signId: targetSignId });
            }
          } else {
            heldSignId = null;
            holdStarted = 0;
            sendProgress(result.confidence, 0, result.confidence >= 0.4, result.faceVisible);
          }
        } catch (error) {
          if (!inferenceErrorReported) {
            const reason = error instanceof Error ? error.message : 'Hindi mabasa ang galaw ng kamay.';
            post({ type: 'status', status: 'error', message: reason });
            inferenceErrorReported = true;
          }
        }
      }
      animationFrame = requestAnimationFrame(renderLoop);
    }

    window.setTargetSign = (signId) => {
      targetSignId = SIGN_NAMES[String(signId)] ? String(signId) : '1';
      heldSignId = null;
      holdStarted = 0;
      verified = false;
      history = [];
      motionSeenUntil = 0;
      sendProgress(0, 0, false, false);
    };

    function receiveTarget(event) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'target') window.setTargetSign(data.signId);
      } catch {
        post({ type: 'status', status: 'error', message: 'Hindi mabasa ang kasalukuyang target na senyas.' });
      }
    }

    window.addEventListener('message', receiveTarget);
    document.addEventListener('message', receiveTarget);

    async function createTask(Task, vision, modelAssetPath, options) {
      try {
        return await Task.createFromOptions(vision, {
          baseOptions: { modelAssetPath, delegate: 'GPU' },
          ...options,
        });
      } catch {
        return Task.createFromOptions(vision, {
          baseOptions: { modelAssetPath, delegate: 'CPU' },
          ...options,
        });
      }
    }

    async function start() {
      try {
        post({ type: 'status', status: 'loading', message: 'Inihahanda ang pagkilala sa senyas…' });
        const vision = await FilesetResolver.forVisionTasks('${MEDIAPIPE_ROOT}/wasm');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        video.srcObject = stream;
        await video.play();

        [handLandmarker, faceLandmarker] = await Promise.all([
          createTask(HandLandmarker, vision, '${HAND_MODEL}', {
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.55,
            minHandPresenceConfidence: 0.55,
            minTrackingConfidence: 0.5,
          }),
          createTask(FaceLandmarker, vision, '${FACE_MODEL}', {
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: false,
          }),
        ]);
        message.style.display = 'none';
        post({ type: 'status', status: 'ready' });
        animationFrame = requestAnimationFrame(renderLoop);
      } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
        handLandmarker?.close();
        faceLandmarker?.close();
        const reason = error?.name === 'NotAllowedError'
          ? 'Hindi pinayagan ang camera. Tiyaking naka-on ang pahintulot sa kamera.'
          : error?.message || 'Hindi masimulan ang camera o pagkilala. Suriin ang koneksiyon at subukang muli.';
        message.textContent = reason;
        post({ type: 'status', status: 'error', message: reason });
      }
    }

    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      handLandmarker?.close();
      faceLandmarker?.close();
    });

    start();
  </script>
</body>
</html>`;
}

type DetectorMessage = {
  type?: string;
  status?: DetectorStatus;
  message?: string;
  signId?: string;
  confidence?: number;
  holdProgress?: number;
  detected?: boolean;
  faceVisible?: boolean;
};

export default function SignGestureDetector({
  targetSignId,
  onProgress,
  onVerified,
  onStatusChange,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const [source] = useState(() => ({
    html: detectorHtml(targetSignId),
    baseUrl: 'https://localhost/',
  }));

  useEffect(() => {
    if (readyRef.current) {
      webViewRef.current?.injectJavaScript(
        `window.setTargetSign(${JSON.stringify(targetSignId)}); true;`,
      );
    }
  }, [targetSignId]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: DetectorMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as DetectorMessage;
    } catch {
      onStatusChange('error', 'May hindi inaasahang tugon mula sa pagkilala sa senyas.');
      return;
    }

    if (message.type === 'status' && message.status) {
      if (message.status === 'ready') readyRef.current = true;
      onStatusChange(message.status, message.message);
    } else if (message.type === 'progress' && message.signId) {
      onProgress({
        signId: message.signId,
        confidence: message.confidence ?? 0,
        holdProgress: message.holdProgress ?? 0,
        detected: message.detected ?? false,
        faceVisible: message.faceVisible ?? false,
      });
    } else if (message.type === 'verified' && message.signId) {
      onVerified(message.signId);
    }
  };

  return (
    <View style={styles.container}>
      <EmbeddedWebView
        ref={webViewRef}
        source={source}
        originWhitelist={['https://localhost/*']}
        onMessage={handleMessage}
        onError={() => onStatusChange('error', 'Hindi ma-load ang camera preview. Subukang muli o laktawan ang senyas.')}
        onHttpError={() => onStatusChange('error', 'Hindi ma-download ang mga file para sa pagkilala. Suriin ang koneksiyon o laktawan ang senyas.')}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        allowsInlineMediaPlayback
        scrollEnabled={false}
        bounces={false}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  webViewContainer: { width: 1, height: 1, backgroundColor: 'transparent' },
  webView: { width: 1, height: 1, backgroundColor: 'transparent' },
});
