import { useFormContext } from 'react-hook-form';
import { useStore } from '@/lib/store';
import type { RecipeFormData } from '../types/recipe-form';

export const GeneralInfo = () => {
  const { register, formState: { errors } } = useFormContext<RecipeFormData>();
  const { user } = useStore();

  return (
    <div className="space-y-3">
      <input
        {...register('title', { required: 'Title is required' })}
        className="w-full border-none bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
        placeholder="Nhập tên món"
      />
      {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}

      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
          {user?.firstName?.[0] || 'U'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {user?.firstName || 'User'} {user?.lastName || ''}
          </p>
          <p className="text-xs text-gray-500">@{user?.username || 'username'}</p>
        </div>
      </div>

      <textarea
        {...register('description')}
        rows={3}
        className="w-full rounded-xl border-none bg-gray-100 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none shadow-sm"
        placeholder="Share a quick story about this dish..."
        style={{
          minHeight: '80px',
          overflow: 'hidden',
        }}
        onInput={(e) => {
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 150) + 'px';
        }}
      />
      {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}

      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
        <input
          type="checkbox"
          {...register('is_private')}
          id="is_private"
          className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 focus:ring-2 cursor-pointer"
        />
        <label htmlFor="is_private" className="cursor-pointer flex-1">
          <span className="font-medium text-gray-900">Công thức riêng tư</span>
          <p className="text-sm text-gray-600">Chỉ bạn có thể xem công thức này</p>
        </label>
      </div>
    </div>
  );
};
