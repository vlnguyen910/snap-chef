import { api } from '@/lib/axios';       // Client gọi API thật
import { supabase } from '@/lib/supabase'; // Client gọi Supabase

// Kiểm tra cờ trong .env: true = Supabase, false = Backend Team
const IS_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

export const recipeService = {
  // Hàm tạo công thức mới
  createRecipe: async (recipeData: any) => {
    // --- TRƯỜNG HỢP 1: Supabase ---
    if (IS_SUPABASE) {
      console.log("🔥 Đang gọi qua Supabase...");
      
      // Supabase tự động convert mảng ingredients/steps thành JSONB
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData]) // Supabase cần bọc object trong mảng []
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    } 
    
    // --- TRƯỜNG HỢP 2: Backend Team ---
    else {
      console.log("🌍 Đang gọi qua Real Backend...");
      
      // Backend thật thường nhận thẳng object
      const response = await api.post('/recipes', recipeData);
      return response.data;
    }
  },

  // (Optional) Hàm lấy danh sách công thức
  getAllRecipes: async () => {
    if (IS_SUPABASE) {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    } else {
      const response = await api.get('/recipes');
      return response.data;
    }
  }
};