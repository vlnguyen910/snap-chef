import { useRef } from "react";
import { Image, Trash2 } from "lucide-react";

export const ImageUpload = ({
  thumbnailPreview,
  onImageSelect,
}: {
  thumbnailPreview: string;
  onImageSelect: (file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="relative w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden transition-all duration-200 hover:border-gray-400 hover:bg-gray-100 cursor-pointer shadow-sm max-h-[300px]"
      style={{ aspectRatio: "16/9" }}
      onClick={() => !thumbnailPreview && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        id="main-thumbnail"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImageSelect(file);
          e.target.value = "";
        }}
      />

      {!thumbnailPreview ? (
        <label
          htmlFor="main-thumbnail"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center h-full w-full"
        >
          <div className="rounded-full bg-gray-200 p-2">
            <Image size={32} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              Tải ảnh đại diện
            </p>
            <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, max 5MB</p>
          </div>
        </label>
      ) : (
        <div className="relative h-full w-full group">
          <img
            src={thumbnailPreview}
            alt="Recipe"
            className="h-full w-full object-cover rounded-lg"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
                const changeEvent = new Event("change", { bubbles: true });
                fileInputRef.current.dispatchEvent(changeEvent);
              }
            }}
            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Xóa ảnh"
          >
            <Trash2 size={18} />
          </button>

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center rounded-lg">
            <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Nhấp để thay đổi ảnh
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
