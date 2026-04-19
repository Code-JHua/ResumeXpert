import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEmail,
  formatYearMonth,
  dataURLtoFile,
  getLightColorFromImage,
  fixTailwindColors
} from '../../utils/helper';

describe('Helper Functions', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
      expect(validateEmail('test123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('formatYearMonth', () => {
    it('should format YYYY-MM to MMM YYYY', () => {
      expect(formatYearMonth('2025-03')).toBe('Mar 2025');
      expect(formatYearMonth('2024-12')).toBe('Dec 2024');
      expect(formatYearMonth('2023-01')).toBe('Jan 2023');
    });

    it('should return empty string for falsy input', () => {
      expect(formatYearMonth('')).toBe('');
      expect(formatYearMonth(null)).toBe('');
      expect(formatYearMonth(undefined)).toBe('');
    });
  });

  describe('dataURLtoFile', () => {
    it('should convert PNG data URL to File', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const file = dataURLtoFile(dataUrl, 'test.png');

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.png');
      expect(file.type).toBe('image/png');
    });

    it('should convert JPEG data URL to File', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
      const file = dataURLtoFile(dataUrl, 'test.jpg');

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.jpg');
      expect(file.type).toBe('image/jpeg');
    });

    it('should handle data URL without mime type', () => {
      const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ=';
      const file = dataURLtoFile(dataUrl, 'test.txt');

      expect(file).toBeInstanceOf(File);
      expect(file.type).toBe('text/plain');
    });
  });

  describe('getLightColorFromImage', () => {
    it('should resolve to white for invalid URL', async () => {
      const result = await getLightColorFromImage(null);
      expect(result).toBe('#ffffff');
    });

    it('should resolve to white for non-string input', async () => {
      const result = await getLightColorFromImage(123);
      expect(result).toBe('#ffffff');
    });

    it('should resolve to white for empty string', async () => {
      const result = await getLightColorFromImage('');
      expect(result).toBe('#ffffff');
    });
  });

  describe('fixTailwindColors', () => {
    it('should return null for falsy input', () => {
      expect(fixTailwindColors(null)).toBe(null);
      expect(fixTailwindColors(undefined)).toBe(null);
    });

    it('should clone element and preserve structure', () => {
      const div = document.createElement('div');
      div.innerHTML = '<span>Test</span>';
      const cloned = fixTailwindColors(div);

      expect(cloned).not.toBe(div);
      expect(cloned.innerHTML).toBe('<span>Test</span>');
    });

    it('should handle elements without oklch colors', () => {
      const div = document.createElement('div');
      div.style.color = 'rgb(255, 0, 0)';
      const cloned = fixTailwindColors(div);

      expect(cloned.style.color).toBe('rgb(255, 0, 0)');
    });
  });
});

describe('formatYearMonth edge cases', () => {
  it('should handle leap year dates', () => {
    expect(formatYearMonth('2024-02')).toBe('Feb 2024');
    expect(formatYearMonth('2020-02')).toBe('Feb 2020');
  });

  it('should handle all months', () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    months.forEach((month, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      expect(formatYearMonth(`2024-${monthNum}`)).toBe(`${month} 2024`);
    });
  });
});
