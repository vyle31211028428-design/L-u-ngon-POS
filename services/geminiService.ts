/**
 * Google Gemini AI Service for Business Insights
 * Uses @google/generative-ai SDK for text generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Order } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Validate API key
if (!API_KEY || API_KEY === 'your-api-key') {
  console.warn(
    '⚠️ Gemini API Key not configured. AI insights will not work.\n' +
    'Please set VITE_GEMINI_API_KEY in .env.local\n' +
    'Get it from: https://makersuite.google.com/app/apikey'
  );
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface SalesData {
  totalRevenue: number;
  orderCount: number;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  paymentMethods: Record<string, number>;
  periodStartDate: string;
  periodEndDate: string;
}

/**
 * Generate daily AI report based on orders
 */
export const generateDailyReport = async (orders: Order[]): Promise<string> => {
  try {
    if (!API_KEY || API_KEY === 'your-api-key') {
      return 'Chưa cấu hình Gemini API Key. Vui lòng kiểm tra .env.local';
    }

    const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount), 0);
    const paidOrders = orders.filter(o => o.isPaid).length;
    const itemsSold = orders.flatMap(o => o.items).map(i => `${i.name} (x${i.quantity})`).join(', ');

    const prompt = `
Bạn là một quản lý nhà hàng lẩu chuyên nghiệp. Dựa vào dữ liệu bán hàng hôm nay dưới đây, hãy viết một báo cáo ngắn gọn (khoảng 3-4 câu) tổng kết tình hình kinh doanh, chỉ ra món bán chạy và đưa ra 1 lời khuyên để cải thiện doanh thu.

Dữ liệu:
- Tổng doanh thu: ${totalRevenue.toLocaleString('vi-VN')} VND
- Số đơn đã thanh toán: ${paidOrders}
- Các món đã bán: ${itemsSold || 'Chưa có'}

Trả lời bằng tiếng Việt, ngắn gọn và thực tế.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || 'Không thể tạo báo cáo lúc này.';
  } catch (error) {
    console.error('Gemini Error:', error);
    return 'Đã xảy ra lỗi khi kết nối với AI.';
  }
};

/**
 * Generate AI insights about sales performance
 */
export const generateSalesInsights = async (
  salesData: SalesData
): Promise<string | null> => {
  try {
    if (!API_KEY || API_KEY === 'your-api-key') {
      console.warn('Gemini API Key not configured');
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Bạn là một chuyên gia phân tích kinh doanh nhà hàng lẩu Việt Nam. 
Dựa trên dữ liệu bán hàng sau, hãy cung cấp:
1. Tóm tắt hiệu suất kinh doanh
2. Những phát hiện chính từ dữ liệu
3. 3 gợi ý cụ thể để tăng doanh thu

Dữ liệu kinh doanh:
- Tổng doanh thu: ${salesData.totalRevenue.toLocaleString('vi-VN')} VND
- Số lượng đơn hàng: ${salesData.orderCount}
- Doanh thu trung bình/đơn: ${(salesData.totalRevenue / (salesData.orderCount || 1)).toLocaleString('vi-VN')} VND
- Thời kỳ: ${salesData.periodStartDate} đến ${salesData.periodEndDate}

Top 5 món bán chạy:
${salesData.topItems.map((item, i) => `${i + 1}. ${item.name}: ${item.quantity} đơn, ${item.revenue.toLocaleString('vi-VN')} VND`).join('\n')}

Phương thức thanh toán:
${Object.entries(salesData.paymentMethods)
  .map(([method, count]) => `- ${method}: ${count} giao dịch`)
  .join('\n')}

Vui lòng trả lời bằng tiếng Việt, ngắn gọn và có tính thực tế.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return null;
  }
};

/**
 * Suggest menu recommendations based on sales
 */
export const suggestMenuRecommendations = async (
  topItems: string[],
  lowestItems: string[]
): Promise<string | null> => {
  try {
    if (!API_KEY || API_KEY === 'your-api-key') {
      console.warn('Gemini API Key not configured');
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Bạn là một chuyên gia tư vấn menu cho nhà hàng lẩu Việt Nam.
Dựa trên dữ liệu sau, hãy đưa ra gợi ý cải thiện menu:

Món bán chạy nhất: ${topItems.join(', ')}
Món bán chậm nhất: ${lowestItems.join(', ')}

Vui lòng cung cấp:
1. Phân tích tại sao các món này bán/không bán
2. 3 gợi ý cụ thể để cải thiện
3. Đề xuất các món mới dựa trên xu hướng

Trả lời bằng tiếng Việt, ngắn gọn và thực tế.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating menu suggestions:', error);
    return null;
  }
};

/**
 * Check if Gemini is properly configured
 */
export const isGeminiConfigured = (): boolean => {
  return !!(API_KEY && API_KEY !== 'your-api-key');
};
