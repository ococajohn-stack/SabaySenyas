import Svg, { Circle, G, Path } from "react-native-svg";
import type { FingerShape, FingerspellingLetter } from "../data/fingerspelling";
import { colors } from "../theme";

const FINGER_X = [39, 51, 63, 75];

function fingerPath(shape: FingerShape, x: number, index: number) {
  if (shape === "extended") {
    const spread = index === 0 ? -3 : index === 3 ? 3 : 0;
    return `M ${x} 79 C ${x + spread} 65, ${x + spread} 45, ${x + spread} 28 C ${x + spread} 18, ${x + spread + 2} 13, ${x + spread + 5} 15`;
  }
  if (shape === "curved") {
    return `M ${x} 79 C ${x - 3} 68, ${x - 3} 56, ${x + 1} 49 C ${x + 5} 42, ${x + 14} 43, ${x + 16} 50 C ${x + 18} 57, ${x + 12} 62, ${x + 8} 64`;
  }
  if (shape === "hooked") {
    return `M ${x} 79 C ${x - 2} 65, ${x - 3} 52, ${x + 1} 44 C ${x + 5} 37, ${x + 13} 40, ${x + 13} 47 C ${x + 13} 52, ${x + 8} 53, ${x + 5} 49`;
  }
  if (shape === "crossed") {
    const offset = index === 0 ? 9 : -9;
    return `M ${x} 79 C ${x + offset * 0.3} 63, ${x + offset} 44, ${x + offset} 27 C ${x + offset} 18, ${x + offset + 2} 13, ${x + offset + 5} 15`;
  }
  return `M ${x} 79 C ${x - 2} 68, ${x - 1} 60, ${x + 4} 57 C ${x + 9} 54, ${x + 14} 59, ${x + 12} 65`;
}

function thumbPath(shape: FingerspellingLetter["thumb"]) {
  if (shape === "side")
    return "M 38 86 C 29 82, 22 75, 17 67 C 14 62, 10 64, 12 70 C 15 81, 24 91, 39 96";
  if (shape === "circle")
    return "M 38 85 C 34 73, 37 63, 45 60 C 51 58, 55 64, 51 69 C 47 74, 44 78, 46 83";
  if (shape === "tucked")
    return "M 38 85 C 44 79, 51 76, 57 77 C 62 78, 61 84, 55 87 C 50 90, 47 94, 46 99";
  if (shape === "between")
    return "M 38 85 C 44 75, 48 67, 52 60 C 55 55, 59 59, 57 65 C 54 74, 51 82, 49 91";
  if (shape === "across")
    return "M 38 85 C 46 78, 55 71, 65 67 C 72 64, 75 69, 69 75 C 62 81, 54 87, 47 94";
  if (shape === "under-three")
    return "M 38 85 C 44 78, 51 74, 59 72 C 65 71, 66 77, 60 81 C 53 86, 47 92, 45 99";
  if (shape === "under-two")
    return "M 38 85 C 43 79, 48 76, 53 76 C 58 76, 58 82, 53 86 C 49 90, 46 95, 45 99";
  return "M 38 85 C 34 78, 35 71, 41 67 C 46 64, 51 67, 49 72 C 47 77, 46 82, 48 89";
}

export default function FingerspellingHand({
  item,
  size = 136,
}: {
  item: FingerspellingLetter;
  size?: number;
}) {
  const rotation =
    item.orientation === "down" ? 180 : item.orientation === "side" ? 90 : 0;
  const fingerPositions =
    item.letter === "U"
      ? [43, 48, 64, 75]
      : item.letter === "V" || item.letter === "K"
        ? [34, 57, 66, 77]
        : item.letter === "C"
          ? [32, 47, 66, 82]
          : item.letter === "O"
            ? [42, 50, 60, 68]
            : FINGER_X;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 132"
      accessibilityLabel={`Guhit ng kamay para sa letrang ${item.letter}`}
    >
      <G rotation={rotation} origin="60, 68">
        <Path
          d="M 39 122 L 39 93 C 34 88 31 82 32 75 C 33 69 37 66 42 69 L 46 76 C 44 69 45 64 50 63 C 55 62 58 67 58 74 C 57 65 60 60 65 60 C 70 60 73 65 72 73 C 74 66 78 64 82 66 C 87 69 85 77 84 83 C 92 79 97 85 94 91 C 90 101 82 107 75 111 L 75 122 Z"
          fill="#F3BEAA"
          stroke="#27343A"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {item.fingers.map((shape, index) => (
          <G key={`${item.letter}-${index}`}>
            <Path
              d={fingerPath(shape, fingerPositions[index], index)}
              fill="none"
              stroke="#27343A"
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={fingerPath(shape, fingerPositions[index], index)}
              fill="none"
              stroke="#F3BEAA"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        ))}
        <Path
          d={thumbPath(item.thumb)}
          fill="none"
          stroke="#27343A"
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={thumbPath(item.thumb)}
          fill="none"
          stroke="#F3BEAA"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={43} cy={95} r={2} fill="#C98170" />
        {item.motion ? (
          <>
            <Path
              d={
                item.motion === "J"
                  ? "M 101 34 C 110 48, 108 62, 98 67"
                  : "M 95 30 L 104 30 L 94 42 L 104 42"
              }
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M 96 63 L 101 69 L 105 61"
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </G>
    </Svg>
  );
}
