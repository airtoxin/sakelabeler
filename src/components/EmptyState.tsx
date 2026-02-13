export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-6xl mb-4">🍶</div>
      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
        まだ記録がありません
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
        右下の＋ボタンからお酒を記録しましょう
      </p>
    </div>
  );
}
