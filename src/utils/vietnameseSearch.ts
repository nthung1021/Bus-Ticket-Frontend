/**
 * Utility functions for Vietnamese text search without diacritics
 */

/**
 * Remove Vietnamese diacritics from a string
 * @param str - Input string with Vietnamese diacritics
 * @returns String without diacritics
 */
export function removeDiacritics(str: string): string {
  if (!str) return '';
  
  return str
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Check if a text matches search query without considering diacritics
 * @param text - Text to search in
 * @param query - Search query
 * @returns Boolean indicating if there's a match
 */
export function matchesWithoutDiacritics(text: string, query: string): boolean {
  if (!text || !query) return false;
  
  const normalizedText = removeDiacritics(text);
  const normalizedQuery = removeDiacritics(query);
  
  return normalizedText.includes(normalizedQuery);
}

/**
 * Filter an array of items based on a query that supports Vietnamese text without diacritics
 * @param items - Array of items to filter
 * @param query - Search query
 * @param getSearchFields - Function to get searchable fields from each item
 * @returns Filtered array
 */
export function filterWithVietnameseSearch<T>(
  items: T[],
  query: string,
  getSearchFields: (item: T) => string[]
): T[] {
  if (!query.trim()) return items;
  
  return items.filter(item => {
    const searchFields = getSearchFields(item);
    return searchFields.some(field => matchesWithoutDiacritics(field, query));
  });
}

/**
 * Common Vietnamese city names and their variations for autocomplete
 */
export const vietnameseCities = [
  // Major cities
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Biên Hòa', 'Huế', 'Nha Trang', 'Buôn Ma Thuột', 'Vũng Tàu',
  'Quy Nhon', 'Thủ Dầu Một', 'Nam Định', 'Phan Thiết', 'Long Xuyên',
  'Hạ Long', 'Thái Nguyên', 'Thanh Hóa', 'Rạch Giá', 'Cà Mau',
  'Vinh', 'Mỹ Tho', 'Tây Ninh', 'Sóc Trăng', 'Kon Tum',
  'Hội An', 'Sapa', 'Đà Lạt', 'Phú Quốc', 'Bạc Liêu'
];

/**
 * Get city suggestions based on user input (supports no diacritics)
 * @param query - User input query
 * @param limit - Maximum number of suggestions
 * @returns Array of matching city names
 */
export function getCitySuggestions(query: string, limit: number = 5): string[] {
  if (!query.trim()) return [];
  
  return vietnameseCities
    .filter(city => matchesWithoutDiacritics(city, query))
    .slice(0, limit);
}