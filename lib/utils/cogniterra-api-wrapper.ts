import { getModuleNamesMapByIds as getModuleNames, getLessonNamesMapByIds as getLessonNames } from './cogniterra-api';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  entityType: string,
  context: string = ''
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await operation();
      if (result && typeof result === 'object' && Object.keys(result).length > 0) {
        return result;
      }
      console.warn(`Attempt ${attempt}: No ${entityType} names received ${context ? `for ${context}` : ''}`);
    } catch (error) {
      lastError = error as Error;
      console.error(
        `Attempt ${attempt} failed to fetch ${entityType} names${context ? ` for ${context}` : ''}: `,
        error
      );
      
      if (attempt === MAX_RETRIES) {
        break;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError!;
}

export async function getModuleNamesMapByIdsWithRetry(
  moduleIds: number[],
  context: string = ''
): Promise<Record<number, string>> {
  try {
    return await retryWithBackoff(
      () => getModuleNames(moduleIds),
      'module',
      context
    );
  } catch (error) {
    console.warn(`Using fallback module names after all retries failed${context ? ` for ${context}` : ''}`);
    return moduleIds.reduce((acc, id) => ({ ...acc, [id]: `Module ${id}` }), {});
  }
}

export async function getLessonNamesMapByIdsWithRetry(
  lessonIds: number[],
  context: string = ''
): Promise<Record<number, string>> {
  try {
    return await retryWithBackoff(
      () => getLessonNames(lessonIds),
      'lesson',
      context
    );
  } catch (error) {
    console.warn(`Using fallback lesson names after all retries failed${context ? ` for ${context}` : ''}`);
    return lessonIds.reduce((acc, id) => ({ ...acc, [id]: `Topic ${id}` }), {});
  }
}