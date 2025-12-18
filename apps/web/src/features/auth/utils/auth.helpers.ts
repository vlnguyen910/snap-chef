/**
 * Auth Helper Utilities
 * Handles name splitting, data transformation, and validation for authentication
 */

/**
 * Splits a full name into firstName and lastName following Vietnamese naming conventions
 * 
 * Vietnamese naming convention: [LastName] [MiddleName(s)] [FirstName]
 * Example: "Nguyen Van Nam" -> firstName: "Nam", lastName: "Nguyen Van"
 * 
 * @param fullName - The complete name to split
 * @returns Object containing firstName (last word) and lastName (rest of words)
 * 
 * @example
 * splitFullName("Nguyen Van Nam") // { firstName: "Nam", lastName: "Nguyen Van" }
 * splitFullName("Tran Minh") // { firstName: "Minh", lastName: "Tran" }
 * splitFullName("Nam") // { firstName: "Nam", lastName: "" }
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  // Trim and normalize whitespace (replace multiple spaces with single space)
  const normalized = fullName.trim().replace(/\s+/g, ' ');

  // Handle empty string
  if (!normalized) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  // Split by space
  const parts = normalized.split(' ');

  // Single word name (e.g., "Nam")
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: '',
    };
  }

  // Vietnamese convention: Last word is firstName, rest is lastName
  // Example: "Nguyen Van Nam" -> firstName: "Nam", lastName: "Nguyen Van"
  return {
    firstName: parts[parts.length - 1], // Last word
    lastName: parts.slice(0, -1).join(' '), // All words except last
  };
}

/**
 * Transforms frontend signup form data to backend API format
 * 
 * @param formData - Object containing fullName, email, and password
 * @returns Object formatted for backend API with firstName, lastName, username, email, password
 * 
 * @example
 * transformSignupData({
 *   fullName: "Nguyen Van Nam",
 *   email: "nam.nguyen@example.com",
 *   password: "securepass123"
 * })
 * // Returns:
 * // {
 * //   firstName: "Nam",
 * //   lastName: "Nguyen Van",
 * //   username: "nam.nguyen",
 * //   email: "nam.nguyen@example.com",
 * //   password: "securepass123"
 * // }
 */
export function transformSignupData(formData: {
  fullName: string;
  email: string;
  password: string;
}): {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
} {
  // Split fullName into firstName and lastName
  const { firstName, lastName } = splitFullName(formData.fullName);

  // Extract username from email (part before @)
  const username = formData.email.split('@')[0].trim();

  return {
    firstName,
    lastName,
    username,
    email: formData.email.trim(),
    password: formData.password,
  };
}

/**
 * Validates signup form data before submission
 * 
 * @param formData - Object containing fullName, email, and password
 * @returns Object with validation result and error messages, or null if valid
 * 
 * @example
 * validateSignupData({
 *   fullName: "Nguyen Van Nam",
 *   email: "nam@example.com",
 *   password: "pass123"
 * })
 * // Returns: { valid: true, errors: [] }
 * 
 * validateSignupData({
 *   fullName: "",
 *   email: "invalid-email",
 *   password: "123"
 * })
 * // Returns: {
 * //   valid: false,
 * //   errors: [
 * //     "Full name is required",
 * //     "Please enter a valid email address",
 * //     "Password must be at least 6 characters long"
 * //   ]
 * // }
 */
export function validateSignupData(formData: {
  fullName: string;
  email: string;
  password: string;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate fullName (not empty after trimming)
  if (!formData.fullName.trim()) {
    errors.push('Full name is required');
  }

  // Validate email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    errors.push('Email is required');
  } else if (!emailRegex.test(formData.email.trim())) {
    errors.push('Please enter a valid email address');
  }

  // Validate password length (must be greater than 6 characters)
  if (!formData.password) {
    errors.push('Password is required');
  } else if (formData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
