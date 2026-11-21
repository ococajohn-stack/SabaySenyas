export type FingerShape =
  | "extended"
  | "curved"
  | "curled"
  | "hooked"
  | "crossed";
export type ThumbShape =
  | "side"
  | "folded"
  | "circle"
  | "across"
  | "tucked"
  | "between"
  | "under-three"
  | "under-two";
export type HandOrientation = "up" | "side" | "down";

export type FingerspellingLetter = {
  letter: string;
  cue: string;
  fingers: [FingerShape, FingerShape, FingerShape, FingerShape];
  thumb: ThumbShape;
  orientation?: HandOrientation;
  motion?: "J" | "Z";
};

export const FINGERSPELLING_LETTERS: FingerspellingLetter[] = [
  {
    letter: "A",
    cue: "Saradong kamao; nakapuwesto ang hinlalaki sa gilid ng mga daliri.",
    fingers: ["curled", "curled", "curled", "curled"],
    thumb: "side",
  },
  {
    letter: "B",
    cue: "Apat na daliri ang tuwid at magkakadikit; nakatiklop ang hinlalaki sa palad.",
    fingers: ["extended", "extended", "extended", "extended"],
    thumb: "folded",
  },
  {
    letter: "C",
    cue: "Kurba ang mga daliri at hinlalaki upang bumuo ng letrang C.",
    fingers: ["curved", "curved", "curved", "curved"],
    thumb: "circle",
  },
  {
    letter: "D",
    cue: "Nakaturo pataas ang hintuturo; nakadikit sa hinlalaki ang ibang mga daliri.",
    fingers: ["extended", "curled", "curled", "curled"],
    thumb: "circle",
  },
  {
    letter: "E",
    cue: "Lahat ng daliri ay nakatiklop pababa sa hinlalaki.",
    fingers: ["curled", "curled", "curled", "curled"],
    thumb: "tucked",
  },
  {
    letter: "F",
    cue: "Magkadikit ang hintuturo at hinlalaki na parang bilog; nakataas ang tatlong daliri.",
    fingers: ["curled", "extended", "extended", "extended"],
    thumb: "circle",
  },
  {
    letter: "G",
    cue: "Nakaturo nang pahalang ang hintuturo at hinlalaki.",
    fingers: ["extended", "curled", "curled", "curled"],
    thumb: "side",
    orientation: "side",
  },
  {
    letter: "H",
    cue: "Magkatabing nakaturo nang pahalang ang hintuturo at gitnang daliri.",
    fingers: ["extended", "extended", "curled", "curled"],
    thumb: "folded",
    orientation: "side",
  },
  {
    letter: "I",
    cue: "Nakataas ang kalingkingan; nakatiklop ang ibang mga daliri.",
    fingers: ["curled", "curled", "curled", "extended"],
    thumb: "folded",
  },
  {
    letter: "J",
    cue: "Nakataas ang kalingkingan at iginuguhit nito ang galaw ng letrang J.",
    fingers: ["curled", "curled", "curled", "extended"],
    thumb: "folded",
    motion: "J",
  },
  {
    letter: "K",
    cue: "Nakataas at nakabuka ang hintuturo at gitnang daliri; nasa pagitan nila ang hinlalaki.",
    fingers: ["extended", "extended", "curled", "curled"],
    thumb: "between",
  },
  {
    letter: "L",
    cue: "Bumuo ng L gamit ang nakataas na hintuturo at nakabukang hinlalaki.",
    fingers: ["extended", "curled", "curled", "curled"],
    thumb: "side",
  },
  {
    letter: "M",
    cue: "Tatlong daliri ang nakapatong sa hinlalaki na nakatiklop sa palad.",
    fingers: ["curled", "curled", "curled", "curled"],
    thumb: "under-three",
  },
  {
    letter: "N",
    cue: "Dalawang daliri ang nakapatong sa hinlalaki na nakatiklop sa palad.",
    fingers: ["curled", "curled", "curled", "curled"],
    thumb: "under-two",
  },
  {
    letter: "O",
    cue: "Magkadikit ang dulo ng lahat ng daliri at hinlalaki upang bumuo ng bilog.",
    fingers: ["curved", "curved", "curved", "curved"],
    thumb: "circle",
  },
  {
    letter: "P",
    cue: "Hugis K ang kamay na nakaturo pababa.",
    fingers: ["extended", "extended", "curled", "curled"],
    thumb: "between",
    orientation: "down",
  },
  {
    letter: "Q",
    cue: "Hugis G ang kamay na nakaturo pababa.",
    fingers: ["extended", "curled", "curled", "curled"],
    thumb: "side",
    orientation: "down",
  },
  {
    letter: "R",
    cue: "Magkakrus ang nakataas na hintuturo at gitnang daliri.",
    fingers: ["crossed", "crossed", "curled", "curled"],
    thumb: "folded",
  },
  {
    letter: "S",
    cue: "Saradong kamao na nakapatong sa harap ng mga daliri ang hinlalaki.",
    fingers: ["curled", "curled", "curled", "curled"],
    thumb: "across",
  },
  {
    letter: "T",
    cue: "Saradong kamao na nakasingit ang hinlalaki sa pagitan ng hintuturo at gitnang daliri.",
    fingers: ["curled", "curled", "curled", "curled"],
    thumb: "between",
  },
  {
    letter: "U",
    cue: "Magkadikit at nakataas ang hintuturo at gitnang daliri.",
    fingers: ["extended", "extended", "curled", "curled"],
    thumb: "folded",
  },
  {
    letter: "V",
    cue: "Nakabuka at nakataas ang hintuturo at gitnang daliri na parang V.",
    fingers: ["extended", "extended", "curled", "curled"],
    thumb: "folded",
  },
  {
    letter: "W",
    cue: "Nakataas ang hintuturo, gitnang daliri, at palasingsingan na parang W.",
    fingers: ["extended", "extended", "extended", "curled"],
    thumb: "folded",
  },
  {
    letter: "X",
    cue: "Nakatiklop na parang kawit ang hintuturo; nakatiklop ang iba pang daliri.",
    fingers: ["hooked", "curled", "curled", "curled"],
    thumb: "folded",
  },
  {
    letter: "Y",
    cue: "Nakabuka ang hinlalaki at kalingkingan; nakatiklop ang tatlong gitnang daliri.",
    fingers: ["curled", "curled", "curled", "extended"],
    thumb: "side",
  },
  {
    letter: "Z",
    cue: "Nakaturo ang hintuturo at iginuguhit nito ang letrang Z sa hangin.",
    fingers: ["extended", "curled", "curled", "curled"],
    thumb: "folded",
    motion: "Z",
  },
];
