export function TailwindIndicator() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="flex fixed bottom-1 left-1 z-50 justify-center items-center p-3 w-6 h-6 font-mono text-xs text-white bg-gray-800 rounded-full">
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  );
}
