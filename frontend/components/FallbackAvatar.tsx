export default function FallbackAvatar() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none">

      {/* HEAD */}
      <div
        className="
          bg-gray-300 rounded-full
          w-[35%] aspect-square
          max-w-[150px] max-h-[150px]   /* limit size for large screens */
        "
      />

      {/* BODY — Smooth rounded bottom */}
      <div
        className="
          bg-gray-300 mt-[3%]
          w-[55%] h-[33%]
          rounded-t-full rounded-b-[28%]
          max-w-[240px] max-h-[160px]   /* body size also capped */
        "
      />
    </div>
  );
}
