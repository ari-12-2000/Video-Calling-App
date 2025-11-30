export default function FallbackAvatar() {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Head */}
      <div className="w-24 h-24 rounded-full bg-gray-300" />

      {/* Body (flat bottom) */}
      <div className="w-36 h-24 bg-gray-300 rounded-b-lg rounded-t-full mt-2" />
    </div>
  );
}
