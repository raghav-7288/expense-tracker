interface DividerProps {
  text?: string;
}

export default function Divider({ text = 'OR' }: DividerProps) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {text}
        </span>
      </div>
    </div>
  );
}

