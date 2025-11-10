import type { Review, ReviewStats } from '@/types/reviews';

export class ReviewsUtils {
  // Форматирование рейтинга
  static formatRating(rating: number): string {
    return '⭐'.repeat(rating);
  }

  // Получение цвета для рейтинга
  static getRatingColor(rating: number): string {
    if (rating >= 4.5) return '#4caf50'; // зеленый
    if (rating >= 3.5) return '#ff9800'; // оранжевый
    if (rating >= 2.5) return '#ffc107'; // желтый
    return '#f44336'; // красный
  }

  // Подсчет процента от общего количества
  static calculatePercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  // Получение текста для типа отзыва
  static getReviewTypeText(type: string): string {
    switch (type) {
      case 'product': return 'товар';
      case 'confectioner': return 'кондитер';
      case 'shop': return 'магазин';
      case 'brand': return 'бренд';
      default: return 'общий';
    }
  }

  // Получение статуса отзыва
  static getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Ожидает модерации';
      case 'published': return 'Опубликован';
      case 'rejected': return 'Отклонен';
      case 'under_review': return 'На рассмотрении';
      default: return 'Неизвестно';
    }
  }

  // Проверка возможности редактирования отзыва
  static canEditReview(review: Review, userId?: string, userRole?: string): boolean {
    if (!userId) return false;

    // Администраторы могут всё
    if (userRole && ['supervisor', 'admin'].includes(userRole)) {
      return true;
    }

    // Владелец отзыва может редактировать до модерации
    if (review.user_id === userId && ['pending', 'under_review'].includes(review.status)) {
      return true;
    }

    return false;
  }

  // Проверка возможности модерации
  static canModerateReview(userRole?: string): boolean {
    return userRole ? ['supervisor', 'admin'].includes(userRole) : false;
  }

  // Проверка возможности ответа на отзыв
  static canRespondToReview(review: Review, userId?: string, userRole?: string): boolean {
    if (!userId) return false;

    // Администраторы могут отвечать на любые отзывы
    if (userRole && ['supervisor', 'admin'].includes(userRole)) {
      return true;
    }

    // Кондитер может отвечать на отзывы о себе
    if (userRole === 'confectioner' && review.confectioner_id === userId) {
      return true;
    }

    return false;
  }

  // Формирование данных для статистики
  static formatStats(stats: ReviewStats) {
    return {
      totalReviews: stats.total_reviews,
      averageRating: stats.average_rating,
      ratingDistribution: stats.rating_distribution,
      reviewsByType: stats.reviews_by_type,
      verifiedReviews: stats.verified_reviews,
      featuredReviews: stats.featured_reviews,
      pendingModeration: stats.pending_moderation
    };
  }

  // Валидация отзыва
  static validateReview(data: {
    rating: number;
    text: string;
    reviewType: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.push('Рейтинг должен быть от 1 до 5');
    }

    if (!data.text || data.text.trim().length < 10) {
      errors.push('Отзыв должен содержать минимум 10 символов');
    }

    if (data.text && data.text.length > 1000) {
      errors.push('Отзыв не должен превышать 1000 символов');
    }

    if (!['product', 'confectioner', 'shop', 'brand'].includes(data.reviewType)) {
      errors.push('Некорректный тип отзыва');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Поиск ключевых слов
  static extractKeywords(text: string): string[] {
    if (!text) return [];

    // Простое извлечение слов длиннее 3 символов
    const words = text
      .toLowerCase()
      .replace(/[^\w\sа-яё]/gi, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['этот', 'очень', 'более', 'очень', 'очень', 'более'].includes(word));

    // Подсчет частоты слов
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Возвращаем топ-10 самых частых слов
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
}

export default ReviewsUtils;
