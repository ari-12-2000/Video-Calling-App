export default function FallbackAvatar() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none">

      {/* Head */}
      <div
        className="
        bg-gray-300 rounded-full
        w-[35%] aspect-square
        "
      />

      {/* Body — slightly rounded bottom */}
      <div
        className="
        bg-gray-300 mt-[3%]
        w-[55%] h-[33%]
        rounded-t-full 
        rounded-b-[25%]   /* ⬅ smoother bottom curve */
        "
      />
    </div>
  );
}
