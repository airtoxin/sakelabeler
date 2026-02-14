import type { AlcoholType } from "./types";

export type AlcoholTypeConfig = {
  key: AlcoholType;
  label: string;
  color: string;
  activeColor: string;
  tags: string[];
};

export const ALCOHOL_TYPES: AlcoholTypeConfig[] = [
  {
    key: "nihonshu",
    label: "日本酒",
    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    activeColor: "bg-rose-600 text-white border-rose-600",
    tags: [
      "甘口", "辛口", "芳醇", "淡麗",
      "純米", "純米吟醸", "特別純米", "純米大吟醸",
      "大吟醸", "吟醸", "特別本醸造", "本醸造",
      "熱燗", "冷酒", "にごり", "スパークリング", "生酒", "原酒",
    ],
  },
  {
    key: "beer",
    label: "ビール",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    activeColor: "bg-amber-600 text-white border-amber-600",
    tags: [
      "クラフトビール", "香り", "苦味", "キレ", "コク",
      "IPA", "ラガー", "エール", "スタウト",
      "ピルスナー", "ヴァイツェン", "フルーティー",
    ],
  },
  {
    key: "wine",
    label: "ワイン",
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    activeColor: "bg-purple-600 text-white border-purple-600",
    tags: [
      "赤", "白", "オレンジ", "ロゼ",
      "スパークリング", "酸味", "渋味", "果実味", "香り", "スイーツ",
      "辛口", "甘口", "フルボディ", "ライトボディ",
    ],
  },
  {
    key: "shochu",
    label: "焼酎",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
    tags: [
      "芋", "麦", "米", "黒糖", "泡盛",
      "ロック", "水割り", "お湯割り", "ソーダ割り", "ストレート",
    ],
  },
  {
    key: "whiskey",
    label: "ウイスキー",
    color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    activeColor: "bg-orange-600 text-white border-orange-600",
    tags: [
      "シングルモルト", "ブレンデッド", "バーボン",
      "スモーキー", "ピーティー", "フルーティー",
      "ハイボール", "ストレート", "ロック", "水割り",
    ],
  },
];

export function getAlcoholTypeConfig(key: AlcoholType): AlcoholTypeConfig | undefined {
  return ALCOHOL_TYPES.find((t) => t.key === key);
}
